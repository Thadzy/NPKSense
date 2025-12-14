"use client";
import React, { useState, useRef } from "react";
import { Check, X } from "lucide-react";

interface Point { x: number; y: number }

interface PerspectiveCropperProps {
  imageSrc: string;
  onConfirm: (points: Point[]) => void;
  onCancel: () => void;
}

export default function PerspectiveCropper({ imageSrc, onConfirm, onCancel }: PerspectiveCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState<Point[]>([
    { x: 0.2, y: 0.2 }, // Top-Left
    { x: 0.8, y: 0.2 }, // Top-Right
    { x: 0.8, y: 0.8 }, // Bottom-Right
    { x: 0.2, y: 0.8 }, // Bottom-Left
  ]);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  const handlePointerDown = (index: number, e: React.PointerEvent) => {
    e.preventDefault();
    setDraggingIdx(index);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingIdx === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1);
    setPoints(prev => {
      const newPoints = [...prev];
      newPoints[draggingIdx] = { x, y };
      return newPoints;
    });
  };

  const handlePointerUp = () => setDraggingIdx(null);

  // ✅ สร้าง string สำหรับ SVG Polygon
  const polygonPoints = points.map(p => `${p.x * 100},${p.y * 100}`).join(" ");

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
      <div className="mb-4 text-white text-center">
        <h2 className="text-2xl font-bold mb-1">Adjust Crop Area</h2>
        <p className="text-slate-400 text-sm">Drag corners to match the container edges</p>
      </div>

      <div 
        ref={containerRef}
        className="relative max-w-4xl max-h-[70vh] w-full aspect-auto select-none touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* รูปภาพ */}
        <img src={imageSrc} alt="Crop" className="w-full h-full object-contain pointer-events-none rounded-lg" />

        {/* ✅ SVG Overlay สำหรับเส้นเชื่อมจุด */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon points={polygonPoints} fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>

        {/* จุดลาก 4 จุด */}
        {points.map((p, i) => (
            <div
                key={i}
                onPointerDown={(e) => handlePointerDown(i, e)}
                className="absolute w-6 h-6 -ml-3 -mt-3 bg-white rounded-full shadow-lg border-2 border-green-500 cursor-move flex items-center justify-center hover:scale-125 transition-transform z-10"
                style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
            >
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            </div>
        ))}
      </div>

      <div className="mt-8 flex gap-4">
        <button onClick={onCancel} className="px-6 py-3 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-600 flex items-center gap-2">
            <X size={20} /> Cancel
        </button>
        <button onClick={() => onConfirm(points)} className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-500 shadow-lg shadow-green-500/30 flex items-center gap-2">
            <Check size={20} /> Confirm & Analyze
        </button>
      </div>
    </div>
  );
}