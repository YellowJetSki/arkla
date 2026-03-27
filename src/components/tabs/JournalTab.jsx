import { BookOpen } from 'lucide-react';
import DebouncedTextarea from '../shared/DebouncedTextarea';

export default function JournalTab({ char, updateField, activeTheme }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-5 flex flex-col h-[60vh] min-h-[400px]">
      <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 shrink-0">
        <BookOpen className={`w-5 h-5 ${activeTheme.text}`} /> Adventure Journal
      </h3>
      
      <div className="flex-1 relative rounded-xl overflow-hidden border border-slate-700 focus-within:border-slate-500 transition-colors">
        <DebouncedTextarea 
          initialValue={char.journal || ''} 
          onSave={(newValue) => updateField('journal', newValue)} 
          placeholder="Document your journey, track NPCs, note down clues..."
          className="w-full h-full bg-slate-900 p-4 text-slate-300 text-sm focus:outline-none resize-none leading-relaxed custom-scrollbar" 
        />
      </div>
    </div>
  );
}