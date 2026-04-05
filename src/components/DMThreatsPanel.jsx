import { useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Skull, Hammer, CheckSquare, Square, Flame, Search, MapPin } from 'lucide-react';
import DMEnemyCard from './DMEnemyCard';

export default function DMThreatsPanel({
  activeEnemies,
  selectedEnemies,
  setIsForgingEnemy,
  selectAllEnemies,
  massMathAmount,
  setMassMathAmount,
  handleMassMath,
  toggleEnemySelection
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEnemies = activeEnemies.filter(enemy => 
    enemy.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deployToBoard = async (enemy) => {
    try {
      const mapRef = doc(db, 'campaign', 'battlemap');
      const mapSnap = await getDoc(mapRef);
      if (mapSnap.exists()) {
        const tokens = mapSnap.data().tokens || {};
        if (!tokens[enemy.id]) {
          tokens[enemy.id] = {
            type: 'enemy',
            x: 0, 
            y: 0,
            size: enemy.size || 1,
            hp: enemy.currentHp ?? enemy.hp ?? 10,
            maxHp: enemy.maxHp ?? enemy.hp ?? 10,
            img: enemy.img || enemy.imageUrl || '/icon.png',
            conditions: enemy.conditions || []
          };
          await updateDoc(mapRef, { tokens });
        }
      }
    } catch (err) {
      console.error("Failed to hot-drop enemy to board", err);
    }
  };

  return (
    <aside className="w-full h-full bg-slate-900 flex flex-col shrink-0">
      <div className="p-4 border-b-[3px] border-slate-950 flex justify-between items-center bg-red-600 shrink-0 relative z-10">
         <h2 className="text-sm font-black text-slate-950 uppercase tracking-widest flex items-center gap-2">
           <Skull className="w-5 h-5"/> Threats
         </h2>
         <div className="flex gap-2">
            <button onClick={() => setIsForgingEnemy(true)} className="bg-slate-950 text-red-500 hover:bg-slate-800 hover:text-white p-2 rounded-lg border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all" title="Forge Monster"><Hammer className="w-4 h-4"/></button>
         </div>
      </div>

      <div className="p-4 border-b-[3px] border-slate-950 bg-slate-900 flex flex-col gap-3 shrink-0 relative z-10 shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search active threats..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-red-500 shadow-inner"
          />
        </div>

        {activeEnemies.length > 0 && (
           <>
             <div className="flex items-center justify-between mt-2">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mass Apply</span>
               <button onClick={selectAllEnemies} className="text-[10px] font-black uppercase tracking-widest bg-slate-950 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all">
                 {selectedEnemies.length > 0 ? <CheckSquare className="w-3.5 h-3.5 text-indigo-500"/> : <Square className="w-3.5 h-3.5"/>}
                 {selectedEnemies.length > 0 ? `${selectedEnemies.length} Sel` : 'All'}
               </button>
             </div>
             <div className="flex gap-2">
               <input type="number" value={massMathAmount} onChange={e => setMassMathAmount(e.target.value)} placeholder="Amt..." className="w-20 bg-slate-950 border-2 border-slate-800 rounded-lg text-white font-black text-center px-2 py-2 focus:outline-none focus:border-red-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" />
               <button onClick={() => handleMassMath(true)} disabled={!massMathAmount} className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-slate-950 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg border-2 border-slate-950 transition-all flex items-center justify-center gap-1 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"><Flame className="w-3 h-3"/> Dmg</button>
               <button onClick={() => handleMassMath(false)} disabled={!massMathAmount} className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg border-2 border-slate-950 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">Heal</button>
             </div>
           </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-4 space-y-4 bg-slate-800">
         {filteredEnemies.length === 0 ? (
           <div className="text-center p-6 text-xs text-slate-500 font-bold uppercase tracking-widest border-2 border-slate-950 border-dashed rounded-xl bg-slate-900">
             {searchTerm ? 'No threats match search.' : 'No active threats on board.'}
           </div>
         ) : (
           filteredEnemies.map(enemy => (
             <div key={enemy.id} className="relative group">
               <DMEnemyCard 
                 enemy={enemy} 
                 isSelected={selectedEnemies.includes(enemy.id)}
                 onToggleSelect={() => toggleEnemySelection(enemy.id)}
               />
               <button 
                 onClick={() => deployToBoard(enemy)}
                 className="absolute top-2 right-12 bg-sky-500 hover:bg-sky-400 text-slate-950 p-1.5 rounded-lg border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                 title="Hot-Drop to Map"
               >
                 <MapPin className="w-4 h-4 font-black" />
               </button>
             </div>
           ))
         )}
      </div>
    </aside>
  );
}