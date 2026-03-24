import { useState, useRef, useEffect } from 'react';
import { PenTool } from 'lucide-react';
import CollapsibleSection from '../shared/CollapsibleSection';

// A lightweight parser to turn **text** into bold and *text* into italic without heavy libraries
const parseMarkdown = (text) => {
  if (!text) return { __html: '' };
  let safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;"); // XSS safety
  safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>');
  safeText = safeText.replace(/\*(.*?)\*/g, '<em class="text-indigo-300">$1</em>');
  return { __html: safeText };
};

export default function JournalTab({ char, updateField, activeTheme }) {
  const [isEditing, setIsEditing] = useState(false);
  const [journalText, setJournalText] = useState(char.journal || '');
  const textareaRef = useRef(null);

  // Auto-resize magic
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [journalText, isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    updateField('journal', journalText);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <CollapsibleSection title="Campaign Notes & Secrets" icon={PenTool} defaultOpen={true}>
        <p className="text-xs text-slate-400 mb-4 italic">Click the text to edit. Use **bold** and *italic* for markdown styling.</p>
        
        {isEditing ? (
          <textarea 
            ref={textareaRef}
            value={journalText} 
            onChange={(e) => setJournalText(e.target.value)}
            onBlur={handleBlur}
            autoFocus
            className={`w-full min-h-[200px] bg-slate-900/80 border ${activeTheme.border} rounded-lg p-4 text-slate-200 focus:outline-none focus:ring-1 focus:${activeTheme.ring} resize-none leading-relaxed overflow-hidden`} 
          />
        ) : (
          <div 
            onClick={() => setIsEditing(true)}
            className="w-full min-h-[200px] bg-slate-900/40 border border-slate-700/50 hover:border-slate-600 rounded-lg p-4 cursor-text transition-colors"
          >
            {journalText.trim() ? (
              <div 
                className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={parseMarkdown(journalText)} 
              />
            ) : (
              <span className="text-slate-500 text-sm">Record your adventures here...</span>
            )}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}