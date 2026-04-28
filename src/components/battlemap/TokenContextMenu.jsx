import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, Maximize, CircleDashed, ArrowUpCircle, BrainCircuit, Ruler, 
  EyeOff, Eye, Image as ImageIcon, Trash2, AlertCircle, EarOff, Flame, 
  Ghost, Link, Ban, Cloud, Lock, Mountain, Skull, ArrowDown, Stars, Moon, X, GripHorizontal 
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
  displayName,
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
  
  // Draggable HUD Logic
  const [pos, setPos] = useState({ x: Math.max(10, window.innerWidth - 360), y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Quick Math Logic
  const [hpMod, setHpMod] = useState('');

  const handlePointerDown = (e) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.stopPropagation();
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!isDragging) return;
      setPos({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    };
    const handlePointerUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  const handleDamage = () => {
    const amt = parseInt(hpMod, 10);
    if (!isNaN(amt) && amt > 0) {
      onUpdateHpLive(token.id, Math.max(0, token.hp - amt));
      setHpMod('');
    }
  };

  const handleHeal = () => {
    const amt = parseInt(hpMod, 10);
    if (!isNaN(amt) && amt > 0) {
      onUpdateHpLive(token.id, Math.min(token.maxHp || 1000, token.hp + amt));
      setHpMod('');
    }
  };

  return (
    <div 
      className="fixed bg-slate-900 border-[3px] border-slate-950 rounded-2xl shadow-[8px_8px_0px_rgba(0,0,0,1)] z-[999999] w-[320px] flex flex-col pointer-events-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      style={{ left: pos.x, top: pos.y }}
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      
      {/* HUD Header & Drag Handle */}
      <div 
        onPointerDown={handlePointerDown}
        className="bg-slate-950 px-3 py-2 flex items-center justify-between cursor-grab active:cursor-grabbing border-b-2 border-slate-900"
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-black text-white uppercase tracking-widest truncate drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
            {displayName}
          </span>
        </div>
        <button 
          type="button"
          onClick={onDeselect} 
          className="text-slate-500 hover:text-white p-1 bg-slate-900 hover:bg-slate-800 rounded transition-colors"
        >
          <X className="w-4 h-4 font-black"/>
        </button>
      </div>

      <div className="p-3 flex flex-col gap-3">
        
        {/* UPGRADED: Quick Damage/Heal Calculator */}
        <div className="bg-slate-950 p-2.5 rounded-xl border-2 border-slate-900 shadow-inner flex flex-col gap-2">
          <div className="flex justify-between items-center px-1">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
               <Heart className="w-3 h-3 text-slate-500" /> Hit Points
             </span>
             <span className={`text-xs font-black ${token.hp <= 0 ? 'text-red-500' : 'text-white'}`}>
               {token.hp} / {token.maxHp || '?'}
             </span>
          </div>
          <div className="flex gap-2">
             <input 
               type="number" 
               placeholder="Amt..."
               value={hpMod}
               onFocus={(e) => e.target.select()}
               onChange={(e) => setHpMod(e.target.value)}
               onKeyDown={(e) => {
                 if (e.key === 'Enter') handleDamage();
               }}
               className="w-full bg-slate-900 border-2 border-slate-800 rounded px-2 text-white text-sm font-black focus:outline-none focus:border-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
             />
             <button onClick={handleDamage} className="bg-red-500 hover:bg-red-400 text-slate-950 text-[10px] uppercase tracking-widest font-black px-4 py-1.5 rounded border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all">
               DMG
             </button>
             <button onClick={handleHeal} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] uppercase tracking-widest font-black px-4 py-1.5 rounded border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all">
               HEAL
             </button>
          </div>
        </div>

        {/* Core Controls */}
        <div className="grid grid-cols-4 gap-2 bg-slate-950 p-2 rounded-xl border-2 border-slate-900 shadow-inner">
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
          <button type="button" onClick={() => onToggleHidden(token.id)} className={`${token.isHidden ? 'text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]' : 'text-slate-400'} hover:text-white flex flex-col items-center gap-1 p-2 bg-slate-900 border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none hover:bg-slate-800 rounded-lg transition-all min-w-[40px]`} title="Toggle Visibility">
            {token.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} <span className="text-[9px] font-black uppercase tracking-widest">Hide</span>
          </button>
          <button type="button" onClick={() => onUpdateImage(token.id)} className="text-slate-400 hover:text-emerald-400 flex flex-col items-center gap-1 p-2 bg-slate-900 border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none hover:bg-slate-800 rounded-lg transition-all min-w-[40px]" title="Update Image">
            <ImageIcon className="w-4 h-4" /><span className="text-[9px] font-black uppercase tracking-widest">Img</span>
          </button>
          <button type="button" onClick={() => onRemoveToken(token.id)} className="text-slate-400 hover:text-red-500 flex flex-col items-center gap-1 p-2 bg-slate-900 border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none hover:bg-slate-800 rounded-lg transition-all min-w-[40px]" title="Remove from Map">
            <Trash2 className="w-4 h-4" /><span className="text-[9px] font-black uppercase tracking-widest">Del</span>
          </button>
        </div>

        {/* Conditions */}
        <div className="bg-slate-950 p-3 rounded-xl border-2 border-slate-900 shadow-inner">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-3">Quick Conditions</p>
          <div className="flex flex-wrap justify-center gap-2">
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
    </div>
  );
}