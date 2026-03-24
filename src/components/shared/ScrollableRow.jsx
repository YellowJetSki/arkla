import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ScrollableRow({ children, className = '' }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      // Using a 1px buffer to prevent rounding issues across different browsers
      setCanScrollLeft(scrollLeft > 1);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    // Timeout allows initial layout to settle before checking widths
    const timeout = setTimeout(checkScroll, 150);
    return () => {
      window.removeEventListener('resize', checkScroll);
      clearTimeout(timeout);
    };
  }, [children]);

  const scrollBy = (amount) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group w-full flex items-center">
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent flex items-center justify-start z-10 pointer-events-none rounded-l-xl">
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); scrollBy(-250); }} 
            className="text-white bg-slate-800/90 hover:bg-slate-700 backdrop-blur-sm rounded-full p-0.5 shadow-[0_0_10px_rgba(0,0,0,0.5)] pointer-events-auto -ml-3 border border-slate-600 transition-all z-20"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      )}
      
      <div 
        ref={scrollRef} 
        onScroll={checkScroll} 
        className={`flex overflow-x-auto snap-x hide-scrollbar [&::-webkit-scrollbar]:hidden w-full scroll-smooth ${className}`}
      >
        {children}
      </div>

      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-slate-900 via-slate-900/90 to-transparent flex items-center justify-end z-10 pointer-events-none rounded-r-xl">
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); scrollBy(250); }} 
            className="text-white bg-slate-800/90 hover:bg-slate-700 backdrop-blur-sm rounded-full p-0.5 shadow-[0_0_10px_rgba(0,0,0,0.5)] pointer-events-auto -mr-3 border border-slate-600 transition-all z-20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}