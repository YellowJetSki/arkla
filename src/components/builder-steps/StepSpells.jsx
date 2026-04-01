import { useState, useEffect } from 'react';
import { Wand2, Plus, Trash2, Search, Info } from 'lucide-react';
import { fetchAllSpells, fetchSpellDetails } from '../../services/srdApi';

export default function StepSpells({ spells, setSpells, spellcastingMeta }) {
  const [customSpell, setCustomSpell] = useState({ 
    name: '', level: 0, castTime: '1 Action', range: '60 feet', components: 'V, S', duration: 'Instantaneous', desc: '' 
  });
  
  const [srdList, setSrdList] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => { fetchAllSpells().then(setSrdList); }, []);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setCustomSpell(prev => ({ ...prev, name: val }));
    if (val.length > 1) {
      setFiltered(srdList.filter(i => i.name.toLowerCase().includes(val.toLowerCase())));
      setShowDropdown(true);
    } else setShowDropdown(false);
  };

  const handleSelectSrd = async (indexStr) => {
    setShowDropdown(false);
    const details = await fetchSpellDetails(indexStr);
    if (details) {
      setCustomSpell({
        name: details.name, level: details.level || 0,
        castTime: details.castingTime || details.casting_time || '1 Action',
        range: details.range || 'Self', components: details.components || 'V, S',
        duration: details.duration || 'Instantaneous', desc: details.desc || ''
      });
    }
  };

  const handleAddSpell = (e) => {
    e.preventDefault();
    if (!customSpell.name) return;
    setSpells(prev => [...prev, customSpell]);
    setCustomSpell({ name: '', level: 0, castTime: '1 Action', range: '60 feet', components: 'V, S', duration: 'Instantaneous', desc: '' });
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 text-fuchsia-400 border-b border-fuchsia-900/50 pb-2 mb-4">
        <Wand2 className="w-5 h-5" /> <h3 className="font-bold uppercase tracking-widest text-sm">Starting Grimoire</h3>
      </div>

      {spellcastingMeta && (
        <div className="bg-fuchsia-900/20 border border-fuchsia-500/30 p-4 rounded-xl shadow-inner flex items-start gap-3">
          <Info className="w-5 h-5 text-fuchsia-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-black text-fuchsia-300 uppercase tracking-widest mb-1">Class Spellcasting Rules</h4>
            <p className="text-[10px] text-slate-300">
              Based on your class and level, you know <strong className="text-white">{spellcastingMeta.cantrips_known || 0}</strong> Cantrips 
              and <strong className="text-white">{spellcastingMeta.spells_known || 'varies by INT/WIS'}</strong> Leveled Spells.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleAddSpell} className="bg-slate-800/50 p-4 rounded-xl border border-fuchsia-900/30 shadow-inner space-y-4">
        <h4 className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider border-b border-fuchsia-900/50 pb-2 mb-3">Add Spell to Grimoire</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="sm:col-span-2 relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Search className="w-3 h-3"/> Spell Name (SRD Search)</label>
            <input type="text" required value={customSpell.name} onChange={handleNameChange} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-fuchsia-500 shadow-inner" placeholder="e.g. Fireball" />
            {showDropdown && filtered.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto custom-scrollbar bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50">
                {filtered.map(item => (
                  <div key={item.index} onClick={() => handleSelectSrd(item.index)} className="px-3 py-2 text-sm text-slate-300 hover:bg-fuchsia-600 hover:text-white cursor-pointer border-b border-slate-800 last:border-0">{item.name}</div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Spell Level</label>
            <select value={customSpell.level} onChange={e => setCustomSpell({...customSpell, level: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-fuchsia-500 shadow-inner">
              <option value="0">Cantrip (0)</option>
              {[1,2,3,4,5,6,7,8,9].map(l => <option key={l} value={l}>Level {l}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Casting Time</label>
            <input type="text" required value={customSpell.castTime} onChange={e => setCustomSpell({...customSpell, castTime: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-fuchsia-500 shadow-inner" placeholder="e.g. 1 Action" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Range</label>
            <input type="text" value={customSpell.range} onChange={e => setCustomSpell({...customSpell, range: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-fuchsia-500 shadow-inner" placeholder="e.g. 60 feet" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Components</label>
            <input type="text" value={customSpell.components} onChange={e => setCustomSpell({...customSpell, components: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-fuchsia-500 shadow-inner" placeholder="e.g. V, S, M" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Duration</label>
            <input type="text" value={customSpell.duration} onChange={e => setCustomSpell({...customSpell, duration: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-fuchsia-500 shadow-inner" placeholder="e.g. Concentration" />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
          <textarea required value={customSpell.desc} onChange={e => setCustomSpell({...customSpell, desc: e.target.value})} className="w-full min-h-[60px] bg-slate-950 border border-slate-600 rounded-xl px-3 py-3 text-slate-300 text-sm focus:outline-none focus:border-fuchsia-500 resize-y shadow-inner" placeholder="Describe the damage, saving throws, and effects..." />
        </div>

        <button type="submit" className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs py-2.5 rounded-lg flex justify-center items-center gap-2">
          <Plus className="w-4 h-4"/> Scribe Spell
        </button>
      </form>

      <div className="space-y-3 mt-4">
        {spells.length === 0 ? <p className="text-center text-slate-500 italic text-xs py-4">No spells scribed yet.</p> : null}
        {spells.map((spell, index) => (
          <div key={index} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-700 shadow-sm">
            <div>
              <span className="text-sm font-bold text-fuchsia-300 block">{spell.name}</span>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest">{spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`} • {spell.castTime || spell.casting_time || '1 Action'}</span>
            </div>
            <button onClick={() => setSpells(prev => prev.filter((_, i) => i !== index))} className="text-slate-500 hover:text-red-400 p-2"><Trash2 className="w-4 h-4"/></button>
          </div>
        ))}
      </div>
    </div>
  );
}