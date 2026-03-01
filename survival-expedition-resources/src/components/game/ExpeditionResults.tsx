import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { ZONES, RESOURCES, VEHICLE_DEFS, getCategoryDef } from '@/data/gameData';
import {
  X, AlertTriangle, Heart, Sword, Shield, Backpack,
  Check, ChevronRight, Search, Cog, Radio, UserPlus, Users, Car,
} from 'lucide-react';

const tierColors = ['', 'text-zinc-400', 'text-green-400', 'text-blue-400', 'text-purple-400', 'text-amber-400'];

const slotIcons: Record<string, React.ReactNode> = {
  weapon:   <Sword className="w-3.5 h-3.5" />,
  armor:    <Shield className="w-3.5 h-3.5" />,
  backpack: <Backpack className="w-3.5 h-3.5" />,
};

const statLabels: Record<string, string> = {
  combat: 'Combat', scavenging: 'Pillage', medical: 'Médical', engineering: 'Ingénierie',
};

const ExpeditionResults: React.FC = () => {
  const { state, collectResults } = useGame();
  const expedition = state.pendingResults;

  if (!expedition || !expedition.results) return null;

  const zone    = ZONES.find(z => z.id === expedition.zoneId);
  const results = expedition.results;
  const catDef  = zone?.category ? getCategoryDef(zone.category) : undefined;

  // ── Special case: contact mission ────────────────────────────────────────
  if (expedition.zoneId === 'signal_contact') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-md w-full shadow-2xl">
          <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-green-400 font-mono">Signal Localisé</h2>
              <p className="text-xs text-zinc-400 font-mono">{zone?.name}</p>
            </div>
            <button onClick={collectResults} className="text-zinc-500 hover:text-zinc-300 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-green-900/30 border border-green-500/20 flex-shrink-0">
                <Radio className="w-8 h-8 text-green-400" />
              </div>
              <div className="space-y-1">
                <p className="text-green-400 font-mono font-bold text-sm">Contact établi !</p>
                <p className="text-zinc-300 text-xs font-mono">{results.events[0]}</p>
                {state.traderCamp && (
                  <p className="text-amber-400 font-mono font-bold mt-2">{state.traderCamp.name}</p>
                )}
              </div>
            </div>
            <p className="text-xs text-zinc-500 font-mono border-t border-zinc-800 pt-3">
              Accédez à l'onglet <span className="text-amber-400 font-bold">Troc</span> pour négocier des échanges avec ce camp.
            </p>
          </div>
          <div className="p-4 border-t border-zinc-800">
            <button
              onClick={collectResults}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-700 hover:bg-green-600 text-white font-bold font-mono text-sm uppercase tracking-wider transition-colors"
            >
              <Check className="w-4 h-4" /> Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Recrue rencontrée pendant l'expédition
  const recruitInResult = results.recruitId
    ? (state.pendingRecruits ?? []).find(r => r.id === results.recruitId) ?? null
    : null;

  // Survivors who went on this expedition
  const survivors = expedition.survivorIds
    .map(id => state.survivors.find(s => s.id === id))
    .filter(Boolean) as typeof state.survivors;

  // Effective scavenging per survivor (base + equipment bonuses)
  const survScav = survivors.map(s =>
    s.skills.scavenging
    + (s.equipment.backpack?.stats.scavenging || 0)
    + (s.equipment.weapon?.stats.scavenging   || 0)
  );
  const survCombat = survivors.map(s =>
    s.skills.combat
    + (s.equipment.weapon?.stats.combat || 0)
    + (s.equipment.armor?.stats.combat  || 0)
  );
  const totalScav = survScav.reduce((a, b) => a + b, 0) || 1;

  // Proportional resource share per survivor
  const survResources = survivors.map((_, i) => {
    const share = survScav[i] / totalScav;
    const res: Record<string, number> = {};
    for (const [k, v] of Object.entries(results.resources)) {
      const qty = Math.round(v * share);
      if (qty > 0) res[k] = qty;
    }
    return res;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-amber-500 font-mono">Rapport d'Expédition</h2>
            <p className="text-xs text-zinc-400 font-mono">{zone?.name || 'Zone inconnue'}</p>
            {catDef && (
              <p className="text-[10px] font-mono mt-0.5" style={{ color: catDef.color }}>
                {catDef.name}
              </p>
            )}
          </div>
          <button onClick={collectResults} className="text-zinc-500 hover:text-zinc-300 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">

          {/* Events */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-zinc-300 font-mono flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Événements
            </h3>
            {results.events.map((event, i) => (
              <div key={i} className="flex items-start gap-2 text-xs font-mono">
                <ChevronRight className="w-3 h-3 text-zinc-600 mt-0.5 flex-shrink-0" />
                <span className={
                  event.includes('attaqué')  ? 'text-red-400'    :
                  event.includes('repoussé') ? 'text-green-400'  :
                  event.includes('vide')     ? 'text-yellow-400' : 'text-zinc-300'
                }>{event}</span>
              </div>
            ))}
          </div>

          {/* Per-survivor breakdown */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-zinc-300 font-mono">Bilan par survivant</h3>
            {survivors.map((s, i) => {
              const damage  = results.survivorDamage[s.id];
              const scav    = survScav[i];
              const combat  = survCombat[i];
              const share   = Math.round((scav / totalScav) * 100);
              const myRes   = survResources[i];
              const scavBase  = s.skills.scavenging;
              const scavBonus = scav - scavBase;
              const combatBase  = s.skills.combat;
              const combatBonus = combat - combatBase;

              return (
                <div key={s.id} className="bg-zinc-800/50 border border-zinc-700/40 rounded-lg p-3 space-y-2">
                  {/* Name + trait */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200 font-mono">{s.name}</span>
                    <span className="text-[10px] font-mono text-amber-500/70">{s.trait}</span>
                  </div>

                  {/* Stats row */}
                  <div className="flex gap-3 text-[11px] font-mono">
                    <span className="flex items-center gap-1 text-green-400">
                      <Search className="w-3 h-3" />
                      {scavBase}{scavBonus > 0 && <span className="text-amber-400">+{scavBonus}</span>}
                      <span className="text-zinc-600 text-[10px]">= {scav} ({share}%)</span>
                    </span>
                    <span className="flex items-center gap-1 text-red-400">
                      <Sword className="w-3 h-3" />
                      {combatBase}{combatBonus > 0 && <span className="text-amber-400">+{combatBonus}</span>}
                      <span className="text-zinc-600 text-[10px]">= {combat}</span>
                    </span>
                  </div>

                  {/* Resources share */}
                  {Object.keys(myRes).length > 0 ? (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      {Object.entries(myRes).map(([resId, qty]) => {
                        const res = RESOURCES.find(r => r.id === resId);
                        return (
                          <span key={resId} className="text-[11px] font-mono text-green-400">
                            <span className="mr-0.5" style={{ color: res?.color }}>+{qty}</span>
                            <span className="text-zinc-500">{res?.name ?? resId}</span>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-[11px] font-mono text-zinc-600 italic">Aucune ressource récoltée</span>
                  )}

                  {/* Damage */}
                  {damage ? (
                    <span className="text-[11px] font-mono text-red-400 flex items-center gap-1">
                      <Heart className="w-3 h-3" /> -{Math.round(damage)} PV
                      {s.equipment.armor && (
                        <span className="text-zinc-600">
                          (armure absorbée : -{Math.floor((s.equipment.armor.stats.health || 0) * 0.3)} pts)
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-zinc-600">Aucune blessure</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Equipment found (team) */}
          {results.equipment.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-zinc-300 font-mono flex items-center gap-1.5">
                <Cog className="w-4 h-4 text-purple-400" /> Équipement Trouvé
              </h3>
              <div className="space-y-1">
                {results.equipment.map((eq, i) => (
                  <div key={i} className="flex items-center gap-2 bg-zinc-800/50 rounded px-3 py-2">
                    <span className={tierColors[eq.tier]}>{slotIcons[eq.slot]}</span>
                    <span className={`text-xs font-mono ${tierColors[eq.tier]}`}>{eq.name}</span>
                    <span className="text-[10px] text-zinc-600 font-mono">T{eq.tier}</span>
                    <span className="text-[10px] text-zinc-500 font-mono ml-auto">
                      {Object.entries(eq.stats).filter(([,v]) => v).map(([k,v]) => `${statLabels[k] ?? k}+${v}`).join(' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vehicle retrieved (retrieval expedition) */}
          {results.retrievedVehicleTypeId && (() => {
            const def = VEHICLE_DEFS.find(d => d.id === results.retrievedVehicleTypeId);
            return def ? (
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-zinc-300 font-mono flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-green-400" /> Véhicule Récupéré
                </h3>
                <div className="flex items-center gap-2 px-2 py-1.5 rounded border border-green-700/40 bg-green-900/10">
                  <Car className="w-3 h-3 text-green-400" />
                  <span className="text-[11px] font-mono text-green-300 font-bold">{def.name}</span>
                  <span className="text-[10px] font-mono text-zinc-500">réparé et ajouté au garage</span>
                </div>
              </div>
            ) : null;
          })()}

          {/* Bikes found directly */}
          {(results.vehiclesFound ?? []).length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-zinc-300 font-mono flex items-center gap-1.5">
                <Car className="w-4 h-4 text-sky-400" /> Véhicule Ramené
              </h3>
              <div className="space-y-1">
                {results.vehiclesFound!.map((typeId, i) => {
                  const def = VEHICLE_DEFS.find(d => d.id === typeId);
                  return def ? (
                    <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded border border-sky-700/30 bg-sky-900/10">
                      <Car className="w-3 h-3 text-sky-400" />
                      <span className="text-[11px] font-mono text-zinc-300">{def.name}</span>
                      <span className="text-[10px] font-mono text-zinc-600">ajouté directement au garage</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Vehicle markers created */}
          {(results.vehicleMarkersCreated ?? []).length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-zinc-300 font-mono flex items-center gap-1.5">
                <Car className="w-4 h-4 text-amber-500" /> Véhicule(s) Repéré(s)
              </h3>
              <div className="space-y-1">
                {results.vehicleMarkersCreated!.map((typeId, i) => {
                  const def = VEHICLE_DEFS.find(d => d.id === typeId);
                  return def ? (
                    <div key={i} className="flex items-start gap-2 px-2 py-2 rounded border border-amber-700/30 bg-amber-900/10">
                      <Car className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[11px] font-mono text-zinc-300 font-bold">{def.name}</span>
                        <p className="text-[10px] font-mono text-amber-700/70 mt-0.5">
                          Marqueur posé sur la carte — organisez une expédition de récupération
                          {def.repairCost && ` (${def.repairCost.scrap} ferraille · ${def.repairCost.materials} mat. · ${def.repairCost.fuel} carburant)`}
                        </p>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Recrue ramenée par l'équipe */}
          {recruitInResult && (
            <div
              className="rounded-lg border p-3 space-y-2"
              style={{
                backgroundColor: 'rgba(10, 20, 8, 0.80)',
                borderColor: 'rgba(34,197,94,0.45)',
                boxShadow: '0 0 12px rgba(34,197,94,0.08)',
              }}
            >
              <h3 className="text-sm font-bold font-mono flex items-center gap-1.5" style={{ color: '#4ade80' }}>
                <UserPlus className="w-4 h-4" />
                Recrue rencontrée
              </h3>

              <div className="flex items-center gap-3">
                {/* Initiale */}
                <div
                  className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0 text-sm font-bold font-mono"
                  style={{ backgroundColor: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80' }}
                >
                  {recruitInResult.survivor.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-100 font-mono">{recruitInResult.survivor.name}</div>
                  <div className="text-[10px] font-mono uppercase tracking-wide" style={{ color: 'rgba(74,222,128,0.75)' }}>
                    {recruitInResult.survivor.trait}
                  </div>
                </div>
                {/* Stats rapides */}
                <div className="ml-auto flex gap-2 text-[11px] font-mono">
                  <span className="flex items-center gap-0.5 text-red-400">
                    <Sword className="w-3 h-3" />{recruitInResult.survivor.skills.combat}
                  </span>
                  <span className="flex items-center gap-0.5 text-green-400">
                    <Search className="w-3 h-3" />{recruitInResult.survivor.skills.scavenging}
                  </span>
                </div>
              </div>

              <p className="text-xs font-mono text-zinc-400 border-t border-zinc-800/70 pt-2 flex items-start gap-1.5">
                <Users className="w-3.5 h-3.5 text-green-500/60 flex-shrink-0 mt-0.5" />
                Consultez l'onglet <span className="text-green-400 font-bold mx-1">Survivants</span>
                pour accepter ou refuser cette recrue. L'offre expire dans 1 heure.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 p-4">
          <button
            onClick={collectResults}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold font-mono text-sm uppercase tracking-wider transition-colors"
          >
            <Check className="w-4 h-4" /> Collecter et Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpeditionResults;
