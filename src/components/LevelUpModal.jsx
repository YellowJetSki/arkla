import { useState, useEffect } from 'react';
import { doc, updateDoc, writeBatch, getDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ArrowUpCircle, X, ShieldPlus, Sparkles, Flame, Dices, ChevronRight, ChevronLeft, Loader2, BookOpen, Minus, Plus } from 'lucide-react';
import { fetchClassProgression } from '../services/arklaEngine';
import FeatDiscovery from './FeatDiscovery';
import SpellDiscovery from './SpellDiscovery';

const AVAILABLE_CLASSES = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard', 'Pirate'];

export default function LevelUpModal({ char, charId, onClose }) {
  const currentTotalLevel = char.level || 1;
  const newTotalLevel = currentTotalLevel + 1;
  
  const [targetClass, setTargetClass] = useState(char.classes?.[0]?.name || 'Fighter');
  const [isMulticlassing, setIsMulticlassing] = useState(false);
  const [engineData, setEngineData] = useState(null);
  
  const [stepIndex, setStepIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  const [hpRollMethod, setHpRollMethod] = useState('average'); 
  const [manualHpRoll, setManualHpRoll] = useState('');
  
  const [asiChoice, setAsiChoice] = useState(null); 
  const [statAllocations, setStatAllocations] = useState({ STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 });
  const [selectedFeat, setSelectedFeat] = useState(null);

  const [pickedSpells, setPickedSpells] = useState([]);

  const existingClassData = char.classes?.find(c => c.name === targetClass);
  const targetClassLevel = existingClassData ? existingClassData.level + 1 : 1;

  useEffect(() => {
    setEngineData(null);
    const loadProgression = async () => {
      try {
        const data = await fetchClassProgression(targetClass, targetClassLevel);
        if (!data.hitDie) data.hitDie = 'd8';
        setEngineData(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadProgression();
  }, [targetClass, targetClassLevel]);

  if (!engineData) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/95 backdrop-blur-md">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
          <p className="text-amber-400 font-bold uppercase tracking-widest text-sm animate-pulse">Consulting the Archives...</p>
        </div>
      </div>
    );
  }

  const grantsASI = engineData.features?.some(f => f.name.toLowerCase().includes('ability score improvement'));
  const grantsSpells = engineData.spellSlots || engineData.spellsKnownIncrease > 0 || engineData.cantripsKnownIncrease > 0;
  
  const hitDieMax = parseInt(engineData.hitDie.replace('d', ''), 10);
  const conMod = Math.floor(((char.stats?.CON || 10) - 10) / 2);
  const averageHpIncrease = Math.floor(hitDieMax / 2) + 1;
  const totalAverageHp = averageHpIncrease + conMod;

  const steps = ['class', 'vitality', 'features'];
  if (grantsASI) steps.push('asi');
  if (grantsSpells) steps.push('spells');
  steps.push('confirm');

  const currentStep = steps[stepIndex];

  const totalAllocated = Object.values(statAllocations).reduce((a, b) => a + b, 0);
  const handleAllocate = (stat, amount) => {
    if (amount > 0 && totalAllocated >= 2) return;
    if (amount > 0 && statAllocations[stat] >= 2) return;
    if (amount < 0 && statAllocations[stat] <= 0) return;
    setStatAllocations(prev => ({ ...prev, [stat]: prev[stat] + amount }));
  };

  const handleConfirm = async () => {
    setIsSaving(true);
    
    let actualHpIncrease = hpRollMethod === 'average' ? totalAverageHp : (parseInt(manualHpRoll, 10) || averageHpIncrease) + conMod;
    actualHpIncrease = Math.max(1, actualHpIncrease);
    const newMaxHp = (char.maxHp || 10) + actualHpIncrease;

    try {
      const batch = writeBatch(db);
      const charRef = doc(db, 'characters', charId);
      const mapRef = doc(db, 'campaign', 'battlemap');

      let updates = {
        level: newTotalLevel,
        maxHp: newMaxHp,
        hp: newMaxHp, 
        'hitDice.max': (char.hitDice?.max || currentTotalLevel) + 1,
        'hitDice.current': (char.hitDice?.current || currentTotalLevel) + 1
      };

      const updatedClasses = [...(char.classes || [])];
      const classIdx = updatedClasses.findIndex(c => c.name === targetClass);
      if (classIdx !== -1) updatedClasses[classIdx].level += 1;
      else updatedClasses.push({ name: targetClass, level: 1 });
      
      updates.classes = updatedClasses;
      updates.class = updatedClasses.map(c => `${c.name} ${c.level}`).join(' / ');

      const finalFeatures = [...(engineData.features || [])];
      if (selectedFeat) finalFeatures.push(selectedFeat);
      if (finalFeatures.length > 0) updates.features = arrayUnion(...finalFeatures);

      if (engineData.resources?.length > 0) {
         const currentResources = char.resources ? [...char.resources] : [];
         engineData.resources.forEach(res => {
            const existingIdx = currentResources.findIndex(r => r.name === res.name);
            let calculatedMax = 1;
            if (res.maxType === 'PB') calculatedMax = Math.ceil(newTotalLevel / 4) + 1; 
            else if (res.maxType === 'LEVEL') calculatedMax = newTotalLevel;
            else if (res.maxType === 'CLASS_LEVEL') calculatedMax = targetClassLevel;
            else if (['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].includes(res.maxType)) {
              const baseStat = (char.stats[res.maxType] || 10) + statAllocations[res.maxType];
              calculatedMax = Math.max(1, Math.floor((baseStat - 10) / 2));
            }
            else if (typeof res.maxType === 'number') calculatedMax = res.maxType;

            if (existingIdx !== -1) {
               currentResources[existingIdx].max = calculatedMax;
               currentResources[existingIdx].current = calculatedMax;
            } else {
               currentResources.push({ name: res.name, max: calculatedMax, current: calculatedMax, recharge: res.recharge, isPool: res.isPool });
            }
         });
         updates.resources = currentResources;
      }

      if (asiChoice === 'stats' && totalAllocated > 0) {
        updates.stats = {
          STR: (char.stats?.STR || 10) + statAllocations.STR,
          DEX: (char.stats?.DEX || 10) + statAllocations.DEX,
          CON: (char.stats?.CON || 10) + statAllocations.CON,
          INT: (char.stats?.INT || 10) + statAllocations.INT,
          WIS: (char.stats?.WIS || 10) + statAllocations.WIS,
          CHA: (char.stats?.CHA || 10) + statAllocations.CHA
        };
      }

      if (pickedSpells.length > 0) updates.spells = [...(char.spells || []), ...pickedSpells];
      if (engineData.spellSlots) updates.spellSlots = engineData.spellSlots;

      batch.update(charRef, updates);

      const mapDoc = await getDoc(mapRef);
      if (mapDoc.exists() && mapDoc.data().tokens && mapDoc.data().tokens[charId]) {
        batch.update(mapRef, { [`tokens.${charId}.maxHp`]: newMaxHp, [`tokens.${charId}.hp`]: newMaxHp });
      }

      await batch.commit();
      onClose();
    } catch (err) {
      console.error("Level Up Failed", err);
      setIsSaving(false);
    }
  };

  const validateNextStep = () => {
    if (currentStep === 'vitality' && hpRollMethod === 'roll' && !manualHpRoll) return false;
    if (currentStep === 'asi') {
      if (!asiChoice) return false;
      if (asiChoice === 'stats' && totalAllocated < 2) return false;
      if (asiChoice === 'feat' && !selectedFeat) return false;
    }
    return true;
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl h-[100dvh] overflow-hidden animate-in fade-in duration-500">
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-600/10 blur-[150px] rounded-full pointer-events-none -z-10 animate-pulse"></div>

      <div className={`bg-slate-900/90 backdrop-blur-xl border border-amber-500/50 rounded-3xl w-full ${currentStep === 'spells' ? 'max-w-2xl' : 'max-w-md'} shadow-[0_0_60px_rgba(245,158,11,0.2)] flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90dvh] transition-all`}>
        
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 relative z-10 shrink-0">
          <h2 className="text-xl font-black text-amber-400 flex items-center gap-2 uppercase tracking-widest">
            <ArrowUpCircle className="w-6 h-6" /> Ascension
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl border border-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex h-1.5 bg-slate-800 shrink-0">
           <div className="h-full bg-amber-500 transition-all duration-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}></div>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative z-10">
          
          {currentStep === 'class' && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <div className="text-center mb-6">
               <h3 className="text-3xl font-black text-white mb-1">Level {newTotalLevel}</h3>
               <p className="text-amber-500 font-bold uppercase tracking-widest text-sm">Choose Your Path</p>
             </div>
             <div className="space-y-4">
               <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 shadow-inner">
                 <label className="flex items-center gap-3 cursor-pointer">
                   <input type="radio" checked={!isMulticlassing} onChange={() => { setIsMulticlassing(false); setTargetClass(char.classes[0].name); }} className="w-5 h-5 text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500 focus:ring-offset-slate-900" />
                   <div>
                     <h4 className="font-bold text-white">Advance Current Class</h4>
                     <p className="text-xs text-slate-400">Continue down the path of the <span className="text-amber-400 font-bold">{char.classes[0].name}</span>.</p>
                   </div>
                 </label>
               </div>
               <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 shadow-inner">
                 <label className="flex items-start gap-3 cursor-pointer mb-3">
                   <input type="radio" checked={isMulticlassing} onChange={() => setIsMulticlassing(true)} className="w-5 h-5 text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500 focus:ring-offset-slate-900 mt-1" />
                   <div>
                     <h4 className="font-bold text-white">Multiclass</h4>
                     <p className="text-xs text-slate-400">Branch out and take a level in a new discipline.</p>
                   </div>
                 </label>
                 {isMulticlassing && (
                   <div className="pl-8 animate-in fade-in slide-in-from-top-2">
                     <select value={targetClass} onChange={(e) => setTargetClass(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 shadow-inner">
                       <option value="" disabled>Select new class...</option>
                       {AVAILABLE_CLASSES.filter(c => !char.classes.some(cc => cc.name === c)).map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                   </div>
                 )}
               </div>
             </div>
           </div>
          )}

          {currentStep === 'vitality' && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <div className="text-center mb-6">
               <h3 className="text-2xl font-black text-white mb-1">Vitality Increase</h3>
               <p className="text-slate-400 text-xs">Gain HP based on your <strong className="text-emerald-400">{targetClass}</strong> Hit Die ({engineData.hitDie}).</p>
             </div>
             <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800 shadow-inner">
               <div className="flex gap-2 mb-6 bg-slate-900 p-1 rounded-xl">
                 <button onClick={() => setHpRollMethod('average')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${hpRollMethod === 'average' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>Take Average</button>
                 <button onClick={() => setHpRollMethod('roll')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${hpRollMethod === 'roll' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>Roll Dice</button>
               </div>
               {hpRollMethod === 'average' ? (
                 <div className="text-center p-6 bg-slate-900 border border-slate-700 rounded-xl">
                   <p className="text-slate-400 text-xs mb-2 uppercase font-bold tracking-wider">Class Average ({averageHpIncrease}) + CON Mod</p>
                   <p className="text-4xl font-black text-emerald-400">+{totalAverageHp} <span className="text-sm text-emerald-600">Max HP</span></p>
                 </div>
               ) : (
                 <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 p-5 rounded-xl">
                   <div className="flex-1">
                      <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Roll 1{engineData.hitDie}</p>
                      <input type="number" onFocus={(e) => e.target.select()} value={manualHpRoll} onChange={e => setManualHpRoll(e.target.value)} placeholder="Result" className="w-full bg-slate-950 border border-slate-600 rounded-xl px-4 py-3 text-white font-black text-xl text-center focus:outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none shadow-inner" />
                   </div>
                   <div className="flex items-center gap-2 px-2 text-slate-500 font-black text-2xl">+</div>
                   <div className="flex-1 text-center">
                      <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">CON Mod</p>
                      <div className="bg-slate-800 py-3 rounded-xl text-slate-300 font-black text-xl border border-slate-700">{conMod >= 0 ? `+${conMod}` : conMod}</div>
                   </div>
                 </div>
               )}
             </div>
           </div>
          )}

          {currentStep === 'features' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-black text-white mb-1">Abilities Discovered</h3>
                <p className="text-slate-400 text-xs leading-relaxed mt-2">The engine will permanently scribe these Level {targetClassLevel} {targetClass} features.</p>
              </div>
              {engineData.features?.length > 0 ? (
                <div className="space-y-3">
                  {engineData.features.filter(f => !f.name.toLowerCase().includes('ability score improvement')).map((feat, i) => (
                    <div key={i} className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 shadow-sm relative group">
                      <div className="absolute top-4 right-4"><Sparkles className="w-4 h-4 text-amber-500/30" /></div>
                      <h4 className="font-bold text-amber-300 mb-1 pr-6">{feat.name}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 bg-slate-950/50 border border-slate-800 border-dashed rounded-xl">
                  <p className="text-slate-500 text-sm">No new specific features are automatically granted at this level.</p>
                </div>
              )}
            </div>
          )}

          {currentStep === 'asi' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-4">
                <h3 className="text-2xl font-black text-white mb-1">Growth & Mastery</h3>
                <p className="text-slate-400 text-xs">You have reached a milestone. Choose how to advance.</p>
              </div>

              <div className="flex gap-3 mb-6">
                <button 
                  onClick={() => setAsiChoice('stats')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${asiChoice === 'stats' ? 'border-amber-500 bg-amber-900/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-500'}`}
                >
                  <ArrowUpCircle className={`w-6 h-6 ${asiChoice === 'stats' ? 'text-amber-400' : ''}`} />
                  <span className="font-bold text-sm">Improve Stats</span>
                  <span className="text-[10px] text-center opacity-80">+2 to one stat, or +1 to two.</span>
                </button>
                <button 
                  onClick={() => setAsiChoice('feat')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${asiChoice === 'feat' ? 'border-amber-500 bg-amber-900/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-500'}`}
                >
                  <BookOpen className={`w-6 h-6 ${asiChoice === 'feat' ? 'text-amber-400' : ''}`} />
                  <span className="font-bold text-sm">Take a Feat</span>
                  <span className="text-[10px] text-center opacity-80">Learn a new passive technique.</span>
                </button>
              </div>

              {asiChoice === 'stats' && (
                <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800 shadow-inner animate-in fade-in slide-in-from-bottom-2">
                   <div className="flex justify-between items-center mb-4">
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Allocate Points</span>
                     <span className={`text-xs font-black px-2 py-1 rounded ${totalAllocated === 2 ? 'bg-emerald-900/50 text-emerald-400' : 'bg-amber-900/50 text-amber-400'}`}>
                       {totalAllocated} / 2 Spent
                     </span>
                   </div>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                     {Object.keys(statAllocations).map(stat => {
                       const base = char.stats?.[stat] || 10;
                       const allocated = statAllocations[stat];
                       return (
                         <div key={stat} className="bg-slate-900 border border-slate-700 rounded-xl p-3 flex flex-col items-center shadow-sm">
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat}</span>
                           <span className="text-xl font-black text-white mb-2">{base + allocated}</span>
                           <div className="flex items-center gap-1 w-full">
                             <button onClick={() => handleAllocate(stat, -1)} disabled={allocated === 0} className="flex-1 bg-slate-800 disabled:opacity-50 hover:bg-slate-700 text-white rounded p-1 flex justify-center"><Minus className="w-3 h-3"/></button>
                             <span className="w-4 text-center text-xs font-bold text-amber-500">{allocated > 0 ? `+${allocated}` : ''}</span>
                             <button onClick={() => handleAllocate(stat, 1)} disabled={totalAllocated >= 2 || allocated >= 2} className="flex-1 bg-slate-800 disabled:opacity-50 hover:bg-slate-700 text-white rounded p-1 flex justify-center"><Plus className="w-3 h-3"/></button>
                           </div>
                         </div>
                       )
                     })}
                   </div>
                </div>
              )}

              {asiChoice === 'feat' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  {selectedFeat ? (
                    <div className="bg-emerald-950/30 border border-emerald-500/50 rounded-xl p-4 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold block mb-1">Selected Feat</span>
                        <span className="font-black text-emerald-300">{selectedFeat.name}</span>
                      </div>
                      <button onClick={() => setSelectedFeat(null)} className="text-slate-400 hover:text-red-400"><X className="w-5 h-5"/></button>
                    </div>
                  ) : (
                    <div className="-mx-2">
                      <FeatDiscovery 
                         charSpecies={char.species}
                         charStats={char.stats}
                         onAddFeat={(feat) => setSelectedFeat(feat)} 
                         allowAdd={true} 
                         charLevel={newTotalLevel} 
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {currentStep === 'spells' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-4">
                <h3 className="text-2xl font-black text-white mb-1">Arcane Expansion</h3>
                <p className="text-slate-400 text-xs">Scribe new spells from the <strong className="text-white">{targetClass}</strong> spell list.</p>
              </div>

              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 shadow-inner mb-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Newly Scribed</h4>
                <div className="flex flex-wrap gap-2">
                  {pickedSpells.map((spell, i) => (
                     <span key={i} className="bg-fuchsia-900/40 text-fuchsia-300 text-[10px] uppercase font-bold px-2 py-1 rounded-lg flex items-center gap-1.5 border border-fuchsia-700/50 shadow-sm">
                       {spell.name} <button onClick={() => setPickedSpells(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-400 transition-colors"><X className="w-3 h-3"/></button>
                     </span>
                  ))}
                  {pickedSpells.length === 0 && <span className="text-xs text-slate-600 italic">No spells selected yet.</span>}
                </div>
              </div>

              <div className="-mx-2">
                <SpellDiscovery 
                  className={targetClass} 
                  onAddSpell={(spell) => setPickedSpells(prev => [...prev, spell])} 
                  allowAdd={true} 
                  maxSpellLevel={9} 
                />
              </div>
            </div>
          )}

          {currentStep === 'confirm' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-6 mt-4">
                <ShieldPlus className="w-16 h-16 text-amber-400 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                <h3 className="text-3xl font-black text-white mb-1">Ready for Ascension</h3>
                <p className="text-slate-400 text-sm">Review your choices below before finalizing.</p>
              </div>

              <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800 shadow-inner space-y-4">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400 font-bold text-sm">New Level</span>
                  <span className="text-white font-black">{newTotalLevel} ({targetClass} {targetClassLevel})</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400 font-bold text-sm">Max HP Increase</span>
                  <span className="text-emerald-400 font-black">+{hpRollMethod === 'average' ? totalAverageHp : (parseInt(manualHpRoll, 10) || averageHpIncrease) + conMod}</span>
                </div>
                {asiChoice === 'stats' && totalAllocated > 0 && (
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400 font-bold text-sm">Stat Improvements</span>
                    <span className="text-amber-400 font-black">
                      {Object.entries(statAllocations).filter(([_, v]) => v > 0).map(([k, v]) => `+${v} ${k}`).join(', ')}
                    </span>
                  </div>
                )}
                {asiChoice === 'feat' && selectedFeat && (
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400 font-bold text-sm">New Feat</span>
                    <span className="text-amber-400 font-black">{selectedFeat.name}</span>
                  </div>
                )}
                {pickedSpells.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold text-sm">New Spells</span>
                    <span className="text-fuchsia-400 font-black text-right max-w-[200px] truncate">{pickedSpells.map(s => s.name).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        <div className="p-5 bg-slate-900/90 border-t border-slate-800 shrink-0 flex gap-4">
          {stepIndex > 0 ? (
            <button onClick={() => setStepIndex(s => s - 1)} disabled={isSaving} className="px-5 py-3 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors rounded-xl font-bold border border-slate-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-[62px]"></div>
          )}
          
          {stepIndex < steps.length - 1 ? (
             <button 
               onClick={() => setStepIndex(s => s + 1)} 
               disabled={!validateNextStep()}
               className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black text-sm uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg"
             >
               Next <ChevronRight className="w-5 h-5" />
             </button>
          ) : (
             <button onClick={handleConfirm} disabled={isSaving} className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-black text-sm uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)]">
               {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Ascension'}
             </button>
          )}
        </div>

      </div>
    </div>
  );
}