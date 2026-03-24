import CharacterCard from './CharacterCard';
import DMDashboard from './DMDashboard';

export default function Dashboard({ currentUser, unlockedCharacters, onLogout }) {
  // Route the DM to their screen
  if (currentUser.role === 'dm') {
    return (
      <DMDashboard 
        unlockedCharacters={unlockedCharacters} 
        onLogout={onLogout} 
      />
    );
  }
  
  // Route Players to their character sheet
  return (
    <CharacterCard 
      currentUser={currentUser} 
      onLogout={onLogout} 
    />
  );
}