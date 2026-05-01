import { useState } from 'react';
import { doc, updateDoc, writeBatch, deleteField } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Shield, Heart, Skull, Trash2, Swords, Calculator, CheckSquare, Square, Edit3, ChevronDown, ChevronUp, Plus, Stars } from 'lucide-react';
import { CONDITIONS_LIST } from '../data/campaignData';
import DialogModal from './shared/DialogModal';

export default function DMEnemyCard({ enemy, isSelected, onToggleSelect, onEdit }) {
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

  const handleDelete = () => {
    setDialog({
      isOpen: true,
      title: 'Clear Threat',
      message: `Completely remove ${enemy.name} from the active threats panel and the battlemap?`,
      type: 'confirm',
      onConfirm: async () => {
        try {
          const batch = writeBatch(db);
          batch.delete(doc(db, 'active_enemies', enemy.id));
          batch.update(doc(db, 'campaign', 'battlemap'), { [`tokens.${enemy.id}`]: deleteField() });
          await batch.commit();
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

  const normalizeArray = (val, defaultName) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return [{ name: defaultName, desc: val }];
    return [];
  };

  const safeActions = normalizeArray(enemy.actions, 'Actions');
  const safeFeatures = normalizeArray(enemy.features, 'Traits');
  const safeParsedActions = normalizeArray(enemy.parsedActions, 'Actions');

  const renderActionBlocks = (items, borderColor) => {
    return items.map((item, i) => {
      const lines = item.desc ? item.desc.split(/\n+/) : [];
      return (
        <div key={i} className="mb-0">
          {item.name !== 'Actions' && item.name !== 'Traits' && item.name !== 'Reactions' && (
             <strong className="text-white font-black uppercase tracking-wider block mb-2 text-[11px]">{item.name}</strong>
          )}
          <div className="space-y-2.5">
            {lines.filter(l => l.trim()).map((line, j) => {
              let actionName = "";
              let actionDesc = line.trim();
              
              const mdMatch = actionDesc.match(/^[*]+([^*]+)[*]+(.*)/);
              if (mdMatch) {
                actionName = mdMatch[1].trim();
                actionDesc = mdMatch[2].trim();
                if (actionName.endsWith('.')) actionName = actionName.slice(0, -1);
              } else {
                const firstPeriodIdx = actionDesc.indexOf('.');
                if (firstPeriodIdx > 0 && firstPeriodIdx < 45) { 
                   actionName = actionDesc.substring(0, firstPeriodIdx).trim();
                   actionDesc = actionDesc.substring(firstPeriodIdx + 1).trim();
                }
              }

              return (
                <div key={j} className={`bg-slate-950/60 rounded-lg p-3.5 border-l-[3px] shadow-inner ${borderColor}`}>
                   {actionName && <span className="text-white font-black uppercase tracking-wider block mb-1.5 text-[11px] drop-shadow-sm">{actionName}</span>}
                   <span className="text-xs text-slate-300 font-medium leading-relaxed">{actionDesc}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <>
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} onCancel={closeDialog} />
      
      <div className={`bg-slate-900 border-[3px] ${isSelected ? 'border-indigo-500 shadow-[6px_6px_0px_rgba(99,102,241,1)]' : isDead ? 'border-red-950 shadow-[6px_6px_0px_rgba(127,29,29,1)]' : 'border-slate-950 shadow-[6px_6px_0px_rgba(0,0,0,1)]'} rounded-2xl flex flex-col h-full transition-all overflow-hidden relative group`}>
        
        <div className={`flex items-start justify-between p-3 border-b-[3px] border-slate-950 shrink-0 relative overflow-hidden transition-colors ${isDead ? 'bg-red-950' : 'bg-red-600'}`}>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
          
          <div className="flex items-center gap-3 overflow-hidden relative z-10">
            <button onClick={onToggleSelect} className="text-slate-950 hover:text-white transition-colors">
              {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-300 bg-slate-950 rounded shadow-inner" /> : <Square className="w-5 h-5 opacity-60" />}
            </button>
            <div className="w-10 h-10 rounded-lg border-2 border-slate-950 overflow-hidden bg-slate-900 shrink-0 shadow-[2px_2px_0px_rgba(0,0,0,0.5)] relative flex items-center justify-center">
              {enemy.img && enemy.img !== '/icon.png' ? (
                <img src={enemy.img} className={`w-full h-full object-cover ${isDead ? 'opacity-30 grayscale' : ''}`} />
              ) : (
                <Skull className={`w-full h-full p-2 ${isDead ? 'text-red-900' : 'text-red-500'}`} />
              )}
              {isDead && <Skull className="absolute inset-0 m-auto w-6 h-6 text-red-500 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]" />}
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className={`font-black text-base uppercase tracking-widest truncate drop-shadow-[1px_1px_0px_rgba(0,0,0,0.5)] ${isDead ? 'text-red-500 line-through' : 'text-slate-950'}`}>
                {enemy.name}
              </h3>
              <span className="text-[9px] font-bold text-slate-100 uppercase tracking-widest truncate drop-shadow-sm">{enemy.flavor || "Threat"}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 shrink-0 bg-slate-950/20 p-1 rounded-lg border border-slate-950/20 relative z-10 shadow-inner">
            <button onClick={onEdit} title="Edit Enemy" className="p-1.5 text-slate-950 hover:bg-slate-950 hover:text-amber-400 rounded transition-colors"><Edit3 className="w-4 h-4 font-black"/></button>
            <button onClick={handleDelete} title="Remove Threat" className="p-1.5 text-slate-950 hover:bg-slate-950 hover:text-red-500 rounded transition-colors"><Trash2 className="w-4 h-4 font-black"/></button>
          </div>
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

          <div className="bg-slate-900 p-3 rounded-xl border-2 border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] relative z-10">
            <div className="flex items-center justify-between border-b-2 border-slate-950 pb-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-500 flex items-center gap-1.5 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]"><Skull className="w-4 h-4"/> Conditions</span>
              <button onClick={() => setShowConditionPicker(!showConditionPicker)} className="text-[10px] font-black uppercase tracking-widest bg-slate-950 text-white px-2 py-1 rounded-md border border-slate-800 hover:bg-slate-800 transition-colors flex items-center gap-1 shadow-inner">
                <Plus className="w-3 h-3"/> Add
              </button>
            </div>

            {showConditionPicker && (
              <div className="absolute right-3 top-12 mt-1 w-56 bg-slate-900 border-[3px] border-slate-950 rounded-xl p-2 shadow-[8px_8px_0px_rgba(0,0,0,1)] z-50 grid grid-cols-2 gap-1 animate-in fade-in zoom-in-95">
                {CONDITIONS_LIST.filter(c => !activeConditions.includes(c)).map(c => (
                  <button 
                    key={c} 
                    onClick={() => handleAddCondition(c)} 
                    className="text-[9px] font-black uppercase tracking-widest bg-slate-950 border border-slate-800 hover:bg-fuchsia-600 hover:text-slate-950 text-slate-300 rounded py-1.5 px-2 text-left transition-colors truncate shadow-inner"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 min-h-[28px]">
              {activeConditions.length === 0 ? (
                <span className="text-[10px] font-bold text-slate-500 italic mt-1 uppercase tracking-widest">No active conditions</span>
              ) : (
                activeConditions.map(cond => (
                  <button 
                    key={cond} 
                    onClick={() => handleRemoveCondition(cond)} 
                    className="bg-fuchsia-500 hover:bg-fuchsia-400 text-slate-950 text-[9px] uppercase font-black px-2 py-1 rounded-md flex items-center gap-1 border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none group transition-all"
                  >
                    {cond} <span className="group-hover:text-red-600 font-black text-xs leading-none">×</span>
                  </button>
                ))
              )}
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
              {safeFeatures.length > 0 && (
                <div className="bg-slate-900 border-2 border-slate-950 rounded-xl p-3 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                  <h5 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 border-b-2 border-slate-950 pb-2 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] flex items-center gap-1.5"><Stars className="w-4 h-4"/> Traits</h5>
                  {renderActionBlocks(safeFeatures, 'border-amber-500/50')}
                </div>
              )}
              
              {safeActions.length > 0 && (
                <div className="bg-slate-900 border-2 border-slate-950 rounded-xl p-3 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                  <h5 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b-2 border-slate-950 pb-2 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]"><Swords className="w-4 h-4"/> Actions</h5>
                  {renderActionBlocks(safeActions, 'border-red-500/50')}
                </div>
              )}

              {safeParsedActions.length > 0 && (
                <div className="bg-slate-900 border-2 border-slate-950 rounded-xl p-3 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                  <h5 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b-2 border-slate-950 pb-2 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]"><Swords className="w-4 h-4"/> Actions</h5>
                  {renderActionBlocks(safeParsedActions, 'border-red-500/50')}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </>
  );
}