import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from './services/firebase'; // Importing your setup!
import Login from './components/Login';
import Dashboard from './components/Dashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [unlockedCharacters, setUnlockedCharacters] = useState([]);

  // 1. Remember the user on this specific device
  useEffect(() => {
    const savedUser = localStorage.getItem('dnd_currentUser');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  // 2. Real-time listener for the Campaign State
  useEffect(() => {
    // We are creating a document called 'main_session' in a 'campaign' collection
    const campaignRef = doc(db, 'campaign', 'main_session');
    
    const unsubscribe = onSnapshot(campaignRef, (docSnap) => {
      if (docSnap.exists()) {
        setUnlockedCharacters(docSnap.data().unlockedCharacters || []);
      } else {
        // Initialize the document in Firebase if it doesn't exist yet
        setDoc(campaignRef, { unlockedCharacters: [] });
      }
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const handleLogin = async (user) => {
    setCurrentUser(user);
    localStorage.setItem('dnd_currentUser', JSON.stringify(user));

    // If a player logs in, tell Firebase so the DM sees it instantly
    if (user.role === 'player') {
      const campaignRef = doc(db, 'campaign', 'main_session');
      await setDoc(campaignRef, {
        unlockedCharacters: arrayUnion(user.charId) // arrayUnion prevents duplicates
      }, { merge: true });
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('dnd_currentUser');
    // Note: We don't remove them from Firebase unlockedCharacters, 
    // because the DM might still want to see their card!
  };

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