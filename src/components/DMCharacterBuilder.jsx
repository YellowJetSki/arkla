import { useState, useEffect } from 'react';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserPlus, ChevronRight, ChevronLeft, X } from 'lucide-react';
import DialogModal from './shared/DialogModal';
import { fetchAllEquipment, fetchEquipmentDetails, fetchSpeciesData, fetchClassData } from '../services/srdApi';

// Import our new step components
import StepIdentity from './builder-steps/StepIdentity';
import StepAttributes from './builder-steps/StepAttributes';
import StepSpeciesForge from './builder-steps/StepSpeciesForge';
import StepCompanion from './builder-steps/StepCompanion';
import StepInventory from './builder-steps/StepInventory';
import StepLore from './builder-steps/StepLore';

export default function DMCharacterBuilder({ onClose }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  const [formData, setFormData] = useState({
    name: '',
    species: '',
    class: '',
    level: 1, 
    theme: 'indigo',
    stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    alignment: 'Neutral',
    backstory: '',
    speed: 30,
    hitDie: 'd10', 
    imageUrl: '',
    tokenImg: '',
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

  const steps = ['identity', 'attributes', 'speciesForge', 'companion', 'inventory', 'lore'];
  const currentStep = steps[stepIndex];

  useEffect(() => {
    fetchAllEquipment().then(setSrdEquipmentList);
  }, []);

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
      stats: { STR: rollStat(), DEX: rollStat(), CON: rollStat(), INT: rollStat(), WIS: rollStat(), CHA: rollStat() }
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
    } else setShowEquipDropdown(false);
  };

  const handleSelectSrdItem = async (indexStr) => {
    setShowEquipDropdown(false);
    const details = await fetchEquipmentDetails(indexStr);
    if (details) setNewItem(prev => ({ ...prev, ...details, quantity: 1 }));
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

      let finalFeatures = speciesTraits.filter(t => t.name && t.desc).map(t => ({ 
        name: `${formData.species || 'Base'} Trait: ${t.name}`, 
        desc: t.desc 
      }));
      
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
        hp: totalMaxHp, maxHp: totalMaxHp, tempHp: 0,
        hitDice: { current: startLevel, max: startLevel, type: formData.hitDie },
        ac: 10 + dexMod,
        speed: formData.speed,
        initiative: '--', spellSave: '--', spellAttack: '--',
        combatInitiative: null, inspiration: false, isConcentrating: false,
        conditions: [], hasCompletedTutorial: false, journal: '',
        stats: formData.stats,
        currency: { assarions: 0, quadrans: 0, leptons: 0 },
        imageUrl: formData.imageUrl, img: formData.tokenImg,
        deathSaves: { successes: 0, failures: 0 },
        resources: [], spellSlots: {}, spells: [], dmNotes: '', attacks: [], 
        proficiencies: customProfs, features: finalFeatures, inventory: inventory,
        traits: { personality: '', ideal: '', bond: '', flaws: '' },
        backstory: formData.backstory, notes: '', levelUpPending: false,
        companion: hasCompanion ? {
          ...companionData, hp: Number(companionData.hp), ac: Number(companionData.ac),
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
            {currentStep === 'identity' && <StepIdentity formData={formData} updateField={updateField} srdSpeciesOffer={srdSpeciesOffer} handleApplySrdSpecies={handleApplySrdSpecies} srdClassOffer={srdClassOffer} handleApplySrdClass={handleApplySrdClass} />}
            {currentStep === 'attributes' && <StepAttributes formData={formData} updateStat={updateStat} handleRollAll={handleRollAll} />}
            {currentStep === 'speciesForge' && <StepSpeciesForge formData={formData} updateField={updateField} customProfs={customProfs} updateProf={updateProf} speciesTraits={speciesTraits} addTrait={addTrait} updateTrait={updateTrait} removeTrait={removeTrait} />}
            {currentStep === 'companion' && <StepCompanion hasCompanion={hasCompanion} setHasCompanion={setHasCompanion} companionData={companionData} updateCompField={updateCompField} updateCompStat={updateCompStat} />}
            {currentStep === 'inventory' && <StepInventory newItem={newItem} setNewItem={setNewItem} handleItemNameChange={handleItemNameChange} showEquipDropdown={showEquipDropdown} filteredEquip={filteredEquip} handleSelectSrdItem={handleSelectSrdItem} handleAddItem={handleAddItem} inventory={inventory} removeInventoryItem={removeInventoryItem} />}
            {currentStep === 'lore' && <StepLore formData={formData} updateField={updateField} />}
          </div>

          <div className="p-5 bg-slate-900/90 border-t border-slate-800 shrink-0 flex gap-4">
            {stepIndex > 0 ? (
              <button onClick={() => setStepIndex(s => s - 1)} disabled={isSaving} className="px-5 py-3 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors rounded-xl font-bold border border-slate-600">
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : <div className="w-[62px]"></div>}
            
            {stepIndex < steps.length - 1 ? (
               <button onClick={() => setStepIndex(s => s + 1)} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg">
                 Next Step <ChevronRight className="w-5 h-5" />
               </button>
            ) : (
               <button onClick={handleFinish} disabled={isSaving || !formData.name} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-sm uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                 {isSaving ? 'Scribing Data...' : 'Construct Character'}
               </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}