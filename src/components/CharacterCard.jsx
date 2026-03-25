import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  LogOut, Swords, Sparkles, Backpack, BookOpen, 
  Tent, Moon, PenTool, Skull, Gem, X, HelpCircle, ArrowUpCircle, Star, User, Edit3, Flame, Shield, Heart, Maximize, Settings
} from 'lucide-react';

import { PREMADE_CHARACTERS } from '../data/campaignData';
import StatGrid from './shared/StatGrid';
import QuickTraits from './shared/QuickTraits'; 
import CollapsibleSection from './shared/CollapsibleSection';
import ImageModal from './shared/ImageModal'; 
import GlobalLoader from './shared/GlobalLoader';

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
import SettingsTab from './tabs/SettingsTab';

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

  const [char, setChar] = useState(null); 
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
  const [isBattleMapOpen, setIsBattleMapOpen] = useState(false);
  const [saveToast, setSaveToast] = useState(''); 

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

  const handleSpendHitDie = async () => {
    const currentHD = char.hitDice?.current ?? char.level;
    const maxHD = char.hitDice?.max ?? char.level;
    
    if (currentHD > 0) {
      const amount = window.prompt(`Spending 1 Hit Die (${currentHD}/${maxHD} remaining).\nHow much HP did you heal?`);
      const healAmt = parseInt(amount, 10);
      if (!isNaN(healAmt) && healAmt > 0) {
        await adjustHp(healAmt);
        await updateField('hitDice', { current: currentHD - 1, max: maxHD });
      }
    } else {
      alert("You have no Hit Dice remaining! Take a Long Rest to recover them.");
    }
  };

  if (isKicked) return isDM ? null : <SessionResetModal onLogout={onLogout} />;
  
  if (!char) return <CardWrapper><GlobalLoader /></CardWrapper>;

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
        
        {!isDM && (
          <>
            <BattleMapLayer char={char} charId={currentUser.charId} isOpen={isBattleMapOpen} onClose={() => setIsBattleMapOpen(false)} />
            <StickyBattleNav onToggleMap={setIsBattleMapOpen} isMapOpen={isBattleMapOpen} activeTheme={activeTheme} />
          </>
        )}

        {!isDM && char && !char.hasCompletedTutorial && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-auto">
            <OnboardingWizard charName={char.name} onComplete={handleCompleteOnboarding} />
          </div>
        )}

        {saveToast && (
          <div className="fixed bottom-6 right-6 bg-slate-800 text-emerald-400 px-4 py-3 rounded-xl shadow-2xl border border-emerald-900/50 z-[99999] animate-in slide-in-from-bottom-5 fade-in duration-300 font-bold text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> {saveToast}
          </div>
        )}

        <ImageModal isOpen={isImageOpen} url={`/${currentUser.charId}.png`} alt={char.name || 'Character'} onClose={() => setIsImageOpen(false)} />
        <ImageModal isOpen={!!activeLoot} url={activeLoot?.url} alt={activeLoot?.name} onClose={() => setActiveLoot(null)} />
        {isDM && isEditMode && <DMEditSheet char={char} charId={currentUser.charId} onCancel={() => setIsEditMode(false)} />}

        <div className={`${isDM ? 'p-6' : 'max-w-4xl mx-auto p-3 md:p-8 min-h-[100dvh]'} transition-all duration-700 ${(isLongRestOpen || isShortRestOpen || isLevelUpOpen || newLootPopup || isGuideOpen || !!activeLoot || (!isDM && !char.hasCompletedTutorial)) ? 'opacity-50 pointer-events-none blur-sm' : 'opacity-100'}`}>
          
          {/* Top Bar Navigation */}
          {isDM ? (
            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-4 sticky top-0 bg-slate-900 z-40 pt-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><User className="w-6 h-6 text-indigo-400" /> {char.name}'s Sheet (DM Mode)</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsEditMode(true)} className="flex items-center gap-2 text-indigo-400 hover:text-white transition-colors bg-indigo-900/30 px-3 py-1.5 rounded-lg border border-indigo-500/30 hover:bg-indigo-600 text-sm"><Edit3 className="w-4 h-4" /> Edit Core Stats</button>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-1.5 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <img src="/icon.png" alt="App Icon" className="w-8 h-8 rounded-md shadow-lg" />
                <h1 className="text-lg font-bold text-slate-300 tracking-wider hidden sm:block">CAMPAIGN COMPANION</h1>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsGuideOpen(true)} className={`flex items-center justify-center w-9 h-9 ${activeTheme.text} hover:text-white transition-colors bg-slate-900/30 rounded-lg border ${activeTheme.border} hover:${activeTheme.bg} shadow-sm`}><HelpCircle className="w-4 h-4" /></button>
                <button onClick={onLogout} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-slate-800 px-3 py-1.5 h-9 rounded-lg border border-slate-700 text-sm"><LogOut className="w-3 h-3" /> Exit</button>
              </div>
            </div>
          )}

          {/* HEADER SECTION */}
          <div className={`bg-slate-900 border ${isUnconscious ? 'border-red-900 shadow-[0_0_30px_rgba(220,38,38,0.2)]' : 'border-slate-700 shadow-xl'} rounded-2xl mb-6 relative flex flex-col overflow-hidden`}>
            
            {/* Portrait */}
            <div className="w-full h-32 md:h-48 relative group shrink-0 overflow-hidden block">
              <div className={`w-full h-full relative ${char.isConcentrating ? `ring-[4px] ring-inset ${activeTheme.ring} animate-pulse z-20` : ''} ${isFrightened ? 'ring-[4px] ring-inset ring-fuchsia-600 animate-pulse z-20' : ''}`}>
                <img src={`/${currentUser.charId}.png`} alt={char.name} className={`w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105 ${isUnconscious ? 'grayscale' : ''}`} onError={(e) => { e.target.src = 'https://via.placeholder.com/800x400?text=No+Image'; }} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent pointer-events-none z-10"></div>
              
              <button onClick={(e) => { e.stopPropagation(); setIsImageOpen(true); }} className="absolute top-3 right-3 p-1.5 bg-slate-900/50 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"><Maximize className="w-4 h-4 text-white" /></button>
              
              {isUnconscious && <div className="absolute inset-0 flex items-center justify-center bg-red-950/60 backdrop-blur-[1px] pointer-events-none z-10"><Skull className="w-12 h-12 text-white drop-shadow-md animate-pulse" /></div>}
              
              <div className="absolute bottom-3 left-4 md:left-6 text-left pointer-events-none z-10">
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className={`text-2xl md:text-3xl font-black leading-tight drop-shadow-lg text-balance ${isUnconscious ? 'text-red-400' : 'text-white'}`}>{char.name}</h2>
                  <div className="flex items-center pointer-events-auto">
                    <button onClick={isDM ? toggleInspiration : undefined} className={`shrink-0 transition-all z-10 flex items-center justify-center ${isDM ? 'cursor-pointer hover:scale-110' : 'pointer-events-none'} ${char.inspiration ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,1)] scale-110' : (isDM ? 'text-slate-400 hover:text-yellow-400/50' : 'text-slate-600')}`}><Star className="w-5 h-5 md:w-6 md:h-6 fill-current pointer-events-none" /></button>
                  </div>
                </div>
                <p className={`${activeTheme.text} font-bold text-xs md:text-sm drop-shadow-md`}>Lvl {char.level} {char.race} {char.class.split(' ')[0]}</p>
              </div>
            </div>

            <div className="p-3 md:p-4 bg-slate-800 space-y-3">
              
              {/* Condense HP & Rests into a Single Row/Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                
                {/* Left Side: HP */}
                <div className="relative bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-inner flex items-center justify-between p-2">
                  <div className={`absolute left-0 top-0 bottom-0 ${hpColor} transition-all duration-500`} style={{ width: `${hpPercent}%` }}></div>
                  
                  {isUnconscious ? (
                    <div className="relative z-10 flex items-center justify-center gap-4 w-full">
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-slate-400 mb-0.5">PASS</span>
                        <div className="flex gap-1">
                          {[1, 2, 3].map(num => <button key={`pass-${num}`} onClick={() => updateDeathSaves('successes', (char.deathSaves?.successes || 0) === num ? num - 1 : num)} className={`w-4 h-4 rounded-full border-2 transition-all ${(char.deathSaves?.successes || 0) >= num ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-800 border-slate-600'}`} />)}
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-slate-400 mb-0.5">FAIL</span>
                        <div className="flex gap-1">
                          {[1, 2, 3].map(num => <button key={`fail-${num}`} onClick={() => updateDeathSaves('failures', (char.deathSaves?.failures || 0) === num ? num - 1 : num)} className={`w-4 h-4 rounded-full border-2 transition-all ${(char.deathSaves?.failures || 0) >= num ? 'bg-red-600 border-red-400' : 'bg-slate-800 border-slate-600'}`} />)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="relative z-10 flex items-center gap-2 pl-2">
                        <Heart className={`w-4 h-4 ${isPoisoned ? 'text-lime-400' : 'text-emerald-400'}`} />
                        <div className="flex items-center gap-1 bg-blue-900/30 border border-blue-500/40 px-1.5 py-0.5 rounded ml-1">
                          <Shield className="w-3 h-3 text-blue-400" />
                          <input type="number" value={isEditingTempHp ? displayTempHp : (char.tempHp || 0)} onFocus={() => { setDisplayTempHp(char.tempHp || 0); setIsEditingTempHp(true); }} onChange={(e) => setDisplayTempHp(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} onBlur={(e) => { setIsEditingTempHp(false); submitHpUpdate(char.hp, e.target.value); }} className="w-6 bg-transparent focus:outline-none text-center font-black text-blue-100 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                        </div>
                      </div>

                      <div className="relative z-10 flex items-center gap-1 pr-1">
                        <button onClick={() => adjustHp(-1)} className="w-8 h-8 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-lg flex items-center justify-center border border-slate-600 cursor-pointer">-</button>
                        <div className="flex items-center gap-1 text-white bg-slate-800/50 border border-slate-600 rounded px-2 py-1">
                          <input type="number" value={isEditingHp ? displayHp : (char.hp ?? 0)} onFocus={() => { setDisplayHp(char.hp ?? 0); setIsEditingHp(true); }} onChange={(e) => setDisplayHp(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} onBlur={(e) => { setIsEditingHp(false); submitHpUpdate(e.target.value, char.tempHp); }} className={`w-8 bg-transparent focus:outline-none text-center font-black text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isUnconscious && !isEditingHp ? 'text-red-400' : ''} ${isEditingHp ? activeTheme.text : ''}`} />
                          <span className="text-slate-500 font-black text-sm">/</span>
                          <input type="number" value={isEditingMaxHp ? displayMaxHp : (char.maxHp || 10)} onFocus={() => { setDisplayMaxHp(char.maxHp || 10); setIsEditingMaxHp(true); }} onChange={(e) => setDisplayMaxHp(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} onBlur={(e) => { setIsEditingMaxHp(false); const parsedMax = parseInt(e.target.value, 10); updateField('maxHp', isNaN(parsedMax) ? (char.maxHp || 10) : parsedMax); }} className={`w-8 bg-transparent focus:outline-none text-center text-slate-400 text-lg font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isEditingMaxHp ? activeTheme.text : ''}`} />
                        </div>
                        <button onClick={() => adjustHp(1)} className="w-8 h-8 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-lg flex items-center justify-center border border-slate-600 cursor-pointer">+</button>
                      </div>
                    </>
                  )}
                </div>

                {/* Right Side: Rests & Hit Dice */}
                <div className="flex gap-2 h-full">
                  <button onClick={handleSpendHitDie} className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center flex-col shadow-inner px-2 py-1 transition-colors cursor-pointer group">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5 group-hover:text-slate-300 transition-colors">Hit Dice</span>
                    <span className="text-sm font-black text-emerald-400">{char.hitDice?.current ?? char.level}/{char.hitDice?.max ?? char.level}</span>
                  </button>

                  <button onClick={() => setIsShortRestOpen(true)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 flex flex-col items-center justify-center transition-colors shadow-sm py-1">
                    <Tent className="w-4 h-4 text-emerald-400 mb-0.5" />
                    <span className="text-[10px] font-bold uppercase">Short Rest</span>
                  </button>
                  <button onClick={() => setIsLongRestOpen(true)} className={`flex-1 bg-slate-900 hover:bg-slate-800 ${activeTheme.text} rounded-xl border ${activeTheme.border} flex flex-col items-center justify-center transition-colors shadow-sm py-1`}>
                    <Moon className="w-4 h-4 mb-0.5" />
                    <span className="text-[10px] font-bold uppercase">Long Rest</span>
                  </button>
                </div>

              </div>

              {/* Improved Sleek XP Tracker */}
              <div className="relative bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-inner flex items-center justify-between p-2">
                <div className={`absolute left-0 top-0 bottom-0 ${canLevelUp ? 'bg-amber-500/30' : 'bg-blue-500/20'} transition-all duration-500`} style={{ width: `${xpPercent}%` }}></div>
                <div className="relative z-10 flex items-center gap-2 pl-2">
                  <ArrowUpCircle className={`w-4 h-4 ${canLevelUp ? 'text-amber-400 animate-pulse' : 'text-blue-400'}`} />
                  <span className="text-[10px] md:text-xs font-bold text-slate-300 uppercase tracking-widest">Experience</span>
                </div>
                <div className="relative z-10 flex items-center gap-1 pr-1">
                  <button onClick={() => adjustXp(-50)} className="w-6 h-6 md:w-8 md:h-8 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 font-bold flex items-center justify-center border border-slate-600 transition-colors shadow-sm cursor-pointer">-</button>
                  <div className="flex items-center gap-1 text-white bg-slate-800/50 border border-slate-600 rounded-lg px-2 py-0.5 md:py-1">
                    <input type="number" value={currentXp} onChange={(e) => updateField('exp', Number(e.target.value))} className="w-12 md:w-16 bg-transparent focus:outline-none text-right font-black text-sm md:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-100" />
                    <span className="text-slate-500 font-black text-sm md:text-base">/</span>
                    <span className="w-12 md:w-16 text-left text-slate-400 text-sm md:text-base font-bold">{nextLevelXp}</span>
                  </div>
                  <button onClick={() => adjustXp(50)} className="w-6 h-6 md:w-8 md:h-8 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 font-bold flex items-center justify-center border border-slate-600 transition-colors shadow-sm cursor-pointer">+</button>
                </div>
              </div>

            </div>
          </div>

          <div className="mb-6">
            <StatGrid char={char} activeTheme={activeTheme} />
            <QuickTraits features={char.features} />
          </div>

          {/* NEW QoL: Native Swipeable Sticky Tabs */}
          <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl pt-1 pb-3 -mx-3 px-3 md:-mx-8 md:px-8 border-b border-slate-800 shadow-md mb-6">
            <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-800 flex overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full gap-1 sm:gap-2 justify-between snap-x snap-mandatory">
              {[
                { id: 'combat', icon: Swords, label: 'Combat' }, 
                { id: 'spells', icon: Flame, label: 'Spells' }, 
                { id: 'features', icon: Sparkles, label: 'Features' }, 
                { id: 'inventory', icon: Backpack, label: 'Inventory' }, 
                { id: 'partyLoot', icon: Gem, label: 'Party Loot' }, 
                { id: 'bio', icon: BookOpen, label: 'Bio' }, 
                { id: 'journal', icon: PenTool, label: 'Journal' },
                { id: 'settings', icon: Settings, label: 'Settings' }
              ].map(tab => (
                <button 
                  key={tab.id} id={`tab-btn-${tab.id}`} onClick={() => setActiveTab(tab.id)} 
                  className={`snap-center flex-1 min-w-[50px] sm:min-w-[70px] flex items-center justify-center gap-2 px-2 py-2.5 rounded-lg font-medium text-xs md:text-sm whitespace-nowrap transition-all relative ${activeTab === tab.id ? `${activeTheme.bg} text-white shadow-md` : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                >
                  <tab.icon className="w-4 h-4" /> 
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.id === 'partyLoot' && partyLoot.length > 0 && activeTab !== 'partyLoot' && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
                  {activeTab === tab.id && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-in fade-in zoom-in duration-300"></div>}
                </button>
              ))}
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
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2"><Sparkles className={`w-5 h-5 ${activeTheme.text}`} /> Class & Racial Features</h3>
                {(char.features || []).map((feat, i) => (
                  <CollapsibleSection key={`feat-${i}`} title={feat.name} defaultOpen={i === 0}>
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{feat.desc}</p>
                  </CollapsibleSection>
                ))}
              </div>
            )}

            {activeTab === 'inventory' && <InventoryTab char={char} isDM={isDM} updateField={updateField} activeTheme={activeTheme} />}

            {activeTab === 'partyLoot' && <PartyLootTab partyLoot={partyLoot} setActiveLoot={setActiveLoot} />}

            {activeTab === 'bio' && <BioTab char={char} charId={currentUser.charId} isDM={isDM} updateField={updateField} activeTheme={activeTheme} THEMES={THEMES} restoreCharacter={restoreCharacter} />}

            {activeTab === 'journal' && <JournalTab char={char} updateField={updateField} activeTheme={activeTheme} />}

            {activeTab === 'settings' && <SettingsTab char={char} updateField={updateField} activeTheme={activeTheme} THEMES={THEMES} restoreCharacter={restoreCharacter} />}
            
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