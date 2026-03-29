import { useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, runTransaction } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Backpack, Coins, Search, Hammer, Plus, Minus, Send, ChevronDown, ChevronUp } from 'lucide-react';
import EquipmentDiscovery from '../EquipmentDiscovery';
import DebouncedTextarea from '../shared/DebouncedTextarea';

// New intelligent parser: splits by double-newlines OR lines starting with a bullet/dash
const parseInventory = (text) => {
  if (!text) return [];
  const blocks = text.split(/(?:\n\s*\n|(?=^[•\-*]\s+))/m).filter(b => b.trim());
  return blocks.map(block => {
    const lines = block.trim().split('\n');
    const name = lines[0].replace(/^[•\-*]\s*/, '').trim();
    const desc = lines.slice(1).join('\n').trim();
    return { name, desc };
  });
};

export default function InventoryTab({ char, charId, isDM, updateField, activeTheme, showDialog }) {
  const [showItemSearch, setShowItemSearch] = useState(false);
  const [isForgingItem, setIsForgingItem] = useState(false);
  
  const [customItem, setCustomItem] = useState({ 
    name: '', category: 'Wondrous Item', damageDice: '1d8', damageType: 'Slashing', properties: '', ac: 14, desc: '' 
  });
  
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionType, setTransactionType] = useState('assarions'); 
  const [openItems, setOpenItems] = useState({}); 

  // Premium input states
  const [isEditingGold, setIsEditingGold] = useState(false);
  const [displayGold, setDisplayGold] = useState("");
  const [isEditingSilver, setIsEditingSilver] = useState(false);
  const [displaySilver, setDisplaySilver] = useState("");
  const [isEditingCopper, setIsEditingCopper] = useState(false);
  const [displayCopper, setDisplayCopper] = useState("");

  const addEquipmentToInventory = async (formattedItemText) => {
    const currentInventory = char.inventory || '';
    const newInventory = currentInventory.trim() ? `${currentInventory}\n\n${formattedItemText}` : formattedItemText;
    await updateField('inventory', newInventory);
    setShowItemSearch(false);
  };

  const handleEquipWeapon = async (weaponData) => {
    if (!weaponData.damage || !charId) return; 
    
    const newAttack = {
      name: weaponData.name,
      hit: '--', 
      damage: weaponData.damage.damage_dice || '1d4', 
      type: weaponData.damage.damage_type?.name || 'Slashing',
      notes: weaponData.properties?.map(p => p.name).join(', ') || ''
    };

    try {
      await runTransaction(db, async (transaction) => {
        const charRef = doc(db, 'characters', charId);
        transaction.update(charRef, { attacks: arrayUnion(newAttack) });
      });
      showDialog({
        title: 'Weapon Equipped',
        message: `${weaponData.name} has been added to your bags AND equipped to your Combat Tab!`,
        type: 'alert',
        onConfirm: () => showDialog({ isOpen: false })
      });
    } catch (err) {
      console.error("Failed to equip weapon:", err);
    }
  };

  const handleForgeCustomItem = async (e) => {
    e.preventDefault();
    if (!customItem.name) return;
    
    let formattedText = `• ${customItem.name} (${customItem.category})`;
    
    if (customItem.category === 'Weapon') {
      formattedText += `\nDamage: ${customItem.damageDice || 'N/A'} ${customItem.damageType}`;
      if (customItem.properties) {
        formattedText += ` (${customItem.properties})`;
      }

      const newAttack = {
        name: customItem.name,
        hit: '--', 
        damage: customItem.damageDice || '1d4',
        type: customItem.damageType || 'Slashing',
        notes: customItem.properties || ''
      };

      try {
        await updateDoc(doc(db, 'characters', charId), { attacks: arrayUnion(newAttack) });
        showDialog({
          title: 'Weapon Forged & Linked',
          message: `${customItem.name} has been added to the inventory AND instantly pinned to the Combat Tab!`,
          type: 'alert',
          onConfirm: () => showDialog({ isOpen: false })
        });
      } catch (err) {
        console.error("Failed to auto-equip custom weapon:", err);
      }

    } else if (customItem.category === 'Armor') {
      formattedText += `\nAC: ${customItem.ac || 10}`;
    }
    
    if (customItem.desc) {
      formattedText += `\n${customItem.desc}`;
    }
    
    await addEquipmentToInventory(formattedText);
    
    setCustomItem({ name: '', category: 'Wondrous Item', damageDice: '1d8', damageType: 'Slashing', properties: '', ac: 14, desc: '' });
    setIsForgingItem(false);
  };

  const handleShareToParty = async (itemString, index) => {
    showDialog({
      title: 'Share with Party?',
      message: 'Send this item to the Shared Party Loot? It will be removed from your personal inventory.',
      type: 'confirm',
      onConfirm: async () => {
        const blocks = (char.inventory || '').split(/(?:\n\s*\n|(?=^[•\-*]\s+))/m).filter(b => b.trim());
        blocks.splice(index, 1);
        await updateField('inventory', blocks.join('\n\n'));

        const cleanName = itemString.split('\n')[0].replace(/^[•\-*]\s*/, '').trim() || 'Shared Item';
        const newItem = {
          id: `loot_${Date.now()}`,
          name: cleanName,
          desc: itemString,
          source: char.name
        };
        
        const lootRef = doc(db, 'campaign', 'shared_loot');
        const lootSnap = await getDoc(lootRef);
        let items = [];
        if (lootSnap.exists()) {
           items = lootSnap.data().items || [];
        }
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
        const data = sfDoc.data();
        const current = data.currency?.[type] || 0;
        const newAmt = Math.max(0, current + amount);
        transaction.update(charRef, { [`currency.${type}`]: newAmt });
      });
    } catch (err) {
      console.error("Currency transaction failed: ", err);
    }
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
          const newGold = Math.floor(remainingCopperTotal / 100);
          const newSilver = Math.floor((remainingCopperTotal % 100) / 10);
          const newCopper = remainingCopperTotal % 10;

          transaction.update(charRef, {
            'currency.assarions': newGold,
            'currency.quadrans': newSilver,
            'currency.leptons': newCopper
          });
        }
      });
      setTransactionAmount('');
    } catch (error) {
       if (error === "Not enough funds") {
         showDialog({
           title: 'Insufficient Funds',
           message: 'Not enough total wealth to cover this transaction.',
           type: 'alert',
           onConfirm: () => showDialog({ isOpen: false })
         });
       } else {
         console.error(error);
       }
    }
  };

  const toggleItemOpen = (idx) => {
    setOpenItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const parsedItems = parseInventory(char.inventory);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-5 shadow-xl relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-700/10 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-4 relative z-10">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><Backpack className={`w-5 h-5 ${activeTheme.text}`} /> Equipment & Items</h3>
          
          {isDM && (
            <div className="flex gap-2">
              <button onClick={() => setIsForgingItem(!isForgingItem)} className={`text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border shadow-sm ${isForgingItem ? 'bg-indigo-700 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' : `bg-slate-800/80 border-slate-700 ${activeTheme.text} hover:bg-slate-700`}`}>
                <Hammer className="w-3 h-3" /> {isForgingItem ? 'Close Forge' : 'Forge Custom'}
              </button>
              <button onClick={() => setShowItemSearch(!showItemSearch)} className={`text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border shadow-sm ${showItemSearch ? 'bg-slate-700 border-slate-500 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : `bg-slate-800/80 border-slate-700 ${activeTheme.text} hover:bg-slate-700`}`}>
                <Search className="w-3 h-3" /> {showItemSearch ? 'Close Search' : 'API Search'}
              </button>
            </div>
          )}
        </div>
        
        {isDM && isForgingItem && (
          <form onSubmit={handleForgeCustomItem} className="bg-slate-900/80 backdrop-blur-sm p-5 rounded-2xl border border-indigo-500/30 mb-6 animate-in fade-in slide-in-from-top-2 space-y-4 shadow-inner relative z-10">
            <h4 className="text-sm font-black text-indigo-400 flex items-center gap-2 uppercase tracking-widest border-b border-indigo-900/50 pb-2"><Hammer className="w-4 h-4" /> Homebrew Item Forge</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Item Name</label>
                <input type="text" required value={customItem.name} onChange={e => setCustomItem({...customItem, name: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 shadow-inner" placeholder="e.g. Ring of Fire" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Equipment Category</label>
                <select value={customItem.category} onChange={e => setCustomItem({...customItem, category: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 shadow-inner">
                  <option value="Wondrous Item">Wondrous Item</option>
                  <option value="Weapon">Weapon</option>
                  <option value="Armor">Armor</option>
                  <option value="Adventuring Gear">Adventuring Gear</option>
                  <option value="Potion">Potion</option>
                  <option value="Scroll">Scroll</option>
                </select>
              </div>

              {customItem.category === 'Weapon' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Damage Dice</label>
                    <input type="text" onFocus={(e) => e.target.select()} required value={customItem.damageDice} onChange={e => setCustomItem({...customItem, damageDice: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 shadow-inner" placeholder="e.g. 1d10" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Damage Type</label>
                    <input type="text" required value={customItem.damageType} onChange={e => setCustomItem({...customItem, damageType: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 shadow-inner" placeholder="e.g. Fire, Piercing" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Properties (Comma Separated)</label>
                    <input type="text" value={customItem.properties} onChange={e => setCustomItem({...customItem, properties: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 shadow-inner" placeholder="e.g. Finesse, Light, Use: CHA" />
                  </div>
                </>
              )}

              {customItem.category === 'Armor' && (
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Base Armor Class (AC)</label>
                  <input type="number" onFocus={(e) => e.target.select()} required value={customItem.ac} onChange={e => setCustomItem({...customItem, ac: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 shadow-inner" placeholder="e.g. 14" />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description & Lore</label>
                <textarea required value={customItem.desc} onChange={e => setCustomItem({...customItem, desc: e.target.value})} className="w-full min-h-[80px] bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-indigo-500 resize-y shadow-inner" placeholder="A mysterious object humming with power..." />
              </div>
            </div>
            
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] flex items-center justify-center gap-2 mt-2">
              <Plus className="w-4 h-4" /> Inject into Inventory
            </button>
          </form>
        )}

        {showItemSearch && isDM && <EquipmentDiscovery onAddEquipment={addEquipmentToInventory} onEquipWeapon={handleEquipWeapon} />}

        {isDM ? (
          <div className="w-full min-h-[300px] h-[300px] relative rounded-xl overflow-hidden border border-slate-700 focus-within:border-slate-500 transition-colors shadow-inner relative z-10">
            <DebouncedTextarea 
              initialValue={char.inventory || ''} 
              onSave={(val) => updateField('inventory', val)} 
              className={`w-full h-full bg-slate-950/80 p-5 text-slate-300 text-sm focus:outline-none resize-none leading-relaxed custom-scrollbar`} 
            />
          </div>
        ) : (
          <div className="space-y-4 relative z-10">
            {parsedItems.length === 0 ? (
               <p className="text-slate-500 italic p-6 text-center bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">Your bags are empty.</p>
            ) : (
              parsedItems.map((item, i) => (
                <div key={`inv-${i}`} className={`bg-slate-900/80 backdrop-blur-sm border rounded-xl overflow-hidden transition-colors shadow-sm ${openItems[i] ? `border-${activeTheme.ring} shadow-[0_0_15px_rgba(255,255,255,0.05)]` : 'border-slate-700/80 hover:border-slate-500'}`}>
                  <div className="flex justify-between items-center p-4 cursor-pointer" onClick={() => toggleItemOpen(i)}>
                    <span className={`font-black text-sm md:text-base ${openItems[i] ? activeTheme.text : 'text-slate-200'}`}>{item.name}</span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleShareToParty(`• ${item.name}${item.desc ? '\n' + item.desc : ''}`, i); }}
                        className="bg-slate-800 border border-slate-700 p-2 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors text-slate-400 shadow-sm"
                        title="Share to Party Loot"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      {item.desc && (
                        <div className="text-slate-500 bg-slate-950 p-1 rounded border border-slate-800">
                          {openItems[i] ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                        </div>
                      )}
                    </div>
                  </div>
                  {item.desc && openItems[i] && (
                    <div className="p-4 pt-0 border-t border-slate-800/50 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed animate-in slide-in-from-top-1 fade-in bg-slate-950/30">
                      {item.desc}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
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