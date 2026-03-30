import { useState, useEffect } from 'react';
import { ShieldAlert, Plus, X, Swords, Wand2, Search } from 'lucide-react';
import { fetchSafeMonsters } from '../services/sanctuaryApi';

export default function DMEncounterBuilder({ onClose, onAddEncounter }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [selectedEnemies, setSelectedEnemies] = useState([]);
  const [encounterName, setEncounterName] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    setError('');
    const { results: safeMonsters, error: searchError } = await fetchSafeMonsters(query);
    
    if (searchError) {
      setError(searchError);
      setResults([]);
    } else {
      setResults(safeMonsters);
    }
    setIsSearching(false);
  };

  const handleAddEnemy = (monster) => {
    setSelectedEnemies(prev => [...prev, {
      ...monster,
      instanceId: `enemy_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      currentHp: monster.hit_points || 10,
      maxHp: monster.hit_points || 10,
      initiative: 0,
      conditions: []
    }]);
  };

  const handleRemoveEnemy = (instanceId) => {
    setSelectedEnemies(prev => prev.filter(e => e.instanceId !== instanceId));
  };

  const handleSaveEncounter = () => {
    if (!encounterName.trim() || selectedEnemies.length === 0) return;
    onAddEncounter({
      id: `enc_${Date.now()}`,
      name: encounterName,
      enemies: selectedEnemies
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md h-[100dvh] overflow-hidden animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-rose-500/50 rounded-2xl w-full max-w-5xl shadow-[0_0_40px_rgba(225,29,72,0.2)] flex flex-col max-h-[90dvh] animate-in zoom-in-95 duration-500 relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/90 rounded-t-2xl shrink-0 relative z-10">
          <h2 className="text-xl font-bold text-rose-400 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6" /> Encounter Builder
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl border border-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-slate-800/30 relative z-10">
          
          {/* LEFT: Search */}
          <div className="space-y-4 flex flex-col h-full">
            <div>
              <h3 className="font-bold text-white mb-2">1. Find Enemies</h3>
              <form onSubmit={handleSearch} className="flex gap-2 relative">
                <input 
                  type="text" 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the Bestiary..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-rose-500 pl-10"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <button type="submit" disabled={isSearching} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl font-bold transition-colors">
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </form>
            </div>

            {error && <div className="p-3 bg-red-900/30 border border-red-500/50 text-red-400 rounded-xl text-sm">{error}</div>}

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900/50 rounded-xl border border-slate-700 p-2 space-y-2">
              {results.length === 0 && !isSearching && !error ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 space-y-2">
                  <Wand2 className="w-8 h-8" />
                  <p className="text-sm">Search the archives to find foes.</p>
                </div>
              ) : (
                results.map((monster, i) => (
                  <div key={i} className="bg-slate-800 border border-slate-700 p-3 rounded-lg flex justify-between items-center group hover:border-rose-500/50 transition-colors">
                    <div>
                      <h4 className="font-bold text-rose-300">{monster.name} {monster.isHomebrew && <span className="text-[10px] ml-2 text-rose-500 uppercase tracking-widest border border-rose-500/30 px-1 rounded">Homebrew</span>}</h4>
                      <p className="text-xs text-slate-400 capitalize">{monster.size} {monster.type}, CR {monster.challenge_rating || '?'}</p>
                    </div>
                    <button onClick={() => handleAddEnemy(monster)} className="p-2 bg-slate-700 hover:bg-rose-600 text-white rounded-lg transition-colors shadow-sm">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: Selected & Save */}
          <div className="space-y-4 flex flex-col h-full lg:border-l lg:border-slate-700 lg:pl-8">
            <div>
              <h3 className="font-bold text-white mb-2">2. Assemble Encounter</h3>
              <input 
                type="text" 
                value={encounterName}
                onChange={e => setEncounterName(e.target.value)}
                placeholder="e.g. Goblin Ambush"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 font-bold"
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900/50 rounded-xl border border-slate-700 p-2 space-y-2">
              {selectedEnemies.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 space-y-2">
                  <Swords className="w-8 h-8" />
                  <p className="text-sm">Add enemies to build the encounter.</p>
                </div>
              ) : (
                selectedEnemies.map((enemy) => (
                  <div key={enemy.instanceId} className="bg-slate-800 border border-slate-700 p-2 rounded-lg flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-rose-900/50 border border-rose-500 flex items-center justify-center text-rose-400 font-bold text-xs shadow-inner">
                         {enemy.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{enemy.name}</h4>
                        <p className="text-xs text-emerald-400 font-bold">{enemy.maxHp} HP</p>
                      </div>
                    </div>
                    <button onClick={() => handleRemoveEnemy(enemy.instanceId)} className="text-slate-500 hover:text-red-400 p-2 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <button 
              onClick={handleSaveEncounter}
              disabled={!encounterName.trim() || selectedEnemies.length === 0}
              className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors shadow-lg mt-auto shrink-0 flex items-center justify-center gap-2"
            >
              <Swords className="w-5 h-5" /> Save Encounter
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}