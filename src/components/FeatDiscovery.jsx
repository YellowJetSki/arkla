import { useState, useEffect } from 'react';
import { Search, Plus, Sparkles, BookOpen, Loader2 } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

const SRD_FEATS = [
  { name: 'Alert', desc: 'Always on the lookout for danger. You gain a +5 bonus to initiative. You can\'t be surprised while you are conscious. Other creatures don\'t gain advantage on attack rolls against you as a result of being unseen by you.' },
  { name: 'Athlete', desc: 'Increase your STR or DEX by 1. When you are prone, standing up uses only 5 feet of your movement. Climbing doesn\'t cost you extra movement. You can make a running long jump or high jump after moving only 5 feet on foot.' },
  { name: 'Actor', desc: 'Skilled at mimicry and dramatics. Increase your CHA by 1. You have advantage on Deception and Performance checks when trying to pass yourself off as a different person. You can mimic the speech of another person.' },
  { name: 'Tough', desc: 'Your hit point maximum increases by an amount equal to twice your level when you gain this feat. Whenever you gain a level thereafter, your hit point maximum increases by an additional 2 hit points.' },
  { name: 'Grappler', desc: 'You have advantage on attack rolls against a creature you are grappling. You can use your action to try to pin a creature grappled by you.' },
  { name: 'Mobile', desc: 'Your speed increases by 10 feet. When you use the Dash action, difficult terrain doesn\'t cost you extra movement. When you make a melee attack against a creature, you don\'t provoke opportunity attacks from that creature for the rest of the turn.' }
];

export default function FeatDiscovery({ onAddFeat }) {
  const [feats, setFeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchFeats = async () => {
      try {
        const customSnap = await getDocs(collection(db, 'custom_feats'));
        const customFeats = customSnap.docs.map(d => d.data());
        
        const combined = [...SRD_FEATS, ...customFeats].sort((a,b) => a.name.localeCompare(b.name));
        setFeats(combined);
      } catch (e) {
        console.error("Error fetching custom feats:", e);
        setFeats(SRD_FEATS);
      }
      setLoading(false);
    };
    fetchFeats();
  }, []);

  const filteredFeats = feats.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || f.desc.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 md:p-5 shadow-inner mb-6 animate-in slide-in-from-top-2 fade-in">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-5 h-5 text-emerald-400 shrink-0" />
        <input 
          type="text" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search feats..." 
          className="w-full bg-slate-950 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
          autoFocus
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
          <p>Uncovering ancient knowledge...</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
          {filteredFeats.length === 0 ? (
            <p className="text-center text-slate-500 italic py-6">No feats match your search.</p>
          ) : (
            filteredFeats.map((feat, idx) => (
              <div key={idx} className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-500 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4 group">
                <div className="flex-1">
                  <h4 className="font-bold text-white text-lg mb-1 flex items-center gap-2">
                    {feat.name}
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed">{feat.desc}</p>
                </div>
                <button 
                  onClick={() => onAddFeat(feat)} 
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shrink-0 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                >
                  <Plus className="w-4 h-4" /> Take Feat
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}