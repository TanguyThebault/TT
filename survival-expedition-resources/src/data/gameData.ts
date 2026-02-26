export interface BuildingDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
  baseCost: Record<string, number>;
  costMultiplier: number;
  benefits: string[];
}

export interface ZoneDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  baseDuration: number; // in seconds
  dangerLevel: number; // 1-5
  lootTable: LootEntry[];
  requiredBuildingLevel?: { buildingId: string; level: number };
}

export interface LootEntry {
  type: 'resource' | 'equipment';
  id: string;
  name: string;
  minQty: number;
  maxQty: number;
  chance: number; // 0-1
}

export interface EquipmentDef {
  id: string;
  name: string;
  slot: 'weapon' | 'armor' | 'backpack';
  tier: number; // 1-5
  stats: {
    combat?: number;
    scavenging?: number;
    medical?: number;
    engineering?: number;
    health?: number;
    carryCapacity?: number;
  };
  craftCost?: Record<string, number>;
}

export interface ResourceDef {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const RESOURCES: ResourceDef[] = [
  { id: 'food', name: 'Nourriture', icon: 'Apple', color: '#4ade80' },
  { id: 'scrap', name: 'Ferraille', icon: 'Wrench', color: '#94a3b8' },
  { id: 'medicine', name: 'Médicaments', icon: 'Pill', color: '#f472b6' },
  { id: 'fuel', name: 'Carburant', icon: 'Fuel', color: '#fbbf24' },
  { id: 'electronics', name: 'Électronique', icon: 'Cpu', color: '#60a5fa' },
  { id: 'materials', name: 'Matériaux', icon: 'Boxes', color: '#a78bfa' },
];

export const BUILDINGS: BuildingDef[] = [
  {
    id: 'workshop',
    name: 'Atelier',
    description: 'Fabriquer et améliorer l\'équipement des survivants.',
    icon: 'Hammer',
    maxLevel: 5,
    baseCost: { scrap: 20, materials: 10 },
    costMultiplier: 1.8,
    benefits: [
      'Débloque la fabrication Tier 1',
      'Débloque la fabrication Tier 2',
      'Débloque la fabrication Tier 3',
      'Débloque la fabrication Tier 4',
      'Débloque la fabrication Tier 5',
    ],
  },
  {
    id: 'infirmary',
    name: 'Infirmerie',
    description: 'Soigner les survivants blessés plus rapidement.',
    icon: 'Heart',
    maxLevel: 5,
    baseCost: { scrap: 15, medicine: 10 },
    costMultiplier: 1.7,
    benefits: [
      'Soin passif +10%',
      'Soin passif +25%',
      'Soin passif +40%',
      'Soin passif +60%',
      'Soin passif +80%',
    ],
  },
  {
    id: 'storage',
    name: 'Entrepôt',
    description: 'Augmenter la capacité de stockage des ressources.',
    icon: 'Warehouse',
    maxLevel: 5,
    baseCost: { scrap: 25, materials: 15 },
    costMultiplier: 1.6,
    benefits: [
      'Capacité +50',
      'Capacité +100',
      'Capacité +200',
      'Capacité +350',
      'Capacité +500',
    ],
  },
  {
    id: 'barracks',
    name: 'Caserne',
    description: 'Accueillir plus de survivants dans la base.',
    icon: 'Users',
    maxLevel: 5,
    baseCost: { scrap: 30, materials: 20, food: 15 },
    costMultiplier: 2.0,
    benefits: [
      'Capacité: 6 survivants',
      'Capacité: 8 survivants',
      'Capacité: 10 survivants',
      'Capacité: 12 survivants',
      'Capacité: 15 survivants',
    ],
  },
  {
    id: 'watchtower',
    name: 'Tour de Guet',
    description: 'Réduire les risques lors des expéditions.',
    icon: 'Eye',
    maxLevel: 5,
    baseCost: { scrap: 20, materials: 25 },
    costMultiplier: 1.9,
    benefits: [
      'Risque -5%',
      'Risque -12%',
      'Risque -20%',
      'Risque -30%',
      'Risque -40%',
    ],
  },
  {
    id: 'radio',
    name: 'Station Radio',
    description: 'Déverrouiller de nouvelles zones d\'expédition.',
    icon: 'Radio',
    maxLevel: 5,
    baseCost: { scrap: 15, electronics: 20 },
    costMultiplier: 2.0,
    benefits: [
      'Zone: Ruines Urbaines',
      'Zone: Base Militaire',
      'Zone: Hôpital Abandonné',
      'Zone: Complexe Industriel',
      'Zone: Laboratoire Secret',
    ],
  },
  {
    id: 'garage',
    name: 'Garage',
    description: 'Réduire la durée des expéditions.',
    icon: 'Car',
    maxLevel: 5,
    baseCost: { scrap: 30, fuel: 15, materials: 10 },
    costMultiplier: 1.8,
    benefits: [
      'Durée -10%',
      'Durée -20%',
      'Durée -30%',
      'Durée -40%',
      'Durée -50%',
    ],
  },
  {
    id: 'farm',
    name: 'Potager',
    description: 'Produire de la nourriture passivement.',
    icon: 'Sprout',
    maxLevel: 5,
    baseCost: { materials: 20, food: 5 },
    costMultiplier: 1.5,
    benefits: [
      '+1 nourriture/min',
      '+2 nourriture/min',
      '+4 nourriture/min',
      '+7 nourriture/min',
      '+10 nourriture/min',
    ],
  },
];

export const ZONES: ZoneDef[] = [
  {
    id: 'suburbs',
    name: 'Banlieue Dévastée',
    description: 'Quartiers résidentiels en ruines. Faible danger, ressources basiques.',
    icon: 'Home',
    baseDuration: 120, // 2 min for testing (would be 30min in prod)
    dangerLevel: 1,
    lootTable: [
      { type: 'resource', id: 'food', name: 'Nourriture', minQty: 5, maxQty: 15, chance: 0.9 },
      { type: 'resource', id: 'scrap', name: 'Ferraille', minQty: 3, maxQty: 10, chance: 0.8 },
      { type: 'resource', id: 'materials', name: 'Matériaux', minQty: 2, maxQty: 8, chance: 0.6 },
      { type: 'equipment', id: 'pipe_weapon', name: 'Tuyau en Plomb', minQty: 1, maxQty: 1, chance: 0.15 },
    ],
  },
  {
    id: 'urban_ruins',
    name: 'Ruines Urbaines',
    description: 'Centre-ville effondré. Danger modéré, bonnes ressources.',
    icon: 'Building2',
    baseDuration: 300, // 5 min
    dangerLevel: 2,
    requiredBuildingLevel: { buildingId: 'radio', level: 1 },
    lootTable: [
      { type: 'resource', id: 'scrap', name: 'Ferraille', minQty: 8, maxQty: 25, chance: 0.9 },
      { type: 'resource', id: 'electronics', name: 'Électronique', minQty: 2, maxQty: 8, chance: 0.5 },
      { type: 'resource', id: 'materials', name: 'Matériaux', minQty: 5, maxQty: 15, chance: 0.7 },
      { type: 'resource', id: 'fuel', name: 'Carburant', minQty: 2, maxQty: 6, chance: 0.4 },
      { type: 'equipment', id: 'leather_armor', name: 'Armure de Cuir', minQty: 1, maxQty: 1, chance: 0.2 },
    ],
  },
  {
    id: 'military_base',
    name: 'Base Militaire',
    description: 'Installation militaire abandonnée. Danger élevé, équipement rare.',
    icon: 'Shield',
    baseDuration: 600, // 10 min
    dangerLevel: 4,
    requiredBuildingLevel: { buildingId: 'radio', level: 2 },
    lootTable: [
      { type: 'resource', id: 'scrap', name: 'Ferraille', minQty: 10, maxQty: 30, chance: 0.8 },
      { type: 'resource', id: 'fuel', name: 'Carburant', minQty: 5, maxQty: 15, chance: 0.7 },
      { type: 'resource', id: 'electronics', name: 'Électronique', minQty: 5, maxQty: 12, chance: 0.6 },
      { type: 'equipment', id: 'combat_rifle', name: 'Fusil de Combat', minQty: 1, maxQty: 1, chance: 0.25 },
      { type: 'equipment', id: 'tactical_vest', name: 'Gilet Tactique', minQty: 1, maxQty: 1, chance: 0.2 },
    ],
  },
  {
    id: 'hospital',
    name: 'Hôpital Abandonné',
    description: 'Ancien hôpital. Danger modéré, médicaments abondants.',
    icon: 'Cross',
    baseDuration: 420, // 7 min
    dangerLevel: 3,
    requiredBuildingLevel: { buildingId: 'radio', level: 3 },
    lootTable: [
      { type: 'resource', id: 'medicine', name: 'Médicaments', minQty: 10, maxQty: 30, chance: 0.9 },
      { type: 'resource', id: 'food', name: 'Nourriture', minQty: 3, maxQty: 8, chance: 0.5 },
      { type: 'resource', id: 'electronics', name: 'Électronique', minQty: 2, maxQty: 6, chance: 0.4 },
      { type: 'equipment', id: 'medkit', name: 'Kit Médical Pro', minQty: 1, maxQty: 1, chance: 0.3 },
    ],
  },
  {
    id: 'industrial',
    name: 'Complexe Industriel',
    description: 'Usines et entrepôts. Danger élevé, matériaux en masse.',
    icon: 'Factory',
    baseDuration: 540, // 9 min
    dangerLevel: 4,
    requiredBuildingLevel: { buildingId: 'radio', level: 4 },
    lootTable: [
      { type: 'resource', id: 'scrap', name: 'Ferraille', minQty: 15, maxQty: 40, chance: 0.95 },
      { type: 'resource', id: 'materials', name: 'Matériaux', minQty: 10, maxQty: 30, chance: 0.9 },
      { type: 'resource', id: 'fuel', name: 'Carburant', minQty: 5, maxQty: 20, chance: 0.7 },
      { type: 'resource', id: 'electronics', name: 'Électronique', minQty: 3, maxQty: 10, chance: 0.5 },
      { type: 'equipment', id: 'heavy_pack', name: 'Sac Renforcé', minQty: 1, maxQty: 1, chance: 0.25 },
    ],
  },
  {
    id: 'laboratory',
    name: 'Laboratoire Secret',
    description: 'Installation de recherche secrète. Danger extrême, trésors technologiques.',
    icon: 'FlaskConical',
    baseDuration: 900, // 15 min
    dangerLevel: 5,
    requiredBuildingLevel: { buildingId: 'radio', level: 5 },
    lootTable: [
      { type: 'resource', id: 'electronics', name: 'Électronique', minQty: 15, maxQty: 40, chance: 0.9 },
      { type: 'resource', id: 'medicine', name: 'Médicaments', minQty: 10, maxQty: 25, chance: 0.7 },
      { type: 'resource', id: 'materials', name: 'Matériaux', minQty: 5, maxQty: 15, chance: 0.6 },
      { type: 'equipment', id: 'plasma_cutter', name: 'Découpeur Plasma', minQty: 1, maxQty: 1, chance: 0.3 },
      { type: 'equipment', id: 'hazmat_suit', name: 'Combinaison HAZMAT', minQty: 1, maxQty: 1, chance: 0.25 },
    ],
  },
];

export const ALL_EQUIPMENT: EquipmentDef[] = [
  // Tier 1
  { id: 'pipe_weapon', name: 'Tuyau en Plomb', slot: 'weapon', tier: 1, stats: { combat: 3 } },
  { id: 'rags_armor', name: 'Armure de Fortune', slot: 'armor', tier: 1, stats: { health: 10 } },
  { id: 'basic_pack', name: 'Sac à Dos Basique', slot: 'backpack', tier: 1, stats: { carryCapacity: 5, scavenging: 1 } },
  // Tier 2
  { id: 'machete', name: 'Machette', slot: 'weapon', tier: 2, stats: { combat: 6, scavenging: 1 } },
  { id: 'leather_armor', name: 'Armure de Cuir', slot: 'armor', tier: 2, stats: { health: 20, combat: 2 } },
  { id: 'hiking_pack', name: 'Sac de Randonnée', slot: 'backpack', tier: 2, stats: { carryCapacity: 10, scavenging: 2 } },
  // Tier 3
  { id: 'combat_rifle', name: 'Fusil de Combat', slot: 'weapon', tier: 3, stats: { combat: 12, scavenging: 2 } },
  { id: 'tactical_vest', name: 'Gilet Tactique', slot: 'armor', tier: 3, stats: { health: 35, combat: 5 } },
  { id: 'military_pack', name: 'Sac Militaire', slot: 'backpack', tier: 3, stats: { carryCapacity: 18, scavenging: 4 } },
  { id: 'medkit', name: 'Kit Médical Pro', slot: 'backpack', tier: 3, stats: { medical: 8, carryCapacity: 5 } },
  // Tier 4
  { id: 'plasma_cutter', name: 'Découpeur Plasma', slot: 'weapon', tier: 4, stats: { combat: 20, engineering: 5 } },
  { id: 'hazmat_suit', name: 'Combinaison HAZMAT', slot: 'armor', tier: 4, stats: { health: 50, medical: 5, engineering: 3 } },
  { id: 'heavy_pack', name: 'Sac Renforcé', slot: 'backpack', tier: 4, stats: { carryCapacity: 25, scavenging: 6 } },
  // Tier 5
  { id: 'railgun', name: 'Railgun Prototype', slot: 'weapon', tier: 5, stats: { combat: 30, engineering: 8 } },
  { id: 'power_armor', name: 'Armure Assistée', slot: 'armor', tier: 5, stats: { health: 80, combat: 10, engineering: 5 } },
  { id: 'quantum_pack', name: 'Sac Quantique', slot: 'backpack', tier: 5, stats: { carryCapacity: 40, scavenging: 10 } },
];

export const CRAFT_RECIPES: Record<string, Record<string, number>> = {
  pipe_weapon: { scrap: 10 },
  rags_armor: { materials: 8 },
  basic_pack: { materials: 5, scrap: 5 },
  machete: { scrap: 25, materials: 10 },
  leather_armor: { materials: 20, scrap: 15 },
  hiking_pack: { materials: 15, scrap: 10 },
  combat_rifle: { scrap: 40, electronics: 10, materials: 15 },
  tactical_vest: { materials: 30, scrap: 25, electronics: 5 },
  military_pack: { materials: 25, scrap: 20 },
  medkit: { medicine: 20, materials: 10, electronics: 5 },
  plasma_cutter: { electronics: 30, scrap: 40, fuel: 15 },
  hazmat_suit: { materials: 40, electronics: 20, medicine: 15 },
  heavy_pack: { materials: 35, scrap: 25, fuel: 10 },
  railgun: { electronics: 50, scrap: 60, fuel: 25, materials: 20 },
  power_armor: { scrap: 80, electronics: 40, materials: 50, fuel: 20 },
  quantum_pack: { electronics: 60, materials: 40, scrap: 30 },
};

export const SURVIVOR_FIRST_NAMES = [
  'Elena', 'Marcus', 'Jade', 'Viktor', 'Nadia', 'Axel', 'Mira', 'Dante',
  'Sasha', 'Rook', 'Zara', 'Finn', 'Lyra', 'Kael', 'Nova',
];

export const SURVIVOR_LAST_NAMES = [
  'Volkov', 'Chen', 'Reeves', 'Okafor', 'Moreau', 'Tanaka', 'Silva',
  'Kruger', 'Vasquez', 'Petrov', 'Nakamura', 'Dubois', 'Kowalski', 'Brennan', 'Ortega',
];

export const SURVIVOR_TRAITS = [
  'Éclaireur', 'Médecin', 'Ingénieur', 'Combattant', 'Pilleur',
  'Tacticien', 'Mécanicien', 'Chimiste', 'Tireur d\'élite', 'Survivaliste',
];

export function getUpgradeCost(building: BuildingDef, currentLevel: number): Record<string, number> {
  const cost: Record<string, number> = {};
  for (const [res, base] of Object.entries(building.baseCost)) {
    cost[res] = Math.floor(base * Math.pow(building.costMultiplier, currentLevel));
  }
  return cost;
}

export function getStorageCapacity(storageLevel: number): number {
  const caps = [100, 150, 200, 300, 450, 600];
  return caps[Math.min(storageLevel, 5)];
}

export function getMaxSurvivors(barracksLevel: number): number {
  const caps = [4, 6, 8, 10, 12, 15];
  return caps[Math.min(barracksLevel, 5)];
}

export function getExpeditionDurationMultiplier(garageLevel: number): number {
  const mults = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5];
  return mults[Math.min(garageLevel, 5)];
}

export function getDangerReduction(watchtowerLevel: number): number {
  const reds = [0, 0.05, 0.12, 0.20, 0.30, 0.40];
  return reds[Math.min(watchtowerLevel, 5)];
}
