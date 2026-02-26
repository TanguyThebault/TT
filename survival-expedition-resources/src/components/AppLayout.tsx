import React, { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import Header from './game/Header';
import ResourceBar from './game/ResourceBar';
import QuickStats from './game/QuickStats';
import TabNavigation, { type GameTab } from './game/TabNavigation';
import BaseBuildings from './game/BaseBuildings';
import SurvivorRoster from './game/SurvivorRoster';
import ExpeditionLauncher from './game/ExpeditionLauncher';
import ActiveExpeditions from './game/ActiveExpeditions';
import CraftingPanel from './game/CraftingPanel';
import ExpeditionMap from './game/ExpeditionMap';
import InventoryPanel from './game/InventoryPanel';
import GameLog from './game/GameLog';
import ExpeditionResults from './game/ExpeditionResults';

const AppLayout: React.FC = () => {
  const { state } = useGame();
  const [activeTab, setActiveTab] = useState<GameTab>('base');

  const activeExpeditions = state.expeditions.filter(e => !e.completed).length;
  const completedExpeditions = state.expeditions.filter(e => e.completed).length;

  if (!state.initialized) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 font-mono text-sm">Chargement du centre de commandement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 z-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
        backgroundSize: '32px 32px',
      }} />

      <div className="relative z-10">
        <Header />

        <main className="max-w-[1600px] mx-auto px-4 py-4 space-y-4">
          {/* Resource Bar */}
          <ResourceBar />

          {/* Quick Stats */}
          <QuickStats />

          {/* Active Expeditions (always visible) */}
          {(activeExpeditions > 0 || completedExpeditions > 0) && (
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-blue-400 font-mono uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Expéditions en Cours ({activeExpeditions + completedExpeditions})
              </h2>
              <ActiveExpeditions />
            </div>
          )}

          {/* Tab Navigation */}
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            activeExpeditions={activeExpeditions}
            completedExpeditions={completedExpeditions}
          />

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              {activeTab === 'base' && <BaseBuildings />}
              {activeTab === 'survivors' && <SurvivorRoster />}
              {activeTab === 'expeditions' && <ExpeditionMap />}
              {activeTab === 'crafting' && <CraftingPanel />}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <InventoryPanel />
              <GameLog />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-900 mt-8">
          <div className="max-w-[1600px] mx-auto px-4 py-4 flex items-center justify-between text-xs text-zinc-700 font-mono">
            <span>WASTELAND CMD v1.0</span>
            <span>Données sauvegardées localement</span>
          </div>
        </footer>
      </div>

      {/* Expedition Results Modal */}
      <ExpeditionResults />
    </div>
  );
};

export default AppLayout;
