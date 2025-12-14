"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Beaker, AlertTriangle, CheckCircle2, FlaskConical, Scale } from "lucide-react";
import Link from "next/link";

// Constants
const MATERIALS = {
  UREA: { name: 'Urea', sub: '46-0-0', n: 46, p: 0, k: 0, color: 'bg-slate-500', text: 'text-slate-600' },
  DAP:  { name: 'DAP',  sub: '18-46-0', n: 18, p: 46, k: 0, color: 'bg-emerald-500', text: 'text-emerald-600' },
  MOP:  { name: 'MOP',  sub: '0-0-60',  n: 0, p: 0, k: 60, color: 'bg-rose-500', text: 'text-rose-600' },
  FILLER: { name: 'Filler', sub: 'Inert', n: 0, p: 0, k: 0, color: 'bg-amber-400', text: 'text-amber-600' }
};

// =========================================
// 🧩 ส่วนไส้ใน (Logic การคำนวณ)
// =========================================
function CalculatorContent() {
  const searchParams = useSearchParams();

  // State
  const [target, setTarget] = useState({ n: 15, p: 15, k: 15 });
  const [totalWeight, setTotalWeight] = useState(100);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Effect: อ่านค่าจาก URL (ถ้ามี) ตอนโหลดหน้าเว็บครั้งแรก
  useEffect(() => {
    const nParam = searchParams.get('n');
    const pParam = searchParams.get('p');
    const kParam = searchParams.get('k');
    const wParam = searchParams.get('weight');

    if (nParam || pParam || kParam) {
      setTarget({
        n: parseFloat(nParam || '0'),
        p: parseFloat(pParam || '0'),
        k: parseFloat(kParam || '0')
      });
    }
    if (wParam) {
      setTotalWeight(parseFloat(wParam));
    }
  }, [searchParams]);

  // Logic การคำนวณสูตรปุ๋ย
  const calculateRecipe = () => {
    setError(null);
    const { n, p, k } = target;

    // 1. หา % DAP จาก P
    const pct_dap = p > 0 ? (p / MATERIALS.DAP.p) * 100 : 0;
    
    // 2. N Credit จาก DAP
    const n_from_dap = (pct_dap * MATERIALS.DAP.n) / 100;
    
    // 3. หา % Urea จาก N ที่เหลือ
    const required_n = n - n_from_dap;
    
    if (required_n < -0.01) {
      setResult(null);
      setError(`Impossible: DAP provides too much N (${n_from_dap.toFixed(1)}%) for this target.`);
      return;
    }
    
    const pct_urea = required_n > 0 ? (required_n / MATERIALS.UREA.n) * 100 : 0;

    // 4. หา % MOP จาก K
    const pct_mop = k > 0 ? (k / MATERIALS.MOP.k) * 100 : 0;

    // 5. หา % Filler
    const current_pct = pct_dap + pct_urea + pct_mop;
    const pct_filler = 100 - current_pct;

    if (pct_filler < -0.1) {
      setResult(null);
      setError(`Over concentration! Total raw materials exceed 100% (${current_pct.toFixed(1)}%).`);
      return;
    }

    // --- แปลง % เป็นน้ำหนักจริงตาม Total Weight ---
    const factor = totalWeight / 100;

    setResult({
      urea: pct_urea * factor,
      dap: pct_dap * factor,
      mop: pct_mop * factor,
      filler: Math.max(0, pct_filler) * factor,
      total: totalWeight
    });
  };

  // Auto calculate when inputs change
  useEffect(() => {
    calculateRecipe();
  }, [target, totalWeight]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-4 text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors">
            ← Back to Analyzer
          </Link>
          <h1 className="text-4xl font-black text-slate-800 mb-2">Fertilizer <span className="text-blue-600">Calculator</span></h1>
          <p className="text-slate-500">Reverse engineering recipe from N-P-K target</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* INPUT PANEL */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-10 opacity-50"></div>
              
              {/* --- 1. Total Weight Input --- */}
              <div className="mb-8">
                 <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Scale size={20} className="text-slate-500" /> Total Weight
                </h2>
                <div className="flex items-center px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                  <input 
                    type="number" 
                    value={totalWeight}
                    onChange={(e) => setTotalWeight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent font-black text-xl text-slate-800 outline-none"
                  />
                  <span className="text-xs font-bold text-slate-400 uppercase">KG</span>
                </div>
              </div>

              {/* --- 2. Formula Input --- */}
              <h2 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
                <FlaskConical size={20} className="text-blue-500" /> Target Formula
              </h2>

              <div className="space-y-4">
                {[
                  { label: 'Nitrogen (N)', key: 'n', color: 'text-slate-600', bg: 'bg-slate-50' },
                  { label: 'Phosphorus (P)', key: 'p', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Potassium (K)', key: 'k', color: 'text-rose-600', bg: 'bg-rose-50' }
                ].map((item) => (
                  <div key={item.key}>
                    <label className={`text-xs font-bold uppercase ${item.color} mb-1 block`}>{item.label}</label>
                    <div className={`flex items-center px-4 py-3 rounded-xl border border-slate-200 ${item.bg} focus-within:ring-2 focus-within:ring-blue-500 transition-all`}>
                      <input 
                        type="number" 
                        value={target[item.key as keyof typeof target]}
                        onChange={(e) => setTarget({...target, [item.key]: parseFloat(e.target.value) || 0})}
                        className="w-full bg-transparent font-black text-xl text-slate-800 outline-none"
                      />
                      <span className="text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RESULT PANEL */}
          <div className="md:col-span-7">
            {error ? (
              <div className="h-full flex items-center justify-center p-8 bg-rose-50 rounded-3xl border border-rose-100 text-center">
                <div>
                  <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={32} />
                  </div>
                  <h3 className="text-rose-700 font-bold text-lg mb-2">Calculation Error</h3>
                  <p className="text-rose-600/80 text-sm">{error}</p>
                </div>
              </div>
            ) : result ? (
              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-white h-full flex flex-col">
                <h2 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
                  <Beaker size={20} className="text-purple-500" /> 
                  Mixing Recipe <span className="text-slate-400 text-sm font-normal ml-auto">(Total: {result.total}kg)</span>
                </h2>

                <div className="space-y-4 flex-1">
                  <RecipeRow label={MATERIALS.UREA.name} sub={MATERIALS.UREA.sub} value={result.urea} total={totalWeight} color="bg-slate-500" />
                  <RecipeRow label={MATERIALS.DAP.name} sub={MATERIALS.DAP.sub} value={result.dap} total={totalWeight} color="bg-emerald-500" />
                  <RecipeRow label={MATERIALS.MOP.name} sub={MATERIALS.MOP.sub} value={result.mop} total={totalWeight} color="bg-rose-500" />
                  <RecipeRow label={MATERIALS.FILLER.name} sub={MATERIALS.FILLER.sub} value={result.filler} total={totalWeight} color="bg-amber-400" />
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                  <Link href={`/?n=${target.n}&p=${target.p}&k=${target.k}&weight=${totalWeight}`} className="group flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                        <CheckCircle2 size={20} />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white/60 uppercase">Ready to check?</div>
                        <div className="font-bold">Go to Analyzer with these values</div>
                      </div>
                    </div>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ) : null}
          </div>

        </div>
      </div>
    </div>
  );
}

function RecipeRow({ label, sub, value, total, color }: any) {
  const percentBar = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="flex items-center gap-4 group">
      <div className={`w-2 h-12 rounded-full ${color} opacity-20 group-hover:opacity-100 transition-all`}></div>
      <div className="flex-1">
        <div className="flex justify-between items-baseline mb-1">
          <span className="font-bold text-slate-700">{label} <span className="text-xs text-slate-400 font-normal ml-1">{sub}</span></span>
          <span className="font-black text-xl text-slate-800">{value.toFixed(2)} <span className="text-xs font-bold text-slate-400">kg</span></span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${Math.min(percentBar, 100)}%` }}></div>
        </div>
      </div>
    </div>
  );
}

// =========================================
// 🚀 EXPORT (ตัวห่อหลัก) เพื่อแก้ Vercel Error
// =========================================
export default function CalculatorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-500 font-medium">Loading Calculator...</p>
      </div>
    }>
      <CalculatorContent />
    </Suspense>
  );
}