import { AlertTriangle, Info, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function DialogModal({ isOpen, title, message, type = 'alert', inputPlaceholder = '', onConfirm, onCancel }) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

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
      onConfirm?.(inputValue);
    } else if (onConfirm) {
      onConfirm();
    } else if (onCancel) {
      onCancel(); 
    }
  };

  const isConfirm = type === 'confirm';
  const isPrompt = type === 'prompt';
  
  const headerBgColor = isConfirm ? 'bg-amber-500' : isPrompt ? 'bg-indigo-500' : 'bg-slate-300';
  const headerTextColor = 'text-slate-950';
  const btnColor = isConfirm 
    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' 
    : isPrompt ? 'bg-indigo-500 hover:bg-indigo-400 text-slate-950' 
    : 'bg-slate-300 hover:bg-white text-slate-950';
  
  const Icon = isConfirm ? AlertTriangle : Info;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      
      <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl w-full max-w-sm shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden relative z-10">
        
        <div className={`p-4 border-b-[3px] border-slate-950 flex items-center justify-between ${headerBgColor}`}>
          <div className="flex items-center gap-3">
            <Icon className={`w-6 h-6 ${headerTextColor}`} />
            <h3 className={`text-lg font-black uppercase tracking-widest ${headerTextColor}`}>
              {title}
            </h3>
          </div>
          {onCancel && (
            <button onClick={onCancel} className="text-slate-950 bg-black/10 hover:bg-black/20 p-1.5 rounded-lg border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,0.5)] active:translate-y-[2px] active:shadow-none transition-all">
              <X className="w-4 h-4 font-black" />
            </button>
          )}
        </div>

        <div className="p-6 text-slate-300 text-sm md:text-base font-bold leading-relaxed whitespace-pre-wrap">
          {message}
          
          {type === 'prompt' && (
            <div className="mt-6 relative">
              <input 
                ref={inputRef}
                type="text" 
                value={inputValue}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                placeholder={inputPlaceholder}
                className="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 font-black shadow-inner transition-colors"
              />
            </div>
          )}
        </div>

        <div className="p-5 bg-slate-950 flex gap-3 justify-end border-t-2 border-slate-900">
          {(type === 'confirm' || type === 'prompt') && (
            <button 
              onClick={onCancel} 
              className="px-5 py-3 rounded-xl font-black text-slate-400 uppercase tracking-widest text-[10px] md:text-xs hover:bg-slate-900 hover:text-white transition-colors border-2 border-slate-800"
            >
              Cancel
            </button>
          )}
          <button 
            onClick={handleConfirm} 
            className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs transition-all border-2 border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[4px] ${btnColor}`}
          >
            {type === 'confirm' ? 'Confirm' : type === 'prompt' ? 'Submit' : 'Dismiss'}
          </button>
        </div>

      </div>
    </div>
  );
}