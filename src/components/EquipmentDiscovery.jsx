import { useState, useEffect } from 'react';
import { Search, Loader2, Plus, PackagePlus, Swords, Info, ChevronDown } from 'lucide-react';
import { getEquipmentStubs, fetchDetailedStubs } from '../services/arklaEngine';

export default function EquipmentDiscovery({ onAddEquipment, onEquipWeapon }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const [allStubs, setAllStubs] = useState([]);
  const [filteredStubs, setFilteredStubs] = useState([]);
  const [visibleItems, setVisibleItems] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const CHUNK_SIZE = 10;

  useEffect(() => {
    const initItems = async () => {
      setIsSearching(true);
      const stubs = await getEquipmentStubs();
      setAllStubs(stubs);
      setFilteredStubs(stubs);
      
      const initialDetails = await fetchDetailedStubs(stubs.slice(0, CHUNK_SIZE));
      setVisibleItems(initialDetails);
      setIsSearching(false);
    };
    initItems();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    
    const query = searchQuery.trim().toLowerCase();
    const newFiltered = allStubs.filter(stub => stub.name.toLowerCase().includes(query));
    setFilteredStubs(newFiltered);
    
    const newDetails = await fetchDetailedStubs(newFiltered.slice(0, CHUNK_SIZE));
    setVisibleItems(newDetails);
    setIsSearching(false);
  };

  const handleLoadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    
    const currentLength = visibleItems.length;
    const nextStubs = filteredStubs.slice(currentLength, currentLength + CHUNK_SIZE);
    const nextDetails = await fetchDetailedStubs(nextStubs);
    
    setVisibleItems(prev => [...prev, ...nextDetails]);
    setIsLoadingMore(false);
  };

  const handleAdd = (item) => {
    let formattedText = `• ${item.name} (${item.equipment_category?.name || 'Item'})`;
    
    if (item.equipment_category?.name === 'Weapon') {
      formattedText += `\n  Damage: ${item.damage?.damage_dice || 'N/A'} ${item.damage?.damage_type?.name || ''}`;
      if (item.properties && item.properties.length > 0) {
        formattedText += ` (${item.properties.map(p => p.name).join(', ')})`;
      }
    } else if (item.equipment_category?.name === 'Armor') {
      formattedText += `\n  AC: ${item.armor_class?.base || 10} ${item.armor_class?.dex_bonus ? '+ DEX' : ''}`;
    }
    
    if (item.desc) {
      formattedText += `\n  ${item.desc}`;
    }

    onAddEquipment(formattedText);
    setVisibleItems(prev => prev.filter(i => i.index !== item.index));
  };

  const hasMore = visibleItems.length < filteredStubs.length;

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm p-5 rounded-2xl border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)] mb-6 animate-in fade-in slide-in-from-top-2 relative overflow-hidden">
      
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 blur-[80px] rounded-full pointer-events-none"></div>

      <h4 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-indigo-300 flex items-center gap-2 uppercase tracking-widest drop-shadow-sm mb-5 relative z-10">
        <PackagePlus className="w-5 h-5 text-emerald-400" /> Equipment Vault
      </h4>

      <form onSubmit={handleSearch} className="flex gap-3 mb-6 relative z-10">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
               setSearchQuery(e.target.value);
               if (e.target.value === '') {
                   setFilteredStubs(allStubs);
                   fetchDetailedStubs(allStubs.slice(0, CHUNK_SIZE)).then(setVisibleItems);
               }
            }}
            placeholder="Search the 5e archives (e.g. Longsword)"
            className="w-full bg-slate-950/80 border border-slate-600 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 transition-all shadow-inner placeholder-slate-600"
          />
        </div>
        <button 
          type="submit" 
          disabled={isSearching}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center gap-2 shrink-0"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </button>
      </form>
      
      <div className="space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar pr-2 relative z-10">
        {visibleItems.map((item) => {
          const isWeapon = item.equipment_category?.name === 'Weapon';

          return (
            <div key={item.index} className="p-4 rounded-xl text-left transition-all duration-300 relative overflow-hidden group bg-slate-800/80 border border-slate-600 hover:border-emerald-500/50 hover:shadow-[0_4px_20px_rgba(16,185,129,0.15)] hover:-translate-y-0.5">
              
              <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="pr-4">
                  <span className="font-black text-lg block mb-1 text-emerald-300 drop-shadow-sm">{item.name}</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-900/80 px-2 py-1 rounded border border-slate-700 inline-block shadow-inner">
                    {item.equipment_category?.name || 'Item'}
                  </span>
                </div>
                
                <div className="flex gap-2 shrink-0">
                  {isWeapon && (
                     <button 
                       onClick={() => onEquipWeapon(item)}
                       className="px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                     >
                       <Swords className="w-3.5 h-3.5" /> Equip
                     </button>
                  )}
                  <button 
                    onClick={() => handleAdd(item)}
                    className="px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>

              {isWeapon && (
                <div className="flex gap-4 mb-3 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 shadow-inner">
                   <div>
                     <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Damage</span>
                     <span className="text-sm font-black text-white">{item.damage?.damage_dice || 'N/A'} <span className="text-slate-400 text-xs font-bold">{item.damage?.damage_type?.name}</span></span>
                   </div>
                   {item.properties && item.properties.length > 0 && (
                     <div>
                       <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Properties</span>
                       <span className="text-xs font-bold text-indigo-300">{item.properties.map(p => p.name).join(', ')}</span>
                     </div>
                   )}
                </div>
              )}

              {item.desc && (
                <div className="flex gap-2 items-start text-sm mt-3 text-slate-300 leading-relaxed bg-slate-900/30 p-3 rounded-lg">
                  <Info className="w-4 h-4 text-emerald-500/50 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 hover:line-clamp-none transition-all cursor-pointer">{item.desc}</span>
                </div>
              )}
            </div>
          );
        })}
        
        {hasMore && (
          <button 
            onClick={handleLoadMore} 
            disabled={isLoadingMore}
            className="w-full py-4 mt-6 bg-slate-950 hover:bg-slate-900 border border-slate-700 hover:border-emerald-500/50 rounded-xl text-emerald-400 font-black text-xs uppercase tracking-widest transition-all flex justify-center items-center gap-2 shadow-inner group"
          >
            {isLoadingMore ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform"/> Excavate Further</>}
          </button>
        )}
      </div>
    </div>
  );
}