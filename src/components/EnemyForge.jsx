import React, { useState } from 'react';
import { Skull, Shield, Activity, Swords, Plus, Trash2, Save, X, Target, Brain, Eye } from 'lucide-react';

export default function EnemyForge({ onSave, onClose }) {
  const [activeTab, setActiveTab] = useState('core');

  const [enemy, setEnemy] = useState({
    name: '',
    size: 'Medium',
    type: 'humanoid',
    alignment: 'unaligned',
    ac: 10,
    acType: 'natural armor',
    hp: 11,
    hpDice: '2d8 + 2',
    speed: '30 ft.',
    stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    cr: '1',
    senses: 'passive Perception 10',
    languages: 'Any one language (usually Common)',
    traits: [], 
    actions: [] 
  });

  const [newTrait, setNewTrait] = useState({ name: '', desc: '' });
  const [newAction, setNewAction] = useState({ name: '', desc: '', hitBonus: '', damageDice: '', damageType: '' });

  const handleStatChange = (stat, value) => {
    setEnemy(prev => ({
      ...prev,
      stats: { ...prev.stats, [stat]: parseInt(value, 10) || 0 }
    }));
  };

  const addTrait = (e) => {
    e.preventDefault();
    if (!newTrait.name || !newTrait.desc) return;
    setEnemy(prev => ({
      ...prev,
      traits: [...prev.traits, { ...newTrait }]
    }));
    setNewTrait({ name: '', desc: '' });
  };

  const addAction = (e) => {
    e.preventDefault();
    if (!newAction.name || !newAction.desc) return;
    
    const formattedAction = {
      name: newAction.name,
      desc: newAction.desc,
      attack_bonus: parseInt(newAction.hitBonus, 10) || 0,
      damage: newAction.damageDice ? [{
        damage_dice: newAction.damageDice,
        damage_type: { name: newAction.damageType || 'Bludgeoning' }
      }] : []
    };

    setEnemy(prev => ({
      ...prev,
      actions: [...prev.actions, formattedAction]
    }));
    setNewAction({ name: '', desc: '', hitBonus: '', damageDice: '', damageType: '' });
  };

  const removeListItem = (type, index) => {
    setEnemy(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!enemy.name) return;

    const formattedEnemy = {
      name: enemy.name,
      size: enemy.size,
      type: enemy.type,
      alignment: enemy.alignment,
      armor_class: [{ type: enemy.acType, value: parseInt(enemy.ac, 10) }],
      hit_points: parseInt(enemy.hp, 10),
      hit_points_roll: enemy.hpDice,
      speed: { walk: enemy.speed },
      strength: enemy.stats.STR,
      dexterity: enemy.stats.DEX,
      constitution: enemy.stats.CON,
      intelligence: enemy.stats.INT,
      wisdom: enemy.stats.WIS,
      charisma: enemy.stats.CHA,
      challenge_rating: enemy.cr,
      senses: { special: enemy.senses },
      languages: enemy.languages,
      special_abilities: enemy.traits,
      actions: enemy.actions,
      isHomebrew: true,
      id: `hb_monster_${Date.now()}`
    };

    onSave(formattedEnemy);
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="bg-slate-900/90 backdrop-blur-2xl border border-red-500/40 rounded-3xl w-full max-w-4xl shadow-[0_0_60px_rgba(220,38,38,0.2)] flex flex-col max-h-[90dvh] relative overflow-hidden animate-in zoom-in-95 duration-500">
        
        <div className="p-5 border-b border-slate-700/80 flex justify-between items-center bg-slate-900/50 shrink-0 relative z-10">
          <h2 className="text-xl font-black text-red-400 flex items-center gap-3 uppercase tracking-widest drop-shadow-sm">
            <Skull className="w-6 h-6" /> Monster Forge
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl border border-slate-700 hover:border-red-500/50 shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex bg-slate-950/80 border-b border-slate-800/80 p-2 shrink-0 relative z-10">
          <button onClick={() => setActiveTab('core')} className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${activeTab === 'core' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Core Identity</button>
          <button onClick={() => setActiveTab('stats')} className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${activeTab === 'stats' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Attributes</button>
          <button onClick={() => setActiveTab('actions')} className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${activeTab === 'actions' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>Traits & Actions</button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative z-10">
          
          {activeTab === 'core' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-in fade-in slide-in-from-bottom-2">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Monster Name</label>
                <input type="text" onFocus={(e) => e.target.select()} value={enemy.name} onChange={e => setEnemy({...enemy, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-red-500 shadow-inner" placeholder="e.g. Ancient Blood Fiend" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Size</label>
                <select value={enemy.size} onChange={e => setEnemy({...enemy, size: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 shadow-inner">
                  {['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Type & Alignment</label>
                <div className="flex gap-2">
                  <input type="text" onFocus={(e) => e.target.select()} value={enemy.type} onChange={e => setEnemy({...enemy, type: e.target.value})} className="w-1/2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-red-500 shadow-inner" placeholder="Type (e.g. fiend)" />
                  <input type="text" onFocus={(e) => e.target.select()} value={enemy.alignment} onChange={e => setEnemy({...enemy, alignment: e.target.value})} className="w-1/2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-red-500 shadow-inner" placeholder="Alignment" />
                </div>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 flex flex-col gap-4 shadow-inner">
                <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest border-b border-slate-700/50 pb-2"><Shield className="w-4 h-4 text-emerald-400" /> Defenses</h3>
                <div className="flex gap-3">
                  <div className="w-1/3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">AC</label>
                    <input type="number" onFocus={(e) => e.target.select()} value={enemy.ac} onChange={e => setEnemy({...enemy, ac: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-black text-center focus:outline-none focus:border-emerald-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  </div>
                  <div className="w-2/3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Armor Type</label>
                    <input type="text" onFocus={(e) => e.target.select()} value={enemy.acType} onChange={e => setEnemy({...enemy, acType: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 shadow-inner" placeholder="e.g. natural armor" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 flex flex-col gap-4 shadow-inner">
                <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest border-b border-slate-700/50 pb-2"><Activity className="w-4 h-4 text-red-400" /> Vitality</h3>
                <div className="flex gap-3">
                  <div className="w-1/3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Avg HP</label>
                    <input type="number" onFocus={(e) => e.target.select()} value={enemy.hp} onChange={e => setEnemy({...enemy, hp: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-black text-center focus:outline-none focus:border-red-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  </div>
                  <div className="w-2/3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Hit Dice Formula</label>
                    <input type="text" onFocus={(e) => e.target.select()} value={enemy.hpDice} onChange={e => setEnemy({...enemy, hpDice: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 shadow-inner" placeholder="e.g. 2d8 + 2" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Speed</label>
                <input type="text" onFocus={(e) => e.target.select()} value={enemy.speed} onChange={e => setEnemy({...enemy, speed: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500 shadow-inner" placeholder="e.g. 30 ft., fly 60 ft." />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Challenge Rating (CR)</label>
                <input type="text" onFocus={(e) => e.target.select()} value={enemy.cr} onChange={e => setEnemy({...enemy, cr: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 shadow-inner" placeholder="e.g. 1/4 or 5" />
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 shadow-inner">
                <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest border-b border-slate-700/50 pb-3 mb-5"><Brain className="w-5 h-5 text-fuchsia-400" /> Base Attributes</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {Object.keys(enemy.stats).map(stat => (
                    <div key={stat} className="bg-slate-950 border border-slate-700 rounded-xl p-3 flex flex-col items-center shadow-inner focus-within:border-fuchsia-500 transition-colors">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat}</span>
                      <input 
                        type="number" 
                        onFocus={(e) => e.target.select()}
                        value={enemy.stats[stat]} 
                        onChange={(e) => handleStatChange(stat, e.target.value)}
                        className="w-12 bg-transparent text-white font-black text-xl text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 shadow-inner">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2"><Eye className="w-4 h-4 text-sky-400" /> Senses</label>
                  <input type="text" onFocus={(e) => e.target.select()} value={enemy.senses} onChange={e => setEnemy({...enemy, senses: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500 shadow-inner" placeholder="e.g. darkvision 60 ft., passive Perception 12" />
                </div>
                
                <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 shadow-inner">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Languages</label>
                  <input type="text" onFocus={(e) => e.target.select()} value={enemy.languages} onChange={e => setEnemy({...enemy, languages: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500 shadow-inner" placeholder="e.g. Common, Draconic" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
              
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 shadow-inner flex flex-col h-full">
                <h3 className="text-sm font-black text-amber-400 flex items-center gap-2 uppercase tracking-widest border-b border-amber-900/30 pb-2 mb-4">
                  <Target className="w-4 h-4" /> Passive Traits
                </h3>
                
                <div className="flex-1 space-y-3 mb-6">
                  {enemy.traits.length === 0 ? (
                    <p className="text-xs text-slate-500 italic bg-slate-900/50 p-4 rounded-xl border border-slate-800 border-dashed text-center">No special traits added.</p>
                  ) : (
                    enemy.traits.map((trait, i) => (
                      <div key={i} className="bg-slate-950 border border-slate-700 rounded-xl p-3 relative group shadow-sm">
                        <button onClick={() => removeListItem('traits', i)} className="absolute top-2 right-2 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 p-1.5 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                        <strong className="text-amber-300 text-sm block mb-1">{trait.name}</strong>
                        <p className="text-xs text-slate-400 leading-relaxed pr-6">{trait.desc}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={addTrait} className="bg-slate-900/80 p-4 rounded-xl border border-amber-900/50 shadow-inner mt-auto">
                  <input type="text" placeholder="Trait Name (e.g. Pack Tactics)" onFocus={(e) => e.target.select()} value={newTrait.name} onChange={e => setNewTrait({...newTrait, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs mb-2 focus:outline-none focus:border-amber-500" required />
                  <textarea placeholder="Description..." value={newTrait.desc} onChange={e => setNewTrait({...newTrait, desc: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 text-xs mb-3 h-16 resize-none focus:outline-none focus:border-amber-500" required />
                  <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"><Plus className="w-3 h-3" /> Add Trait</button>
                </form>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 shadow-inner flex flex-col h-full">
                <h3 className="text-sm font-black text-red-400 flex items-center gap-2 uppercase tracking-widest border-b border-red-900/30 pb-2 mb-4">
                  <Swords className="w-4 h-4" /> Actions & Attacks
                </h3>
                
                <div className="flex-1 space-y-3 mb-6">
                  {enemy.actions.length === 0 ? (
                    <p className="text-xs text-slate-500 italic bg-slate-900/50 p-4 rounded-xl border border-slate-800 border-dashed text-center">No actions forged yet.</p>
                  ) : (
                    enemy.actions.map((action, i) => (
                      <div key={i} className="bg-slate-950 border border-slate-700 rounded-xl p-3 relative group shadow-sm">
                        <button onClick={() => removeListItem('actions', i)} className="absolute top-2 right-2 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 p-1.5 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                        <div className="flex items-center gap-2 mb-1">
                          <strong className="text-red-300 text-sm">{action.name}</strong>
                          {action.attack_bonus > 0 && <span className="bg-slate-800 border border-slate-600 text-slate-300 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-inner">+{action.attack_bonus} to hit</span>}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed pr-6 mb-1.5">{action.desc}</p>
                        {action.damage && action.damage.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hit:</span>
                            <span className="bg-red-950/30 border border-red-900/50 text-red-300 text-xs font-bold px-2 py-0.5 rounded shadow-inner">
                              {action.damage[0].damage_dice} {action.damage[0].damage_type.name}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={addAction} className="bg-slate-900/80 p-4 rounded-xl border border-red-900/50 shadow-inner mt-auto">
                  <div className="flex gap-2 mb-2">
                    <input type="text" placeholder="Action Name (e.g. Bite)" onFocus={(e) => e.target.select()} value={newAction.name} onChange={e => setNewAction({...newAction, name: e.target.value})} className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-red-500" required />
                    <input type="number" placeholder="+Hit (Opt)" onFocus={(e) => e.target.select()} value={newAction.hitBonus} onChange={e => setNewAction({...newAction, hitBonus: e.target.value})} className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-white text-xs text-center focus:outline-none focus:border-red-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" />
                  </div>
                  <div className="flex gap-2 mb-2">
                    <input type="text" placeholder="Damage (e.g. 1d6 + 2)" onFocus={(e) => e.target.select()} value={newAction.damageDice} onChange={e => setNewAction({...newAction, damageDice: e.target.value})} className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-red-500" />
                    <input type="text" placeholder="Type (e.g. Piercing)" onFocus={(e) => e.target.select()} value={newAction.damageType} onChange={e => setNewAction({...newAction, damageType: e.target.value})} className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-red-500" />
                  </div>
                  <textarea placeholder="Description or effects..." value={newAction.desc} onChange={e => setNewAction({...newAction, desc: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 text-xs mb-3 h-12 resize-none focus:outline-none focus:border-red-500" required />
                  <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"><Plus className="w-3 h-3" /> Add Action</button>
                </form>
              </div>

            </div>
          )}

        </div>

        <div className="p-4 bg-slate-900/90 border-t border-slate-800 shrink-0 relative z-10 flex justify-end">
          <button 
            onClick={handleSubmit} 
            className="w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" /> Save to Bestiary
          </button>
        </div>

      </div>
    </div>
  );
}