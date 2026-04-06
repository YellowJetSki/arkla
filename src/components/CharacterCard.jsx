import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { doc, setDoc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  LogOut, Swords, Sparkles, Backpack, BookOpen, 
  PenTool, Gem, X, HelpCircle, User, Edit3, Flame, Settings, Hammer, Trash2, Plus, BellRing, PawPrint, Search, ChevronDown, ChevronUp, ShieldPlus, EyeOff, Zap, ZapOff
} from 'lucide-react';

import StatGrid from './shared/StatGrid';
import QuickTraits from './shared/QuickTraits'; 
import ImageModal from './shared/ImageModal'; 
import GlobalLoader from './shared/GlobalLoader';
import DialogModal from './shared/DialogModal';
import CollapsibleSection from './shared/CollapsibleSection';

import CharacterHeader from './character/CharacterHeader';
import LevelUpModal from './LevelUpModal';
import SessionResetModal from './SessionResetModal';
import PlayerGuideModal from './PlayerGuideModal';
import PartyLootModal from './PartyLootModal'; 
import ShortRestModal from './ShortRestModal'; 
import LongRestModal from './LongRestModal'; 
import Spellbook from './Spellbook'; 
import OnboardingWizard from './OnboardingWizard'; 
import DMCharacterBuilder from './DMCharacterBuilder';

import InventoryTab from './tabs/InventoryTab'; 
import CombatTab from './tabs/CombatTab';
import BioTab from './tabs/BioTab';
import PartyLootTab from './tabs/PartyLootTab';
import JournalTab from './tabs/JournalTab';
import SettingsTab from './tabs/SettingsTab';
import CompanionTab from './tabs/CompanionTab'; 

import BattleMapLayer from './battlemap/BattleMapLayer';
import StickyBattleNav from './battlemap/StickyBattleNav';

import { fetchAllTraitsAndFeatures, fetchTraitOrFeatureDetails } from '../services/srdApi';

const THEMES = {
  indigo: { 
    text: 'text-indigo-400', bg: 'bg-indigo-600', hoverBg: 'hover:bg-indigo-600',
    border: 'border-indigo-500/50', activeBorder: 'border-indigo-500',
    hoverBorder: 'hover:border-indigo-500/50', ring: 'ring-indigo-500', 
    shadow: 'shadow-[0_0_15px_rgba(99,102,241,0.5)]', ambient: 'from-indigo-950/40 via-slate-950', accent: 'bg-indigo-500/10' 
  },
  emerald: { 
    text: 'text-emerald-400', bg: 'bg-emerald-600', hoverBg: 'hover:bg-emerald-600',
    border: 'border-emerald-500/50', activeBorder: 'border-emerald-500',
    hoverBorder: 'hover:border-emerald-500/50', ring: 'ring-emerald-500', 
    shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.5)]', ambient: 'from-emerald-950/40 via-slate-950', accent: 'bg-emerald-500/10' 
  },
  rose: { 
    text: 'text-rose-400', bg: 'bg-rose-600', hoverBg: 'hover:bg-rose-600',
    border: 'border-rose-500/50', activeBorder: 'border-rose-500',
    hoverBorder: 'hover:border-rose-500/50', ring: 'ring-rose-500', 
    shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.5)]', ambient: 'from-rose-950/40 via-slate-950', accent: 'bg-rose-500/10' 
  },
  amber: { 
    text: 'text-amber-400', bg: 'bg-amber-600', hoverBg: 'hover:bg-amber-600',
    border: 'border-amber-500/50', activeBorder: 'border-amber-500',
    hoverBorder: 'hover:border-amber-500/50', ring: 'ring-amber-500', 
    shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.5)]', ambient: 'from-amber-950/40 via-slate-950', accent: 'bg-amber-500/10' 
  },
  sky: { 
    text: 'text-sky-400', bg: 'bg-sky-600', hoverBg: 'hover:bg-sky-600',
    border: 'border-sky-500/50', activeBorder: 'border-sky-500',
    hoverBorder: 'hover:border-sky-500/50', ring: 'ring-sky-500', 
    shadow: 'shadow-[0_0_15px_rgba(14,165,233,0.5)]', ambient: 'from-sky-950/40 via-slate-950', accent: 'bg-sky-500/10' 
  },
};

const CardWrapper = ({ isDM, onClose, children }) => {
  if (isDM) {
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md h-[100dvh] overflow-hidden animate-in fade-in duration-300">
        <div className="bg-slate-900 border-[3px] border-indigo-500 rounded-3xl w-full max-w-[98vw] xl:max-w-7xl shadow-[12px_12px_0px_rgba(0,0,0,1)] flex flex-col h-[95dvh] animate-in zoom-in-95 duration-500 relative overflow-hidden">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-[999999] bg-slate-950 text-slate-400 hover:text-white p-2 rounded-xl border-2 border-slate-800 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-red-500 hover:border-red-950 transition-all active:translate-y-[2px] active:shadow-none"
            title="Close Sheet"
          >
             <X className="w-5 h-5" />
          </button>
          {children}
        </div>
      </div>,
      document.body
    );
  }
  return <>{children}</>;
};

export default function CharacterCard({ currentUser, onLogout, isDM = false, onClose = null }) {
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
  
  // Players no longer have access to Edit Mode. This will remain false for them.
  const [isEditMode, setIsEditMode] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  
  const [isImageOpen, setIsImageOpen] = useState(false); 
  const [activeLoot, setActiveLoot] = useState(null); 
  const [isBattleMapOpen, setIsBattleMapOpen] = useState(false);
  const [saveToast, setSaveToast] = useState(''); 
  const [showCoreStats, setShowCoreStats] = useState(false);

  const [isForgingFeat, setIsForgingFeat] = useState(false);
  const [customFeat, setCustomFeat] = useState({ name: '', desc: '', hasTracker: false, trackerMax: 1, trackerRecharge: 'long' });
  const [srdFeatsList, setSrdFeatsList] = useState([]);
  const [filteredFeats, setFilteredFeats] = useState([]);
  const [showFeatDropdown, setShowFeatDropdown] = useState(false);
  
  const [addingTrackerFor, setAddingTrackerFor] = useState(null);
  const [newTrackerConfig, setNewTrackerConfig] = useState({ max: 1, recharge: 'long' });

  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', inputPlaceholder: '', onConfirm: null });

  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  const showDialog = (options) => {
    if (options.isOpen === false) {
      closeDialog();
    } else {
      setDialog(prev => ({ ...prev, ...options, isOpen: true }));
    }
  };

  useEffect(() => {
    const activeBtn = document.getElementById(`tab-btn-${activeTab}`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

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
        if (!isDM) setIsKicked(true);
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

  useEffect(() => {
    fetchAllTraitsAndFeatures().then(setSrdFeatsList);
  }, []);

  const updateField = async (field, value) => {
    if (!char) return;
    await updateDoc(doc(db, 'characters', currentUser.charId), { [field]: value });
    if (['inventory', 'backstory', 'journal', 'theme', 'stats', 'ac', 'speed', 'initiative'].includes(field)) {
      setSaveToast('Saved to Cloud');
      setTimeout(() => setSaveToast(''), 2500);
    }
  };

  const handleAddCondition = async (condition) => {
    if (!condition || !char) return;
    await updateDoc(doc(db, 'characters', currentUser.charId), { conditions: arrayUnion(condition) });
  };

  const handleRemoveCondition = async (condition) => {
    if (!char) return;
    await updateDoc(doc(db, 'characters', currentUser.charId), { conditions: arrayRemove(condition) });
  };

  const handleResourceToggle = async (resourceIndex, newCurrentValue) => {
    if (!char || !char.resources || (isDM && !isEditMode)) return;
    const updatedResources = [...char.resources];
    updatedResources[resourceIndex] = {
      ...updatedResources[resourceIndex],
      current: newCurrentValue
    };
    await updateDoc(doc(db, 'characters', currentUser.charId), { resources: updatedResources });
  };

  const handleRemoveResource = async (resourceIndex) => {
    const resName = char.resources[resourceIndex].name;
    showDialog({
      title: 'Remove Tracker?',
      message: `Are you sure you want to permanently delete the tracker for "${resName}"?`,
      type: 'confirm',
      onConfirm: async () => {
        const updatedResources = char.resources.filter((_, i) => i !== resourceIndex);
        await updateDoc(doc(db, 'characters', currentUser.charId), { resources: updatedResources });
        closeDialog();
      },
      onCancel: closeDialog
    });
  };

  const confirmAddTracker = async (featName) => {
    const newRes = {
      id: `res_${Date.now()}`,
      name: featName,
      max: Number(newTrackerConfig.max),
      current: Number(newTrackerConfig.max),
      recharge: newTrackerConfig.recharge,
      isPool: false
    };
    const updatedResources = char.resources ? [...char.resources, newRes] : [newRes];
    await updateDoc(doc(db, 'characters', currentUser.charId), { resources: updatedResources });
    setAddingTrackerFor(null);
    setNewTrackerConfig({ max: 1, recharge: 'long' });
    setSaveToast('Tracker Attached!');
    setTimeout(() => setSaveToast(''), 2500);
  };

  const removeFeature = async (featToRemove) => {
    showDialog({
      title: 'Remove Feature?',
      message: `Are you sure you want to permanently delete ${featToRemove.name}?`,
      type: 'confirm',
      onConfirm: async () => {
        const updates = { features: arrayRemove(featToRemove) };
        
        if (char.resources) {
           const updatedResources = char.resources.filter(r => r.name !== featToRemove.name);
           if (updatedResources.length !== char.resources.length) {
             updates.resources = updatedResources;
           }
        }

        await updateDoc(doc(db, 'characters', currentUser.charId), updates);
        closeDialog();
      },
      onCancel: closeDialog
    });
  };

  const handleFeatNameChange = (e) => {
    const val = e.target.value;
    setCustomFeat(prev => ({ ...prev, name: val }));
    if (val.length > 1) {
      setFilteredFeats(srdFeatsList.filter(i => i.name.toLowerCase().includes(val.toLowerCase())));
      setShowFeatDropdown(true);
    } else {
      setShowFeatDropdown(false);
    }
  };

  const handleSelectSrdFeat = async (item) => {
    setShowFeatDropdown(false);
    setCustomFeat(prev => ({ ...prev, name: item.name }));
    const details = await fetchTraitOrFeatureDetails(item.url);
    if (details) {
      setCustomFeat(prev => ({ ...prev, desc: details.desc }));
    }
  };

  const handleForgeCustomFeat = async (e) => {
    e.preventDefault();
    if (!customFeat.name || !customFeat.desc) return;
    
    const newFeat = { 
      id: `feat_${Date.now()}`,
      name: customFeat.name, 
      desc: customFeat.desc,
      isDefensive: false,
      isHiddenFromCombat: false
    };

    let updates = { features: arrayUnion(newFeat) };

    if (customFeat.hasTracker) {
      const newRes = {
        id: `res_${Date.now()}`,
        name: customFeat.name,
        max: Number(customFeat.trackerMax),
        current: Number(customFeat.trackerMax),
        recharge: customFeat.trackerRecharge,
        isPool: false
      };
      
      if (char.resources) {
         updates.resources = [...char.resources, newRes];
      } else {
         updates.resources = [newRes];
      }
    }
    
    await updateDoc(doc(db, 'characters', currentUser.charId), updates);
    
    setIsForgingFeat(false);
    setCustomFeat({ name: '', desc: '', hasTracker: false, trackerMax: 1, trackerRecharge: 'long' });
    setSaveToast(customFeat.hasTracker ? 'Feature & Tracker Added!' : 'Feature Added!');
    setTimeout(() => setSaveToast(''), 2500);
  };

  const dismissLootPopup = () => {
    if (!newLootPopup) return;
    const dismissedIds = JSON.parse(localStorage.getItem('dismissed_loot') || '[]');
    localStorage.setItem('dismissed_loot', JSON.stringify([...dismissedIds, newLootPopup.id]));
    setNewLootPopup(null);
  };

  const handleCompleteOnboarding = async (wizardData) => {
    let updates = { theme: wizardData.theme, hasCompletedTutorial: true };
    await updateDoc(doc(db, 'characters', currentUser.charId), updates);
  };

  const restoreCharacter = async (importedData) => {
    try {
      const dataToSave = { ...importedData, id: currentUser.charId };
      await setDoc(doc(db, 'characters', currentUser.charId), dataToSave);
      setSaveToast('Character Restored from Backup!');
      setTimeout(() => setSaveToast(''), 2500);
    } catch (err) {
      console.error("Failed to restore character:", err);
      showDialog({ title: 'Restore Failed', message: 'There was an error restoring your character data to the cloud.', type: 'alert' });
    }
  };

  if (isKicked) return isDM ? null : <SessionResetModal onLogout={onLogout} />;
  if (!char) return <CardWrapper isDM={isDM} onClose={onClose}><GlobalLoader /></CardWrapper>;

  const activeConditions = char.conditions || [];
  const isExhausted = activeConditions.includes('Exhaustion');
  const activeTheme = THEMES[char.theme] || THEMES.indigo;

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

  const hasSpells = Object.keys(char.spellSlots || {}).length > 0 || (char.spells && char.spells.length > 0);
  
  const availableTabs = [
    { id: 'combat', icon: Swords, label: 'Combat' },
    ...(hasSpells ? [{ id: 'spells', icon: Flame, label: 'Spells' }] : []),
    { id: 'features', icon: Sparkles, label: 'Features' },
    ...(char.companion ? [{ id: 'companion', icon: PawPrint, label: 'Companion' }] : []),
    { id: 'inventory', icon: Backpack, label: 'Inventory' }, 
    { id: 'partyLoot', icon: Gem, label: 'Party Loot' }, 
    { id: 'bio', icon: BookOpen, label: 'Bio' }, 
    { id: 'journal', icon: PenTool, label: 'Journal' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <CardWrapper isDM={isDM} onClose={onClose}>
      {!isDM && (
         <div className={`fixed inset-0 bg-gradient-to-b ${activeTheme.ambient} to-slate-950 pointer-events-none -z-10 transition-colors duration-1000`}></div>
      )}

      {/* Main Container */}
      <div className={`transition-all duration-700 ${isExhausted ? 'grayscale-[0.5] contrast-75' : ''} ${isDM ? 'h-full overflow-hidden rounded-3xl' : 'pb-28 md:pb-12 relative h-full'} flex flex-col md:flex-row w-full`}>
        
        <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} inputPlaceholder={dialog.inputPlaceholder} onConfirm={dialog.onConfirm} onCancel={closeDialog} />

        {!isDM && (
          <>
            <BattleMapLayer char={char} charId={currentUser.charId} isOpen={isBattleMapOpen} onClose={() => setIsBattleMapOpen(false)} />
            <StickyBattleNav onToggleMap={setIsBattleMapOpen} isMapOpen={isBattleMapOpen} activeTheme={activeTheme} />
          </>
        )}

        {!isDM && char && !char.hasCompletedTutorial && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-auto">
            <OnboardingWizard char={char} onComplete={handleCompleteOnboarding} />
          </div>
        )}

        {saveToast && (
          <div className="fixed top-6 right-6 bg-slate-900 border-2 border-slate-950 text-emerald-400 px-4 py-3 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] z-[99999] animate-in slide-in-from-top-5 fade-in duration-300 font-black uppercase tracking-widest text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> {saveToast}
          </div>
        )}

        <ImageModal isOpen={isImageOpen} url={char.imageUrl || char.img || ''} alt={char.name || 'Character'} onClose={() => setIsImageOpen(false)} />
        <ImageModal isOpen={!!activeLoot} url={activeLoot?.url} alt={activeLoot?.name} onClose={() => setActiveLoot(null)} />

        {/* LEFT ANCHOR PANEL (Desktop) / TOP HEADER (Mobile) */}
        <div className={`w-full md:w-[350px] lg:w-[400px] shrink-0 ${isDM ? 'p-4 md:p-6 border-r-[3px] border-slate-950 bg-slate-900/50 h-full overflow-y-auto' : 'p-3 md:p-6 md:sticky md:top-0 md:h-screen md:overflow-y-auto'} transition-all duration-700 custom-scrollbar z-20`}>
          
          {isDM ? (
            <div className="flex justify-between items-center mb-4 border-b-2 border-slate-950 pb-4 pr-8">
              <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-widest drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]"><User className="w-6 h-6 text-indigo-400" /> {char.name || 'Unknown'} (DM)</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowBuilder(true)} className={`flex items-center gap-2 transition-all px-3 py-1.5 rounded-lg border-2 text-xs uppercase tracking-widest font-black shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] text-amber-400 bg-slate-900 border-slate-950 hover:bg-slate-800`}>
                  <Edit3 className="w-3 h-3" /> Edit Stats
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-md shadow-[2px_2px_0px_rgba(0,0,0,1)] ${activeTheme.accent} border-2 border-slate-950 flex items-center justify-center p-1`}>
                  <img src="/icon.png" alt="App Icon" className="w-full h-full object-cover rounded-sm" />
                </div>
                <h1 className="text-sm font-black text-white uppercase tracking-widest hidden sm:block drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">CAMPAIGN COMPANION</h1>
              </div>
              <div className="flex items-center gap-2">
                {/* PLayer Edit Mode toggle has been completely removed from here */}
                <button onClick={() => setIsGuideOpen(true)} className={`flex items-center justify-center w-9 h-9 ${activeTheme.text} hover:text-white transition-all bg-slate-900 rounded-lg border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px]`}><HelpCircle className="w-4 h-4" /></button>
                <button onClick={onLogout} className="flex items-center gap-2 text-slate-400 hover:text-white transition-all bg-slate-900 px-3 py-1.5 h-9 rounded-lg border-2 border-slate-950 text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px]"><LogOut className="w-3 h-3" /> Exit</button>
              </div>
            </div>
          )}

          {isDM && char.levelUpPending && (
            <div className="bg-amber-500 border-[3px] border-amber-950 rounded-xl p-4 mb-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] flex justify-between items-center animate-pulse">
              <div className="flex items-center gap-3 text-amber-950">
                <BellRing className="w-6 h-6" />
                <div>
                  <h4 className="font-black uppercase tracking-widest text-sm leading-none">Level Up!</h4>
                </div>
              </div>
              <button onClick={() => setShowBuilder(true)} className="bg-slate-950 text-amber-400 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded border-2 border-amber-900 transition-colors">
                Resolve
              </button>
            </div>
          )}

          <CharacterHeader 
            char={char} 
            charId={currentUser.charId} 
            isDM={isDM} 
            isEditMode={isEditMode}
            activeTheme={activeTheme} 
            showDialog={showDialog}
            onOpenImage={() => setIsImageOpen(true)}
            onOpenShortRest={() => setIsShortRestOpen(true)}
            onOpenLongRest={() => setIsLongRestOpen(true)}
            onOpenLevelUp={() => setIsLevelUpOpen(true)}
          />

          <div className="mb-4 pt-2">
            <button 
              onClick={() => setShowCoreStats(!showCoreStats)}
              className="w-full flex items-center justify-between bg-slate-900 border-2 border-slate-950 rounded-xl p-3 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-slate-800 transition-all active:shadow-[0px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px]"
            >
              <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Core Stats & Proficiencies</span>
              {showCoreStats ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            
            {showCoreStats && (
              <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
                <StatGrid char={char} activeTheme={activeTheme} isEditMode={isEditMode} updateField={updateField} isDM={isDM} />
                <QuickTraits features={char.features} />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT DYNAMIC PANEL (Desktop) / MAIN CONTENT (Mobile) */}
        <div className={`flex-1 flex flex-col min-w-0 ${isDM ? 'bg-slate-900 h-full overflow-hidden' : 'pt-0 md:pt-6'} transition-all duration-700 ${(isLongRestOpen || isShortRestOpen || isLevelUpOpen || newLootPopup || isGuideOpen || !!activeLoot || dialog.isOpen || (!isDM && !char.hasCompletedTutorial)) ? 'opacity-50 pointer-events-none blur-sm' : 'opacity-100'} overflow-x-hidden`}>
          
          <div className={`${isDM ? 'shrink-0 bg-slate-950 border-b-[3px] border-slate-900 p-2 sm:p-3 z-40 w-full' : 'fixed bottom-0 left-0 w-full z-40 bg-slate-950 border-t-[3px] border-slate-900 shadow-[0_-4px_20px_rgba(0,0,0,0.8)] pb-safe md:sticky md:bottom-auto md:top-0 md:w-auto md:bg-transparent md:border-none md:shadow-none md:z-30 md:-mx-8 md:px-8 md:mb-6'}`}>
              <div className={`bg-slate-900 md:bg-slate-900/80 p-2 md:rounded-xl md:border-2 md:border-slate-950 md:shadow-[6px_6px_0px_rgba(0,0,0,1)] flex overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full gap-2 snap-x snap-mandatory md:backdrop-blur-md`}>
                {availableTabs.map(tab => (
                  <button 
                    key={tab.id} id={`tab-btn-${tab.id}`} onClick={() => setActiveTab(tab.id)} 
                    className={`snap-center shrink-0 min-w-fit px-4 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-2 md:py-2.5 rounded-lg transition-all relative ${activeTab === tab.id ? `${activeTheme.bg} text-white border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)]` : 'bg-slate-950 border-2 border-slate-900 text-slate-400 hover:text-slate-200 shadow-[2px_2px_0px_rgba(0,0,0,0.5)]'}`}
                  >
                    <tab.icon className={`w-4 h-4 md:w-4 md:h-4 ${activeTab === tab.id ? 'animate-bounce' : ''}`} /> 
                    <span className={`text-[9px] md:text-xs font-black uppercase tracking-widest ${activeTab === tab.id ? 'block' : 'hidden sm:block'}`}>{tab.label}</span>
                    {tab.id === 'partyLoot' && partyLoot.length > 0 && activeTab !== 'partyLoot' && <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border border-slate-950"></span>}
                  </button>
                ))}
              </div>
          </div>

          <div className={`flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar ${isDM ? 'p-4 md:p-6' : 'p-3 md:p-6 pb-32 md:pb-12 pt-4 md:pt-0'}`}>
            <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
              
              {activeTab === 'combat' && (
                <CombatTab 
                  char={char} charId={currentUser.charId} 
                  isDM={isDM} isEditMode={isEditMode} activeTheme={activeTheme} 
                  combatWarnings={combatWarnings} activeConditions={activeConditions}
                  handleAddCondition={(e) => handleAddCondition(e.target.value)}
                  handleRemoveCondition={handleRemoveCondition} handleResourceToggle={handleResourceToggle} 
                  handleRemoveResource={handleRemoveResource} showDialog={showDialog}
                />
              )}

              {activeTab === 'spells' && <Spellbook char={char} charId={currentUser.charId} isDM={isDM && !isEditMode} showDialog={showDialog} />}

              {activeTab === 'features' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center px-1 border-b-2 border-slate-950 pb-2">
                    <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-widest drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]"><Sparkles className={`w-5 h-5 ${activeTheme.text}`} /> Traits & Feats</h3>
                    {isDM && (
                      <button onClick={() => setIsForgingFeat(!isForgingFeat)} className={`text-[10px] md:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all border-2 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] ${isForgingFeat ? 'bg-amber-600 border-amber-950 text-slate-950' : `bg-slate-900 border-slate-950 ${activeTheme.text} hover:bg-slate-800`}`}>
                        <Hammer className="w-3 h-3" /> {isForgingFeat ? 'Close' : 'Forge'}
                      </button>
                    )}
                  </div>

                  {isDM && isForgingFeat && (
                    <form onSubmit={handleForgeCustomFeat} className="bg-slate-900 border-2 border-indigo-950 p-5 rounded-2xl mb-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-top-2 space-y-4">
                      <h4 className="text-sm font-black text-indigo-400 flex items-center gap-2 uppercase tracking-widest border-b-2 border-indigo-950/50 pb-2"><Hammer className="w-4 h-4" /> Feature Forge</h4>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="relative">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Search className="w-3 h-3"/> SRD Search</label>
                          <input type="text" required value={customFeat.name} onChange={handleFeatNameChange} className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 font-bold" placeholder="e.g. Action Surge" />
                          
                          {showFeatDropdown && filteredFeats.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto custom-scrollbar bg-slate-900 border-2 border-slate-950 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] z-50">
                              {filteredFeats.map(item => (
                                <div key={item.index} onClick={() => handleSelectSrdFeat(item)} className="px-3 py-2.5 text-sm font-bold text-slate-300 hover:bg-indigo-600 hover:text-white cursor-pointer border-b border-slate-800 last:border-0 transition-colors">
                                  {item.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="bg-slate-950 p-4 rounded-xl border-2 border-slate-900">
                          <label className="flex items-center gap-2 cursor-pointer mb-3">
                            <input type="checkbox" checked={customFeat.hasTracker} onChange={(e) => setCustomFeat({...customFeat, hasTracker: e.target.checked})} className="w-4 h-4 rounded border-slate-600 text-amber-500 bg-slate-800 focus:ring-amber-500" />
                            <span className="text-sm font-black text-slate-300 uppercase tracking-widest">Needs Tracker?</span>
                          </label>
                          
                          {customFeat.hasTracker && (
                            <div className="flex gap-4 animate-in fade-in">
                              <div className="flex-1">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Max Slots</label>
                                <input type="number" value={customFeat.trackerMax} onChange={(e) => setCustomFeat({...customFeat, trackerMax: e.target.value})} className="w-full bg-slate-900 border-2 border-slate-800 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" />
                              </div>
                              <div className="flex-1">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Recharges On</label>
                                <select value={customFeat.trackerRecharge} onChange={(e) => setCustomFeat({...customFeat, trackerRecharge: e.target.value})} className="w-full bg-slate-900 border-2 border-slate-800 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500">
                                  <option value="short">Short Rest</option>
                                  <option value="long">Long Rest</option>
                                  <option value="none">Never</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Description & Effects</label>
                          <textarea required value={customFeat.desc} onChange={e => setCustomFeat({...customFeat, desc: e.target.value})} className="w-full min-h-[100px] bg-slate-950 border-2 border-slate-800 rounded-xl px-3 py-3 text-slate-300 text-sm focus:outline-none focus:border-indigo-500 resize-y font-medium leading-relaxed" placeholder="Describe the mechanics..." />
                        </div>
                      </div>
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs py-3.5 rounded-xl border-2 border-indigo-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center gap-2 mt-4">
                        <Plus className="w-4 h-4" /> Inject Feature
                      </button>
                    </form>
                  )}

                  {(!char.features || char.features.length === 0) ? (
                     <div className="text-center p-8 bg-slate-900 border-[3px] border-slate-950 border-dashed rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No features assigned yet.</p>
                     </div>
                  ) : (
                     <div className="space-y-4">
                       {char.features.map((feat, i) => {
                         const hasTracker = char.resources && char.resources.some(r => r.name === feat.name);
                         
                         return (
                           <CollapsibleSection 
                             key={`feat-${i}`} 
                             title={
                               <div className="flex items-center gap-2 w-full justify-between pr-2">
                                 <span className="font-black uppercase tracking-widest">{feat.name}</span>
                                 {isDM && (
                                   <div className="flex items-center gap-1">
                                     <button 
                                       onClick={async (e) => { 
                                         e.stopPropagation(); 
                                         if (hasTracker) {
                                            const updatedResources = char.resources.filter(r => r.name !== feat.name);
                                            await updateDoc(doc(db, 'characters', currentUser.charId), { resources: updatedResources });
                                         } else {
                                            setAddingTrackerFor(addingTrackerFor === feat.name ? null : feat.name);
                                         }
                                       }} 
                                       className={`p-1.5 rounded transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] border-2 ${hasTracker ? 'bg-amber-900 border-amber-500 text-amber-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-amber-300'}`} 
                                       title={hasTracker ? "Remove Attached Tracker" : "Attach Tracker to Feature"}
                                     >
                                       {hasTracker ? <ZapOff className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                                     </button>
                                     <button onClick={async (e) => { 
                                       e.stopPropagation(); 
                                       const updatedFeatures = char.features.map(f => f.name === feat.name ? { ...f, isHiddenFromCombat: !f.isHiddenFromCombat } : f);
                                       await updateDoc(doc(db, 'characters', currentUser.charId), { features: updatedFeatures });
                                     }} className={`p-1.5 rounded transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] border-2 ${feat.isHiddenFromCombat ? 'bg-red-900/50 border-red-500 text-red-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-red-300'}`} title={feat.isHiddenFromCombat ? "Hidden from Combat Tab" : "Hide from Combat Tab"}>
                                       <EyeOff className="w-3.5 h-3.5" />
                                     </button>
                                     <button onClick={async (e) => { 
                                       e.stopPropagation(); 
                                       const updatedFeatures = char.features.map(f => f.name === feat.name ? { ...f, isDefensive: !f.isDefensive } : f);
                                       await updateDoc(doc(db, 'characters', currentUser.charId), { features: updatedFeatures });
                                     }} className={`p-1.5 rounded transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] border-2 ${feat.isDefensive ? 'bg-indigo-900 border-indigo-500 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-indigo-300'}`} title={feat.isDefensive ? "Tagged as Defensive" : "Tag as Defensive"}>
                                       <ShieldPlus className="w-3.5 h-3.5" />
                                     </button>
                                     <button onClick={(e) => { e.stopPropagation(); removeFeature(feat); }} className="text-slate-500 hover:text-red-400 bg-slate-950 border-2 border-slate-800 p-1.5 rounded transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px]" title="Delete Feature">
                                       <Trash2 className="w-3.5 h-3.5" />
                                     </button>
                                   </div>
                                 )}
                               </div>
                             } 
                             defaultOpen={i === 0}
                           >
                             {addingTrackerFor === feat.name && (
                               <div className="mb-4 p-4 bg-slate-950 border-2 border-amber-900/50 rounded-xl flex flex-wrap gap-3 items-end shadow-inner" onClick={e => e.stopPropagation()}>
                                 <div className="flex-1 min-w-[80px]">
                                   <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Max Uses</label>
                                   <input type="number" value={newTrackerConfig.max} onChange={e => setNewTrackerConfig({...newTrackerConfig, max: e.target.value})} className="w-full bg-slate-900 border-2 border-slate-800 rounded-lg px-2 py-2 text-white font-bold text-sm focus:outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" />
                                 </div>
                                 <div className="flex-1 min-w-[110px]">
                                   <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Recharge On</label>
                                   <select value={newTrackerConfig.recharge} onChange={e => setNewTrackerConfig({...newTrackerConfig, recharge: e.target.value})} className="w-full bg-slate-900 border-2 border-slate-800 rounded-lg px-2 py-2.5 text-white font-bold text-xs focus:outline-none focus:border-amber-500">
                                     <option value="short">Short Rest</option>
                                     <option value="long">Long Rest</option>
                                     <option value="none">Never</option>
                                   </select>
                                 </div>
                                 <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                    <button onClick={() => confirmAddTracker(feat.name)} className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-lg font-black uppercase tracking-widest text-[10px] border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">Attach</button>
                                    <button onClick={() => setAddingTrackerFor(null)} className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg font-black uppercase tracking-widest text-[10px] border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">Cancel</button>
                                 </div>
                               </div>
                             )}
                             <p className="text-slate-300 font-medium text-sm leading-relaxed whitespace-pre-wrap">{feat.desc}</p>
                           </CollapsibleSection>
                         );
                       })}
                     </div>
                  )}
                </div>
              )}

              {activeTab === 'companion' && <CompanionTab char={char} activeTheme={activeTheme} />}
              {activeTab === 'inventory' && <InventoryTab char={char} charId={currentUser.charId} isDM={isDM && !isEditMode} updateField={updateField} activeTheme={activeTheme} showDialog={showDialog} />}
              {activeTab === 'partyLoot' && <PartyLootTab partyLoot={partyLoot} setActiveLoot={setActiveLoot} showDialog={showDialog} charId={currentUser.charId} />}
              {activeTab === 'bio' && <BioTab char={char} charId={currentUser.charId} isDM={isDM && !isEditMode} updateField={updateField} activeTheme={activeTheme} THEMES={THEMES} />}
              {activeTab === 'journal' && <JournalTab char={char} updateField={updateField} activeTheme={activeTheme} />}
              {activeTab === 'settings' && <SettingsTab char={char} updateField={updateField} activeTheme={activeTheme} THEMES={THEMES} restoreCharacter={restoreCharacter} />}
            </div>
          </div>
        </div>

        {showBuilder && <DMCharacterBuilder initialData={char} charId={currentUser.charId} onClose={() => setShowBuilder(false)} />}
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