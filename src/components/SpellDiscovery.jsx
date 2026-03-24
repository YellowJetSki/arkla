import { useState } from 'react';
import { Search, Loader2, Plus, Shield } from 'lucide-react';
import { fetchSafeSpells } from '../services/sanctuaryApi';

export default function SpellDiscovery({ onAddSpell }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError('');
    setSearchResults([]);

    const { results, error } = await fetchSafeSpells(searchQuery.trim());
    
    if (error) setSearchError(error);
    if (results.length > 0) setSearchResults(results);
    
    setIsSearching(false);
  };

  const handleAdd = (apiSpell) => {
    const newSpell = {
      name: apiSpell.name,
      level: apiSpell.level,
      castTime: apiSpell.casting_time,
      desc: apiSpell.desc.join('\n\n') + (apiSpell.higher_level ? '\n\nAt Higher Levels: ' + apiSpell.higher_level.join(' ') : '')
    };

    onAddSpell(newSpell);
    setSearchResults(prev => prev.filter(s => s.index !== apiSpell.index));
  };

  return (
    <div className="bg-slate-900/80 p-4 rounded-xl border border-indigo-500/30 shadow-inner mb-6 animate-in fade-in slide-in-from-top-2">
      <h4 className="text-sm font-bold text-indigo-400 mb-3 flex items-center gap-2">
        <Shield className="w-4 h-4 text-emerald-400" /> Sanctuary Filter Active
      </h4>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search official 5e spells (e.g. Fireball)"
          className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
        />
        <button 
          type="submit" 
          disabled={isSearching || !searchQuery.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shrink-0"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </button>
      </form>

      {searchError && <p className="text-sm text-red-400 bg-red-950/30 p-2 rounded border border-red-900/50">{searchError}</p>}
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
        {searchResults.map((spell) => (
          <div key={spell.index} className="bg-slate-800 border border-slate-600 p-3 rounded-lg text-left">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-bold text-indigo-300 block">{spell.name}</span>
                <span className="text-xs text-slate-400 capitalize">{spell.school?.name} • Level {spell.level} • {spell.casting_time}</span>
              </div>
              <button 
                onClick={() => handleAdd(spell)}
                className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/50 px-2 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <p className="text-xs text-slate-300 line-clamp-3">{spell.desc?.[0]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}