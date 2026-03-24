import { useState } from 'react';
import { Zap, Settings, Trash2, Plus, ArrowUp, ArrowDown, AlertTriangle, Swords, Shield, Eye, Brain, X, PawPrint, Heart } from 'lucide-react';
import QuickTraits from '../shared/QuickTraits';
import { CONDITIONS_LIST } from '../../data/campaignData';
import CompanionForgeModal from '../CompanionForgeModal';

export default function CombatTab({ char, charId, isDM, updateField, activeTheme, combatWarnings, activeConditions, handleAddCondition, handleRemoveCondition }) {
  const [isEditingResources, setIsEditingResources] = useState(false);
  const [isCompanionModalOpen, setIsCompanionModalOpen] = useState(false);

  const wisMod = Math.floor(((char.stats?.WIS || 10) - 10) / 2);
  const passivePerception = 10 + wisMod;

  // ... [Keep existing Resource handler functions here (handleAddResource, etc.)] ...
  const handleAddResource = () => { updateField('resources', [...(char.resources || []), { name: 'New Resource', current: 1, max: 1, desc: '' }]); };
  const handleUpdateResource = (index, field, value) => {
    const updated = [...char.resources];
    if (field === 'max') { updated[index].max = Number(value); updated[index].current = Math.min(updated[index].current, updated[index].max); } 
    else { updated[index][field] = value; }
    updateField('resources', updated);
  };
  const handleRemoveResource = (index) => { updateField('resources', char.resources.filter((_, i) => i !== index)); };
  const moveResource = (index, direction) => {
    if (index + direction < 0 || index + direction >= char.resources.length) return;
    const updated = [...char.resources];
    const temp = updated[index];
    updated[index] = updated[index + direction];
    updated[index + direction] = temp;
    updateField('resources', updated);
  };

  const getDamageColor = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('fire')) return 'text-orange-400 drop-shadow-[0_0_5px_rgba(251,146,60,0.5)]';
    if (t.includes('cold')) return 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]';
    if (t.includes('necrotic')) return 'text-purple-400 drop-shadow-[0_0_5px_rgba(192,132,252,0.5)]';
    if (t.includes('radiant')) return 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]';
    return 'text-slate-300';
  };

  const adjustCompanionHp = (amount) => {
    if (!char.companion) return;
    const current = char.companion.hp || 0;
    const newHp = Math.max(0, Math.min(char.companion.maxHp, current + amount));
    updateField('companion', { ...char.companion, hp: newHp });
  };

  return (
    <>
      {isCompanionModalOpen && <CompanionForgeModal char={char} charId={charId} onClose={() => setIsCompanionModalOpen(false)} />}

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-bold text-white flex items-center gap-2`}><Zap className={`w-5 h-5 ${activeTheme.text}`} /> Resources</h3>
          {!isDM && (
            <button onClick={() => setIsEditingResources(!isEditingResources)} className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border ${isEditingResources ? `${activeTheme.bg} border-transparent text-white` : `bg-slate-900 border-slate-700 ${activeTheme.text} hover:bg-slate-700`}`}>
              <Settings className="w-3 h-3" /> {isEditingResources ? 'Done Editing' : 'Edit Resources'}
            </button>
          )}
        </div>

        {isEditingResources ? (
          <div className="space-y-4 animate-in fade-in">
            {(char.resources || []).map((res, i) => (
              <div key={`res-edit-${i}`} className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-3 relative group">
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  <button onClick={() => moveResource(i, -1)} disabled={i === 0} className="text-slate-500 hover:text-white disabled:opacity-30 bg-slate-800 p-1.5 rounded-lg transition-colors"><ArrowUp className="w-4 h-4" /></button>
                  <button onClick={() => moveResource(i, 1)} disabled={i === char.resources.length - 1} className="text-slate-500 hover:text-white disabled:opacity-30 bg-slate-800 p-1.5 rounded-lg transition-colors"><ArrowDown className="w-4 h-4" /></button>
                  <button onClick={() => handleRemoveResource(i)} className="text-slate-500 hover:text-red-400 transition-colors bg-slate-800 p-1.5 rounded-lg ml-2"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="pr-24">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Resource Name</label>
                  <input type="text" value={res.name} onChange={(e) => handleUpdateResource(i, 'name', e.target.value)} className={`w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:${activeTheme.border} text-sm font-bold`} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Maximum Uses</label>
                  <input type="number" value={res.max} onChange={(e) => handleUpdateResource(i, 'max', e.target.value)} className={`w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:${activeTheme.border} text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`} />
                </div>
              </div>
            ))}
            <button onClick={handleAddResource} className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"><Plus className="w-4 h-4" /> Add New Resource</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {char.resources?.map((res, i) => (
              <div key={`res-view-${i}`} className="bg-slate-900 border border-slate-700 rounded-lg p-3 sm:p-4 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-sm md:text-base">{res.name}</span>
                  <div className="flex gap-2 items-center shrink-0">
                    <input 
                      type="number" value={res.current} 
                      onChange={(e) => { const n = Math.max(0, Math.min(Number(e.target.value), res.max)); const u = [...char.resources]; u[i].current = n; updateField('resources', u); }} 
                      className={`w-12 sm:w-16 bg-slate-800 border border-slate-600 rounded-lg text-center text-white py-1.5 focus:outline-none focus:${activeTheme.border} font-bold shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`} 
                    />
                    <span className="text-slate-500 font-bold">/ {res.max}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NEW: SUMMON / COMPANION TRACKER */}
      {(char.companion || isDM) && (
        <div className={`bg-slate-900/80 border ${char.companion ? 'border-emerald-500/50' : 'border-slate-700 border-dashed'} rounded-xl p-4 shadow-sm`}>
          <div className="flex justify-between items-center mb-3">
            <h4 className={`text-sm font-bold flex items-center gap-2 ${char.companion ? 'text-emerald-400' : 'text-slate-500'}`}><PawPrint className="w-4 h-4" /> Companion / Summon</h4>
            {isDM && (
              <button onClick={() => setIsCompanionModalOpen(true)} className="text-xs bg-slate-800 border border-slate-600 text-slate-300 px-3 py-1 rounded hover:bg-slate-700 transition-colors">Manage</button>
            )}
          </div>
          
          {char.companion ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-white font-black text-lg mb-1">{char.companion.name}</h5>
                <p className="text-xs text-slate-400 mb-3">{char.companion.stats}</p>
                <div className="flex gap-2 items-center">
                  <span className="bg-slate-800 text-slate-300 text-xs font-bold px-2 py-1 rounded border border-slate-700 flex items-center gap-1"><Shield className="w-3 h-3 text-blue-400"/> AC: {char.companion.ac}</span>
                  <div className="flex items-center gap-1.5 bg-slate-800 rounded border border-slate-700 px-2 py-0.5">
                    <button onClick={() => adjustCompanionHp(-1)} className="text-slate-400 hover:text-white font-bold px-1">-</button>
                    <span className={`font-black text-sm w-6 text-center ${(char.companion.hp||0)===0 ? 'text-red-400' : 'text-white'}`}>{char.companion.hp || 0}</span>
                    <button onClick={() => adjustCompanionHp(1)} className="text-slate-400 hover:text-white font-bold px-1">+</button>
                    <span className="text-xs text-slate-500 font-bold">/ {char.companion.maxHp}</span>
                  </div>
                </div>
              </div>
              <div className="text-sm text-slate-300 bg-slate-950/50 p-3 rounded border border-slate-800/50 whitespace-pre-wrap leading-relaxed">
                {char.companion.actions}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No active companion deployed.</p>
          )}
        </div>
      )}

      {/* ... [Rest of CombatTab remains identical (Attacks, Armor Grid, Conditions)] ... */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-5 overflow-hidden">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Swords className={`w-5 h-5 ${activeTheme.text}`} /> Attacks</h3>
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <table className="w-full text-left min-w-[500px]">
            <thead><tr className="text-slate-400 text-sm border-b border-slate-700"><th className="pb-3 font-medium">Name</th><th className="pb-3 font-medium text-center">Hit</th><th className="pb-3 font-medium">Damage</th><th className="pb-3 font-medium">Type</th><th className="pb-3 font-medium">Notes</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {(char.attacks || []).map((atk, i) => <tr key={`atk-${i}`} className="text-slate-300"><td className="py-3 font-bold text-white">{atk.name}</td><td className="py-3 text-center"><span className="bg-slate-700 text-white px-2 py-1 rounded text-sm font-bold">{atk.hit}</span></td><td className="py-3 font-bold font-mono tracking-wider">{atk.damage}</td><td className={`py-3 text-sm font-bold ${getDamageColor(atk.type)}`}>{atk.type}</td><td className="py-3 text-slate-400 text-sm italic">{atk.notes}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}