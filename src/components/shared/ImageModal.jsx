import { X, Maximize2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ImageModal({ isOpen, url, alt, onClose }) {
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset loading state when url changes
  useEffect(() => {
    setIsLoaded(false);
  }, [url]);

  if (!isOpen || !url) return null;

  return (
    <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 md:p-8 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-500">
      
      {/* Subtle ambient glow matching the image */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800/40 via-transparent to-transparent pointer-events-none"></div>

      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 md:top-8 md:right-8 p-3 bg-slate-900/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/50 rounded-2xl backdrop-blur-md transition-all z-50 shadow-2xl group"
      >
        <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>

      <div className="relative max-w-5xl w-full max-h-[90dvh] flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
        
        {!isLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 animate-pulse">
            <Maximize2 className="w-12 h-12 mb-4 opacity-50" />
            <span className="text-xs font-black tracking-widest uppercase">Scrying...</span>
          </div>
        )}

        <img 
          src={url} 
          alt={alt} 
          onLoad={() => setIsLoaded(true)}
          className={`w-auto h-auto max-w-full max-h-[85dvh] object-contain rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-slate-700/50 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
          onError={(e) => { e.target.src = 'https://via.placeholder.com/800x600?text=Vision+Obscured'; setIsLoaded(true); }}
        />

        {isLoaded && alt && (
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md border border-slate-700/80 px-6 py-2 rounded-full shadow-xl">
            <span className="text-sm font-black text-slate-300 tracking-widest uppercase">{alt}</span>
          </div>
        )}
      </div>
    </div>
  );
}