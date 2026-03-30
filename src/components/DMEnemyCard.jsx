import { useState } from 'react';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Heart, Shield, Wind, Swords, Trash2, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { CONDITIONS_LIST } from '../data/campaignData';

export default function DMEnemyCard({ enemy, isSelected, onToggleSelect }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateHp = async (amount) => {
    const newHp = Math.max(0, Math.min(enemy.hp, enemy.currentHp + amount));
    await updateDoc(doc(db, 'active_enemies', enemy.id), { currentHp: newHp });
    
    const mapRef = doc(db, 'campaign', 'battlemap');
    const mapSnap = await getDoc(mapRef);
    if (mapSnap.exists() && mapSnap.data().tokens && mapSnap.data().tokens[enemy.id]) {
       await updateDoc(mapRef, { [`tokens.${enemy.id}.hp`]: newHp });
    }
  };

  const killEnemy = async () => {
    await deleteDoc(doc(db, 'active_enemies', enemy.id));
    const mapRef = doc(db, 'campaign', 'battlemap');
    const mapSnap = await getDoc(mapRef);
    if (mapSnap.exists() && mapSnap.data().tokens && mapSnap.data().tokens[enemy.id]) {
       const tokens = mapSnap.data().tokens;
       delete tokens[enemy.id];
       await updateDoc(mapRef, { tokens });
    }
  };

  const handleAddCondition = async (cond) => {
    if (!cond) return;
    const conditions = enemy.conditions || [];
    if (!conditions.includes(cond)) {
      await updateDoc(doc(db, 'active_enemies', enemy.id), { conditions: [...conditions, cond] });
    }
  };

  const handleRemoveCondition = async (cond) => {
    const conditions = enemy.conditions || [];
    await updateDoc(doc(db, 'active_enemies', enemy.id), { conditions: conditions.filter(c => c !== cond) });
  };

  const hpPercentage = (enemy.currentHp / enemy.hp) * 100;
  let hpColor = 'bg-emerald-500';
  if (hpPercentage < 50) hpColor = 'bg-amber-500';
  if (hpPercentage <= 0) hpColor = 'bg-slate-600';

  return (
    <div className={`bg-slate-900 border ${isSelected ? 'border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.3)]' : 'border-slate-700'} rounded-xl overflow-hidden transition-colors`}>
      
      {/* Header Select Row */}
      <div className={`p-3 flex justify-between items-center cursor-pointer transition-colors ${isSelected ? 'bg-red-950/20' : 'bg-slate-800/50 hover:bg-slate-800'}`} onClick={onToggleSelect}>
         <div className="flex items-center gap-3">
           <input type="checkbox" checked={isSelected} readOnly className="w-4 h-4 rounded border-slate-600 text-red-500 bg-slate-900 pointer-events-none" />
           <div>
             <h4 className="font-black text-white text-sm leading-tight">{enemy.name}</h4>
             <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">{enemy.flavor}</span>
           </div>
         </div>
         <button onClick={(e) => { e.stopPropagation(); killEnemy(); }} className="text-slate-500 hover:text-red-500 bg-slate-900 p-1.5 rounded transition-colors border border-slate-800"><Trash2 className="w-3.5 h-3.5"/></button>
      </div>

      {/* Vitals Controls */}
      <div className="p-3 bg-slate-900/50">
        <div className="flex gap-2">
          {/* HP Control spans majority */}
          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 flex flex-col items-center shadow-inner relative overflow-hidden">
            <div className="absolute bottom-0 left-0 h-1 transition-all duration-500 w-full bg-slate-800">
               <div className={`h-full ${hpColor} transition-all duration-500`} style={{ width: `${hpPercentage}%` }}></div>
            </div>
            
            <div className="flex items-center justify-between w-full mb-1">
              <div className="flex gap-1">
                <button onClick={() => updateHp(-10)} className="text-[10px] font-black text-slate-500 hover:text-red-400 bg-slate-900 px-1 rounded">-10</button>
                <button onClick={() => updateHp(-1)} className="text-[10px] font-black text-slate-500 hover:text-red-400 bg-slate-900 px-1.5 rounded"><Minus className="w-3 h-3"/></button>
              </div>
              <span className="text-[9px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1"><Heart className="w-2.5 h-2.5"/> HP</span>
              <div className="flex gap-1">
                <button onClick={() => updateHp(1)} className="text-[10px] font-black text-slate-500 hover:text-emerald-400 bg-slate-900 px-1.5 rounded"><Plus className="w-3 h-3"/></button>
                <button onClick={() => updateHp(10)} className="text-[10px] font-black text-slate-500 hover:text-emerald-400 bg-slate-900 px-1 rounded">+10</button>
              </div>
            </div>
            
            <span className="text-base font-black text-white leading-none">
              {enemy.currentHp} <span className="text-[10px] text-slate-500">/ {enemy.hp}</span>
            </span>
          </div>

          {/* AC & Speed Blocks */}
          <div className="flex flex-col gap-2 shrink-0">
            <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 flex items-center justify-between gap-3 shadow-inner h-full">
              <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1"><Shield className="w-2.5 h-2.5"/> AC</span>
              <span className="text-sm font-black text-white">{enemy.ac}</span>
            </div>
            <button onClick={() => setIsExpanded(!isExpanded)} className="bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded-lg px-2 py-1 h-full flex items-center justify-center gap-1 transition-colors">
              {isExpanded ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>} Details
            </button>
          </div>
        </div>

        {/* Conditions */}
        <div className="mt-3 flex items-center gap-2">
           <select onChange={(e) => handleAddCondition(e.target.value)} value="" className="bg-slate-950 border border-slate-700 rounded text-[10px] text-slate-400 px-2 py-1 focus:outline-none w-24 shrink-0">
             <option value="" disabled>+ Cond</option>
             {CONDITIONS_LIST.filter(c => !(enemy.conditions || []).includes(c)).map(c => <option key={c} value={c}>{c}</option>)}
           </select>
           <div className="flex flex-wrap gap-1 flex-1">
             {(enemy.conditions || []).map(cond => (
               <button key={cond} onClick={() => handleRemoveCondition(cond)} className="text-[9px] font-bold uppercase tracking-wider bg-red-950/40 text-red-400 border border-red-900/50 hover:bg-red-900/60 px-1.5 py-0.5 rounded transition-colors line-through decoration-transparent hover:decoration-red-400">
                 {cond}
               </button>
             ))}
           </div>
        </div>
      </div>

      {/* Expanded Stat Block */}
      {isExpanded && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/50 space-y-4 animate-in slide-in-from-top-2 fade-in">
           
           <div className="grid grid-cols-6 gap-1">
             {Object.entries(enemy.stats).map(([stat, val]) => (
               <div key={stat} className="bg-slate-900 border border-slate-800 rounded p-1 flex flex-col items-center">
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{stat}</span>
                 <span className="text-xs font-black text-white">{val}</span>
               </div>
             ))}
           </div>

           <div className="space-y-1.5 text-xs text-slate-300">
             {enemy.speed && <p><strong className="text-sky-400">Speed</strong> {enemy.speed}</p>}
             {enemy.saves && <p><strong className="text-slate-400">Saves</strong> {enemy.saves}</p>}
             {enemy.skills && <p><strong className="text-slate-400">Skills</strong> {enemy.skills}</p>}
             {enemy.resistances && <p><strong className="text-slate-400">Resistances</strong> {enemy.resistances}</p>}
             {enemy.immunities && <p><strong className="text-slate-400">Immunities</strong> {enemy.immunities}</p>}
             {enemy.senses && <p><strong className="text-slate-400">Senses</strong> {enemy.senses}</p>}
           </div>

           <div className="space-y-3 pt-3 border-t border-slate-800">
             {enemy.features && enemy.features.length > 0 && (
               <div>
                 <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Traits</h5>
                 {enemy.features.map((feat, i) => (
                   <p key={i} className="text-xs text-slate-300 mb-1 leading-relaxed"><strong className="text-white">{feat.name}.</strong> {feat.desc}</p>
                 ))}
               </div>
             )}
             
             {enemy.actions && enemy.actions.length > 0 && (
               <div>
                 <h5 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Swords className="w-3 h-3"/> Actions</h5>
                 {enemy.actions.map((act, i) => (
                   <p key={i} className="text-xs text-slate-300 mb-1.5 leading-relaxed"><strong className="text-white">{act.name}.</strong> {act.desc}</p>
                 ))}
               </div>
             )}

             {enemy.parsedActions && enemy.parsedActions.length > 0 && (
               <div>
                 <h5 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Swords className="w-3 h-3"/> Actions</h5>
                 {enemy.parsedActions.map((act, i) => (
                   <p key={i} className="text-xs text-slate-300 mb-1.5 leading-relaxed whitespace-pre-wrap"><strong className="text-white block mb-0.5">{act.name}.</strong>{act.desc}</p>
                 ))}
               </div>
             )}
           </div>

        </div>
      )}
    </div>
  );
}