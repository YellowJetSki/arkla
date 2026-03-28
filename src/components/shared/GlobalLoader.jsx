import React, { useState, useEffect } from 'react';
import { Compass } from 'lucide-react';

export default function GlobalLoader({ message, fullScreen = false, delayMs = 300 }) {
  const [loadingText, setLoadingText] = useState("Consulting the pirate council...");
  
  // NEW: State to track if the delay period has passed
  const [show, setShow] = useState(false);

  // This effect waits 'delayMs' before flipping show to true.
  // If the component unmounts (because data loaded) before the timer finishes,
  // the timeout is cleared and the loader never flashes on screen.
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, delayMs);
    
    return () => clearTimeout(timer);
  }, [delayMs]);

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
      "Gathering physical dice...",
      "Weaving arcane wards..."
    ];
    setLoadingText(phrases[Math.floor(Math.random() * phrases.length)]);
  }, [message]);

  // If the delay hasn't finished yet, render absolutely nothing
  if (!show) return null;

  const containerClasses = fullScreen 
    ? "fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md w-full h-[100dvh]"
    : "flex flex-col items-center justify-center min-h-[50dvh] md:min-h-[400px] w-full";

  return (
    <div className={`${containerClasses} gap-8 animate-in fade-in duration-700`}>
      <div className="relative flex items-center justify-center w-32 h-32">
        {/* Outer glowing rune ring */}
        <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.6)] animate-[spin_3s_linear_infinite]"></div>
        
        {/* Middle counter-rotating accent ring */}
        <div className="absolute inset-3 rounded-full border-b-2 border-l-2 border-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.5)] animate-[spin_2s_linear_infinite_reverse]"></div>
        
        {/* Inner fast-spinning core */}
        <div className="absolute inset-6 rounded-full border-t-2 border-b-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)] animate-[spin_1s_linear_infinite]"></div>

        {/* Pulsing center icon */}
        <div className="absolute inset-8 rounded-full bg-slate-900/80 backdrop-blur-sm border border-indigo-400/50 flex items-center justify-center animate-pulse shadow-inner">
          <Compass className="w-8 h-8 text-indigo-300 drop-shadow-[0_0_10px_rgba(165,180,252,0.8)]" />
        </div>
      </div>
      
      <div className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-amber-300 font-black animate-pulse text-xl text-center px-4 tracking-widest uppercase drop-shadow-md">
        {loadingText}
      </div>
    </div>
  );
}