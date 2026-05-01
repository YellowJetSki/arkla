import { useState } from 'react';
import { doc, updateDoc, writeBatch, deleteField } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Shield, Heart, Skull, Trash2, Swords, Calculator, CheckSquare, Square, Edit3, Plus, Stars } from 'lucide-react';
import DialogModal from './shared/DialogModal';

const CONDITIONS = [
  'Blinded', 'Charmed', 'Deafened', 'Exhaustion', 'Frightened',
  'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified',
  'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious'
];

export default function DMEnemyCard({ enemy, isSelected, onToggleSelect, onEdit }) {
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

  const renderActionBlocks = (items, colorClass, Icon, defaultTitle) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="mb-3 last:mb-0">
        <h5 className={`text-[10px] font-black ${colorClass} uppercase tracking-widest mb-1.5 flex items-center gap-1.5`}><Icon className="w-3.5 h-3.5"/> {defaultTitle}</h5>
        <div className="space-y-1.5">
          {items.map((item, i) => {
            const lines = item.desc ? item.desc.split(/\n+/) : [];
            let presetName = "";
            if (item.name && item.name !== 'Actions' && item.name !== 'Traits' && item.name !== 'Reactions') {
               presetName = item.name;
            }

            return (
              <div key={i} className="space-y-1.5">
                {lines.filter(l => l.trim()).map((line, j) => {
                  let actionName = presetName && j === 0 ? presetName : "";
                  let actionDesc = line.trim();
                  
                  if (!actionName) {
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
                  }

                  return (
                    <div key={j} className="bg-slate-950/40 rounded-lg p-2.5 text-[11px] text-slate-300 leading-snug border-l-2 border-slate-700 shadow-inner">
                       {actionName && <strong className="text-white font-black uppercase tracking-wider block mb-0.5 drop-shadow-sm">{actionName}</strong>}
                       {actionDesc}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} onCancel={closeDialog} />
      
      <div className={`bg-slate-900 border-[3px] ${isSelected ? 'border-indigo-500 shadow-[4px_4px_0px_rgba(99,102,241,1)]' : isDead ? 'border-red-950 shadow-[4px_4px_0px_rgba(127,29,29,1)]' : 'border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)]'} rounded-xl flex flex-col transition-all overflow-hidden relative group`}>
        
        {/* SLEEK HEADER WITH AC */}
        <div className={`flex items-center justify-between p-2.5 border-b-[3px] border-slate-950 shrink-0 relative transition-colors ${isDead ? 'bg-red-950' : 'bg-red-600'}`}>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
          
          <div className="flex items-center gap-2.5 overflow-hidden relative z-10 w-full pr-2">
            <button onClick={onToggleSelect} className="text-slate-950 hover:text-white transition-colors shrink-0">
              {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-300 bg-slate-950 rounded shadow-inner" /> : <Square className="w-4 h-4 opacity-60" />}
            </button>
            <div className="w-8 h-8 rounded-md border-2 border-slate-950 overflow-hidden bg-slate-900 shrink-0 relative flex items-center justify-center">
              {enemy.img && enemy.img !== '/icon.png' ? (
                <img src={enemy.img} className={`w-full h-full object-cover ${isDead ? 'opacity-30 grayscale' : ''}`} />
              ) : (
                <Skull className={`w-full h-full p-1.5 ${isDead ? 'text-red-900' : 'text-red-500'}`} />
              )}
              {isDead && <Skull className="absolute inset-0 m-auto w-5 h-5 text-red-500 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]" />}
            </div>
            <h3 className={`font-black text-sm uppercase tracking-widest truncate drop-shadow-sm ${isDead ? 'text-red-500 line-through' : 'text-slate-950'}`}>
              {enemy.name}
            </h3>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0 relative z-10">
            {/* COMPACT AC PILL */}
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-md border border-slate-800 shadow-inner mr-1" title="Armor Class">
               <Shield className="w-3.5 h-3.5 text-amber-500" />
               <span className="font-black text-white text-xs">{enemy.ac}</span>
            </div>

            <div className="flex items-center gap-0.5 bg-slate-950/20 p-0.5 rounded-md border border-slate-950/20 shadow-inner">
              <button onClick={onEdit} title="Edit Enemy" className="p-1.5 text-slate-950 hover:bg-slate-950 hover:text-amber-400 rounded transition-colors"><Edit3 className="w-3.5 h-3.5 font-black"/></button>
              <button onClick={handleDelete} title="Remove Threat" className="p-1.5 text-slate-950 hover:bg-slate-950 hover:text-red-500 rounded transition-colors"><Trash2 className="w-3.5 h-3.5 font-black"/></button>
            </div>
          </div>
        </div>

        {/* HP & QUICK MATH */}
        <div className="relative border-b-2 border-slate-950 bg-slate-900 shrink-0">
          <div className={`absolute left-0 top-0 bottom-0 ${hpColor} opacity-20 transition-all duration-500`} style={{ width: `${hpPercent}%` }}></div>
          <div className="relative z-10 flex items-center justify-between p-2.5">
             <div className="flex items-center gap-2">
                <Heart className={`w-4 h-4 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] ${isDead ? 'text-red-500' : 'text-white'}`} />
                <div className="flex items-center gap-1 text-white bg-slate-950 px-1.5 py-0.5 rounded-md shadow-inner border border-slate-800">
                  <input 
                    type="number" 
                    value={isEditingHp ? displayHp : currentHp} 
                    onFocus={(e) => { setDisplayHp(currentHp); setIsEditingHp(true); e.target.select(); }}
                    onChange={(e) => setDisplayHp(e.target.value)} 
                    onBlur={() => { setIsEditingHp(false); setExactHp(Number(displayHp)); }}
                    onKeyDown={(e) => { if(e.key === 'Enter') e.target.blur(); }}
                    className={`w-8 bg-transparent focus:outline-none text-right font-black text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isDead && !isEditingHp ? 'text-red-400' : 'text-white'}`} 
                  />
                  <span className="text-slate-500 font-bold text-xs">/</span>
                  <span className="w-6 text-left text-slate-400 font-bold text-xs">{enemy.hp}</span>
                </div>
             </div>

             <div className="flex items-center gap-1.5">
                <div className="flex items-center bg-slate-950 rounded-md border border-slate-800 overflow-hidden shadow-inner w-16">
                  <Calculator className="w-3 h-3 text-slate-500 ml-1.5 shrink-0" />
                  <input 
                    type="number" 
                    value={mathInput}
                    onChange={(e) => setMathInput(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                    className="w-full bg-transparent px-1.5 py-1 text-white font-black text-xs focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <button onClick={(e) => handleQuickMath(e, true)} disabled={!mathInput} className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-slate-950 border border-slate-950 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-[1px_1px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none transition-all">Dmg</button>
                <button onClick={(e) => handleQuickMath(e, false)} disabled={!mathInput} className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 border border-slate-950 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-[1px_1px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none transition-all">Heal</button>
             </div>
          </div>
        </div>

        {/* SINGLE-LINE CONDITIONS */}
        <div className="bg-slate-950 p-2 flex items-center gap-2 border-b-2 border-slate-900 relative shrink-0">
           <button onClick={() => setShowConditionPicker(!showConditionPicker)} className="text-[9px] font-black uppercase tracking-widest bg-fuchsia-600 text-slate-950 hover:bg-fuchsia-500 px-2 py-1 rounded border border-slate-950 shadow-[1px_1px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none flex items-center gap-1 shrink-0">
             <Plus className="w-3 h-3"/> Cond
           </button>
           
           <div className="flex flex-wrap gap-1 flex-1">
              {activeConditions.length === 0 ? (
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest italic ml-1">Normal</span>
              ) : (
                activeConditions.map(cond => (
                  <button key={cond} onClick={() => handleRemoveCondition(cond)} className="bg-fuchsia-500 hover:bg-fuchsia-400 text-slate-950 text-[8px] uppercase font-black px-1.5 py-0.5 rounded flex items-center gap-1 group transition-all">
                    {cond} <span className="group-hover:text-red-600 font-black leading-none">×</span>
                  </button>
                ))
              )}
           </div>

           {/* CONDITION PICKER */}
           {showConditionPicker && (
             <div className="absolute left-2 top-8 w-48 bg-slate-900 border-2 border-slate-950 rounded-lg p-1.5 shadow-[4px_4px_0px_rgba(0,0,0,1)] z-50 grid grid-cols-2 gap-1 animate-in fade-in zoom-in-95">
               {CONDITIONS.filter(c => !activeConditions.includes(c)).map(c => (
                 <button key={c} onClick={() => handleAddCondition(c)} className="text-[8px] font-black uppercase tracking-widest bg-slate-950 border border-slate-800 hover:bg-fuchsia-600 hover:text-slate-950 text-slate-300 rounded py-1 px-1.5 text-left transition-colors truncate">
                   {c}
                 </button>
               ))}
             </div>
           )}
        </div>

        {/* COMPACT AUTO-PARSED STATS AREA */}
        <div className="p-3 bg-slate-900 flex-1 overflow-y-auto max-h-[220px] custom-scrollbar space-y-3">
           
           <div className="text-[9px] md:text-[10px] text-slate-400 font-medium leading-snug flex flex-wrap gap-x-3 gap-y-1">
              {enemy.speed && <span><strong className="text-sky-400 uppercase tracking-wider">Spd</strong> {enemy.speed}</span>}
              {enemy.senses && <span><strong className="text-amber-400 uppercase tracking-wider">Sen</strong> {enemy.senses.replace('passive Perception', 'PP')}</span>}
              {enemy.saves && <span><strong className="text-slate-300 uppercase tracking-wider">Sv</strong> {enemy.saves}</span>}
           </div>

           {(safeFeatures.length > 0 || safeActions.length > 0 || safeParsedActions.length > 0) && (
             <div className="w-full h-px bg-slate-800"></div>
           )}

           {renderActionBlocks(safeFeatures, 'text-amber-500', Stars, 'Traits')}
           {renderActionBlocks(safeActions, 'text-red-500', Swords, 'Actions')}
           {renderActionBlocks(safeParsedActions, 'text-red-500', Swords, 'Actions')}
           
        </div>

      </div>
    </>
  );
}