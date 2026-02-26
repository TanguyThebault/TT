import React, { useState, useEffect } from 'react';
import { Recycle, User, X, Clock, Wrench, ChevronRight, AlertTriangle } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import type { RecycleTask, Survivor } from '@/contexts/GameContext';
import {
  RESOURCES,
  getRecycleMinEngineering,
  getRecycleYield,
  getRecycleDuration,
  type EquipmentDef,
} from '@/data/gameData';

/* ── helpers ─────────────────────────────────────────────────────────────── */

function getEffectiveEngineering(survivor: Survivor): number {
  let total = survivor.skills.engineering;
  for (const eq of Object.values(survivor.equipment)) {
    if (eq?.stats.engineering) total += eq.stats.engineering;
  }
  return total;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s < 10 ? '0' : ''}${s}s` : `${s}s`;
}

const RESOURCE_LABELS: Record<string, string> = {
  scrap: 'Ferraille', materials: 'Matériaux', electronics: 'Électronique',
  fuel: 'Carburant', medicine: 'Médicaments', food: 'Nourriture',
};

const RESOURCE_COLORS: Record<string, string> = {
  scrap: 'text-zinc-300', materials: 'text-purple-300', electronics: 'text-blue-300',
  fuel: 'text-amber-300', medicine: 'text-pink-300', food: 'text-green-300',
};

const TIER_LABELS: Record<number, string> = { 1: 'T1', 2: 'T2', 3: 'T3', 4: 'T4', 5: 'T5' };
const TIER_COLORS: Record<number, string> = {
  1: 'text-zinc-400 border-zinc-600', 2: 'text-green-400 border-green-700',
  3: 'text-blue-400 border-blue-700', 4: 'text-purple-400 border-purple-700',
  5: 'text-amber-400 border-amber-700',
};

/* ── Active task card ────────────────────────────────────────────────────── */

interface ActiveTaskCardProps { task: RecycleTask; now: number; }

const ActiveTaskCard: React.FC<ActiveTaskCardProps> = ({ task, now }) => {
  const { state, cancelRecycle } = useGame();
  const survivor = state.survivors.find(s => s.id === task.survivorId);
  const elapsed  = (now - task.startTime) / 1000;
  const remaining = Math.max(0, task.duration - elapsed);
  const progress  = Math.min(1, elapsed / task.duration);
  const yields    = getRecycleYield(task.item, task.engineeringLevel);

  return (
    <div className="relative wl-corner p-3 space-y-2"
      style={{ border: '1px solid rgba(120,62,12,0.35)', backgroundColor: 'rgba(12,9,5,0.7)' }}>

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Recycle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-xs font-mono text-zinc-200 truncate">{task.item.name}</span>
          <span className={`text-[10px] font-mono border px-1 rounded shrink-0 ${TIER_COLORS[task.item.tier] || 'text-zinc-400 border-zinc-600'}`}>
            {TIER_LABELS[task.item.tier] || `T${task.item.tier}`}
          </span>
        </div>
        <button
          onClick={() => cancelRecycle(task.id)}
          className="text-zinc-600 hover:text-red-400 transition-colors shrink-0"
          title="Annuler le recyclage"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Survivor */}
      <div className="flex items-center gap-1.5">
        <User className="w-3 h-3 text-zinc-500 shrink-0" />
        <span className="text-[11px] font-mono text-zinc-400">
          {survivor?.name ?? 'Survivant inconnu'}
        </span>
        <span className="text-[10px] font-mono text-zinc-600 ml-1">
          Ing. {task.engineeringLevel}
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Clock className="w-3 h-3 text-zinc-600" />
          <span className="text-[10px] font-mono text-zinc-500">
            {formatDuration(remaining)} restant
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(60,40,10,0.4)' }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${progress * 100}%`,
              background: 'linear-gradient(90deg, rgba(180,100,15,0.7) 0%, rgba(220,140,30,0.9) 100%)',
              boxShadow: '0 0 6px rgba(200,130,20,0.4)',
            }}
          />
        </div>
      </div>

      {/* Expected yield */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {Object.entries(yields).map(([res, qty]) => (
          <span key={res} className={`text-[10px] font-mono ${RESOURCE_COLORS[res] ?? 'text-zinc-400'}`}>
            +{qty} {RESOURCE_LABELS[res] ?? res}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ── Main panel ──────────────────────────────────────────────────────────── */

const TasksPanel: React.FC = () => {
  const { state, startRecycle } = useGame();
  const [now, setNow] = useState(Date.now());
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [selectedSurvivorId, setSelectedSurvivorId] = useState<string | null>(null);

  /* Live timer */
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  /* Reset selections when inventory/survivors change */
  useEffect(() => {
    setSelectedItemIndex(null);
    setSelectedSurvivorId(null);
  }, [state.recyclingTasks.length]);

  const selectedItem: EquipmentDef | null =
    selectedItemIndex !== null ? (state.inventory[selectedItemIndex] ?? null) : null;

  const minEngForSelected = selectedItem ? getRecycleMinEngineering(selectedItem.tier) : 0;

  /* Survivors available for the selected item */
  const eligibleSurvivors = selectedItem
    ? state.survivors.filter(s =>
        s.status === 'available' && getEffectiveEngineering(s) >= minEngForSelected
      )
    : [];

  const ineligibleSurvivors = selectedItem
    ? state.survivors.filter(s =>
        s.status === 'available' && getEffectiveEngineering(s) < minEngForSelected
      )
    : [];

  const selectedSurvivor: Survivor | null =
    selectedSurvivorId ? (state.survivors.find(s => s.id === selectedSurvivorId) ?? null) : null;

  const previewYield =
    selectedItem && selectedSurvivor
      ? getRecycleYield(selectedItem, getEffectiveEngineering(selectedSurvivor))
      : null;

  const canLaunch = selectedItemIndex !== null && selectedSurvivorId !== null;

  function handleLaunch() {
    if (!canLaunch || selectedItemIndex === null || selectedSurvivorId === null) return;
    startRecycle(selectedSurvivorId, selectedItemIndex);
    setSelectedItemIndex(null);
    setSelectedSurvivorId(null);
  }

  /* Panel header helper */
  const SectionHeader = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-3 mb-3">
      <div className="w-0.5 h-4 bg-amber-600/60" style={{ boxShadow: '0 0 4px rgba(180,100,15,0.5)' }} />
      <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-500/80">{children}</span>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(180,100,15,0.2) 0%, transparent 100%)' }} />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Panel header ─────────────────────────────────────────────────── */}
      <div className="relative wl-corner-lg overflow-hidden"
        style={{ border: '1px solid rgba(120,62,12,0.3)', backgroundColor: 'rgba(8,6,3,0.8)' }}>
        <div className="absolute top-0 left-0 right-0 h-0.5 wl-hazard-h opacity-40" />
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center border border-amber-700/30"
              style={{ backgroundColor: 'rgba(120,62,12,0.2)' }}>
              <Recycle className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold text-amber-400/90 uppercase tracking-wider">
                Tâches de Base
              </h2>
              <p className="text-[11px] font-mono text-zinc-600 tracking-wide">
                Affectez des survivants à des activités de soutien
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recyclage section ─────────────────────────────────────────────── */}
      <div className="relative wl-corner-lg overflow-hidden"
        style={{ border: '1px solid rgba(120,62,12,0.25)', backgroundColor: 'rgba(8,6,3,0.75)' }}>
        <div className="p-4 space-y-4">

          {/* Section title */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-mono font-bold text-amber-400/80 uppercase tracking-wider">
                Recyclage des Équipements
              </h3>
            </div>
            <p className="text-[11px] font-mono text-zinc-600 leading-relaxed ml-6">
              Démantèle un objet de l'inventaire pour récupérer des ressources.
              Le rendement dépend du niveau d'ingénierie du survivant affecté.
            </p>
            <div className="ml-6 mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
              {[1, 2, 3, 4, 5].map(t => (
                <span key={t} className={`text-[10px] font-mono ${TIER_COLORS[t]?.split(' ')[0] ?? 'text-zinc-500'}`}>
                  T{t} → Ing. {getRecycleMinEngineering(t)} min
                </span>
              ))}
            </div>
          </div>

          {/* Active tasks */}
          {state.recyclingTasks.length > 0 && (
            <div className="space-y-2">
              <SectionHeader>En cours [{state.recyclingTasks.length}]</SectionHeader>
              {state.recyclingTasks.map(task => (
                <ActiveTaskCard key={task.id} task={task} now={now} />
              ))}
            </div>
          )}

          {/* New task form */}
          <div>
            <SectionHeader>Nouvelle tâche</SectionHeader>

            {/* Step 1: pick item */}
            <div className="space-y-1.5 mb-4">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">
                1 · Objet à recycler
              </p>

              {state.inventory.length === 0 ? (
                <p className="text-[11px] font-mono text-zinc-700 italic">
                  L'inventaire est vide.
                </p>
              ) : (
                <div className="space-y-1 max-h-44 overflow-y-auto pr-1"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(120,62,12,0.4) transparent' }}>
                  {state.inventory.map((item, idx) => {
                    const isSelected = selectedItemIndex === idx;
                    const isInRecycling = state.recyclingTasks.some(t => t.item.id === item.id);
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedItemIndex(isSelected ? null : idx);
                          setSelectedSurvivorId(null);
                        }}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all ${
                          isSelected
                            ? 'bg-amber-600/15 border border-amber-600/40'
                            : 'border border-transparent hover:border-zinc-700 hover:bg-zinc-900/40'
                        }`}
                      >
                        <span className={`text-[10px] font-mono border px-1 rounded shrink-0 ${TIER_COLORS[item.tier] || 'text-zinc-400 border-zinc-600'}`}>
                          {TIER_LABELS[item.tier] || `T${item.tier}`}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-300 truncate flex-1">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-600 shrink-0 capitalize">
                          {item.slot === 'weapon' ? 'Arme' : item.slot === 'armor' ? 'Armure' : 'Sac'}
                        </span>
                        {isSelected && <ChevronRight className="w-3 h-3 text-amber-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: pick survivor (only when item selected) */}
            {selectedItem && (
              <div className="space-y-1.5 mb-4">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">
                  2 · Survivant — Ing. {minEngForSelected} minimum
                </p>

                {eligibleSurvivors.length === 0 && ineligibleSurvivors.length === 0 && (
                  <p className="text-[11px] font-mono text-zinc-700 italic">
                    Aucun survivant disponible.
                  </p>
                )}

                {eligibleSurvivors.length === 0 && ineligibleSurvivors.length > 0 && (
                  <div className="flex items-start gap-2 px-2 py-2 rounded border border-red-900/30"
                    style={{ backgroundColor: 'rgba(30,5,5,0.5)' }}>
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500/70 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-mono text-red-400/70">
                      Aucun survivant n'a le niveau d'ingénierie requis ({minEngForSelected}) pour recycler cet objet.
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  {eligibleSurvivors.map(s => {
                    const eng = getEffectiveEngineering(s);
                    const isSelected = selectedSurvivorId === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSurvivorId(isSelected ? null : s.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all ${
                          isSelected
                            ? 'bg-amber-600/15 border border-amber-600/40'
                            : 'border border-transparent hover:border-zinc-700 hover:bg-zinc-900/40'
                        }`}
                      >
                        <User className="w-3 h-3 text-zinc-500 shrink-0" />
                        <span className="text-[11px] font-mono text-zinc-300 flex-1 truncate">{s.name}</span>
                        <span className="text-[10px] font-mono text-zinc-500 shrink-0">{s.trait}</span>
                        <span className="text-[10px] font-mono text-blue-400/80 shrink-0">Ing. {eng}</span>
                        {isSelected && <ChevronRight className="w-3 h-3 text-amber-500 shrink-0" />}
                      </button>
                    );
                  })}

                  {/* Ineligible survivors (greyed out) */}
                  {ineligibleSurvivors.map(s => {
                    const eng = getEffectiveEngineering(s);
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded opacity-40 cursor-not-allowed"
                        title={`Ingénierie ${eng}/${minEngForSelected} — niveau insuffisant`}
                      >
                        <User className="w-3 h-3 text-zinc-600 shrink-0" />
                        <span className="text-[11px] font-mono text-zinc-600 flex-1 truncate">{s.name}</span>
                        <span className="text-[10px] font-mono text-zinc-600 shrink-0">{s.trait}</span>
                        <span className="text-[10px] font-mono text-red-600/70 shrink-0">Ing. {eng}/{minEngForSelected}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: preview & launch */}
            {selectedItem && selectedSurvivor && previewYield && (
              <div className="space-y-3">
                {/* Yield + duration preview */}
                <div className="px-3 py-2 rounded space-y-1"
                  style={{ border: '1px solid rgba(120,62,12,0.3)', backgroundColor: 'rgba(12,9,4,0.6)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Rendement estimé</span>
                    <span className="text-[10px] font-mono text-zinc-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(getRecycleDuration(selectedItem.tier))}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    {Object.entries(previewYield).map(([res, qty]) => (
                      <span key={res} className={`text-xs font-mono font-semibold ${RESOURCE_COLORS[res] ?? 'text-zinc-300'}`}>
                        +{qty} {RESOURCE_LABELS[res] ?? res}
                      </span>
                    ))}
                    {Object.keys(previewYield).length === 0 && (
                      <span className="text-[11px] font-mono text-zinc-700 italic">Aucun rendu (recette inconnue)</span>
                    )}
                  </div>
                </div>

                {/* Launch button */}
                <button
                  onClick={handleLaunch}
                  className="w-full py-2 text-xs font-mono font-bold uppercase tracking-wider rounded transition-all
                    text-amber-300 border border-amber-700/50 hover:border-amber-500/70 hover:text-amber-200"
                  style={{ backgroundColor: 'rgba(120,62,12,0.25)' }}
                >
                  Lancer le recyclage
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default TasksPanel;
