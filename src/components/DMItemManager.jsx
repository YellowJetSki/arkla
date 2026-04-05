import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import { X, Backpack, Send, PackagePlus, Hammer, Search, Plus, Sword, Shield, Image as ImageIcon, Users, Crosshair } from 'lucide-react';
import DialogModal from './shared/DialogModal';
import { fetchAllEquipment, fetchEquipmentDetails } from '../services/srdApi';

export default function DMItemManager({ onClose, activePlayers }) {
  const [stashedItems, setStashedItems] = useState([]);
  const [stashSearch, setStashSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [playerMap, setPlayerMap] = useState({});
  
  const [newItem, setNewItem] = useState({ 
    name: '', category: 'Wondrous Item', damageDice: '1d8', damageType: 'Slashing', 
    properties: '', range: '', ac: 14, hpRecovery: '', desc: '', imageUrl: '', quantity: 1 
  });
  
  const [srdEquipmentList, setSrdEquipmentList] = useState([]);
  const [filteredEquip, setFilteredEquip] = useState([]);
  const [showEquipDropdown, setShowEquipDropdown] = useState(false);
  
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    const fetchStash = async () => {
      const stashRef = doc(db, 'campaign', 'dm_stash');
      const snap = await getDoc(stashRef);
      if (snap.exists()) {
        setStashedItems(snap.data().items || []);
      } else {
        // FIX: Use setDoc to safely initialize the stash if it doesn't exist yet
        await setDoc(stashRef, { items: [] });
      }
    };
    
    const fetchPlayers = async () => {
      const map = {};
      for (const id of activePlayers) {
        const snap = await getDoc(doc(db, 'characters', id));
        if (snap.exists()) map[id] = snap.data().name;
      }
      setPlayerMap(map);
    };

    fetchStash();
    fetchAllEquipment().then(setSrdEquipmentList);
    if (activePlayers && activePlayers.length > 0) fetchPlayers();
  }, [activePlayers]);

  const saveStashToDb = async (newItems) => {
    setStashedItems(newItems);
    await updateDoc(doc(db, 'campaign', 'dm_stash'), { items: newItems });
  };

  const handleItemNameChange = (e) => {
    const val = e.target.value;
    setNewItem(prev => ({ ...prev, name: val }));
    
    if (val.length > 1) {
      const searchTerms = val.toLowerCase().split(' ').filter(Boolean);
      
      setFilteredEquip(srdEquipmentList.filter(i => {
        const itemName = i.name.toLowerCase();
        if (val.toLowerCase().includes('health potion') && itemName.includes('potion of healing')) return true;
        return searchTerms.every(term => itemName.includes(term));
      }));
      setShowEquipDropdown(true);
    } else {
      setShowEquipDropdown(false);
    }
  };

  const handleSelectSrdItem = async (urlOrIndex) => {
    setShowEquipDropdown(false);
    const details = await fetchEquipmentDetails(urlOrIndex);
    if (details) {
      setNewItem(prev => ({
        ...prev,
        name: details.name,
        category: details.category,
        desc: details.desc,
        damageDice: details.damageDice || '',
        damageType: details.damageType || 'Slashing',
        properties: details.properties || '',
        range: details.range || '',
        ac: details.ac || 14
      }));
    }
  };

  const handleForgeItem = async (e) => {
    e.preventDefault();
    if (!newItem.name) return;
    
    const structuredItem = {
       id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
       name: newItem.name,
       category: newItem.category,
       desc: newItem.desc,
       imageUrl: newItem.imageUrl,
       quantity: Number(newItem.quantity) || 1,
       damageDice: newItem.category === 'Weapon' ? newItem.damageDice : null,
       damageType: newItem.category === 'Weapon' ? newItem.damageType : null,
       properties: newItem.category === 'Weapon' ? newItem.properties : null,
       range: newItem.category === 'Weapon' ? newItem.range : null,
       ac: newItem.category === 'Armor' ? Number(newItem.ac) : null,
       hpRecovery: newItem.category === 'Consumable' || newItem.category === 'Potion' ? newItem.hpRecovery : null
    };
    
    await saveStashToDb([structuredItem, ...stashedItems]);
    
    setNewItem({ name: '', category: 'Wondrous Item', damageDice: '1d8', damageType: 'Slashing', properties: '', range: '', ac: 14, hpRecovery: '', desc: '', imageUrl: '', quantity: 1 });
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
        
        // Generate a new ID for the player's copy so the original stays in the vault securely
        const itemCopy = { ...item, id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
        const newInv = [...invArray, itemCopy];
        
        await updateDoc(playerRef, { inventory: newInv });
        
        setDialog({ isOpen: true, title: 'Item Sent', message: `${item.name} has been mysteriously placed in their backpack. The original remains in your Vault.`, type: 'alert' });
      }
    } catch (err) {
      console.error(err);
      setDialog({ isOpen: true, title: 'Error', message: 'Failed to send item.', type: 'alert' });
    }
  };

  const sendToAllPlayers = async (item) => {
    const validPlayers = activePlayers?.filter(id => playerMap[id]) || [];
    
    if (validPlayers.length === 0) {
      setDialog({ isOpen: true, title: 'No Players', message: 'There are no active players in the session.', type: 'alert' });
      return;
    }

    setDialog({
      title: 'Grant to All Party Members?',
      message: `This will place a copy of ${item.name} into the inventory of every active player. The original will remain in your vault.`,
      type: 'confirm',
      onConfirm: async () => {
        try {
          const batch = writeBatch(db);
          
          for (const playerId of validPlayers) {
            const pRef = doc(db, 'characters', playerId);
            const pSnap = await getDoc(pRef);
            if (pSnap.exists()) {
              const currentInv = pSnap.data().inventory || [];
              const invArray = Array.isArray(currentInv) ? currentInv : [];
              
              const itemCopy = { ...item, id: `item_${Date.now()}_${playerId}_${Math.random().toString(36).substr(2, 5)}` };
              batch.update(pRef, { inventory: [...invArray, itemCopy] });
            }
          }
          
          await batch.commit();
          closeDialog();
          setTimeout(() => {
            setDialog({ isOpen: true, title: 'Mass Grant Complete', message: `All ${validPlayers.length} players received a copy of the item.`, type: 'alert' });
          }, 300);
        } catch(e) {
          console.error(e);
          setDialog({ isOpen: true, title: 'Error', message: 'Failed to grant to all players.', type: 'alert' });
        }
      },
      onCancel: closeDialog
    });
  };

  const removeStashedItem = (id) => saveStashToDb(stashedItems.filter(i => i.id !== id));

  const displayedStash = stashedItems.filter(item => 
    item.name.toLowerCase().includes(stashSearch.toLowerCase()) || 
    item.category.toLowerCase().includes(stashSearch.toLowerCase())
  );

  return (
    <>
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} onCancel={closeDialog} />

      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md h-[100dvh] overflow-hidden animate-in fade-in duration-300">
        <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl w-full max-w-5xl shadow-[12px_12px_0px_rgba(0,0,0,1)] flex flex-col max-h-[90dvh] animate-in zoom-in-95 duration-500 relative overflow-hidden">
          
          {/* Solid Color Header */}
          <div className="p-4 border-b-[3px] border-slate-950 flex justify-between items-center bg-emerald-500 rounded-t-xl shrink-0 relative z-10">
            <h2 className="text-xl font-black text-slate-950 flex items-center gap-2 uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,0.3)]">
              <PackagePlus className="w-6 h-6" /> DM Item Vault
            </h2>
            <button onClick={onClose} className="text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors p-2 rounded-xl border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">
              <X className="w-5 h-5 font-black" />
            </button>
          </div>

          <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 bg-slate-950 relative z-10">
            
            {/* LEFT: Unified Item Forge */}
            <div className="space-y-6">
              <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl p-5 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
                <h3 className="font-black text-emerald-400 border-b-2 border-slate-950 pb-3 mb-5 flex items-center gap-2 uppercase tracking-widest text-sm drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                  <Hammer className="w-5 h-5 text-emerald-500" /> 1. Forge Artifact
                </h3>
                
                <form onSubmit={handleForgeItem} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <Search className="w-3 h-3"/> SRD Search
                      </label>
                      <input 
                        type="text" 
                        value={newItem.name} 
                        onChange={handleItemNameChange} 
                        required 
                        className="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-3 py-3 text-white font-bold text-sm focus:outline-none focus:border-emerald-500 shadow-inner" 
                        placeholder="e.g. Longsword or Potion" 
                      />
                      
                      {showEquipDropdown && filteredEquip.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 max-h-48 overflow-y-auto custom-scrollbar bg-slate-900 border-2 border-slate-950 rounded-xl shadow-[6px_6px_0px_rgba(0,0,0,1)] z-50">
                          {filteredEquip.map(item => (
                            <div 
                              key={item.url || item.index} 
                              onClick={() => handleSelectSrdItem(item.url || item.index)} 
                              className="px-3 py-2.5 text-sm font-bold text-slate-300 hover:bg-emerald-500 hover:text-slate-950 cursor-pointer border-b-2 border-slate-950 last:border-0 transition-colors"
                            >
                              {item.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Category</label>
                      <select 
                        value={newItem.category} 
                        onChange={e => setNewItem({...newItem, category: e.target.value})} 
                        className="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-3 py-3 text-white font-bold text-sm focus:outline-none focus:border-emerald-500 shadow-inner"
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
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950 p-4 rounded-xl border-2 border-slate-900 shadow-inner">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5"><Sword className="w-3 h-3 inline"/> Damage</label>
                        <input 
                          type="text" 
                          value={newItem.damageDice} 
                          onChange={e => setNewItem({...newItem, damageDice: e.target.value})} 
                          className="w-full bg-slate-900 border-2 border-slate-800 rounded-lg px-3 py-2 text-white font-bold text-xs focus:outline-none focus:border-emerald-500" 
                          placeholder="1d8" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Type</label>
                        <input 
                          type="text" 
                          value={newItem.damageType} 
                          onChange={e => setNewItem({...newItem, damageType: e.target.value})} 
                          className="w-full bg-slate-900 border-2 border-slate-800 rounded-lg px-3 py-2 text-white font-bold text-xs focus:outline-none focus:border-emerald-500" 
                          placeholder="Slashing" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5"><Crosshair className="w-3 h-3 inline"/> Range</label>
                        <input 
                          type="text" 
                          value={newItem.range || ''} 
                          onChange={e => setNewItem({...newItem, range: e.target.value})} 
                          className="w-full bg-slate-900 border-2 border-slate-800 rounded-lg px-3 py-2 text-white font-bold text-xs focus:outline-none focus:border-emerald-500" 
                          placeholder="5 ft" 
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Properties</label>
                        <input 
                          type="text" 
                          value={newItem.properties} 
                          onChange={e => setNewItem({...newItem, properties: e.target.value})} 
                          className="w-full bg-slate-900 border-2 border-slate-800 rounded-lg px-3 py-2 text-white font-bold text-xs focus:outline-none focus:border-emerald-500" 
                          placeholder="Finesse, Light" 
                        />
                      </div>
                    </div>
                  )}

                  {newItem.category === 'Armor' && (
                    <div className="bg-slate-950 p-4 rounded-xl border-2 border-slate-900 shadow-inner">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5"><Shield className="w-3 h-3 inline"/> Armor Class (AC)</label>
                      <input 
                        type="number" 
                        value={newItem.ac} 
                        onChange={e => setNewItem({...newItem, ac: e.target.value})} 
                        className="w-full bg-slate-900 border-2 border-slate-800 rounded-lg px-3 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-emerald-500" 
                      />
                    </div>
                  )}

                  {(newItem.category === 'Consumable' || newItem.category === 'Potion') && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">HP Recovery (Dice or Flat Value)</label>
                      <input 
                        type="text" 
                        value={newItem.hpRecovery} 
                        onChange={e => setNewItem({...newItem, hpRecovery: e.target.value})} 
                        className="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-3 py-3 text-white font-bold text-sm focus:outline-none focus:border-emerald-500 shadow-inner" 
                        placeholder="e.g. 2d4+2 or 10" 
                      />
                    </div>
                  )}

                  <div>
                    <label className="flex items-center gap-1 block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                      <ImageIcon className="w-4 h-4" /> Image URL (Optional)
                    </label>
                    <input 
                      type="url" 
                      value={newItem.imageUrl} 
                      onChange={e => setNewItem({...newItem, imageUrl: e.target.value})} 
                      className="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-3 py-3 text-white font-bold text-sm focus:outline-none focus:border-emerald-500 shadow-inner" 
                      placeholder="https://..." 
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="w-24">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Qty</label>
                      <input 
                        type="number" 
                        value={newItem.quantity} 
                        onChange={e => setNewItem({...newItem, quantity: e.target.value})} 
                        className="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-2 py-3 text-center text-white font-bold text-sm focus:outline-none focus:border-emerald-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" 
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Description</label>
                      <input 
                        type="text" 
                        value={newItem.desc} 
                        onChange={e => setNewItem({...newItem, desc: e.target.value})} 
                        className="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-3 py-3 text-white font-bold text-sm focus:outline-none focus:border-emerald-500 shadow-inner" 
                        placeholder="Short description..." 
                      />
                    </div>
                  </div>
                  
                  <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-widest text-xs py-4 rounded-xl flex justify-center items-center gap-2 transition-all border-2 border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none mt-2">
                    <Plus className="w-4 h-4 font-black"/> Store in Vault
                  </button>
                </form>
              </div>
            </div>

            {/* RIGHT: The Stash & Assignment */}
            <div className="space-y-5 lg:border-l-[3px] lg:border-slate-900 lg:pl-8 flex flex-col">
              <h3 className="font-black text-white border-b-[3px] border-slate-900 pb-3 flex items-center justify-between uppercase tracking-widest text-lg drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                <span className="flex items-center gap-2"><Backpack className="w-6 h-6 text-emerald-500" /> 2. Your Vault</span>
              </h3>
              
              {/* Single Player Assignment & Search Block */}
              <div className="flex flex-col gap-3 shrink-0">
                <div className="bg-slate-900 p-3 rounded-xl border-[3px] border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] flex gap-2">
                  <select value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)} className="flex-1 bg-slate-950 text-white font-bold border-2 border-slate-900 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500 shadow-inner">
                    <option value="">-- Target Player --</option>
                    {activePlayers?.filter(id => playerMap[id]).map(id => (
                      <option key={id} value={id}>{playerMap[id]}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border-[3px] border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-500 ml-2" />
                  <input 
                    type="text" 
                    value={stashSearch}
                    onChange={e => setStashSearch(e.target.value)}
                    placeholder="Search vault items..."
                    className="flex-1 bg-transparent text-white font-bold text-sm focus:outline-none placeholder:text-slate-500"
                  />
                </div>
              </div>

              {displayedStash.length === 0 ? (
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest bg-slate-900 p-8 rounded-2xl border-2 border-slate-950 border-dashed text-center shadow-inner mt-4">
                  {stashedItems.length === 0 ? "Your vault is empty. Forge items to store them here." : "No items match your search."}
                </p>
              ) : (
                <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-[400px]">
                  {displayedStash.map((item) => (
                    <div key={item.id} className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl p-5 shadow-[6px_6px_0px_rgba(0,0,0,1)] relative group hover:border-emerald-500 transition-colors">
                      <button onClick={() => removeStashedItem(item.id)} className="absolute top-3 right-3 text-slate-950 bg-slate-500 hover:bg-red-500 hover:text-white transition-colors p-1.5 rounded-lg z-10 border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"><X className="w-4 h-4 font-black" /></button>
                      
                      <div className="flex gap-4 mb-4 pr-10">
                        {item.imageUrl && (
                          <div className="w-16 h-16 shrink-0 rounded-xl bg-slate-950 border-2 border-slate-900 overflow-hidden shadow-inner">
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-black text-white text-lg leading-none mb-2 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">{item.quantity}x {item.name}</h4>
                          <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-black block">{item.category}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-5">
                        {item.damageDice && <span className="bg-slate-950 border-2 border-slate-900 text-slate-300 font-black text-[10px] px-2 py-1 rounded-md shadow-inner uppercase tracking-widest">Dmg: {item.damageDice}</span>}
                        {item.range && <span className="bg-slate-950 border-2 border-slate-900 text-slate-300 font-black text-[10px] px-2 py-1 rounded-md shadow-inner uppercase tracking-widest">Rng: {item.range}</span>}
                        {item.ac && <span className="bg-slate-950 border-2 border-slate-900 text-slate-300 font-black text-[10px] px-2 py-1 rounded-md shadow-inner uppercase tracking-widest">AC: {item.ac}</span>}
                        {item.hpRecovery && <span className="bg-slate-950 border-2 border-slate-900 text-emerald-400 font-black text-[10px] px-2 py-1 rounded-md shadow-inner uppercase tracking-widest">Heal: {item.hpRecovery}</span>}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={() => sendToPlayer(item)} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">
                          <Send className="w-4 h-4 font-black" /> Grant
                        </button>
                        <button onClick={() => sendToAllPlayers(item)} className="flex-1 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-[10px] uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">
                          <Users className="w-4 h-4 font-black" /> Grant All
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