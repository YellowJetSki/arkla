import { useState, useEffect } from 'react';
import { Shield, User, Key, Sparkles, Flame } from 'lucide-react';
import { PREMADE_CHARACTERS } from '../data/campaignData';

export default function Login({ onLogin }) {
  const [name, setName] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isGlitching, setIsGlitching] = useState(false);

  const normalizedName = name.trim().toLowerCase();
  const isDM = normalizedName === 'mike';

  const triggerError = (msg) => {
    setError(msg);
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (isDM) {
      if (passcode === 'Jello') {
        onLogin({ role: 'dm', name: 'Mike' });
      } else {
        triggerError('Incorrect DM passcode. The arcane wards hold strong.');
      }
      return;
    }

    const charKey = Object.keys(PREMADE_CHARACTERS).find(
      key => key.toLowerCase() === normalizedName || 
             PREMADE_CHARACTERS[key].name.toLowerCase() === normalizedName
    );

    if (charKey) {
      onLogin({ 
        role: 'player', 
        charId: charKey, 
        name: PREMADE_CHARACTERS[charKey].name 
      });
    } else {
      triggerError('Character not found. The chronomancers have no record of you.');
    }
  };

  // Generate random stars for the background
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
      
      {/* Immersive Background: The Void */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none"></div>
      
      {/* Animated Stars */}
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

      {/* Ambient Orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-fuchsia-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>

      {/* Main Login Card */}
      <div className={`bg-slate-900/60 backdrop-blur-2xl border ${isGlitching ? 'border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.6)]' : 'border-slate-700/50 shadow-[0_0_50px_rgba(0,0,0,0.6)]'} rounded-3xl p-6 md:p-10 w-full max-w-md relative z-10 transition-all duration-300 animate-in zoom-in-95`}>
        
        <div className="flex flex-col items-center mb-8 text-center relative">
          <div className="relative w-24 h-24 mb-6 group cursor-default">
            <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur-xl opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all duration-500"></div>
            <img 
              src="/icon.png" 
              alt="Campaign Companion" 
              className="relative w-full h-full object-cover rounded-2xl shadow-2xl border border-slate-600/50 transform -rotate-3 group-hover:rotate-0 transition-transform duration-500 bg-slate-900"
              onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Icon'; }}
            />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-indigo-400 tracking-tight mb-2 drop-shadow-lg">
            Arkla Companion
          </h1>
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-indigo-500 to-transparent my-2 opacity-50"></div>
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">
            Identify yourself, Traveler
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="group relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <User className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full pl-12 pr-4 py-4 border border-slate-700/50 rounded-xl bg-slate-950/50 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-lg shadow-inner relative z-0"
              placeholder="e.g. Kehrfuffle"
              required
            />
            {/* Focus Glow Effect */}
            <div className="absolute inset-0 rounded-xl bg-indigo-500/20 blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 -z-10"></div>
          </div>

          {isDM && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500 group relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <Key className="h-5 w-5 text-fuchsia-600/50 group-focus-within:text-fuchsia-400 transition-colors" />
              </div>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 border border-fuchsia-900/50 rounded-xl bg-slate-950/50 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all text-lg shadow-inner relative z-0"
                placeholder="Speak friend and enter"
                required={isDM}
              />
              <div className="absolute inset-0 rounded-xl bg-fuchsia-500/20 blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 -z-10"></div>
            </div>
          )}

          {error && (
            <div className={`p-4 text-sm text-red-300 bg-red-950/40 border border-red-900/50 rounded-xl flex items-start gap-3 shadow-inner ${isGlitching ? 'opacity-50 blur-[2px] translate-x-2' : 'opacity-100 blur-0 translate-x-0'} transition-all duration-75`}>
              <Shield className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
              <span className="leading-relaxed font-medium">{error}</span>
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-lg group overflow-hidden relative mt-4 ${
              isDM 
                ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-[0_0_25px_rgba(192,38,211,0.3)] hover:shadow-[0_0_35px_rgba(192,38,211,0.5)] border border-fuchsia-400/50'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_25px_rgba(79,70,229,0.3)] hover:shadow-[0_0_35px_rgba(79,70,229,0.5)] border border-indigo-400/50'
            }`}
          >
            <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[50%] transition-transform duration-1000 ease-out pointer-events-none"></div>
            
            {isDM ? <Flame className="w-5 h-5 relative z-10" /> : <Sparkles className="w-5 h-5 relative z-10" />}
            <span className="relative z-10 tracking-wide">{isDM ? 'Initialize World' : 'Enter the Realm'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}