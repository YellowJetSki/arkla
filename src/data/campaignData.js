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
// 🦸 PREMADE CHARACTERS (PLAYER DATA)
// ==========================================

export const PREMADE_CHARACTERS = {
  'wendy': {
    name: 'Wendy Warmwind',
    race: 'Rock Gnome',
    class: 'Monk (Way of the Kolari)',
    level: 1,
    exp: 0,
    alignment: 'Chaotic Good',
    hp: 11,
    maxHp: 11,
    tempHp: 0,
    hitDice: { current: 1, max: 1, type: 'd8' },
    ac: 16,
    initiative: 3,
    spellSave: '--',
    spellAttack: '--',
    combatInitiative: null,
    speed: 25,
    inspiration: false,
    isConcentrating: false,
    conditions: [],
    hasSeenRules: false, 
    journal: '',
    stats: { STR: 10, DEX: 17, CON: 16, INT: 15, WIS: 16, CHA: 11 },
    currency: { assarions: 5, quadrans: 10, leptons: 15 },
    imageUrl: '', 
    deathSaves: { successes: 0, failures: 0 },
    resources: [],
    spellSlots: {},
    spells: [],
    dmNotes: '',
    attacks: [
      { name: 'Unarmed Strike', hit: '+5', damage: '1d4 + 3', type: 'Bludgeoning', notes: '' },
      { name: 'Quarterstaff', hit: '+5', damage: '1d6 + 3', type: 'Bludgeoning', notes: '' },
      { name: 'Shurikens', hit: '+5', damage: '1d4 + 3', type: 'Piercing', notes: 'Range: 20/60ft' }
    ],
    proficiencies: {
      skills: 'Acrobatics (+5), Insight (+5), Investigation (+4), Stealth (+5)',
      tools: 'Tinker’s Tools',
      weapons: 'Simple weapons, shortswords',
      languages: 'Common, Gnomish'
    },
    features: [
      { name: 'Dark Secret (flaw)', desc: 'It was my watch when the Brevants attacked... I cost my fellow pupils their lives.' },
      { name: 'Unarmored Defense', desc: 'AC equals 10 + DEX + WIS when not wearing armor or using a shield.' },
      { name: 'Martial Arts', desc: 'Use DEX instead of STR for unarmed strikes/monk weapons. Roll d4 for unarmed damage.' },
      { name: 'Darkvision', desc: 'Dim light within 60ft = Bright light. Darkness = Dim light.' },
      { name: 'Gnome Cunning', desc: 'Advantage on INT, WIS and CHA saving throws against magic.' },
      { name: 'Tinkerer’s knowledge', desc: 'Add +4 to History checks around little gizmos and gadgets.' },
      { name: 'Tinker', desc: 'Spend 1 hour and 5 Assarions to construct a Tiny device or item.' },
      { name: 'Background: Fly on the Wall', desc: 'People gloss over your presence. Easily eavesdrop or observe details in crowds if quiet. You have advantage when doing so.' },
      { name: 'Not so Brevar', desc: 'Wendy is Frightened when faced by Brevars or anything that reminds her of them. She hates bears.' }
    ],
    inventory: "1x Quarterstaff\n10x Shurikens (gear-shaped)\n1x Bag of self-made caltrops\n1x Tinkerer’s Tools\n1x Worn Overalls\n1x Gnome cap\n1x Faded pic of mom, dad and uncle\n1x Sketch of a beautiful restaurant by the sea\n1x Duku’s belt - monogrammed lizard symbol\n1x Explorer’s pack",
    traits: {
      personality: 'I prefer to watch and listen rather than speak. I tinker with small gears when I’m nervous.',
      ideal: 'Loyalty. True teachings come from the bond between master and student, not titles.',
      bond: 'I will stop at nothing to find Monk Duku and uncover the truth behind his mysterious letters...',
      flaws: 'Distrusts authority, troubled past, fear of Brevants.'
    },
    backstory: "Grew up as a reclusive tinkerer in the town of Forn, learning to blend into the shadows and avoid drawing attention. These skills proved useful when training in the way of the Kolari under monk Duku. I mastered stealth under his training. He quickly became like family to me, someone who saw immense potential in me and viewed me as his prodigious pupil. Monk Duku was foreign to my hometown of Forn and never quite fit in. He often received messages and letters from shady individuals. The only one I ever caught a glimpse of depicted a beautiful restaurant by the sea which I swiftly sketched down from memory. One day Duku mysteriously disappeared without a trace, only leaving behind his monogrammed belt which he left next to my cot. He was replaced by the pretentious Monk Wando, who was nothing like Duku. Wando came from the wealthy city of Dagend and he acted as such. Then a life changing incident occurred. A large army of Brevants raided our town of Forn. It was my watch. Thinking it was just a few Brevants at first, I decided to take them on myself. That decision haunts me to this day. Realizing I was heavily outnumbered I sounded the alarm very late. Monk Wando refused to come help the town, he remained at the entrance of the Kolari temple protecting it, rather than aid the townsfolk. As a result me and my fellow pupils were left to defend the town ourselves. Many died. My only real friend, Quill among them. Burdened by guilt and realizing I could no longer stay in a town that was a shadow of it’s former self, eternally scarred, I packed my bags, including Duku’s belt and left home to find my true master and uncover his secrets.",
    notes: ''
  },
  'kehrfuffle': {
    name: 'Kehrfuffle Songroot',
    race: 'Wood Elf',
    class: 'Level 1 Bard',
    level: 1,
    exp: 0,
    alignment: 'Chaotic Neutral',
    hp: 10,
    maxHp: 10,
    tempHp: 0,
    hitDice: { current: 1, max: 1, type: 'd8' },
    ac: 14,
    initiative: 3,
    spellSave: 13,
    spellAttack: '+5',
    combatInitiative: null,
    speed: 35,
    inspiration: false,
    isConcentrating: false,
    conditions: [],
    hasSeenRules: false, 
    journal: '',
    stats: { STR: 10, DEX: 17, CON: 14, INT: 10, WIS: 16, CHA: 17 },
    currency: { assarions: 0, quadrans: 5, leptons: 10 },
    imageUrl: '', 
    deathSaves: { successes: 0, failures: 0 },
    resources: [
      { 
    name: 'Bardic Inspiration', 
    max: 3, 
    current: 3, 
    desc: 'Use a Bonus Action to give an ally within 60 ft a 1d6 to add to an attack roll, saving throw, or skill check. Regains all uses on a Long Rest.' 
      }
    ],    
    spellSlots: {
      "1": { current: 2, max: 2 }
    },
    spells: [
      { 
        name: 'Mending', 
        level: 0, 
        castTime: '1 Minute', 
        desc: 'A practical tune used to magically fix small breaks or tears in clothes, gear, or your peg leg.' 
      },
      { 
        name: 'Minor Illusion', 
        level: 0, 
        castTime: '1 Action', 
        desc: 'A melancholic chord that bends reality to create a faint, fake sound or a small, translucent image.' 
      },
      { 
        name: 'Caroline’s Laughter', 
        level: 1, 
        castTime: '1 Action', 
        desc: 'Play a jaunty tune. One enemy makes a Wisdom save (DC 13). If they fail, they fall prone in fits of uncontrollable laughter, losing their turn.' 
      },
      { 
        name: 'Charm Person', 
        level: 1, 
        castTime: '1 Action', 
        desc: 'Play an alluring melody. One person makes a Wisdom save (DC 13). If they fail, they view you as a trusted friend for 1 hour.' 
      },
      { 
        name: 'Sleep', 
        level: 1, 
        castTime: '1 Action', 
        desc: 'Play Caroline\'s lullaby. Roll 5d8. Put that many hit points worth of enemies into a deep magical slumber. Their hp must be lower than the number rolled. No save required!' 
      },
      { 
        name: 'Earth Tremor', 
        level: 1, 
        castTime: '1 Action', 
        desc: 'Hit a resonant bass note. Enemies within 10ft make a Dexterity save (DC 13). If they fail, they take 1d6 Bludgeoning damage and fall prone.' 
      }
    ],
    dmNotes: '',
    attacks: [
      { name: 'The Great Sickle (Finesse)', hit: '+5', damage: '1d6 + 3', type: 'Slashing', notes: '' },
      { name: 'Dagger', hit: '+5', damage: '1d4 + 3', type: 'Piercing', notes: 'Range: 20/60ft' }
    ],
    proficiencies: {
      skills: 'Insight (+5), Investigation (+2), Perception (+5), Performance (+5), Persuasion (+5), Survival (+5)',
      tools: 'Accordion, Lute, Flute',
      weapons: 'Simple weapons, longswords, shortswords, shortbows, longbows, hand crossbows, rapiers',
      languages: 'Common, Elvish, Sylvan'
    },
    features: [
      { name: 'Dark Secret (flaw)', desc: 'I traded the most charming thing about me to a dark stranger for musical fame. He took my wife Caroline and bound her soul to my accordion.' },
      { name: 'Bardic Inspiration', desc: '(3 uses/day) Use a Bonus Action to play an inspiring chord. Give one friend within 60 feet a 1d6 to add to any one attack roll, saving throw, or skill check of their choice.' },
      { name: 'Fey Ancestry', desc: 'You have advantage on saving throws against being magically charmed. Magic cannot put you to sleep.' },
      { name: 'Darkvision', desc: 'Dim light within 60ft = Bright light. Darkness = Dim light.' },
      { name: 'Trance', desc: 'You don\'t need to sleep. You meditate deeply for 4 hours to get the exact same benefits as an 8-hour human sleep.' },
      { name: 'Haunted by your past', desc: 'Commoners will afford you every courtesy and do their utmost to help you.' },
      { name: 'The Tiny Bear (dormant)', desc: 'An unusually tiny bear that refuses to leave your side.' },
      { name: 'The Peg Leg', desc: 'Your leg was crushed in the Weeping Grove. You rely on your wooden peg leg to stand your ground.' }
    ],
    inventory: "1x The Cursed Accordion\n1x Rusty Great Sickle\n1x Dagger\n1x Leather Armor\n1x Wooden Peg Leg\n1x The Tiny Bear\n1x Entertainer’s Pack\n1x Locket with Caroline's Picture",
    traits: {
      personality: 'I project a gruff, cynical exterior to keep people at arm\'s length... I complain about the tiny bear constantly, but I will viciously attack anyone who tries to hurt it.',
      ideal: 'Restitution. I will find the man who tricked me and free Caroline\'s spirit, at all cost.',
      bond: 'My accordion is my greatest treasure and my deepest torment.',
      flaws: 'Music often makes me sentimental. If it means getting Caroline back I\'d do almost anything.'
    },
    backstory: `Grew up in the quiet village of Ivory Hollow, playing my accordion in the local tavern. I was a rough guy, but my wife, Caroline, believed in my music. She was my biggest supporter and, looking back, easily the most charming thing in my life. One night, a calm, strange traveler offered me a deal: unforgettable musical talent in exchange for "the most charming thing I had." Foolishly ambitious, I shook his hand. I felt a surge of what felt like lightning surge through me. When I went home, Caroline was gone, and my accordion hummed with a new, haunting harmony—her spirit was bound to the wood and bellows. I left Ivory Hollow to hunt the dark stranger down. I heard talk of an unnamed and unidentifiable man who enshrouds himself in magic. He appears where ambition and desperation meet: 
    
    A warrior wanting victory.
    A dreamer wanting recognition.
    A singer wanting fame.

My search led me to the ancient druidic ruins of the Weeping Grove. The untended wild magic there violently reacted to the curse on my accordion, causing the shrine to collapse and crush my leg. I awoke with a mysterious wooden peg leg and an unnaturally small bear who now refuses to leave my side. Occasionally I feel a strange pulsing coming from trees and plants, as if I can feel their life force coursing through me. I no longer hear talk of the stranger and my trail has run cold. Regardless, I know I could never face this powerful man alone, so I now search for powerful heroes alongside my quest for clues. Ones I could manipulate into helping me accomplish my one goal, revenge on that evil stranger.`,
    notes: ''
  }
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
    id: 'goblin_boss',
    name: 'Goblin Boss',
    flavor: 'A slightly larger, significantly meaner goblin shouting orders from the back.',
    ac: 17,
    hp: 21,
    speed: '30 ft.',
    stats: { STR: '+0', DEX: '+2', CON: '+0', INT: '+0', WIS: '-1', CHA: '+0' },
    passivePerception: 9,
    spellSave: null,
    spellAttack: null,
    features: [
      { name: 'Nimble Escape', desc: 'Can take the Disengage or Hide action as a bonus action on each of its turns.' }
    ],
    actions: [
      { name: 'Multiattack', desc: 'The goblin makes two attacks with its scimitar. The second attack has disadvantage.' },
      { name: 'Scimitar', desc: 'Melee Weapon Attack: +4 to hit. Hit: 1d6 + 2 slashing damage.' },
      { name: 'Javelin', desc: 'Melee or Ranged Weapon Attack: +4 to hit, range 30/120 ft. Hit: 1d6 + 2 piercing damage.' },
      { name: 'Redirect Attack (Reaction)', desc: 'When a creature the goblin can see targets it with an attack, the goblin chooses another goblin within 5 ft. The two swap places, and the chosen goblin becomes the target instead.' }
    ]
  },
  {
    id: 'goblin_sneak',
    name: 'Goblin Sneak',
    flavor: 'A small, malicious humanoid that rapidly darts between shadows.',
    ac: 15,
    hp: 7,
    speed: '30 ft.',
    stats: { STR: '-1', DEX: '+2', CON: '+0', INT: '+0', WIS: '-1', CHA: '-1' },
    passivePerception: 9,
    spellSave: null,
    spellAttack: null,
    features: [
      { name: 'Nimble Escape', desc: 'Can take the Disengage or Hide action as a bonus action on each of its turns.' }
    ],
    actions: [
      { name: 'Scimitar', desc: 'Melee Weapon Attack: +4 to hit. Hit: 1d6 + 2 slashing damage.' },
      { name: 'Shortbow', desc: 'Ranged Weapon Attack: +4 to hit, range 80/320 ft. Hit: 1d6 + 2 piercing damage.' }
    ]
  },
  {
    id: 'orc_mercenary',
    name: 'Orc Mercenary',
    flavor: 'A brutish warrior fighting for coin, wielding jagged weapons with deadly strength.',
    ac: 13,
    hp: 15,
    speed: '30 ft.',
    stats: { STR: '+3', DEX: '+1', CON: '+3', INT: '-1', WIS: '+0', CHA: '+0' },
    passivePerception: 10,
    spellSave: null,
    spellAttack: null,
    features: [
      { name: 'Aggressive', desc: 'As a bonus action, the orc can move up to its speed toward a hostile creature that it can see.' }
    ],
    actions: [
      { name: 'Greataxe', desc: 'Melee Weapon Attack: +5 to hit. Hit: 1d12 + 3 slashing damage.' },
      { name: 'Javelin', desc: 'Melee or Ranged Weapon Attack: +5 to hit, range 30/120 ft. Hit: 1d6 + 3 piercing damage.' }
    ]
  },
  {
    id: 'bandit_captain',
    name: 'Bandit Captain',
    flavor: 'A rugged, experienced fighter who survives by outmaneuvering their foes.',
    ac: 15,
    hp: 65,
    speed: '30 ft.',
    stats: { STR: '+2', DEX: '+3', CON: '+2', INT: '+2', WIS: '+0', CHA: '+2' },
    passivePerception: 10,
    spellSave: null,
    spellAttack: null,
    features: [
      { name: 'Parry', desc: 'The captain adds 2 to its AC against one melee attack that would hit it. To do so, the captain must see the attacker and be wielding a melee weapon. (Reaction)' }
    ],
    actions: [
      { name: 'Multiattack', desc: 'The captain makes three melee attacks: two with its scimitar and one with its dagger. Or the captain makes two ranged attacks with its daggers.' },
      { name: 'Scimitar', desc: 'Melee Weapon Attack: +5 to hit. Hit: 1d6 + 3 slashing damage.' },
      { name: 'Dagger', desc: 'Melee or Ranged Weapon Attack: +5 to hit. Hit: 1d4 + 3 piercing damage.' }
    ]
  },
  {
    id: 'thug',
    name: 'Thug',
    flavor: 'A ruthless enforcer hired to crack skulls and intimidate commoners.',
    ac: 11,
    hp: 32,
    speed: '30 ft.',
    stats: { STR: '+2', DEX: '+0', CON: '+2', INT: '-1', WIS: '+0', CHA: '+0' },
    passivePerception: 10,
    spellSave: null,
    spellAttack: null,
    features: [
      { name: 'Pack Tactics', desc: 'The thug has advantage on attack rolls against a creature if at least one of the thug\'s allies is within 5 ft of the creature and the ally isn\'t incapacitated.' }
    ],
    actions: [
      { name: 'Multiattack', desc: 'The thug makes two melee attacks.' },
      { name: 'Mace', desc: 'Melee Weapon Attack: +4 to hit. Hit: 1d6 + 2 bludgeoning damage.' },
      { name: 'Heavy Crossbow', desc: 'Ranged Weapon Attack: +2 to hit, range 100/400 ft. Hit: 1d10 piercing damage.' }
    ]
  },
  {
    id: 'veteran',
    name: 'Veteran',
    flavor: 'A battle-hardened soldier wearing dented plate armor, wielding multiple weapons with lethal precision.',
    ac: 17,
    hp: 58,
    speed: '30 ft.',
    stats: { STR: '+3', DEX: '+1', CON: '+2', INT: '+0', WIS: '+0', CHA: '-1' },
    passivePerception: 10,
    spellSave: null,
    spellAttack: null,
    features: [],
    actions: [
      { name: 'Multiattack', desc: 'The veteran makes two longsword attacks. If it has a shortsword drawn, it can also make a shortsword attack.' },
      { name: 'Longsword', desc: 'Melee Weapon Attack: +5 to hit. Hit: 1d8 + 3 slashing damage.' },
      { name: 'Shortsword', desc: 'Melee Weapon Attack: +5 to hit. Hit: 1d6 + 3 piercing damage.' },
      { name: 'Heavy Crossbow', desc: 'Ranged Weapon Attack: +3 to hit, range 100/400 ft. Hit: 1d10 + 1 piercing damage.' }
    ]
  },
  {
    id: 'dire_wolf',
    name: 'Dire Wolf',
    flavor: 'An enormous, fierce beast that hunts in packs and easily knocks prey to the ground.',
    ac: 14,
    hp: 37,
    speed: '50 ft.',
    stats: { STR: '+3', DEX: '+2', CON: '+2', INT: '-4', WIS: '+1', CHA: '-2' },
    passivePerception: 13,
    spellSave: null,
    spellAttack: null,
    features: [
      { name: 'Keen Hearing and Smell', desc: 'The wolf has advantage on Wisdom (Perception) checks that rely on hearing or smell.' },
      { name: 'Pack Tactics', desc: 'The wolf has advantage on attack rolls against a creature if at least one of the wolf\'s allies is within 5 ft. of the creature and the ally isn\'t incapacitated.' }
    ],
    actions: [
      { name: 'Bite', desc: 'Melee Weapon Attack: +5 to hit. Hit: 2d6 + 3 piercing damage. If the target is a creature, it must succeed on a DC 13 Strength saving throw or be knocked prone.' }
    ]
  },
  {
    id: 'brown_bear',
    name: 'Brown Bear',
    flavor: 'A massive, territorial bear that fiercely guards its den.',
    ac: 11,
    hp: 34,
    speed: '40 ft., climb 30 ft.',
    stats: { STR: '+4', DEX: '+0', CON: '+3', INT: '-4', WIS: '+1', CHA: '-2' },
    passivePerception: 13,
    spellSave: null,
    spellAttack: null,
    features: [
      { name: 'Keen Smell', desc: 'The bear has advantage on Wisdom (Perception) checks that rely on smell.' }
    ],
    actions: [
      { name: 'Multiattack', desc: 'The bear makes two attacks: one with its bite and one with its claws.' },
      { name: 'Bite', desc: 'Melee Weapon Attack: +5 to hit. Hit: 1d8 + 4 piercing damage.' },
      { name: 'Claws', desc: 'Melee Weapon Attack: +5 to hit. Hit: 2d6 + 4 slashing damage.' }
    ]
  },
  {
    id: 'giant_boar',
    name: 'Giant Boar',
    flavor: 'A bad-tempered, massive swine capable of trampling enemies with its tusks.',
    ac: 12,
    hp: 42,
    speed: '40 ft.',
    stats: { STR: '+3', DEX: '+0', CON: '+3', INT: '-4', WIS: '-2', CHA: '-3' },
    passivePerception: 8,
    spellSave: null,
    spellAttack: null,
    features: [
      { name: 'Charge', desc: 'If the boar moves at least 20 ft straight toward a target and then hits it with a tusk attack on the same turn, the target takes an extra 7 (2d6) slashing damage. If the target is a creature, it must succeed on a DC 13 Strength saving throw or be knocked prone.' },
      { name: 'Relentless (Recharges after Short/Long Rest)', desc: 'If the boar takes 14 damage or less that would reduce it to 0 HP, it is reduced to 1 HP instead.' }
    ],
    actions: [
      { name: 'Tusk', desc: 'Melee Weapon Attack: +5 to hit. Hit: 2d6 + 3 slashing damage.' }
    ]
  },
  {
    id: 'giant_crocodile',
    name: 'Giant Crocodile',
    flavor: 'A massive, ancient reptile that ambushes prey near the water\'s edge.',
    ac: 14,
    hp: 85,
    speed: '30 ft., swim 50 ft.',
    stats: { STR: '+5', DEX: '-1', CON: '+3', INT: '-4', WIS: '+0', CHA: '-2' },
    passivePerception: 10,
    spellSave: null,
    spellAttack: null,
    features: [
      { name: 'Hold Breath', desc: 'The crocodile can hold its breath for 15 minutes.' }
    ],
    actions: [
      { name: 'Multiattack', desc: 'The crocodile makes two attacks: one with its bite and one with its tail.' },
      { name: 'Bite', desc: 'Melee Weapon Attack: +8 to hit. Hit: 3d10 + 5 piercing damage, and the target is grappled (escape DC 16).' },
      { name: 'Tail', desc: 'Melee Weapon Attack: +8 to hit. Hit: 2d8 + 5 bludgeoning damage. If the target is a creature, it must succeed on a DC 16 Strength saving throw or be knocked prone.' }
    ]
  }
];