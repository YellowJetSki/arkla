import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Swords, Trash2, ArrowDown, Play, Users, X, RotateCcw, Plus, AlertTriangle, Dices } from 'lucide-react';
import { getModifier } from '../services/arklaEngine';

export default function InitiativeTracker({ unlockedCharacters, activeEnemies, expandedOverride = false }) {
  const [initiative, setInitiative] = useState([]);
  const [activeTurn, setActiveTurn] = useState(-1); 
  const [round, setRound] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  
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
    const newOrder = [...initiativeRef.current];
    const activeId = activeTurn >= 0 ? newOrder[activeTurn]?.id : null;
    
    newOrder[index].value = Number(val) || 0;
    newOrder.sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));
    
    const newTurn = activeId ? newOrder.findIndex(a => a.id === activeId) : activeTurn;
    saveInitiative(newOrder, newTurn, round);
  };

  const resetValues = () => {
    const resetOrder = initiativeRef.current.map(item => ({ ...item, value: 0 }));
    saveInitiative(resetOrder, -1, 1);
  };

  const autoRollEnemies = () => {
    const newOrder = [...initiativeRef.current];
    const activeId = activeTurn >= 0 ? newOrder[activeTurn]?.id : null;
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
      newOrder.sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));
      const newTurn = activeId ? newOrder.findIndex(a => a.id === activeId) : activeTurn;
      saveInitiative(newOrder, newTurn, round);
    }
  };

  const nextTurn = () => {
    const currentOrder = initiativeRef.current;
    if (currentOrder.length === 0) return;
    
    let nextIndex = activeTurn;
    let newRound = round;
    let foundAlive = false;

    for (let i = 1; i <= currentOrder.length; i++) {
      let checkIndex = (activeTurn + i) % currentOrder.length;
      
      if (checkIndex === 0 && activeTurn !== -1) {
        newRound++;
      }

      const actor = currentOrder[checkIndex];
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
      if (nextIndex >= currentOrder.length) { nextIndex = 0; newRound++; }
    }

    saveInitiative(currentOrder, nextIndex, newRound);
  };

  const addCustomActor = async (e) => {
    e.preventDefault();
    if (!newCustomName.trim()) return;
    
    const newActor = {
      id: 'custom_' + Date.now(),
      name: newCustomName.trim(),
      type: 'custom',
      value: 20 
    };
    
    const currentInitiative = [...initiativeRef.current];
    const activeId = activeTurn >= 0 ? currentInitiative[activeTurn]?.id : null;

    const newOrder = [...currentInitiative, newActor].sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));
    const newTurn = activeId ? newOrder.findIndex(a => a.id === activeId) : activeTurn;

    await saveInitiative(newOrder, newTurn, round);
    setNewCustomName('');
    setShowCustomForm(false);
  };

  const removeCustomActor = (id) => {
    const currentInitiative = [...initiativeRef.current];
    const activeId = activeTurn >= 0 ? currentInitiative[activeTurn]?.id : null;
    
    const newOrder = currentInitiative.filter(i => i.id !== id);
    const newTurn = activeId ? newOrder.findIndex(a => a.id === activeId) : activeTurn;
    
    saveInitiative(newOrder, newTurn >= 0 ? newTurn : -1, round);
  };

  const activeActorData = initiative[activeTurn];
  const activeEnemyData = activeActorData?.type === 'enemy' ? activeEnemies.find(e => e.id === activeActorData.id) : null;
  
  let activeConditions = [];
  if (activeActorData?.type === 'enemy' && activeEnemyData) activeConditions = activeEnemyData.conditions || [];
  if (activeActorData?.type === 'player' && activePlayerSnap) activeConditions = activePlayerSnap.conditions || [];

  const showConditionWarning = activeConditions.length > 0;

  return (
    <div className={`flex flex-col bg-slate-900 border-[3px] border-slate-950 rounded-2xl shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all duration-300 ease-in-out w-full h-full overflow-hidden`}>
      
      {/* COMPACT HEADER */}
      <div className="p-4 md:p-5 flex items-center justify-between shrink-0 border-b-[3px] border-slate-950 bg-indigo-600">
        <div className="flex items-center gap-3 overflow-hidden">
          
          <h2 className="text-lg font-black text-slate-950 flex items-center gap-2 shrink-0 uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,0.3)]">
            <Swords className="w-5 h-5" /> <span className="hidden sm:inline">Initiative</span>
          </h2>
          
          <span className="hidden sm:inline-block text-xs bg-slate-950 px-3 py-1.5 rounded-lg border-2 border-slate-900 text-indigo-400 font-black uppercase tracking-widest shadow-[2px_2px_0px_rgba(0,0,0,1)] shrink-0">
            {activeTurn === -1 ? 'Pre-Combat' : `Round ${round} • Turn ${activeTurn + 1}`}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 pl-2">
           {initiative.length > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); nextTurn(); }} 
                className="bg-indigo-950 hover:bg-slate-900 text-indigo-400 font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-xs border-[3px] border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none"
              >
                Next <ArrowDown className="w-4 h-4" />
              </button>
           )}
        </div>
      </div>

      {/* EXPANDED CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden opacity-100">
        <div className="p-4 md:p-6 flex flex-col h-full bg-slate-950">
          
          {/* TOOLBAR */}
          <div className="flex flex-wrap gap-3 justify-end mb-4 shrink-0">
            <button onClick={autoRollEnemies} className="bg-indigo-600 hover:bg-indigo-500 text-slate-950 border-[3px] border-slate-950 px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none">
              <Dices className="w-4 h-4 font-black" /> Roll NPCs
            </button>
            <button onClick={() => setShowCustomForm(!showCustomForm)} className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none border-[3px] border-slate-950">
              <Plus className="w-4 h-4" /> Lair Action
            </button>
            <button onClick={resetValues} className="bg-slate-900 hover:bg-slate-800 border-[3px] border-slate-950 text-amber-500 hover:text-amber-400 px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none">
              <RotateCcw className="w-4 h-4 font-black" /> Reset
            </button>
          </div>

          {/* CUSTOM FORM */}
          {showCustomForm && (
            <form onSubmit={addCustomActor} className="mb-5 flex gap-3 animate-in fade-in slide-in-from-top-2 shrink-0">
              <input 
                type="text" 
                value={newCustomName}
                onChange={(e) => setNewCustomName(e.target.value)}
                placeholder="e.g. Environmental Hazard..." 
                className="flex-1 bg-slate-900 border-[3px] border-slate-950 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                autoFocus
              />
              <button type="submit" disabled={!newCustomName.trim()} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-slate-950 px-6 py-3 rounded-xl text-xs uppercase tracking-widest font-black transition-all border-[3px] border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none">
                Add
              </button>
            </form>
          )}

          {/* ACTOR LIST */}
          <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2 mb-4">
            {initiative.length === 0 ? (
              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest p-8 text-center border-2 border-slate-900 border-dashed rounded-2xl bg-slate-900/50">Waiting for active characters or enemies...</p>
            ) : (
              initiative.map((actor, idx) => {
                const enemyData = actor.type === 'enemy' ? activeEnemies.find(e => e.id === actor.id) : null;
                const isDead = enemyData && (enemyData.currentHp ?? enemyData.hp ?? 1) <= 0;
                const hpPercent = enemyData ? Math.max(0, Math.min(100, ((enemyData.currentHp ?? enemyData.hp ?? 0) / (enemyData.maxHp ?? enemyData.hp ?? 1)) * 100)) : null;
                const hpColor = hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-amber-500' : 'bg-red-500';

                return (
                  <div key={actor.id + idx} className={`flex items-center gap-4 p-4 rounded-2xl border-[3px] transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)]
                    ${activeTurn === idx ? 'bg-slate-800 border-indigo-500' : 'bg-slate-900 border-slate-950'}
                    ${isDead ? 'opacity-40 grayscale' : ''}
                  `}>
                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="flex items-center gap-3">
                        {activeTurn === idx && <Play className="w-4 h-4 text-indigo-500 fill-current shrink-0 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]" />}
                        <span className={`font-black uppercase tracking-widest truncate drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] ${actor.type === 'enemy' ? 'text-red-400' : 'text-emerald-400'} ${activeTurn === idx ? 'text-xl' : 'text-lg'}`}>{actor.name}</span>
                      </div>
                      
                      {enemyData && (
                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden shrink-0 mt-2 border border-slate-800 shadow-inner">
                           <div className={`h-full ${hpColor} transition-all duration-500`} style={{ width: `${hpPercent}%` }}></div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {actor.type === 'custom' && (
                        <button onClick={() => removeCustomActor(actor.id)} className="p-2 bg-slate-950 border-2 border-slate-900 rounded-xl text-slate-500 hover:text-red-500 hover:border-red-900 transition-colors shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <input 
                        type="number" 
                        value={actor.value} 
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => updateValue(idx, e.target.value)}
                        className="w-16 bg-slate-950 border-[3px] border-slate-900 rounded-xl px-2 py-2.5 text-center text-white text-lg font-black focus:outline-none focus:border-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none shadow-inner"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* FOOTER */}
          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 border-t-[3px] border-slate-900 pt-5">
            {showConditionWarning && (
              <div className="flex-1 bg-amber-500 border-[3px] border-amber-950 rounded-xl p-4 flex items-center justify-center gap-2 animate-in fade-in zoom-in-95 shadow-[4px_4px_0px_rgba(0,0,0,1)] w-full">
                 <AlertTriangle className="w-5 h-5 text-amber-950 shrink-0" />
                 <span className="text-xs font-black text-amber-950 uppercase tracking-widest truncate drop-shadow-[1px_1px_0px_rgba(255,255,255,0.3)]">
                   Reminder: {activeActorData.name} is {activeConditions.join(', ')}
                 </span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}