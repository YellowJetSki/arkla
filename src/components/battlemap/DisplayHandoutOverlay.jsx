import { X } from 'lucide-react';

export default function DisplayHandoutOverlay({ activeHandout, setActiveHandout }) {
  if (!activeHandout) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-black/95 flex items-center justify-center animate-in fade-in zoom-in-95 duration-700 backdrop-blur-3xl p-8">
      <div className="relative max-w-[95vw] max-h-[95vh] flex flex-col items-center">
        <img 
          src={activeHandout.url} 
          alt={activeHandout.name} 
          className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)] border-2 border-slate-700/50" 
        />
        <h2 className="mt-8 text-center text-4xl md:text-5xl font-black text-white tracking-[0.2em] drop-shadow-[0_5px_5px_rgba(0,0,0,1)] uppercase">
          {activeHandout.name}
        </h2>
        <button 
          onClick={() => setActiveHandout(null)}
          className="absolute -top-6 -right-6 p-4 bg-slate-900 text-slate-400 hover:text-white rounded-full border border-slate-600 shadow-2xl transition-colors opacity-30 hover:opacity-100"
          title="Clear from Display"
        >
          <X className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}