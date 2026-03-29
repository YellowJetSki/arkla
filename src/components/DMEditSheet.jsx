import { useState } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Save, X, AlertTriangle } from 'lucide-react';
import { calculateSpellcastingStats } from '../services/arklaEngine';

export default function DMEditSheet({ char, charId, onCancel }) {
  const [formData, setFormData] = useState({
    name: char.name,
    class: char.class,
    species: char.species || char.race,
    level: char.level,
    ac: char.ac,
    speed: char.speed,
    initiative: char.initiative,
    maxHp: char.maxHp,
    stats: { ...char.stats }
  });

  const [isConfirming, setIsConfirming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStatChange = (stat, value) => {
    setFormData(prev => ({
      ...prev,
      stats: { ...prev.stats, [stat]: Number(value) }
    }));
  };

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
        stats: formData.stats
      };

      if (spellStats.spellSave !== '--') {
        updates.spellSave = spellStats.spellSave;
        updates.spellAttack = spellStats.spellAttack;
      }

      updateDoc(charRef, updates).catch(console.error);

      getDoc(mapRef).then(mapDoc => {
        if (mapDoc.exists() && mapDoc.data().tokens && mapDoc.data().tokens[charId]) {
          let mapUpdates = {
            [`tokens.${charId}.maxHp`]: newMaxHp,
            [`tokens.${charId}.speed`]: newSpeed
          };
          if (mapDoc.data().tokens[charId].hp > newMaxHp) {
             mapUpdates[`tokens.${charId}.hp`] = newMaxHp;
          }
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
          <AlertTriangle className="w-5 h-5" /> Deep Edit Mode
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
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Class</label>
            <input type="text" value={formData.class} onChange={e => handleChange('class', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Species</label>
            <input type="text" value={formData.species} onChange={e => handleChange('species', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Max HP</label>
            <input type="number" onFocus={(e) => e.target.select()} value={formData.maxHp} onChange={e => handleChange('maxHp', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
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
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Speed</label>
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