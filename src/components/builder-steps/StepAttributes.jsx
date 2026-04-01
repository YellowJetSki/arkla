import { Dices } from 'lucide-react';

export default function StepAttributes({ formData, updateStat, handleRollAll }) {
  return (
    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
        <div className="flex items-center gap-3 text-indigo-400">
          <Dices className="w-5 h-5" /> <h3 className="font-bold uppercase tracking-widest text-sm">Attributes</h3>
        </div>
      </div>

      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center mb-6 shadow-inner">
        <p className="text-sm text-slate-300 mb-4">Input the results of your physical dice rolls below, or allow the engine to digitally roll 4d6 (drop lowest) for you.</p>
        <button 
          onClick={handleRollAll} 
          className="bg-indigo-900/40 hover:bg-indigo-600 text-indigo-300 hover:text-white px-5 py-2.5 rounded-xl text-xs uppercase font-black tracking-widest transition-colors border border-indigo-500/50 shadow-sm mx-auto flex items-center gap-2"
        >
          <Dices className="w-4 h-4" /> Digital Roll (4d6)
        </button>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {Object.keys(formData.stats).map(stat => (
          <div key={stat} className="bg-slate-900 border border-slate-700 rounded-xl p-3 flex flex-col items-center shadow-inner focus-within:border-indigo-500 transition-colors">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat}</span>
            <input 
              type="number" 
              onFocus={(e) => e.target.select()}
              value={formData.stats[stat]} 
              onChange={(e) => updateStat(stat, e.target.value)}
              className="w-full bg-transparent text-white font-black text-3xl text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}