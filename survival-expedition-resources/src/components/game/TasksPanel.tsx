import React, { useState, useEffect } from 'react';
import { User, X, Clock, ChevronRight, Dumbbell, Lock, ArrowRight, Check } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import type { TrainingTask, Survivor } from '@/contexts/GameContext';
import {
  BUILDINGS,
  TRAINING_DURATIONS, TRAINING_BUILDING_REQ, TRAINING_STAT_LABELS, getTrainingBuildingLevel,
  type TrainableStat,
} from '@/data/gameData';

/* ── helpers ─────────────────────────────────────────────────────────────── */

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return m > 0 ? `${m}m ${s < 10 ? '0' : ''}${s}s` : `${s}s`;
}

const STAT_COLORS: Record<TrainableStat, string> = {
  combat: 'text-red-400', medical: 'text-pink-400', engineering: 'text-blue-400',
};

const STAT_BG: Record<TrainableStat, string> = {
  combat: 'bg-red-950/60 text-red-700', medical: 'bg-pink-950/60 text-pink-700', engineering: 'bg-blue-950/60 text-blue-700',
};

const TRAINABLE_STATS: TrainableStat[] = ['combat', 'medical', 'engineering'];

/* ── Section divider ──────────────────────────────────────────────────────── */

const SectionDivider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-2 mb-2">
    <div className="w-0.5 h-3.5 bg-amber-600/50" />
    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-600/70">{children}</span>
    <div className="flex-1 h-px bg-zinc-800/60" />
  </div>
);

/* ── Training active task card ───────────────────────────────────────────── */

const TrainingTaskCard: React.FC<{ task: TrainingTask; now: number }> = ({ task, now }) => {
  const { state, cancelTraining } = useGame();
  const survivor  = state.survivors.find(s => s.id === task.survivorId);
  const elapsed   = (now - task.startTime) / 1000;
  const remaining = Math.max(0, task.duration - elapsed);
  const progress  = Math.min(1, elapsed / task.duration);

  return (
    <div className="bg-zinc-900/60 border border-zinc-700/40 rounded-lg px-3 py-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Dumbbell className="w-3.5 h-3.5 text-amber-500/70 shrink-0" />
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
        <span className="text-[11px] font-mono text-zinc-300">{survivor?.name ?? '—'}</span>
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
        <div className="h-1.5 rounded-full overflow-hidden bg-zinc-800">
          <div className="h-full rounded-full transition-all duration-1000 bg-amber-600"
            style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  );
};

/* ── Main panel ──────────────────────────────────────────────────────────── */

const TasksPanel: React.FC = () => {
  const { state, startTraining } = useGame();
  const [now, setNow] = useState(Date.now());

  const [selectedTrainSurv, setSelectedTrainSurv] = useState<string | null>(null);
  const [selectedStat, setSelectedStat]           = useState<TrainableStat | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setSelectedTrainSurv(null);
    setSelectedStat(null);
  }, [state.trainingTasks.length]);

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
    <div className="space-y-3">

      {/* ── Title ────────────────────────────────────────────────────────── */}
      <h2 className="text-lg font-bold text-amber-500 font-mono uppercase tracking-wider flex items-center gap-2">
        <Dumbbell className="w-5 h-5" />
        Tâches — Entraînement
      </h2>

      {/* ── Entraînement ─────────────────────────────────────────────────── */}
      <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-lg p-4 space-y-4">

        {/* Card header */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded bg-amber-950/60 text-amber-700 shrink-0">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-200 text-sm">Entraînement des Survivants</h3>
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
              Améliore définitivement une statistique (+1, max 3 fois). Annuler ne conserve aucun progrès.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5">
              <span className="text-[10px] font-mono text-zinc-600">Nv.1 → 1h</span>
              <span className="text-[10px] font-mono text-zinc-600">Nv.2 → 3h</span>
              <span className="text-[10px] font-mono text-zinc-600">Nv.3 → 10h</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
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
        </div>

        {/* Active tasks */}
        {state.trainingTasks.length > 0 && (
          <div className="space-y-2">
            <SectionDivider>En cours [{state.trainingTasks.length}]</SectionDivider>
            {state.trainingTasks.map(task => <TrainingTaskCard key={task.id} task={task} now={now} />)}
          </div>
        )}

        {/* New task */}
        <div className="space-y-3">
          <SectionDivider>Nouvelle tâche</SectionDivider>

          <div>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">1 · Survivant disponible</p>
            {availableForTraining.length === 0 ? (
              <p className="text-[11px] font-mono text-zinc-600 italic">Aucun survivant disponible.</p>
            ) : (
              <div className="space-y-1">
                {availableForTraining.map(s => {
                  const isSel = selectedTrainSurv === s.id;
                  return (
                    <button key={s.id}
                      onClick={() => { setSelectedTrainSurv(isSel ? null : s.id); setSelectedStat(null); }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all ${
                        isSel
                          ? 'bg-amber-900/20 border border-amber-600/40'
                          : 'border border-transparent hover:border-zinc-700/60 hover:bg-zinc-800/40'
                      }`}>
                      <User className="w-3 h-3 text-zinc-500 shrink-0" />
                      <span className="text-[11px] font-mono text-zinc-200 flex-1 truncate">{s.name}</span>
                      <span className="text-[10px] font-mono text-zinc-500 shrink-0">{s.trait}</span>
                      {isSel && <ChevronRight className="w-3 h-3 text-amber-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {trainSurvivor && (
            <div>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">2 · Statistique à entraîner</p>
              <div className="space-y-1">
                {TRAINABLE_STATS.map(stat => {
                  const info = getStatTrainInfo(trainSurvivor, stat);
                  const isSel = selectedStat === stat;
                  const currentVal = trainSurvivor.skills[stat];

                  if (info.isMaxed) {
                    return (
                      <div key={stat} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-zinc-900/40 border border-zinc-800/60 opacity-50">
                        <Check className="w-3 h-3 text-green-600 shrink-0" />
                        <span className={`text-[11px] font-mono font-semibold w-20 ${STAT_COLORS[stat]}`}>{TRAINING_STAT_LABELS[stat]}</span>
                        <span className="text-[10px] font-mono text-zinc-500">{currentVal}</span>
                        <span className="text-[10px] font-mono text-green-600 ml-auto">Maîtrisé (3/3)</span>
                      </div>
                    );
                  }
                  if (info.isTrainingNow) {
                    return (
                      <div key={stat} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-zinc-900/40 border border-zinc-800/60 opacity-50">
                        <Dumbbell className="w-3 h-3 text-amber-600/70 shrink-0" />
                        <span className={`text-[11px] font-mono font-semibold w-20 ${STAT_COLORS[stat]}`}>{TRAINING_STAT_LABELS[stat]}</span>
                        <span className="text-[10px] font-mono text-zinc-500">{currentVal}</span>
                        <span className="text-[10px] font-mono text-amber-600/70 ml-auto">En cours…</span>
                      </div>
                    );
                  }
                  if (info.isLocked) {
                    return (
                      <div key={stat}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-zinc-900/40 border border-zinc-800/60 opacity-40 cursor-not-allowed"
                        title={`${info.bldName} niveau ${info.reqBldLevel} requis (actuel: ${info.curBldLevel})`}>
                        <Lock className="w-3 h-3 text-zinc-600 shrink-0" />
                        <span className={`text-[11px] font-mono font-semibold w-20 ${STAT_COLORS[stat]}`}>{TRAINING_STAT_LABELS[stat]}</span>
                        <span className="text-[10px] font-mono text-zinc-500">{currentVal}</span>
                        <span className="text-xs font-mono text-zinc-600 ml-auto px-1.5 py-0.5 rounded bg-zinc-800">{info.bldName} Nv.{info.reqBldLevel}</span>
                      </div>
                    );
                  }
                  return (
                    <button key={stat}
                      onClick={() => setSelectedStat(isSel ? null : stat)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all ${
                        isSel
                          ? 'bg-amber-900/20 border border-amber-600/40'
                          : 'border border-transparent hover:border-zinc-700/60 hover:bg-zinc-800/40'
                      }`}>
                      <span className={`text-[11px] font-mono font-semibold w-20 ${STAT_COLORS[stat]}`}>{TRAINING_STAT_LABELS[stat]}</span>
                      <span className="text-[10px] font-mono text-zinc-300">{currentVal} → {currentVal + 1}</span>
                      <span className="text-[10px] font-mono text-zinc-600 ml-1">({info.count}/3)</span>
                      <span className="text-[10px] font-mono text-zinc-500 ml-auto flex items-center gap-1">
                        <Clock className="w-3 h-3" />{formatDuration(TRAINING_DURATIONS[info.count])}
                      </span>
                      {isSel && <ChevronRight className="w-3 h-3 text-amber-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {trainSurvivor && selectedStat && (
            <div>
              {canLaunchTraining ? (
                <button
                  onClick={handleLaunchTraining}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all bg-amber-600 hover:bg-amber-500 text-black"
                >
                  <ArrowRight className="w-3 h-3" />
                  Lancer l'entraînement — {formatDuration(TRAINING_DURATIONS[(trainSurvivor.trainingCounts?.[selectedStat] ?? 0)])}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider bg-zinc-800 text-zinc-600 cursor-not-allowed"
                >
                  <Lock className="w-3 h-3" />
                  Non disponible
                </button>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default TasksPanel;
