import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Swords, Trash2, ArrowDown, Play, Users, X, RotateCcw, Plus, AlertTriangle, Dices, ChevronUp, ChevronDown } from 'lucide-react';
import { getModifier } from '../services/arklaEngine';

export default function InitiativeTracker({ unlockedCharacters, activeEnemies, isBattleMode, onLaunchBattle, onExitBattle }) {
  const [initiative, setInitiative] = useState([]);
  const [activeTurn, setActiveTurn] = useState(-1); 
  const [round, setRound] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [isExpanded, setIsExpanded] = useState(true); // NEW: Controls the bottom drawer
  
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [newCustomName, setNewCustomName] = useState('');
  
  const [activePlayerSnap, setActivePlayerSnap] = useState(null);

  const missingIdsTracker = useRef(new Set());
  const initiativeRef = useRef(initiative);

  useEffect(() => {
    initiativeRef.current = initiative;
  }, [initiative]);

  useEffect(() => {
    const initRef = doc(db, 'campaign', 'initiative');
    const unsub = onSnapshot(initRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setInitiative(data.order || []);
        setActiveTurn(data.activeTurn !== undefined ? data.activeTurn : -1);
        setRound(data.round || 1);
      }
      setIsLoaded(true); 
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const activeActor = initiative[activeTurn];
    if (activeActor && activeActor.type === 'player') {
      const unsub = onSnapshot(doc(db, 'characters', activeActor.id), (snap) => {
        if (snap.exists()) setActivePlayerSnap(snap.data());
      });
      return () => unsub();
    } else {
      setActivePlayerSnap(null);
    }
  }, [activeTurn, initiative]);

  useEffect(() => {
    const autoSync = async () => {
      if (!isLoaded) return; 

      try {
        const currentOrder = initiativeRef.current;
        const currentIds = currentOrder.map(i => i.id);
        
        const safePlayers = (unlockedCharacters || [])
          .filter(id => id && typeof id === 'string' && !missingIdsTracker.current.has(id));
        
        const safeEnemies = (activeEnemies || [])
          .filter(e => e && e.id && typeof e.id === 'string' && !missingIdsTracker.current.has(e.id))
          .map(e => e.id);
        
        const targetIds = [...safePlayers, ...safeEnemies];
        
        const hasMissing = targetIds.some(id => !currentIds.includes(id));
        const staleActors = currentOrder.filter(i => i.type !== 'custom' && !targetIds.includes(i.id));

        if (hasMissing || staleActors.length > 0) {
          let newOrder = [...currentOrder];
          
          newOrder = newOrder.filter(item => targetIds.includes(item.id) || item.type === 'custom');

          if (hasMissing) {
            const missingPlayerIds = safePlayers.filter(id => !currentIds.includes(id));
            
            if (missingPlayerIds.length > 0) {
              const playerDocs = await Promise.all(
                missingPlayerIds.map(id => getDoc(doc(db, 'characters', id)))
              );
              
              playerDocs.forEach((d, index) => {
                if (d.exists()) {
                  const p = { id: d.id, ...d.data() };
                  newOrder.push({ id: p.id, name: p.name || 'Unknown', type: 'player', value: 0 });
                } else {
                  missingIdsTracker.current.add(missingPlayerIds[index]);
                }
              });
            }

            activeEnemies.forEach(e => {
              if (targetIds.includes(e.id) && !currentIds.includes(e.id)) {
                newOrder.push({ id: e.id, name: e.name || 'Unknown', type: 'enemy', value: 0 });
              }
            });
          }

          await saveInitiative(newOrder, activeTurn, round);
        }
      } catch (error) {
        console.error("Safely aborted initiative sync to prevent crash:", error);
      }
    };

    if (isLoaded) {
      autoSync();
    }
  }, [unlockedCharacters, activeEnemies, isLoaded]); 

  const saveInitiative = async (newOrder, newTurn, newRound) => {
    await setDoc(doc(db, 'campaign', 'initiative'), { order: newOrder, activeTurn: newTurn, round: newRound }, { merge: true });
    
    const activeActor = (newTurn >= 0 && newTurn < newOrder.length) ? newOrder[newTurn] : null;
    await setDoc(doc(db, 'campaign', 'battlemap'), { 
      activeTokenId: activeActor ? activeActor.id : null 
    }, { merge: true });
  };

  const updateValue = (index, val) => {
    const newOrder = [...initiative];
    newOrder[index].value = Number(val);
    newOrder.sort((a, b) => b.value - a.value);
    saveInitiative(newOrder, activeTurn, round);
  };

  const resetValues = () => {
    const resetOrder = initiative.map(item => ({ ...item, value: 0 }));
    saveInitiative(resetOrder, -1, 1);
  };

  const autoRollEnemies = () => {
    const newOrder = [...initiative];
    let changed = false;
    
    newOrder.forEach(actor => {
      if (actor.type === 'enemy') {
        const eData = activeEnemies.find(e => e.id === actor.id);
        if (eData) {
          const dexMod = getModifier(eData.stats?.DEX || 10);
          const roll = Math.floor(Math.random() * 20) + 1 + dexMod;
          actor.value = roll;
          changed = true;
        }
      }
    });

    if (changed) {
      newOrder.sort((a, b) => b.value - a.value);
      saveInitiative(newOrder, activeTurn, round);
    }
  };

  const nextTurn = () => {
    if (initiative.length === 0) return;
    
    let nextIndex = activeTurn;
    let newRound = round;
    let foundAlive = false;

    for (let i = 1; i <= initiative.length; i++) {
      let checkIndex = (activeTurn + i) % initiative.length;
      
      if (checkIndex === 0 && activeTurn !== -1) {
        newRound++;
      }

      const actor = initiative[checkIndex];
      let isDead = false;
      
      if (actor.type === 'enemy') {
        const eData = activeEnemies.find(e => e.id === actor.id);
        if (eData && (eData.currentHp ?? eData.hp ?? 1) <= 0) {
          isDead = true;
        }
      }

      if (!isDead) {
        nextIndex = checkIndex;
        foundAlive = true;
        break;
      }
    }

    if (!foundAlive) {
      nextIndex = activeTurn + 1;
      if (nextIndex >= initiative.length) { nextIndex = 0; newRound++; }
    }

    saveInitiative(initiative, nextIndex, newRound);
  };

  const addCustomActor = (e) => {
    e.preventDefault();
    if (!newCustomName.trim()) return;
    
    const newActor = {
      id: 'custom_' + Date.now(),
      name: newCustomName.trim(),
      type: 'custom',
      value: 20 
    };
    
    const newOrder = [...initiative, newActor].sort((a, b) => b.value - a.value);
    saveInitiative(newOrder, activeTurn, round);
    setNewCustomName('');
    setShowCustomForm(false);
  };

  const removeCustomActor = (id) => {
    const newOrder = initiative.filter(i => i.id !== id);
    saveInitiative(newOrder, activeTurn, round);
  };

  const activeActorData = initiative[activeTurn];
  const activeEnemyData = activeActorData?.type === 'enemy' ? activeEnemies.find(e => e.id === activeActorData.id) : null;
  
  let activeConditions = [];
  if (activeActorData?.type === 'enemy' && activeEnemyData) activeConditions = activeEnemyData.conditions || [];
  if (activeActorData?.type === 'player' && activePlayerSnap) activeConditions = activePlayerSnap.conditions || [];

  const showConditionWarning = activeConditions.length > 0;

  return (
    <div className={`flex flex-col bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-all duration-300 ease-in-out z-40 w-full ${isExpanded ? 'h-[45vh] md:h-[40vh]' : 'h-14'}`}>
      
      {/* COMPACT HEADER (Always visible) */}
      <div 
        className="h-14 px-3 md:px-4 flex items-center justify-between shrink-0 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800/30 transition-colors" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <button className="text-slate-400 hover:text-white p-1 rounded transition-colors focus:outline-none">
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
          
          <h2 className="text-sm font-black text-white flex items-center gap-2 shrink-0">
            <Swords className="w-4 h-4 text-fuchsia-500" /> <span className="hidden sm:inline">Initiative</span>
          </h2>
          
          <span className="hidden sm:inline-block text-[10px] bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-400 font-bold uppercase tracking-widest shadow-inner shrink-0">
            {activeTurn === -1 ? 'Pre-Combat' : `R${round} • T${activeTurn + 1}`}
          </span>
          
          {/* Minimized Active Actor Info */}
          {!isExpanded && activeActorData && (
            <div className="flex items-center gap-2 ml-1 sm:ml-2 pl-2 sm:pl-3 border-l border-slate-700 truncate">
               <Play className="w-3 h-3 text-fuchsia-400 fill-current shrink-0" />
               <span className={`text-xs font-bold truncate ${activeActorData.type === 'enemy' ? 'text-red-400' : 'text-indigo-400'}`}>
                 {activeActorData.name}
               </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 pl-2">
           {!isExpanded && initiative.length > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); nextTurn(); }} 
                className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-[10px] shadow-sm"
              >
                Next <ArrowDown className="w-3.5 h-3.5" />
              </button>
           )}
        </div>
      </div>

      {/* EXPANDED CONTENT */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none hidden'}`}>
        <div className="p-3 flex flex-col h-full bg-transparent">
          
          {/* TOOLBAR */}
          <div className="flex flex-wrap gap-2 justify-end mb-3 shrink-0">
            <button onClick={autoRollEnemies} className="bg-indigo-900/40 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/50 p-1.5 md:px-2.5 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 shadow-sm">
              <Dices className="w-3 h-3" /> Roll NPCs
            </button>
            <button onClick={() => setShowCustomForm(!showCustomForm)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-1.5 md:px-2.5 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 shadow-sm border border-slate-700">
              <Plus className="w-3 h-3" /> Lair Action
            </button>

            {!isBattleMode ? (
              <button onClick={() => { if(onLaunchBattle) onLaunchBattle(); }} className="bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/50 text-emerald-400 hover:text-white p-1.5 md:px-2.5 rounded text-[10px] font-bold uppercase tracking-widest shadow-sm transition-colors flex items-center gap-1.5">
                <Users className="w-3 h-3" /> Show Map
              </button>
            ) : (
              <button onClick={() => { if(onExitBattle) onExitBattle(); }} className="bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white p-1.5 md:px-2.5 rounded text-[10px] font-bold uppercase tracking-widest shadow-sm transition-colors flex items-center gap-1.5">
                <X className="w-3 h-3" /> Hide Map
              </button>
            )}
            <button onClick={resetValues} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-amber-400 p-1.5 md:px-2.5 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 shadow-sm">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* CUSTOM FORM */}
          {showCustomForm && (
            <form onSubmit={addCustomActor} className="mb-3 flex gap-2 animate-in fade-in slide-in-from-top-2 shrink-0">
              <input 
                type="text" 
                value={newCustomName}
                onChange={(e) => setNewCustomName(e.target.value)}
                placeholder="e.g. Environmental Hazard..." 
                className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white text-sm font-bold focus:outline-none focus:border-fuchsia-500 shadow-inner"
                autoFocus
              />
              <button type="submit" disabled={!newCustomName.trim()} className="bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white px-4 py-1.5 rounded text-[10px] uppercase tracking-widest font-bold transition-colors shadow-sm">
                Add
              </button>
            </form>
          )}

          {/* ACTOR LIST */}
          <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-1 mb-3">
            {initiative.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 text-center border border-slate-800 border-dashed rounded-lg bg-slate-900/50">Waiting for active characters or enemies...</p>
            ) : (
              initiative.map((actor, idx) => {
                const enemyData = actor.type === 'enemy' ? activeEnemies.find(e => e.id === actor.id) : null;
                const isDead = enemyData && (enemyData.currentHp ?? enemyData.hp ?? 1) <= 0;
                const hpPercent = enemyData ? Math.max(0, Math.min(100, ((enemyData.currentHp ?? enemyData.hp ?? 0) / (enemyData.maxHp ?? enemyData.hp ?? 1)) * 100)) : null;
                const hpColor = hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-yellow-500' : 'bg-red-500';

                return (
                  <div key={actor.id + idx} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all shadow-sm
                    ${activeTurn === idx ? 'bg-fuchsia-900/20 border-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.2)]' : 'bg-slate-950 border-slate-800'}
                    ${isDead ? 'opacity-40 grayscale' : ''}
                  `}>
                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        {activeTurn === idx && <Play className="w-2.5 h-2.5 text-fuchsia-400 fill-current shrink-0" />}
                        <span className={`font-bold truncate ${actor.type === 'enemy' ? 'text-red-400' : 'text-indigo-400'} ${activeTurn === idx ? 'text-sm' : 'text-xs'}`}>{actor.name}</span>
                      </div>
                      
                      {enemyData && (
                        <div className="w-full h-0.5 bg-slate-800 rounded-full overflow-hidden shrink-0 mt-0.5">
                           <div className={`h-full ${hpColor} transition-all duration-500`} style={{ width: `${hpPercent}%` }}></div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {actor.type === 'custom' && (
                        <button onClick={() => removeCustomActor(actor.id)} className="p-1 text-slate-500 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <input 
                        type="number" 
                        value={actor.value} 
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => updateValue(idx, e.target.value)}
                        className="w-10 bg-slate-800 border border-slate-600 rounded px-1 py-0.5 text-center text-white text-xs font-black focus:outline-none focus:border-fuchsia-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none shadow-inner"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* FOOTER */}
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            {showConditionWarning && (
              <div className="flex-1 bg-amber-900/40 border border-amber-500/50 rounded p-1.5 flex items-center justify-center gap-1.5 animate-in fade-in zoom-in-95 shadow-sm w-full">
                 <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                 <span className="text-[9px] font-black text-amber-200 uppercase tracking-widest truncate">
                   Reminder: {activeActorData.name} is {activeConditions.join(', ')}
                 </span>
              </div>
            )}

            {initiative.length > 0 && (
              <button onClick={nextTurn} className="w-full sm:w-auto flex-1 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black uppercase tracking-widest py-2 rounded-lg transition-all flex justify-center items-center gap-2 text-[10px] shadow-[0_0_10px_rgba(217,70,239,0.3)] shrink-0">
                {activeTurn === -1 ? 'Start Combat' : 'Next Turn'} <ArrowDown className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}