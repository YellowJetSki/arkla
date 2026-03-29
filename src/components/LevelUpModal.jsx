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
      
      const charRef = doc(db, 'characters', charId);
      batch.update(charRef, updates);

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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl h-[100dvh] overflow-hidden animate-in fade-in duration-700">
      
      {/* Immersive Ascension Portal Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950 to-slate-950 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none animate-[spin_10s_linear_infinite]"></div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-indigo-500/50 rounded-3xl w-full max-w-lg shadow-[0_0_80px_rgba(99,102,241,0.3)] flex flex-col max-h-[95dvh] relative overflow-hidden animate-in zoom-in-95 duration-500">
        
        <div className="p-4 bg-slate-900/50 border-b border-slate-700/50 flex justify-between items-center shrink-0 relative z-10">
          <h2 className="text-xl font-black text-indigo-400 flex items-center gap-2 uppercase tracking-widest"><ArrowUpCircle className="w-6 h-6" /> Ascension</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-1 px-6 pt-6 shrink-0 relative z-10">
          {[1, 2, 3, 4].map(i => <div key={i} className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${step >= i ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]' : 'bg-slate-800'}`} />)}
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative z-10">
          
          {step === 1 && (
            <div className="animate-in slide-in-from-right-4 duration-500 space-y-6">
              <div className="text-center py-6">
                <div className="text-5xl font-black text-white mb-2 flex items-center justify-center gap-4 drop-shadow-[0_0_30px_rgba(99,102,241,0.8)]">
                  <span className="text-slate-500">{totalCurrentLevel}</span> <ArrowUpCircle className="w-10 h-10 text-indigo-400 animate-pulse" /> <span className="text-indigo-300 scale-110 transform transition-transform">{newTotalLevel}</span>
                </div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm p-5 rounded-2xl border border-slate-700 shadow-inner text-left">
                <h3 className="flex items-center gap-2 text-lg font-black text-white mb-4 uppercase tracking-wider"><Milestone className="w-5 h-5 text-indigo-400" /> Class Path</h3>
                
                <div className="space-y-3">
                  {currentClasses.map((cls, idx) => (
                    <label key={idx} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-300 ${!isAddingNewClass && selectedClassIndex === idx ? 'bg-indigo-900/40 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}>
                      <div className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name="classSelect" 
                          checked={!isAddingNewClass && selectedClassIndex === idx} 
                          onChange={() => { setIsAddingNewClass(false); setSelectedClassIndex(idx); }}
                          className="w-4 h-4 text-indigo-600 bg-slate-900 border-slate-600 focus:ring-indigo-600"
                        />
                        <span className="font-bold text-white text-lg">{cls.name}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-500">Level {cls.level} → <span className={!isAddingNewClass && selectedClassIndex === idx ? 'text-indigo-400 text-lg' : ''}>{cls.level + 1}</span></span>
                    </label>
                  ))}
                  
                  <label className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all duration-300 ${isAddingNewClass ? 'bg-indigo-900/40 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <input 
                        type="radio" 
                        name="classSelect" 
                        checked={isAddingNewClass} 
                        onChange={() => setIsAddingNewClass(true)}
                        className="w-4 h-4 text-indigo-600 bg-slate-900 border-slate-600 focus:ring-indigo-600"
                      />
                      <span className="font-bold text-white flex items-center gap-2"><PlusCircle className="w-5 h-5 text-indigo-400"/> Multiclass</span>
                    </div>
                    {isAddingNewClass && (
                       <input 
                         type="text" 
                         value={newClassName} 
                         onFocus={(e) => e.target.select()}
                         onChange={(e) => setNewClassName(e.target.value)} 
                         placeholder="New Class Name (e.g. Rogue)" 
                         className="w-full bg-slate-950 border border-indigo-500/50 rounded-lg px-4 py-3 text-white font-bold ml-7 w-[calc(100%-28px)] shadow-inner transition-colors focus:outline-none focus:border-indigo-400" 
                         autoFocus
                       />
                    )}
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 2 && isLoadingMechanics && (
            <div className="flex flex-col items-center justify-center py-24 text-indigo-400 animate-in fade-in duration-500">
              <Loader2 className="w-16 h-16 animate-spin mb-6" />
              <p className="font-black tracking-widest uppercase text-lg">Consulting Archives...</p>
            </div>
          )}

          {step === 2 && !isLoadingMechanics && (
            <div className="animate-in slide-in-from-right-4 duration-500 space-y-6">
              
              <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700 text-left relative overflow-hidden mb-6 shadow-inner">
                <Dices className="absolute -right-4 -bottom-4 w-32 h-32 text-slate-700/20 rotate-12 pointer-events-none" />
                <h3 className="flex items-center gap-2 text-xl font-black text-white mb-2 uppercase tracking-wider"><Heart className="w-6 h-6 text-red-400" /> Vitality</h3>
                <p className="text-sm text-slate-400 mb-6">Your {targetClassName} hit die is a <strong className="text-indigo-300">d{engineData.hitDie}</strong>. The average gain (+ CON) is pre-calculated.</p>
                <input 
                  type="number" 
                  value={hpIncrease} 
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setHpIncrease(e.target.value)} 
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-6 text-white font-black text-4xl text-center mb-1 relative z-10 shadow-inner focus:outline-none focus:border-red-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                />
              </div>

              {isASILevel && (
                <div className="bg-amber-900/20 border border-amber-500/40 p-6 rounded-2xl text-center mb-6 shadow-inner">
                  <Sparkles className="w-10 h-10 text-amber-400 mx-auto mb-3 animate-pulse" />
                  <h3 className="font-black text-amber-400 text-xl uppercase tracking-widest mb-2">{targetClassName} Level {targetClassNewLevel} Milestone!</h3>
                  <p className="text-sm text-amber-100/80 mb-6">You may choose to improve your Ability Scores OR take a special Feat.</p>
                  <div className="flex bg-slate-900 rounded-xl p-1.5 shadow-inner">
                    <button onClick={() => setAsiChoice('ASI')} className={`flex-1 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${asiChoice === 'ASI' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Improve Stats</button>
                    <button onClick={() => setAsiChoice('FEAT')} className={`flex-1 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${asiChoice === 'FEAT' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Choose a Feat</button>
                  </div>
                </div>
              )}

              {(!isASILevel || asiChoice === 'ASI') ? (
                <div className="bg-slate-800/50 backdrop-blur-sm p-5 rounded-2xl border border-slate-700 shadow-inner">
                  <div className="flex justify-between items-center mb-6 bg-slate-900 p-4 rounded-xl border border-amber-900/50 shadow-inner">
                    <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">Points Remaining:</span>
                    <span className={`text-2xl font-black ${statPoints > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`}>{statPoints}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {Object.keys(pendingStats).map(stat => (
                      <div key={stat} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col items-center shadow-sm">
                        <span className="text-xs text-slate-400 font-black mb-3 uppercase tracking-widest">{stat}</span>
                        <div className="flex items-center gap-3">
                          <button onClick={() => handleStatChange(stat, -1)} disabled={pendingStats[stat] <= (char.stats?.[stat] || 10)} className="w-8 h-8 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-slate-300 font-bold text-lg flex items-center justify-center">-</button>
                          <span className={`text-2xl font-black w-8 text-center ${pendingStats[stat] > (char.stats?.[stat] || 10) ? 'text-amber-400' : 'text-white'}`}>{pendingStats[stat]}</span>
                          <button onClick={() => handleStatChange(stat, 1)} disabled={statPoints === 0 || pendingStats[stat] >= 20} className="w-8 h-8 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-slate-300 font-bold text-lg flex items-center justify-center">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {newFeats.length > 0 && (
                    <div className="bg-amber-900/20 border border-amber-900/50 p-5 rounded-2xl shadow-inner">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3">Feat Selected</h4>
                      {newFeats.map((feat, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-700">
                          <span className="text-sm font-bold text-slate-200 px-2">{feat.name}</span>
                          <button onClick={() => setNewFeats(prev => prev.filter((_, i) => i !== idx))} className="p-2 text-slate-500 hover:text-red-400 bg-slate-800 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
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
            <div className="animate-in slide-in-from-right-4 duration-500 space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-white flex items-center justify-center gap-2 mb-2 uppercase tracking-widest"><BookOpen className="w-6 h-6 text-fuchsia-400" /> Mystic Arts</h3>
                
                {engineData.spellcastingInfo ? (
                  <div className="bg-fuchsia-950/20 border border-fuchsia-900/50 rounded-2xl p-5 text-left max-w-sm mx-auto mb-4 shadow-inner">
                    <span className="text-xs font-bold text-fuchsia-400 uppercase tracking-widest block mb-4 text-center">Spells Target For {targetClassName} {targetClassNewLevel}</span>
                    <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-800 mb-2">
                      <span className="text-sm text-slate-300 font-bold">Cantrips Known:</span>
                      <span className={`text-lg font-black ${currentCantripsKnown < engineData.spellcastingInfo.cantripsKnown ? 'text-emerald-400' : 'text-slate-400'}`}>{currentCantripsKnown} / {engineData.spellcastingInfo.cantripsKnown}</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-sm text-slate-300 font-bold">Spells Known:</span>
                      <span className={`text-lg font-black ${currentSpellsKnown + newSpells.length < engineData.spellcastingInfo.spellsKnown ? 'text-emerald-400' : 'text-slate-400'}`}>{currentSpellsKnown + newSpells.length} / {engineData.spellcastingInfo.spellsKnown}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 bg-slate-900 p-4 rounded-xl border border-slate-800">If your class/species gains new spells at this level, scribe them into your Grimoire now.</p>
                )}
              </div>

              {newSpells.length > 0 && (
                <div className="bg-slate-800/50 backdrop-blur-sm p-5 rounded-2xl border border-fuchsia-900/50 mb-6 shadow-inner">
                  <h4 className="text-xs font-bold text-fuchsia-400 uppercase tracking-widest mb-3">Scribed Spells</h4>
                  <div className="space-y-2">
                    {newSpells.map((spell, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-700">
                        <span className="text-sm font-bold text-slate-200 px-2">{spell.name} <span className="text-xs text-slate-500 font-normal ml-2 bg-slate-800 px-2 py-1 rounded">({spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`})</span></span>
                        <button onClick={() => setNewSpells(prev => prev.filter((_, i) => i !== idx))} className="p-2 text-slate-500 hover:text-red-400 bg-slate-800 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <SpellDiscovery onAddSpell={(spell) => setNewSpells(prev => [...prev, spell])} maxSpellLevel={maxSpellLevel} />
            </div>
          )}

          {step === 4 && (
            <div className="animate-in slide-in-from-right-4 duration-700 space-y-6 text-center flex flex-col items-center justify-center min-h-[400px]">
              
              <div className="relative mb-8">
                 <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse"></div>
                 <CheckCircle2 className="w-24 h-24 text-emerald-400 relative z-10 drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
              </div>

              <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-300 uppercase tracking-widest mb-8 drop-shadow-md">Ascension Ready</h3>
              
              <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700 text-left space-y-4 shadow-inner w-full">
                <div className="flex items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-700"><ArrowUpCircle className="w-6 h-6 text-indigo-400 shrink-0" /><span className="text-white font-bold text-lg">Total Level {newTotalLevel} <span className="text-slate-500 font-normal">({targetClassName} {targetClassNewLevel})</span></span></div>
                <div className="flex items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-700"><Heart className="w-6 h-6 text-red-400 shrink-0" /><span className="text-white font-bold text-lg">Max HP increased by <span className="text-emerald-400">{parseInt(hpIncrease, 10) || 0}</span></span></div>
                
                {engineData.spellSlots ? (
                  <div className="flex items-center gap-4 bg-fuchsia-950/30 p-4 rounded-xl border border-fuchsia-900/50">
                    <Flame className="w-6 h-6 text-fuchsia-400 shrink-0" />
                    <div>
                       <span className="text-fuchsia-300 font-bold block text-lg leading-tight">Pact Magic Upgraded</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 bg-fuchsia-950/30 p-4 rounded-xl border border-fuchsia-900/50">
                    <Flame className="w-6 h-6 text-fuchsia-400 shrink-0" />
                    <div>
                       <span className="text-fuchsia-300 font-bold block text-lg leading-tight">Spell Slots Calibrated</span>
                       <span className="text-[10px] text-fuchsia-400/80 uppercase tracking-wider">Via multi-class engine</span>
                    </div>
                  </div>
                )}

                {(engineData.features.length > 0 || engineData.resources.length > 0) && (
                  <div className="mt-6 pt-6 border-t border-slate-700">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Automatic Grants from Archives</span>
                    <div className="space-y-3">
                      {engineData.features.map(f => (
                        <div key={f.name} className="flex items-start gap-4 bg-indigo-950/30 border border-indigo-900/50 p-3 rounded-xl">
                          <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-sm font-bold text-indigo-300 block mb-1">{f.name}</span>
                            <span className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{f.desc}</span>
                          </div>
                        </div>
                      ))}
                      {engineData.resources.map(r => {
                        if (r.upgrade) {
                          return (
                            <div key={r.name} className="flex items-start gap-4 bg-emerald-950/30 border border-emerald-900/50 p-3 rounded-xl">
                              <ArrowUpCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-sm font-bold text-emerald-300 block mb-1">Upgrade: {r.name}</span>
                                <span className="text-xs text-slate-400">Recharge rate improved to {r.recharge} rest!</span>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div key={r.name} className="flex items-start gap-4 bg-amber-950/30 border border-amber-900/50 p-3 rounded-xl">
                            <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-sm font-bold text-amber-300 block mb-1">New Resource: {r.name}</span>
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

        <div className="p-4 bg-slate-900/80 border-t border-slate-700/50 shrink-0 flex gap-4 relative z-10">
          {step > 1 ? <button onClick={() => setStep(s => s - 1)} disabled={isSubmitting || isLoadingMechanics} className="px-6 py-4 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors rounded-xl font-bold border border-slate-600"><ChevronLeft className="w-6 h-6" /></button> : <div className="w-[74px]"></div>}
          {step === 1 ? (
             <button onClick={handleProceedToStep2} disabled={isAddingNewClass && !newClassName.trim()} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xl py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg">Next Step <ChevronRight className="w-6 h-6" /></button>
          ) : step < 4 ? (
             <button onClick={() => setStep(s => s + 1)} disabled={isLoadingMechanics} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xl py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg">Next Step <ChevronRight className="w-6 h-6" /></button>
          ) : (
             <button onClick={handleAscend} disabled={isSubmitting} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl py-4 rounded-xl flex items-center justify-center transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]">Complete Ascension</button>
          )}
        </div>

      </div>
    </div>
  );
}