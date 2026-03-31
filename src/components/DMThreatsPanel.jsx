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
    <aside className="w-full lg:w-[350px] xl:w-[400px] bg-slate-900/40 flex flex-col shrink-0 h-[50vh] lg:h-full">
      <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-red-950/20 shrink-0">
         <h2 className="text-xs font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
           <Skull className="w-4 h-4"/> Threats
         </h2>
         <div className="flex gap-1.5">
            <button onClick={() => setActiveManager('encounters')} className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded flex items-center gap-1 border border-slate-600" title="Stage Encounters"><MapIcon className="w-3 h-3"/> Stag</button>
            <button onClick={() => setIsForgingSpell(true)} className="text-[10px] font-bold bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-2 py-1 rounded flex items-center gap-1 shadow-sm" title="Forge Spell"><Wand2 className="w-3 h-3"/> Spl</button>
            <button onClick={() => setIsForgingEnemy(true)} className="text-[10px] font-bold bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded flex items-center gap-1 shadow-sm" title="Forge Monster"><Hammer className="w-3 h-3"/> Mon</button>
         </div>
      </div>

      {activeEnemies.length > 0 && (
         <div className="p-3 border-b border-slate-800 bg-slate-900/80 flex flex-col gap-2 shrink-0">
           <div className="flex items-center justify-between">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mass Apply</span>
             <button onClick={selectAllEnemies} className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded flex items-center gap-1 border border-slate-600">
               {selectedEnemies.length > 0 ? <CheckSquare className="w-3 h-3"/> : <Square className="w-3 h-3"/>}
               {selectedEnemies.length > 0 ? `${selectedEnemies.length} Sel` : 'All'}
             </button>
           </div>
           <div className="flex gap-2">
             <input type="number" value={massMathAmount} onChange={e => setMassMathAmount(e.target.value)} placeholder="Amt..." className="w-16 bg-slate-950 border border-slate-700 rounded text-white text-xs px-2 py-1 focus:outline-none focus:border-red-500 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" />
             <button onClick={() => handleMassMath(true)} disabled={!massMathAmount} className="flex-1 bg-red-900/40 hover:bg-red-600 disabled:opacity-50 text-red-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded border border-red-900/50 transition-colors flex items-center justify-center gap-1"><Flame className="w-3 h-3"/> Dmg</button>
             <button onClick={() => handleMassMath(false)} disabled={!massMathAmount} className="flex-1 bg-emerald-900/40 hover:bg-emerald-600 disabled:opacity-50 text-emerald-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded border border-emerald-900/50 transition-colors">Heal</button>
           </div>
         </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
         {activeEnemies.length === 0 ? (
           <div className="text-center p-4 text-xs text-slate-500 italic border border-slate-800 border-dashed rounded-xl">No active threats on the board.</div>
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