import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Wand2, X, Save, Flame, Target, Search, Loader2, Plus, BookOpen } from 'lucide-react';
import DialogModal from './shared/DialogModal';
import ImageSelector from './shared/ImageSelector';

export default function DMSpellForge({ onClose }) {
  const [activeTab, setActiveTab] = useState('custom'); 
  const [isSaving, setIsSaving] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  const [spell, setSpell] = useState({
    name: '', level: 1, school: { name: 'Evocation' }, casting_time: '1 Action',
    range: '60 feet', duration: 'Instantaneous', components: ['V', 'S'], material: '',
    desc: [''], damageDice: '', damageType: '', saveRequired: '', imageUrl: '', isHomebrew: true
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [srdSpells, setSrdSpells] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleComponentChange = (comp) => {
    setSpell(prev => ({
      ...prev,
      components: prev.components.includes(comp) ? prev.components.filter(c => c !== comp) : [...prev.components, comp]
    }));
  };

  const handleSaveCustom = async (e) => {
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
        index: `hb_spell_${Date.now()}`
      };
      await addDoc(collection(db, 'homebrew_spells'), formattedSpell);
      setDialog({ isOpen: true, title: 'Success', message: 'Custom spell scribed to archives!', type: 'alert', onConfirm: onClose });
    } catch (error) {
      console.error("Error forging spell:", error);
      setDialog({ isOpen: true, title: 'Forge Error', message: 'Failed to scribe the spell.', type: 'alert' });
    } finally {
      setIsSaving(false);
    }
  };

  const searchApi = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://www.dnd5eapi.co/api/spells/?name=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      setSrdSpells(data.results || []);
    } catch (err) {
      console.error(err);
      setDialog({ isOpen: true, title: 'API Error', message: 'Failed to search archives.', type: 'alert' });
    }
    setIsSearching(false);
  };

  const importApiSpell = async (url) => {
    setIsSaving(true);
    try {
      const res = await fetch(`https://www.dnd5eapi.co${url}`);
      const data = await res.json();
      
      const importedSpell = {
        name: data.name,
        level: data.level,
        school: { name: data.school?.name || 'Unknown' },
        casting_time: data.casting_time || '1 Action',
        range: data.range || 'Self',
        duration: data.duration || 'Instantaneous',
        components: data.components || [],
        material: data.material || '',
        desc: data.desc || [],
        damageDice: data.damage?.damage_at_slot_level?.[data.level] || data.damage?.damage_at_character_level?.[1] || '',
        damageType: data.damage?.damage_type?.name || '',
        saveRequired: data.dc?.dc_type?.name ? `${data.dc.dc_type.name} Save` : '',
        imageUrl: '',
        isHomebrew: false,
        index: data.index
      };

      await addDoc(collection(db, 'homebrew_spells'), importedSpell);
      setDialog({ isOpen: true, title: 'Imported', message: `${data.name} added to your global Grimoire!`, type: 'alert', onConfirm: onClose });
    } catch (err) {
      console.error(err);
      setDialog({ isOpen: true, title: 'Import Error', message: 'Failed to import spell.', type: 'alert' });
    }
    setIsSaving(false);
  };

  return (
    <>
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} onCancel={closeDialog} />

      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md h-[100dvh] overflow-hidden animate-in fade-in duration-300">
        <div className="bg-slate-900 border border-fuchsia-500/50 rounded-2xl w-full max-w-3xl shadow-[0_0_40px_rgba(217,70,239,0.2)] flex flex-col max-h-[90dvh] relative overflow-hidden">
          
          <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/90 rounded-t-2xl shrink-0">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-black text-fuchsia-400 flex items-center gap-2 uppercase tracking-widest">
                <Flame className="w-5 h-5" /> Spell Forge
              </h2>
              <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                <button onClick={() => setActiveTab('custom')} className={`px-3 py-1 text-xs font-bold uppercase rounded-md transition-colors ${activeTab === 'custom' ? 'bg-fuchsia-600 text-white' : 'text-slate-500 hover:text-white'}`}>Custom</button>
                <button onClick={() => setActiveTab('api')} className={`px-3 py-1 text-xs font-bold uppercase rounded-md transition-colors ${activeTab === 'api' ? 'bg-fuchsia-600 text-white' : 'text-slate-500 hover:text-white'}`}>SRD API</button>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
            
            {activeTab === 'custom' ? (
              <form onSubmit={handleSaveCustom} className="space-y-6 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Incantation Name</label>
                    <input type="text" value={spell.name} onChange={e => setSpell({...spell, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500" placeholder="e.g. Void Blast" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Spell Level (0 = Cantrip)</label>
                    <input type="number" min="0" max="9" value={spell.level} onChange={e => setSpell({...spell, level: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-center focus:outline-none focus:border-fuchsia-500" />
                  </div>
                  <div className="sm:col-span-3">
                    <ImageSelector 
                      label="Spell Image"
                      value={spell.imageUrl}
                      onChange={(val) => setSpell({...spell, imageUrl: val})}
                      iconColor="text-fuchsia-400"
                      inputClassName="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 shadow-inner"
                    />
                  </div>
                </div>

                <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 shadow-inner">
                  <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest border-b border-slate-700/50 pb-2 mb-4"><Target className="w-4 h-4 text-fuchsia-400" /> Mechanics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Casting Time</label>
                      <input type="text" value={spell.casting_time} onChange={e => setSpell({...spell, casting_time: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-fuchsia-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Range</label>
                      <input type="text" value={spell.range} onChange={e => setSpell({...spell, range: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-fuchsia-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Duration</label>
                      <input type="text" value={spell.duration} onChange={e => setSpell({...spell, duration: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-fuchsia-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Damage Dice</label>
                      <input type="text" value={spell.damageDice} onChange={e => setSpell({...spell, damageDice: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-fuchsia-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Damage Type</label>
                      <input type="text" value={spell.damageType} onChange={e => setSpell({...spell, damageType: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-fuchsia-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Save Required</label>
                      <input type="text" value={spell.saveRequired} onChange={e => setSpell({...spell, saveRequired: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-fuchsia-500" />
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Components</label>
                    <div className="flex gap-4">
                      {['V', 'S', 'M'].map(comp => (
                        <label key={comp} className="flex items-center gap-2 text-sm font-bold text-white cursor-pointer">
                          <input type="checkbox" checked={spell.components.includes(comp)} onChange={() => handleComponentChange(comp)} className="w-4 h-4 rounded border-slate-600 text-fuchsia-500 bg-slate-950" />
                          {comp === 'V' ? 'Verbal' : comp === 'S' ? 'Somatic' : 'Material'}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Spell Description</label>
                  <textarea value={typeof spell.desc === 'string' ? spell.desc : spell.desc.join('\n')} onChange={e => setSpell({...spell, desc: e.target.value})} className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-fuchsia-500 shadow-inner resize-y custom-scrollbar" placeholder="The magic erupts..." />
                </div>
                
                <button type="submit" disabled={isSaving} className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)]">
                  {isSaving ? 'Scribing...' : 'Scribe Custom Spell'}
                </button>
              </form>
            ) : (
              <div className="space-y-6 animate-in fade-in">
                <form onSubmit={searchApi} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search API for Spells (e.g. Fireball)..." className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-4 text-white font-bold focus:outline-none focus:border-fuchsia-500" />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-fuchsia-600 px-4 py-2 rounded-lg text-white font-bold text-sm uppercase tracking-wider">Search</button>
                </form>
                
                {isSearching ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 text-fuchsia-500 animate-spin" /></div>
                ) : (
                  <div className="space-y-2">
                    {srdSpells.map(s => (
                      <div key={s.index} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center group">
                        <span className="font-bold text-white flex items-center gap-2"><BookOpen className="w-4 h-4 text-slate-500"/> {s.name}</span>
                        <button onClick={() => importApiSpell(s.url)} disabled={isSaving} className="bg-fuchsia-900/40 hover:bg-fuchsia-600 text-fuchsia-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border border-fuchsia-500/50 transition-colors flex items-center gap-1">
                          <Plus className="w-3 h-3"/> Import
                        </button>
                      </div>
                    ))}
                    {searchQuery && srdSpells.length === 0 && <p className="text-center text-slate-500 italic p-4">No spells found.</p>}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}