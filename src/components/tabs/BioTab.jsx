import React from 'react';
import { BookOpen, User } from 'lucide-react';
import DebouncedTextarea from '../shared/DebouncedTextarea';

export default function BioTab({ char, charId, isDM, updateField, activeTheme, THEMES }) {

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/80 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-64 h-64 ${activeTheme.bg} blur-[100px] opacity-10 rounded-full pointer-events-none`}></div>
        
        <h3 className="text-lg font-black text-white flex items-center gap-2 mb-6 relative z-10 border-b border-slate-700/50 pb-2 uppercase tracking-widest drop-shadow-sm">
          <User className={`w-5 h-5 ${activeTheme.text}`} /> Physical Appearance
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 relative z-10">
          {[
            { label: 'Age', field: 'age', placeholder: 'e.g. 24' },
            { label: 'Height', field: 'height', placeholder: 'e.g. 5\'10"' },
            { label: 'Weight', field: 'weight', placeholder: 'e.g. 160 lbs' },
            { label: 'Eyes', field: 'eyes', placeholder: 'e.g. Emerald' },
            { label: 'Skin', field: 'skin', placeholder: 'e.g. Fair' },
            { label: 'Hair', field: 'hair', placeholder: 'e.g. Black' }
          ].map((item) => (
            <div key={item.field} className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/50 shadow-inner group focus-within:border-slate-500 transition-colors">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 group-focus-within:text-slate-300 transition-colors">{item.label}</label>
              <input 
                type="text" 
                value={char[item.field] || ''} 
                onFocus={(e) => e.target.select()}
                onChange={(e) => updateField(item.field, e.target.value)}
                placeholder={item.placeholder}
                disabled={isDM}
                className="w-full bg-transparent text-white text-sm font-bold focus:outline-none placeholder-slate-700"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/80 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden flex flex-col min-h-[400px]">
        <div className={`absolute bottom-0 left-0 w-64 h-64 ${activeTheme.bg} blur-[100px] opacity-10 rounded-full pointer-events-none`}></div>
        
        <h3 className="text-lg font-black text-white flex items-center gap-2 mb-4 relative z-10 border-b border-slate-700/50 pb-2 uppercase tracking-widest drop-shadow-sm">
          <BookOpen className={`w-5 h-5 ${activeTheme.text}`} /> Backstory & Lore
        </h3>
        
        <div className="flex-1 relative z-10 bg-slate-900/80 rounded-xl border border-slate-700/50 shadow-inner overflow-hidden focus-within:border-slate-500 transition-colors">
          <DebouncedTextarea 
            initialValue={char.backstory || ''} 
            onSave={(val) => updateField('backstory', val)} 
            disabled={isDM}
            placeholder="Where did you come from? What drives you?"
            className="w-full h-full min-h-[300px] p-5 bg-transparent text-slate-300 text-sm focus:outline-none resize-none leading-relaxed custom-scrollbar font-medium" 
          />
        </div>
      </div>
    </div>
  );
}