import React from 'react';
import {
  Warehouse, Users, MapPin, Hammer, ClipboardList, ArrowLeftRight, Car, BookOpen,
} from 'lucide-react';

export type GameTab = 'base' | 'survivors' | 'expeditions' | 'crafting' | 'tasks' | 'lore' | 'trade' | 'garage';

interface TabNavigationProps {
  activeTab: GameTab;
  onTabChange: (tab: GameTab) => void;
  activeExpeditions: number;
  completedExpeditions: number;
  inactiveSurvivors: number;
  pendingRecruits?: number;
  traderCampDiscovered?: boolean;
  garageUnlocked?: boolean;
}

const BASE_TABS = [
  { id: 'base' as GameTab,        label: 'Base',        icon: <Warehouse className="w-4 h-4" /> },
  { id: 'survivors' as GameTab,   label: 'Survivants',  icon: <Users className="w-4 h-4" /> },
  { id: 'expeditions' as GameTab, label: 'Expéditions', icon: <MapPin className="w-4 h-4" /> },
  { id: 'crafting' as GameTab,    label: 'Atelier',     icon: <Hammer className="w-4 h-4" /> },
];

const TRADE_TAB   = { id: 'trade'  as GameTab, label: 'Troc',    icon: <ArrowLeftRight className="w-4 h-4" /> };
const GARAGE_TAB  = { id: 'garage' as GameTab, label: 'Garage',  icon: <Car className="w-4 h-4" /> };
const TASKS_TAB   = { id: 'tasks'  as GameTab, label: 'Tâches',  icon: <ClipboardList className="w-4 h-4" /> };
const LORE_TAB    = { id: 'lore'   as GameTab, label: 'Histoire', icon: <BookOpen className="w-4 h-4" /> };

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab, onTabChange, activeExpeditions, completedExpeditions, inactiveSurvivors,
  pendingRecruits = 0, traderCampDiscovered, garageUnlocked,
}) => {
  const tabs = [
    ...BASE_TABS,
    ...(garageUnlocked       ? [GARAGE_TAB] : []),
    ...(traderCampDiscovered ? [TRADE_TAB]  : []),
    TASKS_TAB,
    LORE_TAB,
  ];
  return (
    <div className="flex gap-1 bg-zinc-900/60 border border-zinc-800 rounded-lg p-1">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;

        const showExpeditionBadge = tab.id === 'expeditions' && (activeExpeditions > 0 || completedExpeditions > 0);
        const showSurvivorBadge  = tab.id === 'survivors' && inactiveSurvivors > 0 && pendingRecruits === 0;
        const showRecruitBadge   = tab.id === 'survivors' && pendingRecruits > 0;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-xs font-mono font-bold uppercase tracking-wider transition-all relative ${
              isActive
                ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-transparent'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>

            {showExpeditionBadge && (
              <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                completedExpeditions > 0
                  ? 'bg-amber-500 text-black animate-pulse'
                  : 'bg-blue-600 text-white'
              }`}>
                {completedExpeditions > 0 ? completedExpeditions : activeExpeditions}
              </span>
            )}

            {showSurvivorBadge && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-zinc-600 text-zinc-200">
                {inactiveSurvivors}
              </span>
            )}

            {showRecruitBadge && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-green-500 text-black animate-pulse">
                {pendingRecruits}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TabNavigation;
