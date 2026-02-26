import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { Package, Sword, Shield, Backpack } from 'lucide-react';

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

const InventoryPanel: React.FC = () => {
  const { state } = useGame();

  if (state.inventory.length === 0) {
    return (
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 text-center">
        <Package className="w-6 h-6 text-zinc-700 mx-auto mb-1" />
        <p className="text-xs text-zinc-600 font-mono">Inventaire vide</p>
      </div>
    );
  }

  // Group by slot
  const grouped: Record<string, typeof state.inventory> = {};
  state.inventory.forEach(item => {
    if (!grouped[item.slot]) grouped[item.slot] = [];
    grouped[item.slot].push(item);
  });

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-zinc-400 font-mono uppercase tracking-wider flex items-center gap-2">
        <Package className="w-4 h-4" />
        Inventaire ({state.inventory.length})
      </h3>
      {Object.entries(grouped).map(([slot, items]) => (
        <div key={slot} className="space-y-1">
          <div className="text-[10px] text-zinc-600 font-mono uppercase flex items-center gap-1">
            {slotIcons[slot]} {slotNames[slot]}s ({items.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {items.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className={`text-xs font-mono px-2 py-1 rounded bg-zinc-800/50 border border-zinc-700/50 ${tierColors[item.tier]}`}
                title={Object.entries(item.stats).filter(([,v]) => v).map(([k,v]) => `${k}+${v}`).join(' ')}
              >
                {item.name} <span className="text-zinc-600">T{item.tier}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default InventoryPanel;
