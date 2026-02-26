import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { RESOURCES } from '@/data/gameData';
import { Apple, Wrench, Pill, Flame, Cpu, Package } from 'lucide-react';

import { getStorageCapacity } from '@/data/gameData';

const iconMap: Record<string, React.ReactNode> = {
  Apple: <Apple className="w-4 h-4" />,
  Wrench: <Wrench className="w-4 h-4" />,
  Pill: <Pill className="w-4 h-4" />,
  Fuel: <Flame className="w-4 h-4" />,
  Cpu: <Cpu className="w-4 h-4" />,
  Boxes: <Package className="w-4 h-4" />,
};


const ResourceBar: React.FC = () => {
  const { state } = useGame();
  const storageLevel = state.buildings['storage'] || 0;
  const cap = getStorageCapacity(storageLevel);

  return (
    <div className="flex flex-wrap gap-2 md:gap-4 p-3 bg-zinc-900/80 border border-zinc-700/50 rounded-lg backdrop-blur-sm">
      {RESOURCES.map(res => {
        const amount = state.resources[res.id] || 0;
        const pct = Math.min(100, (amount / cap) * 100);
        return (
          <div key={res.id} className="flex items-center gap-2 min-w-[120px] group relative">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-zinc-800 border border-zinc-700" style={{ color: res.color }}>
              {iconMap[res.icon]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider">{res.name}</span>
                <span className="text-sm font-bold font-mono text-zinc-200">{amount}</span>
              </div>
              <div className="w-full h-1 bg-zinc-800 rounded-full mt-0.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: res.color }}
                />
              </div>
            </div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-600 rounded px-2 py-0.5 text-xs text-zinc-300 font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
              {amount} / {cap}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ResourceBar;
