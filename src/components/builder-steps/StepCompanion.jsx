import { PawPrint } from 'lucide-react';

export default function StepCompanion({ 
  hasCompanion, 
  setHasCompanion, 
  companionData, 
  updateCompField, 
  updateCompStat 
}) {
  return (
    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 text-emerald-400 border-b border-emerald-900/50 pb-2 mb-4">
        <PawPrint className="w-5 h-5" /> <h3 className="font-bold uppercase tracking-widest text-sm">Companion Setup</h3>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-inner flex items-center justify-between">
        <div>
          <h4 className="font-bold text-white text-sm">Does this character have a companion?</h4>
          <p className="text-xs text-slate-500">Enable this to provide a familiar, mount, or pet.</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={hasCompanion} onChange={(e) => setHasCompanion(e.target.checked)} />
          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
        </label>
      </div>

      {hasCompanion && (
        <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Companion Name</label>
              <input 
                type="text" 
                value={companionData.name} 
                onChange={e => updateCompField('name', e.target.value)} 
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" 
                placeholder="e.g. The Tiny Bear" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Species / Type</label>
              <input 
                type="text" 
                value={companionData.species} 
                onChange={e => updateCompField('species', e.target.value)} 
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" 
                placeholder="e.g. Celestial Bear" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner">
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input 
                  type="checkbox" 
                  checked={companionData.isDormant} 
                  onChange={(e) => updateCompField('isDormant', e.target.checked)} 
                  className="w-4 h-4 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500 bg-slate-800" 
                />
                <span className="text-sm font-bold text-slate-300">Is Dormant / Inactive?</span>
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Awakens at Char Level</label>
              <input 
                type="number" 
                disabled={!companionData.isDormant} 
                value={companionData.awakeLevel} 
                onChange={e => updateCompField('awakeLevel', e.target.value)} 
                className="w-full bg-slate-900 disabled:opacity-50 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" 
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">HP</label>
              <input 
                type="number" 
                value={companionData.hp} 
                onChange={e => updateCompField('hp', e.target.value)} 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-center font-bold focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">AC</label>
              <input 
                type="number" 
                value={companionData.ac} 
                onChange={e => updateCompField('ac', e.target.value)} 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-center font-bold focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Speed</label>
              <input 
                type="number" 
                value={companionData.speed} 
                onChange={e => updateCompField('speed', e.target.value)} 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-center font-bold focus:outline-none" 
              />
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 shadow-inner">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Companion Stats</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {Object.keys(companionData.stats).map(stat => (
                <div key={stat} className="flex flex-col items-center">
                  <span className="text-[9px] text-slate-500 font-bold mb-1">{stat}</span>
                  <input 
                    type="number" 
                    value={companionData.stats[stat]} 
                    onChange={(e) => updateCompStat(stat, e.target.value)} 
                    className="w-full bg-slate-900 border border-slate-700 rounded text-white font-bold text-center py-1 focus:outline-none" 
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Actions & Description</label>
            <textarea 
              value={companionData.desc} 
              onChange={e => updateCompField('desc', e.target.value)} 
              className="w-full h-16 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 text-sm focus:outline-none resize-y" 
              placeholder="Traits, attacks, and roleplaying notes..." 
            />
          </div>
        </div>
      )}
    </div>
  );
}