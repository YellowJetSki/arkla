import { useState, useEffect } from 'react';
import { Sparkles, Plus, Trash2, Search, Wand2 } from 'lucide-react';
import { fetchAllTraitsAndFeatures, fetchTraitOrFeatureDetails } from '../../services/srdApi';

export default function StepFeatures({ classFeatures, setClassFeatures, forceShowSpells, setForceShowSpells }) {
  const [customFeat, setCustomFeat] = useState({ name: '', desc: '' });
  
  const [srdList, setSrdList] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => { fetchAllTraitsAndFeatures().then(setSrdList); }, []);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setCustomFeat(prev => ({ ...prev, name: val }));
    if (val.length > 1) {
      setFiltered(srdList.filter(i => i.name.toLowerCase().includes(val.toLowerCase())));
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const handleSelectSrd = async (item) => {
    setShowDropdown(false);
    setCustomFeat(prev => ({ ...prev, name: item.name }));
    const details = await fetchTraitOrFeatureDetails(item.url);
    if (details) {
      setCustomFeat(prev => ({ ...prev, desc: details.desc }));
    }
  };

  const handleAddFeature = (e) => {
    e.preventDefault();
    if (!customFeat.name) return;
    setClassFeatures(prev => [...prev, { name: customFeat.name, desc: customFeat.desc }]);
    setCustomFeat({ name: '', desc: '' });
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between border-b border-amber-900/50 pb-2 mb-4">
        <div className="flex items-center gap-3 text-amber-400">
          <Sparkles className="w-5 h-5" /> <h3 className="font-bold uppercase tracking-widest text-sm">Class Features & Feats</h3>
        </div>
        <label className="flex items-center gap-2 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
          <input type="checkbox" checked={forceShowSpells} onChange={(e) => setForceShowSpells(e.target.checked)} className="w-4 h-4 rounded border-slate-600 text-indigo-500 bg-slate-800" />
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1"><Wand2 className="w-3 h-3"/> Enable Magic</span>
        </label>
      </div>

      <form onSubmit={handleAddFeature} className="bg-slate-800/50 p-4 rounded-xl border border-amber-900/30 shadow-inner space-y-4">
        <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider border-b border-amber-900/50 pb-2 mb-3">Add Custom Feature / Feat</h4>
        
        <div className="relative">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Search className="w-3 h-3"/> Feature Name (SRD Search)
          </label>
          <input 
            type="text" 
            required 
            value={customFeat.name} 
            onChange={handleNameChange} 
            className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" 
            placeholder="e.g. Action Surge, Mobile..." 
          />
          {showDropdown && filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto custom-scrollbar bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50">
              {filtered.map(item => (
                <div key={item.index} onClick={() => handleSelectSrd(item)} className="px-3 py-2 text-sm text-slate-300 hover:bg-amber-600 hover:text-white cursor-pointer border-b border-slate-800 last:border-0">
                  {item.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
          <textarea 
            required
            value={customFeat.desc} 
            onChange={(e) => setCustomFeat(prev => ({ ...prev, desc: e.target.value }))} 
            className="w-full h-20 bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 resize-y custom-scrollbar" 
            placeholder="Mechanics..." 
          />
        </div>
        
        <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs py-2.5 rounded-lg flex justify-center items-center gap-2 transition-colors">
          <Plus className="w-4 h-4"/> Add to Sheet
        </button>
      </form>

      <div className="space-y-3 mt-4">
        {classFeatures.map((feat, index) => (
          <div key={index} className="bg-slate-950 border border-slate-700 rounded-lg p-3 relative group">
            <button onClick={() => setClassFeatures(prev => prev.filter((_, i) => i !== index))} className="absolute top-2 right-2 text-slate-600 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
            <input type="text" value={feat.name} onChange={e => { const n = [...classFeatures]; n[index].name = e.target.value; setClassFeatures(n); }} placeholder="Feature Name" className="w-11/12 bg-transparent text-amber-300 font-bold text-sm focus:outline-none mb-2 border-b border-slate-800 focus:border-amber-500 pb-1" />
            <textarea value={feat.desc} onChange={e => { const n = [...classFeatures]; n[index].desc = e.target.value; setClassFeatures(n); }} placeholder="Describe mechanics..." className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-xs text-slate-300 focus:outline-none min-h-[60px]" />
          </div>
        ))}
      </div>
    </div>
  );
}