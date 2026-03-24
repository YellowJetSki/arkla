import { useState } from 'react';
import { Search, Loader2, Plus, Hammer } from 'lucide-react';

export default function FeatDiscovery({ onAddFeat }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isForging, setIsForging] = useState(false);
  const [customFeat, setCustomFeat] = useState({ name: '', desc: '' });

  const searchFeats = async () => {
    if (!query) return;
    setIsLoading(true);
    try {
      const res = await fetch(`https://www.dnd5eapi.co/api/feats/?name=${query}`);
      const data = await res.json();
      if (data.results) {
        const details = await Promise.all(data.results.slice(0, 5).map(async (feat) => {
          const detailRes = await fetch(`https://www.dnd5eapi.co${feat.url}`);
          return await detailRes.json();
        }));
        setResults(details);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customFeat.name) return;
    onAddFeat({ name: customFeat.name, desc: customFeat.desc, type: 'Feat' });
    setCustomFeat({ name: '', desc: '' });
    setIsForging(false);
  };

  return (
    <div className="bg-slate-900/80 p-4 rounded-xl border border-amber-500/30 mb-6">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Discover Feats</h4>
        <button onClick={() => setIsForging(!isForging)} className="text-xs text-amber-300 hover:text-white flex items-center gap-1"><Hammer className="w-3 h-3"/> Forge Homebrew</button>
      </div>

      {isForging ? (
        <form onSubmit={handleCustomSubmit} className="space-y-3">
          <input type="text" placeholder="Feat Name" required value={customFeat.name} onChange={e => setCustomFeat({...customFeat, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm focus:border-amber-500 outline-none" />
          <textarea placeholder="Description and mechanics..." required value={customFeat.desc} onChange={e => setCustomFeat({...customFeat, desc: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm h-20 resize-y focus:border-amber-500 outline-none" />
          <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded flex justify-center items-center gap-2"><Plus className="w-4 h-4"/> Add Custom Feat</button>
        </form>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchFeats()} placeholder="Search API (e.g., Grappler)" className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
            <button onClick={searchFeats} className="bg-slate-800 hover:bg-slate-700 text-white px-4 rounded-lg"><Search className="w-4 h-4" /></button>
          </div>
          {isLoading && <Loader2 className="w-5 h-5 text-amber-400 animate-spin mx-auto" />}
          <div className="space-y-3">
            {results.map((feat, i) => (
              <div key={i} className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex justify-between items-start gap-4">
                <div>
                  <h5 className="font-bold text-white text-sm">{feat.name}</h5>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{feat.desc?.[0]}</p>
                </div>
                <button onClick={() => onAddFeat({ name: feat.name, desc: feat.desc?.join('\n'), type: 'Feat' })} className="bg-amber-600 hover:bg-amber-500 text-white p-1.5 rounded flex-shrink-0"><Plus className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}