import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { X, Backpack, Send, PackagePlus, ShieldAlert } from 'lucide-react';
import ApiBestiaryImport from './ApiBestiaryImport'; // We can reuse the logic/UI from here later, or keep it distinct
import EquipmentDiscovery from './EquipmentDiscovery';
import DialogModal from './shared/DialogModal';

export default function DMItemManager({ onClose, activePlayers }) {
  const [stashedItems, setStashedItems] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  // Load the DM's persistent stash
  useEffect(() => {
    const fetchStash = async () => {
      const stashRef = doc(db, 'campaign', 'dm_stash');
      const snap = await getDoc(stashRef);
      if (snap.exists()) {
        setStashedItems(snap.data().items || []);
      } else {
        await updateDoc(doc(db, 'campaign', 'dm_stash'), { items: [] });
      }
    };
    fetchStash();
  }, []);

  const saveStashToDb = async (newItems) => {
    setStashedItems(newItems);
    await updateDoc(doc(db, 'campaign', 'dm_stash'), { items: newItems });
  };

  const handleStashApiItem = (formattedItemText) => {
    const newItem = { id: Date.now(), text: formattedItemText };
    saveStashToDb([newItem, ...stashedItems]);
  };

  const sendToPlayer = async (item) => {
    if (!selectedPlayer) {
      setDialog({ isOpen: true, title: 'No Target', message: 'Select a player from the dropdown first.', type: 'alert' });
      return;
    }

    const playerRef = doc(db, 'characters', selectedPlayer);
    const playerSnap = await getDoc(playerRef);
    
    if (playerSnap.exists()) {
      const currentInv = playerSnap.data().inventory || '';
      const newInv = currentInv.trim() ? `${currentInv}\n\n${item.text}` : item.text;
      
      await updateDoc(playerRef, { inventory: newInv });
      
      // Remove from stash after sending
      saveStashToDb(stashedItems.filter(i => i.id !== item.id));
      setDialog({ isOpen: true, title: 'Item Sent', message: 'The item has been mysteriously placed in their backpack.', type: 'alert' });
    }
  };

  const removeStashedItem = (id) => {
    saveStashToDb(stashedItems.filter(i => i.id !== id));
  };

  return (
    <>
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} onCancel={closeDialog} />

      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md h-[100dvh] overflow-hidden animate-in fade-in duration-300">
        <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl w-full max-w-4xl shadow-[0_0_40px_rgba(99,102,241,0.2)] flex flex-col max-h-[90dvh] animate-in zoom-in-95 duration-500">
          
          <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/90 rounded-t-2xl shrink-0">
            <h2 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
              <PackagePlus className="w-6 h-6" /> DM Item Vault
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl border border-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-slate-800/30">
            
            {/* LEFT: Discovery/Prep */}
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-white mb-2">1. Prep Gear & Artifacts</h3>
                <p className="text-xs text-slate-400 mb-4">Search the API. Found items will be saved to your secret Stash until you assign them.</p>
                <EquipmentDiscovery onAddEquipment={handleStashApiItem} />
              </div>
            </div>

            {/* RIGHT: The Stash & Assignment */}
            <div className="space-y-4 lg:border-l lg:border-slate-700 lg:pl-8">
              <h3 className="font-bold text-white border-b border-slate-700 pb-2 flex items-center justify-between">
                <span className="flex items-center gap-2"><Backpack className="w-5 h-5 text-emerald-400" /> Your Stash</span>
              </h3>
              
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-600 mb-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Target Player</label>
                <select value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)} className="w-full bg-slate-800 text-white border border-slate-600 rounded p-2 focus:outline-none focus:border-emerald-500">
                  <option value="">-- Select a Player --</option>
                  {activePlayers?.map(id => <option key={id} value={id}>{id}</option>)}
                </select>
              </div>

              {stashedItems.length === 0 ? (
                <p className="text-sm text-slate-500 italic bg-slate-800 p-4 rounded-xl border border-slate-700">Your stash is empty. Search for items to prep them.</p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {stashedItems.map((item) => (
                    <div key={item.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm relative group">
                      <button onClick={() => removeStashedItem(item.id)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                      <pre className="text-xs text-slate-300 font-sans whitespace-pre-wrap mb-4">{item.text}</pre>
                      <button onClick={() => sendToPlayer(item)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md">
                        <Send className="w-4 h-4" /> Grant to Player
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}