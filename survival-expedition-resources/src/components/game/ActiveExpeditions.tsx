import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { ZONES } from '@/data/gameData';
import ExpeditionTimer from './ExpeditionTimer';
import {
  MapPin, Users, AlertTriangle, Eye, Package
} from 'lucide-react';

const dangerLabels = ['', 'Faible', 'Modéré', 'Élevé', 'Très Élevé', 'Extrême'];
const dangerColors = ['', 'text-green-400', 'text-yellow-400', 'text-orange-400', 'text-red-400', 'text-red-500'];

const ActiveExpeditions: React.FC = () => {
  const { state, viewResults } = useGame();

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
        const zone = ZONES.find(z => z.id === exp.zoneId);
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
                <span className="text-sm font-bold text-amber-400 font-mono">{zone?.name || 'Zone inconnue'}</span>
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
        return (
          <div key={exp.id} className="bg-zinc-900/60 border border-blue-700/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-sm font-bold text-zinc-200 font-mono">{zone?.name || 'Zone inconnue'}</span>
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
        );
      })}
    </div>
  );
};

export default ActiveExpeditions;
