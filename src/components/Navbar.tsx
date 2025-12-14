"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calculator, ScanLine, Sprout } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path 
    ? "bg-blue-100 text-blue-700 font-bold" 
    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-medium";

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Sprout className="text-white" size={24} />
            </div>
            <span className="text-xl font-black text-slate-800 tracking-tight">
              <span className="text-blue-600">NPK</span> Sense
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/" className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive('/')}`}>
              <ScanLine size={18} />
              <span>Analyzer</span>
            </Link>
            
            <Link href="/calculator" className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive('/calculator')}`}>
              <Calculator size={18} />
              <span>Calculator</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}