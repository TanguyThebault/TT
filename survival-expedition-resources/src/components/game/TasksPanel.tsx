import React, { useState, useEffect } from 'react';
import { Recycle, User, X, Clock, Wrench, ChevronRight, AlertTriangle, Dumbbell, Lock } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import type { RecycleTask, TrainingTask, Survivor } from '@/contexts/GameContext';
import {
  RESOURCES, BUILDINGS,
  getRecycleMinEngineering, getRecycleYield, getRecycleDuration,
  TRAINING_DURATIONS, TRAINING_BUILDING_REQ, TRAINING_STAT_LABELS, getTrainingBuildingLevel,
  type TrainableStat, type EquipmentDef,
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
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
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
  3: 'text-blue-400 border-blue-700',  4: 'text-purple-400 border-purple-700',
  5: 'text-amber-400 border-amber-700',
};
const STAT_COLORS: Record<TrainableStat, string> = {
  combat: 'text-red-400', medical: 'text-pink-400', engineering: 'text-blue-400',
};

const TRAINABLE_STATS: TrainableStat[] = ['combat', 'medical', 'engineering'];

/* ── shared section header ───────────────────────────────────────────────── */

const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-3 mb-3">
    <div className="w-0.5 h-4 bg-amber-600/60" style={{ boxShadow: '0 0 4px rgba(180,100,15,0.5)' }} />
    <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-500/80">{children}</span>
    <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(180,100,15,0.2) 0%, transparent 100%)' }} />
  </div>
);

/* ── shared progress bar card ────────────────────────────────────────────── */

interface ProgressBarProps { progress: number; }
const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => (
  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(60,40,10,0.4)' }}>
    <div className="h-full rounded-full transition-all duration-1000"
      style={{ width: `${progress * 100}%`, background: 'linear-gradient(90deg,rgba(180,100,15,0.7),rgba(220,140,30,0.9))', boxShadow: '0 0 6px rgba(200,130,20,0.4)' }} />
  </div>
);

/* ── Recycle active task card ────────────────────────────────────────────── */

const RecycleTaskCard: React.FC<{ task: RecycleTask; now: number }> = ({ task, now }) => {
  const { state, cancelRecycle } = useGame();
  const survivor  = state.survivors.find(s => s.id === task.survivorId);
  const elapsed   = (now - task.startTime) / 1000;
  const remaining = Math.max(0, task.duration - elapsed);
  const progress  = Math.min(1, elapsed / task.duration);
  const yields    = getRecycleYield(task.item, task.engineeringLevel);

  return (
    <div className="relative wl-corner p-3 space-y-2"
      style={{ border: '1px solid rgba(120,62,12,0.35)', backgroundColor: 'rgba(12,9,5,0.7)' }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Recycle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-xs font-mono text-zinc-200 truncate">{task.item.name}</span>
          <span className={`text-[10px] font-mono border px-1 rounded shrink-0 ${TIER_COLORS[task.item.tier] || 'text-zinc-400 border-zinc-600'}`}>
            {TIER_LABELS[task.item.tier] || `T${task.item.tier}`}
          </span>
        </div>
        <button onClick={() => cancelRecycle(task.id)} className="text-zinc-600 hover:text-red-400 transition-colors shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <User className="w-3 h-3 text-zinc-500 shrink-0" />
        <span className="text-[11px] font-mono text-zinc-400">{survivor?.name ?? '—'}</span>
        <span className="text-[10px] font-mono text-zinc-600 ml-1">Ing. {task.engineeringLevel}</span>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <Clock className="w-3 h-3 text-zinc-600" />
          <span className="text-[10px] font-mono text-zinc-500">{formatDuration(remaining)} restant</span>
        </div>
        <ProgressBar progress={progress} />
      </div>
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

/* ── Training active task card ───────────────────────────────────────────── */

const TrainingTaskCard: React.FC<{ task: TrainingTask; now: number }> = ({ task, now }) => {
  const { state, cancelTraining } = useGame();
  const survivor  = state.survivors.find(s => s.id === task.survivorId);
  const elapsed   = (now - task.startTime) / 1000;
  const remaining = Math.max(0, task.duration - elapsed);
  const progress  = Math.min(1, elapsed / task.duration);

  return (
    <div className="relative wl-corner p-3 space-y-2"
      style={{ border: '1px solid rgba(30,60,120,0.35)', backgroundColor: 'rgba(5,9,20,0.7)' }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Dumbbell className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className={`text-xs font-mono font-semibold ${STAT_COLORS[task.stat]}`}>
            {TRAINING_STAT_LABELS[task.stat]}
          </span>
          <span className="text-[10px] font-mono text-zinc-600 border border-zinc-700 px-1 rounded">
            nv.{task.level}/3
          </span>
        </div>
        <button onClick={() => cancelTraining(task.id)} className="text-zinc-600 hover:text-red-400 transition-colors shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <User className="w-3 h-3 text-zinc-500 shrink-0" />
        <span className="text-[11px] font-mono text-zinc-400">{survivor?.name ?? '—'}</span>
        <span className={`text-[10px] font-mono ml-1 ${STAT_COLORS[task.stat]}`}>
          {task.stat === 'combat' ? survivor?.skills.combat
            : task.stat === 'medical' ? survivor?.skills.medical
            : survivor?.skills.engineering} → +1
        </span>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <Clock className="w-3 h-3 text-zinc-600" />
          <span className="text-[10px] font-mono text-zinc-500">{formatDuration(remaining)} restant</span>
        </div>
        <ProgressBar progress={progress} />
      </div>
    </div>
  );
};

/* ── Main panel ──────────────────────────────────────────────────────────── */

const TasksPanel: React.FC = () => {
  const { state, startRecycle, startTraining } = useGame();
  const [now, setNow] = useState(Date.now());

  // Recycle form state
  const [selectedItemIndex, setSelectedItemIndex]     = useState<number | null>(null);
  const [selectedRecycleSurv, setSelectedRecycleSurv] = useState<string | null>(null);

  // Training form state
  const [selectedTrainSurv, setSelectedTrainSurv] = useState<string | null>(null);
  const [selectedStat, setSelectedStat]           = useState<TrainableStat | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Reset recycle form when tasks change
  useEffect(() => {
    setSelectedItemIndex(null);
    setSelectedRecycleSurv(null);
  }, [state.recyclingTasks.length]);

  // Reset training form when tasks change
  useEffect(() => {
    setSelectedTrainSurv(null);
    setSelectedStat(null);
  }, [state.trainingTasks.length]);

  /* ── Recycle helpers ── */
  const selectedItem: EquipmentDef | null =
    selectedItemIndex !== null ? (state.inventory[selectedItemIndex] ?? null) : null;
  const minEngForSelected = selectedItem ? getRecycleMinEngineering(selectedItem.tier) : 0;
  const eligibleSurvivors = selectedItem
    ? state.survivors.filter(s => s.status === 'available' && getEffectiveEngineering(s) >= minEngForSelected)
    : [];
  const ineligibleSurvivors = selectedItem
    ? state.survivors.filter(s => s.status === 'available' && getEffectiveEngineering(s) < minEngForSelected)
    : [];
  const recycleSurvivor = selectedRecycleSurv
    ? state.survivors.find(s => s.id === selectedRecycleSurv) ?? null : null;
  const previewYield = selectedItem && recycleSurvivor
    ? getRecycleYield(selectedItem, getEffectiveEngineering(recycleSurvivor)) : null;

  function handleLaunchRecycle() {
    if (selectedItemIndex === null || !selectedRecycleSurv) return;
    startRecycle(selectedRecycleSurv, selectedItemIndex);
  }

  /* ── Training helpers ── */
  const availableForTraining = state.survivors.filter(s => s.status === 'available');
  const trainSurvivor = selectedTrainSurv
    ? state.survivors.find(s => s.id === selectedTrainSurv) ?? null : null;

  function getStatTrainInfo(s: Survivor, stat: TrainableStat) {
    const count       = s.trainingCounts?.[stat] ?? 0;
    const nextLevel   = count + 1;
    const buildingId  = TRAINING_BUILDING_REQ[stat];
    const reqBldLevel = count < 3 ? getTrainingBuildingLevel(nextLevel) : 0;
    const curBldLevel = state.buildings[buildingId] || 0;
    const bldName     = BUILDINGS.find(b => b.id === buildingId)?.name ?? buildingId;
    const isMaxed     = count >= 3;
    const isLocked    = !isMaxed && curBldLevel < reqBldLevel;
    const isTrainingNow = state.trainingTasks.some(t => t.survivorId === s.id && t.stat === stat);
    return { count, nextLevel, reqBldLevel, curBldLevel, bldName, isMaxed, isLocked, isTrainingNow };
  }

  function handleLaunchTraining() {
    if (!selectedTrainSurv || !selectedStat) return;
    startTraining(selectedTrainSurv, selectedStat);
  }

  const canLaunchTraining = selectedTrainSurv && selectedStat && (() => {
    if (!trainSurvivor) return false;
    const info = getStatTrainInfo(trainSurvivor, selectedStat);
    return !info.isMaxed && !info.isLocked && !info.isTrainingNow;
  })();

  return (
    <div className="space-y-6">

      {/* ── Panel header ─────────────────────────────────────────────────── */}
      <div className="relative wl-corner-lg overflow-hidden"
        style={{ border: '1px solid rgba(120,62,12,0.3)', backgroundColor: 'rgba(8,6,3,0.8)' }}>
        <div className="absolute top-0 left-0 right-0 h-0.5 wl-hazard-h opacity-40" />
        <div className="p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded flex items-center justify-center border border-amber-700/30"
            style={{ backgroundColor: 'rgba(120,62,12,0.2)' }}>
            <Recycle className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h2 className="text-sm font-mono font-bold text-amber-400/90 uppercase tracking-wider">Tâches de Base</h2>
            <p className="text-[11px] font-mono text-zinc-600 tracking-wide">Affectez des survivants à des activités de soutien</p>
          </div>
        </div>
      </div>

      {/* ── Recyclage ────────────────────────────────────────────────────── */}
      <div className="relative wl-corner-lg overflow-hidden"
        style={{ border: '1px solid rgba(120,62,12,0.25)', backgroundColor: 'rgba(8,6,3,0.75)' }}>
        <div className="p-4 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-mono font-bold text-amber-400/80 uppercase tracking-wider">Recyclage des Équipements</h3>
            </div>
            <p className="text-[11px] font-mono text-zinc-600 leading-relaxed ml-6">
              Démantèle un objet de l'inventaire pour récupérer des ressources. Le rendement dépend du niveau d'ingénierie.
            </p>
            <div className="ml-6 mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
              {[1, 2, 3, 4, 5].map(t => (
                <span key={t} className={`text-[10px] font-mono ${TIER_COLORS[t]?.split(' ')[0] ?? 'text-zinc-500'}`}>
                  T{t} → Ing. {getRecycleMinEngineering(t)} min
                </span>
              ))}
            </div>
          </div>

          {state.recyclingTasks.length > 0 && (
            <div className="space-y-2">
              <SectionHeader>En cours [{state.recyclingTasks.length}]</SectionHeader>
              {state.recyclingTasks.map(task => <RecycleTaskCard key={task.id} task={task} now={now} />)}
            </div>
          )}

          <div>
            <SectionHeader>Nouvelle tâche</SectionHeader>

            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">1 · Objet à recycler</p>
            {state.inventory.length === 0 ? (
              <p className="text-[11px] font-mono text-zinc-700 italic">L'inventaire est vide.</p>
            ) : (
              <div className="space-y-1 max-h-44 overflow-y-auto pr-1 mb-4"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(120,62,12,0.4) transparent' }}>
                {state.inventory.map((item, idx) => {
                  const isSel = selectedItemIndex === idx;
                  return (
                    <button key={idx}
                      onClick={() => { setSelectedItemIndex(isSel ? null : idx); setSelectedRecycleSurv(null); }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all ${isSel ? 'bg-amber-600/15 border border-amber-600/40' : 'border border-transparent hover:border-zinc-700 hover:bg-zinc-900/40'}`}>
                      <span className={`text-[10px] font-mono border px-1 rounded shrink-0 ${TIER_COLORS[item.tier] || 'text-zinc-400 border-zinc-600'}`}>{TIER_LABELS[item.tier] || `T${item.tier}`}</span>
                      <span className="text-[11px] font-mono text-zinc-300 truncate flex-1">{item.name}</span>
                      <span className="text-[10px] font-mono text-zinc-600 shrink-0 capitalize">{item.slot === 'weapon' ? 'Arme' : item.slot === 'armor' ? 'Armure' : 'Sac'}</span>
                      {isSel && <ChevronRight className="w-3 h-3 text-amber-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedItem && (
              <>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">
                  2 · Survivant — Ing. {minEngForSelected} minimum
                </p>
                {eligibleSurvivors.length === 0 && ineligibleSurvivors.length === 0 && (
                  <p className="text-[11px] font-mono text-zinc-700 italic mb-4">Aucun survivant disponible.</p>
                )}
                {eligibleSurvivors.length === 0 && ineligibleSurvivors.length > 0 && (
                  <div className="flex items-start gap-2 px-2 py-2 rounded border border-red-900/30 mb-4"
                    style={{ backgroundColor: 'rgba(30,5,5,0.5)' }}>
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500/70 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-mono text-red-400/70">Aucun survivant n'a l'ingénierie requise ({minEngForSelected}).</p>
                  </div>
                )}
                <div className="space-y-1 mb-4">
                  {eligibleSurvivors.map(s => {
                    const isSel = selectedRecycleSurv === s.id;
                    return (
                      <button key={s.id}
                        onClick={() => setSelectedRecycleSurv(isSel ? null : s.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all ${isSel ? 'bg-amber-600/15 border border-amber-600/40' : 'border border-transparent hover:border-zinc-700 hover:bg-zinc-900/40'}`}>
                        <User className="w-3 h-3 text-zinc-500 shrink-0" />
                        <span className="text-[11px] font-mono text-zinc-300 flex-1 truncate">{s.name}</span>
                        <span className="text-[10px] font-mono text-zinc-500 shrink-0">{s.trait}</span>
                        <span className="text-[10px] font-mono text-blue-400/80 shrink-0">Ing. {getEffectiveEngineering(s)}</span>
                        {isSel && <ChevronRight className="w-3 h-3 text-amber-500 shrink-0" />}
                      </button>
                    );
                  })}
                  {ineligibleSurvivors.map(s => (
                    <div key={s.id} className="flex items-center gap-2 px-2 py-1.5 rounded opacity-40 cursor-not-allowed">
                      <User className="w-3 h-3 text-zinc-600 shrink-0" />
                      <span className="text-[11px] font-mono text-zinc-600 flex-1 truncate">{s.name}</span>
                      <span className="text-[10px] font-mono text-red-600/70 shrink-0">Ing. {getEffectiveEngineering(s)}/{minEngForSelected}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {selectedItem && recycleSurvivor && previewYield && (
              <div className="space-y-3">
                <div className="px-3 py-2 rounded space-y-1"
                  style={{ border: '1px solid rgba(120,62,12,0.3)', backgroundColor: 'rgba(12,9,4,0.6)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Rendement estimé</span>
                    <span className="text-[10px] font-mono text-zinc-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{formatDuration(getRecycleDuration(selectedItem.tier))}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    {Object.entries(previewYield).map(([res, qty]) => (
                      <span key={res} className={`text-xs font-mono font-semibold ${RESOURCE_COLORS[res] ?? 'text-zinc-300'}`}>
                        +{qty} {RESOURCE_LABELS[res] ?? res}
                      </span>
                    ))}
                  </div>
                </div>
                <button onClick={handleLaunchRecycle}
                  className="w-full py-2 text-xs font-mono font-bold uppercase tracking-wider rounded transition-all text-amber-300 border border-amber-700/50 hover:border-amber-500/70 hover:text-amber-200"
                  style={{ backgroundColor: 'rgba(120,62,12,0.25)' }}>
                  Lancer le recyclage
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Entraînement ─────────────────────────────────────────────────── */}
      <div className="relative wl-corner-lg overflow-hidden"
        style={{ border: '1px solid rgba(30,60,120,0.25)', backgroundColor: 'rgba(5,8,18,0.75)' }}>
        <div className="p-4 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="w-4 h-4 text-blue-500" />
              <h3 className="text-xs font-mono font-bold text-blue-400/80 uppercase tracking-wider">Entraînement</h3>
            </div>
            <p className="text-[11px] font-mono text-zinc-600 leading-relaxed ml-6">
              Améliore définitivement une statistique (+1, max 3 fois par stat). Annuler un entraînement ne conserve aucun progrès.
            </p>
            <div className="ml-6 mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
              <span className="text-[10px] font-mono text-zinc-600">Nv.1 → 1h</span>
              <span className="text-[10px] font-mono text-zinc-600">Nv.2 → 3h</span>
              <span className="text-[10px] font-mono text-zinc-600">Nv.3 → 10h</span>
            </div>
            <div className="ml-6 mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
              {TRAINABLE_STATS.map(stat => {
                const bldId   = TRAINING_BUILDING_REQ[stat];
                const bldName = BUILDINGS.find(b => b.id === bldId)?.name ?? bldId;
                return (
                  <span key={stat} className={`text-[10px] font-mono ${STAT_COLORS[stat]}`}>
                    {TRAINING_STAT_LABELS[stat]} → {bldName} Nv.2/3/4
                  </span>
                );
              })}
            </div>
          </div>

          {state.trainingTasks.length > 0 && (
            <div className="space-y-2">
              <SectionHeader>En cours [{state.trainingTasks.length}]</SectionHeader>
              {state.trainingTasks.map(task => <TrainingTaskCard key={task.id} task={task} now={now} />)}
            </div>
          )}

          <div>
            <SectionHeader>Nouvelle tâche</SectionHeader>

            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">1 · Survivant disponible</p>
            {availableForTraining.length === 0 ? (
              <p className="text-[11px] font-mono text-zinc-700 italic mb-4">Aucun survivant disponible.</p>
            ) : (
              <div className="space-y-1 mb-4">
                {availableForTraining.map(s => {
                  const isSel = selectedTrainSurv === s.id;
                  return (
                    <button key={s.id}
                      onClick={() => { setSelectedTrainSurv(isSel ? null : s.id); setSelectedStat(null); }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all ${isSel ? 'bg-blue-600/10 border border-blue-600/40' : 'border border-transparent hover:border-zinc-700 hover:bg-zinc-900/40'}`}>
                      <User className="w-3 h-3 text-zinc-500 shrink-0" />
                      <span className="text-[11px] font-mono text-zinc-300 flex-1 truncate">{s.name}</span>
                      <span className="text-[10px] font-mono text-zinc-500 shrink-0">{s.trait}</span>
                      {isSel && <ChevronRight className="w-3 h-3 text-blue-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {trainSurvivor && (
              <>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">2 · Statistique à entraîner</p>
                <div className="space-y-1 mb-4">
                  {TRAINABLE_STATS.map(stat => {
                    const info = getStatTrainInfo(trainSurvivor, stat);
                    const isSel = selectedStat === stat;
                    const currentVal = trainSurvivor.skills[stat];

                    if (info.isMaxed) {
                      return (
                        <div key={stat} className="flex items-center gap-2 px-2 py-1.5 rounded opacity-40 cursor-not-allowed">
                          <span className={`text-[11px] font-mono font-semibold w-20 ${STAT_COLORS[stat]}`}>{TRAINING_STAT_LABELS[stat]}</span>
                          <span className="text-[10px] font-mono text-zinc-500">{currentVal}</span>
                          <span className="text-[10px] font-mono text-green-600 ml-auto">✓ Maîtrisé (3/3)</span>
                        </div>
                      );
                    }
                    if (info.isTrainingNow) {
                      return (
                        <div key={stat} className="flex items-center gap-2 px-2 py-1.5 rounded opacity-50 cursor-not-allowed">
                          <span className={`text-[11px] font-mono font-semibold w-20 ${STAT_COLORS[stat]}`}>{TRAINING_STAT_LABELS[stat]}</span>
                          <span className="text-[10px] font-mono text-zinc-500">{currentVal}</span>
                          <span className="text-[10px] font-mono text-blue-500 ml-auto">En cours…</span>
                        </div>
                      );
                    }
                    if (info.isLocked) {
                      return (
                        <div key={stat} className="flex items-center gap-2 px-2 py-1.5 rounded opacity-40 cursor-not-allowed"
                          title={`${info.bldName} niveau ${info.reqBldLevel} requis (actuel: ${info.curBldLevel})`}>
                          <Lock className="w-3 h-3 text-zinc-600 shrink-0" />
                          <span className={`text-[11px] font-mono font-semibold w-20 ${STAT_COLORS[stat]}`}>{TRAINING_STAT_LABELS[stat]}</span>
                          <span className="text-[10px] font-mono text-zinc-500">{currentVal}</span>
                          <span className="text-[10px] font-mono text-zinc-600 ml-auto">{info.bldName} Nv.{info.reqBldLevel}</span>
                        </div>
                      );
                    }
                    return (
                      <button key={stat}
                        onClick={() => setSelectedStat(isSel ? null : stat)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all ${isSel ? 'bg-blue-600/10 border border-blue-600/40' : 'border border-transparent hover:border-zinc-700 hover:bg-zinc-900/40'}`}>
                        <span className={`text-[11px] font-mono font-semibold w-20 ${STAT_COLORS[stat]}`}>{TRAINING_STAT_LABELS[stat]}</span>
                        <span className="text-[10px] font-mono text-zinc-400">{currentVal} → {currentVal + 1}</span>
                        <span className="text-[10px] font-mono text-zinc-600 ml-1">({info.count}/3)</span>
                        <span className="text-[10px] font-mono text-zinc-600 ml-auto flex items-center gap-1">
                          <Clock className="w-3 h-3" />{formatDuration(TRAINING_DURATIONS[info.count])}
                        </span>
                        {isSel && <ChevronRight className="w-3 h-3 text-blue-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {trainSurvivor && selectedStat && canLaunchTraining && (
              <button onClick={handleLaunchTraining}
                className="w-full py-2 text-xs font-mono font-bold uppercase tracking-wider rounded transition-all text-blue-300 border border-blue-700/50 hover:border-blue-500/70 hover:text-blue-200"
                style={{ backgroundColor: 'rgba(30,60,120,0.2)' }}>
                Lancer l'entraînement — {formatDuration(TRAINING_DURATIONS[(trainSurvivor.trainingCounts?.[selectedStat] ?? 0)])}
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default TasksPanel;
