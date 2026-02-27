import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FlaskConical } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { RESOURCES } from '@/data/gameData';

// ── Dev account identifier (no password stored — auth is handled by Supabase) ─
export const DEV_EMAIL = 'tanguy.thebault.45@orange.fr';

const QUICK_VALUES = [0, 10, 50, 100, 500, 999];

const DevPanel: React.FC = () => {
  const { state, dispatch } = useGame();
  const [open, setOpen] = useState(false);

  const setResource = (resourceId: string, value: number) => {
    dispatch({ type: 'DEV_SET_RESOURCE', resourceId, value });
  };

  const fillAll  = () => RESOURCES.forEach(r => setResource(r.id, 999));
  const emptyAll = () => RESOURCES.forEach(r => setResource(r.id, 0));

  return (
    <div
      className="fixed bottom-4 right-4 z-50 font-mono select-none"
      style={{ minWidth: 260 }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-mono font-bold uppercase tracking-widest transition-all w-full justify-between"
        style={{
          backgroundColor: 'rgba(30,10,40,0.95)',
          borderColor: 'rgba(168,85,247,0.5)',
          color: '#c084fc',
          boxShadow: open ? '0 0 12px rgba(168,85,247,0.3)' : '0 0 6px rgba(168,85,247,0.15)',
        }}
      >
        <span className="flex items-center gap-1.5">
          <FlaskConical className="w-3.5 h-3.5" />
          Dev Mode
        </span>
        <span className="text-[10px] opacity-60 flex items-center gap-1">
          {open ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </span>
      </button>

      {/* Panel */}
      {open && (
        <div
          className="mt-1 rounded border p-3 space-y-2"
          style={{
            backgroundColor: 'rgba(15,5,25,0.97)',
            borderColor: 'rgba(168,85,247,0.35)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.8), 0 0 16px rgba(168,85,247,0.12)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: 'rgba(168,85,247,0.5)' }}>
              ░ Ressources de test ░
            </span>
            <div className="flex gap-1">
              <button
                onClick={fillAll}
                className="text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wider transition-colors"
                style={{ borderColor: 'rgba(168,85,247,0.3)', color: '#a855f7' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Remplir
              </button>
              <button
                onClick={emptyAll}
                className="text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wider transition-colors"
                style={{ borderColor: 'rgba(168,85,247,0.3)', color: '#a855f7' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Vider
              </button>
            </div>
          </div>

          {/* Resource rows */}
          {RESOURCES.map(resource => {
            const current = state.resources[resource.id] ?? 0;
            return (
              <div key={resource.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: resource.color }}>
                    {resource.name}
                  </span>
                  <span className="text-[10px]" style={{ color: 'rgba(168,85,247,0.6)' }}>
                    {current}
                  </span>
                </div>
                <div className="flex gap-1">
                  {/* Number input */}
                  <input
                    type="number"
                    min={0}
                    value={current}
                    onChange={e => setResource(resource.id, Number(e.target.value))}
                    className="w-16 text-center text-[10px] rounded border px-1 py-0.5 outline-none"
                    style={{
                      backgroundColor: 'rgba(30,10,45,0.8)',
                      borderColor: 'rgba(168,85,247,0.25)',
                      color: resource.color,
                    }}
                  />
                  {/* Quick-set buttons */}
                  <div className="flex gap-0.5 flex-1">
                    {QUICK_VALUES.map(v => (
                      <button
                        key={v}
                        onClick={() => setResource(resource.id, v)}
                        className="flex-1 text-[9px] rounded transition-colors"
                        style={{
                          backgroundColor: current === v
                            ? 'rgba(168,85,247,0.25)'
                            : 'rgba(168,85,247,0.05)',
                          borderWidth: 1,
                          borderStyle: 'solid',
                          borderColor: current === v
                            ? 'rgba(168,85,247,0.5)'
                            : 'rgba(168,85,247,0.15)',
                          color: current === v ? '#c084fc' : 'rgba(168,85,247,0.45)',
                        }}
                      >
                        {v >= 1000 ? `${v / 1000}k` : v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Footer */}
          <div
            className="text-[9px] text-center pt-1 border-t tracking-[0.2em] uppercase"
            style={{ borderColor: 'rgba(168,85,247,0.15)', color: 'rgba(168,85,247,0.25)' }}
          >
            DEV — modifications non sauvegardées en cloud
          </div>
        </div>
      )}
    </div>
  );
};

export default DevPanel;
