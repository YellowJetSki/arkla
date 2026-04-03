import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import ScrollableRow from './ScrollableRow';

export default function QuickTraits({ features = [] }) {
  const [activeFeature, setActiveFeature] = useState(null);

  if (!features || features.length === 0) return null;

  return (
    <div className="bg-slate-800 border-[3px] border-slate-950 rounded-2xl p-4 md:p-5 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center gap-2 mb-4 border-b-2 border-slate-900 pb-2">
        <Sparkles className="w-5 h-5 text-indigo-400 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" />
        <h4 className="text-sm font-black text-white uppercase tracking-widest drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">Quick Traits</h4>
      </div>
      
      <ScrollableRow className="gap-3 pb-2">
        {features.map((feat, idx) => (
          <button
            key={idx}
            onClick={() => setActiveFeature(activeFeature === idx ? null : idx)}
            className={`shrink-0 snap-start px-4 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all border-2 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] outline-none ${
              activeFeature === idx 
                ? 'bg-indigo-600 border-slate-950 text-white' 
                : 'bg-slate-900 border-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            {feat.name}
          </button>
        ))}
      </ScrollableRow>

      {activeFeature !== null && (
        <div className="mt-4 bg-slate-900 border-2 border-indigo-900 p-4 rounded-xl text-sm text-indigo-100 font-medium leading-relaxed animate-in fade-in slide-in-from-top-2 flex justify-between items-start gap-4 shadow-inner">
          <p className="whitespace-pre-wrap">{features[activeFeature].desc}</p>
          <button 
            onClick={() => setActiveFeature(null)} 
            className="shrink-0 text-slate-950 bg-indigo-500 hover:bg-indigo-400 border-2 border-slate-950 p-2 rounded-lg transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}