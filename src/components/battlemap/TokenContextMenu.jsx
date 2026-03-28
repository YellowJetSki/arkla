import React from 'react';
import { 
  Heart, Maximize, CircleDashed, ArrowUpCircle, BrainCircuit, Ruler, 
  EyeOff, Eye, Image as ImageIcon, Trash2, AlertCircle, EarOff, Flame, 
  Ghost, Link, Ban, Cloud, Lock, Mountain, Skull, ArrowDown, Stars, Moon, X 
} from 'lucide-react';

const CONDITION_ICONS = {
  'Blinded': { icon: EyeOff, color: 'bg-slate-700 text-slate-300 border-slate-500' },
  'Charmed': { icon: Heart, color: 'bg-pink-600 text-white border-pink-400' },
  'Deafened': { icon: EarOff, color: 'bg-slate-700 text-slate-300 border-slate-500' },
  'Exhaustion': { icon: Flame, color: 'bg-orange-600 text-white border-orange-400' },
  'Frightened': { icon: Ghost, color: 'bg-purple-600 text-white border-purple-400' },
  'Grappled': { icon: Link, color: 'bg-amber-600 text-white border-amber-400' },
  'Incapacitated': { icon: Ban, color: 'bg-red-600 text-white border-red-400' },
  'Invisible': { icon: Cloud, color: 'bg-sky-400/50 text-white border-sky-300' },
  'Paralyzed': { icon: Lock, color: 'bg-yellow-500 text-yellow-950 border-yellow-300' },
  'Petrified': { icon: Mountain, color: 'bg-stone-500 text-white border-stone-300' },
  'Poisoned': { icon: Skull, color: 'bg-lime-500 text-lime-950 border-lime-300' },
  'Prone': { icon: ArrowDown, color: 'bg-amber-700 text-white border-amber-500' },
  'Restrained': { icon: Link, color: 'bg-orange-700 text-white border-orange-500' },
  'Stunned': { icon: Stars, color: 'bg-yellow-400 text-yellow-900 border-yellow-200' },
  'Unconscious': { icon: Moon, color: 'bg-indigo-800 text-indigo-200 border-indigo-500' }
};

export default function TokenContextMenu({
  token,
  activePlayers,
  activeEnemies,
  showMovementRangeFor,
  onUpdateHpLive,
  onDeselect,
  onToggleSize,
  onToggleAura,
  onToggleElevation,
  onToggleConcentration,
  onToggleRuler,
  onToggleHidden,
  onUpdateImage,
  onRemoveToken,
  onToggleCondition
}) {
  const isEnemy = token.type === 'enemy';
  const entity = isEnemy ? activeEnemies.find(e => e.id === token.id) : activePlayers.find(p => p.id === token.id);
  const hpVal = entity ? (entity.currentHp ?? entity.hp ?? 0) : token.hp;

  return (
    <div 
      className="absolute top-[110%] left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-3 md:p-4 shadow-[0_0_40px_rgba(0,0,0,0.8)] z-[99999] w-max cursor-default flex flex-col gap-4 animate-in fade-in slide-in-from-top-2"
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      {/* Header Area */}
      <div className="flex items-center gap-3 border-b border-slate-700/50 pb-3">
        <span className="text-sm font-black text-white uppercase tracking-wider drop-shadow-sm pr-4">
          {token.name}
        </span>
        
        <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1.5 rounded-lg ml-auto border border-slate-700/50 shadow-inner">
          <Heart className="w-3.5 h-3.5 text-red-500" />
          <input 
            type="number" 
            value={hpVal}
            onChange={(e) => onUpdateHpLive(token.id, e.target.value)}
            className="w-10 bg-transparent text-white text-sm font-black text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        <button 
          onClick={onDeselect} 
          className="ml-1 text-slate-500 hover:text-white p-1.5 bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/50 shadow-sm"
        >
          <X className="w-3.5 h-3.5"/>
        </button>
      </div>

      {/* Primary Tools */}
      <div className="flex gap-2 justify-between bg-slate-950/50 p-2 rounded-xl border border-slate-800/80 shadow-inner">
        <button onClick={() => onToggleSize(token.id)} className="text-indigo-400 hover:text-indigo-200 flex flex-col items-center gap-1 p-1.5 hover:bg-slate-800/80 rounded-lg transition-colors min-w-[36px]" title="Size">
          <Maximize className="w-4 h-4" /> <span className="text-[9px] font-bold uppercase tracking-wider">{token.size || 1}x</span>
        </button>
        <button onClick={() => onToggleAura(token.id)} className="text-sky-400 hover:text-sky-200 flex flex-col items-center gap-1 p-1.5 hover:bg-slate-800/80 rounded-lg transition-colors min-w-[36px]" title="Aura">
          <CircleDashed className="w-4 h-4" /> <span className="text-[9px] font-bold uppercase tracking-wider">{token.aura ? `${token.aura}ft` : 'Off'}</span>
        </button>
        <button onClick={() => onToggleElevation(token.id)} className="text-emerald-400 hover:text-emerald-200 flex flex-col items-center gap-1 p-1.5 hover:bg-slate-800/80 rounded-lg transition-colors min-w-[36px]" title="Elevation">
          <ArrowUpCircle className="w-4 h-4" /> <span className="text-[9px] font-bold uppercase tracking-wider">{token.elevation ? `+${token.elevation}` : 'Gnd'}</span>
        </button>
        <button onClick={() => onToggleConcentration(token.id)} className={`${token.isConcentrating ? 'text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]' : 'text-slate-400'} hover:text-amber-300 flex flex-col items-center gap-1 p-1.5 hover:bg-slate-800/80 rounded-lg transition-colors min-w-[36px]`} title="Concentration">
          <BrainCircuit className="w-4 h-4" /> <span className="text-[9px] font-bold uppercase tracking-wider">Conc</span>
        </button>
        <button onClick={() => onToggleRuler(token.id)} className={`${showMovementRangeFor?.id === token.id ? 'text-fuchsia-400 drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]' : 'text-slate-400'} hover:text-fuchsia-300 flex flex-col items-center gap-1 p-1.5 hover:bg-slate-800/80 rounded-lg transition-colors min-w-[36px]`} title="Movement Ruler">
          <Ruler className="w-4 h-4" /> <span className="text-[9px] font-bold uppercase tracking-wider">Move</span>
        </button>
        
        <div className="w-px bg-slate-800 mx-1"></div>
        
        <button onClick={() => onToggleHidden(token.id)} className={`${token.isHidden ? 'text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]' : 'text-slate-400'} hover:text-white flex flex-col items-center gap-1 p-1.5 hover:bg-slate-800/80 rounded-lg transition-colors min-w-[36px]`} title="Toggle Visibility">
          {token.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} <span className="text-[9px] font-bold uppercase tracking-wider">Hide</span>
        </button>
        <button onClick={() => onUpdateImage(token.id)} className="text-slate-400 hover:text-emerald-400 flex flex-col items-center gap-1 p-1.5 hover:bg-slate-800/80 rounded-lg transition-colors min-w-[36px]" title="Update Image"><ImageIcon className="w-4 h-4" /><span className="text-[9px] font-bold uppercase tracking-wider">Img</span></button>
        <button onClick={() => onRemoveToken(token.id)} className="text-slate-400 hover:text-red-400 flex flex-col items-center gap-1 p-1.5 hover:bg-slate-800/80 rounded-lg transition-colors min-w-[36px]" title="Remove from Map"><Trash2 className="w-4 h-4" /><span className="text-[9px] font-bold uppercase tracking-wider">Del</span></button>
      </div>

      {/* Conditions Box */}
      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-700/50 shadow-inner">
        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-2.5">Quick Conditions</p>
        <div className="flex flex-wrap gap-1.5 max-w-[240px]">
          {Object.keys(CONDITION_ICONS).map(cond => {
             const config = CONDITION_ICONS[cond];
             const Icon = config.icon;
             const isActive = token.conditions?.includes(cond);
             return (
               <button 
                 key={cond} 
                 onClick={() => onToggleCondition(token.id, cond)}
                 className={`p-1.5 rounded-lg transition-all border ${isActive ? `${config.color} shadow-[0_0_10px_currentColor]` : 'text-slate-500 border-slate-800 hover:text-slate-300 bg-slate-900 hover:bg-slate-800'}`}
                 title={cond}
               >
                 <Icon className="w-4 h-4" />
               </button>
             )
          })}
        </div>
      </div>
    </div>
  );
}