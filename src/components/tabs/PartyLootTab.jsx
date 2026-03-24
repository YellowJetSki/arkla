import { Gem } from 'lucide-react';

export default function PartyLootTab({ partyLoot, setActiveLoot }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-5">
      <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2"><Gem className="w-5 h-5 text-emerald-400" /> Shared Party Vault</h3>
      <p className="text-sm text-slate-400 mb-6">Items shared by the DM for the entire party to see.</p>
      
      {partyLoot.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/50 border border-slate-700 border-dashed rounded-xl text-slate-500">The vault is currently empty.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {partyLoot.map(item => (
            <button 
              key={item.id} 
              onClick={() => setActiveLoot(item)} 
              className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-lg group text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer block"
            >
              <div className="h-48 w-full overflow-hidden bg-slate-950 relative">
                <img src={item.url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-80 pointer-events-none"></div>
                <h4 className="absolute bottom-3 left-3 right-3 font-bold text-emerald-400 truncate drop-shadow-md pointer-events-none">{item.name}</h4>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}