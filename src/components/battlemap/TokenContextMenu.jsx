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
      className="absolute top-[110%] left-1/2 -translate-x-1/2 bg-slate-900 border border-indigo-500/50 rounded-xl p-2 md:p-3 shadow-2xl z-[99999] w-max cursor-default flex flex-col gap-3 animate-in fade-in slide-in-from-top-2"
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
        <span className="text-xs font-black text-white">{token.name}</span>
        
        <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded ml-auto border border-slate-800">
          <Heart className="w-3 h-3 text-red-400" />
          <input 
            type="number" 
            value={hpVal}
            onChange={(e) => onUpdateHpLive(token.id, e.target.value)}
            className="w-10 bg-transparent text-white text-xs font-bold text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        <button onClick={onDeselect} className="ml-2 text-slate-500 hover:text-white p-1 bg-slate-800 rounded"><X className="w-3 h-3"/></button>
      </div>

      <div className="flex gap-2 justify-between">
        <button onClick={() => onToggleSize(token.id)} className="text-indigo-300 hover:text-white flex flex-col items-center gap-1 p-1" title="Size">
          <Maximize className="w-4 h-4" /> <span className="text-[9px]">{token.size || 1}x</span>
        </button>
        <button onClick={() => onToggleAura(token.id)} className="text-sky-300 hover:text-white flex flex-col items-center gap-1 p-1" title="Aura">
          <CircleDashed className="w-4 h-4" /> <span className="text-[9px]">{token.aura ? `${token.aura}ft` : 'Off'}</span>
        </button>
        <button onClick={() => onToggleElevation(token.id)} className="text-emerald-300 hover:text-white flex flex-col items-center gap-1 p-1" title="Elev">
          <ArrowUpCircle className="w-4 h-4" /> <span className="text-[9px]">{token.elevation ? `+${token.elevation}` : 'Grnd'}</span>
        </button>
        <button onClick={() => onToggleConcentration(token.id)} className={`${token.isConcentrating ? 'text-amber-400' : 'text-slate-400'} hover:text-amber-300 flex flex-col items-center gap-1 p-1`} title="Concentration">
          <BrainCircuit className="w-4 h-4" /> <span className="text-[9px]">Conc</span>
        </button>
        <button onClick={() => onToggleRuler(token.id)} className={`${showMovementRangeFor?.id === token.id ? 'text-fuchsia-400' : 'text-slate-400'} hover:text-fuchsia-300 flex flex-col items-center gap-1 p-1`} title="Ruler">
          <Ruler className="w-4 h-4" /> <span className="text-[9px]">Move</span>
        </button>
        
        <div className="w-px bg-slate-700 mx-1"></div>
        
        <button onClick={() => onToggleHidden(token.id)} className={`${token.isHidden ? 'text-amber-400' : 'text-slate-400'} hover:text-white flex flex-col items-center gap-1 p-1`}>
          {token.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} <span className="text-[9px]">Hide</span>
        </button>
        <button onClick={() => onUpdateImage(token.id)} className="text-slate-400 hover:text-emerald-400 flex flex-col items-center gap-1 p-1"><ImageIcon className="w-4 h-4" /><span className="text-[9px]">Img</span></button>
        <button onClick={() => onRemoveToken(token.id)} className="text-slate-400 hover:text-red-400 flex flex-col items-center gap-1 p-1"><Trash2 className="w-4 h-4" /><span className="text-[9px]">Del</span></button>
      </div>

      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
        <p className="text-[9px] text-slate-500 uppercase font-bold mb-2">Quick Conditions</p>
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {Object.keys(CONDITION_ICONS).map(cond => {
             const config = CONDITION_ICONS[cond];
             const Icon = config.icon;
             const isActive = token.conditions?.includes(cond);
             return (
               <button 
                 key={cond} 
                 onClick={() => onToggleCondition(token.id, cond)}
                 className={`p-1.5 rounded-lg transition-all ${isActive ? config.color : 'text-slate-600 hover:text-slate-300 bg-slate-900 hover:bg-slate-800'}`}
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