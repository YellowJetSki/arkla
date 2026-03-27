import { useState, useEffect } from 'react';
import { Search, Loader2, Plus, Flame, Lock, ChevronDown } from 'lucide-react';
import { getSpellStubs, fetchDetailedStubs } from '../services/arklaEngine';

export default function SpellDiscovery({ onAddSpell, allowAdd = true, maxSpellLevel = 9 }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const [allStubs, setAllStubs] = useState([]);
  const [filteredStubs, setFilteredStubs] = useState([]);
  const [visibleSpells, setVisibleSpells] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const CHUNK_SIZE = 10;

  // Initialize: Fetch the master list of all 319 spells on mount
  useEffect(() => {
    const initSpells = async () => {
      setIsSearching(true);
      const stubs = await getSpellStubs();
      setAllStubs(stubs);
      setFilteredStubs(stubs);
      
      // Load the first chunk of details immediately
      const initialDetails = await fetchDetailedStubs(stubs.slice(0, CHUNK_SIZE));
      setVisibleSpells(initialDetails);
      setIsSearching(false);
    };
    initSpells();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    
    const query = searchQuery.trim().toLowerCase();
    const newFiltered = allStubs.filter(stub => stub.name.toLowerCase().includes(query));
    setFilteredStubs(newFiltered);
    
    // Load first chunk of the new search results
    const newDetails = await fetchDetailedStubs(newFiltered.slice(0, CHUNK_SIZE));
    setVisibleSpells(newDetails);
    setIsSearching(false);
  };

  const handleLoadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    
    const currentLength = visibleSpells.length;
    const nextStubs = filteredStubs.slice(currentLength, currentLength + CHUNK_SIZE);
    const nextDetails = await fetchDetailedStubs(nextStubs);
    
    setVisibleSpells(prev => [...prev, ...nextDetails]);
    setIsLoadingMore(false);
  };

  const handleAdd = (spell) => {
    onAddSpell({
      name: spell.name,
      level: spell.level || 0,
      castTime: spell.casting_time || '1 Action',
      desc: spell.desc
    });
    setVisibleSpells(prev => prev.filter(s => s.index !== spell.index));
  };

  const hasMore = visibleSpells.length < filteredStubs.length;

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
          onChange={(e) => {
             setSearchQuery(e.target.value);
             if (e.target.value === '') {
                 // Reset if cleared
                 setFilteredStubs(allStubs);
                 fetchDetailedStubs(allStubs.slice(0, CHUNK_SIZE)).then(setVisibleSpells);
             }
          }}
          placeholder="Search 5e spells (e.g. Fireball)"
          className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-fuchsia-500"
        />
        <button 
          type="submit" 
          disabled={isSearching}
          className="bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shrink-0"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </button>
      </form>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
        {visibleSpells.map((spell) => {
          const isTooHigh = (spell.level || 0) > maxSpellLevel;

          return (
            <div key={spell.index} className={`border p-3 rounded-lg text-left transition-colors ${isTooHigh ? 'bg-slate-900/50 border-slate-700/50' : 'bg-slate-800 border-slate-600'}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className={`font-bold block ${isTooHigh ? 'text-slate-400' : 'text-fuchsia-300'}`}>{spell.name}</span>
                  <span className="text-xs text-slate-400 block">{spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`} • {spell.casting_time}</span>
                </div>
                
                {allowAdd && (
                  <button 
                    onClick={() => handleAdd(spell)}
                    disabled={isTooHigh}
                    className={`px-2 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1 shrink-0 ${isTooHigh ? 'bg-slate-800/50 text-slate-500 border border-slate-700 cursor-not-allowed' : 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/50'}`}
                  >
                    {isTooHigh ? <Lock className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {isTooHigh ? `Lvl ${spell.level} Req.` : 'Add'}
                  </button>
                )}
              </div>
              <p className={`text-xs mt-2 line-clamp-3 hover:line-clamp-none transition-all cursor-pointer ${isTooHigh ? 'text-slate-500' : 'text-slate-300'}`}>
                {spell.desc}
              </p>
            </div>
          );
        })}
        
        {hasMore && (
          <button 
            onClick={handleLoadMore} 
            disabled={isLoadingMore}
            className="w-full py-3 mt-4 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-fuchsia-400 font-bold text-xs uppercase tracking-widest transition-colors flex justify-center items-center gap-2"
          >
            {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ChevronDown className="w-4 h-4"/> Load More Spells</>}
          </button>
        )}
      </div>
    </div>
  );
}