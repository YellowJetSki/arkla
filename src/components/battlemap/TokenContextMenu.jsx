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
      className="absolute top-full left-1/2 -translate-x-1/2 mt-8 bg-slate-900 border-[3px] border-slate-950 rounded-2xl p-4 shadow-[8px_8px_0px_rgba(0,0,0,1)] z-[99999] w-max cursor-default flex flex-col gap-4 pointer-events-auto animate-in fade-in slide-in-from-top-2"
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center gap-3 border-b-2 border-slate-950 pb-3">
        <span className="text-sm font-black text-white uppercase tracking-widest drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] pr-4">
          {token.name}
        </span>
        
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl ml-auto border-2 border-slate-900 shadow-inner">
          <Heart className="w-4 h-4 text-red-500 drop-shadow-sm" />
          <input 
            type="number" 
            value={hpVal}
            onFocus={(e) => e.target.select()}
            onChange={(e) => onUpdateHpLive(token.id, e.target.value)}
            className="w-12 bg-transparent text-white text-lg font-black text-center focus:outline-none focus:text-red-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        <button 
          type="button"
          onClick={onDeselect} 
          className="ml-2 text-slate-500 hover:text-white p-2 bg-slate-950 hover:bg-slate-800 rounded-lg transition-colors border-2 border-slate-900 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"
        >
          <X className="w-4 h-4 font-black"/>
        </button>
      </div>

      <div className="flex gap-2 justify-between bg-slate-950 p-2 rounded-xl border-2 border-slate-900 shadow-inner">
        <button type="button" onClick={() => onToggleSize(token.id)} className="text-indigo-400 hover:text-indigo-300 flex flex-col items-center gap-1 p-2 bg-slate-900 border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none hover:bg-slate-800 rounded-lg transition-all min-w-[40px]" title="Size">
          <Maximize className="w-4 h-4" /> <span className="text-[9px] font-black uppercase tracking-widest">{token.size || 1}x</span>
        </button>
        <button type="button" onClick={() => onToggleAura(token.id)} className="text-sky-400 hover:text-sky-300 flex flex-col items-center gap-1 p-2 bg-slate-900 border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none hover:bg-slate-800 rounded-lg transition-all min-w-[40px]" title="Aura">
          <CircleDashed className="w-4 h-4" /> <span className="text-[9px] font-black uppercase tracking-widest">{token.aura ? `${token.aura}ft` : 'Off'}</span>
        </button>
        <button type="button" onClick={() => onToggleElevation(token.id)} className="text-emerald-400 hover:text-emerald-300 flex flex-col items-center gap-1 p-2 bg-slate-900 border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none hover:bg-slate-800 rounded-lg transition-all min-w-[40px]" title="Elevation">
          <ArrowUpCircle className="w-4 h-4" /> <span className="text-[9px] font-black uppercase tracking-widest">{token.elevation ? `+${token.elevation}` : 'Gnd'}</span>
        </button>
        <button type="button" onClick={() => onToggleConcentration(token.id)} className={`${token.isConcentrating ? 'text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]' : 'text-slate-400'} hover:text-amber-400 flex flex-col items-center gap-1 p-2 bg-slate-900 border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none hover:bg-slate-800 rounded-lg transition-all min-w-[40px]`} title="Concentration">
          <BrainCircuit className="w-4 h-4" /> <span className="text-[9px] font-black uppercase tracking-widest">Conc</span>
        </button>
        <button type="button" onClick={() => onToggleRuler(token.id)} className={`${showMovementRangeFor?.id === token.id ? 'text-fuchsia-500 drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]' : 'text-slate-400'} hover:text-fuchsia-400 flex flex-col items-center gap-1 p-2 bg-slate-900 border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none hover:bg-slate-800 rounded-lg transition-all min-w-[40px]`} title="Movement Ruler">
          <Ruler className="w-4 h-4" /> <span className="text-[9px] font-black uppercase tracking-widest">Move</span>
        </button>
        
        <div className="w-1 bg-slate-900 mx-1 rounded-full"></div>
        
        <button type="button" onClick={() => onToggleHidden(token.id)} className={`${token.isHidden ? 'text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]' : 'text-slate-400'} hover:text-white flex flex-col items-center gap-1 p-2 bg-slate-900 border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none hover:bg-slate-800 rounded-lg transition-all min-w-[40px]`} title="Toggle Visibility">
          {token.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} <span className="text-[9px] font-black uppercase tracking-widest">Hide</span>
        </button>
        <button type="button" onClick={() => onUpdateImage(token.id)} className="text-slate-400 hover:text-emerald-400 flex flex-col items-center gap-1 p-2 bg-slate-900 border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none hover:bg-slate-800 rounded-lg transition-all min-w-[40px]" title="Update Image"><ImageIcon className="w-4 h-4" /><span className="text-[9px] font-black uppercase tracking-widest">Img</span></button>
        <button type="button" onClick={() => onRemoveToken(token.id)} className="text-slate-400 hover:text-red-500 flex flex-col items-center gap-1 p-2 bg-slate-900 border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none hover:bg-slate-800 rounded-lg transition-all min-w-[40px]" title="Remove from Map"><Trash2 className="w-4 h-4" /><span className="text-[9px] font-black uppercase tracking-widest">Del</span></button>
      </div>

      <div className="bg-slate-950 p-4 rounded-xl border-2 border-slate-900 shadow-inner">
        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-3">Quick Conditions</p>
        <div className="flex flex-wrap gap-2 max-w-[250px]">
          {Object.keys(CONDITION_ICONS).map(cond => {
             const config = CONDITION_ICONS[cond];
             const Icon = config.icon;
             const isActive = token.conditions?.includes(cond);
             return (
               <button 
                 type="button"
                 key={cond} 
                 onClick={() => onToggleCondition(token.id, cond)}
                 className={`p-2 rounded-lg transition-all border-2 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none ${isActive ? `${config.color} border-slate-950` : 'text-slate-500 border-slate-900 hover:text-white bg-slate-900 hover:bg-slate-800 hover:border-slate-950'}`}
                 title={cond}
               >
                 <Icon className="w-4 h-4 font-black" />
               </button>
             )
          })}
        </div>
      </div>
    </div>
  );
}