import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Shield, User, Key, Sparkles, Flame, Loader2 } from 'lucide-react';

export default function Login({ onLogin }) {
  const [name, setName] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isGlitching, setIsGlitching] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const normalizedName = name.trim().toLowerCase();
  const isDM = normalizedName === 'mike';

  const triggerError = (msg) => {
    setError(msg);
    setIsGlitching(true);
    setIsAuthenticating(false);
    setTimeout(() => setIsGlitching(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsAuthenticating(true);

    if (isDM) {
      if (passcode === 'Jello') {
        onLogin({ role: 'dm', name: 'Mike' });
      } else {
        triggerError('Incorrect DM passcode. The arcane wards hold strong.');
      }
      return;
    }

    try {
      const querySnapshot = await getDocs(collection(db, 'characters'));
      let foundCharId = null;
      let foundCharName = '';

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.name) {
          const dbName = data.name.toLowerCase();
          const dbFirstName = dbName.split(' ')[0];
          
          if (dbName === normalizedName || dbFirstName === normalizedName) {
            foundCharId = doc.id;
            foundCharName = data.name;
          }
        }
      });

      if (foundCharId) {
        onLogin({ role: 'player', charId: foundCharId, name: foundCharName });
      } else {
        triggerError('Character not found. The chronomancers have no record of you.');
      }
    } catch (err) {
      console.error("Login Error:", err);
      triggerError('Database connection failed. Check your weave.');
    }
  };

  const [stars, setStars] = useState([]);
  useEffect(() => {
    const generatedStars = Array.from({ length: 50 }).map(() => ({
      id: Math.random(),
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 3 + 2}s`,
      animationDelay: `${Math.random() * 2}s`,
    }));
    setStars(generatedStars);
  }, []);

  return (
    <div className="min-h-[100dvh] w-full bg-slate-950 flex flex-col items-center justify-center p-4 overflow-hidden selection:bg-indigo-500/30 relative">
      
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 pointer-events-none"></div>
      
      {stars.map(star => (
        <div 
          key={star.id} 
          className="absolute w-1 h-1 bg-white rounded-full opacity-0 pointer-events-none"
          style={{
            left: star.left,
            top: star.top,
            animation: `ping ${star.animationDuration} infinite ${star.animationDelay}`
          }}
        />
      ))}

      <div className={`bg-slate-900 border-[3px] border-slate-950 rounded-3xl p-6 md:p-10 w-full max-w-md relative z-10 transition-all duration-300 animate-in zoom-in-95 ${isGlitching ? 'shadow-[12px_12px_0px_rgba(239,68,68,1)] border-red-500 translate-x-2' : 'shadow-[12px_12px_0px_rgba(0,0,0,1)] translate-x-0'}`}>
        
        <div className="flex flex-col items-center mb-8 text-center relative">
          <div className="relative w-24 h-24 mb-6 group cursor-default">
            <img 
              src="/icon.png" 
              alt="Campaign Companion" 
              className="relative w-full h-full object-cover rounded-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)] border-[3px] border-slate-950 transform -rotate-3 group-hover:rotate-0 transition-transform duration-500 bg-slate-950"
              onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Icon'; }}
            />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-widest mb-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] leading-none">
            Arkla
          </h1>
          <h2 className="text-xl font-black text-indigo-500 uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
            Companion
          </h2>
          <div className="h-1 w-16 bg-slate-950 rounded-full my-4 shadow-inner"></div>
          <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase">
            Identify yourself, Traveler
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="group relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <User className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors drop-shadow-sm" />
            </div>
            <input
              type="text"
              value={name}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setName(e.target.value)}
              className="block w-full pl-12 pr-4 py-4 border-2 border-slate-900 rounded-xl bg-slate-950 text-white font-black placeholder-slate-600 focus:outline-none focus:ring-0 focus:border-indigo-500 transition-colors text-lg shadow-inner relative z-0"
              placeholder="e.g. Kehrfuffle"
              required
            />
          </div>

          {isDM && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300 group relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <Key className="h-5 w-5 text-fuchsia-600/50 group-focus-within:text-fuchsia-400 transition-colors drop-shadow-sm" />
              </div>
              <input
                type="password"
                value={passcode}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setPasscode(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 border-2 border-slate-900 rounded-xl bg-slate-950 text-white font-black placeholder-slate-600 focus:outline-none focus:ring-0 focus:border-fuchsia-500 transition-colors text-lg shadow-inner relative z-0"
                placeholder="Speak friend and enter"
                required={isDM}
              />
            </div>
          )}

          {error && (
            <div className="p-4 bg-slate-950 border-2 border-red-900 rounded-xl flex items-start gap-3 shadow-inner">
              <Shield className="w-5 h-5 shrink-0 mt-0.5 text-red-500 drop-shadow-sm" />
              <span className="leading-relaxed font-black uppercase tracking-widest text-[10px] text-red-400">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isAuthenticating}
            className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-200 border-[3px] border-slate-950 shadow-[6px_6px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[6px] mt-4 ${
              isDM 
                ? 'bg-fuchsia-500 hover:bg-fuchsia-400 disabled:opacity-70 text-slate-950'
                : 'bg-indigo-500 hover:bg-indigo-400 disabled:opacity-70 text-slate-950'
            }`}
          >
            {isAuthenticating ? (
              <Loader2 className="w-5 h-5 animate-spin font-black" />
            ) : isDM ? (
              <Flame className="w-5 h-5 font-black" />
            ) : (
              <Sparkles className="w-5 h-5 font-black" />
            )}
            
            <span>
              {isAuthenticating ? 'Authenticating...' : isDM ? 'Initialize World' : 'Enter the Realm'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}