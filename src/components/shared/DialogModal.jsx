import { AlertTriangle, Info, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function DialogModal({ isOpen, title, message, type = 'alert', inputPlaceholder = '', onConfirm, onCancel }) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  // Auto-focus the input field when a 'prompt' opens
  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      if (type === 'prompt' && inputRef.current) {
        setTimeout(() => inputRef.current.focus(), 100);
      }
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (type === 'prompt') {
      onConfirm(inputValue);
    } else {
      onConfirm();
    }
  };

  // Upgraded theme logic for high-fantasy immersion
  const isConfirm = type === 'confirm';
  
  const headerBorderColor = isConfirm ? 'border-amber-500/30 bg-amber-900/20' : 'border-indigo-500/30 bg-indigo-900/20';
  const textColor = isConfirm ? 'text-amber-400' : 'text-indigo-400';
  const btnColor = isConfirm 
    ? 'bg-amber-600 hover:bg-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.4)]' 
    : 'bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.4)]';
  const Icon = isConfirm ? AlertTriangle : Info;
  const glowColor = isConfirm ? 'bg-amber-500/10' : 'bg-indigo-500/10';

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
      
      {/* Ambient background glow based on alert type */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] ${glowColor} blur-[100px] rounded-full pointer-events-none`}></div>

      <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-700/80 rounded-3xl w-full max-w-sm shadow-[0_0_60px_rgba(0,0,0,0.6)] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden relative z-10">
        
        <div className={`p-5 border-b flex items-center justify-between ${headerBorderColor}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-slate-950/50 shadow-inner ${textColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <h3 className={`text-lg font-black tracking-wide ${textColor} drop-shadow-md`}>
              {title}
            </h3>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
          {message}
          
          {/* Prompt Input Field */}
          {type === 'prompt' && (
            <div className="mt-5 relative group">
              <input 
                ref={inputRef}
                type="text" 
                value={inputValue}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                placeholder={inputPlaceholder}
                className="w-full bg-slate-950/80 border border-slate-600 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-indigo-400 font-bold shadow-inner relative z-10 transition-colors"
              />
              <div className="absolute inset-0 rounded-xl bg-indigo-500/20 blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 z-0"></div>
            </div>
          )}
        </div>

        <div className="p-5 bg-slate-950/50 flex gap-3 justify-end border-t border-slate-800">
          {(type === 'confirm' || type === 'prompt') && (
            <button 
              onClick={onCancel} 
              className="px-5 py-2.5 rounded-xl font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors border border-transparent hover:border-slate-700"
            >
              Cancel
            </button>
          )}
          <button 
            onClick={handleConfirm} 
            className={`px-8 py-2.5 rounded-xl font-black text-white transition-all uppercase tracking-widest text-xs ${btnColor}`}
          >
            {type === 'confirm' ? 'Confirm' : 'Accept'}
          </button>
        </div>

      </div>
    </div>
  );
}