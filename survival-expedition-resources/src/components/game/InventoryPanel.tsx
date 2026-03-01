import React, { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { getInventoryCapacity } from '@/data/gameData';
import { Sword, Shield, Backpack, ChevronDown, ChevronUp, X } from 'lucide-react';
import type { EquipmentDef } from '@/data/gameData';

// ── Visual config per tier ────────────────────────────────────────────────────

const TIER_STYLES: { color: string; accent: string; bg: string; border: string }[] = [
  { color: '',                    accent: '',         bg: '',                   border: '' },
  { color: 'rgba(161,161,170,1)', accent: '#71717a', bg: 'rgba(39,39,42,0.4)', border: 'rgba(113,113,122,0.35)' },
  { color: 'rgba(74,222,128,1)',  accent: '#22c55e', bg: 'rgba(5,46,22,0.4)',  border: 'rgba(34,197,94,0.35)' },
  { color: 'rgba(96,165,250,1)',  accent: '#3b82f6', bg: 'rgba(7,25,82,0.4)', border: 'rgba(59,130,246,0.35)' },
  { color: 'rgba(192,132,252,1)', accent: '#a855f7', bg: 'rgba(46,8,84,0.4)', border: 'rgba(168,85,247,0.35)' },
  { color: 'rgba(251,191,36,1)',  accent: '#f59e0b', bg: 'rgba(54,30,4,0.4)', border: 'rgba(245,158,11,0.35)' },
];

const SLOT_ICONS: Record<string, React.ReactNode> = {
  weapon:   <Sword    className="w-2.5 h-2.5" />,
  armor:    <Shield   className="w-2.5 h-2.5" />,
  backpack: <Backpack className="w-2.5 h-2.5" />,
};

const COLS = 5;

// ── Warehouse icon ────────────────────────────────────────────────────────────

const WarehouseIcon: React.FC = () => (
  <svg viewBox="0 0 20 20" className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="14" width="16" height="2" rx="0.5" />
    <rect x="2" y="8"  width="16" height="2" rx="0.5" />
    <rect x="2" y="2"  width="16" height="2" rx="0.5" />
    <line x1="4"  y1="4" x2="4"  y2="14" />
    <line x1="16" y1="4" x2="16" y2="14" />
  </svg>
);

// ── Build cell array (1 slot per item) ────────────────────────────────────────

function buildCellArray(items: EquipmentDef[], capacity: number): (EquipmentDef | null)[] {
  const cells: (EquipmentDef | null)[] = Array(capacity).fill(null);
  items.forEach((item, i) => { if (i < capacity) cells[i] = item; });
  return cells;
}

// ── Main component ────────────────────────────────────────────────────────────

const InventoryPanel: React.FC = () => {
  const { state } = useGame();
  const [isOpen, setIsOpen] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  const totalItems = state.inventory.length;
  const capacity   = getInventoryCapacity(state.buildings['armory'] || 0);
  const cells      = buildCellArray(state.inventory, capacity);
  const fillPct    = capacity > 0 ? (totalItems / capacity) * 100 : 0;
  const rows       = Math.ceil(capacity / COLS);

  return (
    <div className="select-none">

      {/* ── Trigger button ─────────────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded border transition-colors duration-150"
        style={{
          borderColor: isOpen ? 'rgba(120,80,15,0.5)' : 'rgba(63,63,70,0.6)',
          backgroundColor: isOpen ? 'rgba(12,9,3,0.9)' : 'rgba(9,9,11,0.8)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <WarehouseIcon />
          <div className="text-left">
            <div className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest">Inventaire</div>
            <div className="text-[10px] font-mono text-zinc-600">
              {totalItems === 0 ? 'Vide' : `${totalItems} / ${capacity} emplacements`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-zinc-600">
          {totalItems > 0 && (
            <span className="text-[10px] font-mono tabular-nums" style={{ color: fillPct >= 90 ? '#ef4444' : 'rgba(161,161,170,0.5)' }}>
              {Math.round(fillPct)}%
            </span>
          )}
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* ── Inventory window ───────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="mt-0.5 border rounded overflow-hidden shadow-2xl"
          style={{ borderColor: 'rgba(80,55,15,0.30)', backgroundColor: 'rgba(4,3,1,0.92)' }}
        >

          {/* Title bar */}
          <div
            className="flex items-center justify-between px-3 py-1.5 border-b"
            style={{ backgroundColor: 'rgba(10,8,5,0.85)', borderColor: 'rgba(80,55,15,0.25)' }}
          >
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

          {/* Capacity header */}
          <div
            className="px-4 pt-3 pb-2"
            style={{ backgroundColor: 'rgba(10,8,5,0.85)', borderBottom: '1px solid rgba(60,45,10,0.3)' }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-500/70">
                Entrepôt — Armurerie
              </span>
              <span className="text-xs font-mono text-amber-700/60">
                {totalItems} / {capacity} emplacements
              </span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800/80 rounded-full overflow-hidden border border-zinc-700/30">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${fillPct}%`,
                  background: fillPct >= 90
                    ? 'linear-gradient(90deg, #dc2626, #991b1b)'
                    : fillPct >= 60
                      ? 'linear-gradient(90deg, #d97706, #92400e)'
                      : 'linear-gradient(90deg, #059669, #065f46)',
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-zinc-600 mt-1">
              <span>{capacity - totalItems} libre{capacity - totalItems !== 1 ? 's' : ''}</span>
              <span>Armurerie nv. {state.buildings['armory'] || 0}</span>
            </div>
          </div>

          {/* ── Slot grid ──────────────────────────────────────────────────── */}
          <div className="p-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-600 mb-3 flex items-center gap-2">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(100,70,20,0.4))' }} />
              <span>Vue des emplacements</span>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(100,70,20,0.4), transparent)' }} />
            </div>

            <div
              className="rounded-lg p-3"
              style={{
                backgroundColor: '#070501',
                border: '1px solid rgba(60,45,10,0.5)',
                boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.8)',
              }}
            >
              <div className="space-y-1">
                {Array.from({ length: rows }).map((_, rowIdx) => {
                  const rowStart = rowIdx * COLS;
                  const rowCells = cells.slice(rowStart, rowStart + COLS);

                  return (
                    <div key={rowIdx} className="flex gap-1 items-stretch">
                      {/* Row label */}
                      <div
                        className="flex items-center justify-center text-[9px] font-mono text-amber-900/35 w-5 shrink-0 uppercase tracking-widest"
                        style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
                      >
                        R.{rowIdx + 1}
                      </div>

                      {/* Cells */}
                      {rowCells.map((item, colIdx) => {
                        const cellIdx  = rowStart + colIdx;
                        const style    = item ? TIER_STYLES[item.tier] : null;
                        const isHov    = hovered === cellIdx;
                        const durPct   = item && item.durability != null
                          ? (item.durability / item.maxDurability) * 100
                          : 100;
                        const durColor = durPct > 60 ? '#22c55e' : durPct > 30 ? '#eab308' : '#ef4444';

                        return (
                          <div
                            key={colIdx}
                            className="flex-1 relative flex flex-col items-center justify-center transition-all duration-150 rounded"
                            style={{
                              height: 56,
                              cursor: 'default',
                              backgroundColor: item
                                ? (isHov ? `${style!.accent}30` : style!.bg)
                                : 'rgba(15,12,5,0.8)',
                              border: item
                                ? `1px solid ${isHov ? style!.accent + '70' : style!.border}`
                                : '1px dashed rgba(60,50,20,0.35)',
                            }}
                            onMouseEnter={() => item && setHovered(cellIdx)}
                            onMouseLeave={() => setHovered(null)}
                            title={
                              item
                                ? `${item.name} — T${item.tier} — ${Object.entries(item.stats).filter(([, v]) => v).map(([k, v]) => `${k}+${v}`).join(', ')}`
                                : `Emplacement ${cellIdx + 1} (libre)`
                            }
                          >
                            {/* Empty cell */}
                            {!item && (
                              <span className="text-[9px] font-mono select-none" style={{ color: 'rgba(80,65,25,0.5)' }}>
                                {cellIdx + 1}
                              </span>
                            )}

                            {/* Occupied cell */}
                            {item && (
                              <div className="flex flex-col items-center gap-0.5 px-1 w-full pointer-events-none select-none">
                                {/* Slot type icon + tier */}
                                <div className="flex items-center gap-1" style={{ color: style!.accent, opacity: 0.75 }}>
                                  {SLOT_ICONS[item.slot]}
                                  <span className="text-[8px] font-mono font-bold">T{item.tier}</span>
                                </div>
                                {/* Name */}
                                <span
                                  className="text-[9px] font-mono font-bold leading-tight text-center line-clamp-2"
                                  style={{ color: style!.color, maxWidth: '100%' }}
                                >
                                  {item.name}
                                </span>
                                {/* Durability bar */}
                                {item.durability != null && (
                                  <div className="w-full h-0.5 bg-zinc-800 rounded-full overflow-hidden mt-0.5" style={{ maxWidth: '80%' }}>
                                    <div
                                      className="h-full rounded-full transition-all"
                                      style={{ width: `${durPct}%`, backgroundColor: durColor }}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Pad missing cells in last row */}
                      {rowCells.length < COLS && Array.from({ length: COLS - rowCells.length }).map((_, i) => (
                        <div key={`pad-${i}`} className="flex-1" style={{ height: 56 }} />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            {totalItems === 0 && (
              <p className="text-[10px] font-mono text-zinc-700 text-center mt-3">
                Inventaire vide — lancez des expéditions pour récupérer de l'équipement
              </p>
            )}
          </div>

          {/* Legend */}
          <div
            className="px-3 pb-3 pt-1"
            style={{ borderTop: '1px solid rgba(60,45,10,0.3)' }}
          >
            <div className="flex items-center gap-3 flex-wrap">
              {[1, 2, 3, 4, 5].map(t => (
                <div key={t} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: TIER_STYLES[t].accent, opacity: 0.7 }} />
                  <span className="text-[9px] font-mono" style={{ color: TIER_STYLES[t].accent, opacity: 0.6 }}>
                    T{t}
                  </span>
                </div>
              ))}
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                {[
                  { icon: SLOT_ICONS['weapon'],   label: 'Arme' },
                  { icon: SLOT_ICONS['armor'],    label: 'Armure' },
                  { icon: SLOT_ICONS['backpack'], label: 'Sac' },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-1">
                    <span className="text-zinc-600">{icon}</span>
                    <span className="text-[9px] font-mono text-zinc-600">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPanel;
