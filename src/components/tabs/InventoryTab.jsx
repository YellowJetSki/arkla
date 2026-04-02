import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, runTransaction, writeBatch } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Backpack, Coins, Search, Hammer, Plus, Minus, Send, ChevronDown, ChevronUp, Trash2, Sword, Utensils, Crosshair, Image as ImageIcon, Filter } from 'lucide-react';
import { fetchAllEquipment, fetchEquipmentDetails } from '../../services/srdApi';

const INVENTORY_FILTERS = ['All', 'Weapon', 'Armor', 'Consumable', 'Potion', 'Adventuring Gear', 'Wondrous Item'];

export default function InventoryTab({ char, charId, isDM, updateField, activeTheme, showDialog }) {
  const [isForgingItem, setIsForgingItem] = useState(false);
  const [openItems, setOpenItems] = useState({}); 
  const [activeFilter, setActiveFilter] = useState('All');
  
  const [customItem, setCustomItem] = useState({ 
    name: '', category: 'Wondrous Item', damageDice: '1d8', damageType: 'Slashing', properties: '', range: '', ac: 14, hpRecovery: '', desc: '', imageUrl: '' 
  });
  
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionType, setTransactionType] = useState('assarions'); 

  const [isEditingGold, setIsEditingGold] = useState(false);
  const [displayGold, setDisplayGold] = useState("");
  const [isEditingSilver, setIsEditingSilver] = useState(false);
  const [displaySilver, setDisplaySilver] = useState("");
  const [isEditingCopper, setIsEditingCopper] = useState(false);
  const [displayCopper, setDisplayCopper] = useState("");

  const [srdEquipmentList, setSrdEquipmentList] = useState([]);
  const [filteredEquip, setFilteredEquip] = useState([]);
  const [showEquipDropdown, setShowEquipDropdown] = useState(false);

  useEffect(() => {
    fetchAllEquipment().then(setSrdEquipmentList);
  }, []);

  const inventoryArray = Array.isArray(char.inventory) ? char.inventory : [];
  const filteredInventoryArray = inventoryArray.filter(item => activeFilter === 'All' || item.category === activeFilter);

  const runInventoryTransaction = async (mutationFn) => {
    try {
      await runTransaction(db, async (transaction) => {
        const charRef = doc(db, 'characters', charId);
        const sfDoc = await transaction.get(charRef);
        if (!sfDoc.exists()) return;
        const currentInv = sfDoc.data().inventory || [];
        const updatedInv = mutationFn([...currentInv]);
        transaction.update(charRef, { inventory: updatedInv });
      });
    } catch(e) {
      console.error("Inventory transaction failed", e);
    }
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setCustomItem(prev => ({ ...prev, name: val }));
    
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
      setCustomItem(prev => ({
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

  const handleForgeCustomItem = async (e) => {
    e.preventDefault();
    if (!customItem.name) return;
    
    const newItem = {
       id: `item_${Date.now()}`,
       name: customItem.name,
       category: customItem.category,
       desc: customItem.desc,
       imageUrl: customItem.imageUrl || '',
       quantity: 1,
       damageDice: customItem.category === 'Weapon' ? customItem.damageDice : null,
       damageType: customItem.category === 'Weapon' ? customItem.damageType : null,
       properties: customItem.category === 'Weapon' ? customItem.properties : null,
       range: customItem.category === 'Weapon' ? customItem.range : null,
       ac: customItem.category === 'Armor' ? Number(customItem.ac) : null,
       hpRecovery: customItem.category === 'Consumable' || customItem.category === 'Potion' ? customItem.hpRecovery : null
    };
    
    await runInventoryTransaction((inv) => {
      return [...inv, newItem];
    });
    
    setCustomItem({ name: '', category: 'Wondrous Item', damageDice: '1d8', damageType: 'Slashing', properties: '', range: '', ac: 14, hpRecovery: '', desc: '', imageUrl: '' });
    setIsForgingItem(false);
  };

  const updateQuantity = async (idx, delta) => {
    const item = filteredInventoryArray[idx];
    const realIndex = inventoryArray.findIndex(i => 
      (i.id && i.id === item.id) || (!i.id && i.name === item.name && i.desc === item.desc)
    );
    if (realIndex === -1) return;

    await runInventoryTransaction((inv) => {
      if (!inv[realIndex]) return inv;
      inv[realIndex].quantity += delta;
      if (inv[realIndex].quantity <= 0) {
        inv.splice(realIndex, 1);
      }
      return inv;
    });
  };

  const deleteItem = async (idx) => {
    const item = filteredInventoryArray[idx];
    const realIndex = inventoryArray.findIndex(i => 
      (i.id && i.id === item.id) || (!i.id && i.name === item.name && i.desc === item.desc)
    );
    if (realIndex === -1) return;

    await runInventoryTransaction((inv) => {
      if (!inv[realIndex]) return inv;
      inv.splice(realIndex, 1);
      return inv;
    });
  };

  const promptDelete = (item, idx) => {
    showDialog({
      title: 'Delete Item?',
      message: `Are you sure you want to permanently remove ${item.name} from your inventory?`,
      type: 'confirm',
      onConfirm: async () => {
        await deleteItem(idx);
        showDialog({ isOpen: false });
      },
      onCancel: () => showDialog({ isOpen: false })
    });
  };

  const handleConsume = (item, idx) => {
    const realIndex = inventoryArray.findIndex(i => 
      (i.id && i.id === item.id) || (!i.id && i.name === item.name && i.desc === item.desc)
    );
    if (realIndex === -1) return;

    const isDice = (item.hpRecovery || '').includes('d');
    const promptMsg = isDice 
      ? `Roll your ${item.hpRecovery} and enter the total HP regained below. This will consume 1x ${item.name}.`
      : `You will regain ${item.hpRecovery || '0'} HP. This will consume 1x ${item.name}. Proceed?`;

    showDialog({
      title: `Consume ${item.name}?`,
      message: promptMsg,
      type: isDice ? 'prompt' : 'confirm',
      inputPlaceholder: "Total HP...",
      onConfirm: async (val) => {
        const healAmount = isDice ? parseInt(val, 10) : parseInt(item.hpRecovery, 10) || 0;
        if (isNaN(healAmount) || healAmount <= 0) {
          showDialog({ isOpen: false }); 
          return; 
        }

        // 1. Remove the item from inventory
        await runInventoryTransaction((inv) => {
          if (!inv[realIndex]) return inv;
          inv[realIndex].quantity -= 1;
          if (inv[realIndex].quantity <= 0) {
             inv.splice(realIndex, 1);
          }
          return inv;
        });

        // 2. Dual-Sync the HP to both the Character Sheet and the Battlemap
        try {
          const batch = writeBatch(db);
          const charRef = doc(db, 'characters', charId);
          const mapRef = doc(db, 'campaign', 'battlemap');

          const charSnap = await getDoc(charRef);
          if (charSnap.exists()) {
            const currentHp = charSnap.data().hp || 0;
            const maxHp = charSnap.data().maxHp || 10;
            const newHp = Math.min(maxHp, currentHp + healAmount);

            batch.update(charRef, { hp: newHp });

            const mapSnap = await getDoc(mapRef);
            if (mapSnap.exists() && mapSnap.data().tokens && mapSnap.data().tokens[charId]) {
              batch.update(mapRef, { [`tokens.${charId}.hp`]: newHp });
            }

            await batch.commit();
          }
        } catch (error) {
          console.error("Failed to sync consumable HP to map:", error);
        }

        showDialog({ isOpen: false });
      },
      onCancel: () => showDialog({ isOpen: false })
    });
  };

  const adjustCurrency = async (type, amount) => {
    if (!charId) return;
    const charRef = doc(db, 'characters', charId);
    try {
      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(charRef);
        if (!sfDoc.exists()) return;
        const current = sfDoc.data().currency?.[type] || 0;
        transaction.update(charRef, { [`currency.${type}`]: Math.max(0, current + amount) });
      });
    } catch (err) { console.error(err); }
  };

  const handleTransaction = async (isAdding) => {
    const amount = parseInt(transactionAmount, 10);
    if (isNaN(amount) || amount <= 0 || !charId) return;
    
    const charRef = doc(db, 'characters', charId);

    try {
      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(charRef);
        if (!sfDoc.exists()) return;
        const data = sfDoc.data();
        const currency = data.currency || { assarions: 0, quadrans: 0, leptons: 0 };

        if (isAdding) {
          const current = currency[transactionType] || 0;
          transaction.update(charRef, { [`currency.${transactionType}`]: current + amount });
        } else {
          let currentCoin = currency[transactionType] || 0;

          if (currentCoin >= amount) {
            transaction.update(charRef, { [`currency.${transactionType}`]: currentCoin - amount });
          } else {
             return Promise.reject("Not enough funds");
          }
        }
      });
      setTransactionAmount('');
    } catch (error) {
       if (error === "Not enough funds") {
         showDialog({ title: 'Insufficient Funds', message: `You do not have enough ${transactionType}.`, type: 'alert', onConfirm: () => showDialog({ isOpen: false }) });
       }
    }
  };

  const toggleItemOpen = (idx) => setOpenItems(prev => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-5 shadow-xl relative overflow-hidden h-fit">
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-700/10 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-4 relative z-10">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><Backpack className={`w-5 h-5 ${activeTheme.text}`} /> Equipment</h3>
          {isDM && (
            <button onClick={() => setIsForgingItem(!isForgingItem)} className={`text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border shadow-sm ${isForgingItem ? 'bg-indigo-700 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' : `bg-slate-800/80 border-slate-700 ${activeTheme.text} hover:bg-slate-700`}`}>
              <Hammer className="w-3 h-3" /> {isForgingItem ? 'Close Forge' : 'Add Item'}
            </button>
          )}
        </div>

        {inventoryArray.length > 0 && (
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-3 mb-2 relative z-10">
            <Filter className="w-4 h-4 text-slate-500 shrink-0 my-auto mr-2" />
            {INVENTORY_FILTERS.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border shadow-sm ${activeFilter === filter ? `${activeTheme.bg} text-white ${activeTheme.activeBorder} shadow-[0_0_10px_rgba(255,255,255,0.1)]` : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white'}`}
              >
                {filter}
              </button>
            ))}
          </div>
        )}
        
        {isDM && isForgingItem && (
          <form onSubmit={handleForgeCustomItem} className="bg-slate-900/80 backdrop-blur-sm p-5 rounded-2xl border border-indigo-500/30 mb-6 animate-in fade-in slide-in-from-top-2 space-y-4 shadow-inner relative z-10">
            <h4 className="text-sm font-black text-indigo-400 flex items-center gap-2 uppercase tracking-widest border-b border-indigo-900/50 pb-2"><Hammer className="w-4 h-4" /> Inject Item</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Search className="w-3 h-3" /> Item Name (SRD Search)
                </label>
                <input 
                  type="text" 
                  required 
                  value={customItem.name} 
                  onChange={handleNameChange} 
                  className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 shadow-inner" 
                  placeholder="e.g. Ring of Fire or Longsword" 
                />
                
                {showEquipDropdown && filteredEquip.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto custom-scrollbar bg-slate-900 border border-slate-600 rounded-lg shadow-2xl z-50">
                    {filteredEquip.map(item => (
                      <div 
                        key={item.url || item.index} 
                        onClick={() => handleSelectSrdItem(item.url || item.index)} 
                        className="px-3 py-2.5 text-sm text-slate-300 hover:bg-indigo-600 hover:text-white cursor-pointer border-b border-slate-800 last:border-0 transition-colors"
                      >
                        {item.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                <select value={customItem.category} onChange={e => setCustomItem({...customItem, category: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 shadow-inner">
                  <option value="Wondrous Item">Wondrous Item</option>
                  <option value="Weapon">Weapon</option>
                  <option value="Armor">Armor</option>
                  <option value="Consumable">Consumable</option>
                  <option value="Potion">Potion</option>
                  <option value="Adventuring Gear">Adventuring Gear</option>
                </select>
              </div>

              {customItem.category === 'Weapon' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 sm:col-span-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1"><Sword className="w-3 h-3 inline"/> Damage</label>
                    <input type="text" value={customItem.damageDice} onChange={e => setCustomItem({...customItem, damageDice: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-white text-xs focus:outline-none" placeholder="1d8" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type</label>
                    <input type="text" value={customItem.damageType} onChange={e => setCustomItem({...customItem, damageType: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-white text-xs focus:outline-none" placeholder="Slashing" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1"><Crosshair className="w-3 h-3 inline"/> Range</label>
                    <input type="text" value={customItem.range || ''} onChange={e => setCustomItem({...customItem, range: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-white text-xs focus:outline-none" placeholder="5 ft" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Properties</label>
                    <input type="text" value={customItem.properties} onChange={e => setCustomItem({...customItem, properties: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-white text-xs focus:outline-none" placeholder="Finesse, Light" />
                  </div>
                </div>
              )}

              {(customItem.category === 'Consumable' || customItem.category === 'Potion') && (
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">HP Recovery (Dice or Flat Value)</label>
                  <input type="text" value={customItem.hpRecovery} onChange={e => setCustomItem({...customItem, hpRecovery: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 shadow-inner" placeholder="e.g. 2d4+2 or 10" />
                </div>
              )}

              {customItem.category === 'Armor' && (
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Base AC</label>
                  <input type="number" required value={customItem.ac} onChange={e => setCustomItem({...customItem, ac: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 shadow-inner" placeholder="e.g. 14" />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="flex items-center gap-1 block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1"><ImageIcon className="w-3 h-3" /> Image URL (Optional)</label>
                <input type="url" value={customItem.imageUrl} onChange={e => setCustomItem({...customItem, imageUrl: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 shadow-inner" placeholder="https://..." />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description & Lore</label>
                <textarea required value={customItem.desc} onChange={e => setCustomItem({...customItem, desc: e.target.value})} className="w-full min-h-[80px] bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-indigo-500 resize-y shadow-inner leading-relaxed" placeholder="Notes..." />
              </div>
            </div>
            
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] flex items-center justify-center gap-2 mt-2">
              <Plus className="w-4 h-4" /> Inject into Bags
            </button>
          </form>
        )}

        <div className="space-y-4 relative z-10">
          {filteredInventoryArray.length === 0 ? (
             <p className="text-slate-500 italic p-6 text-center bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">No items found.</p>
          ) : (
            filteredInventoryArray.map((item, i) => (
              <div key={item.id || i} className={`bg-slate-900/80 backdrop-blur-sm border rounded-xl overflow-hidden transition-colors shadow-sm ${openItems[i] ? `${activeTheme.activeBorder} shadow-[0_0_15px_rgba(255,255,255,0.05)]` : 'border-slate-700/80 hover:border-slate-500'}`}>
                <div className="flex justify-between items-center p-3 sm:p-4 cursor-pointer" onClick={() => toggleItemOpen(i)}>
                  
                  <div className="flex items-center gap-3">
                    {isDM ? (
                      <div className="flex flex-col items-center bg-slate-950 border border-slate-700 rounded-lg overflow-hidden shrink-0">
                         <button onClick={(e) => { e.stopPropagation(); updateQuantity(i, 1); }} className="bg-slate-800 hover:bg-slate-700 text-slate-400 px-2 py-0.5"><Plus className="w-3 h-3"/></button>
                         <span className="text-xs font-black text-white py-1">{item.quantity}</span>
                         <button onClick={(e) => { e.stopPropagation(); updateQuantity(i, -1); }} className="bg-slate-800 hover:bg-slate-700 text-slate-400 px-2 py-0.5"><Minus className="w-3 h-3"/></button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center bg-slate-950 border border-slate-700 rounded-lg overflow-hidden shrink-0 px-3 py-1.5">
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">QTY</span>
                         <span className="text-sm font-black text-white">{item.quantity}</span>
                      </div>
                    )}
                    <div>
                      <span className={`font-black text-sm md:text-base block ${openItems[i] ? activeTheme.text : 'text-slate-200'}`}>{item.name}</span>
                      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{item.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); promptDelete(item, i); }} className="bg-slate-800 border border-slate-700 p-2 rounded-lg hover:bg-red-600 hover:text-white transition-colors text-slate-400 shadow-sm" title="Delete Item">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="text-slate-500 bg-slate-950 p-1 rounded border border-slate-800 ml-1">
                      {openItems[i] ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                    </div>
                  </div>
                </div>

                {openItems[i] && (
                  <div className="p-4 pt-0 border-t border-slate-800/50 text-sm text-slate-300 animate-in slide-in-from-top-1 fade-in bg-slate-950/30">
                    <div className="flex flex-col sm:flex-row gap-4 mt-3">
                      {item.imageUrl && (
                        <div className="w-full sm:w-32 h-32 shrink-0 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 cursor-pointer group" onClick={(e) => { e.stopPropagation(); showDialog({ title: item.name, message: <img src={item.imageUrl} alt={item.name} className="max-h-[60vh] object-contain rounded-lg border border-slate-700 w-full" />, type: 'alert', onConfirm: () => showDialog({ isOpen: false }) }); }}>
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                        </div>
                      )}
                      <div className="flex-1">
                        {item.category === 'Weapon' && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="text-[10px] uppercase tracking-widest font-bold bg-slate-800 px-2 py-1 rounded text-slate-300 shadow-inner">Damage: <span className="text-white">{item.damageDice || (item.damage?.damage_dice)} {item.damageType || (item.damage?.damage_type?.name)}</span></span>
                            {item.range && <span className="text-[10px] uppercase tracking-widest font-bold bg-slate-800 px-2 py-1 rounded text-slate-300 shadow-inner">Range: <span className="text-white">{item.range}</span></span>}
                            {(item.properties && Array.isArray(item.properties) && item.properties.length > 0) && <span className="text-[10px] uppercase tracking-widest font-bold bg-slate-800 px-2 py-1 rounded text-slate-300 shadow-inner">Props: <span className="text-white">{item.properties.map(p => p.name).join(', ')}</span></span>}
                            {(item.properties && typeof item.properties === 'string') && <span className="text-[10px] uppercase tracking-widest font-bold bg-slate-800 px-2 py-1 rounded text-slate-300 shadow-inner">Props: <span className="text-white">{item.properties}</span></span>}
                          </div>
                        )}
                        {item.category === 'Armor' && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="text-[10px] uppercase tracking-widest font-bold bg-slate-800 px-2 py-1 rounded text-slate-300 shadow-inner">AC: <span className="text-white">{item.ac || item.armor_class?.base}</span></span>
                          </div>
                        )}
                        <p className="whitespace-pre-wrap leading-relaxed">{typeof item.desc === 'string' ? item.desc : (item.desc || []).join('\n')}</p>
                        
                        {!isDM && (item.hpRecovery || item.category === 'Consumable' || item.category === 'Potion') && (
                          <button onClick={() => handleConsume(item, i)} className="mt-4 bg-emerald-900/40 border border-emerald-500/50 hover:bg-emerald-600 text-emerald-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm">
                            <Utensils className="w-3 h-3" /> Consume
                          </button>
                        )}
                        
                        {item.category === 'Weapon' && (
                          <div className="flex items-center gap-1.5 mt-4">
                             <Sword className="w-3 h-3 text-slate-500" />
                             <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Automatically available in Combat Tab</span>
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-5 h-fit flex flex-col shadow-xl">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4"><Coins className="w-5 h-5 text-yellow-400" /> Wallet</h3>
        
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-600 mb-5 flex flex-col gap-3 shadow-inner">
          <div className="flex gap-2">
            <input 
              type="number" 
              value={transactionAmount}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setTransactionAmount(e.target.value)}
              placeholder="Amount..." 
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-black focus:outline-none focus:border-yellow-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <div className="flex flex-col gap-1.5 shrink-0">
              <button onClick={() => handleTransaction(true)} disabled={!transactionAmount} className="bg-emerald-900/40 hover:bg-emerald-600 disabled:opacity-50 text-emerald-400 hover:text-white border border-emerald-900/50 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm">+ Loot</button>
              <button onClick={() => handleTransaction(false)} disabled={!transactionAmount} className="bg-red-900/40 hover:bg-red-600 disabled:opacity-50 text-red-400 hover:text-white border border-red-900/50 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm">- Pay</button>
            </div>
          </div>
          
          <div className="flex gap-2">
             {[1, 5, 10, 50].map(val => (
               <button key={val} onClick={() => setTransactionAmount(val.toString())} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 rounded py-1.5 text-xs font-bold transition-colors shadow-sm">
                 {val}
               </button>
             ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900 p-4 rounded-xl border border-yellow-900/30 shadow-sm">
            <span className="text-yellow-500/50 text-[10px] font-black uppercase tracking-widest block mb-2 text-center">Assarions</span>
            <div className="flex items-center justify-between gap-3">
              <button onClick={() => adjustCurrency('assarions', -1)} className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center border border-slate-600 transition-colors shadow-sm"><Minus className="w-5 h-5" /></button>
              <input 
                type="number" 
                value={isEditingGold ? displayGold : (char.currency?.assarions || 0)} 
                onFocus={(e) => { setDisplayGold(char.currency?.assarions || 0); setIsEditingGold(true); e.target.select(); }}
                onChange={(e) => setDisplayGold(e.target.value)}
                onBlur={() => { setIsEditingGold(false); updateField('currency.assarions', Number(displayGold)); }}
                onKeyDown={(e) => { if(e.key === 'Enter') e.target.blur(); }}
                className="w-20 bg-transparent text-yellow-400 font-black text-3xl text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
              />
              <button onClick={() => adjustCurrency('assarions', 1)} className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center border border-slate-600 transition-colors shadow-sm"><Plus className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-sm">
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest block mb-2 text-center">Quadrans</span>
            <div className="flex items-center justify-between gap-3">
              <button onClick={() => adjustCurrency('quadrans', -1)} className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center border border-slate-600 transition-colors shadow-sm"><Minus className="w-5 h-5" /></button>
              <input 
                type="number" 
                value={isEditingSilver ? displaySilver : (char.currency?.quadrans || 0)} 
                onFocus={(e) => { setDisplaySilver(char.currency?.quadrans || 0); setIsEditingSilver(true); e.target.select(); }}
                onChange={(e) => setDisplaySilver(e.target.value)}
                onBlur={() => { setIsEditingSilver(false); updateField('currency.quadrans', Number(displaySilver)); }}
                onKeyDown={(e) => { if(e.key === 'Enter') e.target.blur(); }}
                className="w-20 bg-transparent text-slate-300 font-black text-2xl text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
              />
              <button onClick={() => adjustCurrency('quadrans', 1)} className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center border border-slate-600 transition-colors shadow-sm"><Plus className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-amber-900/30 shadow-sm">
            <span className="text-amber-700 text-[10px] font-black uppercase tracking-widest block mb-2 text-center">Leptons</span>
            <div className="flex items-center justify-between gap-3">
              <button onClick={() => adjustCurrency('leptons', -1)} className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center border border-slate-600 transition-colors shadow-sm"><Minus className="w-5 h-5" /></button>
              <input 
                type="number" 
                value={isEditingCopper ? displayCopper : (char.currency?.leptons || 0)} 
                onFocus={(e) => { setDisplayCopper(char.currency?.leptons || 0); setIsEditingCopper(true); e.target.select(); }}
                onChange={(e) => setDisplayCopper(e.target.value)}
                onBlur={() => { setIsEditingCopper(false); updateField('currency.leptons', Number(displayCopper)); }}
                onKeyDown={(e) => { if(e.key === 'Enter') e.target.blur(); }}
                className="w-20 bg-transparent text-amber-600 font-black text-2xl text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
              />
              <button onClick={() => adjustCurrency('leptons', 1)} className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center border border-slate-600 transition-colors shadow-sm"><Plus className="w-5 h-5" /></button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}