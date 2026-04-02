import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, writeBatch, arrayRemove } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Shield, Heart, Eye, Target, Sparkles, Plus, Minus, Droplets, Flame, UserMinus } from 'lucide-react';
import CharacterCard from './CharacterCard';

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
    
    // INSTANT DUAL-SYNC
    const batch = writeBatch(db);
    batch.update(doc(db, 'characters', charId), { hp: newHp });
    batch.update(doc(db, 'campaign', 'battlemap'), { [`tokens.${charId}.hp`]: newHp });
    
    await batch.commit().catch(e => console.error("Map sync error:", e));
  };

  const handleResourceToggle = async (resourceIndex, newCurrentValue) => {
    if (!char || !char.resources) return;
    const updatedResources = [...char.resources];
    updatedResources[resourceIndex].current = newCurrentValue;
    await updateDoc(doc(db, 'characters', charId), { resources: updatedResources });
  };

  const handleSlotToggle = async (level, currentIndex, max) => {
    if (!char || !char.spellSlots) return;
    const currentAmount = char.spellSlots[level]?.current || 0;
    const newAmount = currentIndex < currentAmount ? currentAmount - 1 : currentAmount + 1;
    const updatedSlots = { ...char.spellSlots, [level]: { ...char.spellSlots[level], current: newAmount, max: max } };
    await updateDoc(doc(db, 'characters', charId), { spellSlots: updatedSlots });
  };

  const handleKickAndReset = async () => {
    if (window.confirm(`Boot ${char.name} from the active session and force them to re-do the onboarding tutorial next time they join?`)) {
      try {
        const batch = writeBatch(db);
        // 1. Reset tutorial flag
        batch.update(doc(db, 'characters', charId), { hasCompletedTutorial: false });
        // 2. Remove them from the active session to trigger the kick screen
        batch.update(doc(db, 'campaign', 'main_session'), {
          unlockedCharacters: arrayRemove(charId)
        });
        await batch.commit();
      } catch (e) {
        console.error("Error kicking player: ", e);
      }
    }
  };

  if (!char) return null;

  const hpPercentage = (char.hp / char.maxHp) * 100;
  let hpColor = 'bg-emerald-500';
  if (hpPercentage < 50) hpColor = 'bg-amber-500';
  if (hpPercentage < 20) hpColor = 'bg-red-500';

  const activeConditions = char.conditions || [];
  const resources = char.resources || [];
  const spellSlots = char.spellSlots || {};
  
  const wisMod = Math.floor(((char.stats?.WIS || 10) - 10) / 2);
  const passivePerception = 10 + wisMod;

  // Automatically track Temporary Buffs for DM view
  const acBuffTotal = (char.tempBuffs || [])
    .filter(b => b.target === 'AC')
    .reduce((sum, b) => sum + b.value, 0);
  const displayAc = (char.ac || 10) + acBuffTotal;

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-3 shadow-md relative overflow-hidden group">
      {/* We now open the full CharacterCard in DM Mode instead of the old DMEditSheet */}
      {isEditing && <CharacterCard currentUser={{ charId }} isDM={true} onClose={() => setIsEditing(false)} />}
      
      <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] rounded-full pointer-events-none opacity-20 bg-${char.theme || 'indigo'}-500`}></div>

      {/* Header */}
      <div className="flex justify-between items-start mb-3 relative z-10">
        <div>
          <h3 className="text-base font-black text-white flex items-center gap-2 drop-shadow-sm leading-tight">
            {char.name} 
            {activeConditions.length > 0 && <span className="flex w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Has Conditions"></span>}
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Lv {char.level} {char.class}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {char.inspiration && <Sparkles className="w-4 h-4 text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" title="Has Inspiration" />}
          
          {/* Kick & Reset Button */}
          <button onClick={handleKickAndReset} className="text-slate-500 hover:text-red-400 transition-colors bg-slate-950 p-1.5 rounded-lg border border-slate-800 shadow-inner" title="Kick & Reset Onboarding">
            <UserMinus className="w-3.5 h-3.5" />
          </button>

          {/* View/Edit Full Sheet Button */}
          <button onClick={() => setIsEditing(true)} className="text-slate-500 hover:text-white transition-colors bg-slate-950 p-1.5 rounded-lg border border-slate-800 shadow-inner" title="Open Character Sheet">
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Vitals Grid */}
      <div className="grid grid-cols-4 gap-2 mb-3 relative z-10">
        <div className="col-span-2 bg-slate-950 border border-slate-800 rounded-lg p-2 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
          <div className="absolute bottom-0 left-0 h-1 transition-all duration-500 w-full bg-slate-800">
             <div className={`h-full ${hpColor} transition-all duration-500`} style={{ width: `${hpPercentage}%` }}></div>
          </div>
          <div className="flex justify-between items-center w-full mb-0.5">
             <button onClick={() => updateHp(-1)} className="text-slate-500 hover:text-red-400 p-0.5"><Minus className="w-3 h-3"/></button>
             <span className="text-[9px] text-red-400 font-black uppercase tracking-widest">HP</span>
             <button onClick={() => updateHp(1)} className="text-slate-500 hover:text-emerald-400 p-0.5"><Plus className="w-3 h-3"/></button>
          </div>
          <span className="text-base font-black text-white leading-none">
            {char.hp} <span className="text-[10px] text-slate-500">/ {char.maxHp}</span>
          </span>
        </div>
        <div className={`bg-slate-950 border rounded-lg p-2 flex flex-col items-center justify-center shadow-inner transition-colors ${acBuffTotal > 0 ? 'border-emerald-500/50' : acBuffTotal < 0 ? 'border-red-500/50' : 'border-slate-800'}`}>
          <span className={`text-[9px] font-black uppercase tracking-widest mb-1 flex items-center gap-1 ${acBuffTotal > 0 ? 'text-emerald-400' : acBuffTotal < 0 ? 'text-red-400' : 'text-amber-400'}`}><Shield className="w-2.5 h-2.5"/> AC</span>
          <span className={`text-sm font-black leading-none ${acBuffTotal > 0 ? 'text-emerald-400' : acBuffTotal < 0 ? 'text-red-400' : 'text-white'}`}>{displayAc}</span>
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 flex flex-col items-center justify-center shadow-inner">
          <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Target className="w-2.5 h-2.5"/> PP</span>
          <span className="text-sm font-black text-white leading-none">{passivePerception}</span>
        </div>
      </div>

      <div className="space-y-2 relative z-10">
        {Object.keys(spellSlots).length > 0 && (
          <div className="bg-slate-800/50 p-2.5 rounded-lg border border-fuchsia-900/30 shadow-inner">
             <h4 className="text-[9px] font-black text-fuchsia-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Flame className="w-3 h-3"/> Spell Slots</h4>
             <div className="space-y-1.5 max-h-24 overflow-y-auto custom-scrollbar pr-1">
               {Object.entries(spellSlots).map(([lvl, data]) => (
                 <div key={lvl} className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold">Lvl {lvl}</span>
                    <div className="flex gap-1">
                      {Array.from({ length: data.max }).map((_, i) => (
                        <button key={i} onClick={() => handleSlotToggle(lvl, i < data.current ? i : i + 1, data.max)} className={`w-3.5 h-3.5 rounded-[2px] border ${i < data.current ? 'bg-fuchsia-500 border-fuchsia-400' : 'bg-slate-800 border-slate-600 cursor-pointer'}`} />
                      ))}
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}
        {resources.length > 0 && (
          <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50 shadow-inner">
             <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Droplets className="w-3 h-3"/> Trackers</h4>
             <div className="space-y-1.5 max-h-24 overflow-y-auto custom-scrollbar pr-1">
               {resources.map((res, idx) => (
                 <div key={idx} className="flex items-center justify-between bg-slate-950 px-2 py-1 rounded border border-slate-800">
                    <span className="text-[10px] font-bold text-white truncate max-w-[80px]">{res.name}</span>
                    {res.isPool ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleResourceToggle(idx, Math.max(0, res.current - 1))} className="w-4 h-4 rounded bg-slate-800 text-slate-400 flex items-center justify-center text-xs">-</button>
                        <span className="text-[10px] font-black text-indigo-400 w-6 text-center">{res.current}</span>
                        <button onClick={() => handleResourceToggle(idx, Math.min(res.max, res.current + 1))} className="w-4 h-4 rounded bg-slate-800 text-slate-400 flex items-center justify-center text-xs">+</button>
                      </div>
                    ) : (
                      <div className="flex gap-0.5">
                        {Array.from({ length: res.max }).map((_, slotIdx) => (
                          <button key={slotIdx} onClick={() => handleResourceToggle(idx, slotIdx < res.current ? slotIdx : slotIdx + 1)} className={`w-3.5 h-3.5 rounded-[2px] border ${slotIdx < res.current ? 'bg-indigo-500 border-indigo-400' : 'bg-slate-800 border-slate-600'}`} />
                        ))}
                      </div>
                    )}
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}