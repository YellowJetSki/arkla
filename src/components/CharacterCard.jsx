import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  LogOut, Swords, Sparkles, Backpack, BookOpen, 
  PenTool, Gem, X, HelpCircle, User, Edit3, Flame, Settings, Search, Hammer, Trash2
} from 'lucide-react';

import { PREMADE_CHARACTERS } from '../data/campaignData';
import StatGrid from './shared/StatGrid';
import QuickTraits from './shared/QuickTraits'; 
import CollapsibleSection from './shared/CollapsibleSection';
import ImageModal from './shared/ImageModal'; 
import GlobalLoader from './shared/GlobalLoader';
import DialogModal from './shared/DialogModal';

import CharacterHeader from './character/CharacterHeader';
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
import FeatDiscovery from './FeatDiscovery'; 

import BattleMapLayer from './battlemap/BattleMapLayer';
import StickyBattleNav from './battlemap/StickyBattleNav';

// Upgraded themes with ambient background glows and rich accents
const THEMES = {
  indigo: { text: 'text-indigo-400', bg: 'bg-indigo-600', border: 'border-indigo-500/50', ring: 'ring-indigo-500', shadow: 'shadow-[0_0_15px_rgba(99,102,241,0.5)]', ambient: 'from-indigo-950/40 via-slate-950', accent: 'bg-indigo-500/10' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-600', border: 'border-emerald-500/50', ring: 'ring-emerald-500', shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.5)]', ambient: 'from-emerald-950/40 via-slate-950', accent: 'bg-emerald-500/10' },
  rose: { text: 'text-rose-400', bg: 'bg-rose-600', border: 'border-rose-500/50', ring: 'ring-rose-500', shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.5)]', ambient: 'from-rose-950/40 via-slate-950', accent: 'bg-rose-500/10' },
  amber: { text: 'text-amber-400', bg: 'bg-amber-600', border: 'border-amber-500/50', ring: 'ring-amber-500', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.5)]', ambient: 'from-amber-950/40 via-slate-950', accent: 'bg-amber-500/10' },
  sky: { text: 'text-sky-400', bg: 'bg-sky-600', border: 'border-sky-500/50', ring: 'ring-sky-500', shadow: 'shadow-[0_0_15px_rgba(14,165,233,0.5)]', ambient: 'from-sky-950/40 via-slate-950', accent: 'bg-sky-500/10' },
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

  const [showFeatSearch, setShowFeatSearch] = useState(false);
  const [isForgingFeat, setIsForgingFeat] = useState(false);
  const [customFeat, setCustomFeat] = useState({ name: '', desc: '', reqLevel: 1 });

  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', inputPlaceholder: '', onConfirm: null });

  const showDialog = (options) => setDialog({ ...options, isOpen: true });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

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

  const handleAddCondition = async (condition) => {
    if (!condition || !char) return;
    await updateDoc(doc(db, 'characters', currentUser.charId), { conditions: arrayUnion(condition) });
  };

  const handleRemoveCondition = async (condition) => {
    if (!char) return;
    await updateDoc(doc(db, 'characters', currentUser.charId), { conditions: arrayRemove(condition) });
  };

  const handleResourceToggle = async (resourceIndex, newCurrentValue) => {
    if (!char || !char.resources || isDM) return;
    const updatedResources = [...char.resources];
    updatedResources[resourceIndex] = {
      ...updatedResources[resourceIndex],
      current: newCurrentValue
    };
    await updateDoc(doc(db, 'characters', currentUser.charId), { resources: updatedResources });
  };

  const addFeature = async (featData) => {
    await updateDoc(doc(db, 'characters', currentUser.charId), {
      features: arrayUnion(featData)
    });
    setShowFeatSearch(false);
    setSaveToast('Feat Added to Sheet');
    setTimeout(() => setSaveToast(''), 2500);
  };

  const removeFeature = async (featToRemove) => {
    showDialog({
      title: 'Remove Feature?',
      message: `Are you sure you want to permanently delete ${featToRemove.name} from this character?`,
      type: 'confirm',
      onConfirm: async () => {
        await updateDoc(doc(db, 'characters', currentUser.charId), {
          features: arrayRemove(featToRemove)
        });
        closeDialog();
      },
      onCancel: closeDialog
    });
  };

  const handleForgeCustomFeat = async (e) => {
    e.preventDefault();
    if (!customFeat.name || !customFeat.desc) return;
    
    const newFeat = { name: customFeat.name, desc: customFeat.desc, reqLevel: Number(customFeat.reqLevel) };
    
    await setDoc(doc(db, 'custom_feats', 'feat_' + Date.now()), newFeat);
    
    await updateDoc(doc(db, 'characters', currentUser.charId), {
      features: arrayUnion(newFeat)
    });
    
    setIsForgingFeat(false);
    setCustomFeat({ name: '', desc: '', reqLevel: 1 });
    setSaveToast('Feat Forged & Added!');
    setTimeout(() => setSaveToast(''), 2500);
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
      showDialog({
        title: 'Error',
        message: 'Failed to restore character to the database.',
        type: 'alert',
        onConfirm: closeDialog
      });
    }
  };

  if (isKicked) return isDM ? null : <SessionResetModal onLogout={onLogout} />;
  if (!char) return <CardWrapper><GlobalLoader /></CardWrapper>;

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

  return (
    <CardWrapper>
      {/* Ambient Theme Background */}
      {!isDM && (
         <div className={`fixed inset-0 bg-gradient-to-b ${activeTheme.ambient} to-slate-950 pointer-events-none -z-10 transition-colors duration-1000`}></div>
      )}

      <div className={`transition-all duration-700 ${isExhausted ? 'grayscale-[0.5] contrast-75' : ''} pb-24 relative`}>
        
        <DialogModal 
          isOpen={dialog.isOpen} 
          title={dialog.title} 
          message={dialog.message} 
          type={dialog.type} 
          inputPlaceholder={dialog.inputPlaceholder}
          onConfirm={dialog.onConfirm} 
          onCancel={closeDialog} 
        />

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

        <div className={`${isDM ? 'p-6' : 'max-w-4xl mx-auto p-3 md:p-8 min-h-[100dvh]'} transition-all duration-700 ${(isLongRestOpen || isShortRestOpen || isLevelUpOpen || newLootPopup || isGuideOpen || !!activeLoot || dialog.isOpen || (!isDM && !char.hasCompletedTutorial)) ? 'opacity-50 pointer-events-none blur-sm' : 'opacity-100'}`}>
          
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
                <div className={`w-8 h-8 rounded-md shadow-lg ${activeTheme.accent} border border-white/10 flex items-center justify-center p-1`}>
                  <img src="/icon.png" alt="App Icon" className="w-full h-full object-cover rounded-sm" />
                </div>
                <h1 className="text-lg font-bold text-slate-300 tracking-wider hidden sm:block">CAMPAIGN COMPANION</h1>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsGuideOpen(true)} className={`flex items-center justify-center w-9 h-9 ${activeTheme.text} hover:text-white transition-colors bg-slate-900/50 rounded-lg border ${activeTheme.border} hover:${activeTheme.bg} shadow-sm backdrop-blur-sm`}><HelpCircle className="w-4 h-4" /></button>
                <button onClick={onLogout} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-slate-900/50 backdrop-blur-sm px-3 py-1.5 h-9 rounded-lg border border-slate-700 text-sm shadow-sm"><LogOut className="w-3 h-3" /> Exit</button>
              </div>
            </div>
          )}

          <CharacterHeader 
            char={char} 
            charId={currentUser.charId} 
            isDM={isDM} 
            activeTheme={activeTheme} 
            showDialog={showDialog}
            onOpenImage={() => setIsImageOpen(true)}
            onOpenShortRest={() => setIsShortRestOpen(true)}
            onOpenLongRest={() => setIsLongRestOpen(true)}
          />

          <div className="mb-6">
            <StatGrid char={char} activeTheme={activeTheme} />
            <QuickTraits features={char.features} />
          </div>

          {/* Styled navigation matching the new ambient theme */}
          <div className={`sticky top-0 z-30 pt-1 pb-3 -mx-3 px-3 md:-mx-8 md:px-8 border-b border-slate-800/80 shadow-md mb-6 ${isDM ? 'bg-slate-950/90 backdrop-blur-xl' : 'bg-slate-950/60 backdrop-blur-2xl'}`}>
            <div className={`bg-slate-900/80 p-1.5 rounded-xl border border-slate-800/80 shadow-inner flex overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full gap-1 sm:gap-2 justify-between snap-x snap-mandatory backdrop-blur-md`}>
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
                  className={`snap-center flex-1 min-w-[50px] sm:min-w-[70px] flex items-center justify-center gap-2 px-2 py-2.5 rounded-lg font-medium text-xs md:text-sm whitespace-nowrap transition-all relative ${activeTab === tab.id ? `${activeTheme.bg} text-white shadow-md` : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'}`}
                >
                  <tab.icon className="w-4 h-4" /> 
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.id === 'partyLoot' && partyLoot.length > 0 && activeTab !== 'partyLoot' && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
                  {activeTab === tab.id && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-in fade-in zoom-in duration-300"></div>}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6 animate-in fade-in duration-500">
            
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
                handleResourceToggle={handleResourceToggle}
              />
            )}

            {activeTab === 'spells' && <Spellbook char={char} charId={currentUser.charId} isDM={isDM} showDialog={showDialog} />}

            {activeTab === 'features' && (
              <div className="space-y-6">
                
                <div className="flex justify-between items-center px-1 border-b border-slate-700 pb-2">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2"><Sparkles className={`w-5 h-5 ${activeTheme.text}`} /> Traits & Feats</h3>
                  {!isDM ? (
                    <button 
                      onClick={() => setShowFeatSearch(!showFeatSearch)}
                      className={`text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border shadow-sm ${showFeatSearch ? 'bg-slate-700 border-slate-500 text-white' : `bg-slate-800/80 border-slate-700 ${activeTheme.text} hover:bg-slate-700`}`}
                    >
                      <Search className="w-3 h-3" /> {showFeatSearch ? 'Close' : 'Discover Feats'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => setIsForgingFeat(!isForgingFeat)}
                      className={`text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border shadow-sm ${isForgingFeat ? 'bg-fuchsia-700 border-fuchsia-500 text-white' : `bg-slate-800/80 border-slate-700 ${activeTheme.text} hover:bg-slate-700`}`}
                    >
                      <Hammer className="w-3 h-3" /> {isForgingFeat ? 'Cancel Forge' : 'Forge Custom Feat'}
                    </button>
                  )}
                </div>

                {isDM && isForgingFeat && (
                  <form onSubmit={handleForgeCustomFeat} className="bg-slate-900/80 p-4 md:p-5 rounded-xl border border-fuchsia-500/30 shadow-inner mb-6 animate-in fade-in slide-in-from-top-2 space-y-4">
                    <h4 className="text-sm font-bold text-fuchsia-400 flex items-center gap-2"><Hammer className="w-4 h-4" /> Homebrew Feat Forge</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Feat Name</label>
                        <input type="text" required value={customFeat.name} onChange={e => setCustomFeat({...customFeat, name: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-fuchsia-500" placeholder="e.g. Sharpshooter" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Prerequisite Level</label>
                        <input type="number" min="1" required value={customFeat.reqLevel} onChange={e => setCustomFeat({...customFeat, reqLevel: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-fuchsia-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description & Effects</label>
                      <textarea required value={customFeat.desc} onChange={e => setCustomFeat({...customFeat, desc: e.target.value})} className="w-full min-h-[100px] bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-slate-300 text-sm focus:outline-none focus:border-fuchsia-500 resize-y" placeholder="Describe the stat bumps and mechanics..." />
                    </div>
                    <button type="submit" className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-2.5 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" /> Add to Global Database
                    </button>
                  </form>
                )}

                {showFeatSearch && !isDM && <FeatDiscovery onAddFeat={addFeature} allowAdd={isDM} charLevel={char.level} />}

                <div className="space-y-4">
                  {(char.features || []).map((feat, i) => (
                    <CollapsibleSection 
                      key={`feat-${i}`} 
                      title={
                        <div className="flex items-center gap-2">
                          {feat.name}
                          {isDM && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); removeFeature(feat); }}
                              className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                              title="Delete Feature"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      } 
                      defaultOpen={i === 0}
                    >
                      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{feat.desc}</p>
                    </CollapsibleSection>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'inventory' && <InventoryTab char={char} isDM={isDM} updateField={updateField} activeTheme={activeTheme} showDialog={showDialog} />}

            {activeTab === 'partyLoot' && <PartyLootTab partyLoot={partyLoot} setActiveLoot={setActiveLoot} showDialog={showDialog} />}

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