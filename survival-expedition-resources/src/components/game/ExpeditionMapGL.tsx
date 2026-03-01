import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import type { Expedition } from '@/contexts/GameContext';
import { MAP_STYLE_URL, TERRAIN_DEM_URL } from '@/lib/mapConfig';

export interface ZoneMarkerConfig {
  id: string;
  lngLat: [number, number];
  abbr: string;
  strokeColor: string;
  mapName: string;
  locked: boolean;
  selected: boolean;
  hasActiveExp: boolean;
  hasCompletedExp: boolean;
}

export interface ExpeditionMapGLProps {
  zones: ZoneMarkerConfig[];
  activeExpeditions: Expedition[];
  completedExpeditions: Expedition[];
  expSurvivorCounts: Record<string, number>;
  onZoneClick: (zoneId: string) => void;
  baseLngLat: [number, number];
  now: number;
}

function buildLinesGeoJSON(
  zones: ZoneMarkerConfig[],
  baseLngLat: [number, number],
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: zones.map(z => ({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [baseLngLat, z.lngLat],
      },
    })),
  };
}

function interpLngLat(
  a: [number, number],
  b: [number, number],
  t: number,
): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

const ExpeditionMapGL: React.FC<ExpeditionMapGLProps> = ({
  zones,
  activeExpeditions,
  completedExpeditions,
  expSurvivorCounts,
  onZoneClick,
  baseLngLat,
  now,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Refs to keep latest props accessible inside effects without re-triggering map init
  const zonesRef = useRef(zones);
  const onZoneClickRef = useRef(onZoneClick);
  useEffect(() => { zonesRef.current = zones; }, [zones]);
  useEffect(() => { onZoneClickRef.current = onZoneClick; }, [onZoneClick]);

  // Zone markers — rebuilt when mapReady or zones change
  const zoneMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  // Expedition markers — updated each tick
  const expMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  // ── Map initialisation (runs once) ─────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: [2.5, 46.8],
      zoom: 5.4,
      pitch: 50,
      bearing: 0,
      maxBounds: [[-6.5, 41.0], [10.5, 52.5]],
      attributionControl: false,
    });

    map.on('load', () => {
      // ── Thème post-apocalyptique sur le canvas uniquement ─────────────────
      // Filtre appliqué au <canvas> pour ne pas affecter les marqueurs HTML
      map.getCanvas().style.filter =
        'brightness(0.42) saturate(0.5) contrast(1.15) sepia(0.18)';

      // ── Garder uniquement les éléments naturels ──────────────────────────
      // Source-layers considérés comme "naturels" dans le schéma OpenMapTiles
      const NATURAL_SRC = new Set(['water', 'waterway', 'natural', 'landcover', 'hillshade', 'contour']);
      map.getStyle().layers.forEach(layer => {
        if (layer.type === 'background') return; // toujours garder le fond
        const srcLayer = ('source-layer' in layer
          ? (layer as { 'source-layer'?: string })['source-layer']
          : undefined) ?? '';
        if (!NATURAL_SRC.has(srcLayer)) {
          map.setLayoutProperty(layer.id, 'visibility', 'none');
        }
      });

      // 3D terrain
      map.addSource('maptiler-dem', {
        type: 'raster-dem',
        url: TERRAIN_DEM_URL,
        tileSize: 256,
      });
      map.setTerrain({ source: 'maptiler-dem', exaggeration: 1.5 });

      // Lines base → zones
      map.addSource('zone-lines', {
        type: 'geojson',
        data: buildLinesGeoJSON(zonesRef.current, baseLngLat),
      });
      map.addLayer({
        id: 'zone-lines-layer',
        type: 'line',
        source: 'zone-lines',
        paint: {
          'line-color': '#4ade80',
          'line-width': 0.8,
          'line-opacity': 0.25,
          'line-dasharray': [5, 5],
        },
      });

      // Base marker
      const baseEl = document.createElement('div');
      baseEl.innerHTML = `<div style="
        background:#111827; border:2px solid #f59e0b; border-radius:4px;
        padding:2px 6px; color:#f59e0b; font-size:9px; font-weight:700;
        font-family:monospace; white-space:nowrap; pointer-events:none;
        box-shadow:0 0 8px rgba(245,158,11,0.4);">⌂ BASE</div>`;
      new maplibregl.Marker({ element: baseEl })
        .setLngLat(baseLngLat)
        .addTo(map);

      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      // Clean up all markers before removing map
      zoneMarkersRef.current.forEach(m => m.remove());
      zoneMarkersRef.current.clear();
      expMarkersRef.current.forEach(m => m.remove());
      expMarkersRef.current.clear();
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Zone markers — rebuild when map is ready or zones list changes ──────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Remove existing zone markers
    zoneMarkersRef.current.forEach(m => m.remove());
    zoneMarkersRef.current.clear();

    zones.forEach(zone => {
      const el = document.createElement('div');
      el.style.cssText = `
        width:32px; height:32px; border-radius:50%;
        background: #111827; border: 2px solid ${zone.strokeColor};
        display:flex; align-items:center; justify-content:center;
        color:#d1fae5; font-size:8px; font-weight:700; font-family:monospace;
        cursor: pointer; user-select:none;
        ${zone.selected ? `box-shadow:0 0 0 2px #f59e0b, 0 0 8px rgba(245,158,11,0.5);` : ''}
        ${zone.hasActiveExp && !zone.selected ? `box-shadow:0 0 8px ${zone.strokeColor};` : ''}
        ${zone.hasCompletedExp && !zone.selected ? `box-shadow:0 0 0 2px #f59e0b;` : ''}
        transition: box-shadow 0.2s;
      `;
      el.textContent = zone.locked ? '🔒' : zone.abbr;
      el.title = zone.mapName;
      el.addEventListener('click', () => onZoneClickRef.current(zone.id));

      // Name label below
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:2px;';
      wrapper.appendChild(el);

      const label = document.createElement('div');
      label.style.cssText = `
        font-size:8px; font-family:monospace; white-space:nowrap; pointer-events:none;
        color: ${zone.selected ? '#fbbf24' : zone.locked ? '#48485a' : '#74748a'};
        text-shadow: 0 1px 3px #000;
      `;
      label.textContent = zone.mapName;
      wrapper.appendChild(label);

      const marker = new maplibregl.Marker({ element: wrapper, anchor: 'top' })
        .setLngLat(zone.lngLat)
        .addTo(map);

      zoneMarkersRef.current.set(zone.id, marker);
    });
  }, [mapReady, zones]);

  // ── Expedition markers — update position every tick ─────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const allExps = [...activeExpeditions, ...completedExpeditions];
    const activeIds = new Set(allExps.map(e => e.id));

    // Remove markers for ended expeditions
    expMarkersRef.current.forEach((marker, id) => {
      if (!activeIds.has(id)) {
        marker.remove();
        expMarkersRef.current.delete(id);
      }
    });

    allExps.forEach(exp => {
      const zoneLngLat = zones.find(z => z.id === exp.zoneId)?.lngLat ?? baseLngLat;
      const elapsed = (now - exp.startTime) / 1000;
      const progress = Math.min(1, elapsed / exp.duration);

      // Three phases: [0,1/3] going, [1/3,2/3] on-site, [2/3,1] returning
      const phase = progress < 1 / 3 ? 1 : progress < 2 / 3 ? 2 : 3;
      let pos: [number, number];

      if (exp.completed) {
        pos = zoneLngLat;
      } else if (phase === 1) {
        pos = interpLngLat(baseLngLat, zoneLngLat, progress * 3);
      } else if (phase === 2) {
        pos = zoneLngLat;
      } else {
        pos = interpLngLat(zoneLngLat, baseLngLat, (progress - 2 / 3) * 3);
      }

      const isDone = exp.completed || phase === 3;
      const col = isDone ? '#f59e0b' : '#60a5fa';
      const n = expSurvivorCounts[exp.id] ?? 0;

      if (expMarkersRef.current.has(exp.id)) {
        expMarkersRef.current.get(exp.id)!.setLngLat(pos);
        // Update color if phase changed
        const dotEl = expMarkersRef.current.get(exp.id)!.getElement().querySelector('.exp-dot') as HTMLElement | null;
        if (dotEl) dotEl.style.background = col;
        const countEl = expMarkersRef.current.get(exp.id)!.getElement().querySelector('.exp-count') as HTMLElement | null;
        if (countEl) countEl.style.color = col;
      } else {
        const el = document.createElement('div');
        el.style.cssText = 'display:flex; flex-direction:column; align-items:center; pointer-events:none;';

        const dot = document.createElement('div');
        dot.className = 'exp-dot';
        dot.style.cssText = `
          width:10px; height:10px; border-radius:50%;
          background:${col}; opacity:0.9;
          box-shadow: 0 0 6px ${col};
        `;
        el.appendChild(dot);

        const count = document.createElement('div');
        count.className = 'exp-count';
        count.style.cssText = `font-size:8px; font-family:monospace; color:${col}; pointer-events:none;`;
        count.textContent = `${n}s`;
        el.appendChild(count);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat(pos)
          .addTo(map);
        expMarkersRef.current.set(exp.id, marker);
      }
    });
  }, [mapReady, now, activeExpeditions, completedExpeditions, zones, baseLngLat, expSurvivorCounts]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', borderRadius: '0.5rem', overflow: 'hidden' }}
    />
  );
};

export default ExpeditionMapGL;
