import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from './services/firebase'; 
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import BattleMapDisplay from './components/battlemap/BattleMapDisplay';

export default function App() {
  // Check if this tab was opened specifically as the Display screen via URL
  const isDisplayMode = new URLSearchParams(window.location.search).get('display') === 'true';

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('dnd_currentUser');
    if (!saved) return null;
    
    const parsedUser = JSON.parse(saved);
    // THE FIX: If the old local storage 'display' role is detected, wipe it out to prevent crashes.
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
    }
  }, [currentUser]);

  useEffect(() => {
    if (isDisplayMode) return; 

    const campaignRef = doc(db, 'campaign', 'main_session');
    
    const unsubscribe = onSnapshot(campaignRef, (docSnap) => {
      if (docSnap.exists()) {
        setUnlockedCharacters(docSnap.data().unlockedCharacters || []);
      } else {
        setDoc(campaignRef, { unlockedCharacters: [] });
      }
    });

    return () => unsubscribe();
  }, [isDisplayMode]);

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

  // OVERRIDE: If this is the display tab, only render the Battle Map
  if (isDisplayMode) {
    return <BattleMapDisplay onLogout={() => window.close()} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 selection:bg-indigo-500/30">
      {!currentUser ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Dashboard 
          currentUser={currentUser} 
          unlockedCharacters={unlockedCharacters} 
          onLogout={handleLogout} 
        />
      )}
    </div>
  );
}