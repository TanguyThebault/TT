import React, { useState, useEffect } from 'react';
import { Hammer, Recycle, Wrench, User, X, Clock, ChevronRight, Lock, Check, ArrowRight } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import type { CraftingTask, RecycleTask } from '@/contexts/GameContext';
import {
  ALL_EQUIPMENT, CRAFT_RECIPES, RESOURCES,
  getCraftDuration, getRecycleYield, getRecycleDuration,
  type EquipmentDef,
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

function getEffectiveEngineering(survivor: { skills: { engineering: number }; equipment: Record<string, { stats?: { engineering?: number } } | null> }): number {
  let total = survivor.skills.engineering;
  for (const eq of Object.values(survivor.equipment)) {
    if (eq?.stats?.engineering) total += eq.stats.engineering;
  }
  return total;
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
  1: 'text-zinc-400 border-zinc-600',
  2: 'text-green-400 border-green-700/50',
  3: 'text-blue-400 border-blue-700/50',
  4: 'text-purple-400 border-purple-700/50',
  5: 'text-amber-400 border-amber-700/50',
};
const SLOT_LABELS: Record<string, string> = { weapon: 'Arme', armor: 'Armure', backpack: 'Sac' };

/* ── Section divider ──────────────────────────────────────────────────────── */

const SectionDivider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-2 mb-2">
    <div className="w-0.5 h-3.5 bg-amber-600/50" />
    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-600/70">{children}</span>
    <div className="flex-1 h-px bg-zinc-800/60" />
  </div>
);

/* ── Active crafting task card ────────────────────────────────────────────── */

const CraftTaskCard: React.FC<{ task: CraftingTask; now: number }> = ({ task, now }) => {
  const { state, cancelCraft } = useGame();
  const survivor  = state.survivors.find(s => s.id === task.survivorId);
  const elapsed   = (now - task.startTime) / 1000;
  const remaining = Math.max(0, task.duration - elapsed);
  const progress  = Math.min(1, elapsed / task.duration);

  return (
    <div className="bg-zinc-900/60 border border-zinc-700/40 rounded-lg px-3 py-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-mono border px-1 rounded shrink-0 ${TIER_COLORS[task.item.tier] || 'text-zinc-400 border-zinc-600'}`}>
          {TIER_LABELS[task.item.tier] || `T${task.item.tier}`}
        </span>
        <span className="text-[11px] font-mono text-zinc-200 flex-1 truncate font-medium">{task.item.name}</span>
        <span className="text-[10px] font-mono text-zinc-500 shrink-0">{survivor?.name ?? '—'}</span>
        <span className="text-[10px] font-mono text-zinc-600 ml-1">Ing.{task.engineeringLevel}</span>
        <button onClick={() => cancelCraft(task.id)} className="text-zinc-600 hover:text-red-400 transition-colors shrink-0 ml-1">
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden bg-zinc-800">
        <div className="h-full rounded-full transition-all duration-1000 bg-amber-600"
          style={{ width: `${progress * 100}%` }} />
      </div>
      <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
        <Clock className="w-3 h-3" />{formatDuration(Math.ceil(remaining))} restant
      </span>
    </div>
  );
};

/* ── Active recycle task card ─────────────────────────────────────────────── */

const RecycleTaskCard: React.FC<{ task: RecycleTask; now: number }> = ({ task, now }) => {
  const { state, cancelRecycle } = useGame();
  const survivor  = state.survivors.find(s => s.id === task.survivorId);
  const yields    = getRecycleYield(task.item, task.engineeringLevel);
  const elapsed   = (now - task.startTime) / 1000;
  const remaining = Math.max(0, task.duration - elapsed);
  const progress  = Math.min(1, elapsed / task.duration);

  return (
    <div className="bg-zinc-900/60 border border-zinc-700/40 rounded-lg px-3 py-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-mono border px-1 rounded shrink-0 ${TIER_COLORS[task.item.tier] || 'text-zinc-400 border-zinc-600'}`}>
          {TIER_LABELS[task.item.tier] || `T${task.item.tier}`}
        </span>
        <span className="text-[11px] font-mono text-zinc-200 flex-1 truncate font-medium">{task.item.name}</span>
        <span className="text-[10px] font-mono text-zinc-500 shrink-0">{survivor?.name ?? '—'}</span>
        <span className="text-[10px] font-mono text-zinc-600 ml-1">Ing.{task.engineeringLevel}</span>
        <button onClick={() => cancelRecycle(task.id)} className="text-zinc-600 hover:text-red-400 transition-colors shrink-0 ml-1">
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden bg-zinc-800">
        <div className="h-full rounded-full transition-all duration-1000 bg-amber-600"
          style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />{formatDuration(Math.ceil(remaining))} restant
        </span>
        <div className="flex flex-wrap gap-x-2 justify-end">
          {Object.entries(yields).map(([res, qty]) => (
            <span key={res} className={`text-[10px] font-mono ${RESOURCE_COLORS[res] ?? 'text-zinc-400'}`}>
              +{qty} {RESOURCE_LABELS[res] ?? res}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Main panel ───────────────────────────────────────────────────────────── */

const CraftingPanel: React.FC = () => {
  const { state, startCraft, startRecycle } = useGame();
  const workshopLevel = state.buildings['workshop'] || 0;
  const [now, setNow] = useState(Date.now());

  const [selectedItemId, setSelectedItemId]           = useState<string | null>(null);
  const [selectedCraftSurv, setSelectedCraftSurv]     = useState<string | null>(null);
  const [selectedItemIndex, setSelectedItemIndex]     = useState<number | null>(null);
  const [selectedRecycleSurv, setSelectedRecycleSurv] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { setSelectedItemId(null); setSelectedCraftSurv(null); }, [state.craftingTasks.length]);
  useEffect(() => { setSelectedItemIndex(null); setSelectedRecycleSurv(null); }, [state.recyclingTasks.length]);

  if (workshopLevel === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-amber-500 font-mono uppercase tracking-wider flex items-center gap-2">
          <Hammer className="w-5 h-5" />
          Atelier — Fabrication & Recyclage
        </h2>
        <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-lg p-6 flex flex-col items-center gap-3">
          <Lock className="w-8 h-8 text-zinc-700" />
          <p className="text-sm text-zinc-500 font-mono">Construisez un Atelier dans l'onglet Base pour débloquer la fabrication et le recyclage.</p>
        </div>
      </div>
    );
  }

  /* ── Crafting helpers ── */
  const craftableItems = ALL_EQUIPMENT.filter(eq => CRAFT_RECIPES[eq.id] && eq.tier <= workshopLevel);
  const groupedByTier: Record<number, EquipmentDef[]> = {};
  craftableItems.forEach(item => {
    if (!groupedByTier[item.tier]) groupedByTier[item.tier] = [];
    groupedByTier[item.tier].push(item);
  });
  const selectedCraftItem     = selectedItemId ? ALL_EQUIPMENT.find(e => e.id === selectedItemId) ?? null : null;
  const availableSurvivors    = state.survivors.filter(s => s.status === 'available');
  const selectedCraftSurvivor = selectedCraftSurv ? state.survivors.find(s => s.id === selectedCraftSurv) ?? null : null;
  const previewDuration       = selectedCraftItem && selectedCraftSurvivor
    ? getCraftDuration(selectedCraftItem.tier, getEffectiveEngineering(selectedCraftSurvivor)) : null;
  const selectedCraftRecipe   = selectedItemId ? CRAFT_RECIPES[selectedItemId] : null;
  const canAffordCraft        = selectedCraftRecipe
    ? Object.entries(selectedCraftRecipe).every(([res, amt]) => (state.resources[res] || 0) >= amt) : false;

  function handleLaunchCraft() {
    if (!selectedItemId || !selectedCraftSurv) return;
    startCraft(selectedCraftSurv, selectedItemId);
  }

  /* ── Recycle helpers ── */
  const selectedRecycleItem: EquipmentDef | null =
    selectedItemIndex !== null ? (state.inventory[selectedItemIndex] ?? null) : null;
  const eligibleSurvivors = selectedRecycleItem ? state.survivors.filter(s => s.status === 'available') : [];
  const recycleSurvivor   = selectedRecycleSurv ? state.survivors.find(s => s.id === selectedRecycleSurv) ?? null : null;
  const previewYield      = selectedRecycleItem && recycleSurvivor
    ? getRecycleYield(selectedRecycleItem, getEffectiveEngineering(recycleSurvivor)) : null;

  function handleLaunchRecycle() {
    if (selectedItemIndex === null || !selectedRecycleSurv) return;
    startRecycle(selectedRecycleSurv, selectedItemIndex);
  }

  return (
    <div className="space-y-3">

      {/* ── Title ────────────────────────────────────────────────────────── */}
      <h2 className="text-lg font-bold text-amber-500 font-mono uppercase tracking-wider flex items-center gap-2">
        <Hammer className="w-5 h-5" />
        Atelier — Fabrication & Recyclage
        <span className="text-zinc-600 text-sm font-normal normal-case tracking-normal">Nv.{workshopLevel}</span>
      </h2>

      {/* ── Fabrication ──────────────────────────────────────────────────── */}
      <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-lg p-4 space-y-4">

        {/* Card header */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded bg-amber-950/60 text-amber-700 shrink-0">
            <Hammer className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-200 text-sm">Fabrication des Équipements</h3>
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
              Assignez un survivant pour fabriquer un équipement. Le niveau d'ingénierie réduit la durée.
            </p>
          </div>
        </div>

        {/* Active tasks */}
        {state.craftingTasks.length > 0 && (
          <div className="space-y-2">
            <SectionDivider>En cours [{state.craftingTasks.length}]</SectionDivider>
            {state.craftingTasks.map(task => <CraftTaskCard key={task.id} task={task} now={now} />)}
          </div>
        )}

        {/* New task */}
        <div className="space-y-3">
          <SectionDivider>Nouvelle tâche</SectionDivider>

          <div>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">1 · Objet à fabriquer</p>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(120,62,12,0.4) transparent' }}>
              {Object.entries(groupedByTier).sort(([a], [b]) => Number(a) - Number(b)).map(([tier, items]) => (
                <div key={tier}>
                  <p className={`text-[10px] font-mono uppercase tracking-widest mb-1 ${TIER_COLORS[Number(tier)]?.split(' ')[0] ?? 'text-zinc-500'}`}>
                    Tier {tier}
                  </p>
                  <div className="space-y-1">
                    {items.map(item => {
                      const recipe = CRAFT_RECIPES[item.id]!;
                      const isSel  = selectedItemId === item.id;
                      const afford = Object.entries(recipe).every(([res, amt]) => (state.resources[res] || 0) >= amt);
                      return (
                        <button key={item.id}
                          onClick={() => { setSelectedItemId(isSel ? null : item.id); setSelectedCraftSurv(null); }}
                          className={`w-full flex items-start gap-2 px-2 py-1.5 rounded-lg text-left transition-all ${
                            isSel
                              ? 'bg-amber-900/20 border border-amber-600/40'
                              : 'border border-transparent hover:border-zinc-700/60 hover:bg-zinc-800/40'
                          }`}>
                          <span className={`text-[10px] font-mono border px-1 rounded shrink-0 mt-0.5 ${TIER_COLORS[item.tier] || 'text-zinc-400 border-zinc-600'}`}>
                            {TIER_LABELS[item.tier]}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono text-zinc-200 truncate">{item.name}</span>
                              <span className="text-[10px] font-mono text-zinc-600 shrink-0">{SLOT_LABELS[item.slot] ?? item.slot}</span>
                            </div>
                            <div className="flex flex-wrap gap-x-2 mt-0.5">
                              {Object.entries(recipe).map(([res, amt]) => {
                                const has = (state.resources[res] || 0) >= amt;
                                const resDef = RESOURCES.find(r => r.id === res);
                                return (
                                  <span key={res} className={`text-[10px] font-mono px-1 py-0 rounded ${has ? 'bg-zinc-800 text-zinc-400' : 'bg-red-900/30 text-red-400'}`}>
                                    {resDef?.name ?? RESOURCE_LABELS[res] ?? res}: {amt}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                          {!afford && <span className="text-[10px] font-mono text-red-500/60 shrink-0 self-center">✕</span>}
                          {isSel && <ChevronRight className="w-3 h-3 text-amber-500 shrink-0 self-center" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedCraftItem && (
            <div>
              {!canAffordCraft && (
                <p className="text-[11px] font-mono text-red-400/70 mb-2">
                  Ressources insuffisantes pour fabriquer {selectedCraftItem.name}.
                </p>
              )}
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">2 · Survivant</p>
              {availableSurvivors.length === 0 ? (
                <p className="text-[11px] font-mono text-zinc-600 italic mb-2">Aucun survivant disponible.</p>
              ) : (
                <div className="space-y-1">
                  {availableSurvivors.map(s => {
                    const eng  = getEffectiveEngineering(s);
                    const dur  = getCraftDuration(selectedCraftItem.tier, eng);
                    const isSel = selectedCraftSurv === s.id;
                    return (
                      <button key={s.id}
                        onClick={() => setSelectedCraftSurv(isSel ? null : s.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all ${
                          isSel
                            ? 'bg-amber-900/20 border border-amber-600/40'
                            : 'border border-transparent hover:border-zinc-700/60 hover:bg-zinc-800/40'
                        }`}>
                        <User className="w-3 h-3 text-zinc-500 shrink-0" />
                        <span className="text-[11px] font-mono text-zinc-200 flex-1 truncate">{s.name}</span>
                        <span className="text-[10px] font-mono text-zinc-500 shrink-0">{s.trait}</span>
                        <span className="text-[10px] font-mono text-blue-400/80 shrink-0">Ing.{eng}</span>
                        <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-0.5 shrink-0">
                          <Clock className="w-2.5 h-2.5" />{formatDuration(dur)}
                        </span>
                        {isSel && <ChevronRight className="w-3 h-3 text-amber-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {selectedCraftItem && selectedCraftSurvivor && previewDuration !== null && (
            <div className="space-y-2">
              <div className="bg-zinc-800/50 border border-zinc-700/40 rounded-lg px-3 py-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Durée estimée</span>
                  <span className="text-[10px] font-mono text-amber-400/80 flex items-center gap-1">
                    <Clock className="w-3 h-3" />{formatDuration(previewDuration)}
                  </span>
                </div>
                {Object.entries(selectedCraftItem.stats).filter(([, v]) => v).length > 0 && (
                  <div className="flex flex-wrap gap-x-3 mt-0.5">
                    {Object.entries(selectedCraftItem.stats).filter(([, v]) => v).map(([k, v]) => (
                      <span key={k} className="text-[10px] font-mono text-zinc-500">{k} +{v}</span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleLaunchCraft}
                disabled={!canAffordCraft}
                className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all ${
                  canAffordCraft
                    ? 'bg-amber-600 hover:bg-amber-500 text-black'
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
              >
                {canAffordCraft ? (
                  <><ArrowRight className="w-3 h-3" /> Lancer la fabrication</>
                ) : (
                  <><Lock className="w-3 h-3" /> Ressources insuffisantes</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Recyclage ────────────────────────────────────────────────────── */}
      <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-lg p-4 space-y-4">

        {/* Card header */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded bg-amber-950/60 text-amber-700 shrink-0">
            <Recycle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-200 text-sm">Recyclage des Équipements</h3>
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
              Démantèle un objet de l'inventaire pour récupérer des ressources. Le rendement dépend du niveau d'ingénierie.
            </p>
          </div>
        </div>

        {/* Active tasks */}
        {state.recyclingTasks.length > 0 && (
          <div className="space-y-2">
            <SectionDivider>En cours [{state.recyclingTasks.length}]</SectionDivider>
            {state.recyclingTasks.map(task => <RecycleTaskCard key={task.id} task={task} now={now} />)}
          </div>
        )}

        {/* New task */}
        <div className="space-y-3">
          <SectionDivider>Nouvelle tâche</SectionDivider>

          <div>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">1 · Objet à recycler</p>
            {state.inventory.length === 0 ? (
              <p className="text-[11px] font-mono text-zinc-600 italic">L'inventaire est vide.</p>
            ) : (
              <div className="space-y-1 max-h-44 overflow-y-auto pr-1"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(120,62,12,0.4) transparent' }}>
                {state.inventory.map((item, idx) => {
                  const isSel = selectedItemIndex === idx;
                  return (
                    <button key={idx}
                      onClick={() => { setSelectedItemIndex(isSel ? null : idx); setSelectedRecycleSurv(null); }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all ${
                        isSel
                          ? 'bg-amber-900/20 border border-amber-600/40'
                          : 'border border-transparent hover:border-zinc-700/60 hover:bg-zinc-800/40'
                      }`}>
                      <span className={`text-[10px] font-mono border px-1 rounded shrink-0 ${TIER_COLORS[item.tier] || 'text-zinc-400 border-zinc-600'}`}>
                        {TIER_LABELS[item.tier] || `T${item.tier}`}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-200 truncate flex-1">{item.name}</span>
                      <span className="text-[10px] font-mono text-zinc-600 shrink-0">{SLOT_LABELS[item.slot] ?? item.slot}</span>
                      {isSel && <ChevronRight className="w-3 h-3 text-amber-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedRecycleItem && (
            <div>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">2 · Survivant</p>
              {eligibleSurvivors.length === 0 && (
                <p className="text-[11px] font-mono text-zinc-600 italic mb-2">Aucun survivant disponible.</p>
              )}
              <div className="space-y-1">
                {eligibleSurvivors.map(s => {
                  const isSel = selectedRecycleSurv === s.id;
                  return (
                    <button key={s.id}
                      onClick={() => setSelectedRecycleSurv(isSel ? null : s.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all ${
                        isSel
                          ? 'bg-amber-900/20 border border-amber-600/40'
                          : 'border border-transparent hover:border-zinc-700/60 hover:bg-zinc-800/40'
                      }`}>
                      <User className="w-3 h-3 text-zinc-500 shrink-0" />
                      <span className="text-[11px] font-mono text-zinc-200 flex-1 truncate">{s.name}</span>
                      <span className="text-[10px] font-mono text-zinc-500 shrink-0">{s.trait}</span>
                      <span className="text-[10px] font-mono text-blue-400/80 shrink-0">Ing.{getEffectiveEngineering(s)}</span>
                      {isSel && <ChevronRight className="w-3 h-3 text-amber-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedRecycleItem && recycleSurvivor && previewYield && (
            <div className="space-y-2">
              <div className="bg-zinc-800/50 border border-zinc-700/40 rounded-lg px-3 py-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Rendement estimé</span>
                  <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />{formatDuration(getRecycleDuration(selectedRecycleItem.tier))}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                  {Object.entries(previewYield).map(([res, qty]) => (
                    <span key={res} className={`text-xs font-mono font-semibold ${RESOURCE_COLORS[res] ?? 'text-zinc-300'}`}>
                      +{qty} {RESOURCE_LABELS[res] ?? res}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={handleLaunchRecycle}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all bg-amber-600 hover:bg-amber-500 text-black"
              >
                <Wrench className="w-3 h-3" /> Lancer le recyclage
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default CraftingPanel;
