import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

// The rules of the Sanctuary Filter - 'blood' removed to prevent banning Potions of Healing
const FORBIDDEN_WORDS = /\b(soul|demon|demons|demonic|fiend|fiends|fiendish|devil|devils|undead|spirit|spirits|necromancy|pact)\b/i;
const FORBIDDEN_TYPES = ['fiend', 'undead', 'aberration'];

// Helper to fetch local homebrew from Firestore
const fetchHomebrew = async (collectionName, queryStr) => {
  try {
    const snap = await getDocs(collection(db, collectionName));
    const allDocs = snap.docs.map(doc => ({ ...doc.data(), isHomebrew: true }));
    // Client-side filter for partial matches
    return allDocs.filter(doc => doc.name && doc.name.toLowerCase().includes(queryStr.toLowerCase()));
  } catch (err) {
    console.error(`Error fetching homebrew from ${collectionName}:`, err);
    return [];
  }
};

export const fetchSafeSpells = async (query) => {
  try {
    // 1. Fetch Homebrew Spells
    const homebrewSpells = await fetchHomebrew('homebrew_spells', query);

    // 2. Fetch API Spells
    const res = await fetch(`https://www.dnd5eapi.co/api/spells/?name=${query}`);
    const data = await res.json();
    
    const apiSpells = [];
    if (data.count > 0) {
      for (let i = 0; i < Math.min(data.results.length, 5); i++) {
        const detailRes = await fetch(`https://www.dnd5eapi.co${data.results[i].url}`);
        const spellDetail = await detailRes.json();

        const isNecromancy = spellDetail.school?.name === 'Necromancy';
        const hasForbiddenWords = FORBIDDEN_WORDS.test(spellDetail.desc?.join(' '));

        if (!isNecromancy && !hasForbiddenWords) {
          apiSpells.push(spellDetail);
        }
      }
    }

    // 3. Merge and Return
    const combinedSpells = [...homebrewSpells, ...apiSpells];

    if (combinedSpells.length === 0) {
      return { results: [], error: 'No safe spells found. The Sanctuary Filter blocked the dark magic, or it does not exist.' };
    }

    return { results: combinedSpells, error: null };
  } catch (err) {
    console.error(err);
    return { results: [], error: 'Failed to commune with the magical archives. Try again.' };
  }
};

export const fetchSafeMonsters = async (query) => {
  try {
    // 1. Fetch Homebrew Enemies
    const homebrewEnemies = await fetchHomebrew('homebrew_enemies', query);

    // 2. Fetch API Monsters
    const res = await fetch(`https://www.dnd5eapi.co/api/monsters/?name=${query}`);
    const data = await res.json();

    const apiMonsters = [];
    if (data.count > 0) {
      for (let i = 0; i < Math.min(data.results.length, 5); i++) {
        const detailRes = await fetch(`https://www.dnd5eapi.co${data.results[i].url}`);
        const monDetail = await detailRes.json();

        if (!FORBIDDEN_TYPES.includes(monDetail.type?.toLowerCase())) {
          apiMonsters.push(monDetail);
        }
      }
    }

    const combinedMonsters = [...homebrewEnemies, ...apiMonsters];

    if (combinedMonsters.length === 0) {
      return { results: [], error: 'No safe monsters found. The Sanctuary Filter blocked demonic/undead entities.' };
    }

    return { results: combinedMonsters, error: null };
  } catch (err) {
    console.error(err);
    return { results: [], error: 'Failed to consult the Bestiary archives.' };
  }
};

export const fetchSafeEquipment = async (query) => {
  try {
    // 1. Fetch Homebrew Items
    const homebrewItems = await fetchHomebrew('homebrew_items', query);

    // 2. Fetch API Equipment
    const [eqRes, miRes] = await Promise.all([
      fetch(`https://www.dnd5eapi.co/api/equipment/?name=${query}`),
      fetch(`https://www.dnd5eapi.co/api/magic-items/?name=${query}`)
    ]);

    const eqData = await eqRes.json();
    const miData = await miRes.json();

    const apiResults = [...(eqData.results || []), ...(miData.results || [])];
    const safeApiItems = [];

    if (apiResults.length > 0) {
      for (let i = 0; i < Math.min(apiResults.length, 5); i++) {
        const detailRes = await fetch(`https://www.dnd5eapi.co${apiResults[i].url}`);
        const itemDetail = await detailRes.json();

        const descText = Array.isArray(itemDetail.desc) ? itemDetail.desc.join(' ') : (itemDetail.desc || '');
        const hasForbiddenWords = FORBIDDEN_WORDS.test(descText) || FORBIDDEN_WORDS.test(itemDetail.name);

        if (!hasForbiddenWords) {
          safeApiItems.push(itemDetail);
        }
      }
    }

    const combinedItems = [...homebrewItems, ...safeApiItems];

    if (combinedItems.length === 0) {
      return { results: [], error: 'No safe items found. The Sanctuary Filter blocked corrupted artifacts.' };
    }

    return { results: combinedItems, error: null };
  } catch (err) {
    console.error(err);
    return { results: [], error: 'Failed to search the vaults. Try again.' };
  }
};