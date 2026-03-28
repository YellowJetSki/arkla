import { useState } from 'react';
import { doc, getDoc, setDoc, arrayUnion, runTransaction } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Backpack, Coins, Search, Hammer, Plus, Minus, Send, ChevronDown, ChevronUp } from 'lucide-react';
import EquipmentDiscovery from '../EquipmentDiscovery';
import DebouncedTextarea from '../shared/DebouncedTextarea';

const parseInventory = (text) => {
  if (!text) return [];
  const blocks = text.split(/^(?=•|-|\d+x)/m).filter(b => b.trim());
  return blocks.map(block => {
    const lines = block.trim().split('\n');
    const name = lines[0];
    const desc = lines.slice(1).join('\n').trim();
    return { name, desc };
  });
};

export default function InventoryTab({ char, charId, isDM, updateField, activeTheme, showDialog }) {
  const [showItemSearch, setShowItemSearch] = useState(false);
  const [isForgingItem, setIsForgingItem] = useState(false);
  const [customItem, setCustomItem] = useState({ name: '', type: 'Wondrous Item', stats: '', desc: '' });
  
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionType, setTransactionType] = useState('assarions'); 
  const [openItems, setOpenItems] = useState({}); 

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
      hit: '--', // Leave blank, the arklaEngine calculates this dynamically
      damage: weaponData.damage.damage_dice || '1d4', // Save base dice only
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
    
    let formattedText = `• ${customItem.name} (${customItem.type})`;
    if (customItem.stats) formattedText += `\n  ${customItem.stats}`;
    if (customItem.desc) formattedText += `\n  ${customItem.desc}`;
    
    await addEquipmentToInventory(formattedText);
    setCustomItem({ name: '', type: 'Wondrous Item', stats: '', desc: '' });
    setIsForgingItem(false);
  };

  const handleShareToParty = async (itemString, index) => {
    showDialog({
      title: 'Share with Party?',
      message: 'Send this item to the Shared Party Loot? It will be removed from your personal inventory.',
      type: 'confirm',
      onConfirm: async () => {
        const blocks = (char.inventory || '').split(/^(?=•|-|\d+x)/m).filter(b => b.trim());
        blocks.splice(index, 1);
        await updateField('inventory', blocks.join('\n\n'));

        const cleanName = itemString.replace(/^•\s*/, '').split('(')[0].trim() || 'Shared Item';
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
      <div className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-5">
        <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><Backpack className={`w-5 h-5 ${activeTheme.text}`} /> Equipment & Items</h3>
          
          {isDM && (
            <div className="flex gap-2">
              <button onClick={() => setIsForgingItem(!isForgingItem)} className={`text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border ${isForgingItem ? 'bg-indigo-700 border-indigo-500 text-white' : `bg-slate-800 border-slate-700 ${activeTheme.text} hover:bg-slate-700`}`}>
                <Hammer className="w-3 h-3" /> {isForgingItem ? 'Close Forge' : 'Forge Custom'}
              </button>
              <button onClick={() => setShowItemSearch(!showItemSearch)} className={`text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border ${showItemSearch ? 'bg-slate-700 border-slate-500 text-white' : `bg-slate-800 border-slate-700 ${activeTheme.text} hover:bg-slate-700`}`}>
                <Search className="w-3 h-3" /> {showItemSearch ? 'Close Search' : 'API Search'}
              </button>
            </div>
          )}
        </div>
        
        {isDM && isForgingItem && (
          <form onSubmit={handleForgeCustomItem} className="bg-slate-900/80 p-4 rounded-xl border border-indigo-500/30 mb-6 animate-in fade-in slide-in-from-top-2 space-y-3">
            <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-2"><Hammer className="w-4 h-4" /> Homebrew Item Forge</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Item Name</label>
                <input type="text" required value={customItem.name} onChange={e => setCustomItem({...customItem, name: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500" placeholder="e.g. Arcane Pistol" />
              </div>
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Type</label>
                <input type="text" value={customItem.type} onChange={e => setCustomItem({...customItem, type: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500" placeholder="e.g. Weapon, Wondrous Item" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mechanics / Stats</label>
                <input type="text" value={customItem.stats} onChange={e => setCustomItem({...customItem, stats: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500" placeholder="e.g. Damage: 1d10 piercing. Range: 30/90." />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                <textarea value={customItem.desc} onChange={e => setCustomItem({...customItem, desc: e.target.value})} className="w-full min-h-[60px] bg-slate-950 border border-slate-600 rounded px-2 py-1.5 text-slate-300 text-sm focus:outline-none focus:border-indigo-500 resize-y" placeholder="A rusty pistol glowing with arcane runes..." />
              </div>
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Inject into Inventory</button>
          </form>
        )}

        {showItemSearch && isDM && <EquipmentDiscovery onAddEquipment={addEquipmentToInventory} onEquipWeapon={handleEquipWeapon} />}

        {isDM ? (
          <div className="w-full min-h-[300px] h-[300px] relative rounded-xl overflow-hidden border border-slate-700 focus-within:border-slate-500 transition-colors">
            <DebouncedTextarea 
              initialValue={char.inventory || ''} 
              onSave={(val) => updateField('inventory', val)} 
              className={`w-full h-full bg-slate-900 p-4 text-slate-300 text-sm focus:outline-none resize-none leading-relaxed custom-scrollbar`} 
            />
          </div>
        ) : (
          <div className="space-y-3">
            {parsedItems.length === 0 ? (
               <p className="text-slate-500 italic p-4 text-center">Your bags are empty.</p>
            ) : (
              parsedItems.map((item, i) => (
                <div key={`inv-${i}`} className={`bg-slate-900/50 border rounded-lg overflow-hidden transition-colors ${openItems[i] ? `border-${activeTheme.ring}` : 'border-slate-800'}`}>
                  <div className="flex justify-between items-center p-3 cursor-pointer" onClick={() => toggleItemOpen(i)}>
                    <span className={`font-bold text-sm md:text-base ${openItems[i] ? activeTheme.text : 'text-slate-300'}`}>{item.name}</span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleShareToParty(`${item.name}${item.desc ? '\n' + item.desc : ''}`, i); }}
                        className="bg-slate-800 border border-slate-700 p-1.5 rounded-md hover:bg-emerald-600 hover:text-white transition-colors text-slate-400 shadow-sm"
                        title="Share to Party Loot"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                      {item.desc && (
                        <div className="text-slate-500">
                          {openItems[i] ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                        </div>
                      )}
                    </div>
                  </div>
                  {item.desc && openItems[i] && (
                    <div className="p-3 pt-0 border-t border-slate-800/50 text-sm text-slate-400 whitespace-pre-wrap leading-relaxed animate-in slide-in-from-top-1 fade-in">
                      {item.desc}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-5 h-fit flex flex-col">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4"><Coins className="w-5 h-5 text-yellow-400" /> Wallet</h3>
        
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-600 mb-4 flex flex-col gap-3 shadow-inner">
          <div className="flex gap-2">
            <input 
              type="number" 
              value={transactionAmount}
              onChange={(e) => setTransactionAmount(e.target.value)}
              placeholder="Amount..." 
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-black focus:outline-none focus:border-yellow-500"
            />
            <div className="flex flex-col gap-1 shrink-0">
              <button onClick={() => handleTransaction(true)} disabled={!transactionAmount} className="bg-emerald-900/40 hover:bg-emerald-600 disabled:opacity-50 text-emerald-400 hover:text-white border border-emerald-900/50 px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-colors shadow-sm">+ Loot</button>
              <button onClick={() => handleTransaction(false)} disabled={!transactionAmount} className="bg-red-900/40 hover:bg-red-600 disabled:opacity-50 text-red-400 hover:text-white border border-red-900/50 px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-colors shadow-sm">- Pay</button>
            </div>
          </div>
          
          <div className="flex gap-1">
             {[1, 5, 10, 50].map(val => (
               <button key={val} onClick={() => setTransactionAmount(val.toString())} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 rounded py-1 text-xs font-bold transition-colors">
                 {val}
               </button>
             ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900 p-3 rounded-lg border border-yellow-900/30">
            <span className="text-slate-300 text-[10px] md:text-xs font-bold uppercase tracking-widest block mb-2 text-center">Assarions (Gold)</span>
            <div className="flex items-center justify-between gap-2">
              <button onClick={() => adjustCurrency('assarions', -1)} className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center border border-slate-600 transition-colors"><Minus className="w-4 h-4" /></button>
              <input type="number" value={char.currency?.assarions || 0} onChange={(e) => updateField('currency.assarions', Number(e.target.value))} className="w-16 bg-transparent text-yellow-400 font-black text-xl text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              <button onClick={() => adjustCurrency('assarions', 1)} className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center border border-slate-600 transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
            <span className="text-slate-300 text-[10px] md:text-xs font-bold uppercase tracking-widest block mb-2 text-center">Quadrans (Silver)</span>
            <div className="flex items-center justify-between gap-2">
              <button onClick={() => adjustCurrency('quadrans', -1)} className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center border border-slate-600 transition-colors"><Minus className="w-4 h-4" /></button>
              <input type="number" value={char.currency?.quadrans || 0} onChange={(e) => updateField('currency.quadrans', Number(e.target.value))} className="w-16 bg-transparent text-slate-300 font-black text-xl text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              <button onClick={() => adjustCurrency('quadrans', 1)} className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center border border-slate-600 transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="bg-slate-900 p-3 rounded-lg border border-amber-900/30">
            <span className="text-slate-300 text-[10px] md:text-xs font-bold uppercase tracking-widest block mb-2 text-center">Leptons (Copper)</span>
            <div className="flex items-center justify-between gap-2">
              <button onClick={() => adjustCurrency('leptons', -1)} className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center border border-slate-600 transition-colors"><Minus className="w-4 h-4" /></button>
              <input type="number" value={char.currency?.leptons || 0} onChange={(e) => updateField('currency.leptons', Number(e.target.value))} className="w-16 bg-transparent text-amber-600 font-black text-xl text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              <button onClick={() => adjustCurrency('leptons', 1)} className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center border border-slate-600 transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}