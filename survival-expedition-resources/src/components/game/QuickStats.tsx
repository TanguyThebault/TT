import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { BUILDINGS, getMaxSurvivors, getStorageCapacity } from '@/data/gameData';
import {
  Users, Warehouse, Shield, MapPin, Hammer, Heart, Zap
} from 'lucide-react';

const QuickStats: React.FC = () => {
  const { state } = useGame();

  const totalBuildingLevels = Object.values(state.buildings).reduce((sum, lvl) => sum + lvl, 0);
  const maxBuildingLevels = BUILDINGS.length * 5;
  const barracksLevel = state.buildings['barracks'] || 0;
  const storageLevel = state.buildings['storage'] || 0;
  const workshopLevel = state.buildings['workshop'] || 0;

  const stats = [
    {
      icon: <Users className="w-4 h-4" />,
      label: 'Survivants',
      value: `${state.survivors.length}/${getMaxSurvivors(barracksLevel)}`,
      color: 'text-green-400',
    },
    {
      icon: <Warehouse className="w-4 h-4" />,
      label: 'Stockage',
      value: `${getStorageCapacity(storageLevel)}`,
      color: 'text-blue-400',
    },
    {
      icon: <Hammer className="w-4 h-4" />,
      label: 'Atelier',
      value: `Nv.${workshopLevel}`,
      color: 'text-purple-400',
    },
    {
      icon: <Shield className="w-4 h-4" />,
      label: 'Bâtiments',
      value: `${totalBuildingLevels}/${maxBuildingLevels}`,
      color: 'text-amber-400',
    },
    {
      icon: <MapPin className="w-4 h-4" />,
      label: 'Expéditions',
      value: `${state.expeditions.filter(e => !e.completed).length} actives`,
      color: 'text-cyan-400',
    },
    {
      icon: <Heart className="w-4 h-4" />,
      label: 'Blessés',
      value: `${state.survivors.filter(s => s.status === 'injured').length}`,
      color: state.survivors.some(s => s.status === 'injured') ? 'text-red-400' : 'text-zinc-500',
    },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
      {stats.map((stat, i) => (
        <div key={i} className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-2.5 text-center">
          <div className={`${stat.color} flex justify-center mb-1`}>{stat.icon}</div>
          <div className="text-sm font-bold text-zinc-200 font-mono">{stat.value}</div>
          <div className="text-[10px] text-zinc-500 font-mono uppercase">{stat.label}</div>
        </div>
      ))}
    </div>
  );
};

export default QuickStats;
