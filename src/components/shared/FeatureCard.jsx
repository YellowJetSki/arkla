import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

export default function FeatureCard({ feat, isDM, onRemove }) {
  const [isOpen, setIsOpen] = useState(false);
  const fullText = feat.desc || '';
  
  if (!fullText && !feat.name) return null;

  // Heuristic for short description: first sentence, first newline, or first 150 characters.
  let cutoff = fullText.length;
  const firstNewlineIdx = fullText.indexOf('\n');
  
  const periodRegex = /\.\s/;
  const periodMatch = periodRegex.exec(fullText);
  const firstPeriodIdx = periodMatch ? periodMatch.index + 1 : -1;
  
  if (firstPeriodIdx !== -1 && firstNewlineIdx !== -1) {
     cutoff = Math.min(firstPeriodIdx, firstNewlineIdx);
  } else if (firstPeriodIdx !== -1) {
     cutoff = firstPeriodIdx;
  } else if (firstNewlineIdx !== -1) {
     cutoff = firstNewlineIdx;
  } else if (fullText.length > 150) {
     cutoff = 150;
  }
  
  const hasMore = fullText.length > cutoff && (fullText.length - cutoff > 10);
  const shortDesc = hasMore ? fullText.substring(0, cutoff) + (cutoff === firstPeriodIdx ? '' : '...') : fullText;
  const remainingDesc = hasMore ? fullText.substring(cutoff).trim() : '';

  return (
     <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 shadow-sm hover:border-indigo-500/30 transition-colors group relative overflow-hidden">
        <div className="flex justify-between items-start mb-2 relative z-10">
           <h4 className="font-black text-white text-base pr-8">{feat.name}</h4>
           {isDM && onRemove && (
             <button 
               onClick={() => onRemove(feat)} 
               className="absolute top-0 right-0 text-slate-500 hover:text-red-400 p-1 bg-slate-950 rounded opacity-0 group-hover:opacity-100 transition-opacity"
               title="Delete Feature"
             >
                <Trash2 className="w-4 h-4" />
             </button>
           )}
        </div>
        
        <div className="relative z-10">
           {!isOpen ? (
             <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{shortDesc}</p>
           ) : (
             <div className="animate-in fade-in duration-300">
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{shortDesc}</p>
                <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap mt-2 pt-2 border-t border-slate-700/50">
                  {remainingDesc}
                </p>
             </div>
           )}
           
           {hasMore && (
             <button 
               onClick={() => setIsOpen(!isOpen)} 
               className="text-indigo-400 text-xs font-bold mt-3 flex items-center gap-1.5 hover:text-indigo-300 transition-colors bg-indigo-950/30 px-3 py-1.5 rounded-lg border border-indigo-900/50"
             >
                {isOpen ? <><ChevronUp className="w-3 h-3"/> View Less</> : <><ChevronDown className="w-3 h-3"/> Read Full Details</>}
             </button>
           )}
        </div>
     </div>
  );
}