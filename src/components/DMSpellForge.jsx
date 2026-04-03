import { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Wand2, X, Target, Search, Loader2, Plus, BookOpen, Flame } from 'lucide-react';
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

  // API Search Debouncer
  useEffect(() => {
    const delayFn = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setIsSearching(true);
        try {
          const res = await fetch(`https://www.dnd5eapi.co/api/spells/?name=${encodeURIComponent(searchQuery.trim())}`);
          const data = await res.json();
          setSrdSpells(data.results || []);
        } catch (err) {
          console.error(err);
        }
        setIsSearching(false);
      } else {
        setSrdSpells([]);
      }
    }, 500);
    return () => clearTimeout(delayFn);
  }, [searchQuery]);

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

  const loadApiSpellIntoForge = async (url) => {
    setIsSaving(true);
    try {
      const res = await fetch(`https://www.dnd5eapi.co${url}`);
      const data = await res.json();
      
      setSpell({
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
        isHomebrew: true,
        index: data.index
      });

      setActiveTab('custom');
    } catch (err) {
      console.error(err);
      setDialog({ isOpen: true, title: 'Import Error', message: 'Failed to load spell data into the forge.', type: 'alert' });
    }
    setIsSaving(false);
  };

  return (
    <>
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} onCancel={closeDialog} />

      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md h-[100dvh] overflow-hidden animate-in fade-in duration-300">
        <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl w-full max-w-3xl shadow-[12px_12px_0px_rgba(0,0,0,1)] flex flex-col max-h-[90dvh] relative overflow-hidden animate-in zoom-in-95 duration-500">
          
          {/* Solid Color Header */}
          <div className="p-4 border-b-[3px] border-slate-950 flex justify-between items-center bg-fuchsia-500 rounded-t-xl shrink-0 relative z-10">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-black text-slate-950 flex items-center gap-2 uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,0.3)]">
                <Flame className="w-6 h-6" /> Spell Forge
              </h2>
              <div className="flex bg-fuchsia-600 rounded-xl p-1 border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                <button onClick={() => setActiveTab('custom')} className={`px-4 py-1.5 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg transition-colors ${activeTab === 'custom' ? 'bg-slate-950 text-fuchsia-500 shadow-inner' : 'text-slate-950 hover:bg-fuchsia-500'}`}>Custom</button>
                <button onClick={() => setActiveTab('api')} className={`px-4 py-1.5 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg transition-colors ${activeTab === 'api' ? 'bg-slate-950 text-fuchsia-500 shadow-inner' : 'text-slate-950 hover:bg-fuchsia-500'}`}>SRD API</button>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-950 bg-fuchsia-400 hover:bg-fuchsia-300 transition-colors p-2 rounded-xl border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"><X className="w-5 h-5 font-black" /></button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 bg-slate-950">
            
            {activeTab === 'custom' ? (
              <form onSubmit={handleSaveCustom} className="space-y-6 animate-in fade-in">
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="sm:col-span-2 bg-slate-900 border-[3px] border-slate-950 p-4 rounded-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Incantation Name</label>
                    <input type="text" value={spell.name} onChange={e => setSpell({...spell, name: e.target.value})} className="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-4 py-3 text-white text-lg font-black focus:outline-none focus:border-fuchsia-500 shadow-inner" placeholder="e.g. Void Blast" />
                  </div>
                  <div className="bg-slate-900 border-[3px] border-slate-950 p-4 rounded-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Level (0 = Cantrip)</label>
                    <input type="number" min="0" max="9" value={spell.level} onChange={e => setSpell({...spell, level: Number(e.target.value)})} className="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-4 py-3 text-white text-center font-black text-lg focus:outline-none focus:border-fuchsia-500 shadow-inner" />
                  </div>
                  <div className="sm:col-span-3 bg-slate-900 border-[3px] border-slate-950 p-4 rounded-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                    <ImageSelector 
                      label="Spell Image"
                      value={spell.imageUrl}
                      onChange={(val) => setSpell({...spell, imageUrl: val})}
                      iconColor="text-fuchsia-500"
                      inputClassName="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-fuchsia-500 shadow-inner"
                    />
                  </div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border-[3px] border-slate-950 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
                  <h3 className="text-sm font-black text-fuchsia-400 flex items-center gap-2 uppercase tracking-widest border-b-2 border-slate-950 pb-3 mb-5 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]"><Target className="w-5 h-5" /> Mechanics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-slate-950 p-3 rounded-xl border-2 border-slate-900 shadow-inner">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Casting Time</label>
                      <input type="text" value={spell.casting_time} onChange={e => setSpell({...spell, casting_time: e.target.value})} className="w-full bg-transparent border-b-2 border-slate-800 pb-1 text-white font-bold text-sm focus:outline-none focus:border-fuchsia-500" />
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border-2 border-slate-900 shadow-inner">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Range</label>
                      <input type="text" value={spell.range} onChange={e => setSpell({...spell, range: e.target.value})} className="w-full bg-transparent border-b-2 border-slate-800 pb-1 text-white font-bold text-sm focus:outline-none focus:border-fuchsia-500" />
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border-2 border-slate-900 shadow-inner">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Duration</label>
                      <input type="text" value={spell.duration} onChange={e => setSpell({...spell, duration: e.target.value})} className="w-full bg-transparent border-b-2 border-slate-800 pb-1 text-white font-bold text-sm focus:outline-none focus:border-fuchsia-500" />
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border-2 border-slate-900 shadow-inner">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Damage Dice</label>
                      <input type="text" value={spell.damageDice} onChange={e => setSpell({...spell, damageDice: e.target.value})} className="w-full bg-transparent border-b-2 border-slate-800 pb-1 text-white font-bold text-sm focus:outline-none focus:border-fuchsia-500" />
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border-2 border-slate-900 shadow-inner">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Damage Type</label>
                      <input type="text" value={spell.damageType} onChange={e => setSpell({...spell, damageType: e.target.value})} className="w-full bg-transparent border-b-2 border-slate-800 pb-1 text-white font-bold text-sm focus:outline-none focus:border-fuchsia-500" />
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border-2 border-slate-900 shadow-inner">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Save Required</label>
                      <input type="text" value={spell.saveRequired} onChange={e => setSpell({...spell, saveRequired: e.target.value})} className="w-full bg-transparent border-b-2 border-slate-800 pb-1 text-white font-bold text-sm focus:outline-none focus:border-fuchsia-500" />
                    </div>
                  </div>
                  
                  <div className="mt-5 pt-4 border-t-2 border-slate-950">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 text-center">Components</label>
                    <div className="flex justify-center gap-6">
                      {['V', 'S', 'M'].map(comp => (
                        <label key={comp} className={`flex items-center gap-2 text-sm font-black uppercase tracking-widest cursor-pointer px-4 py-2 rounded-xl border-2 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none ${spell.components.includes(comp) ? 'bg-slate-950 border-fuchsia-500 text-fuchsia-400' : 'bg-slate-900 border-slate-950 text-slate-500 hover:text-white'}`}>
                          <input type="checkbox" checked={spell.components.includes(comp)} onChange={() => handleComponentChange(comp)} className="hidden" />
                          {comp === 'V' ? 'Verbal' : comp === 'S' ? 'Somatic' : 'Material'}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border-[3px] border-slate-950 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
                  <label className="block text-[10px] font-black text-fuchsia-500 uppercase tracking-widest mb-3">Spell Description</label>
                  <textarea value={typeof spell.desc === 'string' ? spell.desc : spell.desc.join('\n')} onChange={e => setSpell({...spell, desc: e.target.value})} className="w-full h-40 bg-slate-950 border-2 border-slate-900 rounded-xl px-4 py-4 text-slate-300 font-medium text-sm focus:outline-none focus:border-fuchsia-500 shadow-inner resize-y custom-scrollbar leading-relaxed" placeholder="The magic erupts..." />
                </div>
                
                <button type="submit" disabled={isSaving} className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-slate-950 font-black uppercase tracking-widest py-4 rounded-xl transition-all border-[3px] border-slate-950 shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none">
                  {isSaving ? 'Scribing...' : 'Scribe Custom Spell'}
                </button>
              </form>
            ) : (
              <div className="space-y-6 animate-in fade-in">
                <div className="relative bg-slate-900 p-4 rounded-2xl border-[3px] border-slate-950 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
                  <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 font-black" />
                  <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    placeholder="Search API for Spells (e.g. Fireball)..." 
                    className="w-full bg-slate-950 border-2 border-slate-900 rounded-xl pl-12 pr-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-fuchsia-500 shadow-inner" 
                  />
                </div>
                
                {isSearching ? (
                  <div className="flex justify-center p-12"><Loader2 className="w-10 h-10 text-fuchsia-500 animate-spin" /></div>
                ) : (
                  <div className="space-y-3">
                    {srdSpells.map(s => (
                      <div key={s.index} className="bg-slate-900 p-4 md:p-5 rounded-2xl border-[3px] border-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                        <span className="font-black text-white flex items-center gap-2 text-lg uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]"><BookOpen className="w-5 h-5 text-fuchsia-500"/> {s.name}</span>
                        <button onClick={() => loadApiSpellIntoForge(s.url)} disabled={isSaving} className="bg-fuchsia-500 hover:bg-fuchsia-400 text-slate-950 w-full sm:w-auto px-5 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest border-2 border-slate-950 transition-all flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">
                          <Plus className="w-4 h-4 font-black"/> Load as Template
                        </button>
                      </div>
                    ))}
                    {searchQuery && srdSpells.length === 0 && <p className="text-center text-slate-500 font-bold uppercase tracking-widest p-8 border-2 border-slate-950 border-dashed rounded-2xl bg-slate-900">No spells found.</p>}
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