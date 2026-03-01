import { latLonToSvg, FRANCE_OUTLINE_POINTS, BASE_POS } from './mapData';
import { getCategoryDef } from './gameData';
import type { ZoneCategory, ZoneDef } from './gameData';

export const TILE_SIZE = 22;

export interface TileDef {
  id: string;
  col: number;
  row: number;
  x: number;   // top-left SVG x
  y: number;   // top-left SVG y
  cx: number;  // centre SVG x
  cy: number;  // centre SVG y
  lat: number;
  lon: number;
  category: ZoneCategory;
  dangerLevel: number;         // 1–5
  distanceFromBase: number;    // SVG units
  factionId?: string;          // faction controlling this tile (if any)
}

// Mirror constants from mapData to avoid circular import
const MAP_LEFT = 90, MAP_TOP = 20, MAP_WIDTH = 580, MAP_HEIGHT = 552;
const LAT_MAX = 51.1, LAT_RANGE = 8.8, LON_MIN = -5.1, LON_RANGE = 13.4;

function svgToLatLon(x: number, y: number): { lat: number; lon: number } {
  return {
    lat: LAT_MAX - ((y - MAP_TOP) / MAP_HEIGHT) * LAT_RANGE,
    lon: LON_MIN + ((x - MAP_LEFT) / MAP_WIDTH) * LON_RANGE,
  };
}

// Build France polygon in SVG space (computed once)
const FRANCE_SVG_PTS = FRANCE_OUTLINE_POINTS.map(([lat, lon]) => latLonToSvg(lat, lon));

function pointInFrance(px: number, py: number): boolean {
  let inside = false;
  for (let i = 0, j = FRANCE_SVG_PTS.length - 1; i < FRANCE_SVG_PTS.length; j = i++) {
    const { x: xi, y: yi } = FRANCE_SVG_PTS[i];
    const { x: xj, y: yj } = FRANCE_SVG_PTS[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

function seededRand(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const CATEGORY_DANGER: Record<ZoneCategory, number> = {
  sauvage:      1,
  residentiel:  2,
  industriel:   3,
  scientifique: 4,
  militaire:    5,
};

function assignFaction(lat: number, lon: number, category: ZoneCategory): string | undefined {
  // Arvernes — Massif Central / Auvergne
  if (lat >= 44.5 && lat <= 46.3 && lon >= 2.0 && lon <= 4.6) return 'arvernes';
  // Tribu Verte — Massif des Vosges (nord-est)
  if (lat >= 47.5 && lat <= 48.8 && lon >= 5.8 && lon <= 7.6) return 'tribu_verte';
  // Pirates de la Loire — vallée de la Loire et côte atlantique
  if (lat >= 46.8 && lat <= 48.2 && lon >= -3.5 && lon <= 1.5) return 'pirates_loire';
  // Marshals — zones militaires sur l'axe Clermont-Bordeaux
  if (category === 'militaire' && lat >= 44.5 && lat <= 47.0 && lon >= -2.0 && lon <= 4.0) return 'marshals';
  return undefined;
}

function assignCategory(col: number, row: number, lat: number, lon: number): ZoneCategory {
  // Geographic rules first
  if (lat < 43.8) return 'sauvage';                               // Pyrénées
  if (lat < 46.5 && lon > 5.5) return 'sauvage';                 // Alpes
  if (lat > 48.5 && lat < 49.1 && lon > 1.9 && lon < 2.7)
    return 'residentiel';                                         // Paris
  if (lat > 48.8 && lon > 4.5) return 'industriel';              // Nord-Est
  if (lon < -1.5 && lat > 47.0 && lat < 48.8) return 'sauvage';  // Bretagne
  // Weighted pseudo-random default
  const r = seededRand(col * 97 + row * 31);
  if (r < 0.35) return 'sauvage';
  if (r < 0.65) return 'residentiel';
  if (r < 0.82) return 'industriel';
  if (r < 0.92) return 'militaire';
  return 'scientifique';
}

// Centre de la tuile base — pré-calculé avant le générateur pour servir d'origine aux distances
const _baseCol = Math.floor((BASE_POS.x - MAP_LEFT) / TILE_SIZE);
const _baseRow = Math.floor((BASE_POS.y - MAP_TOP) / TILE_SIZE);
export const BASE_TILE_ID = `t_${_baseCol}_${_baseRow}`;
const BASE_TILE_CX = MAP_LEFT + _baseCol * TILE_SIZE + TILE_SIZE / 2;
const BASE_TILE_CY = MAP_TOP  + _baseRow * TILE_SIZE + TILE_SIZE / 2;

export function generateTileGrid(): TileDef[] {
  const tiles: TileDef[] = [];
  const cols = Math.floor(MAP_WIDTH / TILE_SIZE);   // ≈ 26
  const rows = Math.floor(MAP_HEIGHT / TILE_SIZE);  // ≈ 25

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = MAP_LEFT + col * TILE_SIZE;
      const y = MAP_TOP + row * TILE_SIZE;
      const cx = x + TILE_SIZE / 2;
      const cy = y + TILE_SIZE / 2;

      if (!pointInFrance(cx, cy)) continue;

      const { lat, lon } = svgToLatLon(cx, cy);
      const category = assignCategory(col, row, lat, lon);

      const dx = cx - BASE_TILE_CX;
      const dy = cy - BASE_TILE_CY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dangerLevel = CATEGORY_DANGER[category];

      tiles.push({
        id: `t_${col}_${row}`,
        col, row, x, y, cx, cy, lat, lon,
        category, dangerLevel,
        distanceFromBase: dist,
        factionId: assignFaction(lat, lon, category),
      });
    }
  }
  return tiles;
}

export const TILE_GRID = generateTileGrid();
export const TILE_BY_ID = new Map(TILE_GRID.map(t => [t.id, t]));

// Portée radio par niveau (unités SVG). 1 unité SVG ≈ 1.75 km
// Niveau 0 : ~70 km | 1 : ~200 km | 2 : ~280 km | 3 : ~360 km | 4 : ~450 km | 5 : illimitée
const RADIO_RANGES = [40, 116, 160, 206, 257, 999] as const;
export function getRadioRange(level: number): number {
  return RADIO_RANGES[Math.min(level, 5)];
}

// Duration: 60s minimum + 3.8s per SVG unit of distance (~40 min max)
export function getTileDuration(tile: TileDef): number {
  return Math.round(60 + tile.distanceFromBase * 3.8);
}

// Synthesises a ZoneDef compatible with GameContext reducers
export function synthZoneDef(tile: TileDef): ZoneDef {
  const catDef = getCategoryDef(tile.category)!;
  return {
    id: tile.id,
    name: catDef.name,
    description: catDef.description,
    icon: catDef.icon,
    baseDuration: getTileDuration(tile),
    dangerLevel: tile.dangerLevel,
    lootTable: catDef.categoryLootTable,
    category: tile.category,
  };
}
