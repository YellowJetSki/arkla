import { useState } from 'react';
import { Backpack, Coins, Search, Hammer, Plus, Minus, ArrowRightLeft } from 'lucide-react';
import EquipmentDiscovery from '../EquipmentDiscovery';

export default function InventoryTab({ char, isDM, updateField, activeTheme }) {
  const [showItemSearch, setShowItemSearch] = useState(false);
  const [isForgingItem, setIsForgingItem] = useState(false);
  const [customItem, setCustomItem] = useState({ name: '', type: 'Wondrous Item', stats: '', desc: '' });
  
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionType, setTransactionType] = useState('assarions'); 

  const addEquipmentToInventory = async (formattedItemText) => {
    const currentInventory = char.inventory || '';
    const newInventory = currentInventory.trim() ? `${currentInventory}\n\n${formattedItemText}` : formattedItemText;
    await updateField('inventory', newInventory);
    setShowItemSearch(false);
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

  const adjustCurrency = (type, amount) => {
    const current = char.currency?.[type] || 0;
    updateField(`currency.${type}`, Math.max(0, current + amount));
  };

  const handleTransaction = (isAdding) => {
    const amount = parseInt(transactionAmount, 10);
    if (isNaN(amount) || amount <= 0) return;
    
    if (isAdding) {
      // Just add the raw amount
      adjustCurrency(transactionType, amount);
    } else {
      // SMART CONVERSION: Pool total wealth, subtract, and auto-consolidate change!
      const currentGold = char.currency?.assarions || 0;
      const currentSilver = char.currency?.quadrans || 0;
      const currentCopper = char.currency?.leptons || 0;

      let costInCopper = 0;
      if (transactionType === 'assarions') costInCopper = amount * 100;
      if (transactionType === 'quadrans') costInCopper = amount * 10;
      if (transactionType === 'leptons') costInCopper = amount;

      const totalCopper = (currentGold * 100) + (currentSilver * 10) + currentCopper;

      if (totalCopper < costInCopper) {
        alert("Not enough total wealth to cover this transaction.");
        return;
      }

      const remainingCopperTotal = totalCopper - costInCopper;
      const newGold = Math.floor(remainingCopperTotal / 100);
      const newSilver = Math.floor((remainingCopperTotal % 100) / 10);
      const newCopper = remainingCopperTotal % 10;

      updateField('currency', { 
        ...char.currency,
        assarions: newGold, 
        quadrans: newSilver, 
        leptons: newCopper 
      });
    }
    
    setTransactionAmount('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-5">
        <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><Backpack className={`w-5 h-5 ${activeTheme.text}`} /> Equipment & Items</h3>
          {isDM && (
            <div className="flex gap-2">
              <button onClick={() => setIsForgingItem(!isForgingItem)} className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border ${isForgingItem ? 'bg-indigo-700 border-indigo-500 text-white' : `bg-slate-800 border-slate-700 ${activeTheme.text} hover:bg-slate-700`}`}>
                <Hammer className="w-3 h-3" /> {isForgingItem ? 'Close Forge' : 'Forge Custom'}
              </button>
              <button onClick={() => setShowItemSearch(!showItemSearch)} className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border ${showItemSearch ? 'bg-slate-700 border-slate-500 text-white' : `bg-slate-800 border-slate-700 ${activeTheme.text} hover:bg-slate-700`}`}>
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
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Item Name</label>
                <input type="text" required value={customItem.name} onChange={e => setCustomItem({...customItem, name: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500" placeholder="e.g. Arcane Pistol" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type</label>
                <input type="text" value={customItem.type} onChange={e => setCustomItem({...customItem, type: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500" placeholder="e.g. Weapon, Wondrous Item" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mechanics / Stats</label>
                <input type="text" value={customItem.stats} onChange={e => setCustomItem({...customItem, stats: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500" placeholder="e.g. Damage: 1d10 piercing. Range: 30/90." />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                <textarea value={customItem.desc} onChange={e => setCustomItem({...customItem, desc: e.target.value})} className="w-full min-h-[60px] bg-slate-950 border border-slate-600 rounded px-2 py-1.5 text-slate-300 text-sm focus:outline-none focus:border-indigo-500 resize-y" placeholder="A rusty pistol glowing with arcane runes..." />
              </div>
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Inject into Inventory</button>
          </form>
        )}

        {showItemSearch && isDM && <EquipmentDiscovery onAddEquipment={addEquipmentToInventory} />}

        {isDM ? (
          <textarea defaultValue={char.inventory || ''} onBlur={(e) => updateField('inventory', e.target.value)} className={`w-full min-h-[300px] bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-300 text-sm focus:outline-none focus:${activeTheme.border} resize-y leading-relaxed custom-scrollbar`} />
        ) : (
          <ul className="space-y-2">
            {(char.inventory || '').split('\n').map((item, i) => item ? <li key={`inv-${i}`} className="flex items-start gap-3 text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap"><div className={`w-1.5 h-1.5 rounded-full ${activeTheme.bg} mt-2 shrink-0`}></div><span className="flex-1">{item}</span></li> : null)}
          </ul>
        )}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-5 h-fit flex flex-col">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4"><Coins className="w-5 h-5 text-yellow-400" /> Wallet</h3>
        
        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-600 mb-4 flex gap-2">
          <input 
            type="number" 
            value={transactionAmount}
            onChange={(e) => setTransactionAmount(e.target.value)}
            placeholder="Amt..." 
            className="w-16 sm:w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-yellow-500"
          />
          <select 
            value={transactionType} 
            onChange={(e) => setTransactionType(e.target.value)} 
            className="bg-slate-950 border border-slate-700 rounded px-1 sm:px-2 py-1 text-slate-300 text-xs focus:outline-none focus:border-yellow-500"
          >
            <option value="assarions">Gold</option>
            <option value="quadrans">Silver</option>
            <option value="leptons">Copper</option>
          </select>
          <div className="flex flex-col gap-1 shrink-0">
            <button onClick={() => handleTransaction(true)} disabled={!transactionAmount} className="bg-emerald-900/40 hover:bg-emerald-600 disabled:opacity-50 text-emerald-400 hover:text-white border border-emerald-900/50 px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors">+ Loot</button>
            <button onClick={() => handleTransaction(false)} disabled={!transactionAmount} className="bg-red-900/40 hover:bg-red-600 disabled:opacity-50 text-red-400 hover:text-white border border-red-900/50 px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors">- Pay</button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900 p-3 rounded-lg border border-yellow-900/30">
            <span className="text-slate-300 text-xs font-bold uppercase tracking-widest block mb-2 text-center">Assarions (Gold)</span>
            <div className="flex items-center justify-between gap-2">
              <button onClick={() => adjustCurrency('assarions', -1)} className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center border border-slate-600 transition-colors"><Minus className="w-4 h-4" /></button>
              <input type="number" value={char.currency?.assarions || 0} onChange={(e) => updateField('currency.assarions', Number(e.target.value))} className="w-16 bg-transparent text-yellow-400 font-black text-xl text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              <button onClick={() => adjustCurrency('assarions', 1)} className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center border border-slate-600 transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
            <span className="text-slate-300 text-xs font-bold uppercase tracking-widest block mb-2 text-center">Quadrans (Silver)</span>
            <div className="flex items-center justify-between gap-2">
              <button onClick={() => adjustCurrency('quadrans', -1)} className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center border border-slate-600 transition-colors"><Minus className="w-4 h-4" /></button>
              <input type="number" value={char.currency?.quadrans || 0} onChange={(e) => updateField('currency.quadrans', Number(e.target.value))} className="w-16 bg-transparent text-slate-300 font-black text-xl text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              <button onClick={() => adjustCurrency('quadrans', 1)} className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center border border-slate-600 transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="bg-slate-900 p-3 rounded-lg border border-amber-900/30">
            <span className="text-slate-300 text-xs font-bold uppercase tracking-widest block mb-2 text-center">Leptons (Copper)</span>
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