import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { ZONES, RESOURCES } from '@/data/gameData';
import {
  X, Package, AlertTriangle, Heart, Sword, Shield, Backpack,
  Check, ChevronRight
} from 'lucide-react';

const tierColors = ['', 'text-zinc-400', 'text-green-400', 'text-blue-400', 'text-purple-400', 'text-amber-400'];

const slotIcons: Record<string, React.ReactNode> = {
  weapon: <Sword className="w-3.5 h-3.5" />,
  armor: <Shield className="w-3.5 h-3.5" />,
  backpack: <Backpack className="w-3.5 h-3.5" />,
};

const ExpeditionResults: React.FC = () => {
  const { state, collectResults } = useGame();
  const expedition = state.pendingResults;

  if (!expedition || !expedition.results) return null;

  const zone = ZONES.find(z => z.id === expedition.zoneId);
  const results = expedition.results;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-amber-500 font-mono">Rapport d'Expédition</h2>
            <p className="text-xs text-zinc-400 font-mono">{zone?.name || 'Zone inconnue'}</p>
          </div>
          <button
            onClick={collectResults}
            className="text-zinc-500 hover:text-zinc-300 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Events */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-zinc-300 font-mono flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Événements
            </h3>
            {results.events.map((event, i) => (
              <div key={i} className="flex items-start gap-2 text-xs font-mono">
                <ChevronRight className="w-3 h-3 text-zinc-600 mt-0.5 flex-shrink-0" />
                <span className={`${
                  event.includes('attaqué') ? 'text-red-400' :
                  event.includes('repoussé') || event.includes('Bonus') ? 'text-green-400' :
                  event.includes('vide') ? 'text-yellow-400' :
                  'text-zinc-300'
                }`}>
                  {event}
                </span>
              </div>
            ))}
          </div>

          {/* Resources */}
          {Object.keys(results.resources).length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-zinc-300 font-mono flex items-center gap-1.5">
                <Package className="w-4 h-4 text-green-500" />
                Ressources Récoltées
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(results.resources).map(([resId, amount]) => {
                  const resDef = RESOURCES.find(r => r.id === resId);
                  return (
                    <div key={resId} className="flex items-center gap-2 bg-zinc-800/50 rounded px-3 py-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: resDef?.color || '#888' }} />
                      <span className="text-xs text-zinc-400 font-mono">{resDef?.name || resId}</span>
                      <span className="text-sm font-bold text-green-400 font-mono ml-auto">+{amount}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Equipment */}
          {results.equipment.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-zinc-300 font-mono flex items-center gap-1.5">
                <Sword className="w-4 h-4 text-purple-500" />
                Équipement Trouvé
              </h3>
              <div className="space-y-1">
                {results.equipment.map((eq, i) => (
                  <div key={i} className="flex items-center gap-2 bg-zinc-800/50 rounded px-3 py-2">
                    <span className={tierColors[eq.tier]}>{slotIcons[eq.slot]}</span>
                    <span className={`text-xs font-mono ${tierColors[eq.tier]}`}>{eq.name}</span>
                    <span className="text-[10px] text-zinc-600 font-mono">T{eq.tier}</span>
                    <span className="text-[10px] text-zinc-500 font-mono ml-auto">
                      {Object.entries(eq.stats).filter(([,v]) => v).map(([k,v]) => `${k}+${v}`).join(' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Survivor Damage */}
          {Object.keys(results.survivorDamage).length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-zinc-300 font-mono flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-red-500" />
                Dégâts Subis
              </h3>
              <div className="space-y-1">
                {Object.entries(results.survivorDamage).map(([survivorId, damage]) => {
                  const survivor = state.survivors.find(s => s.id === survivorId);
                  return (
                    <div key={survivorId} className="flex items-center gap-2 bg-red-900/20 border border-red-900/30 rounded px-3 py-2">
                      <span className="text-xs text-zinc-300 font-mono">{survivor?.name || 'Inconnu'}</span>
                      <span className="text-xs font-bold text-red-400 font-mono ml-auto">-{Math.round(damage)} PV</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 p-4">
          <button
            onClick={collectResults}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold font-mono text-sm uppercase tracking-wider transition-colors"
          >
            <Check className="w-4 h-4" />
            Collecter et Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpeditionResults;
