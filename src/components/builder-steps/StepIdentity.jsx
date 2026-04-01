import { Wand2, Sparkles } from 'lucide-react';

export default function StepIdentity({ 
  formData, 
  updateField, 
  srdSpeciesOffer, 
  handleApplySrdSpecies, 
  srdClassOffer, 
  handleApplySrdClass 
}) {
  return (
    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 text-indigo-400 border-b border-slate-800 pb-2 mb-4">
        <Wand2 className="w-5 h-5" /> <h3 className="font-bold uppercase tracking-widest text-sm">Identity & Path</h3>
      </div>
      
      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Character Name</label>
        <input 
          type="text" 
          onFocus={(e) => e.target.select()} 
          value={formData.name} 
          onChange={e => updateField('name', e.target.value)} 
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-indigo-500 shadow-inner" 
          placeholder="e.g. Grom the Unyielding" 
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-950 border border-slate-700 rounded-xl p-3 shadow-inner relative">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Species</label>
          <input 
            type="text" 
            onFocus={(e) => e.target.select()} 
            value={formData.species} 
            onChange={e => updateField('species', e.target.value)} 
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 mb-3" 
            placeholder="e.g. Rock Gnome" 
          />

          {srdSpeciesOffer && (
             <div className="absolute top-full left-0 right-0 mt-2 bg-indigo-900/90 backdrop-blur-md border border-indigo-500 rounded-xl p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
               <p className="text-xs text-indigo-200 font-bold mb-2 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5"/> SRD Data found for {srdSpeciesOffer.name}!</p>
               <button onClick={handleApplySrdSpecies} className="w-full bg-indigo-500 hover:bg-indigo-400 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg transition-colors">
                 Auto-Fill Base Stats & Traits
               </button>
             </div>
          )}
        </div>
        
        <div className="bg-slate-950 border border-slate-700 rounded-xl p-3 shadow-inner relative">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Arkla Class</label>
          <input 
            type="text" 
            value={formData.class} 
            onChange={e => updateField('class', e.target.value)} 
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" 
            placeholder="Type or select a class..." 
          />

          {srdClassOffer && (
             <div className="absolute top-full left-0 right-0 mt-2 bg-indigo-900/90 backdrop-blur-md border border-indigo-500 rounded-xl p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
               <p className="text-xs text-indigo-200 font-bold mb-2 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5"/> SRD Data found for {srdClassOffer.name}!</p>
               <button onClick={handleApplySrdClass} className="w-full bg-indigo-500 hover:bg-indigo-400 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg transition-colors">
                 Auto-Fill Hit Die & Profs
               </button>
             </div>
          )}
        </div>

        <div className="bg-slate-950 border border-slate-700 rounded-xl p-3 shadow-inner">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Start Level</label>
          <input 
            type="number" 
            min="1" max="20"
            value={formData.level} 
            onFocus={e => e.target.select()}
            onChange={e => updateField('level', e.target.value)} 
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-bold text-center focus:outline-none focus:border-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" 
          />
          <p className="text-[9px] text-slate-500 mt-2 leading-tight">HP and Hit Dice will automatically scale to this level.</p>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Aura / Theme Color</label>
        <select 
          value={formData.theme} 
          onChange={e => updateField('theme', e.target.value)} 
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 shadow-inner"
        >
          <option value="indigo">Tenari Void (Indigo)</option>
          <option value="emerald">Smuggler's Emerald (Green)</option>
          <option value="rose">Dragonfire Rose (Red/Pink)</option>
          <option value="amber">Crown's Radiance (Gold)</option>
          <option value="sky">Privateer's Sky (Blue)</option>
        </select>
      </div>
    </div>
  );
}