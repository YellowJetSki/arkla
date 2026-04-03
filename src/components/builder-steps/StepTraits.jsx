import { useState, useEffect } from 'react';
import { Fingerprint, Plus, Trash2, Search, Target } from 'lucide-react';
import { 
  fetchAllTraitsAndFeatures, 
  fetchTraitOrFeatureDetails, 
  fetchAllProficiencies, 
  fetchAllLanguages 
} from '../../services/srdApi';

// Custom Component: Safely appends SRD proficiencies using commas
const AppendingInput = ({ label, value, onChange, placeholder, dataset, color='emerald' }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filtered, setFiltered] = useState([]);

  const handleInput = (e) => {
    const val = e.target.value;
    onChange(val);
    const parts = val.split(',').map(s => s.trim());
    const lastPart = parts[parts.length - 1]; 

    if (lastPart.length >= 1) {
      const matches = dataset.filter(item => {
        const cleanName = item.name.replace(/^Skill: |^Tool: |^Weapon: |^Armor: |^Saving Throw: /, '');
        return cleanName.toLowerCase().includes(lastPart.toLowerCase());
      });
      matches.sort((a, b) => a.name.localeCompare(b.name));
      setFiltered(matches.slice(0, 15)); 
      setShowDropdown(matches.length > 0);
    } else {
      setShowDropdown(false);
    }
  };

  const handleSelect = (itemName) => {
    const cleanName = itemName.replace(/^Skill: |^Tool: |^Weapon: |^Armor: |^Saving Throw: /, '');
    const parts = value.split(',').map(s => s.trim());
    parts.pop(); 
    if (cleanName) parts.push(cleanName); 
    
    onChange(parts.join(', ') + (parts.length > 0 ? ', ' : ''));
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <label className={`block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1`}>{label}</label>
      <input 
        type="text" 
        value={value} 
        onChange={handleInput} 
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)} 
        className={`w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-${color}-500`} 
        placeholder={placeholder} 
      />
      {showDropdown && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto custom-scrollbar bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50">
          {filtered.map(item => (
            <div 
              key={item.index} 
              onMouseDown={(e) => { e.preventDefault(); handleSelect(item.name); }} 
              className={`px-3 py-2 text-sm text-slate-300 hover:bg-${color}-600 hover:text-white cursor-pointer border-b border-slate-800 last:border-0`}
            >
              {item.name.replace(/^Skill: |^Tool: |^Weapon: |^Armor: |^Saving Throw: /, '')}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function StepTraits({ 
  formData, level, updateField, customProfs, updateProf, speciesTraits, setSpeciesTraits
}) {
  
  const [newTraitName, setNewTraitName] = useState('');
  const [newTraitDesc, setNewTraitDesc] = useState('');
  
  const [srdTraitsList, setSrdTraitsList] = useState([]);
  const [srdProfsList, setSrdProfsList] = useState([]);
  const [srdLangsList, setSrdLangsList] = useState([]);
  
  const [filteredTraits, setFilteredTraits] = useState([]);
  const [showTraitDropdown, setShowTraitDropdown] = useState(false);

  const pb = Math.ceil((Number(level) || 1) / 4) + 1;

  useEffect(() => { 
    fetchAllTraitsAndFeatures().then(setSrdTraitsList); 
    fetchAllProficiencies().then(setSrdProfsList);
    fetchAllLanguages().then(setSrdLangsList);
  }, []);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setNewTraitName(val);
    if (val.length > 1) {
      setFilteredTraits(srdTraitsList.filter(i => i.name.toLowerCase().includes(val.toLowerCase())));
      setShowTraitDropdown(true);
    } else setShowTraitDropdown(false);
  };

  const handleSelectSrd = async (item) => {
    setShowTraitDropdown(false);
    setNewTraitName(item.name);
    const details = await fetchTraitOrFeatureDetails(item.url);
    if (details) setNewTraitDesc(details.desc);
  };

  const handleAddTrait = (e) => {
    e.preventDefault();
    if (!newTraitName) return;
    setSpeciesTraits(prev => [...prev, { name: newTraitName, desc: newTraitDesc }]);
    setNewTraitName(''); setNewTraitDesc('');
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between border-b border-emerald-900/50 pb-2 mb-4">
        <div className="flex items-center gap-3 text-emerald-400">
          <Fingerprint className="w-5 h-5" /> <h3 className="font-bold uppercase tracking-widest text-sm">Species Traits & Proficiencies</h3>
        </div>
        <div className="bg-emerald-900/30 border border-emerald-500/50 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
          <Target className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] font-black text-emerald-200 uppercase tracking-widest">Proficiency Bonus</span>
          <span className="text-sm font-black text-white">+{pb}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-inner">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Base Speed (ft)</label>
          <input type="number" onFocus={e => e.target.select()} value={formData.speed} onChange={e => updateField('speed', Number(e.target.value))} className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500" />
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-inner">
          <AppendingInput 
             label="Languages" 
             value={customProfs.languages} 
             onChange={val => updateProf('languages', val)} 
             placeholder="e.g. Common, Elvish" 
             dataset={srdLangsList} 
          />
        </div>
      </div>

      <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-inner space-y-4">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">Class & Background Proficiencies</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <AppendingInput label="Saving Throws" value={customProfs.savingThrows || ''} onChange={v => updateProf('savingThrows', v)} placeholder="e.g. STR, CON" dataset={srdProfsList} />
          <AppendingInput label="Skills" value={customProfs.skills} onChange={v => updateProf('skills', v)} placeholder="e.g. Athletics" dataset={srdProfsList} />
          <AppendingInput label="Tools" value={customProfs.tools} onChange={v => updateProf('tools', v)} placeholder="e.g. Thieves' Tools" dataset={srdProfsList} />
          <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-3">
             <AppendingInput label="Weapons" value={customProfs.weapons} onChange={v => updateProf('weapons', v)} placeholder="e.g. Simple Weapons" dataset={srdProfsList} />
             <AppendingInput label="Armor" value={customProfs.armor} onChange={v => updateProf('armor', v)} placeholder="e.g. Light Armor" dataset={srdProfsList} />
          </div>
        </div>
      </div>

      <form onSubmit={handleAddTrait} className="bg-slate-800/50 p-4 rounded-xl border border-emerald-900/30 shadow-inner space-y-4">
        <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider border-b border-emerald-900/50 pb-2 mb-3">Add Custom Trait (Species/Background)</h4>
        <div className="relative">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Search className="w-3 h-3"/> Search SRD Traits</label>
          <input type="text" value={newTraitName} onChange={handleNameChange} className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" placeholder="e.g. Darkvision..." />
          {showTraitDropdown && filteredTraits.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto custom-scrollbar bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50">
              {filteredTraits.map(item => <div key={item.index} onClick={() => handleSelectSrd(item)} className="px-3 py-2 text-sm text-slate-300 hover:bg-emerald-600 hover:text-white cursor-pointer border-b border-slate-800 last:border-0">{item.name}</div>)}
            </div>
          )}
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
          <textarea value={newTraitDesc} onChange={(e) => setNewTraitDesc(e.target.value)} className="w-full h-20 bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 resize-y custom-scrollbar" placeholder="Mechanics..." />
        </div>
        <button type="submit" disabled={!newTraitName} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-lg flex justify-center items-center gap-2"><Plus className="w-4 h-4"/> Add to Sheet</button>
      </form>

      <div className="space-y-3 mt-4">
        {speciesTraits.map((trait, index) => (
          <div key={index} className="bg-slate-950 border border-slate-700 rounded-lg p-3 relative group">
            <button onClick={() => setSpeciesTraits(prev => prev.filter((_, i) => i !== index))} className="absolute top-2 right-2 text-slate-600 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
            <input type="text" value={trait.name} onChange={e => { const n = [...speciesTraits]; n[index].name = e.target.value; setSpeciesTraits(n); }} placeholder="Trait Name" className="w-11/12 bg-transparent text-emerald-300 font-bold text-sm focus:outline-none mb-2 border-b border-slate-800 focus:border-emerald-500 pb-1" />
            <textarea value={trait.desc} onChange={e => { const n = [...speciesTraits]; n[index].desc = e.target.value; setSpeciesTraits(n); }} placeholder="Describe mechanics..." className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-xs text-slate-300 focus:outline-none min-h-[60px]" />
          </div>
        ))}
      </div>
    </div>
  );
}