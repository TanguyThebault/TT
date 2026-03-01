import React, { useState, useEffect } from 'react';
import { User, X, Clock, ChevronRight, Dumbbell, Lock } from 'lucide-react';
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

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(60,40,10,0.4)' }}>
    <div className="h-full rounded-full transition-all duration-1000"
      style={{ width: `${progress * 100}%`, background: 'linear-gradient(90deg,rgba(180,100,15,0.7),rgba(220,140,30,0.9))', boxShadow: '0 0 6px rgba(200,130,20,0.4)' }} />
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
    <div className="space-y-6">

      {/* ── Panel header ─────────────────────────────────────────────────── */}
      <div className="relative wl-corner-lg overflow-hidden"
        style={{ border: '1px solid rgba(30,60,120,0.3)', backgroundColor: 'rgba(5,8,18,0.8)' }}>
        <div className="absolute top-0 left-0 right-0 h-0.5 opacity-40"
          style={{ background: 'repeating-linear-gradient(90deg,rgba(60,100,200,0.6) 0,rgba(60,100,200,0.6) 8px,transparent 8px,transparent 16px)' }} />
        <div className="p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded flex items-center justify-center border border-blue-700/30"
            style={{ backgroundColor: 'rgba(30,60,120,0.2)' }}>
            <Dumbbell className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-mono font-bold text-blue-400/90 uppercase tracking-wider">Entraînement</h2>
            <p className="text-[11px] font-mono text-zinc-600 tracking-wide">Améliorez définitivement les statistiques de vos survivants</p>
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
