"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend,
} from "chart.js";
import { useSearchParams } from "next/navigation";
import { ArrowDown, CheckCircle2, Zap, Microscope, Calculator as CalcIcon } from "lucide-react"; 
import ControlPanel from "@/components/ControlPanel";
import ImagePreview from "@/components/ImagePreview";
import StatCard from "@/components/StatCard";
import PerspectiveCropper from "@/components/PerspectiveCropper";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// ⚠️ CHANGE IP HERE
const API_URL = "http://127.0.0.1:8000/analyze_interactive";

export default function NPKSenseDashboard() {
  const searchParams = useSearchParams();

  // --- STATE ---
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [croppedRawImage, setCroppedRawImage] = useState<string | null>(null);
  const [currentDisplayImage, setCurrentDisplayImage] = useState<string | null>(null);
  
  const [isCropping, setIsCropping] = useState(false); 
  const [lastCropPoints, setLastCropPoints] = useState<{x:number, y:number}[] | null>(null);

  const [threshold, setThreshold] = useState(35);
  const [totalWeight, setTotalWeight] = useState(100);
  const [targets, setTargets] = useState({ N: 15, P: 15, K: 15, Filler: 55 });
  const [massScores, setMassScores] = useState({ N: 0, P: 0, K: 0, Filler: 0 });
  const [histData, setHistData] = useState<number[]>(Array(256).fill(0));
  const [autoThreshold, setAutoThreshold] = useState(35);
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const nParam = searchParams.get('n');
    const pParam = searchParams.get('p');
    const kParam = searchParams.get('k');
    const wParam = searchParams.get('weight');

    if (nParam && pParam && kParam) {
      const n = parseFloat(nParam);
      const p = parseFloat(pParam);
      const k = parseFloat(kParam);
      const w = parseFloat(wParam || '100');
      const filler = Math.max(0, 100 - (n + p + k));
      setTargets({ N: n, P: p, K: k, Filler: filler });
      setTotalWeight(w);
      setTimeout(scrollToAnalyzer, 500);
    }
  }, [searchParams]);

  // --- HANDLERS ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (ev) => { 
        if (ev.target?.result) {
          const imgUrl = ev.target.result as string;
          setOriginalImage(imgUrl);
          setIsCropping(true); 
          setProcessedImage(null);
          setCroppedRawImage(null);
          setCurrentDisplayImage(null);
          setLastCropPoints(null);
        }
      };
      reader.readAsDataURL(selectedFile);
      e.target.value = "";
    }
  };

  const handleCropConfirm = (points: {x:number, y:number}[]) => {
      setIsCropping(false);
      setLastCropPoints(points);
      if (file) {
          analyzeImage(file, threshold, true, points);
          scrollToAnalyzer();
      }
  };

  const analyzeImage = async (selectedFile: File, threshVal: number, isFirstLoad = false, points: {x:number, y:number}[] | null = null) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("threshold", threshVal.toString());

    const pointsToSend = points || lastCropPoints;
    if (pointsToSend) {
        formData.append("points", JSON.stringify(pointsToSend));
    }

    try {
      const res = await fetch(API_URL, { method: "POST", body: formData });
      if (!res.ok) throw new Error("API Error");
      const data = await res.json();

      const procImg = `data:image/jpeg;base64,${data.image_b64}`;
      const rawCrop = `data:image/jpeg;base64,${data.raw_cropped_b64}`;

      setProcessedImage(procImg);
      setCroppedRawImage(rawCrop);
      setCurrentDisplayImage(procImg);
      setMassScores(data.areas);

      if (isFirstLoad && data.histogram) {
        setHistData(data.histogram);
        setAutoThreshold(data.auto_threshold);
        setThreshold(data.auto_threshold);
      }
    } catch (err) {
      console.error(err);
      alert("Backend connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (val: number) => {
    setThreshold(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => { 
        if (file) analyzeImage(file, val, false, lastCropPoints); 
    }, 300);
  };

  const scrollToAnalyzer = () => {
    const section = document.getElementById('analyzer-section');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  };

  const totalScore = Object.values(massScores).reduce((a, b) => a + b, 0);
  const factor = totalScore > 0 ? (totalWeight / totalScore) : 0;
  const finalWeights = {
    N: massScores.N * factor,
    P: massScores.P * factor,
    K: massScores.K * factor,
    Filler: massScores.Filler * factor
  };

  const histChartData = {
    labels: Array.from({ length: 256 }, (_, i) => i),
    datasets: [{
      label: 'Count', data: histData,
      backgroundColor: (ctx: any) => ctx.dataIndex <= threshold ? '#94a3b8' : '#facc15',
      barPercentage: 1.0, categoryPercentage: 1.0,
    }]
  };
  const pieChartData = {
    labels: ['N', 'Filler', 'P', 'K'],
    datasets: [{
      data: [finalWeights.N, finalWeights.Filler, finalWeights.P, finalWeights.K],
      backgroundColor: ['#94a3b8', '#facc15', '#10b981', '#ef4444'], borderWidth: 0,
    }]
  };

  return (
    <div className="bg-slate-50 font-sans selection:bg-blue-100">
      
      {isCropping && originalImage && (
        <PerspectiveCropper 
            imageSrc={originalImage} 
            onConfirm={handleCropConfirm} 
            onCancel={() => { setIsCropping(false); setFile(null); }} 
        />
      )}
      
      {/* 🔵 HERO SECTION */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 overflow-hidden">
        
        {/* --- ✨ BACKGROUND LAYER (Aurora) --- */}
        <div className="absolute inset-0 w-full h-full">
            {/* White Base */}
            <div className="absolute inset-0 bg-white"></div>

            {/* Blob 1: Blue/Cyan (Top Right) */}
            <div className="absolute -top-[10%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-b from-cyan-200 via-blue-300 to-transparent opacity-60 blur-[80px]"></div>
            
            {/* Blob 2: Purple/Indigo (Top Left) */}
            <div className="absolute top-[0%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-r from-indigo-200 via-purple-200 to-transparent opacity-50 blur-[100px]"></div>
            
            {/* Blob 3: Soft Blue (Bottom) */}
            <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-blue-100 opacity-60 blur-[120px]"></div>
            
            {/* Glass Overlay */}
            <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]"></div>
        </div>

        {/* --- 📝 CONTENT LAYER --- */}
        <div className="relative z-10 text-center max-w-4xl mx-auto space-y-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 backdrop-blur-md border border-blue-100 shadow-sm text-sm font-semibold text-blue-700 mb-4">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            AI-Powered Fertilizer Analysis 2.0
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-tight drop-shadow-sm">
            Precision Farming <br/>
            Starts with <span className="text-blue-600">Perfect NPK.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Stop guessing. Use computer vision and physics engine to analyze fertilizer composition instantly. 
            Calibrate your mix with scientific accuracy.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button 
              onClick={scrollToAnalyzer}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"
            >
              <Microscope size={24} /> Start Analyzing
            </button>
            <a 
              href="/calculator"
              className="px-8 py-4 bg-white/80 hover:bg-white text-slate-700 border border-slate-200 font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 text-lg shadow-sm backdrop-blur-sm"
            >
              <CalcIcon size={24} className="text-slate-500" /> Calculator
            </a>
          </div>

          <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <FeatureCard icon={<Zap className="text-blue-600" />} title="Instant AI Analysis" desc="Deep learning model detects N, P, K particles in milliseconds." />
            <FeatureCard icon={<CheckCircle2 className="text-emerald-600" />} title="Physics Engine" desc="Calculates weight based on volume & density, not just area." />
            <FeatureCard icon={<CalcIcon className="text-indigo-600" />} title="Reverse Recipe" desc="Input your target formula, we calculate the exact mixing ratio." />
          </div>

          {/* ✅ How it works Section */}
          <div className="pt-16 border-t border-slate-200/50 mt-16 w-full">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">How to take a perfect photo</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <GuideStep step="1" title="Solid Background" desc="Use plain paper (A4). Avoid patterns." />
               <GuideStep step="2" title="Spread Evenly" desc="Don't pile up. Single layer only." />
               <GuideStep step="3" title="Good Lighting" desc="Bright light, no harsh shadows." />
               <GuideStep step="4" title="Top-Down View" desc="Hold camera parallel to the surface." />
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-10 animate-bounce cursor-pointer text-slate-400 hover:text-blue-600 transition-colors z-20" onClick={scrollToAnalyzer}>
          <ArrowDown size={32} />
        </div>
      </section>

      {/* 🛠️ ANALYZER SECTION */}
      <div id="analyzer-section" className="min-h-screen py-20 bg-white border-t border-slate-100 relative z-20 shadow-2xl shadow-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
           <div className="mb-12 text-center">
              <h2 className="text-3xl font-black text-slate-900">Analysis Dashboard</h2>
              <p className="text-slate-500">Upload an image or check your current mix</p>
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
              <ControlPanel 
                file={file} threshold={threshold} totalWeight={totalWeight} targets={targets}
                histChartData={histChartData} pieChartData={pieChartData}
                onFileUpload={handleFileUpload}
                onSliderChange={handleSliderChange}
                onAutoClick={() => { setThreshold(autoThreshold); if (file) analyzeImage(file, autoThreshold, false); }}
                onWeightChange={setTotalWeight}
                onTargetChange={(key, val) => setTargets({...targets, [key]: val})}
              />
            </div>
            <div className="lg:col-span-8 space-y-6 flex flex-col h-full">
              <ImagePreview 
                loading={loading}
                processedImage={processedImage}
                currentDisplayImage={currentDisplayImage}
                onToggleStart={() => { 
                    if(croppedRawImage) setCurrentDisplayImage(croppedRawImage);
                    else if(originalImage) setCurrentDisplayImage(originalImage); 
                }}
                onToggleEnd={() => { if(processedImage) setCurrentDisplayImage(processedImage); }}
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="N (Urea)" subLabel="46-0-0" value={finalWeights.N} total={totalWeight} target={targets.N} color="text-slate-600" barColor="bg-slate-400" />
                <StatCard label="P (DAP)" subLabel="18-46-0" value={finalWeights.P} total={totalWeight} target={targets.P} color="text-emerald-600" barColor="bg-emerald-500" />
                <StatCard label="K (Potash)" subLabel="0-0-60" value={finalWeights.K} total={totalWeight} target={targets.K} color="text-rose-600" barColor="bg-rose-500" />
                <StatCard label="Filler" subLabel="Inert" value={finalWeights.Filler} total={totalWeight} target={targets.Filler} color="text-amber-600" barColor="bg-amber-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 👇 SUB-COMPONENTS
function FeatureCard({ icon, title, desc }: any) {
  return (
    <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-blue-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
      <div className="mb-3 bg-blue-50 w-10 h-10 rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <h3 className="font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
    </div>
  )
}

function GuideStep({ step, title, desc }: any) {
  return (
    <div className="text-left space-y-2 group bg-white/40 p-3 rounded-lg hover:bg-white/60 transition-colors">
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
          {step}
        </span>
        <h4 className="font-bold text-slate-700 text-sm">{title}</h4>
      </div>
      <p className="text-xs text-slate-500 pl-8 leading-relaxed">{desc}</p>
    </div>
  )
}