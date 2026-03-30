import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Wand2, X, Save, Flame } from 'lucide-react';
import DialogModal from './shared/DialogModal';

export default function DMSpellForge({ onClose }) {
  const [isSaving, setIsSaving] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  const [spell, setSpell] = useState({
    name: '',
    level: 1,
    school: { name: 'Evocation' },
    casting_time: '1 Action',
    range: '60 feet',
    duration: 'Instantaneous',
    components: ['V', 'S'],
    material: '',
    desc: [''],
    higher_level: [],
    classes: [],
    isHomebrew: true
  });

  const handleComponentChange = (comp) => {
    setSpell(prev => {
      const newComps = prev.components.includes(comp)
        ? prev.components.filter(c => c !== comp)
        : [...prev.components, comp];
      return { ...prev, components: newComps };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!spell.name) {
      setDialog({ isOpen: true, title: 'Missing Name', message: 'The incantation needs a name.', type: 'alert' });
      return;
    }

    setIsSaving(true);
    try {
      const formattedSpell = {
        ...spell,
        desc: typeof spell.desc === 'string' ? spell.desc.split('\n') : spell.desc,
        higher_level: typeof spell.higher_level === 'string' && spell.higher_level.trim() ? spell.higher_level.split('\n') : spell.higher_level,
        index: `hb_spell_${Date.now()}`
      };

      await addDoc(collection(db, 'homebrew_spells'), formattedSpell);
      onClose();
    } catch (error) {
      console.error("Error forging spell:", error);
      setDialog({ isOpen: true, title: 'Forge Error', message: 'Failed to scribe the spell to the database.', type: 'alert' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onCancel={closeDialog} />

      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md h-[100dvh] overflow-hidden animate-in fade-in duration-300">
        <div className="bg-slate-900 border border-fuchsia-500/50 rounded-2xl w-full max-w-3xl shadow-[0_0_40px_rgba(217,70,239,0.2)] flex flex-col max-h-[90dvh] animate-in zoom-in-95 duration-500 relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-600/10 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/90 rounded-t-2xl shrink-0 relative z-10">
            <h2 className="text-xl font-black text-fuchsia-400 flex items-center gap-2 uppercase tracking-widest drop-shadow-sm">
              <Flame className="w-5 h-5" /> Spell Forge
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl border border-slate-700 shadow-sm">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 relative z-10">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Incantation Name</label>
                <input type="text" value={spell.name} onChange={e => setSpell({...spell, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-fuchsia-500 shadow-inner" placeholder="e.g. Void Blast" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Spell Level (0 = Cantrip)</label>
                <input type="number" min="0" max="9" value={spell.level} onChange={e => setSpell({...spell, level: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-center focus:outline-none focus:border-fuchsia-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none shadow-inner" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">School of Magic</label>
                <select value={spell.school.name} onChange={e => setSpell({...spell, school: { name: e.target.value }})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 shadow-inner">
                  {['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 shadow-inner">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Casting Time</label>
                  <input type="text" value={spell.casting_time} onChange={e => setSpell({...spell, casting_time: e.target.value})} placeholder="e.g. 1 Bonus Action" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-fuchsia-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Range</label>
                  <input type="text" value={spell.range} onChange={e => setSpell({...spell, range: e.target.value})} placeholder="e.g. 120 feet" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-fuchsia-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Duration</label>
                  <input type="text" value={spell.duration} onChange={e => setSpell({...spell, duration: e.target.value})} placeholder="e.g. Concentration, up to 1 hr" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-fuchsia-500" />
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Components</label>
                <div className="flex items-center gap-4">
                  {['V', 'S', 'M'].map(comp => (
                    <label key={comp} className="flex items-center gap-2 text-sm font-bold text-white cursor-pointer">
                      <input type="checkbox" checked={spell.components.includes(comp)} onChange={() => handleComponentChange(comp)} className="w-4 h-4 rounded border-slate-600 text-fuchsia-500 bg-slate-950 focus:ring-fuchsia-500" />
                      {comp === 'V' ? 'Verbal' : comp === 'S' ? 'Somatic' : 'Material'}
                    </label>
                  ))}
                </div>
                {spell.components.includes('M') && (
                  <input type="text" value={spell.material} onChange={e => setSpell({...spell, material: e.target.value})} placeholder="Specify material cost/item..." className="w-full mt-3 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-fuchsia-500" />
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Spell Description & Effects</label>
              <textarea 
                value={typeof spell.desc === 'string' ? spell.desc : spell.desc.join('\n')} 
                onChange={e => setSpell({...spell, desc: e.target.value})} 
                className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-fuchsia-500 shadow-inner resize-y custom-scrollbar" 
                placeholder="The magic erupts from your hands..." 
              />
            </div>

          </div>

          <div className="p-4 bg-slate-900/90 border-t border-slate-800 shrink-0 relative z-10 flex justify-end">
            <button 
              onClick={handleSave} 
              disabled={isSaving} 
              className="w-full sm:w-auto px-8 py-3.5 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white font-black uppercase tracking-widest text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_30px_rgba(217,70,239,0.5)] flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" /> Scribe to Archives
            </button>
          </div>

        </div>
      </div>
    </>
  );
}