import { useState } from 'react';
import { Shield, Swords, Minus, Plus, Heart, Footprints, ChevronDown, ChevronUp, CheckSquare, Square, Skull } from 'lucide-react';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function DMEnemyCard({ enemy, isSelected, onToggleSelect, onEdit }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hp = enemy.currentHp ?? enemy.hp ?? 0;
  const maxHp = enemy.maxHp ?? enemy.hp ?? 1;
  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));

  const updateHp = async (amount) => {
    const newHp = Math.max(0, Math.min(maxHp, hp + amount));
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'active_enemies', enemy.id), { currentHp: newHp });
      batch.update(doc(db, 'campaign', 'battlemap'), { [`tokens.${enemy.id}.hp`]: newHp });
      await batch.commit();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={`bg-slate-950 border-[3px] rounded-xl transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] ${isSelected ? 'border-red-500' : 'border-slate-900'}`}>
      
      {/* HEADER: Name, Select, Edit */}
      <div className="flex justify-between items-center p-3 border-b-2 border-slate-900 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <button onClick={onToggleSelect} className="text-slate-400 hover:text-red-400 transition-colors">
            {isSelected ? <CheckSquare className="w-5 h-5 text-red-500" /> : <Square className="w-5 h-5" />}
          </button>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none mb-1">
              {enemy.name}
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              CR {enemy.cr || '?'} • {enemy.type || 'Monster'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setIsExpanded(!isExpanded)} 
             className="p-1.5 bg-slate-900 border-2 border-slate-950 rounded-lg text-slate-400 hover:text-white shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"
           >
             {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
           </button>
        </div>
      </div>

      {/* CORE STATS (Always Visible) */}
      <div className="p-3 grid grid-cols-3 gap-3">
        {/* HP Controls */}
        <div className="col-span-3 sm:col-span-1 bg-slate-900 border-2 border-slate-950 rounded-xl p-2 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
          <div className="absolute bottom-0 left-0 h-1 w-full bg-slate-800">
            <div 
              className={`h-full transition-all duration-500 ${hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-amber-500' : 'bg-red-500'}`} 
              style={{ width: `${hpPercent}%` }} 
            />
          </div>
          <div className="flex justify-between items-center w-full mb-1">
             <button onClick={() => updateHp(-1)} className="text-white hover:text-red-400 bg-slate-950 rounded p-1 shadow-sm">
               <Minus className="w-3 h-3"/>
             </button>
             <span className="text-[10px] text-red-500 font-black uppercase tracking-widest">
               <Heart className="w-3 h-3 inline pb-0.5"/> HP
             </span>
             <button onClick={() => updateHp(1)} className="text-white hover:text-emerald-400 bg-slate-950 rounded p-1 shadow-sm">
               <Plus className="w-3 h-3"/>
             </button>
          </div>
          <span className="text-lg font-black text-white leading-none">
            {hp} <span className="text-[10px] text-slate-500">/ {maxHp}</span>
          </span>
        </div>

        {/* AC & Speed */}
        <div className="col-span-3 sm:col-span-2 grid grid-cols-2 gap-3">
          <div className="bg-slate-900 border-2 border-slate-950 rounded-xl p-2 flex flex-col items-center justify-center shadow-inner">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Shield className="w-3 h-3"/> AC
            </span>
            <span className="text-lg font-black text-emerald-400 leading-none">
              {enemy.ac || enemy.armorClass || 10}
            </span>
          </div>
          <div className="bg-slate-900 border-2 border-slate-950 rounded-xl p-2 flex flex-col items-center justify-center shadow-inner">
            <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Footprints className="w-3 h-3"/> Speed
            </span>
            <span className="text-lg font-black text-white leading-none">
              {enemy.speed || 30}
            </span>
          </div>
        </div>
      </div>

      {/* EXPANDED ACTION RUNDOWN */}
      {isExpanded && (
        <div className="p-3 border-t-2 border-slate-900 bg-slate-900/30 space-y-3 animate-in fade-in slide-in-from-top-2">
          
          {/* Attributes */}
          {(enemy.attributes || enemy.stats) && (
            <div className="grid grid-cols-6 gap-1 bg-slate-950 p-2 rounded-lg border-2 border-slate-900">
              {Object.entries(enemy.attributes || enemy.stats).map(([stat, val]) => {
                const numVal = typeof val === 'object' ? val.value : val;
                if (numVal === undefined) return null;
                const mod = Math.floor((numVal - 10) / 2);
                return (
                  <div key={stat} className="text-center">
                    <span className="block text-[8px] uppercase font-black text-slate-500">{stat.substring(0,3)}</span>
                    <span className="block text-xs font-black text-white">{mod >= 0 ? `+${mod}` : mod}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div>
            <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Swords className="w-3.5 h-3.5"/> Actions
            </h4>
            {enemy.actions && enemy.actions.length > 0 ? (
              <div className="space-y-2">
                {enemy.actions.map((action, i) => (
                  <div key={i} className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-sm">
                    <p className="font-bold text-white mb-0.5 leading-tight">
                      {action.name} 
                      <span className="text-[9px] text-red-400 ml-1 tracking-widest uppercase border border-red-900 bg-red-950/50 px-1 rounded">
                        {action.type}
                      </span>
                    </p>
                    <p className="text-slate-400 text-xs leading-snug">{action.desc}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No specific actions listed. Click edit to forge some.</p>
            )}
          </div>
          
          <button 
            onClick={onEdit} 
            className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors border border-slate-700"
          >
             Edit Threat Details
          </button>
        </div>
      )}
    </div>
  );
}