// ==========================================
// 🎲 CONSTANTS & RULES
// ==========================================

export const STATS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export const CONDITIONS_LIST = [
  'Blinded', 'Charmed', 'Deafened', 'Exhaustion', 'Frightened', 
  'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 
  'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious'
];

export const CONDITION_EFFECTS = {
  'Blinded': "Can't see. Disadvantage on attacks. Enemy attacks have Advantage.",
  'Charmed': "Can't attack the charmer. Charmer has Advantage on social checks.",
  'Deafened': "Can't hear. Fails checks requiring hearing.",
  'Frightened': "Disadvantage on attacks/checks while source is visible. Can't willingly move closer.",
  'Grappled': "Speed becomes 0.",
  'Incapacitated': "Can't take Actions or Reactions.",
  'Invisible': "Impossible to see. Attacks have Advantage. Enemy attacks have Disadvantage.",
  'Paralyzed': "Incapacitated. Can't move/speak. Auto-fail STR/DEX saves. Attacks against you have Advantage. Melee hits are automatic criticals.",
  'Petrified': "Turned to stone. Incapacitated. Auto-fail STR/DEX saves. Resistance to all damage.",
  'Poisoned': "Disadvantage on attack rolls and ability checks.",
  'Prone': "Only crawl. Disadvantage on attacks. Melee attacks against you have Advantage. Ranged have Disadvantage.",
  'Restrained': "Speed is 0. Disadvantage on attacks/DEX saves. Enemy attacks have Advantage.",
  'Stunned': "Incapacitated. Auto-fail STR/DEX saves. Enemy attacks have Advantage.",
  'Unconscious': "Incapacitated. Drop what you're holding. Auto-fail STR/DEX saves. Melee hits are automatic criticals."
};

// ==========================================
// 👹 PREMADE ENEMIES (DM DATA)
// ==========================================

export const PREMADE_ENEMIES = [
  {
    id: 'screwbeard',
    name: 'Screwbeard',
    flavor: '“The dim-witted, unbraided brute in ill-fitting armor.” (Dwarf Boss)',
    ac: 13,
    hp: 16,
    speed: '25 ft.',
    stats: { STR: '+2', DEX: '-1', CON: '+2', INT: '-1', WIS: '+0', CHA: '+0' },
    passivePerception: 10,
    spellSave: null,
    spellAttack: null,
    features: [
      { name: 'Clanking Armor', desc: 'Screwbeard has Disadvantage on Stealth checks.' },
      { name: 'Dwarven Resilience', desc: 'He has advantage on saving throws against poison.' },
      { name: 'Lynchpin', desc: 'If Screwbeard is killed or incapacitated, all remaining goblins instantly break morale and flee.' }
    ],
    actions: [
      { name: 'Dull Warhammer', desc: 'Melee Weapon Attack. +4 to hit. Hit: 5 (1d6 + 2) bludgeoning damage.' }
    ]
  },
  {
    id: 'bengo',
    name: 'Bengo',
    flavor: '“The Scrawny One.” Scrawny, pale green, wears a massive pirate hat.', 
    ac: 12, 
    hp: 7, 
    speed: '30 ft.', 
    stats: { STR: '-1', DEX: '+2', CON: '+0', INT: '+0', WIS: '-1', CHA: '-1' }, 
    passivePerception: 9,
    spellSave: null,
    spellAttack: null,
    features: [
      { name: 'Nimble Escape', desc: 'The goblins can take the Disengage or Hide action as a Bonus Action on each of their turns.' } 
    ],
    actions: [
      { name: 'Rusted Rusty Cutlass', desc: 'Melee Weapon Attack. +4 to hit. Hit: 3 (1d4 + 1) slashing damage.' } 
    ]
  },
  {
    id: 'leeta',
    name: 'Leeta',
    flavor: '“The Hater.” Female goblin, hates Screwbeard.', 
    ac: 12, 
    hp: 7, 
    speed: '30 ft.', 
    stats: { STR: '-1', DEX: '+2', CON: '+0', INT: '+0', WIS: '-1', CHA: '-1' }, 
    passivePerception: 9,
    spellSave: null,
    spellAttack: null,
    features: [
      { name: 'Nimble Escape', desc: 'The goblins can take the Disengage or Hide action as a Bonus Action on each of their turns.' }, 
      { name: 'Spiteful Strike', desc: 'Leeta automatically deals 1 point of spite damage to Screwbeard before combat starts.' }, 
      { name: 'Self-Preservation', desc: 'If the player is struggling, she will use her Nimble Escape to run away on round 2 or 3, muttering that she isn\'t paid enough.' } 
    ],
    actions: [
      { name: 'Shiv', desc: 'Melee Weapon Attack. +4 to hit. Hit: 3 (1d4 + 1) piercing damage.' } 
    ]
  },
  {
    id: 'geepo',
    name: 'Geepo',
    flavor: '“The Black Eye.” A bickering cowardly grunt.', 
    ac: 12, 
    hp: 7, 
    speed: '30 ft.', 
    stats: { STR: '-1', DEX: '+2', CON: '+0', INT: '+0', WIS: '-1', CHA: '-1' }, 
    passivePerception: 9,
    spellSave: null,
    spellAttack: null,
    features: [
      { name: 'Nimble Escape', desc: 'The goblins can take the Disengage or Hide action as a Bonus Action on each of their turns.' }, 
      { name: 'Swollen Eye', desc: 'Geepo has Disadvantage on all Perception checks because his good eye is swollen shut from Loof the Baker punching him.' } 
    ],
    actions: [
      { name: 'Pointed Stick', desc: 'Melee Weapon Attack. +4 to hit. Hit: 3 (1d4 + 1) piercing damage.' } 
    ]
  }
];