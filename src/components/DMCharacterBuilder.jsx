import { useState } from 'react';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserPlus, ChevronRight, ChevronLeft, Dices, X, Wand2, Backpack, BookOpen, Fingerprint, Plus, Trash2, Image as ImageIcon, Circle } from 'lucide-react';
import DialogModal from './shared/DialogModal';

export default function DMCharacterBuilder({ onClose }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  const [formData, setFormData] = useState({
    name: '',
    species: '',
    class: '',
    theme: 'indigo',
    stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    alignment: 'Neutral',
    backstory: '',
    inventory: '',
    speed: 30,
    imageUrl: '',
    tokenImg: ''
  });

  // Homebrew Species State
  const [isCustomSpecies, setIsCustomSpecies] = useState(false);
  const [customProfs, setCustomProfs] = useState({ languages: 'Common', skills: '', tools: '', weapons: '', armor: '' });
  const [speciesTraits, setSpeciesTraits] = useState([]);

  const steps = ['identity', 'attributes'];
  if (isCustomSpecies) steps.push('speciesForge');
  steps.push('lore');
  
  const currentStep = steps[stepIndex];

  const updateField = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));
  const updateStat = (stat, val) => setFormData(prev => ({ ...prev, stats: { ...prev.stats, [stat]: Number(val) } }));
  const updateProf = (field, val) => setCustomProfs(prev => ({ ...prev, [field]: val }));

  const rollStat = () => {
    const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1).sort((a, b) => b - a);
    return rolls[0] + rolls[1] + rolls[2];
  };

  const handleRollAll = () => {
    setFormData(prev => ({
      ...prev,
      stats: {
        STR: rollStat(), DEX: rollStat(), CON: rollStat(),
        INT: rollStat(), WIS: rollStat(), CHA: rollStat()
      }
    }));
  };

  const addTrait = () => setSpeciesTraits(prev => [...prev, { name: '', desc: '' }]);
  const updateTrait = (index, field, value) => {
    const newTraits = [...speciesTraits];
    newTraits[index][field] = value;
    setSpeciesTraits(newTraits);
  };
  const removeTrait = (index) => setSpeciesTraits(prev => prev.filter((_, i) => i !== index));

  const handleFinish = async () => {
    if (!formData.name) {
      setDialog({ isOpen: true, title: 'Missing Name', message: 'The character must have a name.', type: 'alert', onConfirm: closeDialog });
      return;
    }
    
    setIsSaving(true);
    try {
      const charId = `char_${Date.now()}`;
      const conMod = Math.floor((formData.stats.CON - 10) / 2);
      const dexMod = Math.floor((formData.stats.DEX - 10) / 2);

      const customFeatures = isCustomSpecies 
        ? speciesTraits.filter(t => t.name && t.desc).map(t => ({ name: `${formData.species} Trait: ${t.name}`, desc: t.desc }))
        : [];

      const newChar = {
        name: formData.name,
        species: formData.species || 'Human',
        class: formData.class || 'Fighter',
        classes: [{ name: formData.class || 'Fighter', level: 1 }],
        level: 1,
        theme: formData.theme,
        exp: 0,
        alignment: formData.alignment,
        hp: 10 + conMod,
        maxHp: 10 + conMod,
        tempHp: 0,
        hitDice: { current: 1, max: 1, type: 'd10' },
        ac: 10 + dexMod,
        speed: formData.speed,
        initiative: '--',
        spellSave: '--',
        spellAttack: '--',
        combatInitiative: null,
        inspiration: false,
        isConcentrating: false,
        conditions: [],
        hasCompletedTutorial: false,
        hasFetchedSpecies: isCustomSpecies, // Bypasses engine if homebrewed
        hasFetchedClass: false,
        journal: '',
        stats: formData.stats,
        currency: { assarions: 0, quadrans: 0, leptons: 0 },
        imageUrl: formData.imageUrl,
        img: formData.tokenImg,
        deathSaves: { successes: 0, failures: 0 },
        resources: [],
        spellSlots: {},
        spells: [],
        dmNotes: '',
        attacks: [],
        proficiencies: isCustomSpecies ? customProfs : { skills: '', tools: '', weapons: '', armor: '', languages: 'Common' },
        features: customFeatures,
        inventory: formData.inventory,
        traits: { personality: '', ideal: '', bond: '', flaws: '' },
        backstory: formData.backstory,
        notes: ''
      };

      const batch = writeBatch(db);
      
      const charRef = doc(db, 'characters', charId);
      batch.set(charRef, newChar);

      const sessionRef = doc(db, 'campaign', 'main_session');
      batch.update(sessionRef, { unlockedCharacters: [...(window.unlockedCharactersCache || []), charId] });

      await batch.commit();
      onClose();
    } catch (err) {
      console.error(err);
      setDialog({ isOpen: true, title: 'Error', message: 'Failed to construct character.', type: 'alert', onConfirm: closeDialog });
      setIsSaving(false);
    }
  };

  return (
    <>
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} onCancel={closeDialog} />
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none -z-10"></div>

        <div className="bg-slate-900 border border-indigo-500/50 rounded-3xl w-full max-w-3xl shadow-[0_0_60px_rgba(99,102,241,0.2)] flex flex-col max-h-[90dvh] relative overflow-hidden animate-in zoom-in-95 duration-300">
          
          <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 relative z-10 shrink-0">
            <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-widest"><UserPlus className="w-5 h-5 text-indigo-400" /> Construct Character</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl border border-slate-700"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex h-1.5 bg-slate-800 shrink-0">
             <div className="h-full bg-indigo-500 transition-all duration-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}></div>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            
            {currentStep === 'identity' && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 text-indigo-400 border-b border-slate-800 pb-2 mb-4">
                  <Wand2 className="w-5 h-5" /> <h3 className="font-bold uppercase tracking-widest text-sm">Identity & Path</h3>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Character Name</label>
                  <input type="text" onFocus={(e) => e.target.select()} value={formData.name} onChange={e => updateField('name', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-indigo-500 shadow-inner" placeholder="e.g. Grom the Unyielding" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950 border border-slate-700 rounded-xl p-3 shadow-inner">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Species</label>
                    <input type="text" onFocus={(e) => e.target.select()} value={formData.species} onChange={e => updateField('species', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 mb-3" placeholder="e.g. Elf, Tiefling, custom..." />
                    
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={isCustomSpecies} onChange={(e) => setIsCustomSpecies(e.target.checked)} className="w-4 h-4 rounded border-slate-600 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900 bg-slate-800" />
                      <span className="text-xs text-slate-300 group-hover:text-white transition-colors">This is a Custom/Homebrew Species</span>
                    </label>
                  </div>
                  
                  <div className="bg-slate-950 border border-slate-700 rounded-xl p-3 shadow-inner">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Arkla Class</label>
                    <input 
                      type="text" 
                      list="arkla-classes" 
                      onFocus={(e) => e.target.select()} 
                      value={formData.class} 
                      onChange={e => updateField('class', e.target.value)} 
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500" 
                      placeholder="Type or select a class..." 
                    />
                    <datalist id="arkla-classes">
                      <option value="Barbarian" />
                      <option value="Bard" />
                      <option value="Cleric" />
                      <option value="Druid" />
                      <option value="Fighter" />
                      <option value="Monk (Kolari)" />
                      <option value="Paladin" />
                      <option value="Ranger" />
                      <option value="Rogue" />
                      <option value="Sorcerer" />
                      <option value="Wizard" />
                      <option value="Pirate" />
                    </datalist>
                    <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">The engine will attempt to auto-fetch Level 1 features for standard classes. For Arkla-specific classes, leave this as their title and manually add traits later.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Aura / Theme Color</label>
                  <select value={formData.theme} onChange={e => updateField('theme', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 shadow-inner">
                    <option value="indigo">Tenari Void (Indigo)</option>
                    <option value="emerald">Smuggler's Emerald (Green)</option>
                    <option value="rose">Dragonfire Rose (Red/Pink)</option>
                    <option value="amber">Crown's Radiance (Gold)</option>
                    <option value="sky">Privateer's Sky (Blue)</option>
                  </select>
                </div>
              </div>
            )}

            {currentStep === 'attributes' && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
                  <div className="flex items-center gap-3 text-indigo-400">
                    <Dices className="w-5 h-5" /> <h3 className="font-bold uppercase tracking-widest text-sm">Attributes</h3>
                  </div>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center mb-6 shadow-inner">
                  <p className="text-sm text-slate-300 mb-4">Input the results of your physical dice rolls below, or allow the engine to digitally roll 4d6 (drop lowest) for you.</p>
                  <button onClick={handleRollAll} className="bg-indigo-900/40 hover:bg-indigo-600 text-indigo-300 hover:text-white px-5 py-2.5 rounded-xl text-xs uppercase font-black tracking-widest transition-colors border border-indigo-500/50 shadow-sm mx-auto flex items-center gap-2">
                    <Dices className="w-4 h-4" /> Digital Roll (4d6)
                  </button>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {Object.keys(formData.stats).map(stat => (
                    <div key={stat} className="bg-slate-900 border border-slate-700 rounded-xl p-3 flex flex-col items-center shadow-inner focus-within:border-indigo-500 transition-colors">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat}</span>
                      <input 
                        type="number" 
                        onFocus={(e) => e.target.select()}
                        value={formData.stats[stat]} 
                        onChange={(e) => updateStat(stat, e.target.value)}
                        className="w-full bg-transparent text-white font-black text-3xl text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 italic text-center mt-4">Modifier math will be automatically calculated by the engine upon login.</p>
              </div>
            )}

            {currentStep === 'speciesForge' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 text-emerald-400 border-b border-emerald-900/50 pb-2 mb-4">
                  <Fingerprint className="w-5 h-5" /> <h3 className="font-bold uppercase tracking-widest text-sm">Homebrew Species Forge</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-inner">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Base Speed (ft)</label>
                    <input type="number" onFocus={(e) => e.target.select()} value={formData.speed} onChange={e => updateField('speed', Number(e.target.value))} className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" />
                  </div>
                  
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-inner">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Languages</label>
                    <input type="text" onFocus={(e) => e.target.select()} value={customProfs.languages} onChange={e => updateProf('languages', e.target.value)} className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500" placeholder="e.g. Common, Elvish" />
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-inner md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Innate Proficiencies (Optional)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                       <input type="text" onFocus={(e) => e.target.select()} value={customProfs.skills} onChange={e => updateProf('skills', e.target.value)} className="bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none" placeholder="Skills (e.g. Stealth)" />
                       <input type="text" onFocus={(e) => e.target.select()} value={customProfs.weapons} onChange={e => updateProf('weapons', e.target.value)} className="bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none" placeholder="Weapons (e.g. Longsword)" />
                       <input type="text" onFocus={(e) => e.target.select()} value={customProfs.tools} onChange={e => updateProf('tools', e.target.value)} className="bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none" placeholder="Tools (e.g. Tinker's Tools)" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-inner">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unique Traits & Features</label>
                    <button onClick={addTrait} className="bg-emerald-900/40 hover:bg-emerald-600 text-emerald-400 hover:text-white px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest transition-colors flex items-center gap-1 border border-emerald-500/30 shadow-sm"><Plus className="w-3 h-3"/> Add Trait</button>
                  </div>

                  {speciesTraits.length === 0 ? (
                    <div className="text-center p-4 border border-dashed border-slate-700 rounded-lg text-xs text-slate-500 italic">No custom traits added yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {speciesTraits.map((trait, index) => (
                        <div key={index} className="bg-slate-950 border border-slate-700 rounded-lg p-3 relative group">
                          <button onClick={() => removeTrait(index)} className="absolute top-2 right-2 text-slate-600 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                          <input type="text" value={trait.name} onFocus={(e) => e.target.select()} onChange={e => updateTrait(index, 'name', e.target.value)} placeholder="Trait Name (e.g. Fey Ancestry)" className="w-11/12 bg-transparent text-emerald-300 font-bold text-sm focus:outline-none mb-2 border-b border-slate-800 focus:border-emerald-500 pb-1" />
                          <textarea value={trait.desc} onChange={e => updateTrait(index, 'desc', e.target.value)} placeholder="Describe the mechanics and lore..." className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 min-h-[60px] resize-y" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 'lore' && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 text-indigo-400 border-b border-slate-800 pb-2 mb-4">
                  <BookOpen className="w-5 h-5" /> <h3 className="font-bold uppercase tracking-widest text-sm">Lore & Aesthetics</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><ImageIcon className="w-3 h-3"/> Sheet Portrait URL</label>
                    <input type="url" onFocus={(e) => e.target.select()} value={formData.imageUrl} onChange={e => updateField('imageUrl', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 shadow-inner" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Circle className="w-3 h-3"/> Battle Token URL</label>
                    <input type="url" onFocus={(e) => e.target.select()} value={formData.tokenImg} onChange={e => updateField('tokenImg', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 shadow-inner" placeholder="https://..." />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Alignment</label>
                  <input type="text" onFocus={(e) => e.target.select()} value={formData.alignment} onChange={e => updateField('alignment', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 shadow-inner" placeholder="e.g. Chaotic Neutral" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Backpack className="w-3 h-3"/> Starting Inventory</label>
                  <textarea value={formData.inventory} onChange={e => updateField('inventory', e.target.value)} className="w-full h-24 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-indigo-500 shadow-inner resize-y custom-scrollbar" placeholder="• 1x Longsword..." />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><BookOpen className="w-3 h-3"/> Backstory</label>
                  <textarea value={formData.backstory} onChange={e => updateField('backstory', e.target.value)} className="w-full h-24 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-indigo-500 shadow-inner resize-y custom-scrollbar" placeholder="Born in the town of..." />
                </div>
              </div>
            )}

          </div>

          <div className="p-5 bg-slate-900/90 border-t border-slate-800 shrink-0 flex gap-4">
            {stepIndex > 0 ? <button onClick={() => setStepIndex(s => s - 1)} disabled={isSaving} className="px-5 py-3 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors rounded-xl font-bold border border-slate-600"><ChevronLeft className="w-5 h-5" /></button> : <div className="w-[62px]"></div>}
            
            {stepIndex < steps.length - 1 ? (
               <button onClick={() => setStepIndex(s => s + 1)} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg">Next Step <ChevronRight className="w-5 h-5" /></button>
            ) : (
               <button onClick={handleFinish} disabled={isSaving || !formData.name} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-sm uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]">Construct Character</button>
            )}
          </div>

        </div>
      </div>
    </>
  );
}