import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { ALL_EQUIPMENT, CRAFT_RECIPES, RESOURCES } from '@/data/gameData';
import { Hammer, Sword, Shield, Backpack, Lock, Plus } from 'lucide-react';

const slotIcons: Record<string, React.ReactNode> = {
  weapon: <Sword className="w-3.5 h-3.5" />,
  armor: <Shield className="w-3.5 h-3.5" />,
  backpack: <Backpack className="w-3.5 h-3.5" />,
};

const tierColors = ['', 'text-zinc-400', 'text-green-400', 'text-blue-400', 'text-purple-400', 'text-amber-400'];
const tierBg = ['', 'border-zinc-700', 'border-green-700/40', 'border-blue-700/40', 'border-purple-700/40', 'border-amber-700/40'];

const CraftingPanel: React.FC = () => {
  const { state, craftItem } = useGame();
  const workshopLevel = state.buildings['workshop'] || 0;

  if (workshopLevel === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-amber-500 font-mono uppercase tracking-wider flex items-center gap-2">
          <Hammer className="w-5 h-5" />
          Fabrication
        </h2>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-6 text-center">
          <Lock className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-sm text-zinc-500 font-mono">Construisez l'Atelier pour débloquer la fabrication</p>
        </div>
      </div>
    );
  }

  const craftableItems = ALL_EQUIPMENT.filter(eq => {
    const recipe = CRAFT_RECIPES[eq.id];
    return recipe && eq.tier <= workshopLevel;
  });

  const groupedByTier: Record<number, typeof craftableItems> = {};
  craftableItems.forEach(item => {
    if (!groupedByTier[item.tier]) groupedByTier[item.tier] = [];
    groupedByTier[item.tier].push(item);
  });

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-amber-500 font-mono uppercase tracking-wider flex items-center gap-2">
        <Hammer className="w-5 h-5" />
        Fabrication
        <span className="text-xs text-zinc-500 font-normal">(Atelier Nv.{workshopLevel})</span>
      </h2>

      {Object.entries(groupedByTier).sort(([a], [b]) => Number(a) - Number(b)).map(([tier, items]) => (
        <div key={tier} className="space-y-2">
          <h3 className={`text-xs font-mono uppercase tracking-wider ${tierColors[Number(tier)]}`}>
            Tier {tier}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {items.map(item => {
              const recipe = CRAFT_RECIPES[item.id];
              const canAfford = Object.entries(recipe).every(
                ([res, amt]) => (state.resources[res] || 0) >= amt
              );

              return (
                <div
                  key={item.id}
                  className={`bg-zinc-900/60 border ${tierBg[item.tier]} rounded-lg p-3`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={tierColors[item.tier]}>{slotIcons[item.slot]}</span>
                    <span className={`text-sm font-mono font-bold ${tierColors[item.tier]}`}>{item.name}</span>
                    <span className="text-[10px] text-zinc-600 font-mono">T{item.tier}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono mb-2">
                    {Object.entries(item.stats).filter(([,v]) => v).map(([k,v]) => `${k} +${v}`).join(' | ')}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {Object.entries(recipe).map(([res, amt]) => {
                      const resDef = RESOURCES.find(r => r.id === res);
                      const has = (state.resources[res] || 0) >= amt;
                      return (
                        <span
                          key={res}
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            has ? 'bg-zinc-800 text-zinc-300' : 'bg-red-900/30 text-red-400'
                          }`}
                        >
                          {resDef?.name || res}: {amt}
                        </span>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => canAfford && craftItem(item.id)}
                    disabled={!canAfford}
                    className={`w-full flex items-center justify-center gap-1 py-1 rounded text-xs font-bold font-mono transition-all ${
                      canAfford
                        ? 'bg-amber-600 hover:bg-amber-500 text-black'
                        : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                    Fabriquer
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CraftingPanel;
