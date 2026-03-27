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

  // Preserve original styling logic
  const isConfirm = type === 'confirm';
  const headerBorderColor = isConfirm ? 'border-amber-900/50 bg-amber-900/10' : 'border-indigo-900/50 bg-indigo-900/10';
  const textColor = isConfirm ? 'text-amber-500' : 'text-indigo-400';
  const btnColor = isConfirm ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500';
  const Icon = isConfirm ? AlertTriangle : Info;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
        
        <div className={`p-4 border-b flex items-center justify-between ${headerBorderColor}`}>
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${textColor}`} />
            <h3 className={`font-bold ${textColor}`}>
              {title}
            </h3>
          </div>
          <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
          {message}
          
          {/* NEW: Prompt Input Field (Only visible when type is 'prompt') */}
          {type === 'prompt' && (
            <input 
              ref={inputRef}
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              placeholder={inputPlaceholder}
              className="w-full bg-slate-950 border border-slate-600 rounded-lg px-4 py-3 mt-4 text-white focus:outline-none focus:border-indigo-500 font-bold shadow-inner"
            />
          )}
        </div>

        <div className="p-4 bg-slate-800 flex gap-3 justify-end border-t border-slate-700">
          {(type === 'confirm' || type === 'prompt') && (
            <button 
              onClick={onCancel} 
              className="px-4 py-2 rounded-lg font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Cancel
            </button>
          )}
          <button 
            onClick={handleConfirm} 
            className={`px-6 py-2 rounded-lg font-bold text-white transition-colors shadow-md ${btnColor}`}
          >
            {type === 'confirm' ? 'Confirm' : 'OK'}
          </button>
        </div>

      </div>
    </div>
  );
}