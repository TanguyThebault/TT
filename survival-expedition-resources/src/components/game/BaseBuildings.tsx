import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { BUILDINGS, getUpgradeCost, RESOURCES } from '@/data/gameData';
import {
  Hammer, Heart, Warehouse, Users, Eye, Radio, Truck, Sprout, Package,
  ArrowUp, Lock, Check
} from 'lucide-react';


const ICON_LEVEL_STYLES = [
  'bg-zinc-800/80 text-zinc-600',          // niveau 0 — éteint
  'bg-amber-950/60 text-amber-700',         // niveau 1
  'bg-amber-900/40 text-amber-500',         // niveau 2
  'bg-amber-800/35 text-amber-400',         // niveau 3
  'bg-amber-700/30 text-amber-300',         // niveau 4
  'bg-amber-600/30 text-amber-200',         // niveau 5 — max
];

const buildingIcons: Record<string, React.ReactNode> = {
  Hammer: <Hammer className="w-5 h-5" />,
  Heart: <Heart className="w-5 h-5" />,
  Warehouse: <Warehouse className="w-5 h-5" />,
  Users: <Users className="w-5 h-5" />,
  Eye: <Eye className="w-5 h-5" />,
  Radio: <Radio className="w-5 h-5" />,
  Car: <Truck className="w-5 h-5" />,
  Sprout: <Sprout className="w-5 h-5" />,
  Package: <Package className="w-5 h-5" />,
};

const BaseBuildings: React.FC = () => {
  const { state, upgradeBuilding } = useGame();

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-amber-500 font-mono uppercase tracking-wider flex items-center gap-2">
        <Warehouse className="w-5 h-5" />
        Base — Bâtiments
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {BUILDINGS.map(building => {
          const level = state.buildings[building.id] || 0;
          const isMaxed = level >= building.maxLevel;
          const cost = isMaxed ? {} : getUpgradeCost(building, level);
          const canAfford = !isMaxed && Object.entries(cost).every(
            ([res, amt]) => (state.resources[res] || 0) >= amt
          );
          const levelGlow = isMaxed
            ? 'shadow-lg shadow-amber-900/25'
            : level >= 3 ? 'shadow-md shadow-amber-950/20' : '';

          return (
            <div
              key={building.id}
              className={`bg-zinc-900/60 border rounded-lg p-4 transition-all duration-300 ${levelGlow} ${
                isMaxed
                  ? 'border-amber-600/40'
                  : canAfford
                    ? 'border-amber-500/50 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-900/20 cursor-pointer'
                    : 'border-zinc-700/50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded transition-all duration-500 ${ICON_LEVEL_STYLES[Math.min(level, ICON_LEVEL_STYLES.length - 1)]} ${isMaxed ? 'wl-glow' : ''}`}>
                    {buildingIcons[building.icon]}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-200 text-sm">{building.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      {Array.from({ length: building.maxLevel }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < level ? 'bg-amber-500' : 'bg-zinc-700'
                          }`}
                        />
                      ))}
                      <span className="text-xs text-zinc-500 ml-1 font-mono">Nv.{level}</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-zinc-400 mb-2 leading-relaxed">{building.description}</p>

              {level > 0 && (
                <div className="text-xs text-amber-400/80 mb-2 font-mono flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {building.benefits[level - 1]}
                </div>
              )}

              {isMaxed ? (
                <div className="flex items-center gap-1 text-xs text-amber-500 font-mono bg-amber-900/20 rounded px-2 py-1.5">
                  <Check className="w-3 h-3" />
                  Niveau Maximum
                </div>
              ) : (
                <div>
                  <div className="text-xs text-zinc-500 mb-1 font-mono">
                    Prochain: {building.benefits[level]}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {Object.entries(cost).map(([res, amt]) => {
                      const resDef = RESOURCES.find(r => r.id === res);
                      const has = (state.resources[res] || 0) >= amt;
                      return (
                        <span
                          key={res}
                          className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                            has ? 'bg-zinc-800 text-zinc-300' : 'bg-red-900/30 text-red-400'
                          }`}
                        >
                          {resDef?.name || res}: {amt}
                        </span>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => canAfford && upgradeBuilding(building.id)}
                    disabled={!canAfford}
                    className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-bold font-mono uppercase tracking-wider transition-all ${
                      canAfford
                        ? 'bg-amber-600 hover:bg-amber-500 text-black'
                        : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? (
                      <>
                        <ArrowUp className="w-3 h-3" />
                        Améliorer
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3" />
                        Ressources insuffisantes
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BaseBuildings;
