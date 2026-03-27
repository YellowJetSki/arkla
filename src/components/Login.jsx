import { useState } from 'react';
import { Shield, User, Key, Sparkles } from 'lucide-react';
import { PREMADE_CHARACTERS } from '../data/campaignData';

export default function Login({ onLogin }) {
  const [name, setName] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const normalizedName = name.trim().toLowerCase();
  const isDM = normalizedName === 'mike';

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // DM Login Flow
    if (isDM) {
      if (passcode === 'Jello') {
        onLogin({ role: 'dm', name: 'Mike' });
      } else {
        setError('Incorrect DM passcode. The arcane wards hold strong.');
      }
      return;
    }

    // Player Login Flow
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
      setError('Character not found. Are you sure you are in this campaign?');
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-indigo-950/20 to-slate-950 flex flex-col items-center justify-center p-4 overflow-hidden selection:bg-indigo-500/30 relative">
      
      {/* Immersive Background Orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-fuchsia-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-amber-500/5 blur-[100px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-6 md:p-10 w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.6)] relative z-10 animate-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="relative w-24 h-24 mb-6 group cursor-pointer">
            <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
            <img 
              src="/icon.png" 
              alt="Campaign Companion" 
              className="relative w-full h-full object-cover rounded-2xl shadow-2xl border border-slate-600/50 transform -rotate-3 group-hover:rotate-0 transition-transform duration-500 bg-slate-900"
              onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Icon'; }}
            />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 tracking-tight mb-2 drop-shadow-sm">
            Arkla Companion
          </h1>
          <p className="mt-2 text-slate-400 text-sm font-medium tracking-wide uppercase">
            Enter your character name
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="group">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 mb-2 group-focus-within:text-indigo-400 transition-colors">
              Character Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 border border-slate-700 rounded-xl bg-slate-950/50 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-lg shadow-inner"
                placeholder="e.g. Kehrfuffle"
                required
              />
            </div>
          </div>

          {isDM && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500 group">
              <label className="block text-[10px] font-black text-fuchsia-500/70 uppercase tracking-widest pl-1 mb-2 group-focus-within:text-fuchsia-400 transition-colors">
                Dungeon Master Passcode
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-fuchsia-600/50 group-focus-within:text-fuchsia-400 transition-colors" />
                </div>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 border border-fuchsia-900/50 rounded-xl bg-slate-950/50 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all text-lg shadow-inner"
                  placeholder="Speak friend and enter"
                  required={isDM}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 text-sm text-red-300 bg-red-950/40 border border-red-900/50 rounded-xl flex items-start gap-3 animate-in shake duration-300 shadow-inner">
              <Shield className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
              <span className="leading-relaxed font-medium">{error}</span>
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-lg group overflow-hidden relative ${
              isDM 
                ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-[0_0_25px_rgba(192,38,211,0.3)] hover:shadow-[0_0_35px_rgba(192,38,211,0.5)]'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_25px_rgba(79,70,229,0.3)] hover:shadow-[0_0_35px_rgba(79,70,229,0.5)]'
            }`}
          >
            <div className="absolute inset-0 w-full h-full bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out pointer-events-none"></div>
            <Sparkles className="w-5 h-5 relative z-10" />
            <span className="relative z-10">{isDM ? 'Initialize World' : 'Enter the Realm'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}