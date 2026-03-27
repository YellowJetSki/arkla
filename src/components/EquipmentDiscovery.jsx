import { useState } from 'react';
import { Search, Loader2, Plus, Shield, Sword } from 'lucide-react';
import { fetchSafeEquipment } from '../services/sanctuaryApi';

export default function EquipmentDiscovery({ onAddEquipment, onEquipWeapon }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError('');
    setSearchResults([]);

    const { results, error } = await fetchSafeEquipment(searchQuery.trim());
    
    if (error) setSearchError(error);
    if (results.length > 0) setSearchResults(results);
    
    setIsSearching(false);
  };

  const formatItemText = (item) => {
    let formattedText = `• ${item.name}`;
    if (item.equipment_category) {
       formattedText += ` (${item.equipment_category.name})`;
    }
    
    const descArray = Array.isArray(item.desc) ? item.desc : (item.desc ? [item.desc] : []);
    
    if (descArray.length > 0) {
      formattedText += `\n  ${descArray.join('\n  ')}`;
    } else {
      if (item.armor_class) {
        formattedText += `\n  Armor Class: ${item.armor_class.base} ${item.armor_class.dex_bonus ? '(+ Dex)' : ''}`;
      }
      if (item.damage) {
        formattedText += `\n  Damage: ${item.damage.damage_dice} ${item.damage.damage_type.name}`;
      }
      if (item.properties && item.properties.length > 0) {
        formattedText += `\n  Properties: ${item.properties.map(p => p.name).join(', ')}`;
      }
    }
    return formattedText;
  };

  const handleAdd = (item) => {
    onAddEquipment(formatItemText(item));
    setSearchResults(prev => prev.filter(s => s.index !== item.index));
  };

  const handleEquip = (item) => {
    onAddEquipment(formatItemText(item));
    if (onEquipWeapon) onEquipWeapon(item);
    setSearchResults(prev => prev.filter(s => s.index !== item.index));
  };

  return (
    <div className="bg-slate-900/80 p-4 rounded-xl border border-indigo-500/30 shadow-inner mb-6 animate-in fade-in slide-in-from-top-2">
      <h4 className="text-sm font-bold text-indigo-400 mb-3 flex items-center gap-2">
        <Shield className="w-4 h-4 text-emerald-400" /> Sanctuary Filter Active
      </h4>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search 5e gear & magic items (e.g. Longsword)"
          className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
        />
        <button 
          type="submit" 
          disabled={isSearching || !searchQuery.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shrink-0"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </button>
      </form>

      {searchError && <p className="text-sm text-red-400 bg-red-950/30 p-2 rounded border border-red-900/50">{searchError}</p>}
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
        {searchResults.map((item) => {
          const isWeapon = item.equipment_category?.name === 'Weapon';
          
          return (
            <div key={item.index} className="bg-slate-800 border border-slate-600 p-3 rounded-lg text-left">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-bold text-indigo-300 block">{item.name}</span>
                  <span className="text-xs text-slate-400">{item.equipment_category?.name || 'Magic Item'}</span>
                </div>
                
                <div className="flex gap-2 shrink-0">
                  {isWeapon && onEquipWeapon && (
                    <button 
                      onClick={() => handleEquip(item)}
                      className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/50 px-2 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1"
                      title="Add to inventory AND build an attack profile"
                    >
                      <Sword className="w-3 h-3" /> Equip
                    </button>
                  )}
                  <button 
                    onClick={() => handleAdd(item)}
                    className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/50 px-2 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1"
                    title="Add to inventory bags only"
                  >
                    <Plus className="w-3 h-3" /> Stash
                  </button>
                </div>
              </div>
              
              <div className="text-xs text-slate-300 mt-2 space-y-1">
                {item.damage && <p><strong className="text-slate-400">Damage:</strong> {item.damage.damage_dice} {item.damage.damage_type?.name}</p>}
                {item.armor_class && <p><strong className="text-slate-400">AC:</strong> {item.armor_class.base} {item.armor_class.dex_bonus ? '(+ Dex)' : ''}</p>}
                {item.desc && <p className="line-clamp-2 mt-1">{Array.isArray(item.desc) ? item.desc[0] : item.desc}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}