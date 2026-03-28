import { useState } from 'react';
import { X, BookOpen, Shield, Swords, Sparkles, Anchor, AlertCircle, Moon, Zap, ArrowDownCircle, Activity } from 'lucide-react';
import ScrollableRow from './shared/ScrollableRow';

const SPECIES_LORE = [
  { name: "Human", desc: "Adaptable, ambitious, and diverse. Good at a little bit of everything." },
  { name: "Elf", desc: "Graceful, long-lived, and often tied to nature or magic." },
  { name: "Dwarf", desc: "Stout, tough, and stubborn. Often tied to mountains, stonework, and honor." },
  { name: "Halfling", desc: "Short, lucky, and brave. They love good food, comfort, and community." },
  { name: "Dragonborn", desc: "Tall, imposing humanoid dragons. You literally have dragon blood in your veins, which means you have scales and the ability to exhale a breath weapon (like fire, lightning, or acid) right in your enemies' faces." },
  { name: "Gnome", desc: "Small, eccentric, and incredibly enthusiastic. Gnomes are often brilliant inventors or tricksters who love practical jokes and tinkering with clockwork toys." },
  { name: "Half-Orc", desc: "Tall, muscular, and fiercely tough. You have the heart of a human and the raw, unstoppable endurance of an orc. When a Half-Orc gets knocked out, they can often just refuse to fall down through sheer willpower." },
  { name: "Orc", desc: "Massive, green-skinned, and relentlessly powerful. You have the aggressive charge and raw, unbridled strength of a full-blooded Orc." },
  { name: "Goliath", desc: "Massive, 7-to-8-foot-tall mountain dwellers. Goliaths are highly competitive athletes who can carry massive amounts of weight and shrug off damage like it's nothing." },
  { name: "Beast-Folk", desc: "Animal-folk of all kinds (Tabaxi cats, dog-folk, turtle-folk, bird-folk, etc.). Agile, curious, and incredibly diverse. Pick one distinct animal trait at Level 1 (like a climbing speed, swimming speed, or natural armor) and flavor your appearance however you want!" }
];

const CLASS_LORE = [
  { name: "Fighter", icon: Swords, desc: "The master of weapons and armor. Simple, effective, and reliable." },
  { name: "Barbarian", icon: Swords, desc: "A rage-fueled warrior who takes massive hits and deals massive damage." },
  { name: "Paladin", icon: Shield, desc: "A knight who uses a mix of heavy weapons and magic to smite enemies and heal allies. Mostly defensive." },
  { name: "Monk", icon: Swords, desc: "You don't need heavy armor or swords; your body is a weapon. You use martial arts to punch enemies a dozen times in a few seconds, catch arrows out of the air, and run up walls." },
  { name: "Rogue", icon: Swords, desc: "The master of stealth, picking locks, and dealing massive damage when striking from the shadows." },
  { name: "Ranger", icon: Swords, desc: "A wilderness survivor and tracker who blends archery, dual-wielding, and nature magic." },
  { name: "Wizard", icon: BookOpen, desc: "A magical nerd. You studied dusty tomes for years to learn a massive variety of spells." },
  { name: "Mage", icon: Sparkles, desc: "A magical prodigy. You were born with magic in your blood and use it naturally. (Mechanically acts as a Sorcerer)." },
  { name: "Dealt", icon: Sparkles, desc: "The deal-maker. You made a pact with a powerful entity (like a Magical Giant, Fey, or Dragon) in exchange for cool powers. (Mechanically acts as a Warlock)." },
  { name: "Cleric", icon: Sparkles, desc: "The divine conduit. You draw powerful healing and destructive magic directly from a higher power in exchange for being one of its followers." },
  { name: "Bard", icon: Sparkles, desc: "The magical artist. You use music, speeches, or dancing to cast spells, charm enemies, and buff your friends." },
  { name: "Artificer", icon: Sparkles, desc: "You don't cast spells by waving a wand; you cast them by building magical gadgets, brewing explosive potions, or upgrading your friends' armor with infused magic." },
  { name: "Druid", icon: Sparkles, desc: "You wield the raw magic of nature itself. You can call down lightning, trap enemies in thorny vines, and magically transform yourself into animals to fight or sneak around." },
  { name: "Pirate", icon: Anchor, desc: "You hold high influence over others. A swashbuckler and a thief whose attacks are infused with the magic of the seas.",
    mechanics: [
      "Hit Dice: 1d10 per level.",
      "Level 1: Pirate's Bounty. (Bonus Action). Mark a target within 60ft for 1 minute. You have advantage on Intimidation/Persuasion against them. They subtract 1d4 from attacks against you, and you deal an extra 1d6 damage to them. (Uses = Proficiency Bonus per Long Rest).",
      "Level 3: Flint Lock. (Action). Blast highly pressurized water at a target within 30ft. Ranged Spell Attack. Hit: 2d10 bludgeoning. Target must make a CON save or be Stunned until the start of your next turn. (Uses = CHA Mod per Long Rest).",
      "Level 7: Tsunami. (Action). 15ft cone of water. STR save. Fail: 4d6 bludgeoning, pushed 15ft away, knocked Prone. Success: Half damage, not pushed. (Uses = 1 per Rest).",
      "Level 11: Ocean's Rage. (Action). Summon a spectral sea beast on a target within 60ft. Roll 1d6 to determine the beast! (1-2: Giant Turtle, 3-4: Megalodon, 5-6: The Kraken). (Uses = 1 per Long Rest)."
    ]
  }
];

const CONDITIONS = [
  { name: "Blinded", desc: "You can't see. You automatically fail checks requiring sight. Attack rolls against you have Advantage, and your Attack rolls have Disadvantage." },
  { name: "Charmed", desc: "You can't attack the charmer or target them with harmful abilities. The charmer has Advantage on any social interaction with you." },
  { name: "Deafened", desc: "You can't hear. You automatically fail checks requiring hearing." },
  { name: "Frightened", desc: "You have Disadvantage on Ability Checks and Attack rolls while the source of your fear is within line of sight. You can't willingly move closer to the source." },
  { name: "Grappled", desc: "Your speed becomes 0. Ends if the grappler is incapacitated or if you are forcefully moved away from them." },
  { name: "Incapacitated", desc: "You can't take Actions or Reactions." },
  { name: "Invisible", desc: "You are impossible to see without magic/special senses. Attack rolls against you have Disadvantage, and your Attack rolls have Advantage." },
  { name: "Paralyzed", desc: "You are Incapacitated and can't move or speak. You automatically fail STR and DEX saves. Attack rolls against you have Advantage. Any attack that hits you from within 5 feet is an automatic Critical Hit." },
  { name: "Petrified", desc: "You are transformed into a solid inanimate substance. You are incapacitated, can't move/speak, unaware of surroundings. You have Resistance to all damage." },
  { name: "Poisoned", desc: "You have Disadvantage on Attack rolls and Ability Checks." },
  { name: "Prone", desc: "Your only movement option is crawling (costs double speed) until you stand up (costs half your movement). You have Disadvantage on Attack rolls. Attack rolls against you have Advantage if the attacker is within 5 feet, otherwise Disadvantage." },
  { name: "Restrained", desc: "Your speed is 0. Attack rolls against you have Advantage, your Attack rolls have Disadvantage. You have Disadvantage on DEX saves." },
  { name: "Stunned", desc: "You are Incapacitated, can't move, and can speak only falteringly. You automatically fail STR and DEX saves. Attack rolls against you have Advantage." },
  { name: "Unconscious", desc: "You drop whatever you are holding and fall Prone. You are Incapacitated. You automatically fail STR and DEX saves. Attack rolls against you have Advantage. Hits from within 5 feet are automatic Critical Hits." }
];

export default function PlayerGuideModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('rules');

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-500">
      
      {/* Immersive ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="bg-slate-900/80 backdrop-blur-2xl border border-indigo-500/30 rounded-3xl w-full max-w-4xl shadow-[0_0_60px_rgba(99,102,241,0.2)] flex flex-col max-h-[90dvh] relative overflow-hidden animate-in zoom-in-95 duration-500">
        
        <div className="p-5 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/50 relative z-10 shrink-0">
          <h2 className="text-xl font-black text-indigo-400 flex items-center gap-3 uppercase tracking-widest">
            <BookOpen className="w-6 h-6" /> Campaign Handbook
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl border border-slate-700 hover:border-indigo-500/50 shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-950/50 border-b border-slate-800/80 shrink-0 px-4 py-3 relative z-10">
          <ScrollableRow className="gap-2">
            <button onClick={() => setActiveTab('rules')} className={`px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex-1 text-center shadow-sm ${activeTab === 'rules' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700/50'}`}>Core Rules</button>
            <button onClick={() => setActiveTab('conditions')} className={`px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex-1 text-center shadow-sm ${activeTab === 'conditions' ? 'bg-fuchsia-600 text-white shadow-[0_0_15px_rgba(217,70,239,0.4)]' : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700/50'}`}>Conditions</button>
            <button onClick={() => setActiveTab('classes')} className={`px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex-1 text-center shadow-sm ${activeTab === 'classes' ? 'bg-amber-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700/50'}`}>Classes</button>
            <button onClick={() => setActiveTab('species')} className={`px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex-1 text-center shadow-sm ${activeTab === 'species' ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700/50'}`}>Species</button>
          </ScrollableRow>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 relative z-10">
          
          {activeTab === 'rules' && (
            <div className="space-y-6 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
              
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 md:col-span-2 shadow-inner">
                <h3 className="font-black text-indigo-400 text-lg mb-4 border-b border-slate-700/50 pb-2 flex items-center gap-2 uppercase tracking-widest"><Activity className="w-5 h-5"/> Anatomy of a Turn</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/50 shadow-sm hover:border-indigo-500/30 transition-colors">
                    <strong className="text-white block mb-1">1. Movement</strong>
                    <span className="text-xs text-slate-400 leading-relaxed block">Can be broken up before and after your actions. Standing up costs half your speed.</span>
                  </div>
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/50 shadow-sm hover:border-indigo-500/30 transition-colors">
                    <strong className="text-white block mb-1">2. Action</strong>
                    <span className="text-xs text-slate-400 leading-relaxed block">Your main activity (Attack, Cast a Spell, Dash, Dodge, Help, Hide, Use Object).</span>
                  </div>
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/50 shadow-sm hover:border-indigo-500/30 transition-colors">
                    <strong className="text-white block mb-1">3. Bonus Action</strong>
                    <span className="text-xs text-slate-400 leading-relaxed block">Only available if a specific spell, ability, or feature says it costs a Bonus Action.</span>
                  </div>
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/50 shadow-sm hover:border-indigo-500/30 transition-colors">
                    <strong className="text-white block mb-1">4. Reaction</strong>
                    <span className="text-xs text-slate-400 leading-relaxed block">One per round. Used outside your turn in response to triggers (e.g., Opportunity Attack).</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 shadow-inner">
                <h3 className="font-black text-amber-400 text-lg mb-4 border-b border-amber-900/30 pb-2 flex items-center gap-2 uppercase tracking-widest"><Swords className="w-5 h-5"/> Common Actions</h3>
                <ul className="space-y-3">
                  <li className="text-sm text-slate-300"><strong className="text-white">Dash:</strong> Gain extra movement equal to your speed for the current turn.</li>
                  <li className="text-sm text-slate-300"><strong className="text-white">Disengage:</strong> Your movement doesn't provoke Opportunity Attacks for the rest of the turn.</li>
                  <li className="text-sm text-slate-300"><strong className="text-white">Dodge:</strong> Attack rolls against you have Disadvantage, and you have Advantage on DEX saves.</li>
                  <li className="text-sm text-slate-300"><strong className="text-white">Help:</strong> Give an ally Advantage on their next skill check or attack roll against a target.</li>
                  <li className="text-sm text-slate-300"><strong className="text-white">Ready:</strong> Hold your Action for a specific trigger (requires your Reaction to unleash).</li>
                  <li className="text-sm text-slate-300"><strong className="text-white">Hide:</strong> Roll Stealth vs Perception to become unseen.</li>
                </ul>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 shadow-inner">
                  <h3 className="font-black text-emerald-400 text-lg mb-4 border-b border-emerald-900/30 pb-2 flex items-center gap-2 uppercase tracking-widest"><ArrowDownCircle className="w-5 h-5"/> Cover Rules</h3>
                  <ul className="space-y-3 text-sm text-slate-300">
                    <li><strong className="text-white">Half Cover:</strong> +2 bonus to AC and DEX saving throws (e.g. low wall, furniture).</li>
                    <li><strong className="text-white">Three-Quarters Cover:</strong> +5 bonus to AC and DEX saving throws (e.g. arrow slit, thick tree).</li>
                    <li><strong className="text-white">Total Cover:</strong> You cannot be targeted directly by attacks or spells.</li>
                  </ul>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 shadow-inner">
                  <h3 className="font-black text-fuchsia-400 text-lg mb-2 uppercase tracking-widest">Advantage & Disadvantage</h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-3">If you have <strong className="text-white">Advantage</strong>, roll two d20s and take the <strong className="text-emerald-400">higher</strong> number. If you have <strong className="text-white">Disadvantage</strong>, roll two d20s and take the <strong className="text-red-400">lower</strong> number.</p>
                  <p className="text-xs text-slate-400 italic bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/50">If you have both at the same time, they cancel out.</p>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'conditions' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-fuchsia-900/20 border border-fuchsia-500/30 p-4 rounded-xl flex items-start gap-3 shadow-inner">
                <AlertCircle className="w-6 h-6 text-fuchsia-400 shrink-0 mt-0.5" />
                <p className="text-sm text-fuchsia-100/80 leading-relaxed">
                  These statuses alter the rules for whoever is afflicted. Multiple instances of the same condition don't stack. The Engine will automatically calculate speed and disadvantage penalties for you when these are applied to your sheet.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CONDITIONS.map(cond => (
                  <div key={cond.name} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 shadow-sm hover:border-fuchsia-500/30 transition-colors">
                    <h4 className="font-black text-fuchsia-300 mb-2 text-lg drop-shadow-sm">{cond.name}</h4>
                    <p className="text-sm text-slate-300 leading-relaxed">{cond.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'classes' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <p className="text-slate-300 text-sm bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50 shadow-inner">
                Choose your path carefully. Note that <strong className="text-amber-400">Mages</strong> and <strong className="text-amber-400">Dealt</strong> rely on raw magic or powerful pacts, entirely avoiding dark or demonic arts to abide by the realm's laws.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {CLASS_LORE.map(cls => (
                  <div key={cls.name} className={`bg-slate-800/50 backdrop-blur-sm border rounded-2xl p-5 flex flex-col shadow-sm transition-all duration-300 hover:-translate-y-0.5 ${cls.name === 'Pirate' ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:border-amber-400' : 'border-slate-700/50 hover:border-slate-500'}`}>
                    <h3 className={`font-black text-xl flex items-center gap-3 mb-3 pb-2 border-b ${cls.name === 'Pirate' ? 'text-amber-400 border-amber-900/30' : 'text-white border-slate-700/50'}`}>
                      <cls.icon className={`w-6 h-6 ${cls.name === 'Pirate' ? 'text-amber-500' : 'text-slate-400'}`} /> {cls.name}
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed flex-1">{cls.desc}</p>
                    
                    {cls.mechanics && (
                      <div className="mt-4 bg-slate-900/80 rounded-xl p-4 border border-amber-900/50 space-y-3 shadow-inner">
                        <span className="text-xs font-black text-amber-500 uppercase tracking-widest block mb-1">Unique Mechanics</span>
                        {cls.mechanics.map((mech, i) => (
                          <p key={i} className="text-xs text-slate-300 leading-relaxed border-l-2 border-amber-500/50 pl-3 py-0.5">{mech}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'species' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <p className="text-slate-300 text-sm bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50 shadow-inner">
                The world is diverse and full of unique origins. Choose the species that best fits your character's story.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {SPECIES_LORE.map(spec => (
                  <div key={spec.name} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 shadow-sm hover:border-emerald-500/30 transition-colors">
                    <h3 className="font-black text-emerald-400 text-xl mb-3 drop-shadow-sm">{spec.name}</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">{spec.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
        
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 shrink-0 text-center relative z-10">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">When in doubt, ask the Dungeon Master.</p>
        </div>

      </div>
    </div>
  );
}