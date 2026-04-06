import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from './services/firebase'; 
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import BattleMapDisplay from './components/battlemap/BattleMapDisplay';
import DMBattleMap from './components/battlemap/DMBattleMap';

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const isDisplayMode = urlParams.get('display') === 'true';
  const isDMMapMode = urlParams.get('dmmap') === 'true';

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('dnd_currentUser');
    if (!saved) return null;
    
    const parsedUser = JSON.parse(saved);
    if (parsedUser.role === 'display') {
      localStorage.removeItem('dnd_currentUser');
      return null;
    }
    return parsedUser;
  });
  
  const [unlockedCharacters, setUnlockedCharacters] = useState([]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('dnd_currentUser', JSON.stringify(currentUser));
      
      if (currentUser.role === 'player' && !isDisplayMode && !isDMMapMode) {
        const campaignRef = doc(db, 'campaign', 'main_session');
        setDoc(campaignRef, {
          // arrayUnion is safe here as long as currentUser.charId is the exact doc.id
          unlockedCharacters: arrayUnion(currentUser.charId) 
        }, { merge: true }).catch(err => console.error("Failed to re-join session:", err));
      }
    }
  }, [currentUser, isDisplayMode, isDMMapMode]);

  useEffect(() => {
    if (isDisplayMode || isDMMapMode) return; 

    const campaignRef = doc(db, 'campaign', 'main_session');
    
    const unsubscribe = onSnapshot(campaignRef, (docSnap) => {
      if (docSnap.exists()) {
        // FIX: Force deduplication on read just in case ghost data got stuck
        const rawChars = docSnap.data().unlockedCharacters || [];
        const dedupedChars = [...new Set(rawChars)];
        setUnlockedCharacters(dedupedChars);
      } else {
        setDoc(campaignRef, { unlockedCharacters: [] });
      }
    });

    return () => unsubscribe();
  }, [isDisplayMode, isDMMapMode]);

  const handleLogin = async (user) => {
    setCurrentUser(user);
    localStorage.setItem('dnd_currentUser', JSON.stringify(user));

    if (user.role === 'player') {
      const campaignRef = doc(db, 'campaign', 'main_session');
      await setDoc(campaignRef, {
        unlockedCharacters: arrayUnion(user.charId) 
      }, { merge: true });
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('dnd_currentUser');
  };

  if (isDisplayMode) {
    return <BattleMapDisplay onLogout={() => window.close()} />;
  }

  if (isDMMapMode) {
    if (!currentUser || currentUser.role !== 'dm') {
      return (
         <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-black">
           ACCESS DENIED: DM CREDENTIALS REQUIRED
         </div>
      );
    }
    return (
       <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden">
          <DMBattleMap />
       </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 selection:bg-indigo-500/30">
      {!currentUser ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Dashboard 
          currentUser={currentUser} 
          // Pass the deduped array down to the rest of the app
          unlockedCharacters={unlockedCharacters} 
          onLogout={handleLogout} 
        />
      )}
    </div>
  );
}