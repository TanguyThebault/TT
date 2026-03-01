import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { BUILDINGS, getMaxSurvivors, getStorageCapacity, FOOD_PER_SURVIVOR_PER_HOUR, FARM_FOOD_PER_MINUTE } from '@/data/gameData';
import {
  Users, Warehouse, Shield, MapPin, Hammer, Heart, Apple
} from 'lucide-react';

const QuickStats: React.FC = () => {
  const { state } = useGame();

  const totalBuildingLevels = Object.values(state.buildings).reduce((sum, lvl) => sum + lvl, 0);
  const maxBuildingLevels = BUILDINGS.length * 5;
  const barracksLevel = state.buildings['barracks'] || 0;
  const storageLevel = state.buildings['storage'] || 0;
  const workshopLevel = state.buildings['workshop'] || 0;
  const farmLevel = state.buildings['farm'] || 0;

  // Food consumption rate
  const nonExpeditionSurvivors = state.survivors.filter(s => s.status !== 'expedition').length;
  const consumptionPerHour = nonExpeditionSurvivors * FOOD_PER_SURVIVOR_PER_HOUR;
  const farmPerHour = FARM_FOOD_PER_MINUTE[farmLevel] * 60;
  const netFoodPerHour = farmPerHour - consumptionPerHour;
  const foodStock = state.resources['food'] || 0;
  const hoursOfFood = netFoodPerHour < 0
    ? foodStock / Math.abs(netFoodPerHour)
    : Infinity;
  const foodCritical = hoursOfFood < 2 && netFoodPerHour < 0;

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
    <div className="space-y-2">
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {stats.map((stat, i) => (
          <div key={i} className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-2.5 text-center">
            <div className={`${stat.color} flex justify-center mb-1`}>{stat.icon}</div>
            <div className="text-sm font-bold text-zinc-200 font-mono">{stat.value}</div>
            <div className="text-[10px] text-zinc-500 font-mono uppercase">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Indicateur nourriture */}
      <div className={`flex items-center gap-3 px-3 py-1.5 rounded-lg border text-xs font-mono ${
        foodCritical
          ? 'bg-red-950/30 border-red-800/50 text-red-400'
          : 'bg-zinc-900/30 border-zinc-800/50 text-zinc-500'
      }`}>
        <Apple className={`w-3.5 h-3.5 shrink-0 ${foodCritical ? 'text-red-400' : 'text-green-500/60'}`} />
        <span>
          {netFoodPerHour >= 0
            ? <span className="text-green-400">+{netFoodPerHour.toFixed(1)} nourriture/h</span>
            : <span className={foodCritical ? 'text-red-400 font-bold' : 'text-orange-400'}>{netFoodPerHour.toFixed(1)} nourriture/h</span>
          }
        </span>
        {netFoodPerHour < 0 && (
          <span className={foodCritical ? 'text-red-300 font-bold' : 'text-zinc-400'}>
            · réserve : {hoursOfFood === Infinity ? '∞' : `~${hoursOfFood.toFixed(1)}h`}
          </span>
        )}
        {netFoodPerHour < 0 && foodCritical && (
          <span className="text-red-300 font-bold animate-pulse">⚠ FAMINE IMMINENTE</span>
        )}
      </div>
    </div>
  );
};

export default QuickStats;
