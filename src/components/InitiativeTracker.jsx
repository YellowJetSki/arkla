import { useState, useEffect } from 'react';
import { Swords, ArrowRight, ArrowLeft, Play, Plus, X, Clock } from 'lucide-react';
import { PREMADE_CHARACTERS } from '../data/campaignData';
import DialogModal from './shared/DialogModal';
import ScrollableRow from './shared/ScrollableRow';

export default function InitiativeTracker({ unlockedCharacters, activeEnemies }) {
  const [combatants, setCombatants] = useState([]);
  const [activeTurnIndex, setActiveTurnIndex] = useState(0);
  const [entityToAdd, setEntityToAdd] = useState('');
  const [round, setRound] = useState(1);
  
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  // NEW: Auto-scroll the active combatant into the center of the view!
  useEffect(() => {
    const activeElement = document.getElementById(`combatant-${activeTurnIndex}`);
    if (activeElement) {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTurnIndex]);

  const handleAdd = () => {
    if (!entityToAdd) return;
    let newCombatant = null;
    if (entityToAdd.startsWith('player_')) {
      const id = entityToAdd.replace('player_', '');
      const char = PREMADE_CHARACTERS[id];
      if (char) {
        newCombatant = { id, trackerId: `tracker_${Date.now()}_${id}`, type: 'player', name: char.name, image: `/${id}.png`, initiative: '' };
      }
    } else if (entityToAdd.startsWith('enemy_')) {
      const id = entityToAdd.replace('enemy_', '');
      const enemy = activeEnemies.find(e => e.id === id);
      if (enemy) {
        newCombatant = { id, trackerId: `tracker_${Date.now()}_${id}`, type: 'enemy', name: enemy.name, image: null, initiative: '' };
      }
    }
    if (newCombatant) setCombatants(prev => [...prev, newCombatant]);
    setEntityToAdd(''); 
  };

  const handleRemove = (trackerId) => {
    setCombatants(prev => prev.filter(c => c.trackerId !== trackerId));
    setActiveTurnIndex(0); 
  };

  const updateInitiative = (trackerId, val) => {
    setCombatants(prev => prev.map(c => c.trackerId === trackerId ? { ...c, initiative: val } : c));
  };

  const sortInitiative = () => {
    setCombatants(prev => [...prev].sort((a, b) => Number(b.initiative || 0) - Number(a.initiative || 0)));
    setActiveTurnIndex(0);
    setRound(1); 
  };

  const nextTurn = () => {
    if (combatants.length === 0) return;
    setActiveTurnIndex(prev => {
      const nextIndex = prev + 1;
      if (nextIndex >= combatants.length) { setRound(r => r + 1); return 0; }
      return nextIndex;
    });
  };

  const prevTurn = () => {
    if (combatants.length === 0) return;
    setActiveTurnIndex(prev => {
      const nextIndex = prev - 1;
      if (nextIndex < 0) { setRound(r => Math.max(1, r - 1)); return combatants.length - 1; }
      return nextIndex;
    });
  };

  const confirmClearTracker = () => {
    setDialog({ isOpen: true, title: 'Clear Initiative Tracker', message: 'Are you sure you want to clear all combatants from the initiative tracker?', type: 'confirm', onConfirm: () => { setCombatants([]); setActiveTurnIndex(0); setRound(1); closeDialog(); } });
  };

  const availablePlayers = unlockedCharacters.filter(id => !combatants.some(c => c.id === id && c.type === 'player'));
  const availableEnemies = activeEnemies.filter(e => !combatants.some(c => c.id === e.id && c.type === 'enemy'));

  return (
    <>
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} onCancel={closeDialog} />

      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 md:p-5 shadow-xl mb-8 transition-all relative overflow-hidden">
        {round > 1 && <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 blur-[100px] rounded-full pointer-events-none transition-opacity duration-1000"></div>}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 relative z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Swords className="w-6 h-6 text-yellow-500" /> Initiative Tracker</h2>
            {combatants.length > 0 && <div className="bg-slate-900 border border-slate-600 px-3 py-1 rounded-full flex items-center gap-2 shadow-inner"><Clock className="w-4 h-4 text-red-400" /><span className="text-sm font-bold text-slate-300 tracking-widest uppercase">Round <span className="text-white text-base">{round}</span></span></div>}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex w-full sm:w-auto items-center bg-slate-900 border border-slate-700 rounded-lg p-1">
              <select value={entityToAdd} onChange={(e) => setEntityToAdd(e.target.value)} className="bg-transparent text-sm text-slate-300 px-2 py-1.5 focus:outline-none w-full sm:w-48">
                <option value="">+ Add to Order...</option>
                {availablePlayers.length > 0 && <optgroup label="Players">{availablePlayers.map(id => <option key={`player_${id}`} value={`player_${id}`}>{PREMADE_CHARACTERS[id]?.name || id}</option>)}</optgroup>}
                {availableEnemies.length > 0 && <optgroup label="Active Enemies">{availableEnemies.map(enemy => <option key={`enemy_${enemy.id}`} value={`enemy_${enemy.id}`}>{enemy.name}</option>)}</optgroup>}
              </select>
              <button onClick={handleAdd} disabled={!entityToAdd} className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white p-1.5 rounded-md transition-colors shrink-0"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button onClick={confirmClearTracker} className="flex-1 sm:flex-none flex justify-center items-center gap-1 bg-red-900/30 hover:bg-red-900/60 text-red-400 px-3 py-2 rounded-lg text-sm transition-colors border border-red-900/50"><X className="w-4 h-4" /> Clear</button>
              <button onClick={sortInitiative} className="flex-1 sm:flex-none flex justify-center items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"><Play className="w-4 h-4" /> Sort & Start</button>
            </div>
          </div>
        </div>

        {combatants.length === 0 ? (
          <div className="p-6 text-center text-slate-500 border border-dashed border-slate-700 rounded-xl bg-slate-900/30 relative z-10">Select a player or enemy from the dropdown above to add them to the initiative order.</div>
        ) : (
          <div className="relative z-10">
            <ScrollableRow className="gap-4 py-4 px-2">
              {combatants.map((combatant, index) => {
                const isActive = index === activeTurnIndex;
                return (
                  <div 
                    key={combatant.trackerId} 
                    id={`combatant-${index}`}
                    className={`w-32 sm:w-36 shrink-0 snap-center flex flex-col items-center p-3 rounded-xl border-2 transition-all relative ${isActive ? 'border-yellow-500 bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.2)] transform scale-105 z-10' : 'border-slate-700 bg-slate-900/50 opacity-70 hover:opacity-100 z-0'}`}
                  >
                    <button onClick={() => handleRemove(combatant.trackerId)} className="absolute -top-2 -right-2 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-full p-1 border border-slate-700 transition-colors shadow-md z-20"><X className="w-3 h-3" /></button>
                    <div className="relative mb-3 mt-1">
                      {combatant.type === 'player' ? <img src={combatant.image} alt={combatant.name} className="w-12 h-12 rounded-full border-2 border-indigo-500 object-cover bg-slate-950" /> : <div className="w-12 h-12 rounded-full border-2 border-red-500 bg-slate-950 flex items-center justify-center text-red-500 font-bold"><Swords className="w-6 h-6" /></div>}
                      {isActive && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-md pointer-events-none">TURN</div>}
                    </div>
                    <div className="text-center w-full">
                      <p className="text-sm font-bold text-white truncate w-full mb-2" title={combatant.name}>{combatant.name.split(' ')[0]}</p>
                      {/* Hide spinners class added below */}
                      <input 
                        type="number" 
                        value={combatant.initiative} 
                        onChange={(e) => updateInitiative(combatant.trackerId, e.target.value)} 
                        placeholder="Roll" 
                        className="w-16 bg-slate-950 border border-slate-600 rounded text-center text-white py-1 text-lg font-bold focus:border-indigo-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                      />
                    </div>
                  </div>
                );
              })}
            </ScrollableRow>

            <div className="flex justify-center gap-4 mt-4 border-t border-slate-700/50 pt-5">
              <button onClick={prevTurn} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"><ArrowLeft className="w-4 h-4" /> Prev</button>
              <button onClick={nextTurn} className="flex items-center gap-2 bg-slate-200 hover:bg-white text-slate-900 px-6 py-2 rounded-lg font-bold shadow-lg transition-colors">Next Turn <ArrowRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}