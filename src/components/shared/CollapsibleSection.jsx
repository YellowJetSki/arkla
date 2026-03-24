import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function CollapsibleSection({ title, icon: Icon, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex justify-between items-center bg-slate-800 hover:bg-slate-700/50 transition-colors focus:outline-none"
      >
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-indigo-400" />} {title}
        </h3>
        <div className="bg-slate-900/50 p-1.5 rounded-md border border-slate-700">
          {isOpen ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>
      
      {/* Animated expansion wrapper */}
      <div 
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-4 md:p-5 border-t border-slate-700/50 bg-slate-800/30">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}