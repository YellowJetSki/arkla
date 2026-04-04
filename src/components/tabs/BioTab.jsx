import React from 'react';
import { BookOpen, User } from 'lucide-react';
import DebouncedTextarea from '../shared/DebouncedTextarea';

export default function BioTab({ char, charId, isDM, updateField, activeTheme }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="bg-slate-800 border-[3px] border-slate-950 rounded-2xl p-5 md:p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-48 h-48 ${activeTheme.bg} blur-[60px] opacity-20 rounded-full pointer-events-none`}></div>
        
        <h3 className="text-lg font-black text-white flex items-center gap-2 mb-6 relative z-10 border-b-2 border-slate-900 pb-2 uppercase tracking-widest drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          <User className={`w-6 h-6 ${activeTheme.text}`} /> Physical Profile
        </h3>
        
        <div className="grid grid-cols-2 gap-4 relative z-10">
          {[
            { label: 'Age', field: 'age', placeholder: 'e.g. 24' },
            { label: 'Height', field: 'height', placeholder: 'e.g. 5\'10"' }
          ].map((item) => (
            <div key={item.field} className="bg-slate-900 p-3 rounded-xl border-2 border-slate-950 shadow-inner group transition-colors">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{item.label}</label>
              <input 
                type="text" 
                value={char[item.field] || ''} 
                onFocus={(e) => e.target.select()}
                onChange={(e) => updateField(item.field, e.target.value)}
                placeholder={item.placeholder}
                disabled={isDM}
                className="w-full bg-transparent text-white text-sm font-black focus:outline-none placeholder-slate-700"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800 border-[3px] border-slate-950 rounded-2xl p-5 md:p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col min-h-[400px]">
        <div className={`absolute bottom-0 left-0 w-48 h-48 ${activeTheme.bg} blur-[60px] opacity-20 rounded-full pointer-events-none`}></div>
        
        <h3 className="text-lg font-black text-white flex items-center gap-2 mb-4 relative z-10 border-b-2 border-slate-900 pb-2 uppercase tracking-widest drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          <BookOpen className={`w-6 h-6 ${activeTheme.text}`} /> Backstory & Lore
        </h3>
        
        <div className="flex-1 relative z-10 bg-slate-900 rounded-xl border-2 border-slate-950 shadow-inner overflow-hidden transition-colors">
          <DebouncedTextarea 
            initialValue={char.backstory || ''} 
            onSave={(val) => updateField('backstory', val)} 
            disabled={isDM}
            placeholder="Where did you come from? What drives you?"
            className="w-full h-full min-h-[300px] p-5 bg-transparent text-slate-300 text-sm md:text-base focus:outline-none resize-none leading-relaxed custom-scrollbar font-medium" 
          />
        </div>
      </div>

    </div>
  );
}