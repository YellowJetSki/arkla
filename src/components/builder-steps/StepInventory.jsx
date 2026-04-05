import { Backpack, Search, Sword, Shield, Plus, Trash2, Crosshair, Image as ImageIcon } from 'lucide-react';
import ImageSelector from '../shared/ImageSelector';

export default function StepInventory({ 
  newItem, 
  setNewItem, 
  handleItemNameChange, 
  showEquipDropdown, 
  filteredEquip, 
  handleSelectSrdItem, 
  handleAddItem, 
  inventory, 
  removeInventoryItem 
}) {
  return (
    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 text-indigo-400 border-b border-slate-800 pb-2 mb-4">
        <Backpack className="w-5 h-5" /> <h3 className="font-bold uppercase tracking-widest text-sm">Starting Inventory</h3>
      </div>
      
      <form onSubmit={handleAddItem} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 shadow-inner space-y-4">
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
              placeholder="e.g. Longsword or Potion" 
            />
            
            {showEquipDropdown && filteredEquip.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto custom-scrollbar bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50">
                {filteredEquip.map(item => (
                  <div 
                    key={item.url || item.index} 
                    onClick={() => handleSelectSrdItem(item.url || item.index)} 
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 p-3 rounded-lg border border-slate-700">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1"><Sword className="w-3 h-3 inline"/> Damage</label>
              <input 
                type="text" 
                value={newItem.damageDice} 
                onChange={e => setNewItem({...newItem, damageDice: e.target.value})} 
                className="w-full bg-slate-950 border border-slate-600 rounded-md px-2 py-1.5 text-white text-xs focus:outline-none" 
                placeholder="1d8" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type</label>
              <input 
                type="text" 
                value={newItem.damageType} 
                onChange={e => setNewItem({...newItem, damageType: e.target.value})} 
                className="w-full bg-slate-950 border border-slate-600 rounded-md px-2 py-1.5 text-white text-xs focus:outline-none" 
                placeholder="Slashing" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1"><Crosshair className="w-3 h-3 inline"/> Range</label>
              <input 
                type="text" 
                value={newItem.range || ''} 
                onChange={e => setNewItem({...newItem, range: e.target.value})} 
                className="w-full bg-slate-950 border border-slate-600 rounded-md px-2 py-1.5 text-white text-xs focus:outline-none" 
                placeholder="5 ft" 
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Properties</label>
              <input 
                type="text" 
                value={newItem.properties} 
                onChange={e => setNewItem({...newItem, properties: e.target.value})} 
                className="w-full bg-slate-950 border border-slate-600 rounded-md px-2 py-1.5 text-white text-xs focus:outline-none" 
                placeholder="Finesse, Light" 
              />
            </div>
          </div>
        )}

        {newItem.category === 'Armor' && (
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1"><Shield className="w-3 h-3 inline"/> Armor Class (AC)</label>
            <input 
              type="number" 
              value={newItem.ac} 
              onChange={e => setNewItem({...newItem, ac: e.target.value})} 
              className="w-full bg-slate-950 border border-slate-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none" 
            />
          </div>
        )}

        <div className="space-y-2">
          <ImageSelector 
            value={newItem.imageUrl || ''} 
            onChange={(val) => setNewItem({...newItem, imageUrl: val})} 
            label="Image (Dropdown Library)" 
            inputClassName="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
          />
          <input 
            type="text" 
            value={newItem.imageUrl || ''} 
            onChange={e => setNewItem({...newItem, imageUrl: e.target.value})} 
            className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 mt-1" 
            placeholder="...or paste a custom image URL here" 
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
        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-lg flex justify-center items-center gap-2">
          <Plus className="w-4 h-4"/> Add to Bags
        </button>
      </form>

      <div className="space-y-2 mt-4">
        {inventory.length === 0 ? (
          <p className="text-center text-slate-500 italic text-xs">No starting items added.</p>
        ) : (
          inventory.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-700">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">{item.quantity}x {item.name}</span>
                <span className="text-[9px] text-slate-400 uppercase tracking-widest">{item.category} {item.damageDice ? `(${item.damageDice})` : ''}</span>
              </div>
              <button 
                onClick={() => removeInventoryItem(idx)} 
                className="text-slate-500 hover:text-red-400 p-2"
              >
                <Trash2 className="w-4 h-4"/>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}