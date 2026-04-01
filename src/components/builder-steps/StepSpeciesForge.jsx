import { Fingerprint, Plus, Trash2 } from 'lucide-react';

export default function StepSpeciesForge({ 
  formData, 
  updateField, 
  customProfs, 
  updateProf, 
  speciesTraits, 
  addTrait, 
  updateTrait, 
  removeTrait 
}) {
  return (
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
  );
}