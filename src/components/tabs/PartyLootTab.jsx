import { Gem, Trash2, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const parseLootItem = (text) => {
  if (!text) return { name: 'Unknown Item', desc: '' };
  const lines = text.trim().split('\n');
  const name = lines[0].replace(/^•\s*/, '').trim();
  const desc = lines.slice(1).join('\n').trim();
  return { name, desc };
};

export default function PartyLootTab({ partyLoot, setActiveLoot, charId, showDialog }) {
  const [openItems, setOpenItems] = useState({});

  const claimLoot = async (item) => {
    if (!charId) {
      showDialog({
        title: 'Error',
        message: 'No character ID found. Cannot claim loot.',
        type: 'alert',
        onConfirm: () => showDialog({ isOpen: false })
      });
      return;
    }

    try {
      const charRef = doc(db, 'characters', charId);
      const charSnap = await getDoc(charRef);

      if (charSnap.exists()) {
        const charData = charSnap.data();
        const currentInv = charData.inventory || [];
        
        const parsed = parseLootItem(item.desc);
        
        const newItemObj = {
           id: `item_${Date.now()}`,
           name: item.name || parsed.name,
           category: 'Adventuring Gear',
           desc: parsed.desc,
           imageUrl: item.url || '',
           quantity: 1
        };
        
        const newInv = [...currentInv, newItemObj];

        await setDoc(charRef, { inventory: newInv }, { merge: true });

        const lootRef = doc(db, 'campaign', 'shared_loot');
        const lootSnap = await getDoc(lootRef);
        if (lootSnap.exists()) {
          const currentLoot = lootSnap.data().items || [];
          const updatedLoot = currentLoot.filter(i => i.id !== item.id);
          await setDoc(lootRef, { items: updatedLoot }, { merge: true });
        }
        
        showDialog({
          title: 'Loot Claimed!',
          message: `${newItemObj.name} has been added to your personal inventory.`,
          type: 'alert',
          onConfirm: () => showDialog({ isOpen: false })
        });
      }
    } catch (err) {
      console.error("Failed to claim loot:", err);
      showDialog({
        title: 'Network Error',
        message: 'Failed to claim loot. Please try again.',
        type: 'alert',
        onConfirm: () => showDialog({ isOpen: false })
      });
    }
  };

  const deleteLoot = (itemId) => {
    showDialog({
      title: 'Destroy Loot?',
      message: 'Delete this item permanently from the party vault? It will be lost forever.',
      type: 'confirm',
      onConfirm: async () => {
        try {
          const lootRef = doc(db, 'campaign', 'shared_loot');
          const lootSnap = await getDoc(lootRef);
          if (lootSnap.exists()) {
            const currentLoot = lootSnap.data().items || [];
            const updatedLoot = currentLoot.filter(i => i.id !== itemId);
            await setDoc(lootRef, { items: updatedLoot }, { merge: true });
          }
        } catch (err) {
          console.error("Failed to delete loot:", err);
        }
        showDialog({ isOpen: false });
      },
      onCancel: () => showDialog({ isOpen: false })
    });
  };

  const toggleItemOpen = (id) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const visualHandouts = partyLoot.filter(i => i.url);
  const textItems = partyLoot.filter(i => !i.url && i.desc);

  return (
    <div className="bg-slate-800 border-[3px] border-slate-950 rounded-2xl p-4 md:p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none"></div>

      <h3 className="text-xl font-black text-white flex items-center gap-2 mb-2 uppercase tracking-widest drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] relative z-10"><Gem className="w-6 h-6 text-emerald-400 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" /> Shared Party Vault</h3>
      <p className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-wider relative z-10">Items and maps shared by the DM or Party.</p>
      
      {partyLoot.length === 0 ? (
        <div className="p-8 text-center bg-slate-900 border-2 border-slate-950 border-dashed rounded-xl text-slate-500 font-black uppercase tracking-widest shadow-inner">The vault is currently empty.</div>
      ) : (
        <div className="space-y-8 relative z-10">
          
          {/* Visual Handouts Grid */}
          {visualHandouts.length > 0 && (
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 border-b-2 border-slate-950 pb-2 mb-4 drop-shadow-sm">Visual Handouts</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visualHandouts.map(item => (
                  <div key={item.id} className="bg-slate-900 border-2 border-slate-950 rounded-xl overflow-hidden flex flex-col shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1">
                    <button 
                      onClick={() => setActiveLoot(item)} 
                      className="h-48 w-full overflow-hidden bg-slate-950 relative group cursor-pointer focus:outline-none border-b-2 border-slate-950"
                    >
                      <img 
                        src={item.url} 
                        alt={item.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/400x200/0f172a/64748b?text=Image+Blocked';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent opacity-90 pointer-events-none"></div>
                      <h4 className="absolute bottom-3 left-3 right-3 font-black text-lg leading-tight text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] pointer-events-none">{item.name}</h4>
                    </button>
                    
                    <div className="p-3 flex justify-between items-center bg-slate-900">
                       <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest bg-slate-950 px-2 py-1 rounded shadow-inner">Source: {item.source || 'DM'}</span>
                       <div className="flex gap-2">
                         <button onClick={() => claimLoot(item)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border-2 border-slate-950 flex items-center gap-1 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px]">
                           <UserPlus className="w-3 h-3" /> Claim
                         </button>
                         <button onClick={() => deleteLoot(item.id)} className="bg-slate-950 text-slate-500 hover:text-red-500 hover:bg-red-950 border-2 border-slate-800 hover:border-red-900 p-1.5 rounded-lg transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px]">
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Text/Equipment Loot List */}
          {textItems.length > 0 && (
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 border-b-2 border-slate-950 pb-2 mb-4 drop-shadow-sm">Equipment & Stashed Items</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {textItems.map((item) => {
                  const parsed = parseLootItem(item.desc);
                  const isOpen = openItems[item.id];

                  return (
                    <div key={item.id} className={`bg-slate-900 border-2 rounded-xl overflow-hidden flex flex-col shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-colors ${isOpen ? 'border-indigo-500' : 'border-slate-950'}`}>
                      
                      <div 
                        className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-800 transition-colors"
                        onClick={() => toggleItemOpen(item.id)}
                      >
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-black text-white text-lg leading-none drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">{item.name || parsed.name}</h4>
                            {parsed.desc && (
                              <div className="text-slate-500 bg-slate-950 rounded p-0.5 border border-slate-800 shadow-inner">
                                {isOpen ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                              </div>
                            )}
                          </div>
                          {item.source && (
                            <span className="text-[9px] uppercase font-black text-slate-500 tracking-widest bg-slate-950 px-2 py-0.5 rounded shadow-inner mt-1 inline-block">
                              Source: {item.source}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <button 
                            onClick={(e) => { e.stopPropagation(); claimLoot(item); }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border-2 border-slate-950 flex items-center gap-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px]"
                            title="Move to your personal inventory"
                          >
                            <UserPlus className="w-3.5 h-3.5" /> Claim
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteLoot(item.id); }} 
                            className="bg-slate-950 text-slate-500 hover:text-red-500 hover:bg-red-950 border-2 border-slate-800 hover:border-red-900 p-2 rounded-lg transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px]"
                            title="Destroy item permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {parsed.desc && isOpen && (
                        <div className="p-4 pt-0 border-t-2 border-slate-950 text-sm text-slate-300 font-medium whitespace-pre-wrap leading-relaxed animate-in slide-in-from-top-1 fade-in bg-slate-950/50">
                          <div className="mt-3 bg-slate-900 p-3 rounded-lg border border-slate-800 shadow-inner">
                            {parsed.desc}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}