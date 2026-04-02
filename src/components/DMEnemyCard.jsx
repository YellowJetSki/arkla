import { useState } from 'react';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Shield, Heart, Skull, Trash2, Swords, Calculator, CheckSquare, Square, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { CONDITIONS_LIST } from '../data/campaignData';
import DialogModal from './shared/DialogModal';

export default function DMEnemyCard({ enemy, isSelected, onToggleSelect }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [displayHp, setDisplayHp] = useState("");
  const [isEditingHp, setIsEditingHp] = useState(false);
  const [mathInput, setMathInput] = useState('');
  const [showConditionPicker, setShowConditionPicker] = useState(false);
  
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  const updateHp = async (amount) => {
    const newHp = Math.max(0, Math.min(enemy.hp, enemy.currentHp + amount));
    
    const batch = writeBatch(db);
    batch.update(doc(db, 'active_enemies', enemy.id), { currentHp: newHp });
    batch.update(doc(db, 'campaign', 'battlemap'), { [`tokens.${enemy.id}.hp`]: newHp });
    
    await batch.commit().catch(e => console.error("Map sync error:", e));
  };

  const setExactHp = async (newHp) => {
    const boundedHp = Math.max(0, Math.min(newHp, enemy.hp));
    const batch = writeBatch(db);
    batch.update(doc(db, 'active_enemies', enemy.id), { currentHp: boundedHp });
    batch.update(doc(db, 'campaign', 'battlemap'), { [`tokens.${enemy.id}.hp`]: boundedHp });
    await batch.commit().catch(e => console.error("Map sync error:", e));
  };

  const handleQuickMath = (e, isDamage) => {
    e.preventDefault();
    if (!mathInput) return;
    const amount = parseInt(mathInput, 10);
    if (isNaN(amount)) return;

    updateHp(isDamage ? -amount : amount);
    setMathInput(''); 
  };

  const killEnemy = async () => {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'active_enemies', enemy.id));
    await batch.commit();
  };

  const handleDelete = () => {
    setDialog({
      isOpen: true,
      title: 'Clear Threat Card',
      message: `Remove ${enemy.name} from the active threats panel? (Their corpse will remain on the battlefield).`,
      type: 'confirm',
      onConfirm: async () => {
        try {
          await updateHp(-9999); 
          setTimeout(() => { killEnemy(); }, 500);
        } catch (err) {
          console.error("Enemy Deletion Sync Failed:", err);
        }
        closeDialog();
      }
    });
  };

  const handleAddCondition = async (cond) => {
    if (!cond) return;
    const conditions = enemy.conditions || [];
    if (!conditions.includes(cond)) {
      const newConds = [...conditions, cond];
      const batch = writeBatch(db);
      batch.update(doc(db, 'active_enemies', enemy.id), { conditions: newConds });
      batch.update(doc(db, 'campaign', 'battlemap'), { [`tokens.${enemy.id}.conditions`]: newConds });
      await batch.commit();
    }
    setShowConditionPicker(false);
  };

  const handleRemoveCondition = async (cond) => {
    const conditions = enemy.conditions || [];
    const newConds = conditions.filter(c => c !== cond);
    const batch = writeBatch(db);
    batch.update(doc(db, 'active_enemies', enemy.id), { conditions: newConds });
    batch.update(doc(db, 'campaign', 'battlemap'), { [`tokens.${enemy.id}.conditions`]: newConds });
    await batch.commit();
  };

  const currentHp = enemy.currentHp ?? enemy.hp;
  const isDead = currentHp <= 0;
  const activeConditions = enemy.conditions || [];
  
  const hpPercent = Math.max(0, Math.min(100, (currentHp / enemy.hp) * 100));
  const hpColor = hpPercent > 50 ? 'bg-emerald-500/80' : hpPercent > 20 ? 'bg-amber-500/80' : 'bg-red-500/80';

  return (
    <>
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} onCancel={closeDialog} />
      
      <div className={`bg-slate-900 border-[3px] ${isSelected ? 'border-indigo-500 shadow-[6px_6px_0px_rgba(99,102,241,1)]' : isDead ? 'border-red-950 shadow-[6px_6px_0px_rgba(127,29,29,1)]' : 'border-slate-950 shadow-[6px_6px_0px_rgba(0,0,0,1)]'} rounded-2xl relative flex flex-col h-full transition-all overflow-hidden group`}>
        
        <button 
          onClick={onToggleSelect}
          className={`absolute top-3 left-3 z-20 p-2 bg-slate-900 rounded-lg transition-transform border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none ${isSelected ? 'bg-indigo-500 text-slate-950' : 'hover:bg-slate-800'}`}
          title={isSelected ? "Deselect Target" : "Select for Mass Damage/Healing"}
        >
          {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-400" />}
        </button>

        <div className={`w-full h-32 relative flex items-center justify-center shrink-0 border-b-[3px] border-slate-950 overflow-hidden ${isDead ? 'bg-red-950' : 'bg-red-600'}`}>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
          <Skull className={`w-20 h-20 ${isDead ? 'text-red-900/50' : 'text-red-950/20'} drop-shadow-[2px_2px_0px_rgba(0,0,0,0.5)]`} />
          
          <div className="absolute bottom-3 left-4 right-14 text-left">
            <h3 className={`font-black text-xl leading-tight truncate uppercase tracking-widest drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] ${isDead ? 'text-red-400 line-through' : 'text-slate-950'}`}>
              {enemy.name}
            </h3>
            <p className="text-[10px] font-bold text-slate-100 uppercase tracking-widest truncate w-full mt-0.5 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
              {enemy.flavor || "Dangerous Foe"}
            </p>
          </div>

          <button 
            onClick={handleDelete} 
            className="absolute top-3 right-3 p-2 bg-slate-950 text-slate-400 hover:text-red-500 hover:bg-slate-900 border-2 border-slate-950 rounded-lg transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none z-20" 
            title="Clear Threat (Leave Corpse)"
          >
            <Trash2 className="w-4 h-4 font-black" />
          </button>
        </div>

        <div className="p-4 flex flex-col flex-1 space-y-4">
          
          <div className="relative bg-slate-950 border-2 border-slate-900 rounded-xl overflow-hidden shadow-inner">
            <div className={`absolute left-0 top-0 bottom-0 ${hpColor} transition-all duration-500 border-r-2 border-slate-950`} style={{ width: `${hpPercent}%` }}></div>
            <div className="relative z-10 flex flex-col p-3 h-full gap-3">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className={`w-5 h-5 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] ${isDead ? 'text-red-500' : 'text-white'}`} />
                  <span className="text-[10px] font-black text-slate-950 bg-white/50 px-1.5 py-0.5 rounded shadow-sm uppercase tracking-widest hidden sm:block">HP</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button onClick={() => updateHp(-1)} className="w-8 h-8 rounded-lg bg-slate-950 hover:bg-slate-800 text-white font-black flex items-center justify-center border-2 border-slate-900 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all">-</button>
                  
                  <div className="flex items-center gap-1.5 text-white bg-slate-900/80 px-2 py-1 rounded-lg shadow-inner border border-slate-800">
                    <input 
                      type="number" 
                      value={isEditingHp ? displayHp : currentHp} 
                      onFocus={(e) => { setDisplayHp(currentHp); setIsEditingHp(true); e.target.select(); }}
                      onChange={(e) => setDisplayHp(e.target.value)} 
                      onBlur={() => { setIsEditingHp(false); setExactHp(Number(displayHp)); }}
                      onKeyDown={(e) => { if(e.key === 'Enter') e.target.blur(); }}
                      className={`w-12 bg-transparent focus:outline-none text-center font-black text-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isDead && !isEditingHp ? 'text-red-400' : 'text-white'}`} 
                    />
                    <span className="text-slate-500 font-bold">/</span>
                    <span className="w-8 text-center text-slate-400 font-bold">{enemy.hp}</span>
                  </div>

                  <button onClick={() => updateHp(1)} className="w-8 h-8 rounded-lg bg-slate-950 hover:bg-slate-800 text-white font-black flex items-center justify-center border-2 border-slate-900 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all">+</button>
                </div>
              </div>

              <div className="flex gap-2 items-center bg-slate-900 p-2 rounded-lg border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                <Calculator className="w-4 h-4 text-slate-500 ml-1 shrink-0" />
                <input 
                  type="number" 
                  value={mathInput}
                  onChange={(e) => setMathInput(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-white font-black text-sm focus:outline-none focus:border-red-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button 
                  onClick={(e) => handleQuickMath(e, true)}
                  disabled={!mathInput}
                  className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-slate-950 border-2 border-slate-950 px-3 py-1.5 rounded flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-widest transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none shrink-0"
                >
                  Dmg
                </button>
                <button 
                  onClick={(e) => handleQuickMath(e, false)}
                  disabled={!mathInput}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 border-2 border-slate-950 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none shrink-0"
                >
                  Heal
                </button>
              </div>

            </div>
          </div>

          <div className="flex gap-3 shrink-0">
            <div className="flex-1 bg-slate-950 border-2 border-slate-900 rounded-xl px-4 py-2 flex items-center justify-between gap-3 shadow-inner">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5"><Shield className="w-4 h-4"/> AC</span>
              <span className="text-xl font-black text-white">{enemy.ac}</span>
            </div>
            <button onClick={() => setIsExpanded(!isExpanded)} className="bg-slate-900 hover:bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl px-4 py-2 flex items-center justify-center gap-1.5 transition-all border-2 border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">
              {isExpanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>} Details
            </button>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border-2 border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 mb-4 relative border-b-2 border-slate-950 pb-3">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-fuchsia-500 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]"><Skull className="w-4 h-4" /> Conditions</span>
              
              <div>
                <button 
                  onClick={() => setShowConditionPicker(!showConditionPicker)} 
                  className="w-full xl:w-auto bg-slate-950 text-[10px] font-black uppercase tracking-widest text-white border-2 border-slate-800 rounded-lg py-1.5 px-4 hover:bg-slate-800 transition-all flex items-center gap-1.5 justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
                
                {showConditionPicker && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border-[3px] border-slate-950 rounded-xl p-2 shadow-[8px_8px_0px_rgba(0,0,0,1)] z-50 grid grid-cols-2 gap-1 animate-in fade-in zoom-in-95">
                    {CONDITIONS_LIST.filter(c => !activeConditions.includes(c)).map(c => (
                      <button 
                        key={c} 
                        onClick={() => handleAddCondition(c)} 
                        className="text-[10px] font-black uppercase tracking-widest bg-slate-950 border border-slate-800 hover:bg-fuchsia-600 hover:text-slate-950 text-slate-300 rounded py-2 px-2 text-left transition-colors truncate"
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
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 italic mt-1">No active conditions</span>
              ) : (
                activeConditions.map(cond => (
                  <button 
                    key={cond} 
                    onClick={() => handleRemoveCondition(cond)} 
                    className="bg-fuchsia-500 hover:bg-fuchsia-400 border-2 border-slate-950 text-slate-950 text-[9px] uppercase font-black px-2 py-1 rounded-lg transition-all group flex items-center gap-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"
                  >
                    {cond} <span className="text-slate-950 font-black text-xs leading-none group-hover:text-red-600">×</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {(enemy.actions?.length > 0 || enemy.features?.length > 0) && (
            <div className="bg-slate-900 p-4 rounded-xl border-2 border-slate-950 space-y-4 mt-auto shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              {enemy.features?.map((f, i) => (
                <div key={`f-${i}`} className="text-xs border-b-2 border-slate-950 pb-3 last:border-0 last:pb-0">
                  <span className="font-black text-amber-500 uppercase tracking-widest block mb-1 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">{f.name}</span>
                  <span className="text-slate-300 font-medium leading-relaxed">{f.desc}</span>
                </div>
              ))}
              {enemy.actions?.map((a, i) => (
                <div key={`a-${i}`} className="text-xs border-b-2 border-slate-950 pb-3 last:border-0 last:pb-0">
                  <span className="font-black text-red-500 uppercase tracking-widest block mb-1 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">{a.name}</span>
                  <span className="text-slate-300 font-medium leading-relaxed">{a.desc}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {isExpanded && (
          <div className="p-4 border-t-[3px] border-slate-950 bg-slate-950 space-y-5 animate-in slide-in-from-top-2 fade-in">
            
            <div className="grid grid-cols-6 gap-2">
              {Object.entries(enemy.stats || {}).map(([stat, val]) => (
                <div key={stat} className="bg-slate-900 border-2 border-slate-800 shadow-inner rounded-lg p-2 flex flex-col items-center">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat}</span>
                  <span className="text-sm font-black text-white">{val}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-[10px] md:text-xs text-slate-300 font-medium bg-slate-900 p-4 rounded-xl border-2 border-slate-800 shadow-inner">
              {enemy.speed && <p><strong className="text-sky-400 font-black uppercase tracking-widest">Speed</strong> {enemy.speed}</p>}
              {enemy.saves && <p><strong className="text-slate-400 font-black uppercase tracking-widest">Saves</strong> {enemy.saves}</p>}
              {enemy.skills && <p><strong className="text-slate-400 font-black uppercase tracking-widest">Skills</strong> {enemy.skills}</p>}
              {enemy.resistances && <p><strong className="text-slate-400 font-black uppercase tracking-widest">Resistances</strong> {enemy.resistances}</p>}
              {enemy.immunities && <p><strong className="text-slate-400 font-black uppercase tracking-widest">Immunities</strong> {enemy.immunities}</p>}
              {enemy.senses && <p><strong className="text-slate-400 font-black uppercase tracking-widest">Senses</strong> {enemy.senses}</p>}
            </div>

            <div className="space-y-4 pt-2">
              {enemy.features && enemy.features.length > 0 && (
                <div className="bg-slate-900 border-2 border-slate-950 rounded-xl p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                  <h5 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 border-b-2 border-slate-950 pb-2 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">Traits</h5>
                  {enemy.features.map((feat, i) => (
                    <p key={i} className="text-xs text-slate-300 font-medium mb-2 leading-relaxed"><strong className="text-white font-black uppercase tracking-wider">{feat.name}.</strong> {feat.desc}</p>
                  ))}
                </div>
              )}
              
              {enemy.actions && enemy.actions.length > 0 && (
                <div className="bg-slate-900 border-2 border-slate-950 rounded-xl p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                  <h5 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b-2 border-slate-950 pb-2 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]"><Swords className="w-4 h-4"/> Actions</h5>
                  {enemy.actions.map((act, i) => (
                    <p key={i} className="text-xs text-slate-300 font-medium mb-2.5 leading-relaxed"><strong className="text-white font-black uppercase tracking-wider">{act.name}.</strong> {act.desc}</p>
                  ))}
                </div>
              )}

              {enemy.parsedActions && enemy.parsedActions.length > 0 && (
                <div className="bg-slate-900 border-2 border-slate-950 rounded-xl p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                  <h5 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b-2 border-slate-950 pb-2 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]"><Swords className="w-4 h-4"/> Actions</h5>
                  {enemy.parsedActions.map((act, i) => (
                    <p key={i} className="text-xs text-slate-300 font-medium mb-3 leading-relaxed whitespace-pre-wrap"><strong className="text-white font-black uppercase tracking-wider block mb-1">{act.name}.</strong>{act.desc}</p>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </>
  );
}