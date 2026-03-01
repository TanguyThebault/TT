import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { ZONES } from '@/data/gameData';
import { TILE_BY_ID } from '@/data/tileMap';
import ExpeditionTimer from './ExpeditionTimer';
import {
  MapPin, Users, AlertTriangle, Zap
} from 'lucide-react';

const dangerLabels = ['', 'Faible', 'Modéré', 'Élevé', 'Très Élevé', 'Extrême'];
const dangerColors = ['', 'text-green-400', 'text-yellow-400', 'text-orange-400', 'text-red-400', 'text-red-500'];

const ActiveExpeditions: React.FC = () => {
  const { state, viewResults, resolveExpeditionEvent } = useGame();

  const activeExps = state.expeditions.filter(e => !e.completed);
  const completedExps = state.expeditions.filter(e => e.completed);

  if (activeExps.length === 0 && completedExps.length === 0) {
    return (
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-6 text-center">
        <MapPin className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
        <p className="text-sm text-zinc-500 font-mono">Aucune expédition en cours</p>
        <p className="text-xs text-zinc-600 mt-1">Lancez une expédition depuis le panneau ci-dessous</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {completedExps.map(exp => {
        const zone = ZONES.find(z => z.id === exp.zoneId)
          ?? (TILE_BY_ID.has(exp.zoneId) ? { name: TILE_BY_ID.get(exp.zoneId)!.category } : null);
        const survivors = state.survivors.filter(s => exp.survivorIds.includes(s.id));
        return (
          <div
            key={exp.id}
            onClick={() => viewResults(exp)}
            className="bg-zinc-900/60 border border-amber-600/40 rounded-lg p-3 cursor-pointer hover:border-amber-500 hover:shadow-lg hover:shadow-amber-900/20 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-sm font-bold text-amber-400 font-mono">{(zone as any)?.name || 'Zone inconnue'}</span>
              </div>
              <span className="text-xs font-mono text-amber-400 animate-pulse font-bold">CLIQUER POUR RÉSULTATS</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {survivors.length} survivant(s)</span>
            </div>
          </div>
        );
      })}

      {activeExps.map(exp => {
        const zone = ZONES.find(z => z.id === exp.zoneId);
        const survivors = state.survivors.filter(s => exp.survivorIds.includes(s.id));
        const hasPendingEvent = exp.pendingEvent && exp.resolvedEventChoice === undefined;

        return (
          <div key={exp.id} className="space-y-2">
            <div className={`bg-zinc-900/60 border rounded-lg p-3 ${hasPendingEvent ? 'border-amber-500/60' : 'border-blue-700/30'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${hasPendingEvent ? 'bg-amber-400 animate-ping' : 'bg-blue-500 animate-pulse'}`} />
                  <span className="text-sm font-bold text-zinc-200 font-mono">{zone?.name || 'Zone inconnue'}</span>
                  {hasPendingEvent && (
                    <span className="text-xs font-mono text-amber-400 font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3" /> ÉVÉNEMENT
                    </span>
                  )}
                </div>
                {zone && (
                  <span className={`text-xs font-mono flex items-center gap-1 ${dangerColors[zone.dangerLevel]}`}>
                    <AlertTriangle className="w-3 h-3" />
                    {dangerLabels[zone.dangerLevel]}
                  </span>
                )}
              </div>
              <ExpeditionTimer startTime={exp.startTime} duration={exp.duration} />
              <div className="flex items-center gap-3 mt-2 text-xs text-zinc-400 font-mono">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {survivors.map(s => s.name.split(' ')[0]).join(', ')}</span>
              </div>
            </div>

            {hasPendingEvent && exp.pendingEvent && (
              <div className="bg-amber-950/30 border border-amber-600/50 rounded-lg p-3 animate-pulse-slow">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-sm font-bold text-amber-400 font-mono">{exp.pendingEvent.title}</span>
                </div>
                <p className="text-xs text-zinc-400 font-mono mb-3">{exp.pendingEvent.description}</p>
                <div className="grid grid-cols-2 gap-2">
                  {exp.pendingEvent.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => resolveExpeditionEvent(exp.id, idx as 0 | 1)}
                      className={`text-left p-2 rounded border text-xs font-mono transition-all hover:scale-[1.02] ${
                        idx === 0
                          ? 'bg-blue-950/40 border-blue-700/50 hover:border-blue-500 text-blue-300'
                          : 'bg-red-950/40 border-red-800/50 hover:border-red-600 text-red-300'
                      }`}
                    >
                      <div className="font-bold mb-0.5">{opt.label}</div>
                      <div className="text-zinc-500">{opt.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {exp.pendingEvent && exp.resolvedEventChoice !== undefined && (
              <div className="bg-zinc-900/40 border border-zinc-700/40 rounded px-3 py-1.5 text-xs font-mono text-zinc-500 flex items-center gap-2">
                <Zap className="w-3 h-3 text-zinc-600" />
                Décision prise : <span className="text-zinc-400">{exp.pendingEvent.options[exp.resolvedEventChoice].label}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ActiveExpeditions;
