import { useState } from 'react';
import { Search, Loader2, Download, Shield } from 'lucide-react';
import { fetchSafeMonsters } from '../services/sanctuaryApi';

export default function ApiBestiaryImport({ onImportMonster }) {
  const [apiSearchQuery, setApiSearchQuery] = useState('');
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [apiResults, setApiResults] = useState([]);
  const [apiError, setApiError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!apiSearchQuery.trim()) return;
    setIsSearchingApi(true);
    setApiError('');
    setApiResults([]);

    const { results, error } = await fetchSafeMonsters(apiSearchQuery.trim());
    
    if (error) setApiError(error);
    if (results.length > 0) setApiResults(results);
    
    setIsSearchingApi(false);
  };

  const handleImport = (apiMonster) => {
    const getMod = (score) => {
      const mod = Math.floor((score - 10) / 2);
      return mod >= 0 ? `+${mod}` : `${mod}`;
    };

    const newMonster = {
      name: apiMonster.name,
      flavor: `Imported SRD: ${apiMonster.size} ${apiMonster.type}, ${apiMonster.alignment}`,
      ac: apiMonster.armor_class?.[0]?.value || 10,
      hp: apiMonster.hit_points || 10,
      speed: Object.entries(apiMonster.speed || {}).map(([k,v]) => `${k} ${v}`).join(', '),
      passivePerception: apiMonster.senses?.passive_perception || 10,
      stats: {
        STR: getMod(apiMonster.strength || 10),
        DEX: getMod(apiMonster.dexterity || 10),
        CON: getMod(apiMonster.constitution || 10),
        INT: getMod(apiMonster.intelligence || 10),
        WIS: getMod(apiMonster.wisdom || 10),
        CHA: getMod(apiMonster.charisma || 10)
      },
      features: (apiMonster.special_abilities || []).map(f => ({ name: f.name, desc: f.desc })),
      actions: (apiMonster.actions || []).map(a => ({ name: a.name, desc: a.desc }))
    };

    onImportMonster(newMonster);
    setApiResults(prev => prev.filter(m => m.index !== apiMonster.index));
  };

  return (
    <div className="bg-slate-800 border border-amber-500/30 rounded-xl p-5 shadow-sm">
      <h3 className="font-bold text-amber-400 border-b border-slate-700/50 pb-2 mb-3 flex items-center gap-2">
        <Search className="w-5 h-5" /> Import from API Bestiary
      </h3>
      <div className="flex items-center gap-2 mb-2 text-xs font-bold text-emerald-400">
        <Shield className="w-3 h-3" /> Sanctuary Filter Active
      </div>
      
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input 
          type="text" 
          value={apiSearchQuery} 
          onChange={e => setApiSearchQuery(e.target.value)}
          placeholder="Search 5e SRD (e.g. Goblin)" 
          className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
        />
        <button 
          type="submit" 
          disabled={isSearchingApi || !apiSearchQuery.trim()} 
          className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shrink-0"
        >
          {isSearchingApi ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </button>
      </form>

      {apiError && <p className="text-sm text-red-400 bg-red-950/30 p-2 rounded border border-red-900/50 mb-3">{apiError}</p>}

      {apiResults.length > 0 && (
        <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
          {apiResults.map(monster => (
            <div key={monster.index} className="flex justify-between items-center bg-slate-900 border border-slate-700 p-3 rounded-lg">
              <div>
                <span className="font-bold text-amber-300 block">{monster.name}</span>
                <span className="text-xs text-slate-400">{monster.size} {monster.type} • CR {monster.challenge_rating}</span>
              </div>
              <button 
                onClick={() => handleImport(monster)} 
                className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
              >
                <Download className="w-3 h-3" /> Import
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}