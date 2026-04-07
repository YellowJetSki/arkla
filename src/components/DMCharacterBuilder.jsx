import { useState, useEffect } from 'react';
import { doc, writeBatch, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserPlus, ChevronRight, ChevronLeft, X, Edit3, Trash2 } from 'lucide-react';
import DialogModal from './shared/DialogModal';
import { fetchAllEquipment, fetchEquipmentDetails, fetchSpeciesData, fetchClassData, fetchClassProgression } from '../services/srdApi';
import { calculateSpellcastingStats } from '../services/arklaEngine';

import StepIdentity from './builder-steps/StepIdentity';
import StepAttributes from './builder-steps/StepAttributes';
import StepTraits from './builder-steps/StepTraits';
import StepFeatures from './builder-steps/StepFeatures';
import StepSpells from './builder-steps/StepSpells';
import StepCompanion from './builder-steps/StepCompanion';
import StepInventory from './builder-steps/StepInventory';
import StepLore from './builder-steps/StepLore';

export default function DMCharacterBuilder({ onClose, initialData = null, charId = null }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  const [formData, setFormData] = useState({
    name: '', species: '', class: '', level: 1, theme: 'indigo',
    stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    alignment: 'Neutral', backstory: '', speed: 30, hitDie: 'd10', 
    imageUrl: '', tokenImg: '', age: '', height: ''
  });

  const [customProfs, setCustomProfs] = useState({ languages: 'Common', skills: '', tools: '', weapons: '', armor: '', savingThrows: '' });
  
  const [speciesTraits, setSpeciesTraits] = useState([]);
  const [classFeatures, setClassFeatures] = useState([]);
  
  const [spellcastingMeta, setSpellcastingMeta] = useState(null);
  const [spells, setSpells] = useState([]);
  const [forceShowSpells, setForceShowSpells] = useState(false);
  
  const [srdSpeciesOffer, setSrdSpeciesOffer] = useState(null);
  const [srdClassOffer, setSrdClassOffer] = useState(null); 

  const [hasCompanion, setHasCompanion] = useState(false);
  const [companionData, setCompanionData] = useState({
    name: '', species: '', isDormant: false, awakeLevel: 1, hp: 10, ac: 10, speed: 30,
    stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }, attacks: '', traits: ''
  });

  const [inventory, setInventory] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', category: 'Adventuring Gear', damageDice: '1d8', damageType: 'Slashing', properties: '', range: '', ac: 14, quantity: 1, desc: '', imageUrl: '' });
  const [srdEquipmentList, setSrdEquipmentList] = useState([]);
  const [filteredEquip, setFilteredEquip] = useState([]);
  const [showEquipDropdown, setShowEquipDropdown] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '', species: initialData.species || '', class: initialData.class || '', 
        level: initialData.level || 1, theme: initialData.theme || 'indigo',
        stats: initialData.stats || { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
        alignment: initialData.alignment || 'Neutral', backstory: initialData.backstory || '', 
        speed: initialData.speed || 30, hitDie: initialData.hitDice?.type || 'd10', 
        imageUrl: initialData.imageUrl || '', tokenImg: initialData.img || '', 
        age: initialData.age || '', height: initialData.height || ''
      });

      if (initialData.proficiencies) setCustomProfs(initialData.proficiencies);
      if (initialData.features) {
        setSpeciesTraits(initialData.features.filter(f => !f.name.includes('Class Feature')));
        setClassFeatures(initialData.features.filter(f => f.name.includes('Class Feature')));
      }
      if (initialData.inventory) setInventory(initialData.inventory);
      if (initialData.spells) setSpells(initialData.spells);
      if (initialData.spellSlots && Object.keys(initialData.spellSlots).length > 0) setForceShowSpells(true);
      if (initialData.companion) {
        setHasCompanion(true);
        setCompanionData({
          ...initialData.companion,
          attacks: initialData.companion.attacks || '',
          traits: initialData.companion.traits || ''
        });
      }
    }
  }, [initialData]);

  useEffect(() => { fetchAllEquipment().then(setSrdEquipmentList); }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.species.length > 2 && (!initialData || formData.species !== initialData.species)) {
        const data = await fetchSpeciesData(formData.species);
        if (data) setSrdSpeciesOffer(data);
      } else setSrdSpeciesOffer(null);
    }, 800);
    return () => clearTimeout(timer);
  }, [formData.species, initialData]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.class.length > 2 && (!initialData || formData.class !== initialData.class)) {
        const data = await fetchClassData(formData.class);
        if (data) setSrdClassOffer(data);
      } else setSrdClassOffer(null);
    }, 800);
    return () => clearTimeout(timer);
  }, [formData.class, initialData]);

  const hasSpells = !!spellcastingMeta || forceShowSpells || spells.length > 0;
  const steps = ['identity', 'attributes', 'traits', 'features', ...(hasSpells ? ['spells'] : []), 'companion', 'inventory', 'lore'];
  const currentStep = steps[stepIndex];

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
    setFormData(prev => ({ ...prev, stats: { STR: rollStat(), DEX: rollStat(), CON: rollStat(), INT: rollStat(), WIS: rollStat(), CHA: rollStat() } }));
  };

  const handleApplySrdSpecies = () => {
    if (!srdSpeciesOffer) return;
    updateField('speed', srdSpeciesOffer.speed);
    updateProf('languages', srdSpeciesOffer.languages);
    setSpeciesTraits(srdSpeciesOffer.traits);
    setSrdSpeciesOffer(null);
  };

  const handleApplySrdClass = async () => {
    if (!srdClassOffer) return;
    updateField('hitDie', srdClassOffer.hitDie);
    updateProf('armor', srdClassOffer.armor);
    updateProf('weapons', srdClassOffer.weapons);
    updateProf('savingThrows', srdClassOffer.savingThrows);
    
    if (srdClassOffer.skills) updateProf('skills', srdClassOffer.skills.replace(/Arcana/g, 'Books'));
    
    if (srdClassOffer.tools) updateProf('tools', customProfs.tools ? `${customProfs.tools}, ${srdClassOffer.tools}` : srdClassOffer.tools);
    
    const startLevel = Math.max(1, Number(formData.level) || 1);
    const prog = await fetchClassProgression(formData.class, startLevel);
    if (prog) {
      setClassFeatures(prog.features);
      setSpellcastingMeta(prog.spellcasting);
    }
    setSrdClassOffer(null);
  };

  const handleItemNameChange = (e) => {
    const val = e.target.value;
    setNewItem(prev => ({ ...prev, name: val }));
    if (val.length > 1) {
      const searchTerms = val.toLowerCase().split(' ').filter(Boolean);
      setFilteredEquip(srdEquipmentList.filter(i => {
        const itemName = i.name.toLowerCase();
        if (val.toLowerCase().includes('health potion') && itemName.includes('potion of healing')) return true;
        return searchTerms.every(term => itemName.includes(term));
      }));
      setShowEquipDropdown(true);
    } else setShowEquipDropdown(false);
  };

  const handleSelectSrdItem = async (urlOrIndex) => {
    setShowEquipDropdown(false);
    const details = await fetchEquipmentDetails(urlOrIndex);
    if (details) setNewItem(prev => ({ ...prev, ...details, quantity: 1 }));
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.name) return;
    const formattedItem = {
      id: `item_${Date.now()}`, name: newItem.name, category: newItem.category, quantity: Number(newItem.quantity) || 1,
      desc: newItem.desc, imageUrl: newItem.imageUrl || '', damageDice: newItem.category === 'Weapon' ? newItem.damageDice : null,
      damageType: newItem.category === 'Weapon' ? newItem.damageType : null, properties: newItem.category === 'Weapon' ? newItem.properties : null,
      range: newItem.category === 'Weapon' ? newItem.range : null,
      ac: newItem.category === 'Armor' ? Number(newItem.ac) : null
    };
    setInventory(prev => [...prev, formattedItem]);
    setNewItem({ name: '', category: 'Adventuring Gear', damageDice: '1d8', damageType: 'Slashing', properties: '', range: '', ac: 14, quantity: 1, desc: '', imageUrl: '' });
  };

  const removeInventoryItem = (index) => setInventory(prev => prev.filter((_, i) => i !== index));

  const handleDeleteCharacter = () => {
    setDialog({
      isOpen: true,
      title: 'Destroy Character?',
      message: `Are you absolutely sure you want to permanently delete ${formData.name}? This will wipe their sheet from the Vault forever.`,
      type: 'confirm',
      onConfirm: async () => {
        setIsSaving(true);
        try {
          await deleteDoc(doc(db, 'characters', charId));
          closeDialog();
          onClose();
        } catch(e) {
          console.error(e);
          setDialog({ isOpen: true, title: 'Error', message: 'Failed to delete character.', type: 'alert', onConfirm: closeDialog });
          setIsSaving(false);
        }
      }
    });
  };

  const handleFinish = async () => {
    if (!formData.name) {
      setDialog({ isOpen: true, title: 'Missing Name', message: 'The character must have a name.', type: 'alert', onConfirm: closeDialog });
      return;
    }
    
    setIsSaving(true);
    try {
      const finalCharId = initialData ? charId : `char_${Date.now()}`;
      const conMod = Math.floor((formData.stats.CON - 10) / 2);
      const dexMod = Math.floor((formData.stats.DEX - 10) / 2);

      const combinedFeatures = [
        ...speciesTraits.filter(t => t.name && t.desc).map(t => ({ name: t.name.includes('Trait:') ? t.name : `${formData.species || 'Base'} Trait: ${t.name}`, desc: t.desc, isDefensive: t.isDefensive || false })),
        ...classFeatures.filter(f => f.name && f.desc).map(f => ({ name: f.name.includes('Class Feature') ? f.name : `Class Feature: ${f.name}`, desc: f.desc, isDefensive: f.isDefensive || false }))
      ];
      
      let startLevel = Math.max(1, Number(formData.level) || 1);
      
      let classesToPass = [];
      if (formData.class && formData.class.includes('/')) {
          classesToPass = formData.class.split('/').map(c => {
              const parts = c.trim().split(' ');
              return { name: parts[0] || 'Unknown', level: parseInt(parts[1]) || 1 };
          });
          startLevel = classesToPass.reduce((sum, c) => sum + (c.level || 1), 0);
      } else {
          classesToPass = [{ name: formData.class || 'Fighter', level: startLevel }];
      }

      const hitDieValue = parseInt((formData.hitDie || 'd10').replace('d', ''), 10);
      const hitDieAvg = Math.floor(hitDieValue / 2) + 1; 
      
      const levelOneHp = hitDieValue + conMod;
      const higherLevelHp = (startLevel - 1) * Math.max(1, hitDieAvg + conMod);
      const totalMaxHp = levelOneHp + higherLevelHp;

      const slots = initialData?.spellSlots || {};
      if (spellcastingMeta) {
         Object.keys(spellcastingMeta).forEach(key => {
           if (key.startsWith('spell_slots_level_')) {
             const lvl = key.replace('spell_slots_level_', '');
             if (spellcastingMeta[key] > 0) {
                 slots[lvl] = { 
                     current: slots[lvl] ? Math.min(slots[lvl].current, spellcastingMeta[key]) : spellcastingMeta[key], 
                     max: spellcastingMeta[key] 
                 };
             }
           }
         });
      }

      const spellStats = calculateSpellcastingStats(classesToPass, formData.stats);

      const payload = {
        name: formData.name, species: formData.species || 'Human', class: formData.class || 'Fighter',
        classes: classesToPass, level: startLevel, theme: formData.theme,
        alignment: formData.alignment,
        age: formData.age, height: formData.height,
        maxHp: totalMaxHp, hitDice: { current: initialData ? initialData.hitDice?.current : startLevel, max: startLevel, type: formData.hitDie },
        ac: 10 + dexMod, speed: formData.speed,
        spellSave: spellStats.spellSave || '--', spellAttack: spellStats.spellAttack || '--',
        stats: formData.stats, imageUrl: formData.imageUrl, img: formData.tokenImg,
        spellSlots: slots, spells: spells, proficiencies: customProfs, features: combinedFeatures, inventory: inventory,
        backstory: formData.backstory,
        companion: hasCompanion ? { ...companionData, hp: Number(companionData.hp), ac: Number(companionData.ac), speed: Number(companionData.speed), awakeLevel: Number(companionData.awakeLevel) } : null,
        levelUpPending: false 
      };

      if (initialData) {
        if (!initialData.currency) payload.currency = { assarions: 0, quadrans: 0, leptons: 0 };
        if (!initialData.attacks) payload.attacks = [];
        if (!initialData.resources) payload.resources = [];
        if (!initialData.deathSaves) payload.deathSaves = { successes: 0, failures: 0 };
        
        await setDoc(doc(db, 'characters', finalCharId), payload, { merge: true });
      } else {
        const newChar = {
          ...payload,
          exp: 0, hp: totalMaxHp, tempHp: 0, initiative: '--',
          combatInitiative: null, inspiration: false, isConcentrating: false, conditions: [], hasCompletedTutorial: false, journal: '',
          currency: { assarions: 0, quadrans: 0, leptons: 0 }, deathSaves: { successes: 0, failures: 0 }, resources: [],
          dmNotes: '', attacks: [], notes: ''
        };
        const batch = writeBatch(db);
        batch.set(doc(db, 'characters', finalCharId), newChar);
        await batch.commit();
      }
      
      onClose();
    } catch (err) {
      setDialog({ isOpen: true, title: 'Error', message: 'Failed to scribe character data.', type: 'alert', onConfirm: closeDialog });
      setIsSaving(false);
    }
  };

  return (
    <>
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} onCancel={closeDialog} />
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none -z-10"></div>

        <div className="bg-slate-900 border border-indigo-500/50 rounded-3xl w-full max-w-3xl shadow-[0_0_60px_rgba(99,102,241,0.2)] flex flex-col h-[90dvh] relative overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 relative z-10 shrink-0">
            <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-widest">
                {initialData ? <><Edit3 className="w-5 h-5 text-amber-400" /> Edit Character</> : <><UserPlus className="w-5 h-5 text-indigo-400" /> Construct Character</>}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl border border-slate-700"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex bg-slate-950 border-b-[3px] border-slate-900 shrink-0 overflow-x-auto custom-scrollbar p-3 gap-2">
            {steps.map((step, idx) => (
              <button 
                key={step}
                onClick={() => setStepIndex(idx)}
                className={`px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none ${stepIndex === idx ? 'bg-indigo-600 text-white border-slate-950' : 'bg-slate-900 text-slate-400 border-slate-950 hover:bg-slate-800 hover:text-white'}`}
              >
                {step}
              </button>
            ))}
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            {currentStep === 'identity' && <StepIdentity formData={formData} updateField={updateField} srdSpeciesOffer={srdSpeciesOffer} handleApplySrdSpecies={handleApplySrdSpecies} srdClassOffer={srdClassOffer} handleApplySrdClass={handleApplySrdClass} />}
            {currentStep === 'attributes' && <StepAttributes formData={formData} updateStat={updateStat} handleRollAll={handleRollAll} />}
            {currentStep === 'traits' && <StepTraits formData={formData} level={formData.level} updateField={updateField} customProfs={customProfs} updateProf={updateProf} speciesTraits={speciesTraits} setSpeciesTraits={setSpeciesTraits} />}
            {currentStep === 'features' && <StepFeatures classFeatures={classFeatures} setClassFeatures={setClassFeatures} forceShowSpells={forceShowSpells} setForceShowSpells={setForceShowSpells} />}
            {currentStep === 'spells' && <StepSpells spells={spells} setSpells={setSpells} spellcastingMeta={spellcastingMeta} />}
            {currentStep === 'companion' && <StepCompanion hasCompanion={hasCompanion} setHasCompanion={setHasCompanion} companionData={companionData} updateCompField={(f, v) => updateCompField(f, v)} updateCompStat={(s, v) => updateCompStat(s, v)} />}
            {currentStep === 'inventory' && <StepInventory newItem={newItem} setNewItem={setNewItem} handleItemNameChange={handleItemNameChange} showEquipDropdown={showEquipDropdown} filteredEquip={filteredEquip} handleSelectSrdItem={handleSelectSrdItem} handleAddItem={handleAddItem} inventory={inventory} removeInventoryItem={removeInventoryItem} />}
            {currentStep === 'lore' && <StepLore formData={formData} updateField={updateField} />}
          </div>

          <div className="p-5 bg-slate-900/90 border-t border-slate-800 shrink-0 flex gap-4">
            
            {initialData && (
              <button type="button" onClick={handleDeleteCharacter} className="px-4 py-3 bg-red-950 text-red-500 hover:bg-red-900 hover:text-white transition-colors rounded-xl font-bold border-2 border-red-900 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none" title="Permanently Delete Character">
                <Trash2 className="w-5 h-5" />
              </button>
            )}

            {stepIndex > 0 ? (
              <button onClick={() => setStepIndex(s => s - 1)} disabled={isSaving} className="px-5 py-3 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors rounded-xl font-bold border border-slate-600">
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : <div className={initialData ? "w-[12px]" : "w-[62px]"}></div>}
            
            {stepIndex < steps.length - 1 ? (
               <button onClick={() => setStepIndex(s => s + 1)} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg">
                 Next Step <ChevronRight className="w-5 h-5" />
               </button>
            ) : (
               <button onClick={handleFinish} disabled={isSaving || !formData.name} className={`flex-1 ${initialData ? 'bg-amber-600 hover:bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]'} disabled:opacity-50 text-white font-black text-sm uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 transition-all`}>
                 {isSaving ? 'Scribing...' : (initialData ? 'Save' : 'Construct')}
               </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}