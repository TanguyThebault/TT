import React from 'react';
import { useGame } from '@/contexts/GameContext';
import SurvivorCard from './SurvivorCard';
import { Users, Package } from 'lucide-react';
import { getMaxSurvivors } from '@/data/gameData';

const SurvivorRoster: React.FC = () => {
  const { state } = useGame();
  const barracksLevel = state.buildings['barracks'] || 0;
  const maxSurvivors = getMaxSurvivors(barracksLevel);

  const available = state.survivors.filter(s => s.status === 'available').length;
  const onMission = state.survivors.filter(s => s.status === 'expedition').length;
  const injured = state.survivors.filter(s => s.status === 'injured').length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-amber-500 font-mono uppercase tracking-wider flex items-center gap-2">
          <Users className="w-5 h-5" />
          Survivants
        </h2>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-green-400">{available} dispo</span>
          <span className="text-blue-400">{onMission} en mission</span>
          {injured > 0 && <span className="text-red-400">{injured} blessé(s)</span>}
          <span className="text-zinc-500">{state.survivors.length}/{maxSurvivors}</span>
        </div>
      </div>

      {/* Inventory summary */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
        <Package className="w-3.5 h-3.5" />
        <span>Inventaire: {state.inventory.length} objet(s) non équipé(s)</span>
      </div>

      <div className="space-y-2">
        {state.survivors.map(survivor => (
          <SurvivorCard key={survivor.id} survivor={survivor} />
        ))}
      </div>
    </div>
  );
};

export default SurvivorRoster;
