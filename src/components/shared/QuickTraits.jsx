import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import ScrollableRow from './ScrollableRow';

export default function QuickTraits({ features = [] }) {
  const [activeFeature, setActiveFeature] = useState(null);

  if (!features || features.length === 0) return null;

  return (
    <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-4 mt-4 shadow-inner">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-indigo-400" />
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Traits & Senses</h4>
      </div>
      
      {/* Wrapped the trait buttons in the new ScrollableRow */}
      <ScrollableRow className="gap-2 pb-2">
        {features.map((feat, idx) => (
          <button
            key={idx}
            onClick={() => setActiveFeature(activeFeature === idx ? null : idx)}
            className={`shrink-0 snap-start px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              activeFeature === idx 
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_10px_rgba(79,70,229,0.5)]' 
                : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {feat.name}
          </button>
        ))}
      </ScrollableRow>

      {activeFeature !== null && (
        <div className="mt-2 bg-indigo-950/40 border border-indigo-500/30 p-3 rounded-lg text-sm text-indigo-100 leading-relaxed animate-in fade-in slide-in-from-top-2 flex justify-between items-start gap-3">
          <p className="whitespace-pre-wrap">{features[activeFeature].desc}</p>
          <button 
            onClick={() => setActiveFeature(null)} 
            className="shrink-0 text-indigo-400 hover:text-white bg-indigo-900/50 p-1.5 rounded-md transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}