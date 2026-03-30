import { useState } from 'react';
import { Search, Loader2, Plus, BookOpen, Lock } from 'lucide-react';
import { fetchSafeSpells } from '../services/sanctuaryApi';

export default function SpellDiscovery({ className = '', onAddSpell, allowAdd = true, maxSpellLevel = 9 }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    setSearchResults([]);

    const { results, error: searchError } = await fetchSafeSpells(searchQuery);

    if (searchError) {
      setError(searchError);
    } else {
      // Filter out spells higher than what the character can cast
      const validSpells = results.filter(s => s.level <= maxSpellLevel);
      
      // If a class filter is provided, optionally filter by class 
      // (Homebrew spells don't strictly have classes enforced in the DB yet, so we allow them)
      const classFiltered = className 
        ? validSpells.filter(s => s.isHomebrew || s.classes?.some(c => c.name.toLowerCase() === className.toLowerCase().split(' ')[0]))
        : validSpells;

      setSearchResults(classFiltered);
    }
    
    setIsSearching(false);
  };

  const handleAdd = (spell) => {
    const formattedSpell = {
      name: spell.name,
      level: spell.level,
      desc: Array.isArray(spell.desc) ? spell.desc.join('\n') : spell.desc,
      casting_time: spell.casting_time || '1 Action',
      range: spell.range || 'Touch',
      duration: spell.duration || 'Instantaneous',
      isPrepared: true 
    };
    onAddSpell(formattedSpell);
    // Remove from results to prevent double adding
    setSearchResults(prev => prev.filter(s => s.name !== spell.name));
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm p-5 rounded-2xl border border-fuchsia-500/30 shadow-[0_0_30px_rgba(217,70,239,0.1)] mb-6 animate-in fade-in slide-in-from-top-2 relative overflow-hidden">
      
      <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-600/5 blur-[80px] rounded-full pointer-events-none"></div>

      <div className="flex justify-between items-center mb-5 relative z-10">
        <h4 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 to-indigo-300 flex items-center gap-2 uppercase tracking-widest drop-shadow-sm">
          <BookOpen className="w-5 h-5 text-fuchsia-400" /> Arcane Archives
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
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search spells by name..."
            className="w-full bg-slate-950/80 border border-slate-600 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-400 transition-all shadow-inner placeholder-slate-600"
          />
        </div>
        <button 
          type="submit" 
          disabled={isSearching || !searchQuery.trim()}
          className="bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_15px_rgba(217,70,239,0.3)] hover:shadow-[0_0_25px_rgba(217,70,239,0.5)] flex items-center gap-2 shrink-0"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Scribe'}
        </button>
      </form>
      
      {error && (
        <div className="bg-red-950/30 border border-red-900/50 text-red-400 p-4 rounded-xl text-sm mb-4 relative z-10">
          {error}
        </div>
      )}

      <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 relative z-10">
        {searchResults.map((spell, idx) => (
          <div key={idx} className="bg-slate-800/80 border border-slate-600 p-4 rounded-xl text-left transition-all duration-300 hover:border-fuchsia-500/50 hover:shadow-[0_4px_20px_rgba(217,70,239,0.15)] relative overflow-hidden group">
            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className="pr-4">
                <span className="font-black text-lg text-fuchsia-300 drop-shadow-sm block mb-1">
                   {spell.name}
                   {spell.isHomebrew && <span className="text-[9px] ml-2 text-fuchsia-400 uppercase tracking-widest border border-fuchsia-500/30 px-1 rounded bg-fuchsia-900/20">Custom</span>}
                </span>
                <div className="flex gap-2">
                   <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border shadow-inner bg-slate-900/80 text-slate-400 border-slate-700">
                     Lvl {spell.level === 0 ? 'Cantrip' : spell.level}
                   </span>
                   <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border shadow-inner bg-slate-900/80 text-slate-400 border-slate-700">
                     {spell.school?.name || 'Evocation'}
                   </span>
                </div>
              </div>
              
              {allowAdd && (
                <button 
                  onClick={() => handleAdd(spell)}
                  className="px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 shadow-sm bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/50 shadow-[0_0_15px_rgba(79,70,229,0.2)]"
                >
                  <Plus className="w-3.5 h-3.5" /> Scribe
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-900/50 p-2 rounded-lg border border-slate-700/50 text-xs text-slate-300 relative z-10">
              <div><span className="font-bold text-slate-500">Time:</span> {spell.casting_time}</div>
              <div><span className="font-bold text-slate-500">Range:</span> {spell.range}</div>
              <div className="col-span-2"><span className="font-bold text-slate-500">Dur:</span> {spell.duration}</div>
            </div>

            <p className="text-sm mt-3 leading-relaxed text-slate-300 line-clamp-3 hover:line-clamp-none transition-all cursor-pointer relative z-10">
              {Array.isArray(spell.desc) ? spell.desc.join('\n') : spell.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}