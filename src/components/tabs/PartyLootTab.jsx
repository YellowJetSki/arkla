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
        const currentInv = charData.inventory || '';
        
        const parsed = parseLootItem(item.desc);
        const newInvText = `• ${parsed.name}${parsed.desc ? '\n  ' + parsed.desc : ''}`;
        
        const newInv = currentInv.trim() ? `${currentInv}\n\n${newInvText}` : newInvText;

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
          message: `${parsed.name} has been added to your personal inventory.`,
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
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-5">
      <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2"><Gem className="w-5 h-5 text-emerald-400" /> Shared Party Vault</h3>
      <p className="text-sm text-slate-400 mb-6">Items and maps shared by the DM or Party.</p>
      
      {partyLoot.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/50 border border-slate-700 border-dashed rounded-xl text-slate-500">The vault is currently empty.</div>
      ) : (
        <div className="space-y-8">
          
          {/* Visual Handouts Grid */}
          {visualHandouts.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-slate-700 pb-2 mb-4">Visual Handouts</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {visualHandouts.map(item => (
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
            </div>
          )}

          {/* Text/Equipment Loot List */}
          {textItems.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 border-b border-slate-700 pb-2 mb-4">Equipment & Stashed Items</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {textItems.map((item) => {
                  const parsed = parseLootItem(item.desc);
                  const isOpen = openItems[item.id];

                  return (
                    <div key={item.id} className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden flex flex-col shadow-sm">
                      
                      <div 
                        className={`p-3 flex justify-between items-start cursor-pointer hover:bg-slate-800/50 transition-colors ${isOpen ? 'bg-slate-800/50' : ''}`}
                        onClick={() => toggleItemOpen(item.id)}
                      >
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-indigo-300">{parsed.name}</h4>
                            {parsed.desc && (
                              <div className="text-slate-500">
                                {isOpen ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                              </div>
                            )}
                          </div>
                          {item.source && (
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                              From: {item.source}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <button 
                            onClick={(e) => { e.stopPropagation(); claimLoot(item); }}
                            className="bg-indigo-900/40 hover:bg-indigo-600 text-indigo-400 hover:text-white px-2 py-1.5 rounded text-xs font-bold transition-colors border border-indigo-500/30 hover:border-transparent flex items-center gap-1"
                            title="Move to your personal inventory"
                          >
                            <UserPlus className="w-3 h-3" /> Claim
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteLoot(item.id); }} 
                            className="bg-red-900/20 hover:bg-red-900/60 text-red-500 p-1.5 rounded transition-colors"
                            title="Destroy item permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {parsed.desc && isOpen && (
                        <div className="p-3 pt-0 border-t border-slate-800/50 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed animate-in slide-in-from-top-1 fade-in">
                          {parsed.desc}
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