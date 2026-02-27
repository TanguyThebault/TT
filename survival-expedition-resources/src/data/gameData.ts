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
  maxDurability: number;
  durability: number; // current value (instance-level)
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

/** Valeur d'échange de chaque ressource (plus c'est rare, plus la valeur est haute). */
export const RESOURCE_RARITY: Record<string, number> = {
  food:        1,
  scrap:       1,
  materials:   2,
  fuel:        3,
  medicine:    4,
  electronics: 6,
};

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
    description: 'Stocker des véhicules utilisables en expédition.',
    icon: 'Car',
    maxLevel: 5,
    baseCost: { scrap: 30, fuel: 15, materials: 10 },
    costMultiplier: 1.8,
    benefits: [
      '4 places de garage',
      '8 places de garage',
      '12 places de garage',
      '16 places de garage',
      '20 places de garage',
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
  {
    id: 'armory',
    name: 'Armurerie',
    description: 'Augmenter la capacité de stockage de l\'inventaire d\'équipements.',
    icon: 'Package',
    maxLevel: 5,
    baseCost: { scrap: 20, materials: 15 },
    costMultiplier: 1.7,
    benefits: [
      'Inventaire: 25 objets',
      'Inventaire: 32 objets',
      'Inventaire: 40 objets',
      'Inventaire: 50 objets',
      'Inventaire: 65 objets',
    ],
  },
];

export const ZONES: ZoneDef[] = [
  {
    id: 'forest',
    name: 'Forêt Sauvage',
    description: 'Une forêt dense en périphérie. Peu de dangers, mais la faune locale peut surprendre. Source de nourriture fiable.',
    icon: 'Trees',
    baseDuration: 240, // 4 min
    dangerLevel: 1,
    lootTable: [
      { type: 'resource', id: 'food', name: 'Nourriture', minQty: 8, maxQty: 20, chance: 0.95 },
      { type: 'resource', id: 'food', name: 'Nourriture (gibier)', minQty: 5, maxQty: 12, chance: 0.6 },
      { type: 'resource', id: 'food', name: 'Nourriture (baies)', minQty: 3, maxQty: 8, chance: 0.7 },
    ],
  },
  {
    id: 'suburbs',
    name: 'Banlieue Dévastée',
    description: 'Quartiers résidentiels en ruines. Faible danger, ressources basiques.',
    icon: 'Home',
    baseDuration: 240, // 4 min
    dangerLevel: 2,
    lootTable: [
      { type: 'resource', id: 'food', name: 'Nourriture', minQty: 5, maxQty: 15, chance: 0.9 },
      { type: 'resource', id: 'scrap', name: 'Ferraille', minQty: 3, maxQty: 10, chance: 0.8 },
      { type: 'resource', id: 'materials', name: 'Matériaux', minQty: 2, maxQty: 8, chance: 0.6 },
      { type: 'resource', id: 'electronics', name: 'Électronique', minQty: 1, maxQty: 3, chance: 0.4 },
      { type: 'equipment', id: 'pipe_weapon', name: 'Tuyau en Plomb', minQty: 1, maxQty: 1, chance: 0.15 },
    ],
  },
  {
    id: 'urban_ruins',
    name: 'Ruines Urbaines',
    description: 'Centre-ville effondré. Danger modéré, bonnes ressources.',
    icon: 'Building2',
    baseDuration: 600, // 10 min
    dangerLevel: 3,
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
    baseDuration: 1200, // 20 min
    dangerLevel: 5,
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
    id: 'signal_contact',
    name: 'Fréquence Inconnue',
    description: 'Un signal radio stable capté sur une fréquence inutilisée. Rythmé, structuré — pas un accident. La zone de transmission semble dégagée, aucune menace détectée dans le périmètre.',
    icon: 'Radio',
    baseDuration: 480, // 8 min
    dangerLevel: 0,
    requiredBuildingLevel: { buildingId: 'radio', level: 2 },
    lootTable: [],
  },
  {
    id: 'hospital',
    name: 'Hôpital Abandonné',
    description: 'Ancien hôpital. Danger modéré, médicaments abondants.',
    icon: 'Cross',
    baseDuration: 840, // 14 min
    dangerLevel: 4,
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
    baseDuration: 1080, // 18 min
    dangerLevel: 5,
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
    baseDuration: 1800, // 30 min
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

const D = (maxDurability: number) => ({ maxDurability, durability: maxDurability });

export const ALL_EQUIPMENT: EquipmentDef[] = [
  // Tier 1
  { id: 'pipe_weapon', name: 'Tuyau en Plomb',       slot: 'weapon',   tier: 1, stats: { combat: 3 },                               ...D(80) },
  { id: 'rags_armor',  name: 'Armure de Fortune',     slot: 'armor',    tier: 1, stats: { health: 10 },                              ...D(80) },
  { id: 'basic_pack',  name: 'Sac à Dos Basique',     slot: 'backpack', tier: 1, stats: { carryCapacity: 5, scavenging: 1 },         ...D(80) },
  // Tier 2
  { id: 'machete',       name: 'Machette',            slot: 'weapon',   tier: 2, stats: { combat: 6, scavenging: 1 },                ...D(100) },
  { id: 'leather_armor', name: 'Armure de Cuir',      slot: 'armor',    tier: 2, stats: { health: 20, combat: 2 },                   ...D(100) },
  { id: 'hiking_pack',   name: 'Sac de Randonnée',    slot: 'backpack', tier: 2, stats: { carryCapacity: 10, scavenging: 2 },        ...D(100) },
  // Tier 3
  { id: 'combat_rifle',  name: 'Fusil de Combat',     slot: 'weapon',   tier: 3, stats: { combat: 12, scavenging: 2 },               ...D(120) },
  { id: 'tactical_vest', name: 'Gilet Tactique',      slot: 'armor',    tier: 3, stats: { health: 35, combat: 5 },                   ...D(120) },
  { id: 'military_pack', name: 'Sac Militaire',       slot: 'backpack', tier: 3, stats: { carryCapacity: 18, scavenging: 4 },        ...D(120) },
  { id: 'medkit',        name: 'Kit Médical Pro',     slot: 'backpack', tier: 3, stats: { medical: 8, carryCapacity: 5 },            ...D(120) },
  // Tier 4
  { id: 'plasma_cutter', name: 'Découpeur Plasma',    slot: 'weapon',   tier: 4, stats: { combat: 20, engineering: 5 },              ...D(150) },
  { id: 'hazmat_suit',   name: 'Combinaison HAZMAT',  slot: 'armor',    tier: 4, stats: { health: 50, medical: 5, engineering: 3 },  ...D(150) },
  { id: 'heavy_pack',    name: 'Sac Renforcé',        slot: 'backpack', tier: 4, stats: { carryCapacity: 25, scavenging: 6 },        ...D(150) },
  // Tier 5
  { id: 'railgun',       name: 'Railgun Prototype',   slot: 'weapon',   tier: 5, stats: { combat: 30, engineering: 8 },              ...D(200) },
  { id: 'power_armor',   name: 'Armure Assistée',     slot: 'armor',    tier: 5, stats: { health: 80, combat: 10, engineering: 5 },  ...D(200) },
  { id: 'quantum_pack',  name: 'Sac Quantique',       slot: 'backpack', tier: 5, stats: { carryCapacity: 40, scavenging: 10 },       ...D(200) },
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

export const SURVIVOR_FIRST_NAMES_MALE = [
  'Marcus', 'Viktor', 'Axel', 'Dante', 'Rook', 'Finn', 'Kael', 'Gabriel',
  'Raphaël', 'Léo', 'Louis', 'Noah', 'Arthur', 'Adam', 'Jules', 'Maël',
  'Léon', 'Lucas', 'Gabin', 'Isaac', 'Liam', 'Sacha', 'Elio', 'Naël',
  'Marceau', 'Hugo', 'Ethan', 'Nathan', 'Gaspard', 'Victor', 'Paul',
  'Simon', 'Tom', 'Noé', 'Malo', 'Eliott', 'Milo', 'Basile', 'Théo',
  'Clément', 'Antoine', 'Maxence', 'Baptiste', 'Martin', 'Kylian', 'Nolan',
  'Élias', 'Aaron', 'Auguste', 'Henri', 'Charles', 'Émile', 'Félix', 'Jérôme',
  'Théodore', 'Gautier', 'Romain', 'Adrien', 'Benjamin', 'Damien', 'Sébastien',
  'Yann', 'Tristan', 'Alexandre', 'Matteo', 'Evan', 'Enzo', 'Mathis', 'Robin',
  'Valentin', 'Samuel', 'Pierre', 'Joseph', 'François', 'Laurent', 'Olivier',
  'Julien', 'Nicolas', 'Thomas', 'Rémi', 'Loup', 'Arsène', 'Côme', 'Amaury'
];

export const SURVIVOR_FIRST_NAMES_FEMALE = [
  'Elena', 'Jade', 'Nadia', 'Mira', 'Sasha', 'Zara', 'Lyra', 'Nova',
  'Louise', 'Ambre', 'Alba', 'Emma', 'Alma', 'Romy', 'Rose', 'Alice',
  'Anna', 'Mia', 'Lina', 'Léna', 'Inaya', 'Lou', 'Agathe', 'Olivia',
  'Juliette', 'Margot', 'Chloé', 'Giulia', 'Jeanne', 'Adèle', 'Iris',
  'Eva', 'Livia', 'Charlie', 'Camille', 'Zoé', 'Léa', 'Clara', 'Manon',
  'Éloïse', 'Victoria', 'Capucine', 'Maëlys', 'Anaïs', 'Noémie', 'Lila',
  'Océane', 'Romane', 'Suzanne', 'Apolline', 'Céleste', 'Éléonore',
  'Héloïse', 'Garance', 'Victoire', 'Mathilde', 'Pauline', 'Joséphine',
  'Madeleine', 'Geneviève', 'Colette', 'Simone', 'Yasmine', 'Aurore',
  'Solène', 'Maëlle', 'Eline', 'Louna', 'Ava', 'Lya', 'Sofia', 'Louna',
  'Gabrielle', 'Thaïs', 'Léonie', 'Coline', 'Morgane', 'Sixtine', 'Esmée'
];

export const SURVIVOR_FIRST_NAMES = [
  ...SURVIVOR_FIRST_NAMES_MALE,
  ...SURVIVOR_FIRST_NAMES_FEMALE,
];

export const SURVIVOR_LAST_NAMES = [
  'Volkov', 'Chen', 'Reeves', 'Okafor', 'Moreau', 'Tanaka', 'Silva',
  'Kruger', 'Vasquez', 'Petrov', 'Nakamura', 'Dubois', 'Kowalski', 'Brennan', 'Ortega',
  'Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Leroy',
  'Lefebvre', 'Simon', 'Rousseau', 'Faure', 'Michel', 'Laurent', 'Garnier', 'Roux',
  'Vincent', 'Fournier', 'Morel', 'Girard', 'André', 'Mercier', 'Blanc', 'Gauthier',
  'Lambert', 'Barbier', 'Fontaine', 'Masson', 'Perrin', 'Chevalier', 'Morin', 'Marchand',
  'Dupont', 'Lemaire', 'Schneider', 'Royer', 'Klein', 'Carpentier', 'Rolland', 'Sanchez',
  'Denis', 'Lacroix', 'Meyer', 'Philippe', 'Garcia', 'David', 'Pierre', 'Boyer',
  'Renard', 'Schmitt', 'Robin', 'Roussel', 'Dufour', 'Colin', 'Muller', 'Leroy',
  'Joly', 'Gaillard', 'Jean', 'Perrot', 'Roche', 'Vidal', 'Benoit', 'Mathieu',
  'Caron', 'Marty', 'Philippe', 'Louis', 'Dupuis', 'Fabre', 'Clement', 'Charpentier',
  'Fernandez', 'Lopez', 'Henry', 'Remy', 'Besson', 'Laporte', 'Arnaud', 'Leduc',
  'Prevost', 'Pons', 'Olivier', 'Jacques', 'Gilles', 'Marchal', 'Guillot', 'Breton'
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


export function getDangerReduction(watchtowerLevel: number): number {
  const reds = [0, 0.05, 0.12, 0.20, 0.30, 0.40];
  return reds[Math.min(watchtowerLevel, 5)];
}

export function getInventoryCapacity(armoryLevel: number): number {
  const caps = [20, 25, 32, 40, 50, 65];
  return caps[Math.min(armoryLevel, 5)];
}

// ── Training ──────────────────────────────────────────────────────────────────

export type TrainableStat = 'combat' | 'medical' | 'engineering';

/** Durées d'entraînement en secondes pour les niveaux 1, 2 et 3. */
export const TRAINING_DURATIONS: [number, number, number] = [3600, 10800, 36000];

/** Bâtiment requis pour chaque statistique entraînable. */
export const TRAINING_BUILDING_REQ: Record<TrainableStat, string> = {
  combat:      'armory',
  medical:     'infirmary',
  engineering: 'workshop',
};

export const TRAINING_STAT_LABELS: Record<TrainableStat, string> = {
  combat:      'Combat',
  medical:     'Médical',
  engineering: 'Ingénierie',
};

/** Niveau minimum du bâtiment pour débloquer l'entraînement niveau n (1-3). */
export function getTrainingBuildingLevel(trainingLevel: number): number {
  return trainingLevel + 1; // nv.1 → bâtiment lv.2, nv.2 → lv.3, nv.3 → lv.4
}

// ── Recycling ─────────────────────────────────────────────────────────────────

/** Niveau d'ingénierie minimum pour recycler un objet selon son tier. */
export function getRecycleMinEngineering(tier: number): number {
  return tier * 2;
}

/** Durée du recyclage en secondes selon le tier de l'objet. */
export function getRecycleDuration(tier: number): number {
  return tier * 60;
}

/**
 * Calcule le rendement de recyclage d'un objet.
 * Basé sur la recette de fabrication : taux de récupération entre 30 % (niveau minimal)
 * et 80 % (niveau max), +5 % par niveau d'ingénierie au-dessus du minimum.
 */
export function getRecycleYield(item: EquipmentDef, engineeringLevel: number): Record<string, number> {
  const recipe = CRAFT_RECIPES[item.id];
  if (!recipe) return { scrap: Math.max(1, Math.floor(item.tier * engineeringLevel * 0.3)) };
  const minEng = getRecycleMinEngineering(item.tier);
  const recoveryRate = Math.min(0.80, 0.30 + Math.max(0, engineeringLevel - minEng) * 0.05);
  const result: Record<string, number> = {};
  for (const [res, amount] of Object.entries(recipe)) {
    const qty = Math.floor(amount * recoveryRate);
    if (qty > 0) result[res] = qty;
  }
  return result;
}

// ── Barter / Trade ────────────────────────────────────────────────────────────

/**
 * Valeur d'échange d'un équipement selon son tier :
 * T1=1, T2=5, T3=25, T4=125, T5=625.
 */
export function getEquipmentTradeValue(tier: number): number {
  return Math.pow(5, tier - 1);
}

// ── Garage / Vehicles ─────────────────────────────────────────────────────────

export interface VehicleDef {
  id: string;
  name: string;
  spaces: number;
  /** Réduction de durée d'expédition (0–1). La vitesse du groupe est celle
   *  du véhicule le plus lent. Si un survivant est à pied : aucun bonus. */
  speed: number;
  /** Niveau de bruit (0–4). Utilisé par le véhicule le plus bruyant du convoi.
   *  Chaque point ajoute +0.25 au danger effectif de la zone. */
  noise: number;
  /** Bonus de combat ajouté à l'équipe lors des affrontements. */
  combat: number;
  description: string;
}

export const VEHICLE_DEFS: VehicleDef[] = [
  //                                              speed  noise  combat
  { id: 'bike',        name: 'Vélo',       spaces: 1,  speed: 0.12, noise: 0, combat:  0, description: 'Silencieux, passe partout, lent'          },
  { id: 'moto',        name: 'Moto',       spaces: 2,  speed: 0.45, noise: 3, combat:  0, description: 'Rapide, bon franchissement, bruyant'        },
  { id: 'compact',     name: 'Citadine',   spaces: 4,  speed: 0.08, noise: 1, combat:  0, description: 'Discret, mauvais hors-route'                },
  { id: 'sedan',       name: 'Berline',    spaces: 6,  speed: 0.05, noise: 1, combat:  0, description: 'Spacieuse, très mauvais franchissement'     },
  { id: 'suv',         name: '4×4',        spaces: 8,  speed: 0.30, noise: 3, combat:  0, description: 'Rapide, excellent tout-terrain, bruyant'    },
  { id: 'armored_suv', name: '4×4 Blindé', spaces: 10, speed: 0.20, noise: 4, combat: 15, description: 'Blindé, armé, très bruyant'                 },
];

/** Capacité du garage en nombre de places selon le niveau (4 places par niveau). */
export function getGarageCapacity(level: number): number {
  return level * 4;
}
