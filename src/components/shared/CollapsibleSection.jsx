import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function CollapsibleSection({ title, icon: Icon, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-slate-900 border-2 border-slate-950 rounded-xl overflow-hidden shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex justify-between items-center bg-slate-900 hover:bg-slate-800 transition-colors focus:outline-none"
      >
        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
          {Icon && <Icon className="w-5 h-5 text-indigo-400" />} {title}
        </h3>
        <div className="bg-slate-950 p-1.5 rounded-lg border-2 border-slate-800 shadow-inner">
          {isOpen ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </button>
      
      {/* Animated expansion wrapper */}
      <div 
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-4 md:p-5 border-t-2 border-slate-950 bg-slate-900/50 shadow-inner">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}