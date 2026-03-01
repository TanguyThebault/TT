import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '@/contexts/GameContext';
import { VEHICLE_DEFS, getDangerReduction, getCategoryDef } from '@/data/gameData';
import { FRANCE_PATH } from '@/data/mapData';
import { TILE_GRID, TILE_BY_ID, TILE_SIZE, BASE_TILE_ID, getRadioRange, synthZoneDef } from '@/data/tileMap';
import SurvivorCard from './SurvivorCard';
import { AlertTriangle, Clock, Rocket, Users, Sword, Search, Shield, Car, AlertCircle, Gauge, Volume2, Swords } from 'lucide-react';

const DANGER_COLORS = ['', '#4ade80', '#facc15', '#fb923c', '#f87171', '#ef4444'];
const DANGER_LABELS = ['', 'Faible', 'Modéré', 'Élevé', 'Très Élevé', 'Extrême'];
const TILE_ABBRS: Record<string, string> = {
  sauvage: 'SAU', residentiel: 'RES', industriel: 'IND', militaire: 'MIL', scientifique: 'SCI',
};

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m${s > 0 ? ' ' + s + 's' : ''}`;
  return `${s}s`;
}

const _baseTile = TILE_BY_ID.get(BASE_TILE_ID)!;
const CX = _baseTile.cx, CY = _baseTile.cy;

// ── Component ─────────────────────────────────────────────────────────────────
const ExpeditionMap: React.FC = () => {
  const { state, launchExpedition, viewResults } = useGame();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSurvivors, setSelectedSurvivors] = useState<string[]>([]);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [now, setNow] = useState(Date.now());
  const [view, setView] = useState({ zoom: 1, panX: 0, panY: 0 });
  const svgRef  = useRef<SVGSVGElement>(null);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0, moved: false });

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Wheel zoom centred on cursor (non-passive to allow preventDefault)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const sx = (e.clientX - rect.left) / rect.width  * 800;
      const sy = (e.clientY - rect.top)  / rect.height * 620;
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      setView(v => {
        const newZoom = Math.min(6, Math.max(0.5, v.zoom * factor));
        return {
          zoom: newZoom,
          panX: sx - (sx - v.panX) / v.zoom * newZoom,
          panY: sy - (sy - v.panY) / v.zoom * newZoom,
        };
      });
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, []);

  const onMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY,
                        panX: view.panX, panY: view.panY, moved: false };
  };
  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragRef.current.active) return;
    const rect = svgRef.current!.getBoundingClientRect();
    const dx = (e.clientX - dragRef.current.startX) / rect.width  * 800;
    const dy = (e.clientY - dragRef.current.startY) / rect.height * 620;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragRef.current.moved = true;
    setView(v => ({ ...v, panX: dragRef.current.panX + dx, panY: dragRef.current.panY + dy }));
  };
  const onMouseUp = () => { dragRef.current.active = false; };

  const handleZoneClick = (tileId: string) => {
    if (dragRef.current.moved) return;
    setSelectedId(prev => prev === tileId ? null : tileId);
  };

  const watchtowerLevel = state.buildings['watchtower'] || 0;
  const dangerReduction = getDangerReduction(watchtowerLevel);

  const radioLevel = state.buildings['radio'] || 0;
  const maxRange   = getRadioRange(radioLevel);

  // ── Véhicules disponibles (pas en expédition active) ─────────────────────
  const vehiclesInUse = new Set(
    state.expeditions.filter(e => !e.completed).flatMap(e => e.vehicleIds ?? [])
  );
  const availableVehicles = state.garageVehicles.filter(v => !vehiclesInUse.has(v.id));

  // ── Calcul de vitesse basé sur les véhicules sélectionnés ────────────────
  const embarkedVehicles = selectedVehicleIds
    .map(id => availableVehicles.find(v => v.id === id))
    .filter(Boolean) as typeof availableVehicles;
  const totalSeats = embarkedVehicles.reduce((sum, v) => sum + v.spaces, 0);
  const allSeated  = selectedSurvivors.length === 0 || totalSeats >= selectedSurvivors.length;
  const effectiveSpeed = (() => {
    if (!allSeated || embarkedVehicles.length === 0) return 0;
    const speeds = embarkedVehicles.map(v => VEHICLE_DEFS.find(d => d.id === v.type)?.speed ?? 0);
    return Math.min(...speeds);
  })();

  const maxVehicleNoise    = embarkedVehicles.reduce((max, v) => Math.max(max, VEHICLE_DEFS.find(d => d.id === v.type)?.noise  ?? 0), 0);
  const totalVehicleCombat = embarkedVehicles.reduce((sum, v) => sum + (VEHICLE_DEFS.find(d => d.id === v.type)?.combat ?? 0), 0);

  const availableSurvivors = state.survivors.filter(s => s.status === 'available');

  // Team cumulative stats
  const selectedSurvivorObjects = state.survivors.filter(s => selectedSurvivors.includes(s.id));
  const teamCombat = selectedSurvivorObjects.reduce((sum, s) =>
    sum + s.skills.combat
      + (s.equipment.weapon?.stats.combat || 0)
      + (s.equipment.armor?.stats.combat  || 0), 0);
  const teamScavenging = selectedSurvivorObjects.reduce((sum, s) =>
    sum + s.skills.scavenging
      + (s.equipment.backpack?.stats.scavenging || 0)
      + (s.equipment.weapon?.stats.scavenging   || 0), 0);
  const scavBonusPct = Math.round(teamScavenging * 5);
  const avgArmorAbsorption = selectedSurvivorObjects.length > 0
    ? Math.floor(
        selectedSurvivorObjects.reduce((sum, s) =>
          sum + Math.floor((s.equipment.armor?.stats.health || 0) * 0.3), 0)
        / selectedSurvivorObjects.length
      )
    : 0;

  const activeExps    = state.expeditions.filter(e => !e.completed);
  const completedExps = state.expeditions.filter(e => e.completed);

  // ── Selected tile / zone ──────────────────────────────────────────────────
  const selectedTile   = selectedId ? (TILE_BY_ID.get(selectedId) ?? null) : null;
  const selectedZone   = selectedTile ? synthZoneDef(selectedTile) : null;
  const selectedCatDef = selectedTile ? getCategoryDef(selectedTile.category) : null;
  const selectedDur    = selectedZone ? Math.floor(selectedZone.baseDuration * (1 - effectiveSpeed)) : 0;

  const foodCost = selectedDur > 0 && selectedSurvivors.length > 0
    ? Math.max(1, Math.ceil((selectedDur / 60) * selectedSurvivors.length))
    : 0;
  const hasEnoughFood = (state.resources['food'] || 0) >= foodCost;

  const handleLaunch = () => {
    if (!selectedId || selectedSurvivors.length === 0 || !hasEnoughFood) return;
    launchExpedition(selectedId, selectedSurvivors, selectedVehicleIds);
    setSelectedId(null);
    setSelectedSurvivors([]);
    setSelectedVehicleIds([]);
  };

  const toggleVehicle = (vehicleId: string) => {
    setSelectedVehicleIds(prev =>
      prev.includes(vehicleId) ? prev.filter(id => id !== vehicleId) : [...prev, vehicleId]
    );
  };

  return (
    <div className="space-y-3">

      {/* ── Carte SVG tuiles ──────────────────────────────────────────────── */}
      <div className="rounded-lg overflow-hidden border border-zinc-800 shadow-2xl relative">
        <button
          onClick={() => setView({ zoom: 1, panX: 0, panY: 0 })}
          className="absolute top-2 right-2 z-10 text-[10px] font-mono text-zinc-500 hover:text-zinc-300 bg-zinc-900/80 border border-zinc-700/40 rounded px-2 py-1 transition-colors"
        >⟳ réinit.</button>
        <svg ref={svgRef} viewBox="0 0 800 620" className="w-full block"
          style={{ background: '#07070a', cursor: 'grab' }}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove}
          onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        >
          <defs>
            <filter id="em-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="6" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <pattern id="em-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5"/>
            </pattern>
            <radialGradient id="em-vign" cx="50%" cy="54%" r="55%">
              <stop offset="0%" stopColor="#111115" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#000000" stopOpacity="0.92"/>
            </radialGradient>
          </defs>

          {/* Fond grille fixe */}
          <rect width="800" height="620" fill="url(#em-grid)"/>
          <rect width="800" height="620" fill="url(#em-vign)" style={{ pointerEvents: 'none' }}/>

          {/* ── Contenu zoomable ── */}
          <g transform={`translate(${view.panX},${view.panY}) scale(${view.zoom})`}>

            {/* France fill */}
            <path d={FRANCE_PATH} fill="#0d1117" stroke="#1e2a1e" strokeWidth="1.5" opacity="0.95"/>
            <path d={FRANCE_PATH} fill="none" stroke="#2a3a2a" strokeWidth="1" opacity="0.6"
              style={{ pointerEvents: 'none' }}/>

            {/* Cercle de portée radio */}
            {maxRange < 999 && (
              <circle cx={CX} cy={CY} r={maxRange}
                fill="none" stroke="rgba(245,158,11,0.10)" strokeWidth="0.8"
                strokeDasharray="4 5" style={{ pointerEvents: 'none' }}/>
            )}

            {/* Grille de tuiles */}
            {TILE_GRID.map(tile => {
              if (tile.id === BASE_TILE_ID) {
                return (
                  <g key={tile.id} style={{ pointerEvents: 'none' }}>
                    <rect x={tile.x} y={tile.y}
                      width={TILE_SIZE - 1} height={TILE_SIZE - 1} rx="1"
                      fill="#1c1008" stroke="#f59e0b" strokeWidth="1.5"/>
                    <text x={tile.cx} y={tile.cy + 2.5}
                      textAnchor="middle" fill="#f59e0b" fontSize="4"
                      fontFamily="monospace" fontWeight="bold"
                      style={{ pointerEvents: 'none' }}>BASE</text>
                  </g>
                );
              }
              const inRange    = tile.distanceFromBase <= maxRange;
              if (!inRange) {
                return (
                  <rect key={tile.id} x={tile.x} y={tile.y}
                    width={TILE_SIZE - 1} height={TILE_SIZE - 1} rx="1"
                    fill="#040407" stroke="#0d0d16" strokeWidth="0.3"
                    style={{ pointerEvents: 'none' }}/>
                );
              }
              const discovered = state.discoveredTiles.includes(tile.id);
              const sel        = selectedId === tile.id;
              const hasActive  = activeExps.some(e => e.zoneId === tile.id);
              const hasDone    = completedExps.some(e => e.zoneId === tile.id);
              const catDef     = getCategoryDef(tile.category)!;
              return (
                <rect key={tile.id} x={tile.x} y={tile.y}
                  width={TILE_SIZE - 1} height={TILE_SIZE - 1} rx="1"
                  fill={discovered ? catDef.color + '28' : '#080810'}
                  stroke={sel ? '#f59e0b' : hasDone ? '#f59e0b55' : hasActive ? '#60a5fa55' : '#15151f'}
                  strokeWidth={sel || hasActive || hasDone ? 1.2 : 0.4}
                  onClick={() => handleZoneClick(tile.id)}
                  style={{ cursor: 'pointer' }}
                />
              );
            })}

            {/* Abréviations sur tuiles découvertes */}
            {TILE_GRID.map(tile => {
              if (tile.id === BASE_TILE_ID) return null;
              if (!state.discoveredTiles.includes(tile.id)) return null;
              const catDef = getCategoryDef(tile.category)!;
              return (
                <text key={`l-${tile.id}`} x={tile.cx} y={tile.cy + 3}
                  textAnchor="middle" fill={catDef.color} fontSize="4.5"
                  fontFamily="monospace" opacity="0.7"
                  style={{ pointerEvents: 'none' }}>
                  {TILE_ABBRS[tile.category]}
                </text>
              );
            })}

            {/* Marqueurs expéditions */}
            {[...activeExps, ...completedExps].map(exp => {
              const tile = TILE_BY_ID.get(exp.zoneId);
              if (!tile) return null;
              const elapsed  = (now - exp.startTime) / 1000;
              const progress = Math.min(1, elapsed / exp.duration);
              const done  = exp.completed;
              const phase = progress < 1/3 ? 1 : progress < 2/3 ? 2 : 3;
              let mx: number, my: number;
              if (done)             { mx = tile.cx; my = tile.cy; }
              else if (phase === 1) { const p = progress*3;       mx = CX+(tile.cx-CX)*p; my = CY+(tile.cy-CY)*p; }
              else if (phase === 2) { mx = tile.cx; my = tile.cy; }
              else                  { const p = (progress-2/3)*3; mx = tile.cx+(CX-tile.cx)*p; my = tile.cy+(CY-tile.cy)*p; }
              const col = (done || phase === 3) ? '#f59e0b' : '#60a5fa';
              const n = state.survivors.filter(s => exp.survivorIds.includes(s.id)).length;
              return (
                <g key={`xp-${exp.id}`} style={{ pointerEvents: 'none' }}>
                  <circle cx={mx} cy={my} r="1.5" fill="none" stroke={col} strokeWidth="0.6" opacity="0">
                    <animate attributeName="r"       values="1.5;4;1.5" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx={mx} cy={my} r="1" fill={col} opacity="0.9"/>
                  <text x={mx+2.5} y={my-1.5} fill={col} fontSize="4.5" fontFamily="monospace" opacity="0.8">{n}s</text>
                </g>
              );
            })}

          </g>{/* ── Fin contenu zoomable ── */}

          {/* Overlays fixes */}
          <text x="12" y="18" fill="#28282e" fontSize="9" fontFamily="monospace" letterSpacing="1"
            style={{ pointerEvents: 'none' }}>CARTE TACTIQUE — COMMANDEMENT</text>

          <g transform="translate(12,608)" style={{ pointerEvents: 'none' }}>
            <circle cx="5" cy="0" r="4" fill="#60a5fa"/>
            <text x="14" y="4" fill="#46465a" fontSize="8" fontFamily="monospace">En mission</text>
            <circle cx="84" cy="0" r="4" fill="#f59e0b"/>
            <text x="93" y="4" fill="#46465a" fontSize="8" fontFamily="monospace">Retour base</text>
          </g>

          <g transform="translate(764,568)" style={{ pointerEvents: 'none' }}>
            <circle cx="0" cy="0" r="18" fill="rgba(0,0,0,0.6)" stroke="#26262e" strokeWidth="1"/>
            <line x1="0" y1="-12" x2="0" y2="12" stroke="#3a3a48" strokeWidth="1"/>
            <line x1="-12" y1="0" x2="12" y2="0" stroke="#3a3a48" strokeWidth="1"/>
            <polygon points="0,-12 -3,-4 0,-7 3,-4" fill="#f59e0b"/>
            <text x="0" y="-15" textAnchor="middle" fill="#565668" fontSize="8" fontFamily="monospace">N</text>
          </g>
        </svg>
      </div>

      {/* ── Panneau de tuile sélectionnée ───────────────────────────────── */}
      {selectedTile && selectedZone && selectedCatDef && selectedTile.distanceFromBase <= maxRange && (() => {
        const discovered = state.discoveredTiles.includes(selectedTile.id);
        return (
        <div className="bg-zinc-900/90 rounded-lg p-4 space-y-3 border"
          style={{ borderColor: discovered ? `${selectedCatDef.color}55` : '#3f3f46' }}>

          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-zinc-100 font-mono tracking-wide">
                {discovered ? selectedCatDef.name : <span className="text-zinc-500">Zone inconnue</span>}
                <span className="text-zinc-500 text-xs ml-2 font-normal">
                  [{selectedTile.lat.toFixed(2)}°N, {selectedTile.lon.toFixed(2)}°E]
                </span>
              </h3>
              {discovered && (
                <p className="text-xs text-zinc-400 mt-0.5">{selectedCatDef.description}</p>
              )}
            </div>
            <button
              onClick={() => { setSelectedId(null); setSelectedSurvivors([]); setSelectedVehicleIds([]); }}
              className="text-zinc-600 hover:text-zinc-300 transition-colors ml-4 shrink-0 text-xs font-mono"
            >✕</button>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-mono">
            {discovered ? (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800/80 border border-zinc-700/50"
                style={{ color: DANGER_COLORS[selectedTile.dangerLevel] }}>
                <AlertTriangle className="w-3 h-3"/>
                {DANGER_LABELS[selectedTile.dangerLevel]}
                {dangerReduction > 0 && (
                  <span className="text-green-400 ml-1">-{Math.round(dangerReduction * 100)}%</span>
                )}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800/80 border border-zinc-700/50 text-zinc-600">
                <AlertTriangle className="w-3 h-3"/>
                Danger inconnu
              </span>
            )}
            <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800/80 border border-zinc-700/50 text-blue-400">
              <Clock className="w-3 h-3"/>
              {formatTime(selectedDur)}
              {effectiveSpeed > 0 && (
                <span className="text-green-400 ml-1">-{Math.round(effectiveSpeed * 100)}%</span>
              )}
            </span>
          </div>

          <div className="text-xs font-mono text-zinc-500">
            <span className="text-zinc-600 text-[10px] uppercase tracking-wider">Butin : </span>
            {state.discoveredTiles.includes(selectedTile.id)
              ? selectedCatDef.categoryLootTable.map(l => l.name).join(', ')
              : <span className="text-zinc-600 italic">Inconnu — envoyez une expédition pour explorer</span>
            }
          </div>

          <div>
            <div className="text-xs font-mono text-zinc-400 mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5"/>
              Survivants à envoyer
              {selectedSurvivors.length > 0 && (
                <span className="text-amber-400 ml-1">
                  ({selectedSurvivors.length} sélectionné{selectedSurvivors.length > 1 ? 's' : ''})
                </span>
              )}
            </div>
            {availableSurvivors.length === 0 ? (
              <p className="text-xs text-zinc-600 italic font-mono bg-zinc-900/40 rounded p-3">
                Aucun survivant disponible.
              </p>
            ) : (
              <div className="space-y-2">
                {availableSurvivors.map((s, index) => (
                  <div
                    key={s.id}
                    className="wl-roster-in relative"
                    style={{ animationDelay: `${index * 38}ms` }}
                  >
                    <div className="wl-roster-sweep" style={{ animationDelay: `${index * 38}ms` }} />
                    <SurvivorCard
                      survivor={s} selectable
                      selected={selectedSurvivors.includes(s.id)}
                      onToggleSelect={() =>
                        setSelectedSurvivors(prev =>
                          prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id]
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Sélection de véhicules ────────────────────────────────── */}
          {availableVehicles.length > 0 && (
            <div>
              <div className="text-xs font-mono text-zinc-400 mb-2 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5"/>
                Véhicules à emmener
                <span className="text-zinc-600 text-[10px]">(optionnel)</span>
                {selectedVehicleIds.length > 0 && (
                  <span className="text-amber-400 ml-1">
                    ({selectedVehicleIds.length} sélectionné{selectedVehicleIds.length > 1 ? 's' : ''})
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {availableVehicles.map(vehicle => {
                  const vDef   = VEHICLE_DEFS.find(d => d.id === vehicle.type);
                  const sel    = selectedVehicleIds.includes(vehicle.id);
                  const accent = sel ? '#f59e0b' : 'rgba(113,113,122,0.6)';
                  const vNoise  = vDef?.noise  ?? 0;
                  const vCombat = vDef?.combat ?? 0;
                  return (
                    <button
                      key={vehicle.id}
                      onClick={() => toggleVehicle(vehicle.id)}
                      className="flex items-start justify-between px-2.5 py-2 rounded border text-left transition-all"
                      style={{
                        backgroundColor: sel ? 'rgba(245,158,11,0.12)' : 'rgba(15,15,20,0.7)',
                        borderColor: sel ? 'rgba(245,158,11,0.5)' : 'rgba(63,63,70,0.5)',
                      }}
                    >
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-mono font-bold" style={{ color: accent }}>
                          {vehicle.name}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-600">
                          {vehicle.spaces} place{vehicle.spaces > 1 ? 's' : ''}
                        </div>
                        <div className="flex gap-1.5 items-center">
                          <span className="flex gap-0.5">
                            {Array.from({ length: 4 }).map((_, i) => (
                              <span key={i} className="w-1 h-1 rounded-full inline-block"
                                style={{ backgroundColor: i < vNoise ? '#f97316' : 'rgba(60,60,60,0.6)' }}
                              />
                            ))}
                          </span>
                          {vCombat > 0 && (
                            <span className="text-[9px] font-mono text-red-400">⚔ +{vCombat}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] font-mono font-bold" style={{ color: accent }}>
                          <Gauge className="w-2.5 h-2.5 inline mr-0.5"/>
                          {vDef ? `${Math.round(vDef.speed * 100)}%` : '—'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Avertissement si quelqu'un marche */}
              {selectedSurvivors.length > 0 && selectedVehicleIds.length > 0 && !allSeated && (
                <div className="mt-2 flex items-start gap-1.5 text-[10px] font-mono text-amber-500/80 bg-amber-900/15 border border-amber-700/20 rounded px-2.5 py-2">
                  <AlertCircle className="w-3 h-3 shrink-0 mt-0.5"/>
                  <span>
                    {totalSeats} place{totalSeats > 1 ? 's' : ''} pour {selectedSurvivors.length} survivants —
                    certains marchent à pied → le groupe roule à vitesse de marche → <strong>aucun bonus de vitesse</strong>.
                  </span>
                </div>
              )}

              {/* Résumé vitesse effective */}
              {selectedSurvivors.length > 0 && selectedVehicleIds.length > 0 && allSeated && effectiveSpeed > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-green-400/80 bg-green-900/10 border border-green-700/20 rounded px-2.5 py-2">
                  <Gauge className="w-3 h-3 shrink-0"/>
                  <span>
                    Tous embarqués — vitesse effective :
                    <strong className="ml-1 text-green-400">-{Math.round(effectiveSpeed * 100)}% durée</strong>
                    {(() => {
                      const slowest = embarkedVehicles.reduce((min, v) => {
                        const s = VEHICLE_DEFS.find(d => d.id === v.type)?.speed ?? 0;
                        return s < (VEHICLE_DEFS.find(d => d.id === min.type)?.speed ?? 0) ? v : min;
                      });
                      return <span className="text-zinc-500 ml-1">(limité par {slowest.name})</span>;
                    })()}
                  </span>
                </div>
              )}

              {/* Résumé bruit */}
              {selectedVehicleIds.length > 0 && maxVehicleNoise > 0 && (
                <div className={`mt-1.5 flex items-center gap-1.5 text-[10px] font-mono rounded px-2.5 py-2 border ${
                  maxVehicleNoise >= 3
                    ? 'text-orange-400/80 bg-orange-900/10 border-orange-700/20'
                    : 'text-yellow-600/80 bg-yellow-900/10 border-yellow-800/20'
                }`}>
                  <Volume2 className="w-3 h-3 shrink-0"/>
                  <span>
                    Bruit du convoi : niveau {maxVehicleNoise}/4 →
                    <strong className="ml-1" style={{ color: maxVehicleNoise >= 3 ? '#f97316' : '#ca8a04' }}>
                      +{Math.round(maxVehicleNoise * 25)}% risque de combat
                    </strong>
                    {maxVehicleNoise >= 3 && <span className="text-zinc-500 ml-1">(convoi très bruyant)</span>}
                  </span>
                </div>
              )}

              {/* Résumé combat véhicule */}
              {selectedVehicleIds.length > 0 && totalVehicleCombat > 0 && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-mono text-red-400/80 bg-red-900/10 border border-red-700/20 rounded px-2.5 py-2">
                  <Swords className="w-3 h-3 shrink-0"/>
                  <span>
                    Combat véhicule :
                    <strong className="ml-1 text-red-400">+{totalVehicleCombat}</strong>
                    <span className="text-zinc-500 ml-1">(armement du 4×4 blindé)</span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Team cumulative stats */}
          {selectedSurvivors.length > 0 && (
            <div className="bg-zinc-800/40 border border-zinc-700/40 rounded-lg p-3 space-y-2">
              <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
                Équipe sélectionnée — {selectedSurvivors.length} survivant{selectedSurvivors.length > 1 ? 's' : ''}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center gap-0.5 bg-zinc-900/50 rounded p-2">
                  <div className="flex items-center gap-1 text-[10px] font-mono text-red-400/80">
                    <Sword className="w-3 h-3"/>Combat
                  </div>
                  <span className="text-base font-bold font-mono text-red-400">{teamCombat}</span>
                  <span className="text-[9px] font-mono text-zinc-600">résistance attaque</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 bg-zinc-900/50 rounded p-2">
                  <div className="flex items-center gap-1 text-[10px] font-mono text-green-400/80">
                    <Search className="w-3 h-3"/>Pillage
                  </div>
                  <span className="text-base font-bold font-mono text-green-400">{teamScavenging}</span>
                  <span className="text-[9px] font-mono text-amber-400">+{scavBonusPct}% butin</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 bg-zinc-900/50 rounded p-2">
                  <div className="flex items-center gap-1 text-[10px] font-mono text-blue-400/80">
                    <Shield className="w-3 h-3"/>Armure
                  </div>
                  <span className="text-base font-bold font-mono text-blue-400">
                    {avgArmorAbsorption > 0 ? `-${avgArmorAbsorption}` : '—'}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-600">
                    {avgArmorAbsorption > 0 ? 'dmg/surv. moy.' : 'aucune armure'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleLaunch}
            disabled={selectedSurvivors.length === 0 || !hasEnoughFood}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold font-mono uppercase tracking-wider transition-all ${
              selectedSurvivors.length > 0 && hasEnoughFood
                ? 'bg-amber-600 hover:bg-amber-500 text-black shadow-lg shadow-amber-900/30'
                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            <Rocket className="w-4 h-4"/>
            Lancer ({formatTime(selectedDur)})
            {selectedSurvivors.length > 0 && (
              <span className={`text-xs font-mono ml-1 ${hasEnoughFood ? 'opacity-70' : 'text-red-400 opacity-100'}`}>
                — {foodCost} 🍎 {!hasEnoughFood && '(insuffisant)'}
              </span>
            )}
          </button>
        </div>
        );
      })()}

      {/* ── Expéditions terminées ─────────────────────────────────────────── */}
      {completedExps.length > 0 && (
        <div className="space-y-2">
          {completedExps.map(exp => {
            const tile      = TILE_BY_ID.get(exp.zoneId);
            const zoneName  = tile ? synthZoneDef(tile).name : exp.zoneId;
            const survivors = state.survivors.filter(s => exp.survivorIds.includes(s.id));
            return (
              <div key={exp.id} onClick={() => viewResults(exp)}
                className="bg-zinc-900/60 border border-amber-600/40 rounded-lg p-3 cursor-pointer hover:border-amber-500 hover:shadow-lg hover:shadow-amber-900/20 transition-all flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-mono">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"/>
                  <span className="font-bold text-amber-400">{zoneName}</span>
                  <span className="text-zinc-500 text-xs flex items-center gap-1">
                    <Users className="w-3 h-3"/>
                    {survivors.map(s => s.name.split(' ')[0]).join(', ')}
                  </span>
                </div>
                <span className="text-xs font-mono text-amber-400 animate-pulse font-bold shrink-0">
                  → RÉSULTATS
                </span>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default ExpeditionMap;
