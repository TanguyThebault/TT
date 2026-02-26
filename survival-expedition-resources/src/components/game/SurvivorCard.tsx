import React, { useState } from 'react';
import { useGame, type Survivor } from '@/contexts/GameContext';
import { ALL_EQUIPMENT, type EquipmentDef } from '@/data/gameData';
import {
  Sword, Shield, Backpack, Heart, Wrench, Search, Stethoscope, Cog,
  ChevronDown, ChevronUp, X, Plus, Pill
} from 'lucide-react';

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

const tierColors = ['', 'text-zinc-400', 'text-green-400', 'text-blue-400', 'text-purple-400', 'text-amber-400'];
const tierBorders = ['', 'border-zinc-600', 'border-green-600', 'border-blue-600', 'border-purple-600', 'border-amber-600'];

const SurvivorCard: React.FC<SurvivorCardProps> = ({ survivor, selectable, selected, onToggleSelect }) => {
  const { state, equipItem, unequipItem, healSurvivor } = useGame();
  const [expanded, setExpanded] = useState(false);
  const [equipSlot, setEquipSlot] = useState<'weapon' | 'armor' | 'backpack' | null>(null);

  const healthPct = (survivor.health / survivor.maxHealth) * 100;
  const healthColor = healthPct > 60 ? 'bg-green-500' : healthPct > 30 ? 'bg-yellow-500' : 'bg-red-500';
  const isOnExpedition = survivor.status === 'expedition';
  const isInjured = survivor.status === 'injured';

  const availableItems = equipSlot
    ? state.inventory.filter(item => item.slot === equipSlot)
    : [];

  const healCost = Math.ceil((survivor.maxHealth - survivor.health) * 0.2);
  const canHeal = survivor.health < survivor.maxHealth && !isOnExpedition && (state.resources['medicine'] || 0) >= healCost;

  const getEffectiveSkill = (skill: keyof Survivor['skills']) => {
    let total = survivor.skills[skill];
    for (const eq of Object.values(survivor.equipment)) {
      if (eq && eq.stats[skill]) total += eq.stats[skill]!;
    }
    return total;
  };

  return (
    <div className={`bg-zinc-900/60 border rounded-lg transition-all duration-200 ${
      selected ? 'border-amber-500 shadow-lg shadow-amber-900/20' :
      isOnExpedition ? 'border-blue-600/40 opacity-70' :
      isInjured ? 'border-red-600/40' :
      'border-zinc-700/50 hover:border-zinc-600'
    }`}>
      <div
        className={`p-3 flex items-center gap-3 ${selectable && !isOnExpedition ? 'cursor-pointer' : ''}`}
        onClick={() => {
          if (selectable && !isOnExpedition && !isInjured && onToggleSelect) {
            onToggleSelect();
          } else if (!selectable) {
            setExpanded(!expanded);
          }
        }}
      >
        {selectable && (
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            isOnExpedition || isInjured
              ? 'border-zinc-700 bg-zinc-800'
              : selected
                ? 'border-amber-500 bg-amber-500'
                : 'border-zinc-600 hover:border-zinc-400'
          }`}>
            {selected && <div className="w-2 h-2 bg-black rounded-sm" />}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-200 text-sm truncate">{survivor.name}</span>
            {isOnExpedition && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-400 border border-blue-700/30">
                EN MISSION
              </span>
            )}
            {isInjured && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-900/40 text-red-400 border border-red-700/30">
                BLESSÉ
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono text-amber-500/80 uppercase">{survivor.trait}</span>
            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden max-w-[80px]">
              <div className={`h-full rounded-full transition-all duration-500 ${healthColor}`} style={{ width: `${healthPct}%` }} />
            </div>
            <span className="text-[10px] font-mono text-zinc-500">{Math.round(survivor.health)}/{survivor.maxHealth}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {(['weapon', 'armor', 'backpack'] as const).map(slot => {
            const eq = survivor.equipment[slot];
            return (
              <div
                key={slot}
                className={`w-7 h-7 rounded flex items-center justify-center ${
                  eq
                    ? `bg-zinc-800 ${tierColors[eq.tier]} ${tierBorders[eq.tier]} border`
                    : 'bg-zinc-800/50 text-zinc-600 border border-zinc-800'
                }`}
                title={eq ? `${eq.name} (T${eq.tier})` : `${slotNames[slot]} — Vide`}
              >
                {slotIcons[slot]}
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
              { key: 'combat', label: 'Combat', icon: <Sword className="w-3 h-3" />, color: 'text-red-400' },
              { key: 'scavenging', label: 'Pillage', icon: <Search className="w-3 h-3" />, color: 'text-green-400' },
              { key: 'medical', label: 'Médical', icon: <Stethoscope className="w-3 h-3" />, color: 'text-pink-400' },
              { key: 'engineering', label: 'Ingénierie', icon: <Cog className="w-3 h-3" />, color: 'text-blue-400' },
            ] as const).map(skill => {
              const base = survivor.skills[skill.key];
              const effective = getEffectiveSkill(skill.key);
              const bonus = effective - base;
              return (
                <div key={skill.key} className="flex items-center gap-2">
                  <span className={`${skill.color}`}>{skill.icon}</span>
                  <span className="text-xs text-zinc-400 w-16">{skill.label}</span>
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
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono ${tierColors[eq.tier]}`}>{eq.name}</span>
                        <span className="text-[10px] text-zinc-600">T{eq.tier}</span>
                        <span className="text-[10px] text-zinc-500">
                          {Object.entries(eq.stats).filter(([,v]) => v).map(([k,v]) => `${k}+${v}`).join(' ')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-600 italic">Vide — {slotNames[slot]}</span>
                    )}
                  </div>
                  {!isOnExpedition && (
                    <div className="flex gap-1">
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
                    {Object.entries(item.stats).filter(([,v]) => v).map(([k,v]) => `${k}+${v}`).join(' ')}
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
          {survivor.health < survivor.maxHealth && !isOnExpedition && (
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
