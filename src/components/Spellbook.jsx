import { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove, runTransaction } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Flame, Sparkles, BookOpen, Target, ShieldAlert, Wand2, Search, Plus, Settings, BrainCircuit, Hammer, X, Filter, Trash2, Edit3 } from 'lucide-react';
import CollapsibleSection from './shared/CollapsibleSection';
import { fetchAllSpells, fetchSpellDetails } from '../services/srdApi';

const SPELL_FILTERS = ['All', 'Cantrips', 'Leveled', 'Concentration', 'Action', 'Bonus', 'Reaction'];

export default function Spellbook({ char, charId, isDM, showDialog }) {
  const [isEditingSlots, setIsEditingSlots] = useState(false); 
  const [isForgingSpell, setIsForgingSpell] = useState(false);
  const [editingSpell, setEditingSpell] = useState(null);
  
  const [customSpell, setCustomSpell] = useState({ 
    name: '', level: 0, castTime: '1 Action', range: '60 feet', components: 'V, S', duration: 'Instantaneous', desc: '' 
  });
  
  const [srdSpellsList, setSrdSpellsList] = useState([]);
  const [filteredSrdSpells, setFilteredSrdSpells] = useState([]);
  const [showSpellDropdown, setShowSpellDropdown] = useState(false);

  const [activeFilter, setActiveFilter] = useState('All');
  const [spellToCast, setSpellToCast] = useState(null);

  const spellSlots = char.spellSlots || {};
  const spells = char.spells || [];

  useEffect(() => {
    fetchAllSpells().then(setSrdSpellsList);
  }, []);

  const handleSpellNameChange = (e) => {
    const val = e.target.value;
    setCustomSpell(prev => ({ ...prev, name: val }));
    if (val.length > 1) {
      setFilteredSrdSpells(srdSpellsList.filter(i => i.name.toLowerCase().includes(val.toLowerCase())));
      setShowSpellDropdown(true);
    } else {
      setShowSpellDropdown(false);
    }
  };

  const handleSelectSrdSpell = async (indexStr) => {
    setShowSpellDropdown(false);
    const details = await fetchSpellDetails(indexStr);
    if (details) {
      setCustomSpell({
        name: details.name,
        level: details.level || 0,
        castTime: details.castingTime || details.casting_time || '1 Action',
        range: details.range || 'Self',
        components: details.components || 'V, S',
        duration: details.duration || 'Instantaneous',
        desc: details.desc || ''
      });
    }
  };

  const handleSlotToggle = async (level, currentIndex, max) => {
    if (isDM) return; 
    const currentAmount = spellSlots[level]?.current || 0;
    let newAmount;
    if (currentIndex < currentAmount) {
      newAmount = currentAmount - 1; 
    } else {
      newAmount = currentAmount + 1; 
    }
    const updatedSlots = { ...spellSlots, [level]: { ...spellSlots[level], current: newAmount, max: max } };
    await updateDoc(doc(db, 'characters', charId), { spellSlots: updatedSlots });
  };

  const executeCast = async (castLevel) => {
    if (isDM || castLevel === 0) return;
    const currentAmount = spellSlots[castLevel]?.current || 0;
    if (currentAmount > 0) {
      const updatedSlots = { 
        ...spellSlots, 
        [castLevel]: { ...spellSlots[castLevel], current: currentAmount - 1 } 
      };
      await updateDoc(doc(db, 'characters', charId), { spellSlots: updatedSlots });
    }
    setSpellToCast(null);
  };

  const toggleConcentration = async () => {
    if (isDM) return;
    try {
      await runTransaction(db, async (transaction) => {
        const charRef = doc(db, 'characters', charId);
        const mapRef = doc(db, 'campaign', 'battlemap');
        const newConcState = !char.isConcentrating;
        
        transaction.update(charRef, { isConcentrating: newConcState });
        const mapDoc = await transaction.get(mapRef);
        if (mapDoc.exists() && mapDoc.data().tokens && mapDoc.data().tokens[charId]) {
          const mapTokens = mapDoc.data().tokens;
          mapTokens[charId].isConcentrating = newConcState;
          transaction.update(mapRef, { tokens: mapTokens });
        }
      });
    } catch (err) {
      console.error("Concentration sync failed:", err);
    }
  };

  const addSpellToGrimoire = async (newSpell) => {
    await updateDoc(doc(db, 'characters', charId), { spells: arrayUnion(newSpell) });
  };

  const removeSpellFromGrimoire = async (spellToRemove) => {
    showDialog({
      title: 'Remove Spell?',
      message: `Are you sure you want to permanently delete ${spellToRemove.name} from this spellbook?`,
      type: 'confirm',
      onConfirm: async () => {
        await updateDoc(doc(db, 'characters', charId), { spells: arrayRemove(spellToRemove) });
        showDialog({ isOpen: false });
      },
      onCancel: () => showDialog({ isOpen: false })
    });
  };

  const handleEditClick = (spell) => {
    setEditingSpell(spell);
    setCustomSpell({
      name: spell.name,
      level: spell.level || 0,
      castTime: spell.castTime || spell.castingTime || spell.casting_time || '1 Action',
      range: spell.range || 'Self',
      components: spell.components || 'V, S',
      duration: spell.duration || 'Instantaneous',
      desc: spell.desc || ''
    });
    setIsForgingSpell(true);
  };

  const handleForgeCustomSpell = async (e) => {
    e.preventDefault();
    if (!customSpell.name || !customSpell.desc) return;
    
    const formattedSpell = {
      name: customSpell.name,
      level: Number(customSpell.level),
      castingTime: customSpell.castTime,
      range: customSpell.range,
      components: customSpell.components,
      duration: customSpell.duration,
      desc: customSpell.desc,
      isHomebrew: true,
      index: editingSpell?.index || `hb_spell_${Date.now()}`
    };

    try {
      if (editingSpell) {
        const updatedSpells = spells.map(s => s.name === editingSpell.name ? formattedSpell : s);
        await updateDoc(doc(db, 'characters', charId), { spells: updatedSpells });
        showDialog({ isOpen: true, title: 'Success', message: 'Spell updated successfully.', type: 'alert' });
      } else {
        await addSpellToGrimoire(formattedSpell);
        showDialog({ isOpen: true, title: 'Success', message: 'Spell added to Grimoire.', type: 'alert' });
      }
      
      setCustomSpell({ name: '', level: 0, castTime: '1 Action', range: '60 feet', components: 'V, S', duration: 'Instantaneous', desc: '' });
      setIsForgingSpell(false);
      setEditingSpell(null);
    } catch (err) {
      console.error("Failed to forge custom spell:", err);
      showDialog({ isOpen: true, title: 'Error', message: 'Failed to save spell.', type: 'alert' });
    }
  };

  const updateSlotMax = async (level, newMax) => {
    const numMax = parseInt(newMax) || 0;
    const updatedSlots = { ...spellSlots };
    if (numMax > 0) {
      updatedSlots[level] = { current: Math.min(updatedSlots[level]?.current || 0, numMax), max: numMax };
    } else {
      delete updatedSlots[level]; 
    }
    await updateDoc(doc(db, 'characters', charId), { spellSlots: updatedSlots });
  };

  const filteredSpells = spells.filter(spell => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Cantrips') return spell.level === 0;
    if (activeFilter === 'Leveled') return spell.level > 0;
    if (activeFilter === 'Concentration') return (spell.desc || '').toLowerCase().includes('concentration') || (spell.duration || '').toLowerCase().includes('concentration');
    if (activeFilter === 'Action') return (spell.castTime || spell.castingTime || '').toLowerCase().includes('1 action');
    if (activeFilter === 'Bonus') return (spell.castTime || spell.castingTime || '').toLowerCase().includes('bonus action');
    if (activeFilter === 'Reaction') return (spell.castTime || spell.castingTime || '').toLowerCase().includes('reaction');
    return true;
  });

  const groupedSpells = filteredSpells.reduce((acc, spell) => {
    const lvl = spell.level === 0 ? 'Cantrips' : `Level ${spell.level}`;
    if (!acc[lvl]) acc[lvl] = [];
    acc[lvl].push(spell);
    return acc;
  }, {});

  Object.keys(groupedSpells).forEach(lvl => {
    groupedSpells[lvl].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  });

  const sortedLevelNames = Object.keys(groupedSpells).sort((a, b) => {
    if (a === 'Cantrips') return -1;
    if (b === 'Cantrips') return 1;
    const numA = parseInt(a.replace('Level ', ''), 10);
    const numB = parseInt(b.replace('Level ', ''), 10);
    return numA - numB;
  });

  const highestLevelName = sortedLevelNames.filter(k => k !== 'Cantrips').reverse()[0];

  const hasSpellStats = char.spellSave || char.spellAttack;

  return (
    <div className="space-y-6">
      
      {spellToCast && !isDM && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl w-full max-w-sm shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
            <div className="p-4 border-b-[3px] border-slate-950 flex justify-between items-center bg-fuchsia-600">
              <h3 className="font-black text-slate-950 uppercase tracking-widest flex items-center gap-2">
                <Wand2 className="w-5 h-5" /> Cast Spell
              </h3>
              <button onClick={() => setSpellToCast(null)} className="text-slate-950 hover:text-white bg-fuchsia-500 border-2 border-slate-950 rounded p-1 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px]"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6">
              <h4 className="text-2xl font-black text-white leading-none mb-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">{spellToCast.name}</h4>
              <p className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-wider">Select a slot level to expend. Base: Lvl {spellToCast.level}.</p>
              
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].filter(l => l >= spellToCast.level && spellSlots[l]).map(level => {
                  const slots = spellSlots[level];
                  const hasSlots = slots && slots.current > 0;
                  return (
                    <button 
                      key={level}
                      onClick={() => executeCast(level)}
                      disabled={!hasSlots}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${hasSlots ? 'bg-fuchsia-600 border-slate-950 hover:bg-fuchsia-500 text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[4px] cursor-pointer' : 'bg-slate-900 border-slate-800 text-slate-600 opacity-50 cursor-not-allowed'}`}
                    >
                      <span className="text-lg font-black leading-none mb-1">Lvl {level}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-slate-950 px-1.5 py-0.5 rounded shadow-inner">{slots.current}/{slots.max}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {hasSpellStats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 border-2 border-slate-950 rounded-xl p-4 flex items-center justify-between shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <span className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest flex items-center gap-1.5"><ShieldAlert className="w-4 h-4"/> Save DC</span>
            <span className="text-3xl font-black text-white leading-none drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">{char.spellSave}</span>
          </div>
          <div className="bg-slate-900 border-2 border-slate-950 rounded-xl p-4 flex items-center justify-between shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <span className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest flex items-center gap-1.5"><Target className="w-4 h-4"/> Attack</span>
            <span className="text-3xl font-black text-white leading-none drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">{char.spellAttack}</span>
          </div>
        </div>
      )}

      <div className="bg-slate-800 border-[3px] border-slate-950 rounded-2xl p-4 md:p-5 shadow-[6px_6px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/20 blur-[50px] rounded-full pointer-events-none"></div>
        
        <div className="flex justify-between items-center mb-6 relative z-10 border-b-2 border-slate-900 pb-2">
          <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-widest drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]"><Flame className="w-5 h-5 text-fuchsia-500" /> Spell Slots</h3>
          {isDM && (
            <button 
              onClick={() => setIsEditingSlots(!isEditingSlots)} 
              className={`text-[10px] md:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all border-2 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] ${isEditingSlots ? 'bg-fuchsia-600 border-slate-950 text-white' : 'bg-slate-900 border-slate-950 text-fuchsia-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Settings className="w-3.5 h-3.5" /> {isEditingSlots ? 'Done' : 'Config'}
            </button>
          )}
        </div>
        
        {isEditingSlots && isDM ? (
          <div className="space-y-4 relative z-10 animate-in fade-in bg-slate-900 p-4 rounded-xl border-2 border-slate-950 shadow-inner">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Set maximum slots per level. Set to 0 to remove.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => (
                <div key={level} className="bg-slate-950 border-2 border-slate-900 rounded-lg p-2 flex items-center justify-between shadow-inner">
                  <span className="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest">Lvl {level}</span>
                  <input 
                    type="number" 
                    value={spellSlots[level]?.max || ''} 
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => updateSlotMax(level, e.target.value)}
                    placeholder="0"
                    className="w-12 bg-slate-800 border-2 border-slate-700 rounded text-center text-white py-1 focus:border-fuchsia-500 focus:outline-none text-sm font-black shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          Object.keys(spellSlots).length === 0 ? (
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 relative z-10 bg-slate-900/50 p-6 rounded-xl border-2 border-slate-900 border-dashed text-center shadow-inner">No spell slots configured. {isDM && "Click Config to add."}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 relative z-10">
              {Object.entries(spellSlots).map(([level, data]) => (
                <div key={level} className="bg-slate-900 border-2 border-slate-950 rounded-xl p-3 shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col justify-center">
                  <span className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest block mb-2 leading-none">Level {level}</span>
                  <div className="flex gap-2 flex-wrap">
                    {Array.from({ length: data.max }).map((_, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleSlotToggle(level, i, data.max)} 
                        disabled={isDM} 
                        className={`w-6 h-6 rounded-full border-[3px] transition-all duration-200 shrink-0 ${i < data.current ? 'bg-fuchsia-500 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] cursor-pointer' : 'bg-slate-800 border-slate-900 cursor-pointer'}`} 
                        title={i < data.current ? "Click to expend" : "Click to regain"} 
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <div className="bg-slate-800 border-[3px] border-slate-950 rounded-2xl p-4 md:p-5 shadow-[6px_6px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <div className="flex justify-between items-center px-1 border-b-2 border-slate-900 pb-3 mb-4">
          <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-widest drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]"><BookOpen className="w-5 h-5 text-fuchsia-500" /> Grimoire</h3>
          {isDM && (
            <button 
              onClick={() => {
                setEditingSpell(null);
                setCustomSpell({ name: '', level: 0, castTime: '1 Action', range: '60 feet', components: 'V, S', duration: 'Instantaneous', desc: '' });
                setIsForgingSpell(!isForgingSpell);
              }}
              className={`text-[10px] md:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all border-2 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] ${isForgingSpell && !editingSpell ? 'bg-fuchsia-600 border-slate-950 text-white' : 'bg-slate-900 border-slate-950 text-fuchsia-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Hammer className="w-3.5 h-3.5" /> {(isForgingSpell && !editingSpell) ? 'Close' : 'Add Spell'}
            </button>
          )}
        </div>

        {spells.length > 0 && (
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-3 mb-2">
            <Filter className="w-4 h-4 text-slate-500 shrink-0 my-auto mr-1" />
            {SPELL_FILTERS.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] ${activeFilter === filter ? 'bg-fuchsia-600 text-white border-slate-950' : 'bg-slate-900 text-slate-400 border-slate-950 hover:bg-slate-800 hover:text-white'}`}
              >
                {filter}
              </button>
            ))}
          </div>
        )}

        {isDM && isForgingSpell && (
          <form onSubmit={handleForgeCustomSpell} className="bg-slate-900 border-2 border-fuchsia-950 p-5 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] mb-6 animate-in fade-in slide-in-from-top-2 space-y-4">
            <div className="flex justify-between items-center border-b-2 border-slate-950 pb-2 mb-3">
              <h4 className="text-sm font-black text-fuchsia-400 flex items-center gap-2 uppercase tracking-widest">
                {editingSpell ? <Edit3 className="w-4 h-4" /> : <Hammer className="w-4 h-4" />} 
                {editingSpell ? 'Edit Spell' : 'Spell Forge'}
              </h4>
              {editingSpell && (
                 <button type="button" onClick={() => { setEditingSpell(null); setIsForgingSpell(false); }} className="text-slate-500 hover:text-white">
                   <X className="w-4 h-4 font-black" />
                 </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="sm:col-span-2 relative">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Search className="w-3 h-3"/> SRD Search / Name</label>
                <input type="text" required value={customSpell.name} onChange={handleSpellNameChange} className="w-full bg-slate-950 border-2 border-slate-800 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-fuchsia-500 shadow-inner" placeholder="e.g. Fireball" />
                
                {showSpellDropdown && filteredSrdSpells.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto custom-scrollbar bg-slate-900 border-2 border-slate-950 rounded-lg shadow-[4px_4px_0px_rgba(0,0,0,1)] z-50">
                    {filteredSrdSpells.map(item => (
                      <div key={item.index} onClick={() => handleSelectSrdSpell(item.index)} className="px-3 py-2.5 text-sm font-bold text-slate-300 hover:bg-fuchsia-600 hover:text-white cursor-pointer border-b border-slate-800 last:border-0 transition-colors">
                        {item.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Spell Level</label>
                <select value={customSpell.level} onChange={e => setCustomSpell({...customSpell, level: e.target.value})} className="w-full bg-slate-950 border-2 border-slate-800 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-fuchsia-500 shadow-inner">
                  <option value="0">Cantrip (0)</option>
                  {[1,2,3,4,5,6,7,8,9].map(l => <option key={l} value={l}>Level {l}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Casting Time</label>
                <input type="text" onFocus={(e) => e.target.select()} required value={customSpell.castTime} onChange={e => setCustomSpell({...customSpell, castTime: e.target.value})} className="w-full bg-slate-950 border-2 border-slate-800 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-fuchsia-500 shadow-inner" placeholder="1 Action" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Range</label>
                <input type="text" onFocus={(e) => e.target.select()} value={customSpell.range} onChange={e => setCustomSpell({...customSpell, range: e.target.value})} className="w-full bg-slate-950 border-2 border-slate-800 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-fuchsia-500 shadow-inner" placeholder="60 feet" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Components</label>
                <input type="text" onFocus={(e) => e.target.select()} value={customSpell.components} onChange={e => setCustomSpell({...customSpell, components: e.target.value})} className="w-full bg-slate-950 border-2 border-slate-800 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-fuchsia-500 shadow-inner" placeholder="V, S" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Duration</label>
                <input type="text" onFocus={(e) => e.target.select()} value={customSpell.duration} onChange={e => setCustomSpell({...customSpell, duration: e.target.value})} className="w-full bg-slate-950 border-2 border-slate-800 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-fuchsia-500 shadow-inner" placeholder="Instant" />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Description</label>
              <textarea required value={customSpell.desc} onChange={e => setCustomSpell({...customSpell, desc: e.target.value})} className="w-full min-h-[100px] bg-slate-950 border-2 border-slate-800 rounded-lg px-3 py-3 text-slate-300 font-medium focus:outline-none focus:border-fuchsia-500 resize-y shadow-inner leading-relaxed" placeholder="Spell effects..." />
            </div>

            <button type="submit" className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-slate-950 font-black uppercase tracking-widest text-xs py-3.5 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center gap-2 border-2 border-slate-950">
              {editingSpell ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />} 
              {editingSpell ? 'Save Changes' : 'Inject into Grimoire'}
            </button>
          </form>
        )}

        {Object.keys(groupedSpells).length === 0 ? (
          <div className="bg-slate-900 border-2 border-slate-950 border-dashed rounded-xl p-8 text-center text-slate-500 font-bold uppercase tracking-widest shadow-inner">
            {spells.length === 0 ? (isDM ? 'Forge spells here.' : 'No magic inscribed.') : 'No spells match this filter.'}
          </div>
        ) : (
          sortedLevelNames.map((levelName) => {
            const levelSpells = groupedSpells[levelName];
            return (
              <CollapsibleSection 
                key={levelName} 
                title={`${levelName} (${levelSpells.length})`} 
                icon={Sparkles} 
                defaultOpen={levelName === 'Cantrips' || levelName === highestLevelName || activeFilter !== 'All'}
              >
                <div className="grid grid-cols-1 gap-4">
                  {levelSpells.map((spell, idx) => {
                    const canCastAny = levelName === 'Cantrips' || Object.values(spellSlots).some(s => s.current > 0);
                    const isConcentration = (spell.desc || '').toLowerCase().includes('concentration') || (spell.duration || '').toLowerCase().includes('concentration');
                    
                    return (
                      <div key={idx} className="bg-slate-900 border-2 border-slate-950 rounded-xl p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col transition-all">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                          <div>
                            <h4 className="font-black text-fuchsia-300 text-xl flex items-center gap-2 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] mb-2 leading-none">
                              {spell.name}
                              {isDM && (
                                <div className="flex items-center gap-1 ml-1">
                                  <button 
                                    onClick={() => handleEditClick(spell)}
                                    className="text-slate-500 hover:text-indigo-400 hover:bg-indigo-950 border-2 border-slate-950 bg-slate-950 p-1.5 rounded-lg transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px]"
                                    title="Edit Spell"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button 
                                    onClick={() => removeSpellFromGrimoire(spell)}
                                    className="text-slate-500 hover:text-red-500 hover:bg-red-950 border-2 border-slate-950 bg-slate-950 p-1.5 rounded-lg transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px]"
                                    title="Delete Spell"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </h4>
                            <div className="flex gap-1.5 flex-wrap">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-950 border border-slate-800 px-2 py-0.5 rounded shadow-inner">{spell.castTime || spell.castingTime || spell.casting_time || '1 Action'}</span>
                               {spell.range && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-950 border border-slate-800 px-2 py-0.5 rounded shadow-inner">{spell.range}</span>}
                               {spell.duration && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-950 border border-slate-800 px-2 py-0.5 rounded shadow-inner">{spell.duration}</span>}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 shrink-0">
                            {!isDM && spell.level > 0 && (
                              <button 
                                onClick={() => setSpellToCast(spell)}
                                disabled={!canCastAny}
                                className={`text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 border-2 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] ${canCastAny ? 'bg-fuchsia-600 border-slate-950 hover:bg-fuchsia-500 text-white cursor-pointer' : 'bg-slate-800 border-slate-900 text-slate-600 cursor-not-allowed'}`}
                              >
                                <Wand2 className="w-3 h-3" /> {canCastAny ? 'Cast' : 'No Slots'}
                              </button>
                            )}
                            {!isDM && isConcentration && (
                              <button 
                                onClick={toggleConcentration}
                                className={`text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 border-2 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] ${char.isConcentrating ? 'bg-amber-400 border-slate-950 text-slate-950 cursor-pointer animate-pulse' : 'bg-slate-800 border-slate-950 text-amber-500 hover:bg-slate-700 cursor-pointer'}`}
                              >
                                <BrainCircuit className="w-3 h-3" /> Conc.
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] md:text-xs text-slate-300 font-medium leading-relaxed whitespace-pre-wrap bg-slate-950/50 p-3 rounded-lg border border-slate-800/50 shadow-inner mt-2">{spell.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleSection>
            );
          })
        )}
      </div>
    </div>
  );
}