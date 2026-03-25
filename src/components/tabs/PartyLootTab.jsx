import { useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Gem, Trash2, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';

// Reusing the same parsing logic we added to the player inventory
const parseLootItem = (text) => {
  if (!text) return { name: 'Unknown Item', desc: '' };
  const lines = text.trim().split('\n');
  const name = lines[0].replace(/^•\s*/, '').trim();
  const desc = lines.slice(1).join('\n').trim();
  return { name, desc };
};

export default function PartyLootTab({ partyLoot, setActiveLoot }) {
  const [openItems, setOpenItems] = useState({});

  const claimLoot = async (item) => {
    const charId = localStorage.getItem('charId');
    if (!charId) {
      alert("No character ID found.");
      return;
    }

    try {
      const charRef = doc(db, 'characters', charId);
      const charSnap = await getDoc(charRef);

      if (charSnap.exists()) {
        const charData = charSnap.data();
        const currentInv = charData.inventory || '';
        
        // Ensure we format the item correctly when claiming it back into personal inventory
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
      }
    } catch (err) {
      console.error("Failed to claim loot:", err);
      alert("Failed to claim loot. See console.");
    }
  };

  const deleteLoot = async (itemId) => {
    if (!window.confirm("Delete this item permanently from the party loot?")) return;
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
  };

  const toggleItemOpen = (id) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-5">
      <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 border-b border-slate-700 pb-2">
        <Gem className="w-5 h-5 text-emerald-400" /> Party Loot 
        <span className="text-xs bg-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded ml-2">{partyLoot.length}</span>
      </h3>
      
      {partyLoot.length === 0 ? (
        <div className="text-center p-8 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
          <Gem className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-500 font-bold">The party stash is empty.</p>
          <p className="text-xs text-slate-600 mt-1">Share items from your inventory to send them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {partyLoot.map((item) => {
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
                      <h4 className="font-bold text-emerald-400">{parsed.name}</h4>
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
                
                {item.url && (
                  <div className="p-3 pt-0 border-t border-slate-800/50 mt-auto">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveLoot(item); }}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-bold underline underline-offset-2"
                    >
                      View Image Attachment
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}