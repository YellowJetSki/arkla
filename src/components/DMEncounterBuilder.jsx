import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { PREMADE_ENEMIES } from '../data/campaignData';
import { Swords, Plus, Trash2, Zap, ShieldAlert, Search, Loader2 } from 'lucide-react';
import { fetchSafeMonsters } from '../services/sanctuaryApi';

export default function DMEncounterBuilder() {
  const [stagedEnemies, setStagedEnemies] = useState([]);
  const [selectedEnemy, setSelectedEnemy] = useState(PREMADE_ENEMIES[0].id);

  // New states for the intelligent API/Homebrew search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const { results } = await fetchSafeMonsters(searchQuery);
    setSearchResults(results || []);
    setIsSearching(false);
  };

  const handleStageSearchedEnemy = (monster) => {
    // Map the 5e API & Homebrew formats perfectly to your app's expected structure
    const mappedEnemy = {
      id: monster.index || `api_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: monster.name,
      hp: monster.hit_points || monster.hp || 10,
      ac: Array.isArray(monster.armor_class) ? monster.armor_class[0]?.value : (monster.ac || 10),
      speed: typeof monster.speed === 'string' ? monster.speed : (monster.speed?.walk || '30 ft.'),
      stats: monster.stats || {
        STR: monster.strength ? `+${Math.floor((monster.strength - 10) / 2)}` : '+0',
        DEX: monster.dexterity ? `+${Math.floor((monster.dexterity - 10) / 2)}` : '+0',
        CON: monster.constitution ? `+${Math.floor((monster.constitution - 10) / 2)}` : '+0',
        INT: monster.intelligence ? `+${Math.floor((monster.intelligence - 10) / 2)}` : '+0',
        WIS: monster.wisdom ? `+${Math.floor((monster.wisdom - 10) / 2)}` : '+0',
        CHA: monster.charisma ? `+${Math.floor((monster.charisma - 10) / 2)}` : '+0'
      },
      features: monster.features || monster.special_abilities || [],
      actions: monster.actions || [],
      isHomebrew: monster.isHomebrew || false
    };

    setStagedEnemies(prev => {
      const existing = prev.find(e => e.id === mappedEnemy.id);
      if (existing) {
        return prev.map(e => e.id === mappedEnemy.id ? { ...e, count: e.count + 1 } : e);
      }
      return [...prev, { ...mappedEnemy, count: 1 }];
    });
    
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleStageEnemy = () => {
    const enemyTemplate = PREMADE_ENEMIES.find(e => e.id === selectedEnemy);
    if (!enemyTemplate) return;

    setStagedEnemies(prev => {
      // If already staged, just increase the count
      const existing = prev.find(e => e.id === selectedEnemy);
      if (existing) {
        return prev.map(e => e.id === selectedEnemy ? { ...e, count: e.count + 1 } : e);
      }
      // Otherwise, add new to staging
      return [...prev, { ...enemyTemplate, count: 1 }];
    });
  };

  const handleRemoveStaged = (id) => {
    setStagedEnemies(prev => prev.filter(e => e.id !== id));
  };

  const updateStagedCount = (id, newCount) => {
    if (newCount <= 0) {
      handleRemoveStaged(id);
      return;
    }
    setStagedEnemies(prev => prev.map(e => e.id === id ? { ...e, count: newCount } : e));
  };

  const deployEncounter = async () => {
    if (stagedEnemies.length === 0) return;

    const enemiesRef = collection(db, 'active_enemies');
    
    // Deploy all staged enemies based on their counts
    for (const staged of stagedEnemies) {
      for (let i = 0; i < staged.count; i++) {
        // We append a number to their name if there's more than one (e.g., "Goblin Sneak 2")
        const nameSuffix = staged.count > 1 ? ` ${i + 1}` : '';
        await addDoc(enemiesRef, {
          ...staged,
          name: `${staged.name}${nameSuffix}`,
          maxHp: staged.hp,
          currentHp: staged.hp
        });
      }
    }

    // Clear the staging area after deploying
    setStagedEnemies([]);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl mb-6">
      <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
        <ShieldAlert className="w-5 h-5 text-red-400" /> Encounter Builder
      </h3>
      
      {/* Intelligent Bestiary Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Bestiary & Vaults..."
              className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-red-500"
            />
         </div>
         <button type="submit" disabled={isSearching} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-bold transition-colors shrink-0">
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
         </button>
      </form>

      {/* Search Results Display */}
      {searchResults.length > 0 && (
         <div className="bg-slate-900 rounded-xl p-2 border border-slate-700 mb-6 max-h-48 overflow-y-auto custom-scrollbar space-y-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 pb-1">Search Results</div>
            {searchResults.map(monster => (
               <div key={monster.index} className="flex items-center justify-between bg-slate-800 p-2 rounded-lg border border-slate-600">
                  <div>
                    <span className="font-bold text-rose-300 flex items-center gap-2">
                      {monster.name}
                      {monster.isHomebrew && <span className="text-[9px] text-rose-400 uppercase tracking-widest border border-rose-500/30 px-1 rounded bg-rose-900/20">Custom</span>}
                    </span>
                    <span className="text-xs text-slate-400 capitalize">{monster.size} {monster.type}, CR {monster.challenge_rating || '?'}</span>
                  </div>
                  <button onClick={() => handleStageSearchedEnemy(monster)} className="text-emerald-400 hover:text-emerald-300 bg-emerald-900/30 p-1.5 rounded transition-colors"><Plus className="w-4 h-4" /></button>
               </div>
            ))}
         </div>
      )}

      {/* Premade Spawner Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
        <select 
          value={selectedEnemy}
          onChange={(e) => setSelectedEnemy(e.target.value)}
          className="bg-slate-900 text-white border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:border-red-500 w-full sm:flex-1"
        >
          {PREMADE_ENEMIES.map(enemy => (
            <option key={enemy.id} value={enemy.id}>
              {enemy.name} (CR est. HP: {enemy.hp})
            </option>
          ))}
        </select>
        <button 
          onClick={handleStageEnemy}
          className="w-full sm:w-auto flex items-center justify-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-bold transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Premade
        </button>
      </div>

      {/* Staging Area */}
      {stagedEnemies.length > 0 && (
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
          <div className="space-y-2 mb-4">
            {stagedEnemies.map(staged => (
              <div key={staged.id} className="flex items-center justify-between bg-slate-800 p-2 rounded-lg border border-slate-600">
                <span className="font-bold text-red-400 flex items-center gap-2">
                  {staged.name}
                  {staged.isHomebrew && <span className="text-[9px] text-rose-400 uppercase tracking-widest border border-rose-500/30 px-1 rounded bg-rose-900/20">Custom</span>}
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-slate-900 rounded border border-slate-700">
                    <button onClick={() => updateStagedCount(staged.id, staged.count - 1)} className="px-2 text-slate-400 hover:text-white">-</button>
                    <span className="text-white font-bold w-6 text-center">{staged.count}</span>
                    <button onClick={() => updateStagedCount(staged.id, staged.count + 1)} className="px-2 text-slate-400 hover:text-white">+</button>
                  </div>
                  <button onClick={() => handleRemoveStaged(staged.id)} className="text-slate-500 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={deployEncounter}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-[0.98]"
          >
            <Zap className="w-5 h-5" /> Deploy Encounter
          </button>
        </div>
      )}
    </div>
  );
}