import { useState } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ArrowUpCircle, X, Heart, Shield, Sparkles, BookOpen, ChevronRight, ChevronLeft, CheckCircle2, Trash2, Milestone } from 'lucide-react';
import SpellDiscovery from './SpellDiscovery';
import FeatDiscovery from './FeatDiscovery';

export default function LevelUpModal({ char, charId, onClose }) {
  const hitDieVal = parseInt(char.hitDice?.type?.replace('d', '') || '8');
  const conMod = Math.floor(((char.stats?.CON || 10) - 10) / 2);
  const avgHpGain = Math.floor(hitDieVal / 2) + 1 + conMod;

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [hpIncrease, setHpIncrease] = useState(avgHpGain);
  const [classPath, setClassPath] = useState(char.class || '');

  const newLevel = char.level + 1;
  
  // ASI OR FEAT LOGIC
  const isASILevel = [4, 8, 12, 16, 19].includes(newLevel);
  const [asiChoice, setAsiChoice] = useState('ASI'); // 'ASI' or 'FeAT'
  
  const [statPoints, setStatPoints] = useState(2);
  const [pendingStats, setPendingStats] = useState({ ...(char.stats || { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }) });

  const [newSpells, setNewSpells] = useState([]);
  const [newFeats, setNewFeats] = useState([]);

  const handleStatChange = (stat, amount) => {
    const current = pendingStats[stat];
    const original = char.stats?.[stat] || 10;
    if (amount < 0 && current <= original) return; 
    if (amount > 0 && statPoints <= 0) return; 
    if (amount > 0 && current >= 20) return; 
    setPendingStats(prev => ({ ...prev, [stat]: current + amount }));
    setStatPoints(prev => prev - amount);
  };

  const handleAscend = async () => {
    setIsSubmitting(true);
    const safeHpIncrease = parseInt(hpIncrease, 10);
    const finalHpGain = isNaN(safeHpIncrease) ? 0 : safeHpIncrease;
    
    const newMaxHp = (char.maxHp || 10) + finalHpGain;
    const updates = {
      level: newLevel,
      class: classPath.trim(),
      maxHp: newMaxHp,
      hp: newMaxHp, 
      'hitDice.max': (char.hitDice?.max || char.level) + 1,
      'hitDice.current': (char.hitDice?.current || char.level) + 1
    };

    if (asiChoice === 'ASI') {
      const statsChanged = Object.keys(pendingStats).some(k => pendingStats[k] !== char.stats?.[k]);
      if (statsChanged) updates.stats = pendingStats;
    }
    
    if (newSpells.length > 0) updates.spells = arrayUnion(...newSpells);
    if (newFeats.length > 0) updates.features = arrayUnion(...newFeats);

    try {
      await updateDoc(doc(db, 'characters', charId), updates);
      onClose();
    } catch (error) {
      console.error("Level up failed:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl h-[100dvh] overflow-hidden">
      <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(99,102,241,0.3)] flex flex-col max-h-[95dvh] relative overflow-hidden">
        
        <div className="p-4 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 flex justify-between items-center shrink-0 relative z-10">
          <h2 className="text-xl font-black text-indigo-400 flex items-center gap-2 uppercase tracking-wider"><ArrowUpCircle className="w-6 h-6" /> Ascension</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-1 px-6 pt-6 shrink-0 relative z-10">
          {[1, 2, 3, 4].map(i => <div key={i} className={`h-1.5 rounded-full flex-1 ${step >= i ? 'bg-indigo-500' : 'bg-slate-800'}`} />)}
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative z-10">
          
          {/* STEP 1: PATH & VITALITY */}
          {step === 1 && (
            <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
              <div className="text-center">
                <div className="text-5xl font-black text-white mb-2 flex items-center justify-center gap-4 drop-shadow-[0_0_20px_rgba(99,102,241,0.8)]">
                  <span className="text-slate-500">{char.level}</span> <ArrowUpCircle className="w-8 h-8 text-indigo-400 animate-pulse" /> <span className="text-indigo-400">{newLevel}</span>
                </div>
              </div>
              <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 text-left">
                <h3 className="flex items-center gap-2 text-lg font-black text-white mb-2"><Milestone className="w-5 h-5 text-indigo-400" /> Class Progression</h3>
                <input type="text" value={classPath} onChange={(e) => setClassPath(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white font-bold" />
              </div>
              <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 text-left">
                <h3 className="flex items-center gap-2 text-lg font-black text-white mb-2"><Heart className="w-5 h-5 text-red-400" /> Vitality Increase</h3>
                <input type="number" value={hpIncrease} onChange={(e) => setHpIncrease(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-4 text-white font-black text-3xl text-center mb-3" />
              </div>
            </div>
          )}

          {/* STEP 2: ABILITY SCORES vs FEATS */}
          {step === 2 && (
            <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
              
              {isASILevel && (
                <div className="bg-amber-900/30 border border-amber-500/50 p-4 rounded-xl text-center mb-6">
                  <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <h3 className="font-black text-amber-400 text-lg">Level {newLevel} Milestone!</h3>
                  <p className="text-sm text-amber-100/80 mb-4">You may choose to improve your Ability Scores OR take a special Feat.</p>
                  <div className="flex bg-slate-900 rounded-lg p-1">
                    <button onClick={() => setAsiChoice('ASI')} className={`flex-1 py-2 rounded-md font-bold text-sm transition-colors ${asiChoice === 'ASI' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}>Improve Stats</button>
                    <button onClick={() => setAsiChoice('FEAT')} className={`flex-1 py-2 rounded-md font-bold text-sm transition-colors ${asiChoice === 'FEAT' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}>Choose a Feat</button>
                  </div>
                </div>
              )}

              {(!isASILevel || asiChoice === 'ASI') ? (
                <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 shadow-inner">
                  <div className="flex justify-between items-center mb-4 bg-slate-900 p-3 rounded-lg border border-amber-900/50">
                    <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">Points Remaining:</span>
                    <span className={`text-xl font-black ${statPoints > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`}>{statPoints}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.keys(pendingStats).map(stat => (
                      <div key={stat} className="bg-slate-900 p-3 rounded-xl border border-slate-700 flex flex-col items-center">
                        <span className="text-xs text-slate-400 font-bold mb-2 uppercase tracking-widest">{stat}</span>
                        <div className="flex items-center gap-3">
                          <button onClick={() => handleStatChange(stat, -1)} disabled={pendingStats[stat] <= (char.stats?.[stat] || 10)} className="w-7 h-7 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded text-slate-300 font-bold">-</button>
                          <span className={`text-xl font-black ${pendingStats[stat] > (char.stats?.[stat] || 10) ? 'text-amber-400' : 'text-white'}`}>{pendingStats[stat]}</span>
                          <button onClick={() => handleStatChange(stat, 1)} disabled={statPoints === 0 || pendingStats[stat] >= 20} className="w-7 h-7 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded text-slate-300 font-bold">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {newFeats.length > 0 && (
                    <div className="bg-amber-900/20 border border-amber-900/50 p-4 rounded-xl">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Feat Selected</h4>
                      {newFeats.map((feat, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-900 p-2 rounded-lg border border-slate-700">
                          <span className="text-sm font-bold text-slate-200 px-2">{feat.name}</span>
                          <button onClick={() => setNewFeats(prev => prev.filter((_, i) => i !== idx))} className="p-1.5 text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  {newFeats.length === 0 && <FeatDiscovery onAddFeat={(feat) => setNewFeats([feat])} />}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-black text-white flex items-center justify-center gap-2 mb-2"><BookOpen className="w-5 h-5 text-fuchsia-400" /> Mystic Arts</h3>
              </div>
              <SpellDiscovery onAddSpell={(spell) => setNewSpells(prev => [...prev, spell])} />
            </div>
          )}

          {step === 4 && (
            <div className="animate-in slide-in-from-right-4 duration-300 space-y-6 text-center">
              <CheckCircle2 className="w-20 h-20 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-white uppercase tracking-widest">Ready to Ascend</h3>
              <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 text-left space-y-4">
                <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-lg"><ArrowUpCircle className="w-5 h-5 text-indigo-400" /><span className="text-slate-200 font-bold">Leveling up to {newLevel}</span></div>
                <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-lg"><Heart className="w-5 h-5 text-red-400" /><span className="text-slate-200 font-bold">Max HP increased by {parseInt(hpIncrease, 10) || 0}</span></div>
              </div>
            </div>
          )}

        </div>

        <div className="p-4 bg-slate-900/80 border-t border-slate-700/50 shrink-0 flex gap-3 relative z-10">
          {step > 1 ? <button onClick={() => setStep(s => s - 1)} disabled={isSubmitting} className="px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold border border-slate-600"><ChevronLeft className="w-5 h-5" /></button> : <div className="w-[60px]"></div>}
          {step < 4 ? <button onClick={() => setStep(s => s + 1)} className="flex-1 bg-indigo-600 text-white font-black text-lg py-3 rounded-xl flex items-center justify-center gap-2">Next Step <ChevronRight className="w-5 h-5" /></button> : <button onClick={handleAscend} disabled={isSubmitting} className="flex-1 bg-emerald-600 text-white font-black text-lg py-3 rounded-xl flex items-center justify-center">Complete Ascension</button>}
        </div>

      </div>
    </div>
  );
}