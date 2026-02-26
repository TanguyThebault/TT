import React, { useState, useEffect } from 'react';
import { useGame, type Survivor } from '@/contexts/GameContext';
import { ALL_EQUIPMENT, type EquipmentDef } from '@/data/gameData';
import {
  Sword, Shield, Backpack, Heart, Wrench, Search, Stethoscope, Cog,
  ChevronDown, ChevronUp, X, Plus, Pill, Package, Moon
} from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface SurvivorCardProps {
  survivor: Survivor;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

const slotIcons: Record<string, React.ReactNode> = {
  weapon: <Sword className="w-3.5 h-3.5" />,
  armor: <Shield className="w-3.5 h-3.5" />,
  backpack: <Backpack className="w-3.5 h-3.5" />,
};

const slotNames: Record<string, string> = {
  weapon: 'Arme',
  armor: 'Armure',
  backpack: 'Sac',
};

const statLabels: Record<string, string> = {
  combat: 'Combat',
  scavenging: 'Pillage',
  medical: 'Médical',
  engineering: 'Ingénierie',
  health: 'Santé',
  carryCapacity: 'Charge',
};

const TRAIT_FEMININE: Record<string, string> = {
  'Éclaireur':       'Éclaireuse',
  'Ingénieur':       'Ingénieure',
  'Combattant':      'Combattante',
  'Pilleur':         'Pilleuse',
  'Tacticien':       'Tacticienne',
  'Mécanicien':      'Mécanicienne',
  "Tireur d'élite":  "Tireuse d'élite",
};

function traitLabel(trait: string, gender: 'male' | 'female'): string {
  if (gender === 'female') return TRAIT_FEMININE[trait] ?? trait;
  return trait;
}

/* ── Generated survivor portrait ─────────────────────────────────────────── */
const SKIN_TONES  = ['#c8956c', '#a8774c', '#7a5030', '#e0b890', '#b07050'];
const HAIR_COLORS = ['#1a0e05', '#2e1a08', '#8b6330', '#a07840', '#3a2208', '#c8a050'];
const EYE_COLORS  = ['#4a6898', '#5a7850', '#7a5230', '#2e6070', '#6a4028', '#505085'];

function seededInt(seed: number, max: number): number {
  return ((seed * 1664525 + 1013904223) >>> 0) % max;
}

const SurvivorPortrait: React.FC<{ survivor: Survivor; healthPct: number }> = ({ survivor, healthPct }) => {
  let seed = 0;
  for (let i = 0; i < survivor.id.length; i++) {
    seed = (seed * 31 + survivor.id.charCodeAt(i)) & 0x7fffffff;
  }
  const skinTone  = SKIN_TONES[seededInt(seed,      SKIN_TONES.length)];
  const hairColor = HAIR_COLORS[seededInt(seed +  7, HAIR_COLORS.length)];
  const eyeColor  = EYE_COLORS[seededInt(seed  + 11, EYE_COLORS.length)];
  const hairStyle = seededInt(seed + 13, 3);
  const isMale    = survivor.gender === 'male';

  const skinDark = skinTone === SKIN_TONES[2] ? '#4a2818' : '#8a5535';
  const lipColor = skinTone === SKIN_TONES[2] ? '#6a3020' : '#9a5840';

  const frameColor    = healthPct > 60 ? '#3a2e1a' : healthPct > 30 ? '#6a2a10' : '#8a1010';
  const injuryOpacity = healthPct < 30 ? 0.38 : healthPct < 60 ? 0.20 : 0;

  // ── Face geometry — viewBox 100×100, face fills canvas (no body) ──────────
  // Face: cx=50 cy=50 rx=28(M)/25(F) ry=38 → top y=12, bottom y=88
  // Hair inner paths are computed to follow the face oval contour exactly so
  // there is no gap between the hair cap and the forehead skin.
  const frx = isMale ? 28 : 25;
  const lx  = isMale ? 36 : 37;   // left  eye x
  const ex  = isMale ? 64 : 63;   // right eye x
  const ey  = 42;                  // eye y
  const bry = 35;                  // eyebrow y
  const elx = 50 - frx - 4;       // left  ear x
  const erx = 50 + frx + 4;       // right ear x
  const cl  = `scl${seed}`, cr = `scr${seed}`;

  return (
    <svg
      viewBox="0 0 100 100"
      className="w-20 h-20 flex-shrink-0 rounded"
      xmlns="http://www.w3.org/2000/svg"
      style={{ background: '#2c1e10' }}
    >
      <defs>
        <clipPath id={cl}>
          <path d={`M${lx-7.5},${ey} Q${lx},${ey-6.5} ${lx+7.5},${ey} Q${lx+4},${ey+5} ${lx},${ey+5} Q${lx-4},${ey+5} ${lx-7.5},${ey}Z`} />
        </clipPath>
        <clipPath id={cr}>
          <path d={`M${ex-7.5},${ey} Q${ex},${ey-6.5} ${ex+7.5},${ey} Q${ex+4},${ey+5} ${ex},${ey+5} Q${ex-4},${ey+5} ${ex-7.5},${ey}Z`} />
        </clipPath>
      </defs>

      {/* ── Ears (behind face) ── */}
      <ellipse cx={elx} cy="50" rx="4.5" ry="7"   fill={skinTone} />
      <ellipse cx={erx} cy="50" rx="4.5" ry="7"   fill={skinTone} />
      <ellipse cx={elx + 1.5} cy="50" rx="2" ry="4.5" fill={skinDark} opacity="0.28" />
      <ellipse cx={erx - 1.5} cy="50" rx="2" ry="4.5" fill={skinDark} opacity="0.28" />

      {/* ── Face oval ── */}
      <ellipse cx="50" cy="50" rx={frx} ry="38" fill={skinTone} />

      {/* ── Hair ──────────────────────────────────────────────────────────────
           Inner edges follow the face oval contour at each y level so there
           is no gap between hair and skull:
             y=38 → face edge x≈24/76 (M) or 26/74 (F)
             y=28 → face edge x≈27/73 (M) or 30/70 (F)
             y=22 → face edge x≈31/69 (M) or 33/67 (F)
             y=18 → face edge x≈35/65 (M) or 37/63 (F)           ── */}
      {isMale && hairStyle === 0 && <path d="M24,38 Q20,8 50,3 Q80,8 76,38 Q73,28 69,22 Q62,18 50,18 Q38,18 31,22 Q27,28 24,38Z" fill={hairColor} />}
      {isMale && hairStyle === 1 && <path d="M23,40 Q19,7 50,2 Q81,7 77,40 Q74,28 70,22 Q62,18 50,18 Q38,18 30,22 Q26,28 23,40Z" fill={hairColor} />}
      {isMale && hairStyle === 2 && <path d="M23,40 Q18,7 50,2 Q82,7 77,40 Q78,28 72,22 Q64,18 50,19 Q36,18 28,22 Q22,28 23,40Z" fill={hairColor} />}
      {!isMale && hairStyle === 0 && <path d="M26,38 Q22,8 50,3 Q78,8 74,38 Q71,28 67,22 Q60,18 50,18 Q40,18 33,22 Q29,28 26,38Z" fill={hairColor} />}
      {!isMale && hairStyle === 1 && <>
        <path d="M26,38 Q22,7 50,2 Q78,7 74,38 Q71,28 67,22 Q60,18 50,18 Q40,18 33,22 Q29,28 26,38Z" fill={hairColor} />
        <path d="M26,38 Q22,56 24,80 Q28,58 26,38Z" fill={hairColor} />
        <path d="M74,38 Q78,56 76,80 Q72,58 74,38Z" fill={hairColor} />
      </>}
      {!isMale && hairStyle === 2 && <>
        <path d="M25,40 Q21,7 50,2 Q79,7 75,40 Q72,28 67,22 Q60,18 50,18 Q40,18 33,22 Q28,28 25,40Z" fill={hairColor} />
        <path d="M25,40 Q20,58 22,82 Q26,60 25,40Z" fill={hairColor} />
        <path d="M75,40 Q80,58 78,82 Q74,60 75,40Z" fill={hairColor} />
      </>}

      {/* ── Eyebrows ── */}
      <path d={`M${lx-7},${bry+2} Q${lx},${bry} ${lx+6},${bry+2}`}
        stroke={hairColor} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d={`M${ex-6},${bry+2} Q${ex},${bry} ${ex+7},${bry+2}`}
        stroke={hairColor} strokeWidth="2.2" fill="none" strokeLinecap="round" />

      {/* ── Left eye ── */}
      <g clipPath={`url(#${cl})`}>
        <ellipse cx={lx} cy={ey} rx="7.5" ry="5"   fill="#ede8dc" />
        <ellipse cx={lx} cy={ey} rx="4.5" ry="4.5" fill={eyeColor} />
        <circle  cx={lx} cy={ey} r="2.8"            fill="#080604" />
        <circle  cx={lx - 1.5} cy={ey - 1.2} r="1.1" fill="rgba(255,255,255,0.9)" />
      </g>
      <path d={`M${lx-7.5},${ey} Q${lx},${ey-7} ${lx+7.5},${ey}`}
        stroke="#120a04" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d={`M${lx-6},${ey} Q${lx},${ey+4.5} ${lx+6},${ey}`}
        stroke={skinDark} strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.5" />

      {/* ── Right eye ── */}
      <g clipPath={`url(#${cr})`}>
        <ellipse cx={ex} cy={ey} rx="7.5" ry="5"   fill="#ede8dc" />
        <ellipse cx={ex} cy={ey} rx="4.5" ry="4.5" fill={eyeColor} />
        <circle  cx={ex} cy={ey} r="2.8"            fill="#080604" />
        <circle  cx={ex - 1.5} cy={ey - 1.2} r="1.1" fill="rgba(255,255,255,0.9)" />
      </g>
      <path d={`M${ex-7.5},${ey} Q${ex},${ey-7} ${ex+7.5},${ey}`}
        stroke="#120a04" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d={`M${ex-6},${ey} Q${ex},${ey+4.5} ${ex+6},${ey}`}
        stroke={skinDark} strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.5" />

      {/* ── Nose ── */}
      <path d="M47,48 Q46,54 44,61" stroke={skinDark} strokeWidth="1"   fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M53,48 Q54,54 56,61" stroke={skinDark} strokeWidth="1"   fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M44,61 Q40,65 42,67 Q45,65 44,61" fill={skinDark} opacity="0.33" />
      <path d="M56,61 Q60,65 58,67 Q55,65 56,61" fill={skinDark} opacity="0.33" />
      <path d="M43,62 Q50,65 57,62" stroke={skinDark} strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.40" />

      {/* ── Cheek blush (female only) ── */}
      {!isMale && <>
        <ellipse cx="33" cy="55" rx="8" ry="4.5" fill="#c06060" opacity="0.09" />
        <ellipse cx="67" cy="55" rx="8" ry="4.5" fill="#c06060" opacity="0.09" />
      </>}

      {/* ── Mouth ── */}
      <path
        d={isMale ? 'M40,70 Q43,67 50,69 Q57,67 60,70' : 'M41,70 Q44,67 50,69 Q56,67 59,70'}
        stroke={lipColor} strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.9"
      />
      <path
        d={isMale ? 'M40,70 Q50,76 60,70 Q57,78 50,78 Q43,78 40,70Z'
                  : 'M41,70 Q50,75 59,70 Q56,77 50,77 Q44,77 41,70Z'}
        fill={lipColor} opacity="0.42"
      />

      {/* ── Injury overlay ── */}
      {injuryOpacity > 0 && <rect width="100" height="100" fill={`rgba(180,20,20,${injuryOpacity})`} />}

      {/* Frame */}
      <rect x="0.5" y="0.5" width="99" height="99" fill="none" stroke={frameColor} strokeWidth="1.5" />
    </svg>
  );
};

const tierColors = ['', 'text-zinc-400', 'text-green-400', 'text-blue-400', 'text-purple-400', 'text-amber-400'];
const tierBorders = ['', 'border-zinc-600', 'border-green-600', 'border-blue-600', 'border-purple-600', 'border-amber-600'];

const SurvivorCard: React.FC<SurvivorCardProps> = ({ survivor, selectable, selected, onToggleSelect }) => {
  const { state, equipItem, unequipItem, healSurvivor, repairItem } = useGame();
  const [expanded, setExpanded] = useState(false);
  const [equipSlot, setEquipSlot] = useState<'weapon' | 'armor' | 'backpack' | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (survivor.status !== 'resting') return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [survivor.status]);

  const healthPct = (survivor.health / survivor.maxHealth) * 100;
  const healthColor = healthPct > 60 ? 'bg-green-500' : healthPct > 30 ? 'bg-yellow-500' : 'bg-red-500';
  const isOnExpedition = survivor.status === 'expedition';
  const isInjured      = survivor.status === 'injured';
  const isRecycling    = survivor.status === 'recycling';
  const isTraining     = survivor.status === 'training';
  const isResting      = survivor.status === 'resting';
  const isBusy         = isOnExpedition || isRecycling || isTraining;

  const restSecondsLeft = isResting && survivor.restingUntil
    ? Math.max(0, Math.ceil((survivor.restingUntil - now) / 1000))
    : 0;
  const restLabel = restSecondsLeft > 60
    ? `${Math.floor(restSecondsLeft / 60)}m${restSecondsLeft % 60 > 0 ? ` ${restSecondsLeft % 60}s` : ''}`
    : `${restSecondsLeft}s`;

  const durabilityColor = (d: number, max: number) => {
    const pct = d / max;
    return pct > 0.6 ? 'bg-green-500' : pct > 0.3 ? 'bg-yellow-500' : 'bg-red-500';
  };

  const availableItems = equipSlot
    ? state.inventory.filter(item => item.slot === equipSlot)
    : [];

  const healCost = Math.ceil((survivor.maxHealth - survivor.health) * 0.2);
  const canHeal = survivor.health < survivor.maxHealth && !isBusy && (state.resources['medicine'] || 0) >= healCost;

  const getEffectiveSkill = (skill: keyof Survivor['skills']) => {
    let total = survivor.skills[skill];
    for (const eq of Object.values(survivor.equipment)) {
      if (eq && eq.stats[skill]) total += eq.stats[skill]!;
    }
    return total;
  };

  const armorHealthBonus = survivor.equipment.armor?.stats.health || 0;
  const totalCarryCapacity = Object.values(survivor.equipment).reduce(
    (sum, eq) => sum + (eq?.stats.carryCapacity || 0), 0
  );

  return (
    <div className={`bg-zinc-900/60 border rounded-lg transition-all duration-200 ${
      selected          ? 'border-amber-500 shadow-lg shadow-amber-900/20' :
      isOnExpedition    ? 'border-blue-600/40 opacity-70' :
      isRecycling       ? 'border-amber-700/40 opacity-70' :
      isTraining        ? 'border-blue-700/40 opacity-70' :
      isResting         ? 'border-violet-700/40 opacity-80' :
      isInjured         ? 'border-red-600/40' :
      'border-zinc-700/50 hover:border-zinc-600'
    }`}>
      <div
        className={`p-3 flex items-center gap-3 ${selectable && !isBusy && !isResting ? 'cursor-pointer' : ''}`}
        onClick={() => {
          if (selectable && !isBusy && !isInjured && !isResting && onToggleSelect) {
            onToggleSelect();
          } else if (!selectable) {
            setExpanded(!expanded);
          }
        }}
      >
        {selectable && (
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            isBusy || isInjured || isResting
              ? 'border-zinc-700 bg-zinc-800'
              : selected
                ? 'border-amber-500 bg-amber-500'
                : 'border-zinc-600 hover:border-zinc-400'
          }`}>
            {selected && <div className="w-2 h-2 bg-black rounded-sm" />}
          </div>
        )}

        <SurvivorPortrait survivor={survivor} healthPct={healthPct} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-200 text-sm truncate">{survivor.name}</span>
            {isOnExpedition && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-400 border border-blue-700/30">
                EN MISSION
              </span>
            )}
            {isRecycling && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-500 border border-amber-700/30">
                EN TÂCHE
              </span>
            )}
            {isTraining && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-400 border border-blue-700/30">
                ENTRAÎNEMENT
              </span>
            )}
            {isInjured && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-900/40 text-red-400 border border-red-700/30">
                BLESSÉ
              </span>
            )}
            {isResting && (
              <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-900/30 text-violet-400 border border-violet-700/30">
                <Moon className="w-2.5 h-2.5"/>REPOS {restSecondsLeft > 0 && restLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono text-amber-500/80 uppercase">{traitLabel(survivor.trait, survivor.gender)}</span>
            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden max-w-[80px]">
              <div className={`h-full rounded-full transition-all duration-500 ${healthColor}`} style={{ width: `${healthPct}%` }} />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[10px] font-mono text-zinc-500 cursor-help">
                  {Math.round(survivor.health)}/{survivor.maxHealth}
                  {armorHealthBonus > 0 && <span className="text-amber-400 ml-0.5">+{armorHealthBonus}</span>}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[230px] text-xs font-mono leading-relaxed">
                {armorHealthBonus > 0
                  ? `En cas d'attaque, chaque survivant subit entre 5 et 20 dégâts (selon le danger). L'armure équipée absorbe ${Math.floor(armorHealthBonus * 0.3)} pts fixes (${armorHealthBonus} × 30%).`
                  : "En cas d'attaque, chaque survivant subit entre 5 et 20 dégâts selon le niveau de danger. Équipez une armure pour réduire ces dégâts."}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {(['weapon', 'armor', 'backpack'] as const).map(slot => {
            const eq = survivor.equipment[slot];
            const durPct = eq ? (eq.durability / eq.maxDurability) * 100 : 0;
            return (
              <div key={slot} className="flex flex-col items-center gap-0.5">
                <div
                  className={`w-7 h-7 rounded flex items-center justify-center ${
                    eq
                      ? `bg-zinc-800 ${tierColors[eq.tier]} ${tierBorders[eq.tier]} border`
                      : 'bg-zinc-800/50 text-zinc-600 border border-zinc-800'
                  }`}
                  title={eq ? `${eq.name} (T${eq.tier}) — ${eq.durability}/${eq.maxDurability} durabilité` : `${slotNames[slot]} — Vide`}
                >
                  {slotIcons[slot]}
                </div>
                {eq && (
                  <div className="w-7 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full ${durabilityColor(eq.durability, eq.maxDurability)}`} style={{ width: `${durPct}%` }}/>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!selectable && (
          <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="text-zinc-500 hover:text-zinc-300">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {expanded && !selectable && (
        <div className="border-t border-zinc-800 p-3 space-y-3">
          {/* Skills */}
          <div className="grid grid-cols-2 gap-2">
            {([
              { key: 'combat',      label: 'Combat',     icon: <Sword className="w-3 h-3" />,       color: 'text-red-400',
                tooltip: "Détermine la capacité à repousser les attaques. Un combat élevé réduit les blessures et augmente la chance de vaincre les pillards lors d'une expédition." },
              { key: 'scavenging', label: 'Pillage',     icon: <Search className="w-3 h-3" />,      color: 'text-green-400',
                tooltip: "Augmente la quantité et la chance de trouver des ressources. Chaque point apporte +5% de butin supplémentaire lors d'une expédition." },
              { key: 'medical',    label: 'Médical',     icon: <Stethoscope className="w-3 h-3" />, color: 'text-pink-400',
                tooltip: "Améliore les soins sur le terrain et la récupération après blessure. Réduit les séquelles d'une expédition difficile." },
              { key: 'engineering',label: 'Ingénierie',  icon: <Cog className="w-3 h-3" />,         color: 'text-blue-400',
                tooltip: "Facilite l'accès aux zones sécurisées et la récupération de matériaux spéciaux lors des expéditions." },
            ] as const).map(skill => {
              const base = survivor.skills[skill.key];
              const effective = getEffectiveSkill(skill.key);
              const bonus = effective - base;
              return (
                <div key={skill.key} className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 cursor-help">
                        <span className={skill.color}>{skill.icon}</span>
                        <span className="text-xs text-zinc-400 w-16">{skill.label}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[210px] text-xs font-mono">
                      {skill.tooltip}
                    </TooltipContent>
                  </Tooltip>
                  <div className="flex-1 flex items-center gap-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-sm ${
                          i < base ? 'bg-zinc-400' :
                          i < effective ? 'bg-amber-500' :
                          'bg-zinc-800'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-mono text-zinc-300 ml-1">
                      {effective}{bonus > 0 && <span className="text-amber-400">+{bonus}</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Carry capacity */}
          <div className="flex items-center gap-1.5 text-xs font-mono pt-1 border-t border-zinc-800/80">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-help">
                  <Package className="w-3 h-3 text-cyan-400 shrink-0"/>
                  <span className="text-zinc-500 w-16">Charge utile</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[210px] text-xs font-mono">
                Capacité de transport du sac à dos. Permet de rapporter davantage de butin lors des expéditions.
              </TooltipContent>
            </Tooltip>
            {totalCarryCapacity > 0 ? (
              <span className="text-amber-400">+{totalCarryCapacity}</span>
            ) : (
              <span className="text-zinc-600">—</span>
            )}
          </div>

          {/* Equipment Slots */}
          <div className="space-y-1.5">
            <div className="text-xs text-zinc-500 font-mono uppercase">Équipement</div>
            {(['weapon', 'armor', 'backpack'] as const).map(slot => {
              const eq = survivor.equipment[slot];
              return (
                <div key={slot} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded flex items-center justify-center ${
                    eq ? `${tierColors[eq.tier]}` : 'text-zinc-600'
                  } bg-zinc-800`}>
                    {slotIcons[slot]}
                  </div>
                  <div className="flex-1">
                    {eq ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-mono ${tierColors[eq.tier]}`}>{eq.name}</span>
                          <span className="text-[10px] text-zinc-600">T{eq.tier}</span>
                          <span className="text-[10px] text-zinc-500">
                            {Object.entries(eq.stats).filter(([,v]) => v).map(([k,v]) => `${statLabels[k] ?? k}+${v}`).join(' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${durabilityColor(eq.durability, eq.maxDurability)}`}
                              style={{ width: `${(eq.durability / eq.maxDurability) * 100}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-zinc-600">{eq.durability}/{eq.maxDurability}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-600 italic">Vide — {slotNames[slot]}</span>
                    )}
                  </div>
                  {!isBusy && (
                    <div className="flex gap-1">
                      {eq && (() => {
                        const repairCost = eq.tier * 5;
                        const canRepair = eq.durability < eq.maxDurability && (state.resources['scrap'] || 0) >= repairCost;
                        return (
                          <button
                            onClick={() => repairItem(survivor.id, slot)}
                            disabled={!canRepair}
                            className={`text-xs p-1 ${canRepair ? 'text-zinc-400 hover:text-blue-400' : 'text-zinc-700 cursor-not-allowed'}`}
                            title={`Réparer (${repairCost} ferraille)`}
                          >
                            <Wrench className="w-3 h-3" />
                          </button>
                        );
                      })()}
                      {eq && (
                        <button
                          onClick={() => unequipItem(survivor.id, slot)}
                          className="text-xs text-zinc-500 hover:text-red-400 p-1"
                          title="Retirer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => setEquipSlot(equipSlot === slot ? null : slot)}
                        className={`text-xs p-1 ${
                          equipSlot === slot ? 'text-amber-400' : 'text-zinc-500 hover:text-amber-400'
                        }`}
                        title="Équiper"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Equipment selection dropdown */}
          {equipSlot && availableItems.length > 0 && (
            <div className="bg-zinc-800/50 border border-zinc-700 rounded p-2 space-y-1">
              <div className="text-xs text-zinc-400 font-mono mb-1">Choisir {slotNames[equipSlot]}:</div>
              {availableItems.map((item, idx) => (
                <button
                  key={`${item.id}-${idx}`}
                  onClick={() => { equipItem(survivor.id, item); setEquipSlot(null); }}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs font-mono hover:bg-zinc-700 transition-colors flex items-center gap-2 ${tierColors[item.tier]}`}
                >
                  {slotIcons[item.slot]}
                  <span>{item.name}</span>
                  <span className="text-zinc-600 text-[10px]">T{item.tier}</span>
                  <span className="text-zinc-500 text-[10px] ml-auto">
                    {Object.entries(item.stats).filter(([,v]) => v).map(([k,v]) => `${statLabels[k] ?? k}+${v}`).join(' ')}
                  </span>
                </button>
              ))}
            </div>
          )}
          {equipSlot && availableItems.length === 0 && (
            <div className="text-xs text-zinc-600 italic font-mono bg-zinc-800/30 rounded p-2">
              Aucun {slotNames[equipSlot]} disponible dans l'inventaire.
            </div>
          )}

          {/* Heal button */}
          {survivor.health < survivor.maxHealth && !isBusy && (
            <button
              onClick={() => healSurvivor(survivor.id)}
              disabled={!canHeal}
              className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-bold font-mono transition-all ${
                canHeal
                  ? 'bg-pink-600 hover:bg-pink-500 text-white'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
            >
              <Pill className="w-3 h-3" />
              Soigner ({healCost} médicaments)
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SurvivorCard;
