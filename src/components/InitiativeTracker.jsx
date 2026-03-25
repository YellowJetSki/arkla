import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Swords, Trash2, ArrowDown, Play, Users, X, RotateCcw, Plus, AlertTriangle } from 'lucide-react';

export default function InitiativeTracker({ unlockedCharacters, activeEnemies, isBattleMode, onLaunchBattle, onExitBattle }) {
  const [initiative, setInitiative] = useState([]);
  const [activeTurn, setActiveTurn] = useState(-1); 
  const [round, setRound] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [newCustomName, setNewCustomName] = useState('');

  const missingIdsTracker = useRef(new Set());

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
    const autoSync = async () => {
      if (!isLoaded) return; 

      try {
        const currentIds = initiative.map(i => i.id);
        
        const safePlayers = (unlockedCharacters || [])
          .filter(id => id && typeof id === 'string' && !missingIdsTracker.current.has(id));
        
        const safeEnemies = (activeEnemies || [])
          .filter(e => e && e.id && typeof e.id === 'string' && !missingIdsTracker.current.has(e.id))
          .map(e => e.id);
        
        const targetIds = [...safePlayers, ...safeEnemies];
        
        const hasMissing = targetIds.some(id => !currentIds.includes(id));
        const staleActors = initiative.filter(i => i.type !== 'custom' && !targetIds.includes(i.id));

        if (hasMissing || staleActors.length > 0) {
          let newOrder = [...initiative];
          
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
  }, [unlockedCharacters, activeEnemies, initiative, isLoaded]); 

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
  const activeConditions = activeEnemyData?.conditions || [];
  const showConditionWarning = activeConditions.length > 0;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-lg h-full flex flex-col">
      {/* UI FIX: Wrapped buttons and optimized flexbox to prevent bounds overflow */}
      <div className="flex flex-col 2xl:flex-row justify-between items-start 2xl:items-center gap-3 mb-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2"><Swords className="w-5 h-5 text-fuchsia-500" /> Initiative</h2>
          <p className="text-xs text-slate-400 font-bold">
            {activeTurn === -1 ? 'Pre-Combat' : `Round ${round} • Turn ${activeTurn + 1}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-start 2xl:justify-end w-full 2xl:w-auto">
          
          <button onClick={() => setShowCustomForm(!showCustomForm)} className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2 md:px-3 md:py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5" title="Add Custom Actor">
            <Plus className="w-4 h-4 md:w-3 md:h-3" /> <span className="hidden md:inline">Add</span>
          </button>

          {!isBattleMode ? (
            <button onClick={() => { if(onLaunchBattle) onLaunchBattle(); }} className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white p-2 md:px-3 md:py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5" title="View Map">
              <Users className="w-4 h-4 md:w-3 md:h-3" /> <span className="hidden md:inline">Map</span>
            </button>
          ) : (
            <button onClick={() => { if(onExitBattle) onExitBattle(); }} className="bg-slate-700 hover:bg-slate-600 text-white p-2 md:px-3 md:py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5" title="Close Map">
              <X className="w-4 h-4 md:w-3 md:h-3" /> <span className="hidden md:inline">Close</span>
            </button>
          )}
          <button onClick={resetValues} className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 p-2 md:px-3 md:py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5" title="Reset all initiative values">
            <RotateCcw className="w-4 h-4 md:w-3 md:h-3" /> <span className="hidden md:inline">Reset</span>
          </button>
        </div>
      </div>

      {showCustomForm && (
        <form onSubmit={addCustomActor} className="mb-4 flex gap-2 animate-in fade-in slide-in-from-top-2">
          <input 
            type="text" 
            value={newCustomName}
            onChange={(e) => setNewCustomName(e.target.value)}
            placeholder="e.g. Lair Action..." 
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-fuchsia-500"
            autoFocus
          />
          <button type="submit" disabled={!newCustomName.trim()} className="bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
            Add
          </button>
        </form>
      )}

      <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
        {initiative.length === 0 ? (
          <p className="text-sm text-slate-500 italic p-4 text-center">Waiting for active characters or enemies...</p>
        ) : (
          initiative.map((actor, idx) => {
            const enemyData = actor.type === 'enemy' ? activeEnemies.find(e => e.id === actor.id) : null;
            const isDead = enemyData && (enemyData.currentHp ?? enemyData.hp ?? 1) <= 0;
            const hpPercent = enemyData ? Math.max(0, Math.min(100, ((enemyData.currentHp ?? enemyData.hp ?? 0) / (enemyData.maxHp ?? enemyData.hp ?? 1)) * 100)) : null;
            const hpColor = hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-yellow-500' : 'bg-red-500';

            return (
              <div key={actor.id + idx} className={`flex items-center gap-2 p-2 rounded-xl border transition-all 
                ${activeTurn === idx ? 'bg-fuchsia-900/20 border-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.2)]' : 'bg-slate-950 border-slate-800'}
                ${isDead ? 'opacity-40 grayscale' : ''}
              `}>
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    {activeTurn === idx && <Play className="w-3 h-3 text-fuchsia-400 fill-current shrink-0" />}
                    <span className={`font-bold truncate ${actor.type === 'enemy' ? 'text-red-400' : 'text-indigo-400'} ${activeTurn === idx ? 'text-sm md:text-base' : 'text-xs md:text-sm'}`}>{actor.name}</span>
                  </div>
                  
                  {enemyData && (
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden shrink-0 mt-1">
                       <div className={`h-full ${hpColor} transition-all duration-500`} style={{ width: `${hpPercent}%` }}></div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {actor.type === 'custom' && (
                    <button onClick={() => removeCustomActor(actor.id)} className="p-1 text-slate-500 hover:text-red-400 transition-colors mr-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <input 
                    type="number" 
                    value={actor.value} 
                    onChange={(e) => updateValue(idx, e.target.value)}
                    className="w-10 md:w-12 bg-slate-800 border border-slate-600 rounded px-1 py-1 text-center text-white text-xs md:text-sm font-black focus:outline-none focus:border-fuchsia-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {showConditionWarning && (
          <div className="bg-amber-900/40 border border-amber-500/50 rounded-lg p-2 flex items-center justify-center gap-2 animate-in fade-in zoom-in-95 shadow-sm">
             <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
             <span className="text-[10px] md:text-xs font-bold text-amber-200 uppercase tracking-wider truncate">
               Reminder: {activeActorData.name} is {activeConditions.join(', ')}
             </span>
          </div>
        )}

        {initiative.length > 0 && (
          <button onClick={nextTurn} className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-black py-2.5 rounded-xl transition-all flex justify-center items-center gap-2 text-sm shadow-md">
            {activeTurn === -1 ? 'Start Combat' : 'Next Turn'} <ArrowDown className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}