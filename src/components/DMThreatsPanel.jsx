import { Skull, Map as MapIcon, Wand2, Hammer, CheckSquare, Square, Flame } from 'lucide-react';
import DMEnemyCard from './DMEnemyCard';

export default function DMThreatsPanel({
  activeEnemies,
  selectedEnemies,
  setActiveManager,
  setIsForgingSpell,
  setIsForgingEnemy,
  selectAllEnemies,
  massMathAmount,
  setMassMathAmount,
  handleMassMath,
  toggleEnemySelection
}) {
  return (
    <aside className="w-full h-[50vh] lg:h-full bg-slate-900 flex flex-col shrink-0">
      <div className="p-4 border-b-[3px] border-slate-950 flex justify-between items-center bg-red-600 shrink-0 relative z-10">
         <h2 className="text-sm font-black text-slate-950 uppercase tracking-widest flex items-center gap-2">
           <Skull className="w-5 h-5"/> Threats
         </h2>
         <div className="flex gap-2">
            <button onClick={() => setActiveManager('encounters')} className="bg-slate-900 hover:bg-slate-800 text-white p-2 rounded-lg border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all" title="Stage Encounters"><MapIcon className="w-4 h-4"/></button>
            <button onClick={() => setIsForgingSpell(true)} className="bg-fuchsia-600 hover:bg-fuchsia-500 text-slate-950 p-2 rounded-lg border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all" title="Forge Spell"><Wand2 className="w-4 h-4"/></button>
            <button onClick={() => setIsForgingEnemy(true)} className="bg-slate-950 text-red-500 hover:bg-slate-800 hover:text-white p-2 rounded-lg border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all" title="Forge Monster"><Hammer className="w-4 h-4"/></button>
         </div>
      </div>

      {activeEnemies.length > 0 && (
         <div className="p-4 border-b-[3px] border-slate-950 bg-slate-900 flex flex-col gap-3 shrink-0 relative z-10 shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
           <div className="flex items-center justify-between">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mass Apply</span>
             <button onClick={selectAllEnemies} className="text-[10px] font-black uppercase tracking-widest bg-slate-950 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 border-2 border-slate-800 shadow-inner transition-colors">
               {selectedEnemies.length > 0 ? <CheckSquare className="w-3.5 h-3.5 text-indigo-500"/> : <Square className="w-3.5 h-3.5"/>}
               {selectedEnemies.length > 0 ? `${selectedEnemies.length} Sel` : 'All'}
             </button>
           </div>
           <div className="flex gap-2">
             <input type="number" value={massMathAmount} onChange={e => setMassMathAmount(e.target.value)} placeholder="Amt..." className="w-20 bg-slate-950 border-2 border-slate-800 rounded-lg text-white font-black text-center px-2 py-2 focus:outline-none focus:border-red-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" />
             <button onClick={() => handleMassMath(true)} disabled={!massMathAmount} className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-slate-950 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg border-2 border-slate-950 transition-all flex items-center justify-center gap-1 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"><Flame className="w-3 h-3"/> Dmg</button>
             <button onClick={() => handleMassMath(false)} disabled={!massMathAmount} className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg border-2 border-slate-950 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">Heal</button>
           </div>
         </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-4 space-y-4 bg-slate-800">
         {activeEnemies.length === 0 ? (
           <div className="text-center p-6 text-xs text-slate-500 font-bold uppercase tracking-widest border-2 border-slate-950 border-dashed rounded-xl bg-slate-900">
             No active threats on board.
           </div>
         ) : (
           activeEnemies.map(enemy => (
             <DMEnemyCard 
               key={enemy.id} 
               enemy={enemy} 
               isSelected={selectedEnemies.includes(enemy.id)}
               onToggleSelect={() => toggleEnemySelection(enemy.id)}
             />
           ))
         )}
      </div>
    </aside>
  );
}