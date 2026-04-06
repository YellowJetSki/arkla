import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Skull, X, Shield, Heart, Wind, Swords, Search, Loader2, Plus, Wand2 } from 'lucide-react';
import DialogModal from './shared/DialogModal';
import ImageSelector from './shared/ImageSelector';
import { applySanctuaryFilter } from '../services/arklaEngine';
import { fetchAllSpells, fetchSpellDetails } from '../services/srdApi';

export default function EnemyForge({ onClose }) {
  const [activeTab, setActiveTab] = useState('custom'); 
  const [isSaving, setIsSaving] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  const [enemy, setEnemy] = useState({
    name: '', size: 'Medium', type: 'Humanoid', alignment: 'Unaligned', challenge_rating: 1,
    ac: 10, hp: 10, speed: '30 ft.',
    stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    saves: '', skills: '', vulnerabilities: '', resistances: '', immunities: '', conditionImmunities: '',
    senses: 'passive Perception 10', languages: '--',
    traits: '', actions: '', reactions: '',
    imageUrl: '', tokenUrl: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [srdEnemies, setSrdEnemies] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Spell Injector State
  const [srdSpells, setSrdSpells] = useState([]);
  const [spellSearch, setSpellSearch] = useState('');
  const [filteredSpells, setFilteredSpells] = useState([]);
  const [showSpellDropdown, setShowSpellDropdown] = useState(false);

  useEffect(() => {
    fetchAllSpells().then(setSrdSpells);
  }, []);

  // API Search Debouncer
  useEffect(() => {
    const delayFn = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setIsSearching(true);
        try {
          const res = await fetch(`https://www.dnd5eapi.co/api/monsters/?name=${encodeURIComponent(searchQuery.trim())}`);
          const data = await res.json();
          setSrdEnemies(data.results || []);
        } catch (err) {
          console.error(err);
        }
        setIsSearching(false);
      } else {
        setSrdEnemies([]);
      }
    }, 500); 
    return () => clearTimeout(delayFn);
  }, [searchQuery]);

  const handleSpellSearchChange = (e) => {
    const val = e.target.value;
    setSpellSearch(val);
    if (val.length > 1) {
      setFilteredSpells(srdSpells.filter(s => s.name.toLowerCase().includes(val.toLowerCase())));
      setShowSpellDropdown(true);
    } else {
      setShowSpellDropdown(false);
    }
  };

  const handleInjectSpell = async (indexStr, targetField) => {
    setShowSpellDropdown(false);
    setSpellSearch('');
    const details = await fetchSpellDetails(indexStr);
    if (details) {
      const spellText = `***${details.name}.*** *Level ${details.level} ${details.school}*.\n**Casting Time:** ${details.castingTime}\n**Range:** ${details.range}\n**Components:** ${details.components}\n**Duration:** ${details.duration}\n\n${details.desc}`;
      setEnemy(prev => ({
        ...prev,
        [targetField]: prev[targetField] ? `${prev[targetField]}\n\n${spellText}` : spellText
      }));
    }
  };

  const handleStatChange = (stat, val) => {
    setEnemy(prev => ({ ...prev, stats: { ...prev.stats, [stat]: Number(val) } }));
  };

  const handleSaveCustom = async (e) => {
    e.preventDefault();
    if (!enemy.name) {
      setDialog({ isOpen: true, title: 'Missing Name', message: 'The monster needs a name.', type: 'alert' });
      return;
    }

    setIsSaving(true);
    try {
      let tokenSize = 1;
      if (enemy.size === 'Large') tokenSize = 2;
      if (enemy.size === 'Huge') tokenSize = 3;
      if (enemy.size === 'Gargantuan') tokenSize = 4;

      const newEnemyId = `enemy_${Date.now()}`;

      const newEnemy = {
        ...enemy,
        id: newEnemyId,
        flavor: `${enemy.size} ${enemy.type}, ${enemy.alignment}`,
        ac: Number(enemy.ac),
        hp: Number(enemy.hp),
        currentHp: Number(enemy.hp),
        maxHp: Number(enemy.hp),
        challenge_rating: Number(enemy.challenge_rating),
        size: tokenSize,
        conditions: [],
        actions: enemy.actions ? [{ name: 'Actions', desc: enemy.actions }] : [],
        reactions: enemy.reactions ? [{ name: 'Reactions', desc: enemy.reactions }] : [],
        special_abilities: enemy.traits ? [{ name: 'Traits', desc: enemy.traits }] : [],
        features: enemy.traits ? [{ name: 'Traits', desc: enemy.traits }] : [], 
        img: enemy.tokenUrl || enemy.imageUrl || '/icon.png',
        isHomebrew: true
      };

      const batch = writeBatch(db);

      // 1. Save directly to active_enemies so it populates the Threats panel
      const enemyRef = doc(db, 'active_enemies', newEnemyId);
      batch.set(enemyRef, newEnemy);

      // 2. Instantly deploy token to the Battlemap
      const mapRef = doc(db, 'campaign', 'battlemap');
      const mapSnap = await getDoc(mapRef);
      if (mapSnap.exists()) {
        const mapTokens = mapSnap.data().tokens || {};
        mapTokens[newEnemyId] = {
          id: newEnemyId,
          type: 'enemy',
          x: 0,
          y: 0,
          size: tokenSize,
          hp: Number(enemy.hp),
          maxHp: Number(enemy.hp),
          img: newEnemy.img,
          conditions: [],
          name: enemy.name.split(' ')[0] || 'Unknown'
        };
        batch.update(mapRef, { tokens: mapTokens });
      }

      await batch.commit();
      onClose();
    } catch (error) {
      console.error("Error forging enemy:", error);
      setDialog({ isOpen: true, title: 'Forge Error', message: 'Failed to summon enemy.', type: 'alert' });
    } finally {
      setIsSaving(false);
    }
  };

  const loadApiEnemyIntoForge = async (url) => {
    setIsSaving(true);
    try {
      const res = await fetch(`https://www.dnd5eapi.co${url}`);
      const data = await res.json();

      const profs = data.proficiencies || [];
      const savesList = profs.filter(p => p.proficiency.index.startsWith('saving-throw-')).map(p => `${p.proficiency.name.split(' ').pop()} +${p.value}`).join(', ');
      const skillsList = profs.filter(p => p.proficiency.index.startsWith('skill-')).map(p => `${p.proficiency.name.replace('Skill: ', '')} +${p.value}`).join(', ');

      const formattedTraits = (data.special_abilities || []).map(f => `${f.name}. ${f.desc}`).join('\n\n');
      const formattedActions = (data.actions || []).map(a => `${a.name}. ${a.desc}`).join('\n\n');
      const formattedReactions = (data.reactions || []).map(r => `${r.name}. ${r.desc}`).join('\n\n');

      setEnemy({
        name: applySanctuaryFilter(data.name),
        size: data.size || 'Medium',
        type: data.type || 'Humanoid',
        alignment: data.alignment || 'Unaligned',
        challenge_rating: data.challenge_rating || 1,
        ac: data.armor_class?.[0]?.value || 10,
        hp: data.hit_points || 10,
        speed: data.speed?.walk || '30 ft.',
        stats: {
          STR: data.strength || 10,
          DEX: data.dexterity || 10,
          CON: data.constitution || 10,
          INT: data.intelligence || 10,
          WIS: data.wisdom || 10,
          CHA: data.charisma || 10
        },
        saves: savesList,
        skills: skillsList,
        vulnerabilities: (data.damage_vulnerabilities || []).join(', '),
        resistances: (data.damage_resistances || []).join(', '),
        immunities: (data.damage_immunities || []).join(', '),
        conditionImmunities: (data.condition_immunities || []).map(c => c.name).join(', '),
        senses: `passive Perception ${data.senses?.passive_perception || 10}`,
        languages: data.languages || '--',
        traits: applySanctuaryFilter(formattedTraits),
        actions: applySanctuaryFilter(formattedActions),
        reactions: applySanctuaryFilter(formattedReactions),
        imageUrl: data.image ? `https://www.dnd5eapi.co${data.image}` : '',
        tokenUrl: data.image ? `https://www.dnd5eapi.co${data.image}` : ''
      });

      setActiveTab('custom');
    } catch (err) {
      console.error(err);
      setDialog({ isOpen: true, title: 'Import Error', message: 'Failed to load monster data into the forge.', type: 'alert' });
    }
    setIsSaving(false);
  };

  return (
    <>
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onCancel={closeDialog} />

      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md h-[100dvh] overflow-hidden animate-in fade-in duration-300">
        <div className="bg-slate-900 border-[3px] border-slate-950 rounded-3xl w-full max-w-5xl shadow-[12px_12px_0px_rgba(0,0,0,1)] flex flex-col max-h-[90dvh] relative overflow-hidden animate-in zoom-in-95 duration-500">
          
          <div className="p-4 border-b-[3px] border-slate-950 flex justify-between items-center bg-red-600 rounded-t-xl shrink-0 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
               <h2 className="text-xl font-black text-slate-950 flex items-center gap-2 uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,0.3)]">
                 <Skull className="w-6 h-6" /> Monster Forge
               </h2>
               <div className="flex bg-red-700 rounded-xl p-1 border-2 border-slate-950 shadow-inner">
                 <button onClick={() => setActiveTab('custom')} className={`px-4 py-1.5 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg transition-colors ${activeTab === 'custom' ? 'bg-slate-950 text-red-500 shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'text-slate-950 hover:bg-red-500'}`}>Custom Board</button>
                 <button onClick={() => setActiveTab('api')} className={`px-4 py-1.5 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg transition-colors ${activeTab === 'api' ? 'bg-slate-950 text-red-500 shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'text-slate-950 hover:bg-red-500'}`}>API Search</button>
               </div>
            </div>
            <button onClick={onClose} className="text-slate-950 bg-red-500 hover:bg-red-400 transition-colors p-2 rounded-xl border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"><X className="w-5 h-5 font-black" /></button>
          </div>

          <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
            
            {activeTab === 'custom' ? (
              <form onSubmit={handleSaveCustom} className="space-y-6 animate-in fade-in">
                
                <div className="bg-slate-950 p-5 rounded-2xl border-[3px] border-slate-900 shadow-inner">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="sm:col-span-2 lg:col-span-4">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Monster Name</label>
                      <input type="text" value={enemy.name} onChange={e => setEnemy({...enemy, name: e.target.value})} className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl px-4 py-3 text-white text-lg font-black focus:outline-none focus:border-red-500 shadow-inner" placeholder="e.g. The Brevar Chieftain" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Size</label>
                      <select value={enemy.size} onChange={e => setEnemy({...enemy, size: e.target.value})} className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl px-3 py-3 text-white font-bold text-sm focus:outline-none focus:border-red-500 shadow-inner">
                        {['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Type</label>
                      <input type="text" value={enemy.type} onChange={e => setEnemy({...enemy, type: e.target.value})} className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl px-3 py-3 text-white font-bold text-sm focus:outline-none focus:border-red-500 shadow-inner" placeholder="e.g. Undead" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Alignment</label>
                      <input type="text" value={enemy.alignment} onChange={e => setEnemy({...enemy, alignment: e.target.value})} className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl px-3 py-3 text-white font-bold text-sm focus:outline-none focus:border-red-500 shadow-inner" placeholder="e.g. Chaotic Evil" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Challenge Rating</label>
                      <input type="number" value={enemy.challenge_rating} onChange={e => setEnemy({...enemy, challenge_rating: e.target.value})} className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl px-3 py-3 text-white font-bold text-sm focus:outline-none focus:border-red-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 bg-slate-900 p-5 rounded-2xl border-[3px] border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                  <div>
                    <label className="flex items-center justify-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2"><Heart className="w-4 h-4 text-red-500 drop-shadow-sm" /> HP</label>
                    <input type="number" value={enemy.hp} onChange={e => setEnemy({...enemy, hp: e.target.value})} className="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-3 py-3 text-white text-center font-black text-2xl focus:outline-none focus:border-red-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" />
                  </div>
                  <div>
                    <label className="flex items-center justify-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2"><Shield className="w-4 h-4 text-amber-500 drop-shadow-sm" /> AC</label>
                    <input type="number" value={enemy.ac} onChange={e => setEnemy({...enemy, ac: e.target.value})} className="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-3 py-3 text-white text-center font-black text-2xl focus:outline-none focus:border-red-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" />
                  </div>
                  <div>
                    <label className="flex items-center justify-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2"><Wind className="w-4 h-4 text-sky-400 drop-shadow-sm" /> Speed</label>
                    <input type="text" value={enemy.speed} onChange={e => setEnemy({...enemy, speed: e.target.value})} className="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-3 py-3 text-white text-center font-black text-xl focus:outline-none focus:border-red-500 shadow-inner" placeholder="30 ft." />
                  </div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border-[3px] border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Ability Scores</label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
                    {Object.keys(enemy.stats).map(stat => (
                      <div key={stat} className="bg-slate-950 border-2 border-slate-900 rounded-xl p-3 flex flex-col items-center shadow-inner">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat}</span>
                        <input 
                          type="number" 
                          value={enemy.stats[stat]} 
                          onChange={(e) => handleStatChange(stat, e.target.value)}
                          className="w-full bg-transparent text-white font-black text-3xl text-center focus:outline-none focus:text-red-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-950 p-5 rounded-2xl border-[3px] border-slate-900 shadow-inner">
                  <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Saving Throws</label><input type="text" value={enemy.saves} onChange={e => setEnemy({...enemy, saves: e.target.value})} className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-red-500 shadow-inner" placeholder="e.g. Dex +5, Con +4" /></div>
                  <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Skills</label><input type="text" value={enemy.skills} onChange={e => setEnemy({...enemy, skills: e.target.value})} className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-red-500 shadow-inner" placeholder="e.g. Stealth +6, Perception +4" /></div>
                  <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Damage Resistances</label><input type="text" value={enemy.resistances} onChange={e => setEnemy({...enemy, resistances: e.target.value})} className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-red-500 shadow-inner" placeholder="e.g. Cold, Fire" /></div>
                  <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Damage Immunities</label><input type="text" value={enemy.immunities} onChange={e => setEnemy({...enemy, immunities: e.target.value})} className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-red-500 shadow-inner" placeholder="e.g. Poison" /></div>
                  <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Senses</label><input type="text" value={enemy.senses} onChange={e => setEnemy({...enemy, senses: e.target.value})} className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-red-500 shadow-inner" placeholder="e.g. Darkvision 60 ft." /></div>
                  <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Languages</label><input type="text" value={enemy.languages} onChange={e => setEnemy({...enemy, languages: e.target.value})} className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-red-500 shadow-inner" placeholder="e.g. Common, Goblin" /></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Actions & Traits */}
                  <div className="lg:col-span-2 space-y-5">
                    <div className="bg-slate-900 p-5 rounded-2xl border-[3px] border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                      <label className="block text-sm font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]"><Swords className="w-5 h-5 text-red-500" /> Actions & Attacks</label>
                      <textarea value={enemy.actions} onChange={e => setEnemy({...enemy, actions: e.target.value})} className="w-full h-48 bg-slate-950 border-2 border-slate-900 rounded-xl px-4 py-4 text-slate-300 font-medium text-sm focus:outline-none focus:border-red-500 shadow-inner resize-y custom-scrollbar leading-relaxed" placeholder="Multiattack. The Brevar makes two attacks..." />
                    </div>
                    <div className="bg-slate-900 p-5 rounded-2xl border-[3px] border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                      <label className="block text-sm font-black text-white uppercase tracking-widest mb-3 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">Traits & Passive Abilities</label>
                      <textarea value={enemy.traits} onChange={e => setEnemy({...enemy, traits: e.target.value})} className="w-full h-48 bg-slate-950 border-2 border-slate-900 rounded-xl px-4 py-4 text-slate-300 font-medium text-sm focus:outline-none focus:border-red-500 shadow-inner resize-y custom-scrollbar leading-relaxed" placeholder="Pack Tactics. The creature has advantage..." />
                    </div>
                  </div>

                  {/* Right Column: Spell Injector */}
                  <div className="bg-slate-900 p-5 rounded-2xl border-[3px] border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] h-fit">
                    <label className="text-sm font-black text-fuchsia-400 uppercase tracking-widest mb-3 flex items-center gap-2 border-b-2 border-slate-950 pb-2 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                      <Wand2 className="w-5 h-5" /> Spell Injector
                    </label>
                    <p className="text-[10px] font-bold text-slate-400 mb-4 leading-relaxed uppercase tracking-wider">Search the SRD to seamlessly append full spell mechanics into this monster's stat block.</p>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 font-black" />
                      <input 
                        type="text" 
                        value={spellSearch} 
                        onChange={handleSpellSearchChange} 
                        placeholder="Search Spells..." 
                        className="w-full bg-slate-950 border-2 border-slate-900 rounded-xl pl-9 pr-3 py-3 text-white font-bold text-sm focus:outline-none focus:border-fuchsia-500 shadow-inner" 
                      />
                      {showSpellDropdown && filteredSpells.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 max-h-64 overflow-y-auto custom-scrollbar bg-slate-900 border-[3px] border-slate-950 rounded-xl shadow-[8px_8px_0px_rgba(0,0,0,1)] z-50">
                          {filteredSpells.map(s => (
                            <div key={s.index} className="px-4 py-3 text-sm font-bold text-slate-300 hover:bg-fuchsia-600 hover:text-white border-b-2 border-slate-950 last:border-0 flex flex-col gap-2 group transition-colors">
                              <span className="font-black uppercase tracking-wider drop-shadow-sm">{s.name}</span>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity h-0 group-hover:h-auto overflow-hidden">
                                <button type="button" onClick={() => handleInjectSpell(s.index, 'actions')} className="flex-1 bg-slate-950 hover:bg-white hover:text-fuchsia-600 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all">To Actions</button>
                                <button type="button" onClick={() => handleInjectSpell(s.index, 'traits')} className="flex-1 bg-slate-950 hover:bg-white hover:text-fuchsia-600 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all">To Traits</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-900 p-5 rounded-2xl border-[3px] border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                  <ImageSelector 
                    label="Monster Artwork"
                    value={enemy.imageUrl}
                    onChange={(val) => setEnemy({...enemy, imageUrl: val})}
                    iconColor="text-red-500"
                    inputClassName="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-red-500 shadow-inner"
                  />
                  <ImageSelector 
                    label="Battle Token"
                    value={enemy.tokenUrl}
                    onChange={(val) => setEnemy({...enemy, tokenUrl: val})}
                    iconColor="text-red-500"
                    inputClassName="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-red-500 shadow-inner"
                  />
                </div>
                
                <button type="submit" disabled={isSaving} className="w-full bg-red-600 hover:bg-red-500 text-slate-950 font-black uppercase tracking-widest text-sm py-5 rounded-xl transition-all border-[3px] border-slate-950 shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-y-[6px] active:shadow-none mt-4">
                  {isSaving ? 'Summoning...' : 'Deploy to Board & Threats'}
                </button>
              </form>
            ) : (
              <div className="space-y-6 animate-in fade-in">
                <div className="relative max-w-2xl mx-auto">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 font-black" />
                  <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    placeholder="Search Bestiary for template..." 
                    className="w-full bg-slate-950 border-[3px] border-slate-950 rounded-2xl pl-12 pr-4 py-4 text-white font-black focus:outline-none focus:border-red-500 shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)]" 
                  />
                </div>
                
                {isSearching ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-10 h-10 text-red-500 animate-spin" /></div>
                ) : (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {srdEnemies.map(s => (
                      <div key={s.index} className="bg-slate-900 p-5 rounded-2xl border-[3px] border-slate-950 flex flex-col sm:flex-row gap-4 justify-between sm:items-center group shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:border-red-500 transition-colors">
                        <span className="font-black text-white flex items-center gap-3 text-lg uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]"><Skull className="w-6 h-6 text-red-500"/> {s.name}</span>
                        <button onClick={() => loadApiEnemyIntoForge(s.url)} disabled={isSaving} className="bg-red-600 hover:bg-red-500 text-slate-950 px-5 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest border-2 border-slate-950 transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none w-full sm:w-auto">
                          <Plus className="w-4 h-4 font-black"/> Load as Template
                        </button>
                      </div>
                    ))}
                    {searchQuery && srdEnemies.length === 0 && <p className="text-center text-slate-500 font-bold uppercase tracking-widest p-8 border-[3px] border-dashed border-slate-900 rounded-2xl">No monsters found.</p>}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}