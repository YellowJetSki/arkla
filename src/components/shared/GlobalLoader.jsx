import React, { useState, useEffect } from 'react';
import { Compass, Loader2 } from 'lucide-react';

export default function GlobalLoader({ message, fullScreen = false }) {
  const [loadingText, setLoadingText] = useState("Consulting the pirate council...");

  useEffect(() => {
    if (message) {
      setLoadingText(message);
      return;
    }
    const phrases = [
      "Consulting the pirate council...", 
      "Consulting the Tudul family...", 
      "Solving the Troll's riddle...", 
      "Navigating the Arkla seas...", 
      "Bribing the local guards...",
      "Gathering physical dice..."
    ];
    setLoadingText(phrases[Math.floor(Math.random() * phrases.length)]);
  }, [message]);

  const containerClasses = fullScreen 
    ? "fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm w-full h-[100dvh]"
    : "flex flex-col items-center justify-center min-h-[50dvh] md:min-h-[400px] w-full";

  return (
    <div className={`${containerClasses} gap-5 animate-in fade-in duration-500`}>
      <div className="relative flex items-center justify-center">
        {/* Outer slow-spinning compass */}
        <Compass className="w-14 h-14 text-indigo-500/20 animate-[spin_4s_linear_infinite]" />
        {/* Inner fast-spinning core */}
        <Loader2 className="w-6 h-6 text-indigo-400 absolute animate-spin" />
      </div>
      <div className="text-indigo-300 font-bold animate-pulse text-lg text-center px-4 tracking-wide">
        {loadingText}
      </div>
    </div>
  );
}