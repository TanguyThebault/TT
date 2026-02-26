import React, { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { getInventoryCapacity } from '@/data/gameData';
import { Sword, Shield, Backpack, ChevronDown, ChevronUp, X } from 'lucide-react';

const slotIcons = {
  weapon:   <Sword className="w-3 h-3" />,
  armor:    <Shield className="w-3 h-3" />,
  backpack: <Backpack className="w-3 h-3" />,
};

const slotLabels: Record<string, string> = {
  weapon:   'ARMES',
  armor:    'ARMURES',
  backpack: 'SACS',
};

const tierColors  = ['', 'text-zinc-400',    'text-green-400',    'text-blue-400',    'text-purple-400',    'text-amber-400'];
const tierBg      = ['', 'bg-zinc-800/60',   'bg-green-950/60',   'bg-blue-950/60',   'bg-purple-950/60',   'bg-amber-950/60'];
const tierBorder  = ['', 'border-zinc-700/50','border-green-700/50','border-blue-700/50','border-purple-700/50','border-amber-600/50'];

const HazardStripe: React.FC = () => (
  <div className="h-2 w-full" style={{
    background: 'repeating-linear-gradient(90deg, #92400e 0px, #92400e 12px, #1c1917 12px, #1c1917 24px)',
  }} />
);

const WarehouseIcon: React.FC = () => (
  <svg viewBox="0 0 20 20" className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="14" width="16" height="2" rx="0.5" />
    <rect x="2" y="8"  width="16" height="2" rx="0.5" />
    <rect x="2" y="2"  width="16" height="2" rx="0.5" />
    <line x1="4"  y1="4" x2="4"  y2="14" />
    <line x1="16" y1="4" x2="16" y2="14" />
  </svg>
);

const EmptyShelves: React.FC = () => (
  <svg viewBox="0 0 40 40" className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" strokeWidth="1">
    <rect x="4" y="30" width="32" height="4" rx="1" />
    <rect x="4" y="18" width="32" height="4" rx="1" />
    <rect x="4" y="6"  width="32" height="4" rx="1" />
    <line x1="7"  y1="10" x2="7"  y2="30" />
    <line x1="33" y1="10" x2="33" y2="30" />
  </svg>
);

const InventoryPanel: React.FC = () => {
  const { state } = useGame();
  const [isOpen, setIsOpen] = useState(false);
  const totalItems = state.inventory.length;
  const CAPACITY = getInventoryCapacity(state.buildings['armory'] || 0);

  const grouped: Record<string, typeof state.inventory> = {};
  state.inventory.forEach(item => {
    if (!grouped[item.slot]) grouped[item.slot] = [];
    grouped[item.slot].push(item);
  });

  return (
    <div className="select-none">
      {/* Warehouse door / trigger */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full rounded border border-zinc-700 hover:border-amber-700/70 bg-zinc-900 overflow-hidden transition-colors duration-150"
      >
        <HazardStripe />
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 flex items-center justify-center rounded bg-zinc-800 border border-zinc-700">
              <WarehouseIcon />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-600 text-[9px] font-bold font-mono text-white flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </div>
            <div className="text-left">
              <div className="text-xs font-bold font-mono text-zinc-200 tracking-widest uppercase">Inventaire</div>
              <div className="text-[10px] font-mono text-zinc-500">
                {totalItems === 0 ? 'Vide' : `${totalItems} / ${CAPACITY} objet${totalItems > 1 ? 's' : ''}`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-500">
            <span className="text-[9px] font-mono uppercase tracking-wider">{isOpen ? 'Fermer' : 'Ouvrir'}</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>
        <HazardStripe />
      </button>

      {/* Warehouse window */}
      {isOpen && (
        <div className="mt-0.5 border border-zinc-700 bg-zinc-950 rounded overflow-hidden shadow-2xl">

          {/* Title bar */}
          <div className="flex items-center justify-between bg-zinc-900 border-b border-zinc-800 px-3 py-1.5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                Inventaire — Équipements
              </span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-zinc-600 hover:text-zinc-300 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {totalItems === 0 ? (
            <div className="py-8 flex flex-col items-center gap-2">
              <EmptyShelves />
              <p className="text-xs font-mono text-zinc-600">Inventaire vide</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {Object.entries(grouped).map(([slot, items]) => (
                <div key={slot}>
                  {/* Shelf label */}
                  <div className="flex items-center gap-1.5 px-0.5 mb-1">
                    <span className="text-zinc-600">{slotIcons[slot as keyof typeof slotIcons]}</span>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{slotLabels[slot]}</span>
                    <div className="flex-1 border-t border-zinc-800" />
                    <span className="text-[10px] font-mono text-zinc-600">{items.length}</span>
                  </div>

                  {/* Shelf unit */}
                  <div className="rounded bg-zinc-900 border border-zinc-800 overflow-hidden">
                    <div className="h-1 bg-zinc-700" />
                    <div className="p-2 flex flex-wrap gap-1">
                      {items.map((item, idx) => (
                        <div
                          key={`${item.id}-${idx}`}
                          className={`text-[11px] font-mono px-2 py-1.5 rounded border cursor-default ${tierBg[item.tier]} ${tierBorder[item.tier]} ${tierColors[item.tier]}`}
                          title={Object.entries(item.stats).filter(([, v]) => v).map(([k, v]) => `${k}+${v}`).join(' ')}
                        >
                          <div className="leading-tight whitespace-nowrap">{item.name}</div>
                          <div className="text-[9px] text-zinc-600 leading-none mt-0.5">T{item.tier}</div>
                        </div>
                      ))}
                    </div>
                    <div className="h-1.5 bg-zinc-700/70" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Capacity footer */}
          <div className="border-t border-zinc-800 bg-zinc-900/60 px-3 py-2 flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">Capacité</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${totalItems / CAPACITY > 0.8 ? 'bg-red-600' : 'bg-amber-600'}`}
                  style={{ width: `${Math.min((totalItems / CAPACITY) * 100, 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-zinc-500">{totalItems}/{CAPACITY}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPanel;
