import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Save, X, AlertTriangle, Plus, Trash2, PawPrint, Sparkles, Wand2 } from 'lucide-react';
import { calculateSpellcastingStats } from '../services/arklaEngine';
import { fetchSpeciesData, fetchClassData } from '../services/srdApi';

export default function DMEditSheet({ char, charId, onCancel }) {
  const [formData, setFormData] = useState({
    name: char.name,
    class: char.class,
    species: char.species || char.race,
    level: char.level,
    hitDie: char.hitDice?.type || 'd10',
    ac: char.ac,
    speed: char.speed,
    initiative: char.initiative,
    maxHp: char.maxHp,
    stats: { ...char.stats }
  });

  const [resources, setResources] = useState(char.resources || []);
  const [companionData, setCompanionData] = useState(char.companion || null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [srdSpeciesOffer, setSrdSpeciesOffer] = useState(null);
  const [srdClassOffer, setSrdClassOffer] = useState(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.species?.length > 2 && formData.species !== char.species && formData.species !== char.race) {
        const data = await fetchSpeciesData(formData.species);
        if (data) setSrdSpeciesOffer(data);
      } else setSrdSpeciesOffer(null);
    }, 800);
    return () => clearTimeout(timer);
  }, [formData.species, char.species, char.race]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.class?.length > 2 && formData.class !== char.class) {
        const data = await fetchClassData(formData.class);
        if (data) setSrdClassOffer(data);
      } else setSrdClassOffer(null);
    }, 800);
    return () => clearTimeout(timer);
  }, [formData.class, char.class]);

  const handleApplySrdSpecies = () => {
    if (!srdSpeciesOffer) return;
    handleChange('speed', srdSpeciesOffer.speed);
    setSrdSpeciesOffer(null);
  };

  const handleApplySrdClass = () => {
    if (!srdClassOffer) return;
    handleChange('hitDie', srdClassOffer.hitDie);
    setSrdClassOffer(null);
  };

  const handleRecalculateHP = () => {
    const startLevel = Math.max(1, Number(formData.level) || 1);
    const hitDieValue = parseInt((formData.hitDie || 'd10').replace('d', ''), 10);
    const hitDieAvg = Math.floor(hitDieValue / 2) + 1; 
    const conMod = Math.floor((formData.stats.CON - 10) / 2);
    
    const levelOneHp = hitDieValue + conMod;
    const higherLevelHp = (startLevel - 1) * Math.max(1, hitDieAvg + conMod);
    const totalMaxHp = levelOneHp + higherLevelHp;
    
    handleChange('maxHp', totalMaxHp);
  };

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleStatChange = (stat, value) => setFormData(prev => ({ ...prev, stats: { ...prev.stats, [stat]: Number(value) } }));
  const handleCompanionChange = (field, value) => { if (companionData) setCompanionData(prev => ({ ...prev, [field]: value })); };

  const addResource = () => setResources([...resources, { name: 'New Tracker', max: 1, current: 1, recharge: 'long', isPool: false }]);
  const updateResource = (idx, field, val) => {
    const newRes = [...resources];
    newRes[idx][field] = field === 'max' || field === 'current' ? Number(val) : val;
    setResources(newRes);
  };
  const removeResource = (idx) => setResources(resources.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const charRef = doc(db, 'characters', charId);
      const mapRef = doc(db, 'campaign', 'battlemap');

      const newMaxHp = Number(formData.maxHp);
      const newSpeed = Number(formData.speed);

      const classesToPass = char.classes || [{ name: formData.class, level: Number(formData.level) }];
      const spellStats = calculateSpellcastingStats(classesToPass, formData.stats);

      let updates = {
        name: formData.name,
        class: formData.class,
        species: formData.species,
        level: Number(formData.level),
        ac: Number(formData.ac),
        speed: newSpeed,
        initiative: char.initiative === '--' ? '--' : Number(formData.initiative),
        maxHp: newMaxHp,
        stats: formData.stats,
        resources: resources,
        levelUpPending: false 
      };

      if (formData.hitDie !== char.hitDice?.type || Number(formData.level) !== char.level) {
         updates.hitDice = { current: Number(formData.level), max: Number(formData.level), type: formData.hitDie };
      }

      if (companionData) {
        updates.companion = {
           ...companionData, hp: Number(companionData.hp), ac: Number(companionData.ac), speed: Number(companionData.speed)
        };
      }

      if (spellStats.spellSave !== '--') {
        updates.spellSave = spellStats.spellSave;
        updates.spellAttack = spellStats.spellAttack;
      }

      updateDoc(charRef, updates).catch(console.error);

      getDoc(mapRef).then(mapDoc => {
        if (mapDoc.exists() && mapDoc.data().tokens && mapDoc.data().tokens[charId]) {
          let mapUpdates = { [`tokens.${charId}.maxHp`]: newMaxHp, [`tokens.${charId}.speed`]: newSpeed };
          if (mapDoc.data().tokens[charId].hp > newMaxHp) mapUpdates[`tokens.${charId}.hp`] = newMaxHp;
          updateDoc(mapRef, mapUpdates).catch(console.error);
        }
      });
      
      onCancel(); 
    } catch (error) {
      console.error("Error saving character:", error);
      setIsSaving(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-900 z-50 p-6 overflow-y-auto custom-scrollbar flex flex-col">
      <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-6 shrink-0">
        <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> DM Editing Suite
        </h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Character Name</label>
            <input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Level (Total)</label>
            <input type="number" onFocus={(e) => e.target.select()} value={formData.level} onChange={e => handleChange('level', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          </div>
          
          <div className="relative">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Class & Level(s)</label>
            <input type="text" value={formData.class} onChange={e => handleChange('class', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500" placeholder="e.g. Fighter 3" />
            {srdClassOffer && (
               <div className="absolute top-full left-0 right-0 mt-2 bg-slate-950 border border-amber-500 rounded-lg p-2 shadow-2xl z-50">
                 <p className="text-[10px] text-amber-200 font-bold mb-1.5 flex items-center gap-1.5"><Sparkles className="w-3 h-3"/> SRD Class found!</p>
                 <button onClick={handleApplySrdClass} className="w-full bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest py-1.5 rounded transition-colors">
                   Auto-Fill Hit Die
                 </button>
               </div>
            )}
          </div>
          
          <div className="relative">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Species</label>
            <input type="text" value={formData.species} onChange={e => handleChange('species', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
            {srdSpeciesOffer && (
               <div className="absolute top-full left-0 right-0 mt-2 bg-slate-950 border border-amber-500 rounded-lg p-2 shadow-2xl z-50">
                 <p className="text-[10px] text-amber-200 font-bold mb-1.5 flex items-center gap-1.5"><Sparkles className="w-3 h-3"/> SRD Species found!</p>
                 <button onClick={handleApplySrdSpecies} className="w-full bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest py-1.5 rounded transition-colors">
                   Auto-Fill Base Speed
                 </button>
               </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Hit Die</label>
            <input type="text" onFocus={(e) => e.target.select()} value={formData.hitDie} onChange={e => handleChange('hitDie', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500" placeholder="d10" />
          </div>
          <div className="relative col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Max HP</label>
            <div className="flex gap-2">
               <input type="number" onFocus={(e) => e.target.select()} value={formData.maxHp} onChange={e => handleChange('maxHp', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
               <button onClick={handleRecalculateHP} title="Auto-Scale HP (5e Math)" className="bg-amber-600 hover:bg-amber-500 text-white px-3 rounded flex items-center justify-center transition-colors shadow-inner"><Wand2 className="w-4 h-4"/></button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Armor Class</label>
            <input type="number" onFocus={(e) => e.target.select()} value={formData.ac} onChange={e => handleChange('ac', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Initiative Mod</label>
            <input type="text" onFocus={(e) => e.target.select()} value={formData.initiative} onChange={e => handleChange('initiative', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Speed (ft)</label>
            <input type="number" onFocus={(e) => e.target.select()} value={formData.speed} onChange={e => handleChange('speed', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          </div>
        </div>

        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Base Ability Scores</label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {Object.keys(formData.stats).map(stat => (
              <div key={stat} className="bg-slate-900 border border-slate-600 rounded p-2 text-center focus-within:border-amber-500 transition-colors">
                <span className="text-[10px] text-slate-500 font-bold block mb-1">{stat}</span>
                <input 
                  type="number" 
                  onFocus={(e) => e.target.select()}
                  value={formData.stats[stat]} 
                  onChange={e => handleStatChange(stat, e.target.value)} 
                  className="w-full bg-transparent text-center text-white font-bold text-xl focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                />
              </div>
            ))}
          </div>
        </div>

        {companionData && (
          <div className="bg-slate-800 p-4 rounded-xl border border-emerald-900/50">
            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
               <label className="block text-xs font-bold text-emerald-400 uppercase flex items-center gap-2">
                 <PawPrint className="w-4 h-4"/> Companion: {companionData.name}
               </label>
               <label className="flex items-center gap-2 cursor-pointer">
                 <input type="checkbox" checked={companionData.isDormant} onChange={(e) => handleCompanionChange('isDormant', e.target.checked)} className="w-4 h-4 rounded border-slate-600 text-emerald-500 bg-slate-900 focus:ring-emerald-500" />
                 <span className="text-xs font-bold text-slate-300">Is Dormant?</span>
               </label>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Max HP</label>
                <input type="number" onFocus={(e) => e.target.select()} value={companionData.hp} onChange={e => handleCompanionChange('hp', e.target.value)} className="w-full bg-slate-950 border border-slate-600 rounded px-3 py-2 text-white font-bold text-center focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Armor Class</label>
                <input type="number" onFocus={(e) => e.target.select()} value={companionData.ac} onChange={e => handleCompanionChange('ac', e.target.value)} className="w-full bg-slate-950 border border-slate-600 rounded px-3 py-2 text-white font-bold text-center focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Speed (ft)</label>
                <input type="number" onFocus={(e) => e.target.select()} value={companionData.speed} onChange={e => handleCompanionChange('speed', e.target.value)} className="w-full bg-slate-950 border border-slate-600 rounded px-3 py-2 text-white font-bold text-center focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <div className="flex justify-between items-center mb-4">
             <label className="block text-xs font-bold text-slate-400 uppercase">Resource Trackers</label>
             <button onClick={addResource} className="bg-slate-900 hover:bg-slate-700 text-amber-400 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 border border-slate-600"><Plus className="w-3 h-3"/> Add Tracker</button>
          </div>
          {resources.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No trackers added. Useful for Action Surge, Ki, Bardic Inspiration, etc.</p>
          ) : (
            <div className="space-y-3">
               {resources.map((res, idx) => (
                  <div key={idx} className="flex gap-3 items-end bg-slate-900 p-3 rounded-lg border border-slate-700">
                     <div className="flex-1">
                        <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Tracker Name</label>
                        <input type="text" value={res.name} onChange={e => updateResource(idx, 'name', e.target.value)} className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-amber-500" />
                     </div>
                     <div className="w-20">
                        <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Max Uses</label>
                        <input type="number" value={res.max} onChange={e => updateResource(idx, 'max', e.target.value)} className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-amber-500" />
                     </div>
                     <div className="w-24">
                        <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Recharge On</label>
                        <select value={res.recharge} onChange={e => updateResource(idx, 'recharge', e.target.value)} className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-amber-500">
                           <option value="short">Short Rest</option>
                           <option value="long">Long Rest</option>
                           <option value="none">Never</option>
                        </select>
                     </div>
                     <button onClick={() => removeResource(idx)} className="text-slate-500 hover:text-red-400 p-2"><Trash2 className="w-4 h-4"/></button>
                  </div>
               ))}
            </div>
          )}
        </div>

      </div>

      <div className="mt-8 shrink-0 bg-slate-900/80 p-4 rounded-xl border border-slate-700 flex justify-end items-center gap-4">
        {isConfirming ? (
          <>
            <span className="text-amber-400 font-bold text-sm">Apply permanent changes to database?</span>
            <button onClick={() => setIsConfirming(false)} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={isSaving} className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(217,119,6,0.4)]">
              {isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Confirm Save</>}
            </button>
          </>
        ) : (
          <button onClick={() => setIsConfirming(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg">
            <Save className="w-4 h-4" /> Review & Save
          </button>
        )}
      </div>
    </div>
  );
}