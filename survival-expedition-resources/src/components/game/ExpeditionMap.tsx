import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '@/contexts/GameContext';
import { ZONES, BUILDINGS, RESOURCES, getExpeditionDurationMultiplier, getDangerReduction, getUpgradeCost, type ZoneDef, type BuildingDef } from '@/data/gameData';
import SurvivorCard from './SurvivorCard';
import { AlertTriangle, Clock, Rocket, Users, Lock, Sword, Search, Shield } from 'lucide-react';

// ── Map layout ────────────────────────────────────────────────────────────────
const CX = 400, CY = 280;
const MIN_R = 75, MAX_R = 175, MAX_BASE_DUR = 900;

// Per-zone visual config: angle in degrees (0=East, CCW), env blob color, pin border, map label
const ZONE_META: Record<string, {
  angle: number;
  envColor: string;
  strokeColor: string;
  abbr: string;
  mapName: string;
}> = {
  suburbs:        { angle: 55,  envColor: '#7a6040', strokeColor: '#b08a50', abbr: 'BNL', mapName: 'Banlieue'    },
  urban_ruins:    { angle: 130, envColor: '#3d5270', strokeColor: '#5b7aad', abbr: 'RUI', mapName: 'Ruines Urb.' },
  military_base:  { angle: 18,  envColor: '#2a5e2a', strokeColor: '#4a9452', abbr: 'MIL', mapName: 'Base Mil.'   },
  hospital:       { angle: 245, envColor: '#5a7a30', strokeColor: '#8ab048', abbr: 'HOP', mapName: 'Hôpital'     },
  industrial:     { angle: 200, envColor: '#8a3818', strokeColor: '#c45828', abbr: 'IND', mapName: 'Industriel'  },
  laboratory:     { angle: 305, envColor: '#4a1a78', strokeColor: '#8040c8', abbr: 'LAB', mapName: 'Laboratoire' },
  signal_contact: { angle: 165, envColor: '#1a5a6a', strokeColor: '#28a8c8', abbr: 'SIG', mapName: 'Fréquence'   },
  forest:         { angle: 90,  envColor: '#1a4a1a', strokeColor: '#3aaa3a', abbr: 'FOR', mapName: 'Forêt'        },
};

const DANGER_COLORS = ['', '#4ade80', '#facc15', '#fb923c', '#f87171', '#ef4444'];
const DANGER_LABELS = ['', 'Faible', 'Modéré', 'Élevé', 'Très Élevé', 'Extrême'];

function getZonePos(id: string, baseDuration: number): { x: number; y: number } {
  const m = ZONE_META[id];
  if (!m) return { x: CX, y: CY };
  const r = MIN_R + (baseDuration / MAX_BASE_DUR) * (MAX_R - MIN_R);
  const rad = (m.angle * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY - r * Math.sin(rad) };
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m${s > 0 ? ' ' + s + 's' : ''}`;
  return `${s}s`;
}

// ── Locked zone detail panel ───────────────────────────────────────────────────
interface LockedZonePanelProps {
  zone: ZoneDef;
  bld: BuildingDef | undefined;
  req: { buildingId: string; level: number };
  currentBldLevel: number;
  levelsNeeded: number[];
  allCosts: Record<string, number>;
  unlockedZones: ZoneDef[];
  resources: Record<string, number>;
  onClose: () => void;
}

const LockedZonePanel: React.FC<LockedZonePanelProps> = ({
  zone, bld, req, currentBldLevel, allCosts, resources, onClose,
}) => {
  const meta = ZONE_META[zone.id];
  return (
    <div className="bg-zinc-900/90 rounded-lg p-4 space-y-3 border border-zinc-700/50"
      style={meta ? { borderColor: `${meta.strokeColor}33` } : undefined}>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-zinc-500 shrink-0"/>
          <div>
            <h3 className="font-bold text-zinc-400 font-mono tracking-wide">{zone.name}</h3>
            <p className="text-xs text-zinc-600 mt-0.5">{zone.description}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-600 hover:text-zinc-300 transition-colors ml-4 shrink-0 text-xs font-mono"
        >✕</button>
      </div>

      <div className="bg-zinc-800/60 rounded p-3 border border-zinc-700/40 space-y-1.5">
        <p className="text-xs font-mono text-zinc-400">
          <span className="text-amber-500/80">Condition de déblocage :</span>
          {' '}{bld?.name ?? req.buildingId} niveau {req.level}
        </p>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-zinc-500">Niveau actuel :</span>
          <span className={currentBldLevel >= req.level ? 'text-green-400' : 'text-red-400'}>
            {currentBldLevel}
          </span>
          <span className="text-zinc-600">/ {req.level} requis</span>
        </div>
      </div>

      {Object.keys(allCosts).length > 0 && (
        <div>
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-2">
            Ressources nécessaires pour débloquer
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(allCosts).map(([resId, amount]) => {
              const resDef = RESOURCES.find(r => r.id === resId);
              const hasEnough = (resources[resId] || 0) >= amount;
              return (
                <span key={resId} className={`px-2 py-1 rounded text-xs font-mono border ${
                  hasEnough
                    ? 'bg-green-900/20 border-green-700/40 text-green-400'
                    : 'bg-red-900/20 border-red-700/40 text-red-400'
                }`}>
                  {resDef?.name ?? resId} : {resources[resId] || 0}/{amount}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────
const ExpeditionMap: React.FC = () => {
  const { state, launchExpedition, viewResults } = useGame();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSurvivors, setSelectedSurvivors] = useState<string[]>([]);
  const [now, setNow] = useState(Date.now());
  const [view, setView] = useState({ zoom: 1, panX: 0, panY: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0, moved: false });

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Non-passive wheel listener to allow preventDefault (blocks page scroll)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const sx = (e.clientX - rect.left) / rect.width * 800;
      const sy = (e.clientY - rect.top) / rect.height * 520;
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      setView(v => {
        const newZoom = Math.min(4, Math.max(0.5, v.zoom * factor));
        return {
          zoom: newZoom,
          panX: sx - ((sx - v.panX) / v.zoom) * newZoom,
          panY: sy - ((sy - v.panY) / v.zoom) * newZoom,
        };
      });
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, []);

  const onMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, panX: view.panX, panY: view.panY, moved: false };
  };

  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragRef.current.active) return;
    const rect = svgRef.current!.getBoundingClientRect();
    const dx = (e.clientX - dragRef.current.startX) / rect.width * 800;
    const dy = (e.clientY - dragRef.current.startY) / rect.height * 520;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
    setView(v => ({ ...v, panX: dragRef.current.panX + dx, panY: dragRef.current.panY + dy }));
  };

  const onMouseUp = () => { dragRef.current.active = false; };

  const handleZoneClick = (zoneId: string) => {
    if (dragRef.current.moved) return;
    setSelectedId(prev => prev === zoneId ? null : zoneId);
  };

  const garageLevel    = state.buildings['garage']     || 0;
  const watchtowerLevel = state.buildings['watchtower'] || 0;
  const durationMult   = getExpeditionDurationMultiplier(garageLevel);
  const dangerReduction = getDangerReduction(watchtowerLevel);

  const availableSurvivors = state.survivors.filter(s => s.status === 'available');

  // Team cumulative stats — mirrors the exact formulas in generateExpeditionResults
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

  const selectedZone = selectedId ? (ZONES.find(z => z.id === selectedId) ?? null) : null;
  const selectedMeta = selectedId ? (ZONE_META[selectedId] ?? null)                : null;
  const selectedDur  = selectedZone ? Math.floor(selectedZone.baseDuration * durationMult) : 0;
  const isSelectedLocked = selectedZone?.requiredBuildingLevel
    ? (state.buildings[selectedZone.requiredBuildingLevel.buildingId] || 0) < selectedZone.requiredBuildingLevel.level
    : false;

  const foodCost = selectedDur > 0 && selectedSurvivors.length > 0
    ? Math.max(1, Math.ceil((selectedDur / 60) * selectedSurvivors.length))
    : 0;
  const hasEnoughFood = (state.resources['food'] || 0) >= foodCost;

  const handleLaunch = () => {
    if (!selectedId || selectedSurvivors.length === 0 || !hasEnoughFood) return;
    launchExpedition(selectedId, selectedSurvivors);
    setSelectedId(null);
    setSelectedSurvivors([]);
  };

  return (
    <div className="space-y-3">

      {/* ── Tactical Map SVG ─────────────────────────────────────────────── */}
      <div className="rounded-lg overflow-hidden border border-zinc-800 shadow-2xl relative">
        <button
          onClick={() => setView({ zoom: 1, panX: 0, panY: 0 })}
          className="absolute top-2 right-2 z-10 text-[10px] font-mono text-zinc-500 hover:text-zinc-300 bg-zinc-900/80 border border-zinc-700/40 rounded px-2 py-1 transition-colors"
        >
          ⟳ reset vue
        </button>
        <svg ref={svgRef} viewBox="0 0 800 520" className="w-full block"
          style={{ background: '#07070a', cursor: 'grab' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <defs>
            {/* Blur for environment blobs */}
            <filter id="em-env" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="40"/>
            </filter>
            {/* Glow for base marker */}
            <filter id="em-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="6" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            {/* Tactical grid pattern */}
            <pattern id="em-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5"/>
            </pattern>
            {/* Edge vignette */}
            <radialGradient id="em-vign" cx="50%" cy="54%" r="55%">
              <stop offset="0%" stopColor="#111115" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#000000" stopOpacity="0.92"/>
            </radialGradient>
          </defs>

          {/* Fixed background */}
          <rect width="800" height="520" fill="url(#em-grid)"/>
          <rect width="800" height="520" fill="url(#em-vign)" style={{ pointerEvents: 'none' }}/>

          {/* ── Zoomable / pannable content ── */}
          <g transform={`translate(${view.panX}, ${view.panY}) scale(${view.zoom})`}>

          {/* Environment biome blobs */}
          {ZONES.map(z => {
            const pos = getZonePos(z.id, z.baseDuration);
            const m = ZONE_META[z.id];
            if (!m) return null;
            const locked = z.requiredBuildingLevel
              ? (state.buildings[z.requiredBuildingLevel.buildingId] || 0) < z.requiredBuildingLevel.level
              : false;
            return (
              <g key={`env-${z.id}`}>
                <circle cx={pos.x} cy={pos.y} r={105}
                  fill={m.envColor} opacity={locked ? 0.04 : 0.22} filter="url(#em-env)"/>
                {!locked && (
                  <circle cx={pos.x} cy={pos.y} r={55}
                    fill={m.envColor} opacity={0.14} filter="url(#em-env)"/>
                )}
              </g>
            );
          })}

          {/* Distance rings */}
          {[MIN_R, (MIN_R + MAX_R) * 0.5, MAX_R].map((r, i) => (
            <circle key={i} cx={CX} cy={CY} r={r}
              fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.75" strokeDasharray="3 6"/>
          ))}
          <text x={CX + MIN_R + 4} y={CY + 3}
            fill="rgba(255,255,255,0.09)" fontSize="7" fontFamily="monospace">PROCHE</text>
          <text x={CX + MAX_R + 4} y={CY + 3}
            fill="rgba(255,255,255,0.07)" fontSize="7" fontFamily="monospace">LOIN</text>

          {/* Paths base → zones */}
          {ZONES.map(z => {
            const pos  = getZonePos(z.id, z.baseDuration);
            const locked = z.requiredBuildingLevel
              ? (state.buildings[z.requiredBuildingLevel.buildingId] || 0) < z.requiredBuildingLevel.level
              : false;
            const hasExp = activeExps.some(e => e.zoneId === z.id);
            return (
              <line key={`path-${z.id}`} x1={CX} y1={CY} x2={pos.x} y2={pos.y}
                stroke={hasExp ? 'rgba(96,165,250,0.28)' : locked ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.06)'}
                strokeWidth={hasExp ? 1.5 : 1} strokeDasharray="5 5"/>
            );
          })}

          {/* Expedition markers */}
          {[...activeExps, ...completedExps].map(exp => {
            const zone = ZONES.find(z => z.id === exp.zoneId);
            if (!zone) return null;
            const pos     = getZonePos(zone.id, zone.baseDuration);
            const elapsed = (now - exp.startTime) / 1000;
            const progress = Math.min(1, elapsed / exp.duration);
            const done = exp.completed;
            const mx   = done ? pos.x : CX + (pos.x - CX) * progress;
            const my   = done ? pos.y : CY + (pos.y - CY) * progress;
            const col  = done ? '#f59e0b' : '#60a5fa';
            const n    = state.survivors.filter(s => exp.survivorIds.includes(s.id)).length;
            return (
              <g key={`xp-${exp.id}`}>
                {/* Travelled path */}
                <line x1={CX} y1={CY} x2={mx} y2={my}
                  stroke={col} strokeWidth="1.5" opacity="0.18"/>
                {/* Pulse ring */}
                <circle cx={mx} cy={my} r="8" fill="none" stroke={col} strokeWidth="1.5" opacity="0">
                  <animate attributeName="r"       values="7;17;7"     dur="2s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.7;0;0.7"  dur="2s" repeatCount="indefinite"/>
                </circle>
                {/* Marker dot */}
                <circle cx={mx} cy={my} r="5" fill={col} opacity="0.95"/>
                {/* Survivor count */}
                <text x={mx + 8} y={my - 5}
                  fill={col} fontSize="8" fontFamily="monospace" opacity="0.85">{n}s</text>
              </g>
            );
          })}

          {/* Zone markers */}
          {ZONES.map(z => {
            const pos = getZonePos(z.id, z.baseDuration);
            const m   = ZONE_META[z.id];
            if (!m) return null;
            const locked = z.requiredBuildingLevel
              ? (state.buildings[z.requiredBuildingLevel.buildingId] || 0) < z.requiredBuildingLevel.level
              : false;
            const sel      = selectedId === z.id;
            const hasActive = activeExps.some(e => e.zoneId === z.id);
            const hasDone   = completedExps.some(e => e.zoneId === z.id);
            const dur       = Math.floor(z.baseDuration * durationMult);

            return (
              <g key={`z-${z.id}`}
                onClick={() => handleZoneClick(z.id)}
                style={{ cursor: 'pointer' }}
              >
                {/* Activity ring (animated dash when active) */}
                {(hasActive || hasDone) && (
                  <circle cx={pos.x} cy={pos.y} r="24" fill="none"
                    stroke={hasDone ? '#f59e0b' : '#60a5fa'}
                    strokeWidth="1.5" opacity="0.65"
                    strokeDasharray={hasDone ? '100' : '4 3'}
                  >
                    {!hasDone && (
                      <animate attributeName="stroke-dashoffset"
                        values="0;-28" dur="1s" repeatCount="indefinite"/>
                    )}
                  </circle>
                )}

                {/* Selection ring */}
                {sel && (
                  <circle cx={pos.x} cy={pos.y} r="24" fill="none"
                    stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 3">
                    <animate attributeName="stroke-dashoffset"
                      values="0;16" dur="1.5s" repeatCount="indefinite"/>
                  </circle>
                )}

                {/* Zone circle */}
                <circle cx={pos.x} cy={pos.y} r="17"
                  fill={locked ? '#111115' : `${m.envColor}e0`}
                  stroke={locked ? '#3a3a3e' : sel ? '#f59e0b' : m.strokeColor}
                  strokeWidth={sel ? 2 : 1.5}
                />

                {/* Abbreviation or padlock */}
                {locked ? (
                  <g style={{ pointerEvents: 'none' }}>
                    <rect x={pos.x - 5} y={pos.y - 2} width="10" height="8" rx="1.5" fill="#52525b"/>
                    <path
                      d={`M ${pos.x - 3} ${pos.y - 2} L ${pos.x - 3} ${pos.y - 6} A 3 3 0 0 1 ${pos.x + 3} ${pos.y - 6} L ${pos.x + 3} ${pos.y - 2}`}
                      fill="none" stroke="#52525b" strokeWidth="2"/>
                  </g>
                ) : (
                  <text x={pos.x} y={pos.y + 3.5} textAnchor="middle"
                    fill="#e4e4e7" fontSize="7.5" fontFamily="monospace" fontWeight="bold"
                    style={{ pointerEvents: 'none' }}>
                    {m.abbr}
                  </text>
                )}

                {/* Zone name */}
                <text x={pos.x} y={pos.y + 32} textAnchor="middle"
                  fill={locked ? '#48485a' : sel ? '#fbbf24' : '#74748a'}
                  fontSize="8" fontFamily="monospace"
                  style={{ pointerEvents: 'none' }}>
                  {m.mapName}
                </text>

                {/* Unlock condition (locked) or duration (unlocked) */}
                {locked && z.requiredBuildingLevel ? (() => {
                  const bld = BUILDINGS.find(b => b.id === z.requiredBuildingLevel!.buildingId);
                  return (
                    <text x={pos.x} y={pos.y + 43} textAnchor="middle"
                      fill={sel ? '#6060a0' : '#3e3e58'} fontSize="6.5" fontFamily="monospace"
                      style={{ pointerEvents: 'none' }}>
                      {bld?.name} Nv.{z.requiredBuildingLevel!.level}
                    </text>
                  );
                })() : !locked && (
                  <text x={pos.x} y={pos.y + 43} textAnchor="middle"
                    fill="#36364a" fontSize="7" fontFamily="monospace"
                    style={{ pointerEvents: 'none' }}>
                    {formatTime(dur)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Base (center) */}
          <g filter="url(#em-glow)">
            <circle cx={CX} cy={CY} r="30" fill="none"
              stroke="#78350f" strokeWidth="1" strokeDasharray="3 4" opacity="0.5"/>
            <circle cx={CX} cy={CY} r="23" fill="#1c1917" stroke="#f59e0b" strokeWidth="2"/>
            <circle cx={CX} cy={CY} r="17" fill="#261e1a" stroke="#78350f" strokeWidth="1"/>
            {/* House silhouette */}
            <polygon
              points={`${CX},${CY - 11} ${CX + 9},${CY - 3} ${CX + 9},${CY + 7} ${CX - 9},${CY + 7} ${CX - 9},${CY - 3}`}
              fill="#f59e0b" opacity="0.9"/>
            <polygon
              points={`${CX - 11},${CY - 3} ${CX},${CY - 15} ${CX + 11},${CY - 3}`}
              fill="#f59e0b"/>
            <text x={CX} y={CY + 35} textAnchor="middle"
              fill="#f59e0b" fontSize="9" fontFamily="monospace" fontWeight="bold">BASE</text>
          </g>

          </g>
          {/* ── End zoomable content ── */}

          {/* Fixed overlays (labels, compass) */}
          <text x="12" y="18" fill="#28282e" fontSize="9" fontFamily="monospace" letterSpacing="1"
            style={{ pointerEvents: 'none' }}>
            CARTE TACTIQUE — COMMANDEMENT
          </text>

          <g transform="translate(12, 502)" style={{ pointerEvents: 'none' }}>
            <circle cx="5" cy="0" r="4" fill="#60a5fa"/>
            <text x="14" y="4" fill="#46465a" fontSize="8" fontFamily="monospace">En mission</text>
            <circle cx="82" cy="0" r="4" fill="#f59e0b"/>
            <text x="91" y="4" fill="#46465a" fontSize="8" fontFamily="monospace">Retour base</text>
          </g>

          <g transform="translate(764, 468)" style={{ pointerEvents: 'none' }}>
            <circle cx="0" cy="0" r="18" fill="rgba(0,0,0,0.6)" stroke="#26262e" strokeWidth="1"/>
            <line x1="0" y1="-12" x2="0" y2="12" stroke="#3a3a48" strokeWidth="1"/>
            <line x1="-12" y1="0" x2="12" y2="0" stroke="#3a3a48" strokeWidth="1"/>
            <polygon points="0,-12 -3,-4 0,-7 3,-4" fill="#f59e0b"/>
            <text x="0" y="-15" textAnchor="middle" fill="#565668" fontSize="8" fontFamily="monospace">N</text>
          </g>
        </svg>
      </div>

      {/* ── Zone detail & launch panel ───────────────────────────────────── */}
      {selectedZone && selectedMeta && isSelectedLocked && (() => {
        const req = selectedZone.requiredBuildingLevel!;
        const bld = BUILDINGS.find(b => b.id === req.buildingId)!;
        const currentBldLevel = state.buildings[req.buildingId] || 0;
        const levelsNeeded = Array.from({ length: req.level - currentBldLevel }, (_, i) => currentBldLevel + i);
        const allCosts: Record<string, number> = {};
        levelsNeeded.forEach(lvl => {
          const c = bld ? getUpgradeCost(bld, lvl) : {};
          Object.entries(c).forEach(([k, v]) => { allCosts[k] = (allCosts[k] || 0) + v; });
        });
        const unlockedZones = ZONES.filter(z => {
          const r = z.requiredBuildingLevel;
          return r ? (state.buildings[r.buildingId] || 0) >= r.level : true;
        });
        return (
          <LockedZonePanel
            zone={selectedZone}
            bld={bld}
            req={req}
            currentBldLevel={currentBldLevel}
            levelsNeeded={levelsNeeded}
            allCosts={allCosts}
            unlockedZones={unlockedZones}
            resources={state.resources}
            onClose={() => setSelectedId(null)}
          />
        );
      })()}

      {selectedZone && selectedMeta && !isSelectedLocked && (
        <div className="bg-zinc-900/90 rounded-lg p-4 space-y-3 border"
          style={{ borderColor: `${selectedMeta.strokeColor}55` }}>

          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-zinc-100 font-mono tracking-wide">{selectedZone.name}</h3>
              <p className="text-xs text-zinc-400 mt-0.5">{selectedZone.description}</p>
            </div>
            <button
              onClick={() => { setSelectedId(null); setSelectedSurvivors([]); }}
              className="text-zinc-600 hover:text-zinc-300 transition-colors ml-4 shrink-0 text-xs font-mono"
            >✕</button>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-mono">
            <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800/80 border border-zinc-700/50"
              style={{ color: DANGER_COLORS[selectedZone.dangerLevel] }}>
              <AlertTriangle className="w-3 h-3"/>
              {DANGER_LABELS[selectedZone.dangerLevel]}
              {dangerReduction > 0 && (
                <span className="text-green-400 ml-1">-{Math.round(dangerReduction * 100)}%</span>
              )}
            </span>
            <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800/80 border border-zinc-700/50 text-blue-400">
              <Clock className="w-3 h-3"/>
              {formatTime(selectedDur)}
              {garageLevel > 0 && (
                <span className="text-green-400 ml-1">-{Math.round((1 - durationMult) * 100)}%</span>
              )}
            </span>
          </div>

          <div className="text-xs font-mono text-zinc-500">
            <span className="text-zinc-600 text-[10px] uppercase tracking-wider">Butin : </span>
            {selectedZone.lootTable.map(l => l.name).join(', ')}
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
      )}

      {/* ── Completed expeditions (collect results) ──────────────────────── */}
      {completedExps.length > 0 && (
        <div className="space-y-2">
          {completedExps.map(exp => {
            const zone      = ZONES.find(z => z.id === exp.zoneId);
            const survivors = state.survivors.filter(s => exp.survivorIds.includes(s.id));
            return (
              <div key={exp.id} onClick={() => viewResults(exp)}
                className="bg-zinc-900/60 border border-amber-600/40 rounded-lg p-3 cursor-pointer hover:border-amber-500 hover:shadow-lg hover:shadow-amber-900/20 transition-all flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-mono">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"/>
                  <span className="font-bold text-amber-400">{zone?.name}</span>
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
