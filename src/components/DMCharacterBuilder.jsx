import { useState, useEffect } from 'react';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserPlus, ChevronRight, ChevronLeft, Dices, X, Wand2, Backpack, BookOpen, Fingerprint, Plus, Trash2, Shield, Sword, PawPrint, Search, Sparkles } from 'lucide-react';
import DialogModal from './shared/DialogModal';
import ImageSelector from './shared/ImageSelector';
import { fetchAllEquipment, fetchEquipmentDetails, fetchSpeciesData, fetchClassData } from '../services/srdApi';

export default function DMCharacterBuilder({ onClose }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  const [formData, setFormData] = useState({
    name: '',
    species: '',
    class: '',
    level: 1, // Restored: Starting Level
    theme: 'indigo',
    stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    alignment: 'Neutral',
    backstory: '',
    speed: 30,
    hitDie: 'd10', // Restored: Hit Die tracking
    imageUrl: '',
    tokenImg: '',
    // Restored: Bio Tab sync
    age: '', height: '', weight: '', eyes: '', skin: '', hair: ''
  });

  const [customProfs, setCustomProfs] = useState({ languages: 'Common', skills: '', tools: '', weapons: '', armor: '', savingThrows: '' });
  const [speciesTraits, setSpeciesTraits] = useState([]);
  
  const [srdSpeciesOffer, setSrdSpeciesOffer] = useState(null);
  const [srdClassOffer, setSrdClassOffer] = useState(null); 

  const [hasCompanion, setHasCompanion] = useState(false);
  const [companionData, setCompanionData] = useState({
    name: '', species: '', isDormant: false, awakeLevel: 1, hp: 10, ac: 10, speed: 30,
    stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }, attacks: '', desc: ''
  });

  const [inventory, setInventory] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', category: 'Adventuring Gear', damageDice: '1d8', damageType: 'Slashing', properties: '', ac: 14, quantity: 1, desc: '' });
  
  const [srdEquipmentList, setSrdEquipmentList] = useState([]);
  const [filteredEquip, setFilteredEquip] = useState([]);
  const [showEquipDropdown, setShowEquipDropdown] = useState(false);

  // The forge is now a permanent step in the flow
  const steps = ['identity', 'attributes', 'speciesForge', 'companion', 'inventory', 'lore'];
  const currentStep = steps[stepIndex];

  useEffect(() => {
    fetchAllEquipment().then(setSrdEquipmentList);
  }, []);

  // SRD Species Listener (No longer checking for isCustomSpecies)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.species.length > 2) {
        const data = await fetchSpeciesData(formData.species);
        if (data) setSrdSpeciesOffer(data);
      } else {
        setSrdSpeciesOffer(null);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [formData.species]);

  // SRD Class Listener
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.class.length > 2) {
        const data = await fetchClassData(formData.class);
        if (data) setSrdClassOffer(data);
      } else {
        setSrdClassOffer(null);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [formData.class]);

  const updateField = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));
  const updateStat = (stat, val) => setFormData(prev => ({ ...prev, stats: { ...prev.stats, [stat]: Number(val) } }));
  const updateProf = (field, val) => setCustomProfs(prev => ({ ...prev, [field]: val }));
  const updateCompField = (field, val) => setCompanionData(prev => ({ ...prev, [field]: val }));
  const updateCompStat = (stat, val) => setCompanionData(prev => ({ ...prev, stats: { ...prev.stats, [stat]: Number(val) } }));

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

  const handleApplySrdSpecies = () => {
    if (!srdSpeciesOffer) return;
    updateField('speed', srdSpeciesOffer.speed);
    updateProf('languages', srdSpeciesOffer.languages);
    setSpeciesTraits(srdSpeciesOffer.traits);
    setSrdSpeciesOffer(null);
  };

  const handleApplySrdClass = () => {
    if (!srdClassOffer) return;
    updateField('hitDie', srdClassOffer.hitDie);
    updateProf('armor', srdClassOffer.armor);
    updateProf('weapons', srdClassOffer.weapons);
    updateProf('savingThrows', srdClassOffer.savingThrows);
    if (srdClassOffer.skills) updateProf('skills', srdClassOffer.skills);
    if (srdClassOffer.tools) updateProf('tools', customProfs.tools ? `${customProfs.tools}, ${srdClassOffer.tools}` : srdClassOffer.tools);
    setSrdClassOffer(null);
  };

  const handleItemNameChange = (e) => {
    const val = e.target.value;
    setNewItem(prev => ({ ...prev, name: val }));
    
    if (val.length > 1) {
      setFilteredEquip(srdEquipmentList.filter(i => i.name.toLowerCase().includes(val.toLowerCase())));
      setShowEquipDropdown(true);
    } else {
      setShowEquipDropdown(false);
    }
  };

  const handleSelectSrdItem = async (indexStr) => {
    setShowEquipDropdown(false);
    const details = await fetchEquipmentDetails(indexStr);
    if (details) {
      setNewItem(prev => ({ ...prev, ...details, quantity: 1 }));
    }
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.name) return;
    
    const formattedItem = {
      id: `item_${Date.now()}`,
      name: newItem.name,
      category: newItem.category,
      quantity: Number(newItem.quantity) || 1,
      desc: newItem.desc,
      imageUrl: '',
      damageDice: newItem.category === 'Weapon' ? newItem.damageDice : null,
      damageType: newItem.category === 'Weapon' ? newItem.damageType : null,
      properties: newItem.category === 'Weapon' ? newItem.properties : null,
      ac: newItem.category === 'Armor' ? Number(newItem.ac) : null
    };

    setInventory(prev => [...prev, formattedItem]);
    setNewItem({ name: '', category: 'Adventuring Gear', damageDice: '1d8', damageType: 'Slashing', properties: '', ac: 14, quantity: 1, desc: '' });
  };

  const removeInventoryItem = (index) => setInventory(prev => prev.filter((_, i) => i !== index));

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

      // Now we always pass whatever traits were set, either manually or via Auto-Fill
      let finalFeatures = speciesTraits.filter(t => t.name && t.desc).map(t => ({ 
        name: `${formData.species || 'Base'} Trait: ${t.name}`, 
        desc: t.desc 
      }));
      
      // HP Auto-Scaler Engine
      const startLevel = Math.max(1, Number(formData.level) || 1);
      const hitDieValue = parseInt((formData.hitDie || 'd10').replace('d', ''), 10);
      const hitDieAvg = Math.floor(hitDieValue / 2) + 1; 
      
      const levelOneHp = hitDieValue + conMod;
      const higherLevelHp = (startLevel - 1) * Math.max(1, hitDieAvg + conMod);
      const totalMaxHp = levelOneHp + higherLevelHp;

      const newChar = {
        name: formData.name,
        species: formData.species || 'Human',
        class: formData.class || 'Fighter',
        classes: [{ name: formData.class || 'Fighter', level: startLevel }],
        level: startLevel,
        theme: formData.theme,
        exp: 0,
        alignment: formData.alignment,
        
        age: formData.age, height: formData.height, weight: formData.weight,
        eyes: formData.eyes, skin: formData.skin, hair: formData.hair,

        hp: totalMaxHp,
        maxHp: totalMaxHp,
        tempHp: 0,
        hitDice: { current: startLevel, max: startLevel, type: formData.hitDie },
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
        proficiencies: customProfs,
        features: finalFeatures,
        inventory: inventory,
        traits: { personality: '', ideal: '', bond: '', flaws: '' },
        backstory: formData.backstory,
        notes: '',
        levelUpPending: false,
        companion: hasCompanion ? {
          ...companionData,
          hp: Number(companionData.hp), ac: Number(companionData.ac),
          speed: Number(companionData.speed), awakeLevel: Number(companionData.awakeLevel)
        } : null
      };

      const batch = writeBatch(db);
      batch.set(doc(db, 'characters', charId), newChar);

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
                  <input 
                    type="text" 
                    onFocus={(e) => e.target.select()} 
                    value={formData.name} 
                    onChange={e => updateField('name', e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-indigo-500 shadow-inner" 
                    placeholder="e.g. Grom the Unyielding" 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-950 border border-slate-700 rounded-xl p-3 shadow-inner relative">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Species</label>
                    <input 
                      type="text" 
                      onFocus={(e) => e.target.select()} 
                      value={formData.species} 
                      onChange={e => updateField('species', e.target.value)} 
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" 
                      placeholder="e.g. Rock Gnome" 
                    />

                    {srdSpeciesOffer && (
                       <div className="absolute top-full left-0 right-0 mt-2 bg-indigo-900/90 backdrop-blur-md border border-indigo-500 rounded-xl p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                         <p className="text-xs text-indigo-200 font-bold mb-2 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5"/> SRD Data found for {srdSpeciesOffer.name}!</p>
                         <button onClick={handleApplySrdSpecies} className="w-full bg-indigo-500 hover:bg-indigo-400 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg transition-colors">
                           Auto-Fill Base Stats & Traits
                         </button>
                       </div>
                    )}
                  </div>
                  
                  <div className="bg-slate-950 border border-slate-700 rounded-xl p-3 shadow-inner relative">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Arkla Class</label>
                    <input 
                      type="text" 
                      value={formData.class} 
                      onChange={e => updateField('class', e.target.value)} 
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" 
                      placeholder="Type or select a class..." 
                    />

                    {srdClassOffer && (
                       <div className="absolute top-full left-0 right-0 mt-2 bg-indigo-900/90 backdrop-blur-md border border-indigo-500 rounded-xl p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                         <p className="text-xs text-indigo-200 font-bold mb-2 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5"/> SRD Data found for {srdClassOffer.name}!</p>
                         <button onClick={handleApplySrdClass} className="w-full bg-indigo-500 hover:bg-indigo-400 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg transition-colors">
                           Auto-Fill Hit Die & Profs
                         </button>
                       </div>
                    )}
                  </div>

                  <div className="bg-slate-950 border border-slate-700 rounded-xl p-3 shadow-inner">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Start Level</label>
                    <input 
                      type="number" 
                      min="1" max="20"
                      value={formData.level} 
                      onFocus={e => e.target.select()}
                      onChange={e => updateField('level', e.target.value)} 
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-bold text-center focus:outline-none focus:border-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" 
                    />
                    <p className="text-[9px] text-slate-500 mt-2 leading-tight">HP and Hit Dice will automatically scale to this level.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Aura / Theme Color</label>
                  <select 
                    value={formData.theme} 
                    onChange={e => updateField('theme', e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 shadow-inner"
                  >
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
                  <button 
                    onClick={handleRollAll} 
                    className="bg-indigo-900/40 hover:bg-indigo-600 text-indigo-300 hover:text-white px-5 py-2.5 rounded-xl text-xs uppercase font-black tracking-widest transition-colors border border-indigo-500/50 shadow-sm mx-auto flex items-center gap-2"
                  >
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
              </div>
            )}

            {currentStep === 'speciesForge' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 text-emerald-400 border-b border-emerald-900/50 pb-2 mb-4">
                  <Fingerprint className="w-5 h-5" /> <h3 className="font-bold uppercase tracking-widest text-sm">Species Forge & Proficiencies</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-inner">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Base Speed (ft)</label>
                    <input 
                      type="number" 
                      onFocus={(e) => e.target.select()} 
                      value={formData.speed} 
                      onChange={e => updateField('speed', Number(e.target.value))} 
                      className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" 
                    />
                  </div>
                  
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-inner">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Languages</label>
                    <input 
                      type="text" 
                      onFocus={(e) => e.target.select()} 
                      value={customProfs.languages} 
                      onChange={e => updateProf('languages', e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500" 
                      placeholder="e.g. Common, Elvish" 
                    />
                  </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-inner space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">Class & Background Proficiencies</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Skills</label>
                      <input type="text" value={customProfs.skills} onChange={e => updateProf('skills', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" placeholder="e.g. Athletics, Perception" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tools</label>
                      <input type="text" value={customProfs.tools} onChange={e => updateProf('tools', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" placeholder="e.g. Thieves' Tools" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Weapons</label>
                      <input type="text" value={customProfs.weapons} onChange={e => updateProf('weapons', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" placeholder="e.g. Simple Weapons" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Armor</label>
                      <input type="text" value={customProfs.armor} onChange={e => updateProf('armor', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" placeholder="e.g. Light, Medium" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-inner">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unique Traits & Features</label>
                    <button 
                      onClick={addTrait} 
                      className="bg-emerald-900/40 hover:bg-emerald-600 text-emerald-400 hover:text-white px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest transition-colors flex items-center gap-1 border border-emerald-500/30 shadow-sm"
                    >
                      <Plus className="w-3 h-3"/> Add Trait
                    </button>
                  </div>

                  {speciesTraits.map((trait, index) => (
                    <div key={index} className="bg-slate-950 border border-slate-700 rounded-lg p-3 relative group mb-3">
                      <button 
                        onClick={() => removeTrait(index)} 
                        className="absolute top-2 right-2 text-slate-600 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4"/>
                      </button>
                      <input 
                        type="text" 
                        value={trait.name} 
                        onChange={e => updateTrait(index, 'name', e.target.value)} 
                        placeholder="Trait Name" 
                        className="w-11/12 bg-transparent text-emerald-300 font-bold text-sm focus:outline-none mb-2 border-b border-slate-800 focus:border-emerald-500 pb-1" 
                      />
                      <textarea 
                        value={trait.desc} 
                        onChange={e => updateTrait(index, 'desc', e.target.value)} 
                        placeholder="Describe mechanics..." 
                        className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-xs text-slate-300 focus:outline-none min-h-[60px]" 
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 'companion' && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 text-emerald-400 border-b border-emerald-900/50 pb-2 mb-4">
                  <PawPrint className="w-5 h-5" /> <h3 className="font-bold uppercase tracking-widest text-sm">Companion Setup</h3>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-inner flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">Does this character have a companion?</h4>
                    <p className="text-xs text-slate-500">Enable this to provide a familiar, mount, or pet.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={hasCompanion} onChange={(e) => setHasCompanion(e.target.checked)} />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {hasCompanion && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Companion Name</label>
                        <input 
                          type="text" 
                          value={companionData.name} 
                          onChange={e => updateCompField('name', e.target.value)} 
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" 
                          placeholder="e.g. The Tiny Bear" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Species / Type</label>
                        <input 
                          type="text" 
                          value={companionData.species} 
                          onChange={e => updateCompField('species', e.target.value)} 
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" 
                          placeholder="e.g. Celestial Bear" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner">
                      <div className="sm:col-span-2">
                        <label className="flex items-center gap-2 cursor-pointer mt-1">
                          <input 
                            type="checkbox" 
                            checked={companionData.isDormant} 
                            onChange={(e) => updateCompField('isDormant', e.target.checked)} 
                            className="w-4 h-4 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500 bg-slate-800" 
                          />
                          <span className="text-sm font-bold text-slate-300">Is Dormant / Inactive?</span>
                        </label>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Awakens at Char Level</label>
                        <input 
                          type="number" 
                          disabled={!companionData.isDormant} 
                          value={companionData.awakeLevel} 
                          onChange={e => updateCompField('awakeLevel', e.target.value)} 
                          className="w-full bg-slate-900 disabled:opacity-50 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">HP</label>
                        <input 
                          type="number" 
                          value={companionData.hp} 
                          onChange={e => updateCompField('hp', e.target.value)} 
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-center font-bold focus:outline-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">AC</label>
                        <input 
                          type="number" 
                          value={companionData.ac} 
                          onChange={e => updateCompField('ac', e.target.value)} 
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-center font-bold focus:outline-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Speed</label>
                        <input 
                          type="number" 
                          value={companionData.speed} 
                          onChange={e => updateCompField('speed', e.target.value)} 
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-center font-bold focus:outline-none" 
                        />
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 shadow-inner">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Companion Stats</label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {Object.keys(companionData.stats).map(stat => (
                          <div key={stat} className="flex flex-col items-center">
                            <span className="text-[9px] text-slate-500 font-bold mb-1">{stat}</span>
                            <input 
                              type="number" 
                              value={companionData.stats[stat]} 
                              onChange={(e) => updateCompStat(stat, e.target.value)} 
                              className="w-full bg-slate-900 border border-slate-700 rounded text-white font-bold text-center py-1 focus:outline-none" 
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Actions & Description</label>
                      <textarea 
                        value={companionData.desc} 
                        onChange={e => updateCompField('desc', e.target.value)} 
                        className="w-full h-16 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 text-sm focus:outline-none resize-y" 
                        placeholder="Traits, attacks, and roleplaying notes..." 
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 'inventory' && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 text-indigo-400 border-b border-slate-800 pb-2 mb-4">
                  <Backpack className="w-5 h-5" /> <h3 className="font-bold uppercase tracking-widest text-sm">Starting Inventory</h3>
                </div>
                
                <form onSubmit={handleAddItem} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 shadow-inner space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Search className="w-3 h-3"/> Item Name (SRD Search)
                      </label>
                      <input 
                        type="text" 
                        value={newItem.name} 
                        onChange={handleItemNameChange} 
                        required 
                        className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" 
                        placeholder="e.g. Longsword" 
                      />
                      
                      {showEquipDropdown && filteredEquip.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto custom-scrollbar bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50">
                          {filteredEquip.map(item => (
                            <div 
                              key={item.index} 
                              onClick={() => handleSelectSrdItem(item.index)} 
                              className="px-3 py-2 text-sm text-slate-300 hover:bg-indigo-600 hover:text-white cursor-pointer border-b border-slate-800 last:border-0 transition-colors"
                            >
                              {item.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                      <select 
                        value={newItem.category} 
                        onChange={e => setNewItem({...newItem, category: e.target.value})} 
                        className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                      >
                        <option value="Weapon">Weapon</option>
                        <option value="Armor">Armor</option>
                        <option value="Adventuring Gear">Adventuring Gear</option>
                        <option value="Potion">Potion</option>
                      </select>
                    </div>
                  </div>

                  {newItem.category === 'Weapon' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-900 p-3 rounded-lg border border-slate-700">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1"><Sword className="w-3 h-3 inline"/> Damage</label>
                        <input 
                          type="text" 
                          value={newItem.damageDice} 
                          onChange={e => setNewItem({...newItem, damageDice: e.target.value})} 
                          className="w-full bg-slate-950 border border-slate-600 rounded-md px-2 py-1.5 text-white text-xs focus:outline-none" 
                          placeholder="1d8" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type</label>
                        <input 
                          type="text" 
                          value={newItem.damageType} 
                          onChange={e => setNewItem({...newItem, damageType: e.target.value})} 
                          className="w-full bg-slate-950 border border-slate-600 rounded-md px-2 py-1.5 text-white text-xs focus:outline-none" 
                          placeholder="Slashing" 
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Properties</label>
                        <input 
                          type="text" 
                          value={newItem.properties} 
                          onChange={e => setNewItem({...newItem, properties: e.target.value})} 
                          className="w-full bg-slate-950 border border-slate-600 rounded-md px-2 py-1.5 text-white text-xs focus:outline-none" 
                          placeholder="Finesse, Light" 
                        />
                      </div>
                    </div>
                  )}

                  {newItem.category === 'Armor' && (
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1"><Shield className="w-3 h-3 inline"/> Armor Class (AC)</label>
                      <input 
                        type="number" 
                        value={newItem.ac} 
                        onChange={e => setNewItem({...newItem, ac: e.target.value})} 
                        className="w-full bg-slate-950 border border-slate-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none" 
                      />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <div className="w-20">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Qty</label>
                      <input 
                        type="number" 
                        value={newItem.quantity} 
                        onChange={e => setNewItem({...newItem, quantity: e.target.value})} 
                        className="w-full bg-slate-950 border border-slate-600 rounded-lg px-2 py-2 text-center text-white text-sm focus:outline-none" 
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                      <input 
                        type="text" 
                        value={newItem.desc} 
                        onChange={e => setNewItem({...newItem, desc: e.target.value})} 
                        className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" 
                        placeholder="Short description..." 
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-lg flex justify-center items-center gap-2">
                    <Plus className="w-4 h-4"/> Add to Bags
                  </button>
                </form>

                <div className="space-y-2 mt-4">
                  {inventory.length === 0 ? (
                    <p className="text-center text-slate-500 italic text-xs">No starting items added.</p>
                  ) : (
                    inventory.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-700">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">{item.quantity}x {item.name}</span>
                          <span className="text-[9px] text-slate-400 uppercase tracking-widest">{item.category} {item.damageDice ? `(${item.damageDice})` : ''}</span>
                        </div>
                        <button 
                          onClick={() => removeInventoryItem(idx)} 
                          className="text-slate-500 hover:text-red-400 p-2"
                        >
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    ))
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
                  <ImageSelector 
                    label="Sheet Portrait"
                    value={formData.imageUrl}
                    onChange={(val) => updateField('imageUrl', val)}
                    inputClassName="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 shadow-inner"
                  />
                  <ImageSelector 
                    label="Battle Token"
                    value={formData.tokenImg}
                    onChange={(val) => updateField('tokenImg', val)}
                    inputClassName="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 shadow-inner"
                  />
                </div>
                
                {/* BIO TAB SYNC: Physical Appearance */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 shadow-inner">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Physical Appearance (Optional)</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {[
                      { label: 'Age', field: 'age', placeholder: '24' },
                      { label: 'Height', field: 'height', placeholder: '5\'10"' },
                      { label: 'Weight', field: 'weight', placeholder: '160 lbs' },
                      { label: 'Eyes', field: 'eyes', placeholder: 'Emerald' },
                      { label: 'Skin', field: 'skin', placeholder: 'Fair' },
                      { label: 'Hair', field: 'hair', placeholder: 'Black' }
                    ].map((item) => (
                      <div key={item.field} className="bg-slate-950 border border-slate-700 rounded-lg p-2 focus-within:border-indigo-500 transition-colors">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">{item.label}</span>
                        <input 
                          type="text" 
                          value={formData[item.field]} 
                          onChange={(e) => updateField(item.field, e.target.value)} 
                          placeholder={item.placeholder}
                          className="w-full bg-transparent text-white text-xs font-bold focus:outline-none placeholder-slate-700" 
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Alignment</label>
                  <input 
                    type="text" 
                    onFocus={(e) => e.target.select()} 
                    value={formData.alignment} 
                    onChange={e => updateField('alignment', e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 shadow-inner" 
                    placeholder="e.g. Chaotic Neutral" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><BookOpen className="w-3 h-3"/> Backstory</label>
                  <textarea 
                    value={formData.backstory} 
                    onChange={e => updateField('backstory', e.target.value)} 
                    className="w-full h-24 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-indigo-500 shadow-inner resize-y custom-scrollbar" 
                    placeholder="Born in the town of..." 
                  />
                </div>
              </div>
            )}

          </div>

          <div className="p-5 bg-slate-900/90 border-t border-slate-800 shrink-0 flex gap-4">
            {stepIndex > 0 ? (
              <button 
                onClick={() => setStepIndex(s => s - 1)} 
                disabled={isSaving} 
                className="px-5 py-3 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors rounded-xl font-bold border border-slate-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : <div className="w-[62px]"></div>}
            
            {stepIndex < steps.length - 1 ? (
               <button 
                 onClick={() => setStepIndex(s => s + 1)} 
                 className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg"
               >
                 Next Step <ChevronRight className="w-5 h-5" />
               </button>
            ) : (
               <button 
                 onClick={handleFinish} 
                 disabled={isSaving || !formData.name} 
                 className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-sm uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
               >
                 {isSaving ? 'Scribing Data...' : 'Construct Character'}
               </button>
            )}
          </div>

        </div>
      </div>
    </>
  );
}