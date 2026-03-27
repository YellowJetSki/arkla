import { useState } from 'react';
import { Search, Loader2, Plus, Flame, Lock } from 'lucide-react';
import { fetchSafeSpells } from '../services/sanctuaryApi';

export default function SpellDiscovery({ onAddSpell, allowAdd = true }) {
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

  const handleAdd = (spell) => {
    onAddSpell({
      name: spell.name,
      level: spell.level,
      castTime: spell.casting_time,
      desc: Array.isArray(spell.desc) ? spell.desc.join('\n') : spell.desc
    });
    setSearchResults(prev => prev.filter(s => s.index !== spell.index));
  };

  return (
    <div className="bg-slate-900/80 p-4 rounded-xl border border-fuchsia-500/30 shadow-inner mb-6 animate-in fade-in slide-in-from-top-2">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-bold text-fuchsia-400 flex items-center gap-2">
          <Flame className="w-4 h-4" /> Spell Discovery
        </h4>
        {!allowAdd && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            <Lock className="w-3 h-3" /> Browse Only
          </span>
        )}
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search 5e spells (e.g. Fireball)"
          className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-fuchsia-500"
        />
        <button 
          type="submit" 
          disabled={isSearching || !searchQuery.trim()}
          className="bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shrink-0"
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
                <span className="font-bold text-fuchsia-300 block">{spell.name}</span>
                <span className="text-xs text-slate-400 block">{spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`} • {spell.casting_time}</span>
              </div>
              
              {allowAdd && (
                <button 
                  onClick={() => handleAdd(spell)}
                  className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/50 px-2 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-2 line-clamp-3 hover:line-clamp-none transition-all cursor-pointer">
              {Array.isArray(spell.desc) ? spell.desc[0] : spell.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}