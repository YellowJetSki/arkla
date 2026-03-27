import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Search, Loader2, Plus, Skull, Shield } from 'lucide-react';
import { applySanctuaryFilter } from '../services/arklaEngine';

export default function ApiBestiaryImport({ onImportComplete }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState('');
  const [isImporting, setIsImporting] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError('');
    setSearchResults([]);

    try {
      const response = await fetch(`https://www.dnd5eapi.co/api/monsters/?name=${encodeURIComponent(searchQuery.trim())}`);
      const data = await response.json();
      
      if (data.count === 0) {
        setSearchError('No monsters found matching that name.');
      } else {
        setSearchResults(data.results.slice(0, 10));
      }
    } catch (err) {
      console.error(err);
      setSearchError('Failed to commune with the Bestiary API.');
    }
    
    setIsSearching(false);
  };

  const calculateModifier = (score) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const handleImport = async (monsterStub) => {
    setIsImporting(monsterStub.index);
    try {
      const detailRes = await fetch(`https://www.dnd5eapi.co${monsterStub.url}`);
      const monsterData = await detailRes.json();

      let tokenSize = 1;
      if (monsterData.size === 'Large') tokenSize = 2;
      if (monsterData.size === 'Huge') tokenSize = 3;
      if (monsterData.size === 'Gargantuan') tokenSize = 4;

      const parsedActions = (monsterData.actions || []).map(act => ({
        name: applySanctuaryFilter(act.name),
        desc: applySanctuaryFilter(act.desc)
      }));

      const parsedFeatures = (monsterData.special_abilities || []).map(feat => ({
        name: applySanctuaryFilter(feat.name),
        desc: applySanctuaryFilter(feat.desc)
      }));

      const newEnemy = {
        name: applySanctuaryFilter(monsterData.name),
        flavor: applySanctuaryFilter(`${monsterData.size} ${monsterData.type}, ${monsterData.alignment}`),
        ac: monsterData.armor_class?.[0]?.value || 10,
        hp: monsterData.hit_points || 10,
        currentHp: monsterData.hit_points || 10,
        maxHp: monsterData.hit_points || 10,
        speed: monsterData.speed?.walk || '30 ft.',
        stats: {
          STR: calculateModifier(monsterData.strength),
          DEX: calculateModifier(monsterData.dexterity),
          CON: calculateModifier(monsterData.constitution),
          INT: calculateModifier(monsterData.intelligence),
          WIS: calculateModifier(monsterData.wisdom),
          CHA: calculateModifier(monsterData.charisma)
        },
        passivePerception: monsterData.senses?.passive_perception || 10,
        features: parsedFeatures,
        actions: parsedActions,
        size: tokenSize,
        conditions: [],
        img: '' 
      };

      const enemyId = `enemy_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await setDoc(doc(db, 'active_enemies', enemyId), newEnemy);

      setSearchResults(prev => prev.filter(s => s.index !== monsterStub.index));
      if (onImportComplete) onImportComplete();

    } catch (err) {
      console.error("Import failed:", err);
      alert("Failed to import monster data.");
    }
    setIsImporting(null);
  };

  return (
    <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black text-indigo-400 flex items-center gap-2">
          <Skull className="w-5 h-5" /> Bestiary Importer
        </h3>
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-900/30 px-2 py-1 rounded border border-emerald-500/50 flex items-center gap-1">
          <Shield className="w-3 h-3" /> Filtered
        </span>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search 5e Monsters (e.g. Goblin, Adult Dragon)"
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
        />
        <button 
          type="submit" 
          disabled={isSearching || !searchQuery.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shrink-0"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </button>
      </form>

      {searchError && <p className="text-sm text-red-400 bg-red-950/30 p-2 rounded border border-red-900/50 mb-3">{searchError}</p>}
      
      {searchResults.length > 0 && (
        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
          {searchResults.map((monster) => (
            <div key={monster.index} className="bg-slate-800 border border-slate-700 p-3 rounded-lg flex justify-between items-center group hover:border-indigo-500/50 transition-colors">
              <span className="font-bold text-indigo-200">{applySanctuaryFilter(monster.name)}</span>
              
              <button 
                onClick={() => handleImport(monster)}
                disabled={isImporting === monster.index}
                className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/50 px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1"
                title="Stage to Active Threats"
              >
                {isImporting === monster.index ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Add to Encounter
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}