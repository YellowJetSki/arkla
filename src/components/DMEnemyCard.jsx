import { useState } from 'react';
import { doc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Shield, Heart, Skull, Trash2, Swords, Calculator, CheckSquare, Square, Plus } from 'lucide-react';
import { CONDITIONS_LIST, PREMADE_ENEMIES } from '../data/campaignData';

export default function DMEnemyCard({ enemy, isSelected, onToggleSelect }) {
  
  // REQ 6: Rehydrate missing data from PREMADE_ENEMIES so stats are never lost!
  const template = PREMADE_ENEMIES.find(e => e.id === enemy.baseId || e.id === enemy.id) || {};
  const fullEnemy = { ...template, ...enemy };

  // REQ 4: Input buffering for smooth typing
  const [displayHp, setDisplayHp] = useState("");
  const [isEditingHp, setIsEditingHp] = useState(false);
  const [mathInput, setMathInput] = useState('');
  const [showConditionPicker, setShowConditionPicker] = useState(false);

  const updateHp = async (newHp) => {
    const boundedHp = Math.max(0, Math.min(newHp, fullEnemy.hp));
    await updateDoc(doc(db, 'active_enemies', fullEnemy.id), { currentHp: boundedHp });
  };

  const adjustHp = async (amount) => {
    const newHp = Math.max(0, Math.min((fullEnemy.currentHp ?? fullEnemy.hp) + amount, fullEnemy.hp));
    await updateDoc(doc(db, 'active_enemies', fullEnemy.id), { currentHp: newHp });
  };

  const handleQuickMath = (e, isDamage) => {
    e.preventDefault();
    if (!mathInput) return;
    const amount = parseInt(mathInput, 10);
    if (isNaN(amount)) return;

    adjustHp(isDamage ? -amount : amount);
    setMathInput(''); 
  };

  const handleAddCondition = async (condition) => {
    if (!condition) return;
    await updateDoc(doc(db, 'active_enemies', fullEnemy.id), { conditions: arrayUnion(condition) });
    setShowConditionPicker(false);
  };

  const handleRemoveCondition = async (condition) => {
    await updateDoc(doc(db, 'active_enemies', fullEnemy.id), { conditions: arrayRemove(condition) });
  };

  const handleDelete = async () => {
    if (window.confirm(`Remove ${fullEnemy.name} from the board?`)) {
      await deleteDoc(doc(db, 'active_enemies', fullEnemy.id));
    }
  };

  const currentHp = fullEnemy.currentHp ?? fullEnemy.hp;
  const isDead = currentHp <= 0;
  const activeConditions = fullEnemy.conditions || [];
  
  const hpPercent = Math.max(0, Math.min(100, (currentHp / fullEnemy.hp) * 100));
  const hpColor = hpPercent > 50 ? 'bg-emerald-500/20' : hpPercent > 20 ? 'bg-yellow-500/20' : 'bg-red-500/30';

  return (
    <div className={`bg-slate-800 border ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]' : isDead ? 'border-red-900/50 shadow-[0_0_15px_rgba(220,38,38,0.15)]' : 'border-slate-700'} rounded-2xl shadow-lg relative flex flex-col h-full transition-all overflow-hidden`}>
      
      <button 
        onClick={onToggleSelect}
        className="absolute top-3 left-3 z-20 p-1.5 bg-slate-900/80 backdrop-blur-sm rounded-lg hover:scale-110 transition-transform shadow-lg border border-slate-700"
        title={isSelected ? "Deselect Target" : "Select for Mass Damage/Healing"}
      >
        {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-400" /> : <Square className="w-5 h-5 text-slate-400" />}
      </button>

      <div className="w-full h-32 relative flex items-center justify-center shrink-0 border-b border-slate-700 overflow-hidden bg-gradient-to-br from-red-950 via-slate-900 to-slate-900">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay"></div>
        <Skull className={`w-16 h-16 ${isDead ? 'text-red-600/40' : 'text-slate-600/30'} drop-shadow-lg`} />
        
        <div className="absolute bottom-3 left-4 right-14 text-left">
          <h3 className={`font-black text-xl leading-tight truncate ${isDead ? 'text-red-400 line-through' : 'text-white'}`}>
            {fullEnemy.name}
          </h3>
          <p className="text-xs text-slate-400 truncate w-full mt-0.5">
            {fullEnemy.flavor || "A dangerous foe..."}
          </p>
        </div>

        <button 
          onClick={handleDelete} 
          className="absolute top-3 right-3 p-2 bg-red-900/20 hover:bg-red-900/50 text-red-400 border border-red-900/30 hover:border-red-500/50 rounded-lg transition-colors z-10" 
          title="Remove Enemy"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1 space-y-4">
        
        <div className="relative bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-inner min-h-[64px]">
          <div className={`absolute left-0 top-0 bottom-0 ${hpColor} transition-all duration-500`} style={{ width: `${hpPercent}%` }}></div>
          <div className="relative z-10 flex flex-col p-3 h-full gap-3">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className={`w-5 h-5 ${isDead ? 'text-red-500' : 'text-emerald-400'}`} />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest hidden sm:block">HP</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button onClick={() => adjustHp(-1)} className="w-7 h-7 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center border border-slate-600 transition-colors shadow-sm cursor-pointer">-</button>
                
                <div className="flex items-center gap-1.5 text-white">
                  <input 
                    type="number" 
                    value={isEditingHp ? displayHp : currentHp} 
                    onFocus={() => { setDisplayHp(currentHp); setIsEditingHp(true); }}
                    onChange={(e) => setDisplayHp(e.target.value)} 
                    onBlur={() => { setIsEditingHp(false); updateHp(Number(displayHp)); }}
                    onKeyDown={(e) => { if(e.key === 'Enter') e.target.blur(); }}
                    className={`w-12 bg-slate-800/80 border border-slate-600 rounded px-1 py-0.5 focus:border-red-500 focus:outline-none text-center font-black text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isDead && !isEditingHp ? 'text-red-400' : ''}`} 
                  />
                  <span className="text-slate-500 font-bold">/</span>
                  <span className="w-8 text-center text-slate-400 font-bold">{fullEnemy.hp}</span>
                </div>

                <button onClick={() => adjustHp(1)} className="w-7 h-7 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center border border-slate-600 transition-colors shadow-sm cursor-pointer">+</button>
              </div>
            </div>

            <div className="flex gap-2 items-center bg-slate-950/50 p-1.5 rounded-lg border border-slate-700/50">
              <Calculator className="w-4 h-4 text-slate-500 ml-1 shrink-0" />
              <input 
                type="number" 
                value={mathInput}
                onChange={(e) => setMathInput(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button 
                onClick={(e) => handleQuickMath(e, true)}
                disabled={!mathInput}
                className="bg-red-900/40 hover:bg-red-600 disabled:opacity-50 text-red-400 hover:text-white border border-red-900/50 px-3 py-1 rounded text-xs font-bold transition-colors shrink-0"
              >
                Dmg
              </button>
              <button 
                onClick={(e) => handleQuickMath(e, false)}
                disabled={!mathInput}
                className="bg-emerald-900/40 hover:bg-emerald-600 disabled:opacity-50 text-emerald-400 hover:text-white border border-emerald-900/50 px-3 py-1 rounded text-xs font-bold transition-colors shrink-0"
              >
                Heal
              </button>
            </div>

          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 flex flex-col justify-center items-center shadow-sm">
            <label className="flex items-center gap-1.5 text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">
              <Shield className="w-4 h-4 text-blue-400" /> Armor
            </label>
            <div className="text-2xl font-black text-white">{fullEnemy.ac}</div>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 flex flex-col justify-center items-center shadow-sm">
            <label className="flex items-center gap-1.5 text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">
              <Swords className="w-4 h-4 text-yellow-500" /> Perc.
            </label>
            <div className="text-2xl font-black text-white">{fullEnemy.passivePerception}</div>
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-fuchsia-900/30">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2 mb-3 relative">
            <span className="flex items-center gap-2 text-sm text-fuchsia-400 font-bold"><Skull className="w-4 h-4" /> Conditions</span>
            
            <div>
              <button 
                onClick={() => setShowConditionPicker(!showConditionPicker)} 
                className="w-full xl:w-auto bg-slate-800 text-xs font-bold text-white border border-slate-600 rounded-lg py-1.5 px-3 hover:bg-slate-700 transition-colors flex items-center gap-1 justify-center"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
              
              {showConditionPicker && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-fuchsia-500/50 rounded-xl p-2 shadow-2xl z-50 grid grid-cols-2 gap-1 animate-in fade-in zoom-in-95">
                  {CONDITIONS_LIST.filter(c => !activeConditions.includes(c)).map(c => (
                    <button 
                      key={c} 
                      onClick={() => handleAddCondition(c)} 
                      className="text-[10px] font-bold bg-slate-800 hover:bg-fuchsia-600 text-slate-300 hover:text-white rounded py-1.5 px-2 text-left transition-colors truncate"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
          
          <div className="flex flex-wrap gap-2 min-h-[32px]">
            {activeConditions.length === 0 ? (
              <span className="text-xs text-slate-500 italic mt-1">No active conditions</span>
            ) : (
              activeConditions.map(cond => (
                <button 
                  key={cond} 
                  onClick={() => handleRemoveCondition(cond)} 
                  className="bg-fuchsia-900/40 hover:bg-fuchsia-900/80 border border-fuchsia-700/50 text-fuchsia-300 text-[10px] uppercase font-bold px-2 py-1 rounded-lg transition-colors group flex items-center gap-1.5 shadow-sm"
                >
                  {cond} <span className="text-fuchsia-500 group-hover:text-fuchsia-300 font-black text-xs leading-none">×</span>
                </button>
              ))
            )}
          </div>
        </div>

        {(fullEnemy.actions?.length > 0 || fullEnemy.features?.length > 0) && (
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-3 mt-auto shadow-sm">
            {fullEnemy.features?.map((f, i) => (
              <div key={`f-${i}`} className="text-xs border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                <span className="font-bold text-amber-400 block mb-0.5">{f.name}</span>
                <span className="text-slate-300 leading-relaxed">{f.desc}</span>
              </div>
            ))}
            {fullEnemy.actions?.map((a, i) => (
              <div key={`a-${i}`} className="text-xs border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                <span className="font-bold text-red-400 block mb-0.5">{a.name}</span>
                <span className="text-slate-300 leading-relaxed">{a.desc}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}