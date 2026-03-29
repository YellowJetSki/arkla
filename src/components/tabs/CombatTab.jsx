import React, { useState } from 'react';
import { Zap, Sword, RotateCcw, AlertTriangle, Crosshair, Sparkles, Battery, Heart, Trash2, Hammer, Plus } from 'lucide-react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { parseAndScaleAttack } from '../../services/arklaEngine';

// Mini-component to handle the premium typing experience for high-pool resources
const ResourceCounter = ({ res, idx, isDM, handleResourceToggle }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [displayVal, setDisplayVal] = useState("");

  return (
    <div className="flex items-center gap-3 bg-slate-950/80 p-2 rounded-xl border border-slate-800 shadow-inner">
      <Heart className="w-5 h-5 text-emerald-500 shrink-0 ml-1" />
      <input 
        type="number" 
        disabled={isDM}
        value={isEditing ? displayVal : res.current}
        onFocus={(e) => { setDisplayVal(res.current); setIsEditing(true); e.target.select(); }}
        onChange={(e) => setDisplayVal(e.target.value)}
        onBlur={() => {
          setIsEditing(false);
          const newVal = Math.min(res.max, Math.max(0, parseInt(displayVal) || 0));
          handleResourceToggle(idx, newVal);
        }}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
        className="w-16 bg-transparent text-white font-black text-xl text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span className="text-slate-500 font-bold text-sm">/ {res.max}</span>
    </div>
  );
};

export default function CombatTab({ 
  char,
  charId, 
  isDM, 
  activeTheme,
  combatWarnings,
  activeConditions,
  handleAddCondition,
  handleRemoveCondition,
  handleResourceToggle,
  showDialog
}) {
  const [isForgingAttack, setIsForgingAttack] = useState(false);
  const [customAttack, setCustomAttack] = useState({ name: '', damage: '1d8', type: 'Slashing', notes: '' });

  // Safe parsing to prevent fatal crashes if a feature description is undefined
  const bonusActions = (char.features || []).filter(f => f.desc?.toLowerCase().includes('bonus action'));
  const reactions = (char.features || []).filter(f => f.desc?.toLowerCase().includes('reaction'));
  const hasSpells = char.spells && char.spells.length > 0;
  
  const resources = char.resources || [];

  const handleRemoveAttack = (attack, index) => {
    if (!showDialog) return;
    showDialog({
      title: 'Remove Attack?',
      message: `Are you sure you want to delete ${attack.name}?`,
      type: 'confirm',
      onConfirm: async () => {
        const newAttacks = [...(char.attacks || [])];
        newAttacks.splice(index, 1);
        await updateDoc(doc(db, 'characters', charId), { attacks: newAttacks });
        showDialog({ isOpen: false });
      },
      onCancel: () => showDialog({ isOpen: false })
    });
  };

  const handleForgeCustomAttack = async (e) => {
    e.preventDefault();
    if (!customAttack.name || !customAttack.damage) return;

    const newAttack = {
      name: customAttack.name,
      hit: '--', 
      damage: customAttack.damage, 
      type: customAttack.type,
      notes: customAttack.notes
    };

    try {
      await updateDoc(doc(db, 'characters', charId), { attacks: arrayUnion(newAttack) });
      setCustomAttack({ name: '', damage: '1d8', type: 'Slashing', notes: '' });
      setIsForgingAttack(false);
    } catch (err) {
      console.error("Failed to forge attack:", err);
    }
  };

  const classesArray = char.classes || [{ name: char.class || 'Adventurer', level: char.level || 1 }];
  const totalLevel = classesArray.reduce((sum, c) => sum + c.level, 0);
  
  const dynamicAttacks = (char.attacks || []).map(atk => parseAndScaleAttack(atk, char.stats, totalLevel, classesArray));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {(combatWarnings.length > 0 || isDM) && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-fuchsia-500" /> Active Status
            </h3>
            {isDM && (
              <select onChange={handleAddCondition} value="" className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-fuchsia-500 shadow-inner">
                <option value="" disabled>+ Add Condition</option>
                {['Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Exhaustion'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>
          
          {combatWarnings.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No active conditions.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {combatWarnings.map((warning, i) => (
                <div key={i} className="flex justify-between items-start bg-fuchsia-950/30 border border-fuchsia-900/50 p-3 rounded-lg shadow-inner">
                  <span className="text-sm font-bold text-fuchsia-300 leading-snug">{warning}</span>
                  {isDM && (
                    <button onClick={() => handleRemoveCondition(warning.split(':')[0])} className="text-fuchsia-500 hover:text-fuchsia-300 transition-colors ml-4 shrink-0 font-black text-xs uppercase tracking-wider bg-slate-950 px-2 py-1 rounded">
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {resources.length > 0 && (
        <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-48 h-48 ${activeTheme.bg} blur-[80px] opacity-10 rounded-full pointer-events-none`}></div>
          <h3 className="text-lg font-black text-white flex items-center gap-2 mb-6 relative z-10 border-b border-slate-700/50 pb-2 uppercase tracking-widest drop-shadow-sm">
            <Battery className={`w-5 h-5 ${activeTheme.text}`} /> Class Resources
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
            {resources.map((res, idx) => (
              <div key={idx} className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 shadow-sm hover:border-slate-500/30 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-bold text-slate-200">{res.name}</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-950 px-2 py-0.5 rounded border border-slate-800 shadow-inner">
                    {res.recharge} Rest
                  </span>
                </div>
                
                {res.isPool || res.max > 15 ? (
                  <ResourceCounter res={res} idx={idx} isDM={isDM} handleResourceToggle={handleResourceToggle} />
                ) : (
                  <div className="flex gap-1.5 flex-wrap">
                    {Array.from({ length: res.max }).map((_, bubbleIdx) => (
                      <button 
                        key={bubbleIdx} 
                        onClick={() => handleResourceToggle(idx, bubbleIdx < res.current ? res.current - 1 : res.current + 1)} 
                        disabled={isDM} 
                        className={`w-7 h-7 rounded-full border-2 transition-all duration-300 shrink-0 ${bubbleIdx < res.current ? `${activeTheme.bg} ${activeTheme.border} shadow-[0_0_15px_rgba(255,255,255,0.2)] cursor-pointer hover:scale-110` : 'bg-slate-800 border-slate-600 opacity-50 cursor-pointer hover:opacity-80'}`} 
                        title={bubbleIdx < res.current ? "Click to expend" : "Click to regain"} 
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-900/50 pb-2">
            <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <Sword className="w-4 h-4" /> Action
            </h3>
            {isDM && (
              <button 
                onClick={() => setIsForgingAttack(!isForgingAttack)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border shadow-sm ${isForgingAttack ? 'bg-emerald-700 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-800/80 border-slate-700 text-emerald-400 hover:text-white hover:bg-slate-700'}`}
              >
                <Hammer className="w-3 h-3" /> {isForgingAttack ? 'Close Forge' : 'Forge Attack'}
              </button>
            )}
          </div>

          <div className="space-y-3">
            
            {isForgingAttack && isDM && (
              <form onSubmit={handleForgeCustomAttack} className="bg-slate-900/80 backdrop-blur-sm p-5 rounded-2xl border border-emerald-500/30 shadow-inner animate-in fade-in slide-in-from-top-2 space-y-4 relative z-10">
                <h4 className="text-sm font-black text-emerald-400 flex items-center gap-2 uppercase tracking-widest border-b border-emerald-900/50 pb-2"><Hammer className="w-4 h-4" /> Homebrew Attack Forge</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Attack Name</label>
                    <input type="text" onFocus={(e) => e.target.select()} required value={customAttack.name} onChange={e => setCustomAttack({...customAttack, name: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 shadow-inner" placeholder="e.g. Rusty Blunderbuss" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Base Dice</label>
                    <input type="text" onFocus={(e) => e.target.select()} required value={customAttack.damage} onChange={e => setCustomAttack({...customAttack, damage: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 shadow-inner" placeholder="e.g. 1d10" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Damage Type</label>
                    <input type="text" onFocus={(e) => e.target.select()} value={customAttack.type} onChange={e => setCustomAttack({...customAttack, type: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 shadow-inner" placeholder="e.g. Piercing" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Engine Overrides & Notes</label>
                    <input type="text" onFocus={(e) => e.target.select()} value={customAttack.notes} onChange={e => setCustomAttack({...customAttack, notes: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 shadow-inner" placeholder="e.g. Use: CHA, Ranged, Loading" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 mt-2"><Plus className="w-4 h-4" /> Inject Attack</button>
              </form>
            )}

            {hasSpells && (
              <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-xl p-4 shadow-sm hover:border-indigo-500/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-indigo-300 text-sm flex items-center gap-1.5"><Sparkles className="w-4 h-4"/> Cast a Spell</span>
                  <span className="bg-indigo-900/50 text-indigo-200 text-[10px] font-bold px-2 py-1 rounded border border-indigo-700 shadow-inner uppercase tracking-wider">Magic</span>
                </div>
                <p className="text-xs text-indigo-200/80 leading-relaxed">
                  Refer to your <strong className="text-indigo-400">Spells Tab</strong> to view your spellbook and expend spell slots.
                </p>
              </div>
            )}

            {dynamicAttacks.map((attack, i) => (
              <div key={i} className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/80 rounded-xl p-4 shadow-sm hover:border-emerald-500/30 transition-colors group relative">
                {isDM && (
                  <button 
                    onClick={() => handleRemoveAttack(attack, i)}
                    className="absolute top-3 right-3 p-2 opacity-0 group-hover:opacity-100 bg-slate-950 text-slate-500 hover:text-red-400 rounded-lg transition-all shadow-inner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className="flex justify-between items-start mb-3">
                  <span className="font-black text-white text-base pr-8 drop-shadow-sm">{attack.name}</span>
                  <span className="bg-slate-950 text-slate-400 text-[10px] font-bold px-2 py-1 rounded border border-slate-800 shadow-inner uppercase tracking-wider">{attack.type}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 px-3 py-1.5 rounded-lg shadow-inner">
                    <Crosshair className="w-4 h-4" />
                    <span className="text-base font-black tracking-wider">{attack.hit}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950 text-slate-300 border border-slate-800 px-3 py-1.5 rounded-lg shadow-inner">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">DMG</span>
                    <span className="text-base font-black">{attack.damage}</span>
                  </div>
                </div>
                {attack.notes && <p className="text-xs text-slate-500 mt-3 italic bg-slate-900 p-2 rounded-lg border border-slate-800/50">{attack.notes}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest border-b border-amber-900/50 pb-2 flex items-center gap-2">
            <Zap className="w-4 h-4" /> Bonus Action
          </h3>
          <div className="space-y-3">
            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/80 rounded-xl p-4 shadow-sm hover:border-amber-500/30 transition-colors">
              <span className="font-black text-white text-sm block mb-1">Off-Hand Attack</span>
              <p className="text-xs text-slate-400 leading-relaxed">Make an attack with a light weapon in your other hand. Don't add your modifier to the damage.</p>
            </div>
            {bonusActions.map((feat, i) => (
              <div key={`ba-${i}`} className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/80 rounded-xl p-4 shadow-sm hover:border-amber-500/30 transition-colors">
                <span className="font-black text-white text-sm block mb-1">{feat.name}</span>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest border-b border-purple-900/50 pb-2 flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Reaction
          </h3>
          <div className="space-y-3">
            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/80 rounded-xl p-4 shadow-sm hover:border-purple-500/30 transition-colors">
              <span className="font-black text-white text-sm block mb-1">Opportunity Attack</span>
              <p className="text-xs text-slate-400 leading-relaxed">Make one melee attack against a hostile creature that moves out of your reach.</p>
            </div>
            {reactions.map((feat, i) => (
              <div key={`re-${i}`} className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/80 rounded-xl p-4 shadow-sm hover:border-purple-500/30 transition-colors">
                <span className="font-black text-white text-sm block mb-1">{feat.name}</span>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}