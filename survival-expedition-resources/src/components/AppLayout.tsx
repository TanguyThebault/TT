import React, { useState, useEffect } from 'react';
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
import CampLife from './game/CampLife';
import TasksPanel from './game/TasksPanel';
import TradingPanel from './game/TradingPanel';
import GaragePanel from './game/GaragePanel';
import DevPanel, { DEV_EMAIL } from './game/DevPanel';
import ExpeditionResults from './game/ExpeditionResults';

/* ── Film grain overlay (isolated so seed interval doesn't re-render siblings) */
const FilmGrain: React.FC = () => {
  const [seed, setSeed] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setSeed(s => (s >= 99 ? 1 : s + 1)), 120);
    return () => clearInterval(id);
  }, []);
  return (
    <svg
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ width: '100%', height: '100%', opacity: 0.04 }}
    >
      <defs>
        <filter id="wl-grain" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="4"
            seed={seed}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#wl-grain)" fill="white" />
    </svg>
  );
};

/* ── Day / night ambient tint ────────────────────────────────────────────── */
function getDayTint(): { color: string; opacity: number } {
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  if (h >= 20 || h < 5)  return { color: '#0a1840', opacity: 0.10 }; // nuit  : bleu profond
  if (h >= 5  && h < 7)  return { color: '#c04010', opacity: 0.08 }; // aube  : rouge orangé
  if (h >= 7  && h < 9)  return { color: '#d06020', opacity: 0.04 }; // matin : chaud
  if (h >= 17 && h < 20) return { color: '#b84010', opacity: 0.07 }; // crépuscule : orange
  return { color: '#000000', opacity: 0.00 };                          // journée : neutre
}

const DayNightTint: React.FC = () => {
  const [tint, setTint] = useState(getDayTint);
  useEffect(() => {
    const id = setInterval(() => setTint(getDayTint()), 60_000);
    return () => clearInterval(id);
  }, []);
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ backgroundColor: tint.color, opacity: tint.opacity, transition: 'background-color 60s ease, opacity 60s ease' }}
    />
  );
};

const AppLayout: React.FC = () => {
  const { state, user } = useGame();
  const isDevAccount = user?.email === DEV_EMAIL;
  const [activeTab, setActiveTab] = useState<GameTab>('base');

  const activeExpeditions    = state.expeditions.filter(e => !e.completed).length;
  const completedExpeditions = state.expeditions.filter(e => e.completed).length;
  const inactiveSurvivors    = state.survivors.filter(s => s.status === 'available').length;
  const garageUnlocked       = (state.buildings['garage'] || 0) >= 1;
  const pendingRecruits      = (state.pendingRecruits ?? []).length;

  /* ── Loading screen ──────────────────────────────────────────────────────── */
  if (!state.initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#060503' }}>
        {/* Loading background layers */}
        <div className="fixed inset-0 wl-grid opacity-60 pointer-events-none" />
        <div className="fixed inset-0 wl-vignette pointer-events-none" />

        <div className="relative z-10 text-center space-y-4 wl-corner-lg p-10"
          style={{ border: '1px solid rgba(120, 62, 12, 0.35)', backgroundColor: 'rgba(10,8,5,0.85)' }}>
          {/* Hazard stripe top */}
          <div className="absolute top-0 left-0 right-0 h-1 wl-hazard-h" />

          <div className="text-[10px] font-mono tracking-[0.35em] text-amber-700/60 uppercase mb-6">
            ████ CHARGEMENT SYSTÈME ████
          </div>

          {/* Spinner — tactical ring */}
          <div className="relative w-14 h-14 mx-auto">
            <div className="absolute inset-0 border border-amber-700/20 rounded-full" />
            <div className="absolute inset-0 border-t-2 border-amber-500/80 rounded-full animate-spin"
              style={{ boxShadow: '0 0 8px rgba(200, 130, 20, 0.4)' }} />
            <div className="absolute inset-2 border border-amber-900/30 rounded-full" />
          </div>

          <p className="text-amber-600/70 font-mono text-xs tracking-widest uppercase wl-flicker">
            Initialisation du centre de commandement…
          </p>
          <div className="text-[10px] font-mono text-amber-900/50 tracking-[0.2em]">
            SYS::BOOT — v1.0.0 — PROTOCOLE WASTELAND
          </div>

          {/* Hazard stripe bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-1 wl-hazard-h" />
        </div>
      </div>
    );
  }

  /* ── Main layout ─────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen text-zinc-300 relative" style={{ backgroundColor: '#060503' }}>

      {/* ── Atmospheric background layers (fixed, non-interactive) ──────────── */}

      {/* L1 — Military crosshatch grid */}
      <div className="fixed inset-0 z-0 pointer-events-none wl-grid" style={{ opacity: 0.7 }} />

      {/* L2 — Diagonal wear scratches */}
      <div className="fixed inset-0 z-0 pointer-events-none wl-scratched" />

      {/* L3 — Rust stains from corners */}
      <div className="fixed inset-0 z-0 pointer-events-none wl-rust-tl wl-rust-anim" />
      <div className="fixed inset-0 z-0 pointer-events-none wl-rust-br wl-rust-anim"
        style={{ animationDelay: '3s' }} />
      <div className="fixed inset-0 z-0 pointer-events-none wl-rust-bl wl-rust-anim"
        style={{ animationDelay: '1.5s' }} />

      {/* L4 — Horizontal scan lines */}
      <div className="fixed inset-0 z-0 pointer-events-none wl-scanlines" />

      {/* L5 — Edge vignette */}
      <div className="fixed inset-0 z-0 pointer-events-none wl-vignette" />

      {/* L6 — Animated film grain */}
      <FilmGrain />

      {/* L7 — Day / night cycle tint */}
      <DayNightTint />

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="relative z-10">

        {/* Thin hazard stripe at very top */}
        <div className="h-0.5 wl-hazard-h opacity-50" />

        <Header />

        <main className="max-w-[1600px] mx-auto px-4 py-4 space-y-4">

          {/* Resource Bar */}
          <ResourceBar />

          {/* Quick Stats */}
          <QuickStats />

          {/* Active Expeditions */}
          {(activeExpeditions > 0 || completedExpeditions > 0) && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {/* Vertical accent bar */}
                <div className="w-0.5 h-4 bg-blue-500/60" style={{ boxShadow: '0 0 4px rgba(96,165,250,0.5)' }} />
                <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-blue-400/80 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  Expéditions en cours
                  <span className="text-blue-500/60 ml-1 font-bold">
                    [{activeExpeditions + completedExpeditions}]
                  </span>
                </h2>
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(96,165,250,0.25) 0%, transparent 100%)' }} />
              </div>
              <ActiveExpeditions />
            </div>
          )}

          {/* Tab Navigation */}
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            activeExpeditions={activeExpeditions}
            completedExpeditions={completedExpeditions}
            inactiveSurvivors={inactiveSurvivors}
            pendingRecruits={pendingRecruits}
            traderCampDiscovered={state.traderCampDiscovered}
            garageUnlocked={garageUnlocked}
          />

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              {activeTab === 'base'        && <BaseBuildings />}
              {activeTab === 'survivors'   && <SurvivorRoster />}
              {activeTab === 'expeditions' && <ExpeditionMap />}
              {activeTab === 'crafting'    && <CraftingPanel />}
              {activeTab === 'tasks'       && <TasksPanel />}
              {activeTab === 'trade'       && <TradingPanel />}
              {activeTab === 'garage'      && <GaragePanel />}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <InventoryPanel />
              <GameLog />
              <CampLife />
            </div>
          </div>
        </main>

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <footer className="mt-10 relative">
          {/* Hazard stripe accent */}
          <div className="h-px wl-hazard-h opacity-40" />

          <div className="border-t py-3 px-4"
            style={{ borderColor: 'rgba(100, 52, 10, 0.25)', backgroundColor: 'rgba(6,4,2,0.6)' }}>
            <div className="max-w-[1600px] mx-auto flex items-center justify-between">

              <div className="flex items-center gap-4 text-[10px] font-mono tracking-widest">
                {/* Status dot */}
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600/80 wl-flicker"
                    style={{ boxShadow: '0 0 4px rgba(180,100,15,0.6)' }} />
                  <span className="text-amber-800/60 uppercase">SYS ONLINE</span>
                </span>
                <span className="text-amber-900/40">|</span>
                <span className="text-amber-900/50 uppercase">WASTELAND CMD v1.0</span>
                <span className="text-amber-900/40">|</span>
                <span className="text-amber-900/40 uppercase">PROTOCOLE ACTIF</span>
              </div>

              <div className="flex items-center gap-4 text-[10px] font-mono">
                <span className="text-amber-900/35 tracking-wider uppercase">
                  Données sauvegardées localement
                </span>
                <span className="text-amber-900/25">████</span>
              </div>

            </div>
          </div>
        </footer>

      </div>

      {/* Expedition Results Modal */}
      <ExpeditionResults />

      {/* Dev Panel — visible only for the dev account */}
      {isDevAccount && <DevPanel />}
    </div>
  );
};

export default AppLayout;
