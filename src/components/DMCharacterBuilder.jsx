import { useState } from 'react';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserPlus, ChevronRight, ChevronLeft, Dices, X, Wand2, Backpack, BookOpen } from 'lucide-react';
import DialogModal from './shared/DialogModal';

export default function DMCharacterBuilder({ onClose }) {
  const [step, setStep] = useState(1);
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
    inventory: ''
  });

  const updateField = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));
  const updateStat = (stat, val) => setFormData(prev => ({ ...prev, stats: { ...prev.stats, [stat]: Number(val) } }));

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
        speed: 30,
        initiative: '--',
        spellSave: '--',
        spellAttack: '--',
        combatInitiative: null,
        inspiration: false,
        isConcentrating: false,
        conditions: [],
        hasCompletedTutorial: false,
        hasFetchedSpecies: false,
        hasFetchedClass: false,
        journal: '',
        stats: formData.stats,
        currency: { assarions: 0, quadrans: 0, leptons: 0 },
        imageUrl: '',
        deathSaves: { successes: 0, failures: 0 },
        resources: [],
        spellSlots: {},
        spells: [],
        dmNotes: '',
        attacks: [],
        proficiencies: { skills: '', tools: '', weapons: '', armor: '', languages: 'Common' },
        features: [],
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

        <div className="bg-slate-900 border border-indigo-500/50 rounded-3xl w-full max-w-2xl shadow-[0_0_60px_rgba(99,102,241,0.2)] flex flex-col max-h-[90dvh] relative overflow-hidden animate-in zoom-in-95 duration-300">
          
          <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 relative z-10 shrink-0">
            <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-widest"><UserPlus className="w-5 h-5 text-indigo-400" /> Construct Character</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl border border-slate-700"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex h-1.5 bg-slate-800 shrink-0">
             <div className="h-full bg-indigo-500 transition-all duration-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" style={{ width: `${(step / 3) * 100}%` }}></div>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            
            {step === 1 && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 text-indigo-400 border-b border-slate-800 pb-2 mb-4">
                  <Wand2 className="w-5 h-5" /> <h3 className="font-bold uppercase tracking-widest text-sm">Identity & Class</h3>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Character Name</label>
                  <input type="text" onFocus={(e) => e.target.select()} value={formData.name} onChange={e => updateField('name', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-indigo-500 shadow-inner" placeholder="e.g. Grom the Unyielding" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Species</label>
                    <input type="text" onFocus={(e) => e.target.select()} value={formData.species} onChange={e => updateField('species', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 shadow-inner" placeholder="e.g. Half-Orc" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Class</label>
                    <select value={formData.class} onChange={e => updateField('class', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 shadow-inner">
                      <option value="">-- Select Class --</option>
                      <option value="Barbarian">Barbarian</option>
                      <option value="Bard">Bard</option>
                      <option value="Cleric">Cleric</option>
                      <option value="Druid">Druid</option>
                      <option value="Fighter">Fighter</option>
                      <option value="Monk">Monk</option>
                      <option value="Paladin">Paladin</option>
                      <option value="Ranger">Ranger</option>
                      <option value="Rogue">Rogue</option>
                      <option value="Sorcerer">Sorcerer</option>
                      <option value="Warlock">Warlock</option>
                      <option value="Wizard">Wizard</option>
                      <optgroup label="Homebrew">
                        <option value="Pirate">Pirate</option>
                      </optgroup>
                    </select>
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

            {step === 2 && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
                  <div className="flex items-center gap-3 text-indigo-400">
                    <Dices className="w-5 h-5" /> <h3 className="font-bold uppercase tracking-widest text-sm">Attributes</h3>
                  </div>
                  <button onClick={handleRollAll} className="bg-indigo-900/40 hover:bg-indigo-600 text-indigo-300 hover:text-white px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-widest transition-colors border border-indigo-500/50 shadow-sm">
                    Roll 4d6 (Drop Lowest)
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
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

            {step === 3 && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 text-indigo-400 border-b border-slate-800 pb-2 mb-4">
                  <BookOpen className="w-5 h-5" /> <h3 className="font-bold uppercase tracking-widest text-sm">Lore & Starting Gear</h3>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Alignment</label>
                  <input type="text" onFocus={(e) => e.target.select()} value={formData.alignment} onChange={e => updateField('alignment', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 shadow-inner" placeholder="e.g. Chaotic Good" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Backpack className="w-3 h-3"/> Starting Inventory</label>
                  <textarea value={formData.inventory} onChange={e => updateField('inventory', e.target.value)} className="w-full h-24 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-indigo-500 shadow-inner resize-y" placeholder="• 1x Longsword..." />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><BookOpen className="w-3 h-3"/> Backstory</label>
                  <textarea value={formData.backstory} onChange={e => updateField('backstory', e.target.value)} className="w-full h-24 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-indigo-500 shadow-inner resize-y" placeholder="Born in the town of..." />
                </div>
              </div>
            )}

          </div>

          <div className="p-5 bg-slate-900/90 border-t border-slate-800 shrink-0 flex gap-4">
            {step > 1 ? <button onClick={() => setStep(s => s - 1)} disabled={isSaving} className="px-5 py-3 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors rounded-xl font-bold border border-slate-600"><ChevronLeft className="w-5 h-5" /></button> : <div className="w-[62px]"></div>}
            
            {step < 3 ? (
               <button onClick={() => setStep(s => s + 1)} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg">Next <ChevronRight className="w-5 h-5" /></button>
            ) : (
               <button onClick={handleFinish} disabled={isSaving || !formData.name} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-sm uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]">Construct Character</button>
            )}
          </div>

        </div>
      </div>
    </>
  );
}