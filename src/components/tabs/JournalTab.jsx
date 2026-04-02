import { BookOpen } from 'lucide-react';
import DebouncedTextarea from '../shared/DebouncedTextarea';

export default function JournalTab({ char, updateField, activeTheme }) {
  return (
    <div className="bg-slate-800 border-[3px] border-slate-950 rounded-2xl p-4 md:p-5 flex flex-col h-[65vh] min-h-[500px] shadow-[6px_6px_0px_rgba(0,0,0,1)] relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-48 h-48 ${activeTheme.bg} opacity-10 blur-[60px] rounded-full pointer-events-none`}></div>
      
      <h3 className="text-lg font-black text-white flex items-center gap-2 mb-4 shrink-0 uppercase tracking-widest drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] border-b-2 border-slate-900 pb-2 relative z-10">
        <BookOpen className={`w-6 h-6 ${activeTheme.text}`} /> Adventure Journal
      </h3>
      
      <div className="flex-1 relative rounded-xl overflow-hidden border-2 border-slate-950 focus-within:border-slate-500 transition-colors shadow-inner bg-slate-900 z-10">
        <DebouncedTextarea 
          initialValue={char.journal || ''} 
          onSave={(newValue) => updateField('journal', newValue)} 
          placeholder="Document your journey, track NPCs, note down clues..."
          className="w-full h-full bg-transparent p-5 text-slate-300 text-sm md:text-base focus:outline-none resize-none leading-relaxed custom-scrollbar font-medium" 
        />
      </div>
    </div>
  );
}