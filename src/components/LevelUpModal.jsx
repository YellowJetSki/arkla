import { useState, useEffect } from 'react';
import { doc, writeBatch, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ArrowUpCircle, X, Heart, Sparkles, BookOpen, ChevronRight, ChevronLeft, CheckCircle2, Trash2, Milestone, Dices, Zap, Loader2, Flame, PlusCircle } from 'lucide-react';
import SpellDiscovery from './SpellDiscovery';
import FeatDiscovery from './FeatDiscovery';
import { fetchClassProgression, getProficiencyBonus, getModifier, calculateSpellcastingStats, calculateCombinedSpellSlots } from '../services/arklaEngine';

export default function LevelUpModal({ char, charId, onClose }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMechanics, setIsLoadingMechanics] = useState(false);

  const currentClasses = char.classes && char.classes.length > 0 
    ? char.classes 
    : [{ name: char.class || 'Adventurer', level: char.level || 1 }];

  const totalCurrentLevel = currentClasses.reduce((sum, c) => sum + c.level, 0);
  
  const [selectedClassIndex, setSelectedClassIndex] = useState(0);
  const [isAddingNewClass, setIsAddingNewClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  
  const targetClassName = isAddingNewClass ? newClassName : currentClasses[selectedClassIndex].name;
  const targetClassNewLevel = isAddingNewClass ? 1 : currentClasses[selectedClassIndex].level + 1;
  const newTotalLevel = totalCurrentLevel + 1;

  const [engineData, setEngineData] = useState({ hitDie: 8, features: [], resources: [], spellSlots: null, spellcastingInfo: null });
  const [hpIncrease, setHpIncrease] = useState('');

  const isASILevel = [4, 8, 12, 16, 19].includes(targetClassNewLevel);
  const [asiChoice, setAsiChoice] = useState('ASI'); 
  
  const [statPoints, setStatPoints] = useState(2);
  const [pendingStats, setPendingStats] = useState({ ...(char.stats || { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }) });

  const [newSpells, setNewSpells] = useState([]);
  const [newFeats, setNewFeats] = useState([]);

  const currentSpellsKnown = (char.spells || []).filter(s => s.level > 0).length;
  const currentCantripsKnown = (char.spells || []).filter(s => s.level === 0).length;
  const maxSpellLevel = Math.ceil(newTotalLevel / 2); 

  const handleProceedToStep2 = async () => {
    if (isAddingNewClass && !newClassName.trim()) return;

    setIsLoadingMechanics(true);
    setStep(2); 
    
    const data = await fetchClassProgression(targetClassName, targetClassNewLevel);
    setEngineData(data);
    
    const conMod = getModifier(pendingStats.CON);
    const avgHpGain = Math.floor(data.hitDie / 2) + 1 + conMod;
    setHpIncrease(avgHpGain);
    
    setIsLoadingMechanics(false);
  };

  useEffect(() => {
    if (asiChoice === 'ASI' && !isLoadingMechanics) {
      const newConMod = getModifier(pendingStats.CON);
      setHpIncrease(Math.floor(engineData.hitDie / 2) + 1 + newConMod);
    }
  }, [pendingStats.CON, asiChoice, engineData.hitDie, isLoadingMechanics]);

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
    
    let updatedClasses = [...currentClasses];
    if (isAddingNewClass) {
      updatedClasses.push({ name: targetClassName.trim(), level: 1 });
    } else {
      updatedClasses[selectedClassIndex].level += 1;
    }

    const classString = updatedClasses.map(c => `${c.name} ${c.level}`).join(' / ');

    let updates = {
      level: newTotalLevel,
      class: classString,
      classes: updatedClasses,
      maxHp: newMaxHp,
      hp: newMaxHp, 
      'hitDice.max': (char.hitDice?.max || totalCurrentLevel) + 1,
      'hitDice.current': (char.hitDice?.current || totalCurrentLevel) + 1,
      'hitDice.type': char.hitDice?.type || `d${engineData.hitDie}` 
    };

    const spellStats = calculateSpellcastingStats(updatedClasses, pendingStats);
    if (spellStats.spellSave !== '--') {
      updates.spellSave = spellStats.spellSave;
      updates.spellAttack = spellStats.spellAttack;
    }

    if (asiChoice === 'ASI') {
      const statsChanged = Object.keys(pendingStats).some(k => pendingStats[k] !== char.stats?.[k]);
      if (statsChanged) updates.stats = pendingStats;
    }
    
    if (newSpells.length > 0) updates.spells = arrayUnion(...newSpells);
    if (newFeats.length > 0) updates.features = arrayUnion(...newFeats);

    if (engineData.features.length > 0) {
      if (!updates.features) updates.features = arrayUnion(...engineData.features);
      else updates.features = arrayUnion(...newFeats, ...engineData.features);
    }

    if (engineData.spellSlots) {
       updates.spellSlots = engineData.spellSlots;
    } else {
       const combinedSlots = calculateCombinedSpellSlots(updatedClasses);
       if (Object.keys(combinedSlots).length > 0) {
         updates.spellSlots = combinedSlots;
       }
    }

    const currentResources = char.resources ? [...char.resources] : [];
    let resourcesChanged = false;

    if (engineData.resources.length > 0) {
      engineData.resources.forEach(res => {
        if (res.upgrade) {
           const existingIdx = currentResources.findIndex(r => r.name === res.name);
           if (existingIdx >= 0) {
             currentResources[existingIdx] = { ...currentResources[existingIdx], ...res };
             resourcesChanged = true;
           }
           return;
        }

        let calculatedMax = 1;
        if (res.maxType === 'PB') calculatedMax = getProficiencyBonus(newTotalLevel);
        else if (res.maxType === 'LEVEL') calculatedMax = newTotalLevel;
        else if (res.maxType === 'CLASS_LEVEL') calculatedMax = targetClassNewLevel;
        else if (['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].includes(res.maxType)) {
          calculatedMax = Math.max(1, getModifier(pendingStats[res.maxType]));
        } else if (typeof res.maxType === 'number') {
          calculatedMax = res.maxType;
        }

        const existingIdx = currentResources.findIndex(r => r.name === res.name);
        if (existingIdx >= 0) {
          currentResources[existingIdx] = { ...currentResources[existingIdx], max: calculatedMax, current: calculatedMax };
        } else {
          currentResources.push({ name: res.name, max: calculatedMax, current: calculatedMax, recharge: res.recharge, isPool: res.isPool });
        }
        resourcesChanged = true;
      });
    }

    currentResources.forEach(res => {
      if (res.name === 'Ki Points') { res.max = targetClassNewLevel; res.current = targetClassNewLevel; resourcesChanged = true; }
      if (res.name === "Pirate's Bounty") { res.max = getProficiencyBonus(newTotalLevel); res.current = res.max; resourcesChanged = true; }
      if (asiChoice === 'ASI') {
         if (res.name === 'Bardic Inspiration') { res.max = Math.max(1, getModifier(pendingStats.CHA)); res.current = res.max; resourcesChanged = true; }
         if (res.name === 'Flint Lock') { res.max = Math.max(1, getModifier(pendingStats.CHA)); res.current = res.max; resourcesChanged = true; }
      }
    });

    if (resourcesChanged) {
      updates.resources = currentResources;
    }

    try {
      const batch = writeBatch(db);
      
      // 1. Update Character Sheet
      const charRef = doc(db, 'characters', charId);
      batch.update(charRef, updates);

      // 2. Sync Max HP to Battle Map Token
      const mapRef = doc(db, 'campaign', 'battlemap');
      const mapDoc = await getDoc(mapRef);
      if (mapDoc.exists() && mapDoc.data().tokens && mapDoc.data().tokens[charId]) {
         const mapTokens = mapDoc.data().tokens;
         mapTokens[charId].maxHp = updates.maxHp;
         mapTokens[charId].hp = updates.hp;
         batch.update(mapRef, { tokens: mapTokens });
      }

      await batch.commit();
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
          
          {step === 1 && (
            <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
              <div className="text-center">
                <div className="text-5xl font-black text-white mb-2 flex items-center justify-center gap-4 drop-shadow-[0_0_20px_rgba(99,102,241,0.8)]">
                  <span className="text-slate-500">{totalCurrentLevel}</span> <ArrowUpCircle className="w-8 h-8 text-indigo-400 animate-pulse" /> <span className="text-indigo-400">{newTotalLevel}</span>
                </div>
              </div>
              <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 text-left">
                <h3 className="flex items-center gap-2 text-lg font-black text-white mb-4"><Milestone className="w-5 h-5 text-indigo-400" /> Class Progression</h3>
                
                <div className="space-y-3">
                  {currentClasses.map((cls, idx) => (
                    <label key={idx} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${!isAddingNewClass && selectedClassIndex === idx ? 'bg-indigo-900/40 border-indigo-500 shadow-inner' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}>
                      <div className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name="classSelect" 
                          checked={!isAddingNewClass && selectedClassIndex === idx} 
                          onChange={() => { setIsAddingNewClass(false); setSelectedClassIndex(idx); }}
                          className="w-4 h-4 text-indigo-600 bg-slate-900 border-slate-600 focus:ring-indigo-600"
                        />
                        <span className="font-bold text-slate-200">{cls.name}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-500">Level {cls.level} → <span className={!isAddingNewClass && selectedClassIndex === idx ? 'text-indigo-400' : ''}>{cls.level + 1}</span></span>
                    </label>
                  ))}
                  
                  <label className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${isAddingNewClass ? 'bg-indigo-900/40 border-indigo-500 shadow-inner' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <input 
                        type="radio" 
                        name="classSelect" 
                        checked={isAddingNewClass} 
                        onChange={() => setIsAddingNewClass(true)}
                        className="w-4 h-4 text-indigo-600 bg-slate-900 border-slate-600 focus:ring-indigo-600"
                      />
                      <span className="font-bold text-slate-200 flex items-center gap-2"><PlusCircle className="w-4 h-4"/> Multiclass</span>
                    </div>
                    {isAddingNewClass && (
                       <input 
                         type="text" 
                         value={newClassName} 
                         onChange={(e) => setNewClassName(e.target.value)} 
                         placeholder="New Class Name (e.g. Rogue)" 
                         className="w-full bg-slate-950 border border-indigo-500/50 rounded-lg px-3 py-2 text-white font-bold ml-7 w-[calc(100%-28px)]" 
                         autoFocus
                       />
                    )}
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 2 && isLoadingMechanics && (
            <div className="flex flex-col items-center justify-center py-20 text-indigo-400 animate-in fade-in">
              <Loader2 className="w-12 h-12 animate-spin mb-4" />
              <p className="font-bold tracking-widest uppercase">Consulting Ancient Archives...</p>
            </div>
          )}

          {step === 2 && !isLoadingMechanics && (
            <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
              
              <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 text-left relative overflow-hidden mb-6">
                <Dices className="absolute -right-4 -bottom-4 w-24 h-24 text-slate-700/30 rotate-12 pointer-events-none" />
                <h3 className="flex items-center gap-2 text-lg font-black text-white mb-1"><Heart className="w-5 h-5 text-red-400" /> Vitality Increase</h3>
                <p className="text-xs text-slate-400 mb-4">Your {targetClassName} hit die is a <strong className="text-indigo-300">d{engineData.hitDie}</strong>. The average gain (+ CON) is pre-calculated.</p>
                <input type="number" value={hpIncrease} onChange={(e) => setHpIncrease(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-4 text-white font-black text-3xl text-center mb-1 relative z-10" />
              </div>

              {isASILevel && (
                <div className="bg-amber-900/30 border border-amber-500/50 p-4 rounded-xl text-center mb-6">
                  <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <h3 className="font-black text-amber-400 text-lg">{targetClassName} Level {targetClassNewLevel} Milestone!</h3>
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
                  {newFeats.length === 0 && <FeatDiscovery onAddFeat={(feat) => setNewFeats([feat])} charLevel={newTotalLevel} />}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-black text-white flex items-center justify-center gap-2 mb-2"><BookOpen className="w-5 h-5 text-fuchsia-400" /> Mystic Arts</h3>
                
                {engineData.spellcastingInfo ? (
                  <div className="bg-fuchsia-950/30 border border-fuchsia-900/50 rounded-xl p-4 text-left max-w-sm mx-auto mb-4">
                    <span className="text-xs font-bold text-fuchsia-400 uppercase tracking-widest block mb-2 text-center">Spells Target For {targetClassName} {targetClassNewLevel}</span>
                    <div className="flex justify-between items-center bg-slate-900 p-2 rounded border border-slate-800 mb-1">
                      <span className="text-sm text-slate-300">Cantrips Known:</span>
                      <span className={`font-bold ${currentCantripsKnown < engineData.spellcastingInfo.cantripsKnown ? 'text-emerald-400' : 'text-slate-400'}`}>{currentCantripsKnown} / {engineData.spellcastingInfo.cantripsKnown}</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-sm text-slate-300">Spells Known:</span>
                      <span className={`font-bold ${currentSpellsKnown + newSpells.length < engineData.spellcastingInfo.spellsKnown ? 'text-emerald-400' : 'text-slate-400'}`}>{currentSpellsKnown + newSpells.length} / {engineData.spellcastingInfo.spellsKnown}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">If your class/species gains new spells at this level, scribe them into your Grimoire now.</p>
                )}
              </div>

              {newSpells.length > 0 && (
                <div className="bg-slate-800/80 p-4 rounded-xl border border-fuchsia-900/50 mb-4">
                  <h4 className="text-xs font-bold text-fuchsia-400 uppercase tracking-wider mb-2">Scribed Spells</h4>
                  {newSpells.map((spell, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-900 p-2 rounded-lg border border-slate-700 mb-2 last:mb-0">
                      <span className="text-sm font-bold text-slate-200 px-2">{spell.name} <span className="text-xs text-slate-500 font-normal">({spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`})</span></span>
                      <button onClick={() => setNewSpells(prev => prev.filter((_, i) => i !== idx))} className="p-1.5 text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}

              <SpellDiscovery onAddSpell={(spell) => setNewSpells(prev => [...prev, spell])} maxSpellLevel={maxSpellLevel} />
            </div>
          )}

          {step === 4 && (
            <div className="animate-in slide-in-from-right-4 duration-300 space-y-6 text-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-6">Ready to Ascend</h3>
              
              <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 text-left space-y-3">
                <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-lg"><ArrowUpCircle className="w-5 h-5 text-indigo-400 shrink-0" /><span className="text-slate-200 font-bold">Total Level {newTotalLevel} ({targetClassName} {targetClassNewLevel})</span></div>
                <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-lg"><Heart className="w-5 h-5 text-red-400 shrink-0" /><span className="text-slate-200 font-bold">Max HP increased by {parseInt(hpIncrease, 10) || 0}</span></div>
                
                {engineData.spellSlots ? (
                  <div className="flex items-center gap-3 bg-fuchsia-950/30 p-3 rounded-lg border border-fuchsia-900/50">
                    <Flame className="w-5 h-5 text-fuchsia-400 shrink-0" />
                    <div>
                       <span className="text-fuchsia-300 font-bold block leading-none">Pact Magic Upgraded</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-fuchsia-950/30 p-3 rounded-lg border border-fuchsia-900/50">
                    <Flame className="w-5 h-5 text-fuchsia-400 shrink-0" />
                    <div>
                       <span className="text-fuchsia-300 font-bold block leading-none">Spell Slots Calibrated</span>
                       <span className="text-[10px] text-fuchsia-400/80 uppercase">Calculated via multi-class engine</span>
                    </div>
                  </div>
                )}

                {(engineData.features.length > 0 || engineData.resources.length > 0) && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Automatic Class Grants</span>
                    <div className="space-y-2">
                      {engineData.features.map(f => (
                        <div key={f.name} className="flex items-start gap-3 bg-indigo-950/30 border border-indigo-900/50 p-2.5 rounded-lg">
                          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-sm font-bold text-indigo-300 block">{f.name}</span>
                            <span className="text-xs text-slate-400 line-clamp-1">{f.desc}</span>
                          </div>
                        </div>
                      ))}
                      {engineData.resources.map(r => {
                        if (r.upgrade) {
                          return (
                            <div key={r.name} className="flex items-start gap-3 bg-emerald-950/30 border border-emerald-900/50 p-2.5 rounded-lg">
                              <ArrowUpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-sm font-bold text-emerald-300 block">Upgrade: {r.name}</span>
                                <span className="text-xs text-slate-400">Recharge rate improved to {r.recharge} rest!</span>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div key={r.name} className="flex items-start gap-3 bg-amber-950/30 border border-amber-900/50 p-2.5 rounded-lg">
                            <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-sm font-bold text-amber-300 block">New Resource: {r.name}</span>
                              <span className="text-xs text-slate-400">Uses automatically calculated and added to sheet.</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        <div className="p-4 bg-slate-900/80 border-t border-slate-700/50 shrink-0 flex gap-3 relative z-10">
          {step > 1 ? <button onClick={() => setStep(s => s - 1)} disabled={isSubmitting || isLoadingMechanics} className="px-4 py-3 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors rounded-xl font-bold border border-slate-600"><ChevronLeft className="w-5 h-5" /></button> : <div className="w-[60px]"></div>}
          {step === 1 ? (
             <button onClick={handleProceedToStep2} disabled={isAddingNewClass && !newClassName.trim()} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-lg py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md">Next Step <ChevronRight className="w-5 h-5" /></button>
          ) : step < 4 ? (
             <button onClick={() => setStep(s => s + 1)} disabled={isLoadingMechanics} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md">Next Step <ChevronRight className="w-5 h-5" /></button>
          ) : (
             <button onClick={handleAscend} disabled={isSubmitting} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg py-3 rounded-xl flex items-center justify-center transition-colors shadow-[0_0_15px_rgba(16,185,129,0.4)]">Complete Ascension</button>
          )}
        </div>

      </div>
    </div>
  );
}