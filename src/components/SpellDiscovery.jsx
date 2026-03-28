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

  useEffect(() => {
    const initSpells = async () => {
      setIsSearching(true);
      const stubs = await getSpellStubs();
      setAllStubs(stubs);
      setFilteredStubs(stubs);
      
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
    <div className="bg-slate-900/80 backdrop-blur-sm p-5 rounded-2xl border border-fuchsia-500/30 shadow-[0_0_30px_rgba(217,70,239,0.1)] mb-6 animate-in fade-in slide-in-from-top-2 relative overflow-hidden">
      
      {/* Subtle ambient glow inside the discovery box */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-600/5 blur-[80px] rounded-full pointer-events-none"></div>

      <div className="flex justify-between items-center mb-5 relative z-10">
        <h4 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 to-indigo-300 flex items-center gap-2 uppercase tracking-widest drop-shadow-sm">
          <Flame className="w-5 h-5 text-fuchsia-400" /> Spell Archives
        </h4>
        {!allowAdd && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-700 shadow-inner">
            <Lock className="w-3 h-3 text-fuchsia-500" /> Browse Only
          </span>
        )}
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-6 relative z-10">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-500 group-focus-within:text-fuchsia-400 transition-colors" />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => {
               setSearchQuery(e.target.value);
               if (e.target.value === '') {
                   setFilteredStubs(allStubs);
                   fetchDetailedStubs(allStubs.slice(0, CHUNK_SIZE)).then(setVisibleSpells);
               }
            }}
            placeholder="Search arcane texts (e.g. Fireball)"
            className="w-full bg-slate-950/80 border border-slate-600 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-400 transition-all shadow-inner placeholder-slate-600"
          />
        </div>
        <button 
          type="submit" 
          disabled={isSearching}
          className="bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_15px_rgba(217,70,239,0.3)] hover:shadow-[0_0_25px_rgba(217,70,239,0.5)] flex items-center gap-2 shrink-0"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Scry'}
        </button>
      </form>
      
      <div className="space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar pr-2 relative z-10">
        {visibleSpells.map((spell) => {
          const isTooHigh = (spell.level || 0) > maxSpellLevel;

          return (
            <div key={spell.index} className={`p-4 rounded-xl text-left transition-all duration-300 relative overflow-hidden group ${isTooHigh ? 'bg-slate-900/40 border border-slate-800' : 'bg-slate-800/80 border border-slate-600 hover:border-fuchsia-500/50 hover:shadow-[0_4px_20px_rgba(217,70,239,0.15)] hover:-translate-y-0.5'}`}>
              
              {isTooHigh && (
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-5 mix-blend-overlay pointer-events-none"></div>
              )}

              <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="pr-4">
                  <span className={`font-black text-lg block mb-1 ${isTooHigh ? 'text-slate-500' : 'text-fuchsia-300 drop-shadow-sm'}`}>{spell.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${isTooHigh ? 'bg-slate-900 text-slate-600 border-slate-800' : 'bg-fuchsia-950/50 text-fuchsia-400 border-fuchsia-900/50'}`}>
                      {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">• {spell.casting_time}</span>
                  </div>
                </div>
                
                {allowAdd && (
                  <button 
                    onClick={() => handleAdd(spell)}
                    disabled={isTooHigh}
                    className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 shadow-sm ${isTooHigh ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'}`}
                  >
                    {isTooHigh ? <Lock className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {isTooHigh ? `Lvl ${spell.level} Req` : 'Scribe'}
                  </button>
                )}
              </div>
              <p className={`text-sm mt-3 leading-relaxed transition-all cursor-pointer relative z-10 ${isTooHigh ? 'text-slate-600 line-clamp-2' : 'text-slate-300 line-clamp-3 hover:line-clamp-none'}`}>
                {spell.desc}
              </p>
            </div>
          );
        })}
        
        {hasMore && (
          <button 
            onClick={handleLoadMore} 
            disabled={isLoadingMore}
            className="w-full py-4 mt-6 bg-slate-950 hover:bg-slate-900 border border-slate-700 hover:border-fuchsia-500/50 rounded-xl text-fuchsia-400 font-black text-xs uppercase tracking-widest transition-all flex justify-center items-center gap-2 shadow-inner group"
          >
            {isLoadingMore ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform"/> Delve Deeper</>}
          </button>
        )}
      </div>
    </div>
  );
}