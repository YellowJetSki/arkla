import { useState } from 'react';
import { Shield, User, Key, Sparkles } from 'lucide-react';
import { PREMADE_CHARACTERS } from '../data/campaignData';

export default function Login({ onLogin }) {
  const [name, setName] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const isDM = name.trim().toLowerCase() === 'mike';

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const normalizedName = name.trim().toLowerCase();

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
    // Allow players to type either their short key ('wendy') or full name ('Wendy Warmwind')
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
    // Using h-[100dvh] and overflow-hidden locks the viewport and prevents phantom mobile scrolling
    <div className="h-[100dvh] w-full bg-slate-950 flex flex-col items-center justify-center p-4 overflow-hidden selection:bg-indigo-500/30 relative">
      
      {/* Background Decorative Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-fuchsia-600/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 md:p-10 w-full max-w-md shadow-[0_0_40px_rgba(0,0,0,0.5)] relative z-10">
        
        <div className="flex flex-col items-center mb-8 text-center">
          
          {/* CUSTOM APP ICON */}
          <div className="w-20 h-20 mb-5 transform -rotate-3 transition-transform hover:rotate-0 duration-300">
            <img 
              src="/icon.png" 
              alt="Campaign Companion" 
              className="w-full h-full object-cover rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.3)] border-2 border-indigo-500/50 bg-slate-900"
              onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Icon'; }}
            />
          </div>

          <h1 className="text-3xl font-black text-white tracking-tight mb-2 break-words text-balance">
            Campaign Login
          </h1>
          <p className="mt-2 text-slate-400 text-sm font-medium text-balance">
            Enter your character name to join the session
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider pl-1 mb-2">
              Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-10 pr-3 py-3.5 border border-slate-600 rounded-xl bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-lg shadow-inner"
                placeholder="e.g. Wendy or Mike"
                required
              />
            </div>
          </div>

          {/* Conditionally render passcode input if they type Mike */}
          {isDM && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-xs font-bold text-fuchsia-400 uppercase tracking-wider pl-1 mb-2">
                DM Passcode
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-fuchsia-500/50" />
                </div>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3.5 border border-fuchsia-900/50 rounded-xl bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors text-lg shadow-inner"
                  placeholder="Enter DM Passcode"
                  required={isDM}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-xl flex items-start gap-3 animate-in shake duration-300 break-words">
              <Shield className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-lg ${
              isDM 
                ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-[0_0_20px_rgba(192,38,211,0.4)]'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            {isDM ? 'Initialize Campaign' : 'Enter the Realm'}
          </button>
        </form>
      </div>
    </div>
  );
}