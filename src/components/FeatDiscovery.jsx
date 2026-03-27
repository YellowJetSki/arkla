import { useState, useEffect } from 'react';
import { Search, Loader2, Plus, Sparkles, Lock } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function FeatDiscovery({ onAddFeat, allowAdd = true }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [globalFeats, setGlobalFeats] = useState([]);

  useEffect(() => {
    const fetchGlobalFeats = async () => {
      try {
        const snap = await getDocs(collection(db, 'custom_feats'));
        const feats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGlobalFeats(feats);
      } catch (err) {
        console.error("Failed to load custom feats", err);
      }
    };
    fetchGlobalFeats();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    
    // In a real scenario, this would hit the 5e API for official feats.
    // For now, we search the local homebrew database.
    const query = searchQuery.toLowerCase();
    const results = globalFeats.filter(f => f.name.toLowerCase().includes(query) || f.desc.toLowerCase().includes(query));
    
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleAdd = (feat) => {
    onAddFeat({ name: feat.name, desc: feat.desc });
  };

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
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search global feats (e.g. Sharpshooter)"
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

      {searchResults.length === 0 && searchQuery && !isSearching && (
        <p className="text-sm text-slate-400 italic">No feats found in the registry.</p>
      )}
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
        {searchResults.map((feat) => (
          <div key={feat.id} className="bg-slate-800 border border-slate-600 p-3 rounded-lg text-left">
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-indigo-300 block">{feat.name}</span>
              {allowAdd && (
                <button 
                  onClick={() => handleAdd(feat)}
                  className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/50 px-2 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-2 whitespace-pre-wrap">{feat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}