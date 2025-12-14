from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from ultralytics import YOLO
import cv2
import numpy as np
import base64
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIG ---
MODEL_PATH = "npksense.pt" 
try:
    model = YOLO(MODEL_PATH)
except Exception as e:
    print(f"Error loading model: {e}")

CLASS_ID_MAP = {0: 'K', 1: 'N', 2: 'P'}

MATERIAL_PROPS = {
    'N': { 'density': 1.33, 'shape_factor': 1.0 },
    'P': { 'density': 1.61, 'shape_factor': 0.70 },
    'K': { 'density': 1.98, 'shape_factor': 0.60 },
    'Filler': { 'density': 2.40, 'shape_factor': 0.80 }
}

def bgr_to_base64(img):
    _, buffer = cv2.imencode('.jpg', img, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
    return base64.b64encode(buffer).decode('utf-8')

# ✅ ฟังก์ชันดัดภาพ (Perspective Transform)
def four_point_transform(image, pts):
    rect = np.array(pts, dtype="float32")
    (tl, tr, br, bl) = rect

    # คำนวณความกว้างสูงสุด
    widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
    widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
    maxWidth = max(int(widthA), int(widthB))

    # คำนวณความสูงสูงสุด
    heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
    heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
    maxHeight = max(int(heightA), int(heightB))

    # จุดเป้าหมาย (Top-down view)
    dst = np.array([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]], dtype="float32")

    # Warp!
    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))
    return warped

@app.post("/analyze_interactive")
async def analyze_interactive(
    file: UploadFile = File(...), 
    threshold: int = Form(35),
    points: str = Form(None) # ✅ รับค่า points เป็น JSON String
):
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # ✅ ถ้ามีการส่ง points มา ให้ทำการ Warp ก่อน
        if points:
            try:
                # points คาดว่าเป็น JSON array ของ %: [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
                pts_norm = json.loads(points)
                h, w = img.shape[:2]
                # แปลง % เป็น Pixel จริง
                pts_pixel = [[p['x'] * w, p['y'] * h] for p in pts_norm]
                
                img = four_point_transform(img, pts_pixel)
            except Exception as e:
                print(f"Warp Error: {e}")
                # ถ้า Warp ไม่ได้ ก็ใช้ภาพเดิมไป

        # Run YOLO
        results = model.predict(img, verbose=False, max_det=3000, conf=0.15, iou=0.6, imgsz=1024)
        
        hsv_img = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        mass_scores = {'N': 0.0, 'P': 0.0, 'K': 0.0, 'Filler': 0.0}
        
        dark_bg = cv2.addWeighted(img, 0.4, np.zeros_like(img), 0.6, 0)
        thick_lines = np.zeros_like(img)
        thin_lines = np.zeros_like(img)
        saturation_samples = []

        if results[0].masks is not None:
            masks_xy = results[0].masks.xy
            classes_ids = results[0].boxes.cls.cpu().numpy()
            
            for i, polygon in enumerate(masks_xy):
                if len(polygon) < 3: continue
                cls_id = int(classes_ids[i])
                base_name = CLASS_ID_MAP.get(cls_id, 'Unknown')
                cnt = np.array(polygon, dtype=np.int32)
                area_2d = cv2.contourArea(cnt)
                
                final_name = base_name
                color = (255, 255, 255)

                if cls_id == 1:
                    mask = np.zeros(img.shape[:2], dtype=np.uint8)
                    cv2.drawContours(mask, [cnt], -1, 255, -1)
                    kernel = np.ones((3,3), np.uint8)
                    mask_inner = cv2.erode(mask, kernel, iterations=1)
                    if cv2.countNonZero(mask_inner) == 0: mask_inner = mask
                    mean_val = cv2.mean(hsv_img, mask=mask_inner)
                    sat_val = int(mean_val[1])
                    saturation_samples.append(sat_val)
                    if sat_val > threshold:
                        final_name = 'Filler'; color = (0, 255, 255) 
                    else:
                        final_name = 'N'; color = (200, 200, 200)
                elif cls_id == 0: color = (50, 50, 255)
                elif cls_id == 2: color = (50, 255, 50)

                props = MATERIAL_PROPS.get(final_name, {'density':1, 'shape_factor':1})
                estimated_vol = pow(area_2d, 1.5)
                relative_mass = estimated_vol * props['shape_factor'] * props['density']
                mass_scores[final_name] += relative_mass

                cv2.drawContours(thick_lines, [cnt], -1, color, 3)
                contrast_color = (0,0,0) if final_name == 'N' else (255,255,255)
                cv2.drawContours(thin_lines, [cnt], -1, contrast_color, 1)

        final_vis = cv2.add(dark_bg, thick_lines)
        mask_thin = cv2.cvtColor(thin_lines, cv2.COLOR_BGR2GRAY) > 0
        final_vis[mask_thin] = thin_lines[mask_thin]

        hist_data = [0]*256
        auto_thresh = 35
        if saturation_samples:
            for s in saturation_samples: hist_data[s]+=1
            samples_np = np.array(saturation_samples, dtype=np.uint8)
            ret, _ = cv2.threshold(samples_np, 0, 255, cv2.THRESH_BINARY+cv2.THRESH_OTSU)
            auto_thresh = int(ret)

        return JSONResponse({
            "image_b64": bgr_to_base64(final_vis),
            "areas": mass_scores, 
            "histogram": hist_data,
            "auto_threshold": auto_thresh
        })

    except Exception as e:
        print(f"Error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)