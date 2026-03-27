import { useState, useEffect } from 'react';

export default function DebouncedTextarea({ initialValue, onSave, className, placeholder }) {
  const [value, setValue] = useState(initialValue || '');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Only trigger the auto-save if the user actually typed something
    if (!isTyping) return;

    const handler = setTimeout(() => {
      if (value !== initialValue) {
        onSave(value);
      }
      setIsTyping(false);
    }, 1500);

    return () => clearTimeout(handler);
  }, [value, initialValue, onSave, isTyping]);

  return (
    <div className="relative w-full h-full">
      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setIsTyping(true);
        }}
        className={className}
        placeholder={placeholder}
      />
      {isTyping && (
        <span className="absolute bottom-4 right-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse pointer-events-none">
          Saving...
        </span>
      )}
    </div>
  );
}