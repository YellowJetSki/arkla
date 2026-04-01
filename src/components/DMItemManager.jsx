import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import { X, Backpack, Send, PackagePlus, Hammer, Search, Plus, Sword, Shield, Image as ImageIcon, Users } from 'lucide-react';
import DialogModal from './shared/DialogModal';
import { fetchAllEquipment, fetchEquipmentDetails } from '../services/srdApi';

export default function DMItemManager({ onClose, activePlayers }) {
  const [stashedItems, setStashedItems] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  
  // Unified Forge Form State
  const [newItem, setNewItem] = useState({ 
    name: '', category: 'Wondrous Item', damageDice: '1d8', damageType: 'Slashing', 
    properties: '', ac: 14, hpRecovery: '', desc: '', imageUrl: '', quantity: 1 
  });
  
  // SRD Autocomplete State
  const [srdEquipmentList, setSrdEquipmentList] = useState([]);
  const [filteredEquip, setFilteredEquip] = useState([]);
  const [showEquipDropdown, setShowEquipDropdown] = useState(false);
  
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  // Load DM Stash & SRD List
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
    fetchAllEquipment().then(setSrdEquipmentList);
  }, []);

  const saveStashToDb = async (newItems) => {
    setStashedItems(newItems);
    await updateDoc(doc(db, 'campaign', 'dm_stash'), { items: newItems });
  };

  const handleItemNameChange = (e) => {
    const val = e.target.value;
    setNewItem(prev => ({ ...prev, name: val }));
    if (val.length > 1) {
      setFilteredEquip(srdEquipmentList.filter(i => i.name.toLowerCase().includes(val.toLowerCase())));
      setShowEquipDropdown(true);
    } else {
      setShowEquipDropdown(false);
    }
  };

  const handleSelectSrdItem = async (indexStr) => {
    setShowEquipDropdown(false);
    const details = await fetchEquipmentDetails(indexStr);
    if (details) {
      setNewItem(prev => ({
        ...prev,
        name: details.name,
        category: details.category === 'Adventuring Gear' || details.category === 'Potion' ? details.category : details.category,
        desc: details.desc,
        damageDice: details.damageDice || '',
        damageType: details.damageType || 'Slashing',
        properties: details.properties || '',
        ac: details.ac || 14
      }));
    }
  };

  const handleForgeItem = async (e) => {
    e.preventDefault();
    if (!newItem.name) return;
    
    const structuredItem = {
       id: `item_${Date.now()}`,
       name: newItem.name,
       category: newItem.category,
       desc: newItem.desc,
       imageUrl: newItem.imageUrl,
       quantity: Number(newItem.quantity) || 1,
       damageDice: newItem.category === 'Weapon' ? newItem.damageDice : null,
       damageType: newItem.category === 'Weapon' ? newItem.damageType : null,
       properties: newItem.category === 'Weapon' ? newItem.properties : null,
       ac: newItem.category === 'Armor' ? Number(newItem.ac) : null,
       hpRecovery: newItem.category === 'Consumable' || newItem.category === 'Potion' ? newItem.hpRecovery : null
    };
    
    await saveStashToDb([structuredItem, ...stashedItems]);
    
    // Reset Form
    setNewItem({ name: '', category: 'Wondrous Item', damageDice: '1d8', damageType: 'Slashing', properties: '', ac: 14, hpRecovery: '', desc: '', imageUrl: '', quantity: 1 });
    setDialog({ isOpen: true, title: 'Item Forged', message: `${structuredItem.name} has been added to your Vault.`, type: 'alert' });
  };

  const sendToPlayer = async (item) => {
    if (!selectedPlayer) {
      setDialog({ isOpen: true, title: 'No Target', message: 'Select a player from the dropdown first.', type: 'alert' });
      return;
    }

    try {
      const playerRef = doc(db, 'characters', selectedPlayer);
      const playerSnap = await getDoc(playerRef);
      
      if (playerSnap.exists()) {
        const currentInv = playerSnap.data().inventory || [];
        const invArray = Array.isArray(currentInv) ? currentInv : []; 
        const newInv = [...invArray, item];
        
        await updateDoc(playerRef, { inventory: newInv });
        await saveStashToDb(stashedItems.filter(i => i.id !== item.id));
        setDialog({ isOpen: true, title: 'Item Sent', message: `${item.name} has been mysteriously placed in their backpack.`, type: 'alert' });
      }
    } catch (err) {
      console.error(err);
      setDialog({ isOpen: true, title: 'Error', message: 'Failed to send item.', type: 'alert' });
    }
  };

  const sendToAllPlayers = async (item) => {
    if (!activePlayers || activePlayers.length === 0) {
      setDialog({ isOpen: true, title: 'No Players', message: 'There are no active players in the session.', type: 'alert' });
      return;
    }

    setDialog({
      title: 'Grant to All Party Members?',
      message: `This will place a copy of ${item.name} into the inventory of every active player. The original will be removed from your vault.`,
      type: 'confirm',
      onConfirm: async () => {
        try {
          const batch = writeBatch(db);
          
          for (const playerId of activePlayers) {
            const pRef = doc(db, 'characters', playerId);
            const pSnap = await getDoc(pRef);
            if (pSnap.exists()) {
              const currentInv = pSnap.data().inventory || [];
              const invArray = Array.isArray(currentInv) ? currentInv : [];
              
              // Create a deep copy with a unique ID for each player so they don't share reference bugs
              const itemCopy = { ...item, id: `item_${Date.now()}_${playerId}` };
              batch.update(pRef, { inventory: [...invArray, itemCopy] });
            }
          }
          
          await batch.commit();
          await saveStashToDb(stashedItems.filter(i => i.id !== item.id));
          
          closeDialog();
          setTimeout(() => {
            setDialog({ isOpen: true, title: 'Mass Grant Complete', message: `All ${activePlayers.length} players received the item.`, type: 'alert' });
          }, 300);
        } catch(e) {
          console.error(e);
          setDialog({ isOpen: true, title: 'Error', message: 'Failed to grant to all players.', type: 'alert' });
        }
      },
      onCancel: closeDialog
    });
  };

  const removeStashedItem = (id) => {
    saveStashToDb(stashedItems.filter(i => i.id !== id));
  };

  return (
    <>
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} onCancel={closeDialog} />

      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md h-[100dvh] overflow-hidden animate-in fade-in duration-300">
        <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl w-full max-w-5xl shadow-[0_0_40px_rgba(99,102,241,0.2)] flex flex-col max-h-[90dvh] animate-in zoom-in-95 duration-500">
          
          <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/90 rounded-t-2xl shrink-0">
            <h2 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
              <PackagePlus className="w-6 h-6" /> DM Item Vault
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl border border-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-slate-800/30">
            
            {/* LEFT: Unified Item Forge */}
            <div className="space-y-6">
              <h3 className="font-bold text-white border-b border-slate-700/50 pb-2 flex items-center gap-2 uppercase tracking-widest text-sm">
                <Hammer className="w-4 h-4 text-indigo-400" /> 1. Forge Artifact
              </h3>
              
              <form onSubmit={handleForgeItem} className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-inner space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Search className="w-3 h-3"/> Item Name (SRD Search)
                    </label>
                    <input 
                      type="text" 
                      value={newItem.name} 
                      onChange={handleItemNameChange} 
                      required 
                      className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" 
                      placeholder="e.g. Longsword" 
                    />
                    
                    {showEquipDropdown && filteredEquip.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto custom-scrollbar bg-slate-950 border border-slate-600 rounded-lg shadow-2xl z-50">
                        {filteredEquip.map(item => (
                          <div 
                            key={item.index} 
                            onClick={() => handleSelectSrdItem(item.index)} 
                            className="px-3 py-2 text-sm text-slate-300 hover:bg-indigo-600 hover:text-white cursor-pointer border-b border-slate-800 last:border-0 transition-colors"
                          >
                            {item.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                    <select 
                      value={newItem.category} 
                      onChange={e => setNewItem({...newItem, category: e.target.value})} 
                      className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                    >
                      <option value="Wondrous Item">Wondrous Item</option>
                      <option value="Weapon">Weapon</option>
                      <option value="Armor">Armor</option>
                      <option value="Consumable">Consumable</option>
                      <option value="Potion">Potion</option>
                      <option value="Adventuring Gear">Adventuring Gear</option>
                    </select>
                  </div>
                </div>

                {newItem.category === 'Weapon' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1"><Sword className="w-3 h-3 inline"/> Damage</label>
                      <input 
                        type="text" 
                        value={newItem.damageDice} 
                        onChange={e => setNewItem({...newItem, damageDice: e.target.value})} 
                        className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-white text-xs focus:outline-none" 
                        placeholder="1d8" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type</label>
                      <input 
                        type="text" 
                        value={newItem.damageType} 
                        onChange={e => setNewItem({...newItem, damageType: e.target.value})} 
                        className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-white text-xs focus:outline-none" 
                        placeholder="Slashing" 
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Properties</label>
                      <input 
                        type="text" 
                        value={newItem.properties} 
                        onChange={e => setNewItem({...newItem, properties: e.target.value})} 
                        className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-white text-xs focus:outline-none" 
                        placeholder="Finesse, Light" 
                      />
                    </div>
                  </div>
                )}

                {newItem.category === 'Armor' && (
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1"><Shield className="w-3 h-3 inline"/> Armor Class (AC)</label>
                    <input 
                      type="number" 
                      value={newItem.ac} 
                      onChange={e => setNewItem({...newItem, ac: e.target.value})} 
                      className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none" 
                    />
                  </div>
                )}

                {(newItem.category === 'Consumable' || newItem.category === 'Potion') && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">HP Recovery (Dice or Flat Value)</label>
                    <input 
                      type="text" 
                      value={newItem.hpRecovery} 
                      onChange={e => setNewItem({...newItem, hpRecovery: e.target.value})} 
                      className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" 
                      placeholder="e.g. 2d4+2 or 10" 
                    />
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-1 block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    <ImageIcon className="w-3 h-3" /> Image URL (Optional)
                  </label>
                  <input 
                    type="url" 
                    value={newItem.imageUrl} 
                    onChange={e => setNewItem({...newItem, imageUrl: e.target.value})} 
                    className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" 
                    placeholder="https://..." 
                  />
                </div>

                <div className="flex gap-3">
                  <div className="w-20">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Qty</label>
                    <input 
                      type="number" 
                      value={newItem.quantity} 
                      onChange={e => setNewItem({...newItem, quantity: e.target.value})} 
                      className="w-full bg-slate-950 border border-slate-600 rounded-lg px-2 py-2 text-center text-white text-sm focus:outline-none" 
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                    <input 
                      type="text" 
                      value={newItem.desc} 
                      onChange={e => setNewItem({...newItem, desc: e.target.value})} 
                      className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" 
                      placeholder="Short description..." 
                    />
                  </div>
                </div>
                
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs py-3 rounded-lg flex justify-center items-center gap-2 transition-colors">
                  <Plus className="w-4 h-4"/> Store in Vault
                </button>
              </form>
            </div>

            {/* RIGHT: The Stash & Assignment */}
            <div className="space-y-4 lg:border-l lg:border-slate-700 lg:pl-8">
              <h3 className="font-bold text-white border-b border-slate-700/50 pb-2 flex items-center justify-between uppercase tracking-widest text-sm">
                <span className="flex items-center gap-2"><Backpack className="w-4 h-4 text-emerald-400" /> 2. Your Vault</span>
              </h3>
              
              {/* Single Player Assignment */}
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 shadow-inner mb-2 flex gap-2">
                <select value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)} className="flex-1 bg-slate-950 text-white border border-slate-600 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500 shadow-inner">
                  <option value="">-- Select a Player --</option>
                  {activePlayers?.map(id => <option key={id} value={id}>{id}</option>)}
                </select>
              </div>

              {stashedItems.length === 0 ? (
                <p className="text-sm text-slate-500 italic bg-slate-900/50 p-6 rounded-xl border border-slate-700 border-dashed text-center">Your vault is empty. Forge items to store them here.</p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {stashedItems.map((item) => (
                    <div key={item.id} className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 shadow-sm relative group hover:border-emerald-500/50 transition-colors">
                      <button onClick={() => removeStashedItem(item.id)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400 transition-colors bg-slate-950 p-1 rounded z-10"><X className="w-3 h-3" /></button>
                      
                      <div className="flex gap-3 mb-3">
                        {item.imageUrl && (
                          <div className="w-12 h-12 shrink-0 rounded bg-slate-950 border border-slate-700 overflow-hidden">
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-black text-white text-sm pr-6 mb-0.5 leading-tight">{item.quantity}x {item.name}</h4>
                          <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold block">{item.category}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.damageDice && <span className="bg-slate-950 border border-slate-800 text-slate-300 text-[10px] px-1.5 py-0.5 rounded shadow-inner">Dmg: {item.damageDice}</span>}
                        {item.ac && <span className="bg-slate-950 border border-slate-800 text-slate-300 text-[10px] px-1.5 py-0.5 rounded shadow-inner">AC: {item.ac}</span>}
                        {item.hpRecovery && <span className="bg-slate-950 border border-slate-800 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded shadow-inner">Heal: {item.hpRecovery}</span>}
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => sendToPlayer(item)} className="flex-1 bg-emerald-900/40 border border-emerald-500/50 hover:bg-emerald-600 text-emerald-400 hover:text-white font-black text-[10px] uppercase tracking-widest py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all">
                          <Send className="w-3 h-3" /> Grant to Target
                        </button>
                        <button onClick={() => sendToAllPlayers(item)} className="flex-1 bg-indigo-900/40 border border-indigo-500/50 hover:bg-indigo-600 text-indigo-400 hover:text-white font-black text-[10px] uppercase tracking-widest py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all">
                          <Users className="w-3 h-3" /> Grant to All
                        </button>
                      </div>
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