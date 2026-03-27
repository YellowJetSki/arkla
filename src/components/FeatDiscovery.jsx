import { useState, useEffect } from 'react';
import { Search, Loader2, Plus, Sparkles, Lock, ChevronDown } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getFeatStubs, fetchDetailedStubs } from '../services/arklaEngine';

export default function FeatDiscovery({ onAddFeat, allowAdd = true, charLevel = 20 }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const [allFeats, setAllFeats] = useState([]); // Combined Homebrew + API Stubs
  const [filteredFeats, setFilteredFeats] = useState([]);
  const [visibleFeats, setVisibleFeats] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const CHUNK_SIZE = 10;

  useEffect(() => {
    const initFeats = async () => {
      setIsSearching(true);
      
      // 1. Fetch Homebrew from Firebase
      let homebrew = [];
      try {
        const snap = await getDocs(collection(db, 'custom_feats'));
        homebrew = snap.docs.map(doc => {
           const data = doc.data();
           return { ...data, id: doc.id, isHomebrew: true };
        });
      } catch (err) {
        console.error("Failed to load custom feats", err);
      }

      // 2. Fetch API Stubs from Arkla Engine
      const apiStubs = await getFeatStubs();
      
      // 3. Combine them
      const combined = [...homebrew, ...apiStubs];
      setAllFeats(combined);
      setFilteredFeats(combined);
      
      // 4. Load the first chunk
      await loadChunk(combined.slice(0, CHUNK_SIZE));
      setIsSearching(false);
    };
    initFeats();
  }, []);

  const loadChunk = async (chunk) => {
    const homebrewItems = chunk.filter(item => item.isHomebrew);
    const apiStubs = chunk.filter(item => !item.isHomebrew);
    
    const apiDetails = await fetchDetailedStubs(apiStubs);
    
    // Merge back together
    setVisibleFeats(prev => [...prev, ...homebrewItems, ...apiDetails]);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    
    const query = searchQuery.trim().toLowerCase();
    const newFiltered = allFeats.filter(item => item.name.toLowerCase().includes(query));
    setFilteredFeats(newFiltered);
    
    setVisibleFeats([]); // clear current view
    await loadChunk(newFiltered.slice(0, CHUNK_SIZE));
    
    setIsSearching(false);
  };

  const handleLoadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    
    const currentLength = visibleFeats.length;
    const nextChunk = filteredFeats.slice(currentLength, currentLength + CHUNK_SIZE);
    await loadChunk(nextChunk);
    
    setIsLoadingMore(false);
  };

  const handleAdd = (feat) => {
    onAddFeat({ name: feat.name, desc: feat.desc });
    setVisibleFeats(prev => prev.filter(f => f.name !== feat.name));
  };

  const hasMore = visibleFeats.length < filteredFeats.length;

  return (
    <div className="bg-slate-900/80 p-4 rounded-xl border border-indigo-500/30 shadow-inner mb-6 animate-in fade-in slide-in-from-top-2">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Global Feat Registry
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
                 setFilteredFeats(allFeats);
                 setVisibleFeats([]);
                 loadChunk(allFeats.slice(0, CHUNK_SIZE));
             }
          }}
          placeholder="Search global feats (e.g. Sharpshooter)"
          className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
        />
        <button 
          type="submit" 
          disabled={isSearching}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shrink-0"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </button>
      </form>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
        {visibleFeats.map((feat, idx) => {
          const reqLvl = feat.reqLevel || 1;
          const isTooHigh = charLevel < reqLvl;

          return (
            <div key={feat.id || feat.index || idx} className={`border p-3 rounded-lg text-left transition-colors ${isTooHigh ? 'bg-slate-900/50 border-slate-700/50' : 'bg-slate-800 border-slate-600'}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className={`font-bold block flex items-center gap-2 ${isTooHigh ? 'text-slate-400' : 'text-indigo-300'}`}>
                    {feat.name}
                    {feat.isHomebrew && <span className="text-[8px] bg-indigo-900/50 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/50 uppercase">Homebrew</span>}
                  </span>
                  {reqLvl > 1 && <span className="text-[10px] uppercase font-bold text-amber-400/80">Requires Level {reqLvl}</span>}
                </div>
                
                {allowAdd && (
                  <button 
                    onClick={() => handleAdd(feat)}
                    disabled={isTooHigh}
                    className={`px-2 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1 shrink-0 ${isTooHigh ? 'bg-slate-800/50 text-slate-500 border border-slate-700 cursor-not-allowed' : 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/50'}`}
                  >
                    {isTooHigh ? <Lock className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {isTooHigh ? `Lvl ${reqLvl} Req.` : 'Add'}
                  </button>
                )}
              </div>
              <p className={`text-xs mt-2 whitespace-pre-wrap ${isTooHigh ? 'text-slate-500' : 'text-slate-300'}`}>{feat.desc}</p>
            </div>
          );
        })}

        {hasMore && (
          <button 
            onClick={handleLoadMore} 
            disabled={isLoadingMore}
            className="w-full py-3 mt-4 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-indigo-400 font-bold text-xs uppercase tracking-widest transition-colors flex justify-center items-center gap-2"
          >
            {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ChevronDown className="w-4 h-4"/> Load More Feats</>}
          </button>
        )}
      </div>
    </div>
  );
}