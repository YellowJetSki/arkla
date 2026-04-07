import { PawPrint, Plus, Trash2 } from 'lucide-react';
import { getModifier } from '../../services/arklaEngine';

export default function StepCompanion({ 
  hasCompanion, 
  setHasCompanion, 
  companionData, 
  updateCompField, 
  updateCompStat 
}) {
  
  if (!hasCompanion) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6 animate-in slide-in-from-right-4 duration-300">
        <div className="w-24 h-24 bg-slate-900 border-[3px] border-slate-950 rounded-full flex items-center justify-center shadow-inner">
          <PawPrint className="w-12 h-12 text-slate-700" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-black text-white uppercase tracking-widest">No Companion Assigned</h3>
          <p className="text-xs font-bold text-slate-400">Summon a familiar, mount, or pet to aid the character.</p>
        </div>
        <button 
          onClick={() => setHasCompanion(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl border-2 border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Bind Companion
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between border-b-[3px] border-slate-900 pb-3">
        <div className="flex items-center gap-3 text-emerald-400">
          <PawPrint className="w-6 h-6" /> <h3 className="font-black uppercase tracking-widest text-sm">Companion Setup</h3>
        </div>
        <button 
          onClick={() => setHasCompanion(false)}
          className="text-slate-500 hover:text-red-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded border border-slate-800 transition-colors"
        >
          <Trash2 className="w-3 h-3" /> Sever Bond
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-inner">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Companion Name</label>
          <input 
            type="text" 
            value={companionData.name || ''} 
            onChange={e => updateCompField('name', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500" 
            placeholder="e.g. The Tiny Bear" 
          />
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-inner">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Species / Type</label>
          <input 
            type="text" 
            value={companionData.species || ''} 
            onChange={e => updateCompField('species', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500" 
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
            <div>
              <span className="text-sm font-bold text-slate-300 block">Is Dormant / Inactive?</span>
              <span className="text-[10px] text-slate-500 font-bold block">Hide companion tab on character sheet.</span>
            </div>
          </label>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Awakens at Char Level</label>
          <input 
            type="number" 
            disabled={!companionData.isDormant} 
            value={companionData.awakeLevel || 1} 
            onFocus={e => e.target.select()}
            onChange={e => updateCompField('awakeLevel', e.target.value)} 
            className="w-full bg-slate-900 disabled:opacity-50 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm font-bold focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" 
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-inner">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Max HP</label>
          <input 
            type="number" 
            onFocus={e => e.target.select()}
            value={companionData.hp || 10} 
            onChange={e => updateCompField('hp', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white text-center font-bold focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" 
          />
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-inner">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Armor Class</label>
          <input 
            type="number" 
            onFocus={e => e.target.select()}
            value={companionData.ac || 10} 
            onChange={e => updateCompField('ac', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white text-center font-bold focus:outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" 
          />
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-inner">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Speed (ft)</label>
          <input 
            type="number" 
            onFocus={e => e.target.select()}
            value={companionData.speed || 30} 
            onChange={e => updateCompField('speed', e.target.value)} 
            className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white text-center font-bold focus:outline-none focus:border-sky-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" 
          />
        </div>
      </div>

      <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-inner">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Core Stats</h4>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map((stat) => (
            <div key={stat} className="bg-slate-950 border border-slate-800 rounded-lg p-2 flex flex-col items-center">
              <span className="text-[9px] font-black text-slate-500 uppercase">{stat}</span>
              <input 
                type="number" 
                value={companionData.stats[stat]} 
                onFocus={e => e.target.select()}
                onChange={(e) => updateCompStat(stat, e.target.value)} 
                className="w-full bg-transparent text-center text-white font-black focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none mt-1" 
              />
              <span className="text-[10px] text-slate-400 font-bold mt-1">
                {getModifier(companionData.stats[stat] || 10) >= 0 ? '+' : ''}{getModifier(companionData.stats[stat] || 10)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-inner">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Actions & Attacks</label>
          <textarea 
            value={companionData.attacks || ''} 
            onChange={e => updateCompField('attacks', e.target.value)} 
            className="w-full h-32 bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-slate-300 text-sm focus:outline-none focus:border-emerald-500 resize-y custom-scrollbar" 
            placeholder="Bite: +4 to hit, 1d6+2 piercing..." 
          />
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-inner">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Traits & Features</label>
          <textarea 
            value={companionData.traits || ''} 
            onChange={e => updateCompField('traits', e.target.value)} 
            className="w-full h-32 bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-slate-300 text-sm focus:outline-none focus:border-emerald-500 resize-y custom-scrollbar" 
            placeholder="Pack Tactics..." 
          />
        </div>
      </div>

    </div>
  );
}