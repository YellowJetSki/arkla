import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, writeBatch, arrayRemove } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Shield, Activity, Heart, Eye, Target, Sparkles, Plus, Minus, PawPrint, Droplets, Flame, UserMinus, Star } from 'lucide-react';
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
    const batch = writeBatch(db);
    batch.update(doc(db, 'characters', charId), { hp: newHp });
    batch.update(doc(db, 'campaign', 'battlemap'), { [`tokens.${charId}.hp`]: newHp });
    await batch.commit().catch(e => console.error("Map sync error:", e));
  };

  const updateXp = async (amount) => {
    if (!char) return;
    const newXp = Math.max(0, (char.exp || 0) + amount);
    await updateDoc(doc(db, 'characters', charId), { exp: newXp });
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
        batch.update(doc(db, 'characters', charId), { hasCompletedTutorial: false });
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

  const acBuffTotal = (char.tempBuffs || [])
    .filter(b => b.target === 'AC')
    .reduce((sum, b) => sum + b.value, 0);
  const displayAc = (char.ac || 10) + acBuffTotal;

  return (
    <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl p-4 shadow-[6px_6px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
      {isEditing && <CharacterCard currentUser={{ charId }} isDM={true} onClose={() => setIsEditing(false)} />}
      
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[50px] rounded-full pointer-events-none opacity-20 bg-${char.theme || 'indigo'}-500`}></div>

      {/* Header */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] leading-none mb-1 uppercase tracking-widest">
            {char.name} 
            {activeConditions.length > 0 && <span className="flex w-2.5 h-2.5 rounded-full bg-red-500 border border-slate-950 animate-pulse shadow-sm" title="Has Conditions"></span>}
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Lv {char.level} {char.class}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {char.inspiration && <Sparkles className="w-5 h-5 text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" title="Has Inspiration" />}
          
          <button onClick={handleKickAndReset} className="text-slate-950 bg-slate-400 hover:bg-red-500 transition-colors p-1.5 rounded-lg border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none" title="Kick & Reset Onboarding">
            <UserMinus className="w-4 h-4 font-black" />
          </button>

          <button onClick={() => setIsEditing(true)} className="text-slate-950 bg-indigo-500 hover:bg-indigo-400 transition-colors p-1.5 rounded-lg border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none" title="Open Character Sheet">
            <Eye className="w-4 h-4 font-black" />
          </button>
        </div>
      </div>

      {/* Vitals Grid - Expanded to 5 columns for XP */}
      <div className="grid grid-cols-5 gap-2 mb-4 relative z-10">
        <div className="col-span-2 bg-slate-950 border-2 border-slate-900 rounded-xl p-2 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
          <div className="absolute bottom-0 left-0 h-1.5 transition-all duration-500 w-full bg-slate-800">
             <div className={`h-full ${hpColor} transition-all duration-500`} style={{ width: `${hpPercentage}%` }}></div>
          </div>
          <div className="flex justify-between items-center w-full mb-1 px-1">
             <button onClick={() => updateHp(-1)} className="text-white hover:text-red-400 bg-slate-800 rounded p-0.5 border border-slate-700 shadow-sm active:translate-y-[1px]"><Minus className="w-3 h-3"/></button>
             <span className="text-[10px] text-red-500 font-black uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">HP</span>
             <button onClick={() => updateHp(1)} className="text-white hover:text-emerald-400 bg-slate-800 rounded p-0.5 border border-slate-700 shadow-sm active:translate-y-[1px]"><Plus className="w-3 h-3"/></button>
          </div>
          <span className="text-xl font-black text-white leading-none">
            {char.hp} <span className="text-[10px] text-slate-500">/ {char.maxHp}</span>
          </span>
        </div>
        
        <div className={`col-span-1 bg-slate-950 border-2 rounded-xl p-1.5 flex flex-col items-center justify-center shadow-inner transition-colors ${acBuffTotal > 0 ? 'border-emerald-500' : acBuffTotal < 0 ? 'border-red-500' : 'border-slate-900'}`}>
          <span className={`text-[9px] font-black uppercase tracking-widest mb-1 flex items-center gap-0.5 ${acBuffTotal > 0 ? 'text-emerald-500' : acBuffTotal < 0 ? 'text-red-500' : 'text-amber-500'}`}><Shield className="w-3 h-3"/> AC</span>
          <span className={`text-base font-black leading-none ${acBuffTotal > 0 ? 'text-emerald-400' : acBuffTotal < 0 ? 'text-red-400' : 'text-white'}`}>{displayAc}</span>
        </div>
        
        <div className="col-span-1 bg-slate-950 border-2 border-slate-900 rounded-xl p-1.5 flex flex-col items-center justify-center shadow-inner">
          <span className="text-[9px] font-black text-sky-500 uppercase tracking-widest mb-1 flex items-center gap-0.5"><Target className="w-3 h-3"/> PP</span>
          <span className="text-base font-black text-white leading-none">{passivePerception}</span>
        </div>

        <div className="col-span-1 bg-slate-950 border-2 border-slate-900 rounded-xl p-1 flex flex-col items-center justify-center shadow-inner">
          <div className="flex justify-between items-center w-full mb-1">
             <button onClick={() => updateXp(-10)} className="text-slate-400 hover:text-indigo-400 bg-slate-800 rounded p-0.5 border border-slate-700 active:translate-y-[1px]"><Minus className="w-2.5 h-2.5"/></button>
             <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none" title="Experience Points">XP</span>
             <button onClick={() => updateXp(10)} className="text-slate-400 hover:text-indigo-400 bg-slate-800 rounded p-0.5 border border-slate-700 active:translate-y-[1px]"><Plus className="w-2.5 h-2.5"/></button>
          </div>
          <span className="text-sm font-black text-white leading-none truncate w-full text-center px-1">{char.exp || 0}</span>
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        {Object.keys(spellSlots).length > 0 && (
          <div className="bg-slate-900 p-3 rounded-xl border-2 border-fuchsia-950 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
             <h4 className="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Flame className="w-3.5 h-3.5"/> Spell Slots</h4>
             <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
               {Object.entries(spellSlots).map(([lvl, data]) => (
                 <div key={lvl} className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Lvl {lvl}</span>
                    <div className="flex gap-1">
                      {Array.from({ length: data.max }).map((_, i) => (
                        <button 
                          key={i} 
                          onClick={() => handleSlotToggle(lvl, i < data.current ? i : i + 1, data.max)} 
                          className={`w-4 h-4 rounded-[3px] border-2 shadow-sm ${i < data.current ? 'bg-fuchsia-500 border-slate-950' : 'bg-slate-950 border-slate-800 cursor-pointer'}`} 
                        />
                      ))}
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}
        {resources.length > 0 && (
          <div className="bg-slate-900 p-3 rounded-xl border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5"/> Trackers</h4>
             <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
               {resources.map((res, idx) => (
                 <div key={idx} className="flex items-center justify-between bg-slate-950 px-2 py-1.5 rounded-lg border-2 border-slate-900 shadow-inner">
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest truncate max-w-[100px]">{res.name}</span>
                    {res.isPool ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleResourceToggle(idx, Math.max(0, res.current - 1))} className="w-5 h-5 rounded bg-slate-800 text-white font-black flex items-center justify-center text-xs shadow-sm border border-slate-700 active:translate-y-[1px]">-</button>
                        <span className="text-[10px] font-black text-indigo-400 w-6 text-center">{res.current}</span>
                        <button onClick={() => handleResourceToggle(idx, Math.min(res.max, res.current + 1))} className="w-5 h-5 rounded bg-slate-800 text-white font-black flex items-center justify-center text-xs shadow-sm border border-slate-700 active:translate-y-[1px]">+</button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        {Array.from({ length: res.max }).map((_, slotIdx) => (
                          <button 
                            key={slotIdx} 
                            onClick={() => handleResourceToggle(idx, slotIdx < res.current ? slotIdx : slotIdx + 1)} 
                            className={`w-4 h-4 rounded-[3px] border-2 shadow-sm ${slotIdx < res.current ? 'bg-indigo-500 border-slate-950' : 'bg-slate-900 border-slate-800'}`} 
                          />
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