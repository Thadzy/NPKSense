"use client";
import React from "react";

interface StatCardProps {
  label: string;
  subLabel: string;
  value: number; // น้ำหนักจริง (g)
  total: number; // น้ำหนักรวม (g)
  target: number; // เป้าหมาย (%)
  color: string;
  barColor: string;
}

export default function StatCard({ label, subLabel, value, total, target, color, barColor }: StatCardProps) {
  // คำนวณ % (นี่คือค่าที่เราจะเอามาโชว์เป็นตัวหลัก)
  const percent = total > 0 ? (value / total * 100) : 0;
  
  // คำนวณ Error เทียบกับ Target
  const error = percent - target;
  const isGood = Math.abs(error) <= 2.0;

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className={`absolute top-0 left-0 w-1 h-full ${barColor}`}></div>
      
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className={`text-xs font-black uppercase tracking-wider ${color}`}>{label}</h4>
          <span className="text-[10px] text-slate-400 font-semibold">{subLabel}</span>
        </div>
        {/* ป้าย Error Tag */}
        <div className={`text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 ${isGood ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {error > 0 ? '+' : ''}{error.toFixed(1)}%
        </div>
      </div>

      {/* ✅ MAIN VALUE: เปลี่ยนจาก value(g) เป็น percent(%) */}
      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-4xl font-black text-slate-800">{percent.toFixed(1)}</span>
        <span className="text-lg font-bold text-slate-400">%</span>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-bold">
          {/* ✅ SUB DETAILS: ย้ายน้ำหนัก (g) มาโชว์ตรงนี้แทน */}
          <span className="text-slate-500">Weight: {value.toFixed(1)}g</span>
          <span className="text-slate-400">Target: {target}%</span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${barColor} transition-all duration-500 ease-out`} 
            style={{ width: `${Math.min(percent, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}