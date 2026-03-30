import { useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, runTransaction } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Backpack, Coins, Search, Hammer, Plus, Minus, Send, ChevronDown, ChevronUp, Trash2, Sword, Image as ImageIcon } from 'lucide-react';

export default function InventoryTab({ char, charId, isDM, updateField, activeTheme, showDialog }) {
  const [isForgingItem, setIsForgingItem] = useState(false);
  const [openItems, setOpenItems] = useState({}); 
  
  const [customItem, setCustomItem] = useState({ 
    name: '', category: 'Wondrous Item', damageDice: '1d8', damageType: 'Slashing', properties: '', ac: 14, desc: '', imageUrl: '' 
  });
  
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionType, setTransactionType] = useState('assarions'); 

  // Premium input states
  const [isEditingGold, setIsEditingGold] = useState(false);
  const [displayGold, setDisplayGold] = useState("");
  const [isEditingSilver, setIsEditingSilver] = useState(false);
  const [displaySilver, setDisplaySilver] = useState("");
  const [isEditingCopper, setIsEditingCopper] = useState(false);
  const [displayCopper, setDisplayCopper] = useState("");

  const inventoryArray = Array.isArray(char.inventory) ? char.inventory : [];

  const handleForgeCustomItem = async (e) => {
    e.preventDefault();
    if (!customItem.name) return;
    
    const newItem = {
       id: `item_${Date.now()}`,
       name: customItem.name,
       category: customItem.category,
       desc: customItem.desc,
       imageUrl: customItem.imageUrl,
       quantity: 1,
       damageDice: customItem.category === 'Weapon' ? customItem.damageDice : null,
       damageType: customItem.category === 'Weapon' ? customItem.damageType : null,
       properties: customItem.category === 'Weapon' ? customItem.properties : null,
       ac: customItem.category === 'Armor' ? Number(customItem.ac) : null
    };
    
    const newInventory = [...inventoryArray, newItem];
    await updateField('inventory', newInventory);
    
    setCustomItem({ name: '', category: 'Wondrous Item', damageDice: '1d8', damageType: 'Slashing', properties: '', ac: 14, desc: '', imageUrl: '' });
    setIsForgingItem(false);
  };

  const updateQuantity = async (idx, delta) => {
    const newInv = [...inventoryArray];
    newInv[idx].quantity += delta;
    if (newInv[idx].quantity <= 0) {
      newInv.splice(idx, 1);
    }
    await updateField('inventory', newInv);
  };

  const equipWeapon = async (item) => {
    const newAttack = {
       name: item.name, 
       hit: '--', 
       damage: item.damageDice || '1d4', 
       type: item.damageType || 'Slashing', 
       notes: item.properties || ''
    };
    try {
      await updateDoc(doc(db, 'characters', charId), { attacks: arrayUnion(newAttack) });
      showDialog({ title: 'Weapon Equipped', message: `${item.name} added to Combat Tab!`, type: 'alert', onConfirm: () => showDialog({ isOpen: false }) });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteItem = async (idx) => {
    const newInv = [...inventoryArray];
    newInv.splice(idx, 1);
    await updateField('inventory', newInv);
  };

  const handleShareToParty = async (item, index) => {
    showDialog({
      title: 'Share with Party?',
      message: `Send ${item.name} to the Shared Party Loot? It will be removed from your personal inventory.`,
      type: 'confirm',
      onConfirm: async () => {
        const newInv = [...inventoryArray];
        newInv.splice(index, 1);
        await updateField('inventory', newInv);

        let descText = `${item.category}\n`;
        if (item.category === 'Weapon') descText += `Damage: ${item.damageDice} ${item.damageType}\n`;
        if (item.category === 'Armor') descText += `AC: ${item.ac}\n`;
        descText += item.desc;

        const newItem = {
          id: `loot_${Date.now()}`,
          name: item.name,
          desc: descText,
          url: item.imageUrl,
          source: char.name
        };
        
        const lootRef = doc(db, 'campaign', 'shared_loot');
        const lootSnap = await getDoc(lootRef);
        let items = [];
        if (lootSnap.exists()) items = lootSnap.data().items || [];
        
        items.push(newItem);
        await setDoc(lootRef, { items, latestShareId: newItem.id }, { merge: true });
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
          const currentGold = currency.assarions || 0;
          const currentSilver = currency.quadrans || 0;
          const currentCopper = currency.leptons || 0;

          let costInCopper = 0;
          if (transactionType === 'assarions') costInCopper = amount * 100;
          if (transactionType === 'quadrans') costInCopper = amount * 10;
          if (transactionType === 'leptons') costInCopper = amount;

          const totalCopper = (currentGold * 100) + (currentSilver * 10) + currentCopper;

          if (totalCopper < costInCopper) {
            return Promise.reject("Not enough funds");
          }

          const remainingCopperTotal = totalCopper - costInCopper;
          transaction.update(charRef, {
            'currency.assarions': Math.floor(remainingCopperTotal / 100),
            'currency.quadrans': Math.floor((remainingCopperTotal % 100) / 10),
            'currency.leptons': remainingCopperTotal % 10
          });
        }
      });
      setTransactionAmount('');
    } catch (error) {
       if (error === "Not enough funds") {
         showDialog({ title: 'Insufficient Funds', message: 'Not enough wealth.', type: 'alert', onConfirm: () => showDialog({ isOpen: false }) });
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
        
        {isDM && isForgingItem && (
          <form onSubmit={handleForgeCustomItem} className="bg-slate-900/80 backdrop-blur-sm p-5 rounded-2xl border border-indigo-500/30 mb-6 animate-in fade-in slide-in-from-top-2 space-y-4 shadow-inner relative z-10">
            <h4 className="text-sm font-black text-indigo-400 flex items-center gap-2 uppercase tracking-widest border-b border-indigo-900/50 pb-2"><Hammer className="w-4 h-4" /> Inject Item</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Item Name</label>
                <input type="text" required value={customItem.name} onChange={e => setCustomItem({...customItem, name: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 shadow-inner" placeholder="e.g. Ring of Fire" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                <select value={customItem.category} onChange={e => setCustomItem({...customItem, category: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 shadow-inner">
                  <option value="Wondrous Item">Wondrous Item</option>
                  <option value="Weapon">Weapon</option>
                  <option value="Armor">Armor</option>
                  <option value="Adventuring Gear">Adventuring Gear</option>
                  <option value="Potion">Potion</option>
                </select>
              </div>

              {customItem.category === 'Weapon' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Damage Dice</label>
                    <input type="text" required value={customItem.damageDice} onChange={e => setCustomItem({...customItem, damageDice: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 shadow-inner" placeholder="e.g. 1d10" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Damage Type</label>
                    <input type="text" required value={customItem.damageType} onChange={e => setCustomItem({...customItem, damageType: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 shadow-inner" placeholder="e.g. Fire" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Properties (Comma Separated)</label>
                    <input type="text" value={customItem.properties} onChange={e => setCustomItem({...customItem, properties: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 shadow-inner" placeholder="e.g. Finesse, Light" />
                  </div>
                </>
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
                <textarea required value={customItem.desc} onChange={e => setCustomItem({...customItem, desc: e.target.value})} className="w-full min-h-[80px] bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-indigo-500 resize-y shadow-inner" placeholder="Notes..." />
              </div>
            </div>
            
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] flex items-center justify-center gap-2 mt-2">
              <Plus className="w-4 h-4" /> Inject into Bags
            </button>
          </form>
        )}

        <div className="space-y-4 relative z-10">
          {inventoryArray.length === 0 ? (
             <p className="text-slate-500 italic p-6 text-center bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">Your bags are empty.</p>
          ) : (
            inventoryArray.map((item, i) => (
              <div key={item.id || i} className={`bg-slate-900/80 backdrop-blur-sm border rounded-xl overflow-hidden transition-colors shadow-sm ${openItems[i] ? `border-${activeTheme.ring} shadow-[0_0_15px_rgba(255,255,255,0.05)]` : 'border-slate-700/80 hover:border-slate-500'}`}>
                <div className="flex justify-between items-center p-3 sm:p-4 cursor-pointer" onClick={() => toggleItemOpen(i)}>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center bg-slate-950 border border-slate-700 rounded-lg overflow-hidden shrink-0">
                       <button onClick={(e) => { e.stopPropagation(); updateQuantity(i, 1); }} className="bg-slate-800 hover:bg-slate-700 text-slate-400 px-2 py-0.5"><Plus className="w-3 h-3"/></button>
                       <span className="text-xs font-black text-white py-1">{item.quantity}</span>
                       <button onClick={(e) => { e.stopPropagation(); updateQuantity(i, -1); }} className="bg-slate-800 hover:bg-slate-700 text-slate-400 px-2 py-0.5"><Minus className="w-3 h-3"/></button>
                    </div>
                    <div>
                      <span className={`font-black text-sm md:text-base block ${openItems[i] ? activeTheme.text : 'text-slate-200'}`}>{item.name}</span>
                      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{item.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleShareToParty(item, i); }}
                      className="bg-slate-800 border border-slate-700 p-2 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors text-slate-400 shadow-sm"
                      title="Share to Party Loot"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                    {isDM && (
                      <button onClick={(e) => { e.stopPropagation(); deleteItem(i); }} className="bg-slate-800 border border-slate-700 p-2 rounded-lg hover:bg-red-600 hover:text-white transition-colors text-slate-400 shadow-sm">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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
                            <span className="text-[10px] uppercase tracking-widest font-bold bg-slate-800 px-2 py-1 rounded text-slate-300 shadow-inner">Damage: <span className="text-white">{item.damageDice} {item.damageType}</span></span>
                            {item.properties && <span className="text-[10px] uppercase tracking-widest font-bold bg-slate-800 px-2 py-1 rounded text-slate-300 shadow-inner">Props: <span className="text-white">{item.properties}</span></span>}
                          </div>
                        )}
                        {item.category === 'Armor' && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="text-[10px] uppercase tracking-widest font-bold bg-slate-800 px-2 py-1 rounded text-slate-300 shadow-inner">AC: <span className="text-white">{item.ac}</span></span>
                          </div>
                        )}
                        <p className="whitespace-pre-wrap leading-relaxed">{item.desc}</p>
                        
                        {!isDM && item.category === 'Weapon' && (
                          <button onClick={() => equipWeapon(item)} className="mt-4 bg-indigo-900/40 border border-indigo-500/50 hover:bg-indigo-600 text-indigo-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm">
                            <Sword className="w-3 h-3" /> Equip to Combat Tab
                          </button>
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
            <span className="text-yellow-500/50 text-[10px] font-black uppercase tracking-widest block mb-2 text-center">Assarions (Gold)</span>
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
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest block mb-2 text-center">Quadrans (Silver)</span>
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
            <span className="text-amber-700 text-[10px] font-black uppercase tracking-widest block mb-2 text-center">Leptons (Copper)</span>
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