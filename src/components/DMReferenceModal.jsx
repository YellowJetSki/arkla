import { useState } from 'react';
import { X, Book, Target, Shield, AlertCircle, Mountain, Swords, Sparkles, BookOpen, Anchor, Flame, Wind, Activity } from 'lucide-react';
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
  { name: "Beast-Folk", desc: "Animal-folk of all kinds (Tabaxi cats, dog-folk, turtle-folk, bird-folk, etc.). Pick one distinct animal trait at Level 1 (like a climbing speed, swimming speed, or natural armor) and flavor your appearance however you want!" }
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
      "Level 1: Pirate's Bounty. (Bonus Action). Mark target within 60ft for 1 min. Advantage on Intimidation/Persuasion. Target subtracts 1d4 from attacks against you. You deal extra 1d6 damage. (Uses = Proficiency Bonus per Long Rest).",
      "Level 3: Flint Lock. (Action). 30ft Ranged Spell Attack. Hit: 2d10 bludgeoning. Target must make CON save or be Stunned until start of your next turn. (Uses = CHA Mod per Long Rest).",
      "Level 7: Tsunami. (Action). 15ft cone. STR save. Fail: 4d6 bludgeoning, pushed 15ft, knocked Prone. Success: Half damage, no push. (Uses = 1 per Rest).",
      "Level 11: Ocean's Rage. (Action). Summon beast within 60ft. Roll 1d6! (1-2: Giant Turtle, 3-4: Megalodon, 5-6: The Kraken). (Uses = 1 per Long Rest)."
    ]
  }
];

export const CONDITIONS = [
  { name: "Blinded", desc: "Auto-fail sight checks. Attacks against have Advantage. Own attacks have Disadvantage." },
  { name: "Charmed", desc: "Cannot attack charmer. Charmer has Advantage on social checks." },
  { name: "Deafened", desc: "Auto-fail hearing checks." },
  { name: "Frightened", desc: "Disadvantage on Ability Checks and Attacks while source is visible. Cannot move closer to source." },
  { name: "Grappled", desc: "Speed is 0. Ends if grappler is incapacitated or moved away." },
  { name: "Incapacitated", desc: "Cannot take Actions or Reactions." },
  { name: "Invisible", desc: "Attacks against have Disadvantage. Own attacks have Advantage." },
  { name: "Paralyzed", desc: "Incapacitated, can't move/speak. Auto-fail STR/DEX saves. Attacks against have Advantage. Hits within 5ft are auto-crits." },
  { name: "Petrified", desc: "Turned to stone. Incapacitated. Resistance to all damage. Immune to poison/disease." },
  { name: "Poisoned", desc: "Disadvantage on Attack rolls and Ability Checks." },
  { name: "Prone", desc: "Can only crawl. Disadvantage on attacks. Attacks against have Advantage if within 5ft, Disadvantage if further away." },
  { name: "Restrained", desc: "Speed is 0. Attacks against have Advantage. Own attacks have Disadvantage. Disadvantage on DEX saves." },
  { name: "Stunned", desc: "Incapacitated, can't move. Auto-fail STR/DEX saves. Attacks against have Advantage." },
  { name: "Unconscious", desc: "Incapacitated, drop items, fall Prone. Auto-fail STR/DEX saves. Attacks against have Advantage. Hits within 5ft are auto-crits." }
];

export const ConditionBadge = ({ conditionName, onRemove }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const condition = CONDITIONS.find(c => c.name === conditionName);
  if (!condition) return null;

  return (
    <div 
      className="relative flex items-center group cursor-help w-max"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(!showTooltip)}
    >
      <div className="bg-fuchsia-900 border-2 border-fuchsia-950 text-fuchsia-300 text-[10px] uppercase font-black px-2 py-1 rounded-lg transition-colors flex items-center gap-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
        {conditionName}
        {onRemove && (
          <button 
            onClick={(e) => { e.stopPropagation(); onRemove(conditionName); }} 
            className="text-fuchsia-500 hover:text-fuchsia-300 font-black text-xs leading-none ml-1"
          >
            ×
          </button>
        )}
      </div>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 border-[3px] border-slate-950 rounded-xl p-3 shadow-[6px_6px_0px_rgba(0,0,0,1)] z-[1000] animate-in fade-in zoom-in-95 pointer-events-none">
          <h4 className="font-black text-fuchsia-400 mb-1 uppercase tracking-widest text-[10px]">{conditionName}</h4>
          <p className="text-xs text-slate-300 font-bold leading-relaxed">{condition.desc}</p>
        </div>
      )}
    </div>
  );
};

export default function DMReferenceModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('dcs');

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-500">
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="bg-slate-900/80 backdrop-blur-2xl border-[3px] border-slate-950 rounded-3xl w-full max-w-5xl shadow-[12px_12px_0px_rgba(0,0,0,1)] flex flex-col max-h-[90dvh] relative overflow-hidden animate-in zoom-in-95 duration-500">
        
        <div className="p-5 border-b-[3px] border-slate-950 flex justify-between items-center bg-slate-900/50 relative z-10 shrink-0">
          <h2 className="text-xl font-black text-indigo-400 flex items-center gap-3 uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
            <Book className="w-6 h-6" /> DM Quick Reference
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl border-2 border-slate-950 hover:bg-red-500 hover:border-red-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">
            <X className="w-5 h-5 font-black" />
          </button>
        </div>

        <div className="bg-slate-950/50 border-b-[3px] border-slate-950 shrink-0 px-4 py-3 relative z-10">
          <ScrollableRow className="gap-2">
            <button onClick={() => setActiveTab('dcs')} className={`px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs whitespace-nowrap transition-all flex-1 text-center border-2 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none ${activeTab === 'dcs' ? 'bg-indigo-600 text-white border-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border-slate-950'}`}>Checks & Damage</button>
            <button onClick={() => setActiveTab('combat')} className={`px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs whitespace-nowrap transition-all flex-1 text-center border-2 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none ${activeTab === 'combat' ? 'bg-red-600 text-white border-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border-slate-950'}`}>Combat & Rules</button>
            <button onClick={() => setActiveTab('environment')} className={`px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs whitespace-nowrap transition-all flex-1 text-center border-2 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none ${activeTab === 'environment' ? 'bg-emerald-600 text-white border-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border-slate-950'}`}>Environment</button>
            <button onClick={() => setActiveTab('conditions')} className={`px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs whitespace-nowrap transition-all flex-1 text-center border-2 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none ${activeTab === 'conditions' ? 'bg-fuchsia-600 text-white border-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border-slate-950'}`}>Conditions</button>
            <button onClick={() => setActiveTab('classes')} className={`px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs whitespace-nowrap transition-all flex-1 text-center border-2 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none ${activeTab === 'classes' ? 'bg-amber-600 text-white border-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border-slate-950'}`}>Classes</button>
            <button onClick={() => setActiveTab('species')} className={`px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs whitespace-nowrap transition-all flex-1 text-center border-2 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none ${activeTab === 'species' ? 'bg-sky-600 text-white border-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border-slate-950'}`}>Species</button>
          </ScrollableRow>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 relative z-10">
          
          {activeTab === 'dcs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
              
              <div className="md:col-span-2 bg-slate-900 border-[3px] border-slate-950 rounded-2xl p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <h3 className="font-black text-emerald-400 text-lg mb-4 uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] flex items-center gap-2"><Activity className="w-5 h-5"/> Skill Associations</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                   <div className="bg-slate-950 p-4 rounded-xl border-2 border-slate-900 shadow-inner">
                     <span className="text-red-400 font-black uppercase tracking-widest block mb-2 border-b-2 border-slate-900 pb-1">Strength (STR)</span>
                     <ul className="text-slate-300 font-bold space-y-1.5">
                       <li>Athletics <span className="text-slate-500 font-medium">(Climbing, jumping, grappling)</span></li>
                     </ul>
                   </div>
                   <div className="bg-slate-950 p-4 rounded-xl border-2 border-slate-900 shadow-inner">
                     <span className="text-sky-400 font-black uppercase tracking-widest block mb-2 border-b-2 border-slate-900 pb-1">Dexterity (DEX)</span>
                     <ul className="text-slate-300 font-bold space-y-1.5">
                       <li>Acrobatics <span className="text-slate-500 font-medium">(Balance, diving)</span></li>
                       <li>Sleight of Hand <span className="text-slate-500 font-medium">(Pickpocket, conceal)</span></li>
                       <li>Stealth <span className="text-slate-500 font-medium">(Hide, sneak)</span></li>
                     </ul>
                   </div>
                   <div className="bg-slate-950 p-4 rounded-xl border-2 border-slate-900 shadow-inner">
                     <span className="text-indigo-400 font-black uppercase tracking-widest block mb-2 border-b-2 border-slate-900 pb-1">Intelligence (INT)</span>
                     <ul className="text-slate-300 font-bold space-y-1.5">
                       <li>Arcana <span className="text-slate-500 font-medium">(Magic lore)</span></li>
                       <li>History <span className="text-slate-500 font-medium">(Past events)</span></li>
                       <li>Investigation <span className="text-slate-500 font-medium">(Deduction, searching)</span></li>
                       <li>Nature <span className="text-slate-500 font-medium">(Plants, animals, weather)</span></li>
                       <li>Religion <span className="text-slate-500 font-medium">(Deities, holy lore)</span></li>
                     </ul>
                   </div>
                   <div className="bg-slate-950 p-4 rounded-xl border-2 border-slate-900 shadow-inner">
                     <span className="text-amber-500 font-black uppercase tracking-widest block mb-2 border-b-2 border-slate-900 pb-1">Wisdom (WIS)</span>
                     <ul className="text-slate-300 font-bold space-y-1.5">
                       <li>Animal Handling <span className="text-slate-500 font-medium">(Calm, command beasts)</span></li>
                       <li>Insight <span className="text-slate-500 font-medium">(Read intentions, spot lies)</span></li>
                       <li>Medicine <span className="text-slate-500 font-medium">(Diagnose, stabilize)</span></li>
                       <li>Perception <span className="text-slate-500 font-medium">(Spot, hear, detect)</span></li>
                       <li>Survival <span className="text-slate-500 font-medium">(Track, forage, navigate)</span></li>
                     </ul>
                   </div>
                   <div className="bg-slate-950 p-4 rounded-xl border-2 border-slate-900 shadow-inner sm:col-span-2">
                     <span className="text-fuchsia-400 font-black uppercase tracking-widest block mb-2 border-b-2 border-slate-900 pb-1">Charisma (CHA)</span>
                     <ul className="text-slate-300 font-bold space-y-1.5 grid grid-cols-2">
                       <li>Deception <span className="text-slate-500 font-medium">(Lie, con)</span></li>
                       <li>Intimidation <span className="text-slate-500 font-medium">(Threaten, coerce)</span></li>
                       <li>Performance <span className="text-slate-500 font-medium">(Entertain, act)</span></li>
                       <li>Persuasion <span className="text-slate-500 font-medium">(Convince, negotiate)</span></li>
                     </ul>
                   </div>
                </div>
              </div>

              <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)] h-fit">
                <h3 className="font-black text-indigo-400 text-lg mb-4 flex items-center gap-2 uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]"><Target className="w-5 h-5" /> Difficulty Classes (DC)</h3>
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b-[3px] border-slate-950 text-slate-500 uppercase tracking-widest font-black text-[10px]"><th className="pb-2">Task Difficulty</th><th className="pb-2">DC</th></tr>
                  </thead>
                  <tbody className="text-slate-300 font-bold">
                    <tr className="border-b-2 border-slate-800 hover:bg-slate-800 transition-colors"><td className="py-2.5 px-2">Very easy</td><td className="py-2.5 font-black text-white">5</td></tr>
                    <tr className="border-b-2 border-slate-800 hover:bg-slate-800 transition-colors"><td className="py-2.5 px-2">Easy</td><td className="py-2.5 font-black text-white">10</td></tr>
                    <tr className="border-b-2 border-slate-800 hover:bg-slate-800 transition-colors"><td className="py-2.5 px-2">Medium</td><td className="py-2.5 font-black text-white">15</td></tr>
                    <tr className="border-b-2 border-slate-800 hover:bg-slate-800 transition-colors"><td className="py-2.5 px-2">Hard</td><td className="py-2.5 font-black text-white">20</td></tr>
                    <tr className="border-b-2 border-slate-800 hover:bg-slate-800 transition-colors"><td className="py-2.5 px-2">Very hard</td><td className="py-2.5 font-black text-white">25</td></tr>
                    <tr className="hover:bg-slate-800 transition-colors"><td className="py-2.5 px-2">Nearly impossible</td><td className="py-2.5 font-black text-white">30</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)] h-fit">
                <h3 className="font-black text-red-400 text-lg mb-4 flex items-center gap-2 uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]"><AlertCircle className="w-5 h-5" /> Improvising Damage</h3>
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b-[3px] border-slate-950 text-slate-500 uppercase tracking-widest font-black text-[10px]"><th className="pb-2">Example Source</th><th className="pb-2">Damage</th></tr>
                  </thead>
                  <tbody className="text-slate-300 font-bold">
                    <tr className="border-b-2 border-slate-800 hover:bg-slate-800 transition-colors"><td className="py-2.5 px-2 leading-tight">Burned by coals, hit by falling bookcase</td><td className="py-2.5 font-black text-white">1d10</td></tr>
                    <tr className="border-b-2 border-slate-800 hover:bg-slate-800 transition-colors"><td className="py-2.5 px-2 leading-tight">Struck by lightning, falling rubble</td><td className="py-2.5 font-black text-white">2d10</td></tr>
                    <tr className="border-b-2 border-slate-800 hover:bg-slate-800 transition-colors"><td className="py-2.5 px-2 leading-tight">Hit by falling stone block, poison gas</td><td className="py-2.5 font-black text-white">4d10</td></tr>
                    <tr className="border-b-2 border-slate-800 hover:bg-slate-800 transition-colors"><td className="py-2.5 px-2 leading-tight">Crushed by compactor, wading in lava</td><td className="py-2.5 font-black text-white">10d10</td></tr>
                    <tr className="hover:bg-slate-800 transition-colors"><td className="py-2.5 px-2 leading-tight">Crushed by flying fortress, in a volcano</td><td className="py-2.5 font-black text-white">18d10</td></tr>
                  </tbody>
                </table>
              </div>
              
              <div className="md:col-span-2 bg-slate-900 border-[3px] border-slate-950 rounded-2xl p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <h3 className="font-black text-amber-400 text-lg mb-4 uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">Object Armor Class & HP</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-slate-300">
                  <div className="bg-slate-950 p-4 rounded-xl border-2 border-slate-900 shadow-inner">
                    <strong className="text-white block mb-2 border-b-2 border-slate-900 pb-2 font-black uppercase tracking-widest text-[10px]">Armor Class by Material:</strong>
                    <ul className="space-y-1.5 font-bold">
                      <li className="flex justify-between">Cloth/Paper/Rope: <span className="text-amber-400 font-black">11</span></li>
                      <li className="flex justify-between">Wood/Bone: <span className="text-amber-400 font-black">15</span></li>
                      <li className="flex justify-between">Stone: <span className="text-amber-400 font-black">17</span></li>
                      <li className="flex justify-between">Iron/Steel: <span className="text-amber-400 font-black">19</span></li>
                      <li className="flex justify-between">Mithral: <span className="text-amber-400 font-black">21</span></li>
                      <li className="flex justify-between">Adamantine: <span className="text-amber-400 font-black">23</span></li>
                    </ul>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border-2 border-slate-900 shadow-inner">
                    <strong className="text-white block mb-2 border-b-2 border-slate-900 pb-2 font-black uppercase tracking-widest text-[10px]">Hit Points by Size (Fragile / Resilient):</strong>
                    <ul className="space-y-1.5 font-bold">
                      <li className="flex justify-between">Tiny (Bottle, Lock): <span><span className="text-emerald-400 font-black">2</span> / <span className="text-emerald-500 font-black">5</span></span></li>
                      <li className="flex justify-between">Small (Chest, Lute): <span><span className="text-emerald-400 font-black">3</span> / <span className="text-emerald-500 font-black">10</span></span></li>
                      <li className="flex justify-between">Medium (Barrel, Chandelier): <span><span className="text-emerald-400 font-black">4</span> / <span className="text-emerald-500 font-black">18</span></span></li>
                      <li className="flex justify-between">Large (Cart, Window): <span><span className="text-emerald-400 font-black">5</span> / <span className="text-emerald-500 font-black">27</span></span></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'combat' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
              
              <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)] h-fit">
                <h3 className="font-black text-emerald-400 text-lg mb-4 flex items-center gap-2 uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]"><Shield className="w-5 h-5" /> Cover & Concentration</h3>
                <ul className="space-y-4 text-xs font-bold text-slate-300">
                  <li className="bg-slate-950 p-3 rounded-lg border-2 border-slate-900 shadow-inner"><strong className="text-white block mb-1 uppercase tracking-wider">Half Cover (+2 AC and DEX saves):</strong> Blocks at least half the target's body (e.g. low wall, furniture, another creature).</li>
                  <li className="bg-slate-950 p-3 rounded-lg border-2 border-slate-900 shadow-inner"><strong className="text-white block mb-1 uppercase tracking-wider">Three-Quarters Cover (+5 AC and DEX saves):</strong> Blocks about three-quarters of the body (e.g. arrow slit, thick tree).</li>
                  <li className="border-t-[3px] border-slate-950 pt-4"><strong className="text-fuchsia-400 block mb-1 uppercase tracking-wider">Concentration Checks:</strong> When a spellcaster takes damage while concentrating on a spell, they must make a CON saving throw. <br/><strong className="text-slate-950 bg-fuchsia-500 px-2 py-1 rounded inline-block mt-2 font-black">DC = 10, OR half the damage taken (whichever is higher).</strong></li>
                </ul>
              </div>

              <div className="bg-slate-900 border-[3px] border-red-950 shadow-[6px_6px_0px_rgba(127,29,29,1)] rounded-2xl p-5 h-fit">
                <h3 className="font-black text-red-500 text-lg mb-2 flex items-center gap-2 uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]"><AlertCircle className="w-5 h-5" /> Exhaustion Levels</h3>
                <p className="text-[10px] font-bold text-slate-400 mb-4 leading-relaxed uppercase tracking-wider">If an already exhausted creature suffers another effect that causes exhaustion, its current level increases by the amount specified. Finishing a Long Rest reduces exhaustion by 1.</p>
                <table className="w-full text-xs font-bold text-left">
                  <thead>
                    <tr className="border-b-[3px] border-red-950 text-red-500 uppercase tracking-widest"><th className="pb-2 w-16">Level</th><th className="pb-2">Effect</th></tr>
                  </thead>
                  <tbody className="text-slate-300">
                    <tr className="border-b-2 border-slate-900 hover:bg-slate-950 transition-colors"><td className="py-2.5 px-2 font-black text-white">1</td><td className="py-2.5">Disadvantage on Ability Checks</td></tr>
                    <tr className="border-b-2 border-slate-900 hover:bg-slate-950 transition-colors"><td className="py-2.5 px-2 font-black text-white">2</td><td className="py-2.5 text-yellow-500">Speed halved</td></tr>
                    <tr className="border-b-2 border-slate-900 hover:bg-slate-950 transition-colors"><td className="py-2.5 px-2 font-black text-white">3</td><td className="py-2.5 text-orange-500">Disadvantage on Attack rolls & Saves</td></tr>
                    <tr className="border-b-2 border-slate-900 hover:bg-slate-950 transition-colors"><td className="py-2.5 px-2 font-black text-white">4</td><td className="py-2.5 text-orange-600">Hit point maximum halved</td></tr>
                    <tr className="border-b-2 border-slate-900 hover:bg-slate-950 transition-colors"><td className="py-2.5 px-2 font-black text-white">5</td><td className="py-2.5 text-red-500">Speed reduced to 0</td></tr>
                    <tr><td className="py-2.5 px-2 font-black text-red-600 text-lg">6</td><td className="py-2.5 font-black text-red-600 tracking-widest uppercase text-lg drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">Death</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="md:col-span-2 bg-slate-900 border-[3px] border-slate-950 rounded-2xl p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <h3 className="font-black text-amber-500 text-lg mb-4 flex items-center gap-2 uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]"><Swords className="w-5 h-5" /> Actions in Combat</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs font-bold text-slate-300">
                  <p className="bg-slate-950 p-3 rounded-xl border-2 border-slate-900 shadow-inner"><strong className="text-white block mb-1 uppercase tracking-wider text-[10px]">Attack:</strong> Make one melee or ranged attack.</p>
                  <p className="bg-slate-950 p-3 rounded-xl border-2 border-slate-900 shadow-inner"><strong className="text-white block mb-1 uppercase tracking-wider text-[10px]">Cast a Spell:</strong> Cast a spell with a casting time of 1 Action.</p>
                  <p className="bg-slate-950 p-3 rounded-xl border-2 border-slate-900 shadow-inner"><strong className="text-white block mb-1 uppercase tracking-wider text-[10px]">Dash:</strong> Gain extra movement equal to speed.</p>
                  <p className="bg-slate-950 p-3 rounded-xl border-2 border-slate-900 shadow-inner"><strong className="text-white block mb-1 uppercase tracking-wider text-[10px]">Disengage:</strong> Movement doesn't provoke opportunity attacks.</p>
                  <p className="bg-slate-950 p-3 rounded-xl border-2 border-slate-900 shadow-inner"><strong className="text-white block mb-1 uppercase tracking-wider text-[10px]">Dodge:</strong> Attacks against have Disadvantage. DEX saves have Advantage.</p>
                  <p className="bg-slate-950 p-3 rounded-xl border-2 border-slate-900 shadow-inner"><strong className="text-white block mb-1 uppercase tracking-wider text-[10px]">Help:</strong> Give an ally Advantage on their next check or attack.</p>
                  <p className="bg-slate-950 p-3 rounded-xl border-2 border-slate-900 shadow-inner"><strong className="text-white block mb-1 uppercase tracking-wider text-[10px]">Hide:</strong> Make a Stealth check to become unseen.</p>
                  <p className="bg-slate-950 p-3 rounded-xl border-2 border-slate-900 shadow-inner"><strong className="text-white block mb-1 uppercase tracking-wider text-[10px]">Ready:</strong> Hold action for a specific trigger (uses Reaction to fire).</p>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'environment' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
              
              <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)] h-fit">
                <h3 className="font-black text-sky-400 text-lg mb-4 flex items-center gap-2 uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]"><Wind className="w-5 h-5" /> Extreme Weather</h3>
                <ul className="space-y-4 text-xs font-bold text-slate-300">
                  <li><strong className="text-white block mb-1 uppercase tracking-wider text-[10px]">Extreme Cold:</strong> Without cold weather gear, creatures must succeed on a <strong className="text-slate-950 bg-sky-500 px-2 py-0.5 rounded">DC 10 CON Save</strong> at the end of each hour or gain one level of Exhaustion.</li>
                  <li className="border-t-[3px] border-slate-950 pt-4"><strong className="text-white block mb-1 uppercase tracking-wider text-[10px]">Extreme Heat:</strong> Creatures exposed without access to drinkable water must make a CON Save at the end of each hour or gain one level of Exhaustion. <br/><strong className="text-slate-950 bg-amber-500 px-2 py-0.5 rounded inline-block mt-2">DC = 5, +1 for each additional hour.</strong></li>
                </ul>
              </div>

              <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)] h-fit">
                <h3 className="font-black text-indigo-400 text-lg mb-4 uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">Light & Vision</h3>
                <ul className="space-y-3 text-xs font-bold text-slate-300">
                  <li className="bg-slate-950 p-3 rounded-xl border-2 border-slate-900 shadow-inner"><strong className="text-white block mb-1 uppercase tracking-wider text-[10px]">Lightly Obscured (Dim Light):</strong> Creatures have Disadvantage on Perception checks that rely on sight.</li>
                  <li className="bg-slate-950 p-3 rounded-xl border-2 border-slate-900 shadow-inner"><strong className="text-white block mb-1 uppercase tracking-wider text-[10px]">Heavily Obscured (Darkness, Fog):</strong> Vision is blocked entirely. Creatures effectively suffer from the <strong className="text-fuchsia-500 font-black">Blinded</strong> condition.</li>
                  <li className="bg-slate-950 p-3 rounded-xl border-2 border-slate-900 shadow-inner"><strong className="text-white block mb-1 uppercase tracking-wider text-[10px]">Darkvision:</strong> Can see in dim light as if it were bright light, and darkness as if it were dim light.</li>
                </ul>
              </div>

              <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)] h-fit">
                <h3 className="font-black text-amber-500 text-lg mb-4 flex items-center gap-2 uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]"><Mountain className="w-5 h-5" /> Travel Pace</h3>
                <table className="w-full text-xs font-bold text-left">
                  <thead>
                    <tr className="border-b-[3px] border-slate-950 text-slate-500 uppercase tracking-widest text-[10px]"><th className="pb-2">Pace</th><th className="pb-2">Distance</th><th className="pb-2">Effect</th></tr>
                  </thead>
                  <tbody className="text-slate-300">
                    <tr className="border-b-2 border-slate-900 hover:bg-slate-950 transition-colors"><td className="py-3 px-2 font-black text-white">Fast</td><td className="py-3">30 miles/day</td><td className="py-3">-5 penalty to passive Perception</td></tr>
                    <tr className="border-b-2 border-slate-900 hover:bg-slate-950 transition-colors"><td className="py-3 px-2 font-black text-white">Normal</td><td className="py-3">24 miles/day</td><td className="py-3">-</td></tr>
                    <tr className="hover:bg-slate-950 transition-colors"><td className="py-3 px-2 font-black text-white">Slow</td><td className="py-3">18 miles/day</td><td className="py-3">Able to use stealth</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)] h-fit">
                <h3 className="font-black text-red-500 text-lg mb-3 flex items-center gap-2 uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]"><Flame className="w-5 h-5" /> Falling</h3>
                <p className="text-xs font-bold text-slate-300 bg-slate-950 p-4 rounded-xl border-2 border-slate-900 shadow-inner leading-relaxed">A creature takes <strong className="text-white">1d6 bludgeoning damage</strong> for every 10 feet it falls, to a maximum of 20d6. The creature lands Prone, unless it avoids taking damage from the fall.</p>
              </div>

            </div>
          )}

          {activeTab === 'conditions' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CONDITIONS.map(cond => (
                  <div key={cond.name} className="bg-slate-900 border-[3px] border-slate-950 rounded-xl p-5 flex flex-col justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:border-fuchsia-500 transition-colors">
                      <ConditionBadge conditionName={cond.name} />
                      <p className="text-xs font-bold text-slate-400 mt-3 leading-relaxed">{cond.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'classes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-bottom-2">
              {CLASS_LORE.map(cls => (
                <div key={cls.name} className={`bg-slate-900 border-[3px] ${cls.name === 'Pirate' ? 'border-amber-500 shadow-[6px_6px_0px_rgba(245,158,11,1)]' : 'border-slate-950 shadow-[6px_6px_0px_rgba(0,0,0,1)]'} rounded-2xl p-5 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:border-slate-700`}>
                  <h3 className="font-black text-white text-lg flex items-center gap-3 mb-3 border-b-2 border-slate-950 pb-2 uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                    <cls.icon className={`w-5 h-5 ${cls.name === 'Pirate' ? 'text-amber-500' : 'text-slate-500'}`} /> {cls.name}
                  </h3>
                  <p className="text-xs font-bold text-slate-300 leading-relaxed flex-1">{cls.desc}</p>
                  
                  {cls.mechanics && (
                    <div className="mt-5 bg-slate-950 rounded-xl p-4 border-2 border-amber-900 space-y-3 shadow-inner">
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-2">Unique Mechanics</span>
                      {cls.mechanics.map((mech, i) => (
                        <p key={i} className="text-xs font-bold text-slate-300 leading-relaxed border-l-[3px] border-amber-500 pl-3 py-0.5">{mech}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'species' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-bottom-2">
              {SPECIES_LORE.map(spec => (
                <div key={spec.name} className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:border-sky-500 transition-colors">
                  <h3 className="font-black text-sky-400 text-lg mb-3 uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">{spec.name}</h3>
                  <p className="text-xs font-bold text-slate-300 leading-relaxed">{spec.desc}</p>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}