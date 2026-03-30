import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Shield, Activity, Heart, Eye, Target, Sparkles, Plus, Minus, Wind, PawPrint, Droplets, Droplet } from 'lucide-react';
import DMEditSheet from './DMEditSheet';
import { CONDITIONS_LIST } from '../data/campaignData';

export default function DMPlayerCard({ charId }) {
  const [char, setChar] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'characters', charId), (docSnap) => {
      if (docSnap.exists()) setChar(docSnap.data());
    });
    return () => unsubscribe();
  }, [charId]);

  const updateHp = async (amount) => {
    if (!char) return;
    const newHp = Math.max(0, Math.min(char.maxHp, char.hp + amount));
    
    const batch = writeBatch(db);
    batch.update(doc(db, 'characters', charId), { hp: newHp });
    
    // Sync with battlemap token if it exists
    const mapRef = doc(db, 'campaign', 'battlemap');
    const mapSnap = await getDoc(mapRef);
    if (mapSnap.exists() && mapSnap.data().tokens && mapSnap.data().tokens[charId]) {
       batch.update(mapRef, { [`tokens.${charId}.hp`]: newHp });
    }
    await batch.commit();
  };

  const handleResourceToggle = async (resourceIndex, newCurrentValue) => {
    if (!char || !char.resources) return;
    const updatedResources = [...char.resources];
    updatedResources[resourceIndex] = {
      ...updatedResources[resourceIndex],
      current: newCurrentValue
    };
    await updateDoc(doc(db, 'characters', charId), { resources: updatedResources });
  };

  if (!char) return null;

  const hpPercentage = (char.hp / char.maxHp) * 100;
  let hpColor = 'bg-emerald-500';
  if (hpPercentage < 50) hpColor = 'bg-amber-500';
  if (hpPercentage < 20) hpColor = 'bg-red-500';

  const activeConditions = char.conditions || [];
  const resources = char.resources || [];
  const companion = char.companion || null;
  const isCompanionActive = companion && (!companion.isDormant || char.level >= companion.awakeLevel);

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
      
      {isEditing && <DMEditSheet char={char} charId={charId} onCancel={() => setIsEditing(false)} />}
      
      {/* Background Aura */}
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[50px] rounded-full pointer-events-none opacity-20 bg-${char.theme || 'indigo'}-500`}></div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-2 drop-shadow-sm">
            {char.name} 
            {activeConditions.length > 0 && <span className="flex w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" title="Has Conditions"></span>}
          </h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Level {char.level} {char.species} {char.class}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {char.inspiration && <Sparkles className="w-5 h-5 text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" title="Has Inspiration" />}
          <button onClick={() => setIsEditing(true)} className="text-slate-500 hover:text-white transition-colors bg-slate-950 p-1.5 rounded-lg border border-slate-800 shadow-inner">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Vitals */}
      <div className="grid grid-cols-4 gap-3 mb-5 relative z-10">
        <div className="col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
          <div className="absolute bottom-0 left-0 h-1 transition-all duration-500 w-full bg-slate-800">
             <div className={`h-full ${hpColor} transition-all duration-500`} style={{ width: `${hpPercentage}%` }}></div>
          </div>
          <div className="flex justify-between items-center w-full mb-1">
             <button onClick={() => updateHp(-1)} className="text-slate-500 hover:text-red-400 p-1"><Minus className="w-3 h-3"/></button>
             <div className="flex items-center gap-1.5 text-red-400">
               <Heart className="w-3 h-3" />
               <span className="text-[10px] font-black uppercase tracking-widest">HP</span>
             </div>
             <button onClick={() => updateHp(1)} className="text-slate-500 hover:text-emerald-400 p-1"><Plus className="w-3 h-3"/></button>
          </div>
          <span className="text-xl font-black text-white">
            {char.hp} <span className="text-sm text-slate-500">/ {char.maxHp}</span>
          </span>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center shadow-inner">
          <Shield className="w-3 h-3 text-amber-400 mb-1" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AC</span>
          <span className="text-lg font-black text-white">{char.ac}</span>
        </div>
        
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center shadow-inner">
          <Activity className="w-3 h-3 text-emerald-400 mb-1" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Init</span>
          <span className="text-lg font-black text-white">{char.initiative}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        
        {/* Trackers */}
        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 shadow-inner">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Droplets className="w-3 h-3"/> Trackers</h4>
           {resources.length === 0 ? (
             <p className="text-[10px] text-slate-500 italic">No trackers equipped.</p>
           ) : (
             <div className="space-y-2 max-h-24 overflow-y-auto custom-scrollbar pr-1">
               {resources.map((res, idx) => (
                 <div key={idx} className="flex items-center justify-between bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-xs font-bold text-white truncate max-w-[80px]">{res.name}</span>
                    {res.isPool ? (
                      <span className="text-xs font-black text-indigo-400">{res.current}/{res.max}</span>
                    ) : (
                      <div className="flex gap-0.5">
                        {Array.from({ length: res.max }).map((_, slotIdx) => (
                          <button 
                            key={slotIdx}
                            onClick={() => handleResourceToggle(idx, slotIdx < res.current ? slotIdx : slotIdx + 1)}
                            className={`w-3 h-3 rounded-[2px] border ${slotIdx < res.current ? 'bg-indigo-500 border-indigo-400' : 'bg-slate-800 border-slate-600'}`}
                          />
                        ))}
                      </div>
                    )}
                 </div>
               ))}
             </div>
           )}
        </div>

        {/* Companion */}
        {companion && (
          <div className={`bg-slate-800/50 p-3 rounded-xl border ${isCompanionActive ? 'border-emerald-900/50' : 'border-slate-700/50 opacity-50'} shadow-inner`}>
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between gap-1.5">
               <span className="flex items-center gap-1.5"><PawPrint className={`w-3 h-3 ${isCompanionActive ? 'text-emerald-400' : 'text-slate-500'}`}/> {companion.name}</span>
               {!isCompanionActive && <span className="text-[8px] bg-slate-900 px-1 py-0.5 rounded text-slate-500">DORMANT</span>}
             </h4>
             <div className="flex justify-between items-center bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                <div className="flex flex-col items-center">
                   <span className="text-[9px] text-slate-500 font-bold uppercase mb-0.5">HP</span>
                   <span className="text-sm font-black text-white">{companion.hp}</span>
                </div>
                <div className="flex flex-col items-center">
                   <span className="text-[9px] text-slate-500 font-bold uppercase mb-0.5">AC</span>
                   <span className="text-sm font-black text-white">{companion.ac}</span>
                </div>
                <div className="flex flex-col items-center">
                   <span className="text-[9px] text-slate-500 font-bold uppercase mb-0.5">Spd</span>
                   <span className="text-sm font-black text-white">{companion.speed}</span>
                </div>
             </div>
          </div>
        )}

      </div>

      {activeConditions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5 relative z-10">
          {activeConditions.map(cond => (
            <span key={cond} className="text-[10px] font-bold uppercase tracking-wider bg-red-950/40 text-red-400 border border-red-900/50 px-2 py-1 rounded shadow-sm">
              {cond}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}