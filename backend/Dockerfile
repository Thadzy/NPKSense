# ใช้ Python เวอร์ชัน 3.9
FROM python:3.9

# ตั้งโฟลเดอร์ทำงาน
WORKDIR /code

# ก๊อปปี้ไฟล์ requirements.txt ไปก่อน
COPY ./requirements.txt /code/requirements.txt

# ลง Library ต่างๆ (รวมถึง gdown)
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# สร้างโฟลเดอร์สำหรับเก็บ cache ของ matplotlib (แก้ปัญหา error บางอย่าง)
RUN mkdir -p /code/.config/matplotlib && chmod -R 777 /code/.config

# ก๊อปปี้สคริปต์โหลดโมเดลและรันทันที (เพื่อให้มีไฟล์ .pt ก่อนเริ่ม server)
COPY ./download_model.py /code/download_model.py
RUN python /code/download_model.py

# ก๊อปปี้โค้ดที่เหลือทั้งหมด
COPY . /code

# เปิด Port 7860 (Hugging Face บังคับใช้ Port นี้)
EXPOSE 7860

# คำสั่งรัน Server (สังเกต port 7860)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]