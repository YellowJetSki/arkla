import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { X, Backpack, Send, PackagePlus, Hammer, Search, Loader2, Plus } from 'lucide-react';
import DMItemForge from './DMItemForge';
import DialogModal from './shared/DialogModal';

export default function DMItemManager({ onClose, activePlayers }) {
  const [stashedItems, setStashedItems] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [showForge, setShowForge] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [srdItems, setSrdItems] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  // Load DM Stash & SRD Stubs
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
    
    const fetchSrd = async () => {
      try {
        const res = await fetch('https://www.dnd5eapi.co/api/equipment');
        const data = await res.json();
        setSrdItems(data.results || []);
      } catch (err) { console.error("Failed to load SRD index", err); }
    };

    fetchStash();
    fetchSrd();
  }, []);

  const saveStashToDb = async (newItems) => {
    setStashedItems(newItems);
    await updateDoc(doc(db, 'campaign', 'dm_stash'), { items: newItems });
  };

  const fetchAndStashApiItem = async (url) => {
    setIsSearching(true);
    try {
      const res = await fetch(`https://www.dnd5eapi.co${url}`);
      const detail = await res.json();
      
      const structuredItem = {
        id: `item_${Date.now()}`,
        name: detail.name,
        category: detail.equipment_category?.name || 'Adventuring Gear',
        desc: Array.isArray(detail.desc) ? detail.desc.join('\n') : (detail.desc || 'A standard piece of equipment.'),
        quantity: 1,
        imageUrl: '',
        damageDice: detail.damage?.damage_dice || null,
        damageType: detail.damage?.damage_type?.name || null,
        properties: detail.properties ? detail.properties.map(p => p.name).join(', ') : null,
        ac: detail.armor_class?.base || null
      };

      saveStashToDb([structuredItem, ...stashedItems]);
      setSearchQuery('');
    } catch (err) {
      console.error(err);
      setDialog({ isOpen: true, title: 'Error', message: 'Failed to extract item from archives.', type: 'alert' });
    } finally {
      setIsSearching(false);
    }
  };

  const sendToPlayer = async (item) => {
    if (!selectedPlayer) {
      setDialog({ isOpen: true, title: 'No Target', message: 'Select a player from the dropdown first.', type: 'alert' });
      return;
    }

    const playerRef = doc(db, 'characters', selectedPlayer);
    const playerSnap = await getDoc(playerRef);
    
    if (playerSnap.exists()) {
      const currentInv = playerSnap.data().inventory || [];
      const invArray = Array.isArray(currentInv) ? currentInv : []; 
      
      const newInv = [...invArray, item];
      
      await updateDoc(playerRef, { inventory: newInv });
      
      saveStashToDb(stashedItems.filter(i => i.id !== item.id));
      setDialog({ isOpen: true, title: 'Item Sent', message: `${item.name} has been mysteriously placed in their backpack.`, type: 'alert' });
    }
  };

  const removeStashedItem = (id) => {
    saveStashToDb(stashedItems.filter(i => i.id !== id));
  };

  const filteredSrd = searchQuery.length > 2 
    ? srdItems.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 15)
    : [];

  return (
    <>
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} onCancel={closeDialog} />

      {showForge && <DMItemForge onClose={() => setShowForge(false)} />}

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
                <div className="flex items-center justify-between mb-4 border-b border-slate-700/50 pb-2">
                  <h3 className="font-bold text-white uppercase tracking-widest text-sm">1. Prep Gear & Artifacts</h3>
                  <button 
                    onClick={() => setShowForge(true)}
                    className="bg-emerald-900/40 hover:bg-emerald-600 text-emerald-400 hover:text-white px-3 py-1.5 rounded-lg text-xs uppercase font-black tracking-widest transition-colors flex items-center gap-1.5 border border-emerald-500/30"
                  >
                    <Hammer className="w-3.5 h-3.5" /> Forge Custom
                  </button>
                </div>
                
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search SRD Equipment..." 
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 shadow-inner"
                  />
                </div>

                {isSearching ? (
                  <div className="flex items-center justify-center p-8 text-indigo-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
                ) : (
                  <div className="space-y-2">
                    {filteredSrd.map(item => (
                      <div key={item.index} className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex justify-between items-center group shadow-sm">
                        <span className="font-bold text-slate-300 text-sm">{item.name}</span>
                        <button 
                          onClick={() => fetchAndStashApiItem(item.url)}
                          className="bg-indigo-900/40 hover:bg-indigo-600 text-indigo-400 hover:text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors border border-indigo-500/30 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Stash
                        </button>
                      </div>
                    ))}
                    {searchQuery.length > 2 && filteredSrd.length === 0 && <p className="text-sm text-slate-500 italic p-4 text-center">No SRD items found.</p>}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: The Stash & Assignment */}
            <div className="space-y-4 lg:border-l lg:border-slate-700 lg:pl-8">
              <h3 className="font-bold text-white border-b border-slate-700/50 pb-2 flex items-center justify-between uppercase tracking-widest text-sm">
                <span className="flex items-center gap-2"><Backpack className="w-4 h-4 text-emerald-400" /> 2. Your Stash</span>
              </h3>
              
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 shadow-inner mb-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Target Player</label>
                <select value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)} className="w-full bg-slate-950 text-white border border-slate-600 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500 shadow-inner">
                  <option value="">-- Select a Player --</option>
                  {activePlayers?.map(id => <option key={id} value={id}>{id}</option>)}
                </select>
              </div>

              {stashedItems.length === 0 ? (
                <p className="text-sm text-slate-500 italic bg-slate-900/50 p-6 rounded-xl border border-slate-700 border-dashed text-center">Your stash is empty.</p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {stashedItems.map((item) => (
                    <div key={item.id} className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 shadow-sm relative group hover:border-emerald-500/50 transition-colors">
                      <button onClick={() => removeStashedItem(item.id)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400 transition-colors bg-slate-950 p-1 rounded"><X className="w-3 h-3" /></button>
                      
                      <h4 className="font-black text-white text-sm pr-6 mb-1">{item.name}</h4>
                      <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold block mb-2">{item.category}</span>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.damageDice && <span className="bg-slate-950 border border-slate-800 text-slate-300 text-[10px] px-1.5 py-0.5 rounded shadow-inner">Dmg: {item.damageDice}</span>}
                        {item.ac && <span className="bg-slate-950 border border-slate-800 text-slate-300 text-[10px] px-1.5 py-0.5 rounded shadow-inner">AC: {item.ac}</span>}
                      </div>

                      <button onClick={() => sendToPlayer(item)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        <Send className="w-3.5 h-3.5" /> Grant to Player
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