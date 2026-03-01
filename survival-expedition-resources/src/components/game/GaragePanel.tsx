import React, { useState } from 'react';
import { X, Car, Bike, Truck, Shield, MapPin, Gauge, Volume2, Swords, Search } from 'lucide-react';
import { useGame, type GarageVehicle } from '@/contexts/GameContext';
import { VEHICLE_DEFS, ZONES, getGarageCapacity } from '@/data/gameData';

// ── Visual config per vehicle type ───────────────────────────────────────────

const VEHICLE_STYLES: Record<string, {
  bg: string; border: string; text: string; accent: string; icon: React.ReactNode;
}> = {
  bike:        { bg: 'bg-sky-900',    border: 'border-sky-600',    text: 'text-sky-300',    accent: '#0ea5e9', icon: <Bike    className="w-3 h-3" /> },
  moto:        { bg: 'bg-yellow-900', border: 'border-yellow-600', text: 'text-yellow-300', accent: '#eab308', icon: <Bike    className="w-3 h-3" /> },
  compact:     { bg: 'bg-blue-900',   border: 'border-blue-600',   text: 'text-blue-300',   accent: '#3b82f6', icon: <Car     className="w-3 h-3" /> },
  sedan:       { bg: 'bg-green-900',  border: 'border-green-600',  text: 'text-green-300',  accent: '#22c55e', icon: <Car     className="w-3 h-3" /> },
  suv:         { bg: 'bg-orange-900', border: 'border-orange-600', text: 'text-orange-300', accent: '#f97316', icon: <Truck   className="w-3 h-3" /> },
  armored_suv: { bg: 'bg-red-900',    border: 'border-red-700',    text: 'text-red-300',    accent: '#ef4444', icon: <Shield  className="w-3 h-3" /> },
};

function getStyle(typeId: string) {
  return VEHICLE_STYLES[typeId] ?? VEHICLE_STYLES['compact'];
}

// ── Top-down SVG silhouettes ──────────────────────────────────────────────────

const BikeSVG: React.FC<{ color: string }> = ({ color }) => (
  <svg viewBox="0 0 24 48" className="w-full h-full" style={{ maxWidth: 24, maxHeight: 48 }}>
    <circle cx="12" cy="10" r="7" fill="none" stroke={color} strokeWidth="2" />
    <circle cx="12" cy="38" r="7" fill="none" stroke={color} strokeWidth="2" />
    <line x1="12" y1="10" x2="12" y2="38" stroke={color} strokeWidth="2" />
    <line x1="7" y1="22" x2="17" y2="22" stroke={color} strokeWidth="1.5" />
  </svg>
);

const MotoSVG: React.FC<{ color: string }> = ({ color }) => (
  <svg viewBox="0 0 32 56" className="w-full h-full" style={{ maxWidth: 32, maxHeight: 56 }}>
    <circle cx="16" cy="10" r="8" fill="none" stroke={color} strokeWidth="2" />
    <circle cx="16" cy="46" r="8" fill="none" stroke={color} strokeWidth="2" />
    <rect x="10" y="18" width="12" height="20" rx="4" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5" />
    <rect x="12" y="20" width="8" height="6" rx="2" fill={color} fillOpacity="0.5" />
  </svg>
);

const CarSVG: React.FC<{ color: string; long?: boolean }> = ({ color, long }) => (
  <svg viewBox="0 0 48 72" className="w-full h-full" style={{ maxWidth: 48, maxHeight: long ? 90 : 72 }}>
    {/* Body */}
    <rect x="4" y="6" width="40" height="60" rx="8" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5" />
    {/* Windshield */}
    <rect x="9" y="12" width="30" height="14" rx="3" fill={color} fillOpacity="0.55" />
    {/* Rear window */}
    <rect x="9" y="46" width="30" height="12" rx="3" fill={color} fillOpacity="0.45" />
    {/* Roof */}
    <rect x="11" y="26" width="26" height="14" rx="2" fill={color} fillOpacity="0.2" />
    {/* Wheels */}
    <rect x="0"  y="10" width="6" height="14" rx="3" fill={color} fillOpacity="0.7" />
    <rect x="42" y="10" width="6" height="14" rx="3" fill={color} fillOpacity="0.7" />
    <rect x="0"  y="48" width="6" height="14" rx="3" fill={color} fillOpacity="0.7" />
    <rect x="42" y="48" width="6" height="14" rx="3" fill={color} fillOpacity="0.7" />
  </svg>
);

const TruckSVG: React.FC<{ color: string; armored?: boolean }> = ({ color, armored }) => (
  <svg viewBox="0 0 56 80" className="w-full h-full" style={{ maxWidth: 56, maxHeight: 80 }}>
    {/* Body */}
    <rect x="3" y="5" width="50" height="70" rx="6" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="2" />
    {/* Windshield */}
    <rect x="9" y="10" width="38" height="15" rx="3" fill={color} fillOpacity="0.55" />
    {/* Rear window */}
    <rect x="9" y="54" width="38" height="13" rx="3" fill={color} fillOpacity="0.45" />
    {/* Roof bar */}
    <rect x="7" y="25" width="42" height="18" rx="2" fill={color} fillOpacity="0.18" />
    {/* Armor plating (if armored) */}
    {armored && <rect x="5" y="5" width="46" height="70" rx="6" fill="none" stroke={color} strokeWidth="3" strokeDasharray="6 3" />}
    {/* Wheels */}
    <rect x="0"  y="8"  width="7" height="18" rx="3" fill={color} fillOpacity="0.8" />
    <rect x="49" y="8"  width="7" height="18" rx="3" fill={color} fillOpacity="0.8" />
    <rect x="0"  y="52" width="7" height="18" rx="3" fill={color} fillOpacity="0.8" />
    <rect x="49" y="52" width="7" height="18" rx="3" fill={color} fillOpacity="0.8" />
  </svg>
);

function VehicleSVG({ typeId, color }: { typeId: string; color: string }) {
  switch (typeId) {
    case 'bike':        return <BikeSVG color={color} />;
    case 'moto':        return <MotoSVG color={color} />;
    case 'compact':     return <CarSVG color={color} />;
    case 'sedan':       return <CarSVG color={color} long />;
    case 'suv':         return <TruckSVG color={color} />;
    case 'armored_suv': return <TruckSVG color={color} armored />;
    default:            return <CarSVG color={color} />;
  }
}

// ── Garage floor grid ─────────────────────────────────────────────────────────

function buildCellArray(vehicles: GarageVehicle[], capacity: number): (GarageVehicle | null)[] {
  const cells: (GarageVehicle | null)[] = Array(capacity).fill(null);
  let idx = 0;
  for (const v of vehicles) {
    for (let i = 0; i < v.spaces && idx < capacity; i++) cells[idx++] = v;
  }
  return cells;
}

// ── Main component ────────────────────────────────────────────────────────────

const GaragePanel: React.FC = () => {
  const { state, removeVehicle } = useGame();
  const garageLevel  = state.buildings['garage'] || 0;
  const capacity     = getGarageCapacity(garageLevel);
  const vehicles     = state.garageVehicles;
  const usedSpaces   = vehicles.reduce((s, v) => s + v.spaces, 0);
  const freeSpaces   = capacity - usedSpaces;
  const cells        = buildCellArray(vehicles, capacity);
  const fillPct      = capacity > 0 ? (usedSpaces / capacity) * 100 : 0;

  // Véhicules actuellement en expédition
  const vehiclesInUse = new Map<string, string>(); // vehicleId → zoneName
  state.expeditions.filter(e => !e.completed).forEach(exp => {
    const zone = ZONES.find(z => z.id === exp.zoneId);
    (exp.vehicleIds ?? []).forEach(vid => vehiclesInUse.set(vid, zone?.name ?? 'Zone inconnue'));
  });

  // Index of first cell for each vehicle (for SVG placement)
  const firstCellOf = new Map<string, number>();
  cells.forEach((v, i) => { if (v && !firstCellOf.has(v.id)) firstCellOf.set(v.id, i); });

  const [hovered, setHovered] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<GarageVehicle | null>(null);
  const removeStyle = pendingRemove ? getStyle(pendingRemove.type) : null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── Header card ───────────────────────────────────────────────────── */}
      <div
        className="wl-corner-lg border p-4"
        style={{ borderColor: 'rgba(120,62,12,0.40)', backgroundColor: 'rgba(10,8,5,0.85)' }}
      >
        {/* Title row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-5 bg-amber-600/60" style={{ boxShadow: '0 0 4px rgba(200,120,15,0.4)' }} />
            <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-amber-500/80 flex items-center gap-2">
              <Car className="w-3.5 h-3.5" />
              Garage — Niveau {garageLevel}
            </h2>
          </div>
          <span className="text-xs font-mono text-amber-700/60">
            {usedSpaces} / {capacity} places
          </span>
        </div>

        {/* Capacity bar */}
        <div className="w-full h-2 bg-zinc-800/80 rounded-full overflow-hidden border border-zinc-700/30">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${fillPct}%`,
              background: fillPct >= 90
                ? 'linear-gradient(90deg, #dc2626, #991b1b)'
                : fillPct >= 60
                  ? 'linear-gradient(90deg, #d97706, #92400e)'
                  : 'linear-gradient(90deg, #059669, #065f46)',
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-zinc-600 mt-1">
          <span>{freeSpaces} place{freeSpaces !== 1 ? 's' : ''} libre{freeSpaces !== 1 ? 's' : ''}</span>
          <span>{garageLevel * 4} places / niveau × {garageLevel} niveaux</span>
        </div>
      </div>

      {/* ── Top-down garage floor ──────────────────────────────────────────── */}
      <div
        className="wl-corner-lg border p-4"
        style={{ borderColor: 'rgba(80,55,15,0.30)', backgroundColor: 'rgba(4,3,1,0.92)' }}
      >
        <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-600 mb-3 flex items-center gap-2">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(100,70,20,0.4))' }} />
          <span>Vue du garage — plan de haut</span>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(100,70,20,0.4), transparent)' }} />
        </div>

        {/* Garage floor */}
        <div
          className="rounded-lg p-3 relative"
          style={{
            backgroundColor: '#070501',
            border: '1px solid rgba(60,45,10,0.5)',
            boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.8)',
          }}
        >
          {/* Entrance label */}
          <div className="text-[9px] font-mono tracking-[0.3em] text-amber-900/40 uppercase text-center mb-2">
            ▲ Entrée
          </div>

          {/* Level rows */}
          <div className="space-y-1">
            {Array.from({ length: garageLevel }).map((_, levelIdx) => {
              const rowStart = levelIdx * 4;
              const rowCells = cells.slice(rowStart, rowStart + 4);

              return (
                <div key={levelIdx} className="flex gap-1 items-stretch">
                  {/* Level label */}
                  <div
                    className="flex items-center justify-center text-[9px] font-mono text-amber-900/35 w-5 shrink-0 uppercase tracking-widest"
                    style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
                  >
                    Nv.{levelIdx + 1}
                  </div>

                  {/* 4 cells */}
                  {rowCells.map((vehicle, colIdx) => {
                    const cellIdx = rowStart + colIdx;
                    const style   = vehicle ? getStyle(vehicle.type) : null;
                    const isFirst = vehicle ? firstCellOf.get(vehicle.id) === cellIdx : false;
                    const isHov   = vehicle ? hovered === vehicle.id : false;

                    // Determine adjacency for seamless borders
                    const sameLeft  = vehicle && colIdx > 0 && rowCells[colIdx - 1]?.id === vehicle.id;
                    const sameRight = vehicle && colIdx < 3 && rowCells[colIdx + 1]?.id === vehicle.id;
                    // Cross-row adjacency
                    const aboveIdx  = cellIdx - 4;
                    const belowIdx  = cellIdx + 4;
                    const sameAbove = vehicle && aboveIdx >= 0 && cells[aboveIdx]?.id === vehicle.id;
                    const sameBelow = vehicle && belowIdx < capacity && cells[belowIdx]?.id === vehicle.id;

                    const rTL = (!sameAbove && !sameLeft)  ? '5px' : '0';
                    const rTR = (!sameAbove && !sameRight) ? '5px' : '0';
                    const rBL = (!sameBelow && !sameLeft)  ? '5px' : '0';
                    const rBR = (!sameBelow && !sameRight) ? '5px' : '0';

                    const onMission = vehicle ? vehiclesInUse.has(vehicle.id) : false;
                    const missionColor = 'rgba(96,165,250,0.7)';

                    return (
                      <div
                        key={colIdx}
                        className="flex-1 relative flex items-center justify-center transition-all duration-150"
                        style={{
                          height: 64,
                          cursor: vehicle ? (onMission ? 'default' : 'pointer') : 'default',
                          backgroundColor: vehicle
                            ? onMission
                              ? 'rgba(30,58,138,0.25)'
                              : (isHov ? `${style!.accent}35` : `${style!.accent}1a`)
                            : 'rgba(15,12,5,0.8)',
                          border: vehicle
                            ? `1px solid ${onMission ? 'rgba(96,165,250,0.35)' : isHov ? style!.accent + '80' : style!.accent + '35'}`
                            : '1px dashed rgba(60,50,20,0.35)',
                          borderLeft:   sameLeft  ? 'none' : undefined,
                          borderRight:  sameRight ? 'none' : undefined,
                          borderTop:    sameAbove ? 'none' : undefined,
                          borderBottom: sameBelow ? 'none' : undefined,
                          borderRadius: `${rTL} ${rTR} ${rBR} ${rBL}`,
                        }}
                        onMouseEnter={() => vehicle && !onMission && setHovered(vehicle.id)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => vehicle && !onMission && setPendingRemove(vehicle)}
                        title={
                          vehicle
                            ? onMission
                              ? `${vehicle.name} — En expédition`
                              : `${vehicle.name} — Cliquer pour retirer`
                            : `Place ${cellIdx + 1} (libre)`
                        }
                      >
                        {/* Empty cell: slot number */}
                        {!vehicle && (
                          <span className="text-[9px] font-mono select-none" style={{ color: 'rgba(80,65,25,0.5)' }}>
                            {cellIdx + 1}
                          </span>
                        )}

                        {/* Occupied cell: SVG on first cell only */}
                        {isFirst && vehicle && (
                          <div className="flex flex-col items-center gap-0.5 pointer-events-none select-none" style={{ maxWidth: '90%' }}>
                            <div style={{ width: 28, height: 40, opacity: onMission ? 0.4 : isHov ? 1 : 0.75 }}>
                              <VehicleSVG typeId={vehicle.type} color={onMission ? missionColor : style!.accent} />
                            </div>
                            <span
                              className="text-[9px] font-mono font-bold uppercase tracking-wider leading-none"
                              style={{ color: onMission ? missionColor : style!.accent }}
                            >
                              {onMission ? 'En mission' : vehicle.name}
                            </span>
                          </div>
                        )}

                        {/* Continuation cells */}
                        {vehicle && !isFirst && (
                          <div
                            className="w-0.5 h-8 rounded-full opacity-20"
                            style={{ backgroundColor: onMission ? missionColor : style!.accent }}
                          />
                        )}

                        {/* Mission pulse on first cell */}
                        {isFirst && onMission && (
                          <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        )}

                        {/* Remove overlay on hover (only if not on mission) */}
                        {isHov && isFirst && !onMission && (
                          <div
                            className="absolute inset-0 flex items-center justify-center rounded pointer-events-none"
                            style={{ backgroundColor: 'rgba(200,30,30,0.15)' }}
                          >
                            <X className="w-4 h-4" style={{ color: '#ef4444', opacity: 0.8 }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Back wall label */}
          <div className="text-[9px] font-mono tracking-[0.3em] text-amber-900/30 uppercase text-center mt-2">
            ▼ Fond du garage
          </div>
        </div>

        {vehicles.length > 0 && (
          <p className="text-[10px] font-mono text-zinc-700 text-center mt-2">
            Cliquez sur un véhicule pour le retirer du garage — les véhicules en mission ne peuvent pas être retirés
          </p>
        )}
      </div>

      {/* ── Vehicle list ──────────────────────────────────────────────────── */}
      {vehicles.length > 0 && (
        <div
          className="wl-corner-lg border p-4"
          style={{ borderColor: 'rgba(80,55,15,0.30)', backgroundColor: 'rgba(8,6,2,0.85)' }}
        >
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-600 mb-3 flex items-center gap-2">
            <div className="flex-1 h-px bg-zinc-800/60" />
            <span>Véhicules en garage ({vehicles.length})</span>
            <div className="flex-1 h-px bg-zinc-800/60" />
          </div>
          <div className="space-y-1.5">
            {vehicles.map(v => {
              const style = getStyle(v.type);
              const vDef  = VEHICLE_DEFS.find(d => d.id === v.type);
              return (
                <div
                  key={v.id}
                  className="flex items-center justify-between px-3 py-2 rounded border transition-all"
                  style={{
                    backgroundColor: `${style.accent}0d`,
                    borderColor: `${style.accent}30`,
                  }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {vehiclesInUse.has(v.id) ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.accent }} />
                    )}
                    <span className="text-xs font-mono font-bold" style={{ color: vehiclesInUse.has(v.id) ? '#60a5fa' : style.accent }}>
                      {v.name}
                    </span>
                    {vehiclesInUse.has(v.id) ? (
                      <span className="text-[10px] font-mono text-blue-400/60 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        {vehiclesInUse.get(v.id)}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-zinc-600">
                          {v.spaces}p
                        </span>
                        {vDef && (
                          <span className="text-[10px] font-mono text-zinc-700 flex items-center gap-0.5">
                            <Gauge className="w-2.5 h-2.5"/> -{Math.round(vDef.speed * 100)}%
                          </span>
                        )}
                        {vDef && (
                          <span className="flex items-center gap-0.5">
                            <Volume2 className="w-2.5 h-2.5 text-zinc-700"/>
                            <span className="flex gap-0.5">
                              {Array.from({ length: 4 }).map((_, i) => (
                                <span key={i} className="w-1.5 h-1.5 rounded-sm inline-block"
                                  style={{ backgroundColor: i < vDef.noise ? '#f97316' : 'rgba(50,50,50,0.7)' }}
                                />
                              ))}
                            </span>
                          </span>
                        )}
                        {vDef && vDef.combat > 0 && (
                          <span className="text-[10px] font-mono text-red-400 flex items-center gap-0.5">
                            <Swords className="w-2.5 h-2.5"/> +{vDef.combat}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => !vehiclesInUse.has(v.id) && setPendingRemove(v)}
                    disabled={vehiclesInUse.has(v.id)}
                    className={`transition-colors p-1 rounded ${vehiclesInUse.has(v.id) ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-600 hover:text-red-400'}`}
                    title={vehiclesInUse.has(v.id) ? 'En expédition' : 'Retirer du garage'}
                  >
                    {vehiclesInUse.has(v.id) ? <MapPin className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Comment acquérir des véhicules ───────────────────────────────── */}
      <div
        className="wl-corner-lg border p-4"
        style={{ borderColor: 'rgba(80,55,15,0.20)', backgroundColor: 'rgba(6,5,2,0.80)' }}
      >
        <div className="flex items-start gap-3">
          <Search className="w-4 h-4 text-amber-700/50 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-[11px] font-mono text-amber-700/70 font-bold uppercase tracking-wider">
              Acquisition de véhicules
            </p>
            <p className="text-[10px] font-mono text-zinc-600 leading-relaxed">
              Les véhicules ne peuvent pas être ajoutés manuellement. Envoyez des équipes en
              <span className="text-amber-600/80 font-bold"> Expédition</span> pour en découvrir.
            </p>
            <p className="text-[10px] font-mono text-zinc-700 leading-relaxed">
              Les vélos trouvés reviennent directement au camp. Les autres véhicules
              (motos, voitures, 4×4…) nécessitent une
              <span className="text-amber-700/60 font-bold"> expédition de récupération</span> — un marqueur
              est posé sur la carte et des ressources de réparation seront consommées au lancement.
            </p>
          </div>
        </div>
      </div>

      {/* ── Confirmation retrait véhicule ─────────────────────────────────── */}
      {pendingRemove && removeStyle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
          onClick={() => setPendingRemove(null)}
        >
          <div
            className="wl-corner-lg border p-5 w-72 space-y-4"
            style={{ borderColor: `${removeStyle.accent}55`, backgroundColor: 'rgba(10,8,5,0.97)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Titre */}
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-4 bg-red-600/70" />
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-red-400/80">
                Retirer du garage
              </span>
            </div>

            {/* Véhicule concerné */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded border"
              style={{ backgroundColor: `${removeStyle.accent}12`, borderColor: `${removeStyle.accent}35` }}
            >
              <span style={{ color: removeStyle.accent }}>{removeStyle.icon}</span>
              <span className="text-sm font-mono font-bold" style={{ color: removeStyle.accent }}>
                {pendingRemove.name}
              </span>
            </div>

            <p className="text-xs font-mono text-zinc-400 leading-relaxed">
              Ce véhicule sera définitivement retiré du garage. Cette action est irréversible.
            </p>

            {/* Boutons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPendingRemove(null)}
                className="px-3 py-2 rounded border text-xs font-mono font-bold uppercase tracking-wider transition-colors border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
              >
                Annuler
              </button>
              <button
                onClick={() => { removeVehicle(pendingRemove.id); setPendingRemove(null); }}
                className="px-3 py-2 rounded border text-xs font-mono font-bold uppercase tracking-wider transition-colors bg-red-950/40 border-red-800/60 text-red-400 hover:bg-red-900/50 hover:border-red-600 hover:text-red-300"
              >
                Retirer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GaragePanel;
