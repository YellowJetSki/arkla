import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Hammer, X, Save, Sword, Shield } from 'lucide-react';
import DialogModal from './shared/DialogModal';
import ImageSelector from './shared/ImageSelector';

export default function DMItemForge({ onClose }) {
  const [isSaving, setIsSaving] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  const [item, setItem] = useState({
    name: '',
    equipment_category: { name: 'Weapon' },
    rarity: { name: 'Common' },
    desc: [''],
    cost: { quantity: 0, unit: 'gp' },
    weight: 0,
    imageUrl: '',
    properties: [],
    damage: { damage_dice: '', damage_type: { name: 'Slashing' } },
    range: { normal: 5, long: null },
    armor_category: 'Light',
    armor_class: { base: 11, dex_bonus: true, max_bonus: null },
    str_minimum: 0,
    stealth_disadvantage: false,
    isHomebrew: true
  });

  const [propertyInput, setPropertyInput] = useState('');

  const handleAddProperty = (e) => {
    e.preventDefault();
    if (propertyInput.trim()) {
      setItem(prev => ({
        ...prev,
        properties: [...prev.properties, { name: propertyInput.trim() }]
      }));
      setPropertyInput('');
    }
  };

  const handleRemoveProperty = (index) => {
    setItem(prev => ({
      ...prev,
      properties: prev.properties.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!item.name) {
      setDialog({ isOpen: true, title: 'Missing Name', message: 'The artifact needs a name before it can be forged.', type: 'alert' });
      return;
    }

    setIsSaving(true);
    try {
      const formattedItem = {
        ...item,
        desc: typeof item.desc === 'string' ? item.desc.split('\n') : item.desc,
        index: `hb_item_${Date.now()}`
      };

      await addDoc(collection(db, 'homebrew_items'), formattedItem);
      onClose();
    } catch (error) {
      console.error("Error forging item:", error);
      setDialog({ isOpen: true, title: 'Forge Error', message: 'Failed to save the artifact to the database.', type: 'alert' });
    } finally {
      setIsSaving(false);
    }
  };

  const isWeapon = item.equipment_category.name === 'Weapon';
  const isArmor = item.equipment_category.name === 'Armor';

  return (
    <>
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onCancel={closeDialog} />

      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md h-[100dvh] overflow-hidden animate-in fade-in duration-300">
        <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl w-full max-w-3xl shadow-[0_0_40px_rgba(16,185,129,0.2)] flex flex-col max-h-[90dvh] animate-in zoom-in-95 duration-500 relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/90 rounded-t-2xl shrink-0 relative z-10">
            <h2 className="text-xl font-black text-emerald-400 flex items-center gap-2 uppercase tracking-widest drop-shadow-sm">
              <Hammer className="w-5 h-5" /> Artifact Forge
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl border border-slate-700 shadow-sm">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 relative z-10">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Artifact Name</label>
                <input type="text" value={item.name} onChange={e => setItem({...item, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-emerald-500 shadow-inner" placeholder="e.g. The Sun Blade" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
                <select value={item.equipment_category.name} onChange={e => setItem({...item, equipment_category: { name: e.target.value }})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 shadow-inner">
                  {['Weapon', 'Armor', 'Adventuring Gear', 'Wondrous Item', 'Potion', 'Ring', 'Scroll'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Rarity</label>
                <select value={item.rarity.name} onChange={e => setItem({...item, rarity: { name: e.target.value }})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 shadow-inner">
                  {['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2">
                <ImageSelector 
                  label="Artifact Image"
                  value={item.imageUrl}
                  onChange={(val) => setItem({...item, imageUrl: val})}
                  iconColor="text-emerald-400"
                  inputClassName="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                />
              </div>
            </div>

            {isWeapon && (
              <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 shadow-inner animate-in fade-in slide-in-from-bottom-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest border-b border-slate-700/50 pb-2 mb-4"><Sword className="w-4 h-4 text-emerald-400" /> Weapon Mechanics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Damage Dice</label>
                    <input type="text" value={item.damage.damage_dice} onChange={e => setItem({...item, damage: {...item.damage, damage_dice: e.target.value}})} placeholder="e.g. 1d8" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Damage Type</label>
                    <input type="text" value={item.damage.damage_type.name} onChange={e => setItem({...item, damage: {...item.damage, damage_type: { name: e.target.value }}})} placeholder="e.g. Slashing" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500" />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Weapon Properties (Finesse, Heavy, etc.)</label>
                  <form onSubmit={handleAddProperty} className="flex gap-2">
                    <input type="text" value={propertyInput} onChange={e => setPropertyInput(e.target.value)} placeholder="Add property..." className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
                    <button type="submit" className="bg-emerald-900/50 hover:bg-emerald-600 text-emerald-400 hover:text-white px-3 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest transition-colors border border-emerald-500/30">Add</button>
                  </form>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.properties.map((prop, i) => (
                      <span key={i} className="bg-slate-950 border border-slate-700 text-slate-300 text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                        {prop.name} <button type="button" onClick={() => handleRemoveProperty(i)} className="text-slate-500 hover:text-red-400 ml-1"><X className="w-3 h-3"/></button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {isArmor && (
              <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 shadow-inner animate-in fade-in slide-in-from-bottom-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest border-b border-slate-700/50 pb-2 mb-4"><Shield className="w-4 h-4 text-emerald-400" /> Armor Mechanics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Base AC</label>
                    <input type="number" value={item.armor_class.base} onChange={e => setItem({...item, armor_class: {...item.armor_class, base: Number(e.target.value)}})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-center focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">STR Min</label>
                    <input type="number" value={item.str_minimum} onChange={e => setItem({...item, str_minimum: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-center focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" />
                  </div>
                  <div className="col-span-2 flex flex-col justify-center gap-2">
                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                      <input type="checkbox" checked={item.armor_class.dex_bonus} onChange={e => setItem({...item, armor_class: {...item.armor_class, dex_bonus: e.target.checked}})} className="w-4 h-4 rounded border-slate-600 text-emerald-500 bg-slate-950" />
                      Add DEX Bonus
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                      <input type="checkbox" checked={item.stealth_disadvantage} onChange={e => setItem({...item, stealth_disadvantage: e.target.checked})} className="w-4 h-4 rounded border-slate-600 text-emerald-500 bg-slate-950" />
                      Stealth Disadvantage
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Description & Lore</label>
              <textarea 
                value={typeof item.desc === 'string' ? item.desc : item.desc.join('\n')} 
                onChange={e => setItem({...item, desc: e.target.value})} 
                className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-emerald-500 shadow-inner resize-y custom-scrollbar" 
                placeholder="Detail the magical properties, lore, and appearance..." 
              />
            </div>

          </div>

          <div className="p-4 bg-slate-900/90 border-t border-slate-800 shrink-0 relative z-10 flex justify-end">
            <button 
              onClick={handleSave} 
              disabled={isSaving} 
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black uppercase tracking-widest text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" /> Store in Vault
            </button>
          </div>

        </div>
      </div>
    </>
  );
}