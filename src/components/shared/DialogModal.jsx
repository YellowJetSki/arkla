import { AlertTriangle, Info, X } from 'lucide-react';

export default function DialogModal({ isOpen, title, message, type = 'alert', onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
        
        <div className={`p-4 border-b flex items-center justify-between ${type === 'confirm' ? 'border-amber-900/50 bg-amber-900/10' : 'border-indigo-900/50 bg-indigo-900/10'}`}>
          <div className="flex items-center gap-2">
            {type === 'confirm' ? <AlertTriangle className="w-5 h-5 text-amber-500" /> : <Info className="w-5 h-5 text-indigo-400" />}
            <h3 className={`font-bold ${type === 'confirm' ? 'text-amber-500' : 'text-indigo-400'}`}>
              {title}
            </h3>
          </div>
          <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
          {message}
        </div>

        <div className="p-4 bg-slate-800 flex gap-3 justify-end border-t border-slate-700">
          {type === 'confirm' && (
            <button 
              onClick={onCancel} 
              className="px-4 py-2 rounded-lg font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Cancel
            </button>
          )}
          <button 
            onClick={onConfirm} 
            className={`px-6 py-2 rounded-lg font-bold text-white transition-colors shadow-md ${type === 'confirm' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
          >
            {type === 'confirm' ? 'Confirm' : 'OK'}
          </button>
        </div>

      </div>
    </div>
  );
}