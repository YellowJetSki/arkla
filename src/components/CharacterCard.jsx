import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  LogOut, Swords, Sparkles, Backpack, BookOpen, 
  Tent, Moon, PenTool, Skull, Gem, X, HelpCircle, ArrowUpCircle, Star, User, Edit3, Flame, Shield, Heart, Maximize
} from 'lucide-react';

import { PREMADE_CHARACTERS } from '../data/campaignData';
import StatGrid from './shared/StatGrid';
import CollapsibleSection from './shared/CollapsibleSection';
import ImageModal from './shared/ImageModal'; 
import ScrollableRow from './shared/ScrollableRow'; 

import LevelUpModal from './LevelUpModal';
import SessionResetModal from './SessionResetModal';
import PlayerGuideModal from './PlayerGuideModal';
import PartyLootModal from './PartyLootModal'; 
import DMEditSheet from './DMEditSheet';
import ShortRestModal from './ShortRestModal'; 
import LongRestModal from './LongRestModal'; 
import Spellbook from './Spellbook'; 
import OnboardingWizard from './OnboardingWizard'; 

import InventoryTab from './tabs/InventoryTab'; 
import CombatTab from './tabs/CombatTab';
import BioTab from './tabs/BioTab';
import PartyLootTab from './tabs/PartyLootTab';
import JournalTab from './tabs/JournalTab';

// NEW BATTLEMAP IMPORTS
import BattleMapLayer from './battlemap/BattleMapLayer';
import StickyBattleNav from './battlemap/StickyBattleNav';

const XP_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

const THEMES = {
  indigo: { text: 'text-indigo-400', bg: 'bg-indigo-600', border: 'border-indigo-500/50', ring: 'ring-indigo-500', shadow: 'shadow-[0_0_15px_rgba(99,102,241,0.5)]' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-600', border: 'border-emerald-500/50', ring: 'ring-emerald-500', shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.5)]' },
  rose: { text: 'text-rose-400', bg: 'bg-rose-600', border: 'border-rose-500/50', ring: 'ring-rose-500', shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.5)]' },
  amber: { text: 'text-amber-400', bg: 'bg-amber-600', border: 'border-amber-500/50', ring: 'ring-amber-500', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.5)]' },
  sky: { text: 'text-sky-400', bg: 'bg-sky-600', border: 'border-sky-500/50', ring: 'ring-sky-500', shadow: 'shadow-[0_0_15px_rgba(14,165,233,0.5)]' },
};

export default function CharacterCard({ currentUser, onLogout, isDM = false, onClose = null }) {
  const CardWrapper = isDM ? 
    ({ children }) => <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md h-[100dvh] overflow-hidden animate-in fade-in duration-300"><div className="bg-slate-900 border border-indigo-500/50 rounded-2xl w-full max-w-5xl shadow-[0_0_40px_rgba(99,102,241,0.2)] flex flex-col max-h-[90dvh] animate-in zoom-in-95 duration-500 overflow-y-auto custom-scrollbar relative">{children}</div></div> 
    : ({ children }) => <>{children}</>;

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem(`activeTab_${currentUser.charId}`) || 'combat';
  });

  useEffect(() => {
    const activeBtn = document.getElementById(`tab-btn-${activeTab}`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

  const [char, setChar] = useState(null); 
  const [isResting, setIsResting] = useState(false);
  const isMounted = useRef(false); 
  
  const [partyLoot, setPartyLoot] = useState([]);
  const [newLootPopup, setNewLootPopup] = useState(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isLevelUpOpen, setIsLevelUpOpen] = useState(false);
  const [isShortRestOpen, setIsShortRestOpen] = useState(false); 
  const [isLongRestOpen, setIsLongRestOpen] = useState(false); 
  const [isKicked, setIsKicked] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false); 
  const [activeLoot, setActiveLoot] = useState(null); 
  
  // NEW BATTLEMAP LAYER STATE
  const [isBattleMapOpen, setIsBattleMapOpen] = useState(false);

  const [saveToast, setSaveToast] = useState(''); 
  const [loadingText, setLoadingText] = useState("Consulting the pirate council...");

  const [displayHp, setDisplayHp] = useState("");
  const [isEditingHp, setIsEditingHp] = useState(false);
  const [displayMaxHp, setDisplayMaxHp] = useState("");
  const [isEditingMaxHp, setIsEditingMaxHp] = useState(false);
  const [displayTempHp, setDisplayTempHp] = useState("");
  const [isEditingTempHp, setIsEditingTempHp] = useState(false);

  useEffect(() => {
    localStorage.setItem(`activeTab_${currentUser.charId}`, activeTab);
  }, [activeTab, currentUser.charId]);

  useEffect(() => {
    const phrases = ["Consulting the pirate council...", "Consulting the Tudul family...", "Solving the Troll's riddle...", "Navigating the Arkla seas...", "Bribing the local guards..."];
    setLoadingText(phrases[Math.floor(Math.random() * phrases.length)]);

    let unsubscribeSession = () => {};
    if (!isDM) {
      const sessionRef = doc(db, 'campaign', 'main_session');
      unsubscribeSession = onSnapshot(sessionRef, (docSnap) => {
        if (docSnap.exists()) {
          const activePlayers = docSnap.data().unlockedCharacters || [];
          if (!activePlayers.includes(currentUser.charId)) setIsKicked(true);
        }
      });
    }

    const charRef = doc(db, 'characters', currentUser.charId);
    const unsubscribeChar = onSnapshot(charRef, (docSnap) => {
      if (docSnap.exists()) {
        setChar(docSnap.data());
        isMounted.current = true;
      } else {
        if (isMounted.current) {
          if (!isDM) setIsKicked(true);
        } else {
          if (!isDM && !isKicked) {
            const initialData = PREMADE_CHARACTERS[currentUser.charId];
            if (initialData) {
              setDoc(charRef, { ...initialData, hasCompletedTutorial: false });
              setChar({ ...initialData, hasCompletedTutorial: false }); 
            } else setIsKicked(true);
          }
        }
      }
    });

    const lootRef = doc(db, 'campaign', 'shared_loot');
    const unsubscribeLoot = onSnapshot(lootRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPartyLoot(data.items || []);
        if (!isDM && data.latestShareId) {
          const dismissedIds = JSON.parse(localStorage.getItem('dismissed_loot') || '[]');
          if (!dismissedIds.includes(data.latestShareId)) {
            const newItem = data.items.find(i => i.id === data.latestShareId);
            if (newItem) setNewLootPopup(newItem);
          }
        }
      }
    });

    return () => { unsubscribeSession(); unsubscribeChar(); unsubscribeLoot(); };
  }, [currentUser.charId, isDM, isKicked]);

  const updateField = async (field, value) => {
    if (!char) return;
    await updateDoc(doc(db, 'characters', currentUser.charId), { [field]: value });
    if (['inventory', 'backstory', 'journal', 'theme'].includes(field)) {
      setSaveToast('Saved to Cloud');
      setTimeout(() => setSaveToast(''), 2500);
    }
  };

  const adjustXp = async (amount) => {
    if (!char) return;
    const currentXp = char.exp || 0;
    await updateField('exp', Math.max(0, currentXp + amount));
  };

  const submitHpUpdate = async (newHpVal, newTempVal = null) => {
    if (!char) return; 
    const boundedHp = Math.max(0, Math.min(parseInt(newHpVal, 10) || 0, char.maxHp || 10));
    let updates = { hp: boundedHp };
    if (newTempVal !== null) updates.tempHp = Math.max(0, parseInt(newTempVal, 10) || 0);

    if (boundedHp > 0 && char.hp === 0) {
      updates['deathSaves.successes'] = 0;
      updates['deathSaves.failures'] = 0;
    }
    await updateDoc(doc(db, 'characters', currentUser.charId), updates);
  };

  const adjustHp = async (amount) => {
    if (!char) return;
    let currentHp = char.hp || 0;
    let currentTemp = char.tempHp || 0;

    if (amount < 0) {
      const damage = Math.abs(amount);
      if (currentTemp >= damage) {
        currentTemp -= damage; 
      } else {
        const rolloverDamage = damage - currentTemp;
        currentTemp = 0;
        currentHp = Math.max(0, currentHp - rolloverDamage);
      }
    } else { 
      currentHp = Math.min(char.maxHp || 10, currentHp + amount);
    }

    let updates = { hp: currentHp, tempHp: currentTemp };
    if (currentHp > 0 && (char.hp || 0) === 0) {
      updates['deathSaves.successes'] = 0;
      updates['deathSaves.failures'] = 0;
    }
    await updateDoc(doc(db, 'characters', currentUser.charId), updates);
  };

  const handleAddCondition = async (condition) => {
    if (!condition || !char) return;
    await updateDoc(doc(db, 'characters', currentUser.charId), { conditions: arrayUnion(condition) });
  };

  const handleRemoveCondition = async (condition) => {
    if (!char) return;
    await updateDoc(doc(db, 'characters', currentUser.charId), { conditions: arrayRemove(condition) });
  };

  const updateDeathSaves = async (type, value) => { await updateField(`deathSaves.${type}`, value); };
  
  const toggleInspiration = async (e) => { 
    if (e) e.stopPropagation();
    if (!isDM) return; 
    await updateField('inspiration', !char.inspiration); 
  };

  const handleLongRest = () => {
    if (!char) return;
    setIsLongRestOpen(true);
  };

  const dismissLootPopup = () => {
    if (!newLootPopup) return;
    const dismissedIds = JSON.parse(localStorage.getItem('dismissed_loot') || '[]');
    localStorage.setItem('dismissed_loot', JSON.stringify([...dismissedIds, newLootPopup.id]));
    setNewLootPopup(null);
  };

  const handleCompleteOnboarding = async (selectedTheme) => {
    await updateDoc(doc(db, 'characters', currentUser.charId), {
      theme: selectedTheme,
      hasCompletedTutorial: true
    });
  };

  const restoreCharacter = async (importedData) => {
    try {
      await setDoc(doc(db, 'characters', currentUser.charId), {
        ...importedData,
        hasCompletedTutorial: true 
      });
      setSaveToast('Character Restored from Backup!');
      setTimeout(() => setSaveToast(''), 3000);
    } catch (error) {
      console.error("Restore failed", error);
      alert("Failed to restore character to the database.");
    }
  };

  if (isKicked) return isDM ? null : <SessionResetModal onLogout={onLogout} />;
  if (!char) return <CardWrapper><div className="flex items-center justify-center min-h-[50dvh] md:min-h-[400px] w-full"><div className="text-indigo-400 font-bold animate-pulse text-xl">{loadingText}</div></div></CardWrapper>;

  const activeConditions = char.conditions || [];
  const isUnconscious = (char.hp || 0) <= 0;
  
  const getConditionWarnings = (conditions) => {
    const warnings = [];
    if (!conditions) return warnings;
    if (conditions.includes('Poisoned')) warnings.push("Poisoned: Disadvantage on all Attack Rolls.");
    if (conditions.includes('Frightened')) warnings.push("Frightened: Disadvantage on Attack Rolls while source is visible.");
    if (conditions.includes('Blinded')) warnings.push("Blinded: Disadvantage on all Attack Rolls.");
    if (conditions.includes('Prone')) warnings.push("Prone: Disadvantage on Attack Rolls (unless crawling/close).");
    if (conditions.includes('Restrained')) warnings.push("Restrained: Disadvantage on all Attack Rolls.");
    if (conditions.includes('Exhaustion')) warnings.push("Exhaustion: Disadvantage on Attack Rolls (if Level 3+).");
    return warnings;
  };
  const combatWarnings = getConditionWarnings(activeConditions);

  const isPoisoned = activeConditions.includes('Poisoned');
  const isFrightened = activeConditions.includes('Frightened');
  const isExhausted = activeConditions.includes('Exhaustion');

  const hpPercent = Math.max(0, Math.min(100, ((char.hp || 0) / (char.maxHp || 1)) * 100));
  const hpColor = isPoisoned ? 'bg-lime-500/40' : hpPercent > 50 ? 'bg-emerald-500/20' : hpPercent > 20 ? 'bg-yellow-500/20' : 'bg-red-500/30';

  const currentXp = char.exp || 0;
  const nextLevelXp = XP_THRESHOLDS[char.level] || 355000;
  const prevLevelXp = XP_THRESHOLDS[char.level - 1] || 0;
  const xpPercent = Math.max(0, Math.min(100, ((currentXp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100));
  const canLevelUp = currentXp >= nextLevelXp;

  const activeTheme = THEMES[char.theme] || THEMES.indigo;

  return (
    <CardWrapper>
      <div className={`transition-all duration-700 ${isExhausted ? 'grayscale-[0.5] contrast-75' : ''} pb-24 relative`}>
        
        {/* NEW: LIVE BATTLE MAP LAYER & PERSISTENT NAV */}
        {!isDM && (
          <>
            <BattleMapLayer 
              char={char} 
              charId={currentUser.charId} 
              isOpen={isBattleMapOpen} 
              onClose={() => setIsBattleMapOpen(false)} 
            />
            <StickyBattleNav 
              onToggleMap={setIsBattleMapOpen} 
              isMapOpen={isBattleMapOpen} 
              activeTheme={activeTheme} 
            />
          </>
        )}

        {!isDM && char && char.hasCompletedTutorial !== true && (
          <OnboardingWizard charName={char.name} onComplete={handleCompleteOnboarding} />
        )}

        {saveToast && (
          <div className="fixed bottom-6 right-6 bg-slate-800 text-emerald-400 px-4 py-3 rounded-xl shadow-2xl border border-emerald-900/50 z-[99999] animate-in slide-in-from-bottom-5 fade-in duration-300 font-bold text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> {saveToast}
          </div>
        )}

        <ImageModal isOpen={isImageOpen} url={`/${currentUser.charId}.png`} alt={char.name || 'Character'} onClose={() => setIsImageOpen(false)} />
        <ImageModal isOpen={!!activeLoot} url={activeLoot?.url} alt={activeLoot?.name} onClose={() => setActiveLoot(null)} />
        {isDM && isEditMode && <DMEditSheet char={char} charId={currentUser.charId} onCancel={() => setIsEditMode(false)} />}

        <div className={`${isDM ? 'p-6' : 'max-w-4xl mx-auto p-3 md:p-8 min-h-[100dvh]'} transition-all duration-700 ${(isResting || isLongRestOpen || isShortRestOpen || isLevelUpOpen || newLootPopup || isGuideOpen || !!activeLoot || (!isDM && char.hasCompletedTutorial !== true)) ? 'opacity-50 pointer-events-none blur-sm' : 'opacity-100'}`}>
          
          {isDM ? (
            <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4 sticky top-0 bg-slate-900 z-40 pt-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><User className="w-6 h-6 text-indigo-400" /> {char.name}'s Sheet (DM Mode)</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsEditMode(true)} className="flex items-center gap-2 text-indigo-400 hover:text-white transition-colors bg-indigo-900/30 px-4 py-2 rounded-lg border border-indigo-500/30 hover:bg-indigo-600 shadow-sm"><Edit3 className="w-4 h-4" /> Edit Core Stats</button>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-lg"><X className="w-6 h-6" /></button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <div className="flex items-center gap-3">
                <img src="/icon.png" alt="App Icon" className="w-8 h-8 rounded-md shadow-lg" />
                <h1 className="text-xl font-bold text-slate-300 tracking-wider hidden sm:block">CAMPAIGN COMPANION</h1>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsGuideOpen(true)} className={`flex items-center justify-center w-10 h-10 ${activeTheme.text} hover:text-white transition-colors bg-slate-900/30 rounded-lg border ${activeTheme.border} hover:${activeTheme.bg} shadow-sm`}><HelpCircle className="w-5 h-5" /></button>
                <button onClick={onLogout} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-slate-800 px-4 py-2 h-10 rounded-lg border border-slate-700 hover:border-slate-500"><LogOut className="w-4 h-4" /> Exit</button>
              </div>
            </div>
          )}

          <div className={`bg-slate-800 border ${isUnconscious ? 'border-red-900 shadow-[0_0_30px_rgba(220,38,38,0.2)]' : 'border-slate-700 shadow-xl'} rounded-2xl mb-4 md:mb-6 relative flex flex-col overflow-hidden transition-all duration-500`}>
            
            <div className="w-full h-48 md:h-64 relative group shrink-0 overflow-hidden block">
              <div className={`w-full h-full relative ${char.isConcentrating ? `ring-[6px] ring-inset ${activeTheme.ring} animate-pulse z-20` : ''} ${isFrightened ? 'ring-[6px] ring-inset ring-fuchsia-600 animate-pulse z-20' : ''}`}>
                <img src={`/${currentUser.charId}.png`} alt={char.name} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isUnconscious ? 'grayscale' : ''}`} onError={(e) => { e.target.src = 'https://via.placeholder.com/800x400?text=No+Image'; }} />
                {char.isConcentrating && <div className={`absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm ${activeTheme.text} px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest border ${activeTheme.border}`}>Concentrating</div>}
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-slate-800 via-slate-900/20 to-transparent pointer-events-none z-10"></div>
              
              <button onClick={(e) => { e.stopPropagation(); setIsImageOpen(true); }} className="absolute top-4 right-4 p-2 bg-slate-900/50 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer" title="View Full Portrait"><Maximize className="w-5 h-5 text-white" /></button>
              
              {isUnconscious && <div className="absolute inset-0 flex items-center justify-center bg-red-950/60 backdrop-blur-[1px] pointer-events-none z-10"><Skull className="w-16 h-16 text-white drop-shadow-md animate-pulse" /></div>}
              
              <div className="absolute bottom-4 left-4 md:left-6 text-left pointer-events-none z-10">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className={`text-3xl md:text-4xl font-black leading-tight drop-shadow-lg break-words text-balance ${isUnconscious ? 'text-red-400' : 'text-white'}`}>{char.name}</h2>
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <button onClick={isDM ? toggleInspiration : undefined} className={`shrink-0 transition-all z-10 flex items-center justify-center ${isDM ? 'cursor-pointer hover:scale-105' : 'cursor-default pointer-events-none'} ${char.inspiration ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,1)] scale-110' : (isDM ? 'text-slate-400 hover:text-yellow-400/50' : 'text-slate-600')}`}><Star className="w-6 h-6 md:w-8 md:h-8 fill-current pointer-events-none" /></button>
                    {char.inspiration && <span className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest shadow-[0_0_10px_rgba(250,204,21,0.5)]">Inspired</span>}
                  </div>
                </div>
                <p className={`${activeTheme.text} font-bold text-base md:text-lg drop-shadow-md break-words text-balance`}>Level {char.level} • {char.race} • {char.class}</p>
              </div>
            </div>

            <div className="p-4 md:p-6 space-y-5">
              
              <div className="relative bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-inner h-12 md:h-14">
                <div className={`absolute left-0 top-0 bottom-0 ${activeTheme.bg} opacity-20 transition-all duration-500`} style={{ width: `${xpPercent}%` }}></div>
                <div className="relative z-10 flex items-center justify-between px-3 sm:px-4 h-full">
                  <div className="flex items-center gap-3">
                    <ArrowUpCircle className={`w-4 h-4 md:w-5 md:h-5 ${canLevelUp ? `${activeTheme.text} animate-pulse` : 'text-slate-500'}`} />
                    <span className="text-xs md:text-sm font-black text-slate-300 uppercase tracking-widest hidden sm:block">Experience</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button onClick={() => adjustXp(-50)} className="w-8 h-8 md:w-9 md:h-9 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 font-bold flex items-center justify-center border border-slate-600 transition-colors shadow-sm cursor-pointer">-50</button>
                    
                    <div className="flex items-center gap-2 text-white bg-slate-800/50 border border-slate-600 rounded-lg px-2 py-1">
                      <input type="number" value={currentXp} onChange={(e) => updateField('exp', Number(e.target.value))} className="w-16 md:w-20 bg-transparent focus:outline-none text-right font-black text-base md:text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-100" />
                      <span className="text-slate-500 font-black text-base md:text-lg">/</span>
                      <span className="w-16 md:w-20 text-left text-slate-400 text-base md:text-lg font-bold">{nextLevelXp}</span>
                    </div>

                    <button onClick={() => adjustXp(50)} className="w-8 h-8 md:w-9 md:h-9 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 font-bold flex items-center justify-center border border-slate-600 transition-colors shadow-sm cursor-pointer">+50</button>
                  </div>
                </div>
              </div>

              {canLevelUp && !isDM && (
                <button onClick={() => setIsLevelUpOpen(true)} className={`w-full ${activeTheme.bg} hover:opacity-80 text-white font-black text-sm md:text-base py-3 rounded-xl transition-all ${activeTheme.shadow} flex items-center justify-center gap-2 animate-in slide-in-from-top-2`}>
                  <ArrowUpCircle className="w-5 h-5 animate-bounce" /> Level Up Available!
                </button>
              )}
              
              <div className="relative bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-inner min-h-[64px] md:min-h-[80px] p-2 sm:p-3">
                <div className={`absolute left-0 top-0 bottom-0 ${hpColor} transition-all duration-500`} style={{ width: `${hpPercent}%` }}></div>
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between h-full gap-3">
                  
                  {isUnconscious ? (
                    <div className="flex items-center gap-3 md:gap-6 animate-in fade-in duration-300 w-full md:w-auto justify-center md:justify-start">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-400 mb-1">PASS</span>
                        <div className="flex gap-1.5">
                          {[1, 2, 3].map(num => <button key={`pass-${num}`} onClick={() => updateDeathSaves('successes', (char.deathSaves?.successes || 0) === num ? num - 1 : num)} className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 transition-all ${(char.deathSaves?.successes || 0) >= num ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.6)]' : 'bg-slate-800 border-slate-600 hover:border-emerald-500/50'}`} />)}
                        </div>
                      </div>
                      <div className="w-px h-8 bg-slate-700/50"></div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-400 mb-1">FAIL</span>
                        <div className="flex gap-1.5">
                          {[1, 2, 3].map(num => <button key={`fail-${num}`} onClick={() => updateDeathSaves('failures', (char.deathSaves?.failures || 0) === num ? num - 1 : num)} className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 transition-all ${(char.deathSaves?.failures || 0) >= num ? 'bg-red-600 border-red-400 shadow-[0_0_10px_rgba(220,38,38,0.6)]' : 'bg-slate-800 border-slate-600 hover:border-red-500/50'}`} />)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-2 w-full md:w-auto justify-between md:justify-start">
                      <div className="flex items-center gap-2">
                        <Heart className={`w-5 h-5 ${isPoisoned ? 'text-lime-400' : 'text-emerald-400'}`} />
                        <span className="text-xs sm:text-sm font-black text-slate-300 uppercase tracking-widest">Hit Points</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 bg-blue-900/30 border border-blue-500/40 px-2 py-1 rounded-lg ml-2 shadow-inner">
                        <Shield className="w-3 h-3 text-blue-400" />
                        <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Temp</span>
                        <input 
                          type="number" 
                          value={isEditingTempHp ? displayTempHp : (char.tempHp || 0)} 
                          onFocus={() => { setDisplayTempHp(char.tempHp || 0); setIsEditingTempHp(true); }}
                          onChange={(e) => setDisplayTempHp(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                          onBlur={(e) => {
                            setIsEditingTempHp(false);
                            submitHpUpdate(char.hp, e.target.value);
                          }}
                          className="w-8 bg-transparent focus:outline-none text-center font-black text-blue-100 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-end">
                    {!isUnconscious && (
                      <button onClick={() => adjustHp(-1)} className="w-10 h-10 md:w-10 md:h-10 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xl flex items-center justify-center border border-slate-600 transition-colors shadow-sm cursor-pointer">-</button>
                    )}
                    
                    <div className="flex items-center gap-1.5 text-white bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-1.5 md:py-2">
                      <input 
                        type="number" 
                        value={isEditingHp ? displayHp : (char.hp ?? 0)} 
                        onFocus={() => { setDisplayHp(char.hp ?? 0); setIsEditingHp(true); }}
                        onChange={(e) => setDisplayHp(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                        onBlur={(e) => {
                          setIsEditingHp(false);
                          submitHpUpdate(e.target.value, char.tempHp);
                        }}
                        className={`w-14 md:w-16 bg-transparent focus:outline-none text-center font-black text-2xl md:text-2xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isUnconscious && !isEditingHp ? 'text-red-400' : ''} ${isEditingHp ? activeTheme.text : ''}`} 
                      />
                      <span className="text-slate-500 font-black text-xl md:text-xl">/</span>
                      <input 
                        type="number" 
                        value={isEditingMaxHp ? displayMaxHp : (char.maxHp || 10)} 
                        onFocus={() => { setDisplayMaxHp(char.maxHp || 10); setIsEditingMaxHp(true); }}
                        onChange={(e) => setDisplayMaxHp(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                        onBlur={(e) => {
                          setIsEditingMaxHp(false);
                          const parsedMax = parseInt(e.target.value, 10);
                          updateField('maxHp', isNaN(parsedMax) ? (char.maxHp || 10) : parsedMax);
                        }} 
                        className={`w-14 md:w-16 bg-transparent focus:outline-none text-center text-slate-400 text-xl md:text-xl font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isEditingMaxHp ? activeTheme.text : ''}`} 
                      />
                    </div>

                    {!isUnconscious && (
                      <button onClick={() => adjustHp(1)} className="w-10 h-10 md:w-10 md:h-10 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xl flex items-center justify-center border border-slate-600 transition-colors shadow-sm cursor-pointer">+</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6"><StatGrid stats={char.stats || {}} /></div>

          <div className="flex flex-col gap-3 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-800 shadow-sm">
            <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Heart className="w-4 h-4 text-emerald-500" /> Available Hit Dice</span>
              <div className="flex items-center gap-2">
                <span className="bg-slate-800 text-white font-bold px-3 py-1 rounded-lg border border-slate-600">{char.hitDice?.current ?? char.level} / {char.hitDice?.max ?? char.level}</span>
                <span className="text-xs text-slate-500 font-bold">({char.hitDice?.type || 'd8'})</span>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsShortRestOpen(true)} disabled={isResting} className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 py-3 rounded-lg font-medium transition-colors border border-slate-700 shadow-sm">
                <Tent className="w-5 h-5 text-emerald-400" /> Short Rest
              </button>
              <button onClick={handleLongRest} disabled={isResting} className={`flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed ${activeTheme.text} py-3 rounded-lg font-bold transition-colors border ${activeTheme.border} shadow-sm`}>
                <Moon className="w-5 h-5" /> Long Rest
              </button>
            </div>
          </div>

          <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl pt-2 pb-4 -mx-3 px-3 md:-mx-8 md:px-8 border-b border-slate-800 shadow-md mb-6">
            <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-800 relative">
              <ScrollableRow className="gap-2">
                {[
                  { id: 'combat', icon: Swords, label: 'Combat' }, 
                  { id: 'spells', icon: Flame, label: 'Spells' }, 
                  { id: 'features', icon: Sparkles, label: 'Features' }, 
                  { id: 'inventory', icon: Backpack, label: 'Inventory' }, 
                  { id: 'partyLoot', icon: Gem, label: 'Party Loot' }, 
                  { id: 'bio', icon: BookOpen, label: 'Bio' }, 
                  { id: 'journal', icon: PenTool, label: 'Journal' }
                ].map(tab => (
                  <button 
                    key={tab.id} id={`tab-btn-${tab.id}`} onClick={() => setActiveTab(tab.id)} 
                    className={`flex flex-col items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm whitespace-nowrap transition-all flex-1 min-w-[100px] snap-center relative ${activeTab === tab.id ? `${activeTheme.bg} text-white shadow-md` : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                  >
                    <tab.icon className="w-4 h-4" /> {tab.label}
                    {tab.id === 'partyLoot' && partyLoot.length > 0 && activeTab !== 'partyLoot' && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
                    {activeTab === tab.id && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-in fade-in zoom-in duration-300"></div>}
                  </button>
                ))}
              </ScrollableRow>
            </div>
          </div>

          <div className="space-y-6 animate-in fade-in duration-300">
            
            {activeTab === 'combat' && (
              <CombatTab 
                char={char} 
                charId={currentUser.charId}
                isDM={isDM} 
                updateField={updateField} 
                activeTheme={activeTheme} 
                combatWarnings={combatWarnings}
                activeConditions={activeConditions}
                handleAddCondition={(e) => handleAddCondition(e.target.value)}
                handleRemoveCondition={handleRemoveCondition}
              />
            )}

            {activeTab === 'spells' && <Spellbook char={char} charId={currentUser.charId} isDM={isDM} />}

            {activeTab === 'features' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2"><Sparkles className={`w-5 h-5 ${activeTheme.text}`} /> Class & Racial Features</h3>
                  {(char.features || []).map((feat, i) => <CollapsibleSection key={`feat-${i}`} title={feat.name} defaultOpen={i === 0}><p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{feat.desc}</p></CollapsibleSection>)}
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2"><BookOpen className={`w-5 h-5 ${activeTheme.text}`} /> Proficiencies</h3>
                  {Object.entries(char.proficiencies || {}).map(([key, val]) => <div key={key} className="bg-slate-800 border border-slate-700 rounded-xl p-4"><h4 className="font-bold text-slate-400 capitalize text-xs tracking-wider mb-2">{key}</h4><p className="text-slate-200 text-sm">{val}</p></div>)}
                </div>
              </div>
            )}

            {activeTab === 'inventory' && <InventoryTab char={char} isDM={isDM} updateField={updateField} activeTheme={activeTheme} />}

            {activeTab === 'partyLoot' && <PartyLootTab partyLoot={partyLoot} setActiveLoot={setActiveLoot} />}

            {activeTab === 'bio' && <BioTab char={char} charId={currentUser.charId} isDM={isDM} updateField={updateField} activeTheme={activeTheme} THEMES={THEMES} restoreCharacter={restoreCharacter} />}

            {activeTab === 'journal' && <JournalTab char={char} updateField={updateField} activeTheme={activeTheme} />}
            
          </div>
        </div>

        {isLevelUpOpen && <LevelUpModal char={char} charId={currentUser.charId} onClose={() => setIsLevelUpOpen(false)} />}
        {isShortRestOpen && <ShortRestModal char={char} charId={currentUser.charId} onClose={() => setIsShortRestOpen(false)} />}
        {isLongRestOpen && <LongRestModal char={char} charId={currentUser.charId} onClose={() => setIsLongRestOpen(false)} />}
        
        {!isDM && (
          <>
            <PartyLootModal item={newLootPopup} onDismiss={dismissLootPopup} />
            {isGuideOpen && <PlayerGuideModal onClose={() => setIsGuideOpen(false)} />}
          </>
        )}
      </div>
    </CardWrapper>
  );
}