"use client";
import React from "react";
import { Upload, Eye, Loader2 } from "lucide-react";

interface ImagePreviewProps {
  loading: boolean;
  processedImage: string | null;
  currentDisplayImage: string | null;
  onToggleStart: () => void;
  onToggleEnd: () => void;
}

export default function ImagePreview({ 
  loading, 
  processedImage, 
  currentDisplayImage, 
  onToggleStart, 
  onToggleEnd 
}: ImagePreviewProps) {
  return (
    <div className="relative flex-1 bg-slate-900 rounded-3xl overflow-hidden shadow-2xl shadow-slate-300 min-h-[500px] group border-4 border-white">
      
      {loading && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-30 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
          <span className="font-bold text-lg text-slate-700 tracking-tight">Processing Physics Model...</span>
          <span className="text-sm text-slate-400 mt-1">Applying shape correction & density</span>
        </div>
      )}

      {processedImage && (
        <button
          onMouseDown={onToggleStart}
          onMouseUp={onToggleEnd}
          onMouseLeave={onToggleEnd}
          onTouchStart={onToggleStart}
          onTouchEnd={onToggleEnd}
          className="absolute top-6 right-6 z-20 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white pl-3 pr-4 py-2 rounded-full text-xs font-bold border border-white/10 transition-all flex items-center gap-2 select-none active:scale-95 shadow-lg"
        >
          <Eye size={14} className="text-blue-400" /> Hold to compare
        </button>
      )}

      <div className="w-full h-full flex items-center justify-center p-4">
        {currentDisplayImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={currentDisplayImage} 
            alt="Analysis" 
            className="max-w-full max-h-[700px] object-contain shadow-2xl rounded-lg"
          />
        ) : (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
               <Upload size={32} className="text-slate-500" />
            </div>
            <h3 className="text-slate-400 font-medium text-lg">Upload an image to start analysis</h3>
            <p className="text-slate-600 text-sm max-w-xs mx-auto">Supports JPEG, PNG. Optimized for high-resolution fertilizer images.</p>
          </div>
        )}
      </div>
    </div>
  );
}