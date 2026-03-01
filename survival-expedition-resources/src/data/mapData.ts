// ── Map projection constants ───────────────────────────────────────────────
// SVG viewBox 800×620
const MAP_LEFT = 90, MAP_TOP = 20, MAP_WIDTH = 580, MAP_HEIGHT = 552;
const LAT_MAX = 51.1, LAT_RANGE = 8.8;   // 51.1°N (Belgian border) → 42.3°N (Pyrénées)
const LON_MIN = -5.1, LON_RANGE = 13.4;  // -5.1°E (Bretagne) → 8.3°E (Alsace)

export function latLonToSvg(lat: number, lon: number): { x: number; y: number } {
  return {
    x: MAP_LEFT + ((lon - LON_MIN) / LON_RANGE) * MAP_WIDTH,
    y: MAP_TOP  + ((LAT_MAX - lat) / LAT_RANGE) * MAP_HEIGHT,
  };
}

// Orléans / Loiret — used as the Base position
export const BASE_POS = latLonToSvg(47.9, 2.0);

// ── Zone geographic positions ─────────────────────────────────────────────
export const ZONE_GEO_POS: Record<string, { x: number; y: number }> = {
  forest:         latLonToSvg(47.5,  1.9),   // Forêt de Sologne
  suburbs:        latLonToSvg(47.95, 2.1),   // Faubourgs d'Orléans
  signal_contact: latLonToSvg(48.4,  1.5),   // Zone Chartres
  urban_ruins:    latLonToSvg(48.87, 2.35),  // Paris
  hospital:       latLonToSvg(47.4,  0.7),   // Tours
  industrial:     latLonToSvg(49.4,  1.1),   // Rouen
  military_base:  latLonToSvg(49.1,  4.5),   // Camp de Suippes (Champagne)
  laboratory:     latLonToSvg(45.73, 4.83),  // Lyon — Institut Lumière
};

// ── France outline (~115 points, sens horaire depuis Dunkerque) ─────────────
export const FRANCE_OUTLINE_POINTS: [number, number][] = [
  // ── Dunkerque / côte belge ───────────────────────────────────────────────
  [51.04, 2.55],
  // ── Côte de la Manche ───────────────────────────────────────────────────
  [50.97, 1.85],   // Calais
  [50.87, 1.58],   // Cap Gris-Nez
  [50.72, 1.60],   // Boulogne-sur-Mer
  [50.52, 1.63],   // Étaples
  [50.31, 1.57],   // Berck
  [50.06, 1.37],   // Le Tréport
  [49.93, 1.08],   // Dieppe
  [49.76, 0.38],   // Fécamp
  [49.71, 0.20],   // Étretat
  [49.50, 0.10],   // Le Havre (nord estuaire)
  // ── Calvados ────────────────────────────────────────────────────────────
  [49.42, 0.23],   // Honfleur (sud)
  [49.35,-0.05],   // Ouistreham
  [49.28,-0.33],   // Courseulles
  [49.30,-1.05],   // Baie des Veys (pied est Cotentin)
  // ── Cotentin ────────────────────────────────────────────────────────────
  [49.42,-1.27],   // Quinéville (côte est)
  [49.62,-1.40],   // Cap Lévi (nord-est)
  [49.67,-1.62],   // Cherbourg
  [49.72,-1.92],   // Cap de la Hague (pointe)
  [49.55,-1.95],   // côte ouest Cotentin
  [49.25,-1.87],   // pied ouest
  [48.84,-1.60],   // Granville
  // ── Bretagne nord ───────────────────────────────────────────────────────
  [48.65,-2.01],   // Saint-Malo
  [48.68,-2.32],   // Cap Fréhel
  [48.57,-2.54],   // Erquy
  [48.52,-2.74],   // Saint-Brieuc
  [48.42,-2.95],   // Binic
  [48.35,-3.09],   // Paimpol
  [48.53,-3.42],   // Perros-Guirec / Tréguier
  [48.72,-3.90],   // Morlaix
  [48.70,-4.10],   // Roscoff
  [48.58,-4.35],   // Côte des Légendes / Landunvez
  [48.33,-4.77],   // Pointe Saint-Mathieu
  // ── Presqu'île de Crozon ────────────────────────────────────────────────
  [48.17,-4.65],   // Pointe de Pen-Hir (Crozon)
  [48.10,-4.43],   // Baie de Douarnenez
  [48.03,-4.73],   // Pointe du Raz
  // ── Bretagne sud ────────────────────────────────────────────────────────
  [47.93,-4.52],   // Audierne
  [47.82,-4.37],   // Penmarc'h
  [47.75,-3.37],   // Lorient
  [47.56,-3.15],   // Quiberon (pointe)
  [47.50,-2.95],   // Quiberon (base) / Carnac
  [47.47,-2.78],   // La Trinité-sur-Mer
  [47.32,-2.55],   // Estuaire de la Vilaine
  [47.27,-2.21],   // Saint-Nazaire / Loire
  // ── Côte Atlantique ─────────────────────────────────────────────────────
  [47.15,-2.02],   // Pornic
  [46.98,-2.27],   // Noirmoutier (nord)
  [46.80,-2.07],   // Saint-Jean-de-Monts
  [46.50,-1.78],   // Les Sables-d'Olonne
  [46.36,-1.53],   // Saint-Gilles
  [46.25,-1.40],   // La Tranche-sur-Mer
  [46.16,-1.15],   // La Rochelle
  [45.95,-0.96],   // Rochefort
  [45.75,-1.14],   // Île d'Oléron (nord, simplifiée)
  [45.63,-1.03],   // Royan
  [45.55,-1.07],   // Pointe de la Coubre
  // ── Gironde / Landes (côte très rectiligne) ──────────────────────────────
  [45.57,-1.07],   // Pointe de Grave (estuaire Gironde)
  [44.84,-1.10],   // Lacanau / Médoc
  [44.57,-1.23],   // Cap Ferret / Arcachon
  [44.20,-1.27],   // Biscarrosse-Plage
  [43.70,-1.55],   // Hossegor / Capbreton
  [43.47,-1.56],   // Anglet
  [43.36,-1.78],   // Hendaye
  // ── Pyrénées (frontière franco-espagnole) ────────────────────────────────
  [43.22,-1.35],
  [43.10,-0.83],
  [42.92, 0.25],
  [42.70, 0.65],
  [42.65, 1.45],
  [42.55, 1.73],
  [42.47, 2.85],
  [42.44, 3.16],   // Cerbère
  // ── Côte Méditerranéenne ─────────────────────────────────────────────────
  [42.68, 3.02],   // Collioure
  [42.80, 3.00],   // Leucate
  [43.08, 3.08],   // Narbonne Plage
  [43.18, 3.25],   // Valras-Plage
  [43.25, 3.52],   // Agde
  [43.41, 3.69],   // Sète
  [43.32, 4.05],   // Palavas
  [43.27, 4.42],   // Montpellier (Carnon)
  [43.33, 4.65],   // Saintes-Maries-de-la-Mer (Camargue)
  [43.22, 4.85],   // Camargue (pointe)
  [43.20, 5.05],   // Fos-sur-Mer
  [43.30, 5.37],   // Marseille
  [43.18, 5.55],   // Cassis
  [43.12, 5.93],   // Toulon
  [43.08, 6.14],   // Le Pradet
  [43.22, 6.44],   // Sainte-Maxime
  [43.42, 6.74],   // Cannes
  [43.58, 7.10],   // Antibes
  [43.70, 7.27],   // Nice
  [43.77, 7.50],   // Menton
  // ── Alpes / frontière franco-italienne ───────────────────────────────────
  [44.10, 7.10],
  [44.35, 7.02],
  [44.50, 6.98],
  [44.70, 6.90],   // Col de Larche
  [44.80, 6.85],   // Briançon
  [45.00, 6.92],   // Montgenèvre
  [45.10, 6.85],   // Mont-Cenis
  [45.32, 6.95],
  [45.55, 6.95],   // Val d'Isère
  [45.73, 6.88],   // Chamonix
  [45.83, 6.86],   // Mont-Blanc
  // ── Frontière franco-suisse ───────────────────────────────────────────────
  [45.95, 6.75],   // Annemasse / Lac Léman ouest
  [46.13, 6.55],   // Thonon-les-Bains
  [46.37, 6.10],   // Genève (sud)
  [46.60, 6.20],   // Jura (entrant)
  [46.72, 6.05],
  [46.90, 6.08],   // Pontarlier / Doubs
  [47.05, 6.40],   // Jura (monts)
  [47.20, 6.97],   // Belfort / Delle
  [47.42, 7.20],
  [47.55, 7.59],   // Bâle
  // ── Frontière franco-allemande (Rhin) ────────────────────────────────────
  [47.68, 7.57],
  [47.82, 7.55],
  [48.00, 7.52],
  [48.20, 7.50],
  [48.57, 7.75],   // Strasbourg
  [48.80, 7.95],
  [48.97, 8.12],   // Lauterbourg
  // ── Lorraine / Luxembourg / frontière belge ───────────────────────────────
  [49.20, 7.12],   // Sarreguemines
  [49.35, 6.70],
  [49.47, 6.37],   // Thionville / tripoint F-D-L
  [49.55, 5.82],   // Longwy / tripoint F-L-B
  [49.70, 5.10],   // Montmédy
  [49.83, 4.87],   // Charleville-Mézières
  [50.03, 4.52],   // Hirson / Thiérache
  [50.15, 4.15],   // Givet / Ardennes
  [50.37, 3.55],
  [50.50, 3.20],   // Maubeuge
  [50.63, 3.10],
  [50.80, 3.10],   // Halluin / frontière belge
  [51.04, 2.55],   // retour Dunkerque
];

export function buildFrancePath(): string {
  const pts = FRANCE_OUTLINE_POINTS.map(([lat, lon]) => latLonToSvg(lat, lon));
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
}

export const FRANCE_PATH = buildFrancePath();

// ── Rivers ────────────────────────────────────────────────────────────────
export interface RiverDef { id: string; name: string; points: [number, number][]; }

export const RIVERS: RiverDef[] = [
  { id: 'loire', name: 'Loire',
    points: [[44.9,4.2],[45.6,3.8],[46.1,3.2],[46.9,2.6],
             [47.4,1.8],[47.9,2.0],[47.9,1.4],[47.5,0.5],[47.3,-0.5],[47.2,-1.55]] },
  { id: 'seine', name: 'Seine',
    points: [[47.8,4.8],[48.1,3.5],[48.4,2.9],[48.87,2.35],[49.0,1.6],[49.2,0.8],[49.5,0.1]] },
  { id: 'rhone', name: 'Rhône',
    points: [[46.4,6.4],[45.7,4.83],[45.0,4.6],[44.3,4.8],[43.95,4.6],[43.55,4.7],[43.3,4.85]] },
  { id: 'garonne', name: 'Garonne',
    points: [[42.85,0.6],[43.6,1.44],[44.0,1.0],[44.5,0.3],[44.84,-0.57]] },
];

export function buildRiverPath(points: [number, number][]): string {
  const pts = points.map(([lat, lon]) => latLonToSvg(lat, lon));
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
}

// ── Faction territories ───────────────────────────────────────────────────
export interface FactionTerritory { id: string; color: string; strokeColor: string; points: [number, number][]; }

export const FACTION_TERRITORIES: FactionTerritory[] = [
  { id: 'pirates_loire', color: '#0ea5e9', strokeColor: '#38bdf8',
    points: [[47.0,-1.8],[47.3,-1.0],[47.6,0.0],[47.9,1.0],[48.1,2.2],[48.2,3.0],
             [48.6,3.1],[48.5,2.1],[48.2,1.2],[48.0,0.1],[47.6,-0.9],[47.4,-2.0]] },
  { id: 'arvernes', color: '#65a30d', strokeColor: '#84cc16',
    points: [[44.8,2.0],[45.2,2.8],[45.8,3.5],[46.2,4.0],[46.0,4.8],
             [45.5,4.5],[44.8,4.0],[44.4,3.2],[44.3,2.5],[44.6,1.9]] },
  { id: 'tribu_verte', color: '#16a34a', strokeColor: '#4ade80',
    points: [[47.8,6.5],[48.0,7.0],[48.5,7.6],[49.0,7.5],[49.2,7.2],
             [49.0,6.5],[48.5,6.2],[48.0,6.3]] },
  { id: 'marshals', color: '#71717a', strokeColor: '#a1a1aa',
    points: [[45.8,3.1],[45.5,2.5],[45.0,1.5],[44.5,0.5],[44.0,-0.3],[43.6,-0.8],
             [44.2,-1.0],[44.8,-0.3],[45.2,0.6],[45.8,1.6],[46.1,2.8]] },
];

export function buildFactionPath(points: [number, number][]): string {
  const pts = points.map(([lat, lon]) => latLonToSvg(lat, lon));
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
}

// ── Coordonnées lng/lat pour MapLibre GL ──────────────────────────────────
export const BASE_LNGLAT: [number, number] = [2.0, 47.9]; // Orléans

export const ZONE_LNGLAT: Record<string, [number, number]> = {
  forest:         [1.9,  47.5],   // Forêt de Sologne
  suburbs:        [2.1,  47.95],  // Faubourgs d'Orléans
  signal_contact: [1.5,  48.4],   // Chartres
  urban_ruins:    [2.35, 48.87],  // Paris
  hospital:       [0.7,  47.4],   // Tours
  industrial:     [1.1,  49.4],   // Rouen
  military_base:  [4.5,  49.1],   // Camp de Suippes
  laboratory:     [4.83, 45.73],  // Lyon
};
