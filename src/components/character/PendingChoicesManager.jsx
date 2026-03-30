import { useState } from 'react';
import { doc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { applySanctuaryFilter } from '../../services/arklaEngine';
import { CheckCircle2, ListPlus } from 'lucide-react';

export default function PendingChoicesManager({ charId, pendingChoices }) {
  const [selections, setSelections] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!pendingChoices || pendingChoices.length === 0) return null;

  const handleConfirm = async (choiceObj) => {
    const selectedUrl = selections[choiceObj.id];
    if (!selectedUrl) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`https://www.dnd5eapi.co${selectedUrl}`);
      const detail = await res.json();
      
      const newFeature = {
         name: applySanctuaryFilter(detail.name),
         desc: applySanctuaryFilter(Array.isArray(detail.desc) ? detail.desc.join('\n') : detail.desc)
      };

      const charRef = doc(db, 'characters', charId);
      await updateDoc(charRef, {
        features: arrayUnion(newFeature),
        pendingChoices: arrayRemove(choiceObj)
      });
      
    } catch (e) {
      console.error("Failed to commit feature choice:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-amber-500/50 rounded-xl p-4 shadow-sm mb-6 animate-in fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] rounded-full pointer-events-none"></div>
      
      <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-amber-900/50 pb-2">
         <ListPlus className="w-4 h-4" /> Action Required: Class Choices
      </h4>
      
      <div className="space-y-4 relative z-10">
         {pendingChoices.map((choice) => (
            <div key={choice.id} className="bg-slate-950 p-4 rounded-lg border border-slate-800 shadow-inner flex flex-col sm:flex-row gap-4 sm:items-end">
               <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-300 mb-2">{choice.name} (Choose {choice.choose})</label>
                  <select 
                     className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                     value={selections[choice.id] || ''}
                     onChange={(e) => setSelections({...selections, [choice.id]: e.target.value})}
                  >
                     <option value="" disabled>-- Select Option --</option>
                     {choice.options.map(opt => (
                        <option key={opt.url} value={opt.url}>{opt.name}</option>
                     ))}
                  </select>
               </div>
               <button 
                  disabled={!selections[choice.id] || isSubmitting}
                  onClick={() => handleConfirm(choice)}
                  className="shrink-0 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 h-[38px] shadow-[0_0_15px_rgba(245,158,11,0.2)]"
               >
                  <CheckCircle2 className="w-4 h-4" /> Confirm
               </button>
            </div>
         ))}
      </div>
    </div>
  );
}