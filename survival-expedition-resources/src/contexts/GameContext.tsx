import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import {
  BUILDINGS, ZONES, ALL_EQUIPMENT, CRAFT_RECIPES,
  SURVIVOR_FIRST_NAMES_MALE, SURVIVOR_FIRST_NAMES_FEMALE, SURVIVOR_LAST_NAMES, SURVIVOR_TRAITS,
  getUpgradeCost, getStorageCapacity,
  getDangerReduction, getMaxSurvivors,
  getRecycleYield, getRecycleDuration, getCraftDuration,
  TRAINING_DURATIONS, TRAINING_BUILDING_REQ, TRAINING_STAT_LABELS, getTrainingBuildingLevel,
  RESOURCE_RARITY, getEquipmentTradeValue,
  VEHICLE_DEFS, getGarageCapacity, getCategoryDef,
  FOOD_PER_SURVIVOR_PER_HOUR, FARM_FOOD_PER_MINUTE, RAID_CHANCE_PER_TICK, RAID_COOLDOWN_MS,
  HEALING_MEDICINE_FACTOR, FARM_BONUS_PER_FARMER,
  type TrainableStat, type EquipmentDef, type ZoneDef,
} from '@/data/gameData';
import { TILE_BY_ID, synthZoneDef } from '@/data/tileMap';

// Types
export interface Survivor {
  id: string;
  name: string;
  gender: 'male' | 'female';
  trait: string;
  skills: { combat: number; scavenging: number; medical: number; engineering: number };
  health: number;
  maxHealth: number;
  equipment: { weapon: EquipmentDef | null; armor: EquipmentDef | null; backpack: EquipmentDef | null };
  status: 'available' | 'expedition' | 'injured' | 'recycling' | 'training' | 'resting' | 'crafting' | 'healing' | 'farming';
  restingUntil?: number;
  expeditionId?: string;
  recycleTaskId?: string;
  trainingTaskId?: string;
  craftTaskId?: string;
  healingTaskId?: string;
  farmingTaskId?: string;
  trainingCounts?: Partial<Record<TrainableStat, number>>;
}

export interface TrainingTask {
  id: string;
  survivorId: string;
  stat: TrainableStat;
  level: number; // 1 | 2 | 3
  startTime: number;
  duration: number;
}

export interface RecycleTask {
  id: string;
  survivorId: string;
  item: EquipmentDef;
  startTime: number;
  duration: number;
  engineeringLevel: number;
}

export interface CraftingTask {
  id: string;
  survivorId: string;
  itemId: string;
  item: EquipmentDef;
  startTime: number;
  duration: number;
  engineeringLevel: number;
}

export interface HealingTask {
  id: string;
  healerId: string;
  targetId: string;
  startTime: number;
  duration: number;
  hpToRestore: number;
  medicineCost: number;
}

export interface FarmingTask {
  id: string;
  survivorId: string;
  startTime: number;
}

export interface GarageVehicle {
  id: string;
  type: string;
  name: string;
  spaces: number;
}

export interface VehicleMarker {
  id: string;
  tileId: string;
  vehicleTypeId: string;
  discoveredAt: number;
}

export interface PendingExpeditionEvent {
  id: string;
  type: 'ambush' | 'hidden_cache' | 'storm' | 'stranger' | 'vehicle_wreck' | 'faction_encounter';
  title: string;
  description: string;
  options: [
    { label: string; description: string },
    { label: string; description: string },
  ];
  triggeredAt: number;
  factionId?: string;
}

export interface PendingRecruit {
  id: string;
  survivor: Survivor;
  expiresAt: number; // timestamp expiration (now + 1h)
}

export interface TraderCamp {
  name: string;
  resources: Record<string, number>;
  equipment: EquipmentDef[];
}

export type TradeGive =
  | { kind: 'resource'; resourceId: string; quantity: number }
  | { kind: 'equipment'; inventoryIndex: number };

export type TradeReceive =
  | { kind: 'resource'; resourceId: string; quantity: number }
  | { kind: 'equipment'; campEquipIndex: number };

export interface Expedition {
  id: string;
  zoneId: string;
  survivorIds: string[];
  vehicleIds: string[];    // véhicules embarqués (peut être vide)
  speedReduction: number;  // réduction de durée effective appliquée (0–1)
  vehicleNoise: number;    // bruit maximal du convoi (0–4)
  vehicleCombat: number;   // bonus de combat total des véhicules
  startTime: number;
  duration: number;
  completed: boolean;
  results?: ExpeditionResult;
  retrievalMarkerId?: string; // si défini, c'est une expédition de récupération de véhicule
  pendingEvent?: PendingExpeditionEvent;   // événement en attente de décision
  resolvedEventChoice?: 0 | 1;            // choix fait par le joueur
  eventTriggered?: boolean;               // empêche la génération d'un second événement
}

export interface ExpeditionResult {
  resources: Record<string, number>;
  equipment: EquipmentDef[];
  events: string[];
  survivorDamage: Record<string, number>;
  recruitId?: string; // ID du PendingRecruit généré lors de cette expédition
  vehiclesFound?: string[]; // vehicleTypeIds ajoutés directement au garage (vélos uniquement)
  vehicleMarkersCreated?: string[]; // vehicleTypeIds pour lesquels un marqueur a été posé
  retrievedVehicleTypeId?: string; // vehicleTypeId récupéré lors d'une expédition de récupération
}

export interface GameState {
  resources: Record<string, number>;
  buildings: Record<string, number>;
  survivors: Survivor[];
  expeditions: Expedition[];
  inventory: EquipmentDef[];
  recyclingTasks: RecycleTask[];
  trainingTasks: TrainingTask[];
  craftingTasks: CraftingTask[];
  healingTasks: HealingTask[];
  farmingTasks: FarmingTask[];
  traderCampDiscovered: boolean;
  traderCamp: TraderCamp | null;
  discoveredZones: string[];
  discoveredTiles: string[];
  garageVehicles: GarageVehicle[];
  vehicleMarkers: VehicleMarker[];
  gameLog: { id: string; message: string; time: number; type: 'info' | 'success' | 'danger' | 'warning' }[];
  pendingResults: Expedition | null;
  pendingRecruits: PendingRecruit[];
  initialized: boolean;
  // Factions
  factionReputation: Record<string, number>;  // −10 à +10 par faction
  discoveredFactions: string[];
  // Menaces
  lastRaidAt?: number;    // timestamp du dernier raid
  foodAccum: number;      // accumulation fractionnaire nourriture (farm − consommation)
}

type GameAction =
  | { type: 'INIT_GAME'; state: GameState }
  | { type: 'UPGRADE_BUILDING'; buildingId: string }
  | { type: 'LAUNCH_EXPEDITION'; zoneId: string; survivorIds: string[]; vehicleIds: string[]; retrievalMarkerId?: string }
  | { type: 'COMPLETE_EXPEDITION'; expeditionId: string }
  | { type: 'VIEW_RESULTS'; expedition: Expedition | null }
  | { type: 'COLLECT_RESULTS' }
  | { type: 'EQUIP_ITEM'; survivorId: string; item: EquipmentDef }
  | { type: 'UNEQUIP_ITEM'; survivorId: string; slot: 'weapon' | 'armor' | 'backpack' }
  | { type: 'CRAFT_ITEM'; itemId: string }
  | { type: 'HEAL_SURVIVOR'; survivorId: string }
  | { type: 'REPAIR_ITEM'; survivorId: string; slot: 'weapon' | 'armor' | 'backpack' }
  | { type: 'ADD_LOG'; message: string; logType: 'info' | 'success' | 'danger' | 'warning' }
  | { type: 'START_RECYCLE'; survivorId: string; inventoryIndex: number }
  | { type: 'CANCEL_RECYCLE'; taskId: string }
  | { type: 'COMPLETE_RECYCLE'; taskId: string }
  | { type: 'START_TRAINING'; survivorId: string; stat: TrainableStat }
  | { type: 'CANCEL_TRAINING'; taskId: string }
  | { type: 'COMPLETE_TRAINING'; taskId: string }
  | { type: 'START_CRAFT'; survivorId: string; itemId: string }
  | { type: 'CANCEL_CRAFT'; taskId: string }
  | { type: 'COMPLETE_CRAFT'; taskId: string }
  | { type: 'EXECUTE_TRADE'; give: TradeGive; receive: TradeReceive }
  | { type: 'ADD_VEHICLE'; vehicleTypeId: string }
  | { type: 'REMOVE_VEHICLE'; vehicleId: string }
  | { type: 'DEV_SET_RESOURCE'; resourceId: string; value: number }
  | { type: 'ACCEPT_RECRUIT'; recruitId: string }
  | { type: 'DECLINE_RECRUIT'; recruitId: string }
  | { type: 'RESOLVE_EXPEDITION_EVENT'; expeditionId: string; choiceIndex: 0 | 1 }
  | { type: 'BAN_SURVIVOR'; survivorId: string }
  | { type: 'START_HEALING';   healerId: string; targetId: string }
  | { type: 'CANCEL_HEALING';  taskId: string }
  | { type: 'COMPLETE_HEALING'; taskId: string }
  | { type: 'START_FARMING';   survivorId: string }
  | { type: 'CANCEL_FARMING';  taskId: string }
  | { type: 'TICK' };

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getEffectiveEngineering(survivor: Survivor): number {
  let total = survivor.skills.engineering;
  for (const eq of Object.values(survivor.equipment)) {
    if (eq?.stats.engineering) total += eq.stats.engineering;
  }
  return total;
}

function generateTraderCamp(): TraderCamp {
  const campNames = ['Camp Delta', 'Refuge Boréal', 'Fort Émergence', 'Enclave Sirius', 'Bastion Omega'];
  const name = campNames[randomInt(0, campNames.length - 1)];
  const pool = ALL_EQUIPMENT.filter(e => e.tier <= 3);
  const equipCount = randomInt(2, 4);
  const equipment: EquipmentDef[] = [];
  for (let i = 0; i < equipCount; i++) equipment.push({ ...pool[randomInt(0, pool.length - 1)] });
  return {
    name,
    resources: {
      food:        randomInt(15, 50),
      scrap:       randomInt(10, 35),
      medicine:    randomInt(5, 20),
      fuel:        randomInt(4, 16),
      electronics: randomInt(2, 10),
      materials:   randomInt(8, 25),
    },
    equipment,
  };
}

function generateSurvivor(): Survivor {
  const gender: 'male' | 'female' = Math.random() < 0.5 ? 'male' : 'female';
  const namePool = gender === 'male' ? SURVIVOR_FIRST_NAMES_MALE : SURVIVOR_FIRST_NAMES_FEMALE;
  const firstName = namePool[randomInt(0, namePool.length - 1)];
  const lastName = SURVIVOR_LAST_NAMES[randomInt(0, SURVIVOR_LAST_NAMES.length - 1)];
  const trait = SURVIVOR_TRAITS[randomInt(0, SURVIVOR_TRAITS.length - 1)];
  const baseSkill = () => randomInt(1, 5);
  const skills = { combat: baseSkill(), scavenging: baseSkill(), medical: baseSkill(), engineering: baseSkill() };
  if (trait === 'Combattant' || trait === 'Tireur d\'élite') skills.combat += 3;
  if (trait === 'Pilleur' || trait === 'Éclaireur') skills.scavenging += 3;
  if (trait === 'Médecin' || trait === 'Chimiste') skills.medical += 3;
  if (trait === 'Ingénieur' || trait === 'Mécanicien') skills.engineering += 3;
  if (trait === 'Tacticien') { skills.combat += 1; skills.scavenging += 1; skills.medical += 1; skills.engineering += 1; }
  if (trait === 'Survivaliste') { skills.combat += 2; skills.scavenging += 2; }
  return {
    id: uuidv4(), name: `${firstName} ${lastName}`, gender, trait, skills,
    health: 100, maxHealth: 100,
    equipment: { weapon: null, armor: null, backpack: null },
    status: 'available',
  };
}

function generateExpeditionResults(expedition: Expedition, survivors: Survivor[], state: GameState, zone: ZoneDef): ExpeditionResult {
  const resources: Record<string, number> = {};
  const equipment: EquipmentDef[] = [];
  const events: string[] = [];
  const survivorDamage: Record<string, number> = {};

  // ── Stats des véhicules embarqués ──────────────────────────────────────────
  const embarkedVehicles = (expedition.vehicleIds ?? [])
    .map(id => state.garageVehicles.find(v => v.id === id))
    .filter(Boolean) as GarageVehicle[];
  const vehicleCombat   = embarkedVehicles.reduce((sum, v) => sum + (VEHICLE_DEFS.find(d => d.id === v.type)?.combat ?? 0), 0);
  const maxVehicleNoise = embarkedVehicles.reduce((max, v) => Math.max(max, VEHICLE_DEFS.find(d => d.id === v.type)?.noise ?? 0), 0);
  const noiseDangerBonus = maxVehicleNoise * 0.25;

  const teamScavenging = survivors.reduce((sum, s) => {
    let bonus = 0;
    if (s.equipment.backpack) bonus += s.equipment.backpack.stats.scavenging || 0;
    if (s.equipment.weapon) bonus += s.equipment.weapon.stats.scavenging || 0;
    return sum + s.skills.scavenging + bonus;
  }, 0);
  const teamCombat = survivors.reduce((sum, s) => {
    let bonus = 0;
    if (s.equipment.weapon) bonus += s.equipment.weapon.stats.combat || 0;
    if (s.equipment.armor) bonus += s.equipment.armor.stats.combat || 0;
    return sum + s.skills.combat + bonus;
  }, 0) + vehicleCombat;

  const watchtowerLevel = state.buildings['watchtower'] || 0;
  const dangerReduction = getDangerReduction(watchtowerLevel);

  // Faction reputation adjusts danger on faction tiles
  let factionDangerMod = 0;
  if (expedition.zoneId.startsWith('t_')) {
    const tileData = TILE_BY_ID.get(expedition.zoneId);
    if (tileData?.factionId) {
      const rep = (state.factionReputation ?? {})[tileData.factionId] ?? 0;
      if (rep > 0) factionDangerMod = -1;
      else if (rep < -3) factionDangerMod = 1;
    }
  }

  const effectiveDanger = Math.max(0, zone.dangerLevel * (1 - dangerReduction) + noiseDangerBonus + factionDangerMod);
  const scavBonus = 1 + teamScavenging * 0.05;
  for (const loot of zone.lootTable) {
    if (Math.random() < loot.chance * scavBonus) {
      if (loot.type === 'resource') {
        const qty = Math.floor(randomInt(loot.minQty, loot.maxQty) * scavBonus);
        resources[loot.id] = (resources[loot.id] || 0) + qty;
      } else if (loot.type === 'equipment') {
        const eq = ALL_EQUIPMENT.find(e => e.id === loot.id);
        if (eq) equipment.push({ ...eq });
      }
    }
  }

  // ── Butin de catégorie ────────────────────────────────────────────────────
  const categoryDef = getCategoryDef(zone.category);
  const vehiclesFound: string[] = [];
  if (categoryDef && zone.dangerLevel > 0) {
    const CATEGORY_CHANCE_SCALE = 0.6;
    for (const loot of categoryDef.categoryLootTable) {
      const adjustedChance = loot.chance * CATEGORY_CHANCE_SCALE * scavBonus;
      if (Math.random() < adjustedChance) {
        if (loot.type === 'resource') {
          const qty = Math.floor(randomInt(loot.minQty, loot.maxQty) * scavBonus);
          resources[loot.id] = (resources[loot.id] || 0) + qty;
        } else if (loot.type === 'equipment') {
          const eq = ALL_EQUIPMENT.find(e => e.id === loot.id);
          if (eq) equipment.push({ ...eq });
        } else if (loot.type === 'vehicle') {
          vehiclesFound.push(loot.id);
          if (loot.id === 'bike') {
            events.push(`L'équipe a trouvé un vélo et l'a ramené au camp !`);
          } else {
            events.push(`${loot.name} repéré sur place — marqueur posé pour une expédition de récupération.`);
          }
        }
      }
    }
  }

  const dangerRoll = Math.random() * 3.5;
  if (dangerRoll < effectiveDanger) {
    // Message de bruit si le convoi a attiré les ennemis
    if (maxVehicleNoise >= 2) {
      events.push('Le bruit du convoi a attiré des rôdeurs dans la zone.');
    }
    const combatCheck = teamCombat / 5;
    if (combatCheck < Math.random() * effectiveDanger) {
      events.push('L\'équipe a été attaquée par des pillards !');
      survivors.forEach(s => {
        const armorHP = s.equipment.armor?.stats.health || 0;
        const baseDmg = randomInt(20, 45) * (effectiveDanger / 2);
        survivorDamage[s.id] = Math.max(1, Math.floor(baseDmg - armorHP * 0.3));
      });
    } else {
      if (vehicleCombat > 0) {
        events.push('Le 4×4 blindé a repoussé l\'assaut ! Les pillards ont fui devant le blindage.');
      } else {
        events.push('L\'équipe a repoussé une attaque de pillards !');
      }
      for (const key of Object.keys(resources)) { resources[key] = Math.floor(resources[key] * 1.2); }
    }
  }
  if (Object.keys(resources).length === 0 && equipment.length === 0) {
    events.push('La zone était presque vide. Maigre récolte.');
    resources['scrap'] = randomInt(1, 3);
  }
  if (events.length === 0) {
    const useCategoryEvent =
      categoryDef && categoryDef.categoryEvents.length > 0 && Math.random() < 0.5;
    if (useCategoryEvent) {
      const pool = categoryDef!.categoryEvents;
      events.push(pool[Math.floor(Math.random() * pool.length)]);
    } else {
      events.push('Expédition sans incident. Bonne récolte !');
    }
  }
  return { resources, equipment, events, survivorDamage, vehiclesFound };
}

// ── Faction name lookup ─────────────────────────────────────────────────────
const FACTION_NAMES: Record<string, string> = {
  arvernes:      'les Arvernes',
  tribu_verte:   'la Tribu Verte',
  pirates_loire: 'les Pirates de la Loire',
  marshals:      'les Marshals',
};

// ── Expedition event definitions ────────────────────────────────────────────
type EventDef = {
  type: PendingExpeditionEvent['type'];
  title: string;
  description: string;
  options: [{ label: string; description: string }, { label: string; description: string }];
  condition?: (zone: ZoneDef) => boolean;
};

const EXPEDITION_EVENT_DEFS: EventDef[] = [
  {
    type: 'ambush',
    title: 'Embuscade !',
    description: 'Des pillards ont repéré votre équipe et se positionnent pour attaquer. Chaque seconde compte.',
    options: [
      { label: 'Fuir',     description: 'Battre en retraite — butin réduit de moitié, équipe indemne.' },
      { label: 'Combattre', description: 'Repousser l\'attaque — butin ×1,5 mais blessures probables.' },
    ],
    condition: (z) => z.dangerLevel >= 3,
  },
  {
    type: 'hidden_cache',
    title: 'Cache Secrète',
    description: 'L\'équipe découvre une cache dissimulée, visiblement non pillée. Fouiller prendra du temps.',
    options: [
      { label: 'Vider la cache', description: 'Fouiller méthodiquement — butin doublé.' },
      { label: 'Continuer',      description: 'Ignorer et rentrer rapidement.' },
    ],
  },
  {
    type: 'storm',
    title: 'Tempête Soudaine',
    description: 'Un orage violent éclate sans prévenir. L\'équipe doit décider rapidement comment réagir.',
    options: [
      { label: 'S\'abriter',  description: 'Attendre la fin — récolte légèrement réduite (-20%).' },
      { label: 'Continuer',   description: 'Braver les éléments — chaque survivant perd 10 PV.' },
    ],
  },
  {
    type: 'stranger',
    title: 'Étranger en Détresse',
    description: 'Un survivant isolé, blessé et épuisé, implore de l\'aide sur votre chemin de retour.',
    options: [
      { label: 'Aider',   description: 'Partager des vivres (-5 nourriture) — il pourrait rejoindre le camp.' },
      { label: 'Ignorer', description: 'Continuer sans détour.' },
    ],
  },
  {
    type: 'vehicle_wreck',
    title: 'Épave Découverte',
    description: 'Une épave de véhicule à moitié dissimulée par la végétation. Elle semble récupérable.',
    options: [
      { label: 'Inspecter', description: 'Examiner l\'épave — marqueur posé pour une expédition de récupération.' },
      { label: 'Ignorer',   description: 'Laisser l\'épave et continuer.' },
    ],
  },
];

function generateExpeditionEvent(exp: Expedition, zone: ZoneDef): PendingExpeditionEvent {
  const tile = exp.zoneId.startsWith('t_') ? TILE_BY_ID.get(exp.zoneId) : undefined;
  const factionId = tile?.factionId;

  // Build eligible event list
  const eligible = EXPEDITION_EVENT_DEFS.filter(def =>
    !def.condition || def.condition(zone)
  );
  if (factionId) {
    // Faction encounter possible on faction tiles
    const factionName = FACTION_NAMES[factionId] ?? factionId;
    const factionEvent: EventDef = {
      type: 'faction_encounter',
      title: 'Rencontre de Faction',
      description: `Une patrouille de ${factionName} barre le chemin. L'ambiance est tendue.`,
      options: [
        { label: 'Négocier',  description: 'Proposer un accord (-5 ressources, +2 réputation).' },
        { label: 'Intimider', description: 'Montrer de la force (+30% butin, -2 réputation).' },
      ],
    };
    eligible.push(factionEvent as EventDef);
  }

  const def = eligible[Math.floor(Math.random() * eligible.length)];
  return {
    id: uuidv4(),
    type: def.type,
    title: def.title,
    description: def.description,
    options: def.options,
    triggeredAt: Date.now(),
    factionId: def.type === 'faction_encounter' ? factionId : undefined,
  };
}

// Applies event choice effects on top of generated results.
// Returns modified results + optional faction rep change.
function applyEventEffects(
  event: PendingExpeditionEvent,
  choice: 0 | 1,
  results: ExpeditionResult,
  survivors: Survivor[],
): {
  results: ExpeditionResult;
  extraDamage: Record<string, number>;
  factionRepDelta?: { id: string; delta: number };
  extraLogs: string[];
  strangerHelped?: boolean;
  vehicleWreckInspected?: boolean;
  foodCost?: number;
} {
  const res = { ...results, resources: { ...results.resources } };
  const extraDamage: Record<string, number> = {};
  const extraLogs: string[] = [];
  let factionRepDelta: { id: string; delta: number } | undefined;
  let strangerHelped = false;
  let vehicleWreckInspected = false;
  let foodCost = 0;

  switch (event.type) {
    case 'ambush':
      if (choice === 0) {
        for (const k of Object.keys(res.resources)) res.resources[k] = Math.floor(res.resources[k] * 0.5);
        extraLogs.push('L\'équipe a fui l\'embuscade — butin réduit de moitié.');
      } else {
        for (const k of Object.keys(res.resources)) res.resources[k] = Math.floor(res.resources[k] * 1.5);
        survivors.forEach(s => { extraDamage[s.id] = (extraDamage[s.id] || 0) + randomInt(10, 25); });
        extraLogs.push('L\'équipe a combattu et repoussé l\'embuscade — butin augmenté mais blessures reçues.');
      }
      break;
    case 'hidden_cache':
      if (choice === 0) {
        for (const k of Object.keys(res.resources)) res.resources[k] = Math.floor(res.resources[k] * 2);
        if (Object.keys(res.resources).length === 0) res.resources['scrap'] = randomInt(5, 15);
        extraLogs.push('La cache secrète a été pillée — butin doublé !');
      } else {
        extraLogs.push('L\'équipe a ignoré la cache et est rentrée rapidement.');
      }
      break;
    case 'storm':
      if (choice === 0) {
        for (const k of Object.keys(res.resources)) res.resources[k] = Math.floor(res.resources[k] * 0.8);
        extraLogs.push('L\'équipe s\'est abritée — récolte légèrement réduite, survivants indemnes.');
      } else {
        survivors.forEach(s => { extraDamage[s.id] = (extraDamage[s.id] || 0) + 10; });
        extraLogs.push('L\'équipe a traversé la tempête — tous blessés mais récolte intacte.');
      }
      break;
    case 'stranger':
      if (choice === 0) {
        foodCost = 5;
        strangerHelped = true;
        extraLogs.push('L\'équipe a aidé l\'étranger — il pourrait rejoindre le camp !');
      } else {
        extraLogs.push('L\'équipe a continué son chemin.');
      }
      break;
    case 'vehicle_wreck':
      if (choice === 0) {
        vehicleWreckInspected = true;
        extraLogs.push('L\'épave a été inspectée — marqueur posé pour récupération.');
      } else {
        extraLogs.push('L\'épave a été ignorée.');
      }
      break;
    case 'faction_encounter':
      if (event.factionId) {
        if (choice === 0) {
          factionRepDelta = { id: event.factionId, delta: 2 };
          foodCost = 5;
          extraLogs.push(`Accord passé avec ${FACTION_NAMES[event.factionId] ?? event.factionId} — réputation +2.`);
        } else {
          factionRepDelta = { id: event.factionId, delta: -2 };
          for (const k of Object.keys(res.resources)) res.resources[k] = Math.floor(res.resources[k] * 1.3);
          extraLogs.push(`${FACTION_NAMES[event.factionId] ?? event.factionId} intimidés — butin amélioré mais réputation dégradée.`);
        }
      }
      break;
  }

  return { results: res, extraDamage, factionRepDelta, extraLogs, strangerHelped, vehicleWreckInspected, foodCost };
}

// Returns null if item is destroyed (durability reached 0)
function damageItem(item: EquipmentDef | null, wear: number): EquipmentDef | null {
  if (!item || wear === 0) return item;
  const newDur = (item.durability ?? item.maxDurability) - wear;
  if (newDur <= 0) return null;
  return { ...item, durability: newDur };
}

function clampResources(resources: Record<string, number>, storageLevel: number): Record<string, number> {
  const cap = getStorageCapacity(storageLevel);
  const clamped = { ...resources };
  for (const key of Object.keys(clamped)) { clamped[key] = Math.min(clamped[key], cap); }
  return clamped;
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT_GAME': {
      const s: GameState = {
        ...action.state, initialized: true,
        recyclingTasks:       action.state.recyclingTasks       || [],
        trainingTasks:        action.state.trainingTasks        || [],
        craftingTasks:        action.state.craftingTasks        || [],
        healingTasks:         action.state.healingTasks         ?? [],
        farmingTasks:         action.state.farmingTasks         ?? [],
        traderCampDiscovered: action.state.traderCampDiscovered ?? false,
        traderCamp:           action.state.traderCamp           ?? null,
        discoveredZones:      action.state.discoveredZones      ?? [],
        discoveredTiles:      action.state.discoveredTiles      ?? [],
        garageVehicles:       action.state.garageVehicles       ?? [],
        vehicleMarkers:       action.state.vehicleMarkers       ?? [],
        pendingRecruits:      action.state.pendingRecruits      ?? [],
        factionReputation:    action.state.factionReputation    ?? {},
        discoveredFactions:   action.state.discoveredFactions   ?? [],
        foodAccum:            action.state.foodAccum            ?? 0,
        // Migrer les expéditions sauvegardées sans vehicleIds/speedReduction/noise/combat
        expeditions: (action.state.expeditions || []).map(e => ({
          vehicleIds:     [],
          speedReduction: 0,
          vehicleNoise:   0,
          vehicleCombat:  0,
          ...e,
        })),
      };
      const busyIds = new Set([
        ...s.recyclingTasks.map(t => t.survivorId),
        ...s.trainingTasks.map(t => t.survivorId),
        ...s.craftingTasks.map(t => t.survivorId),
        ...s.healingTasks.map(t => t.healerId),
        ...s.farmingTasks.map(t => t.survivorId),
      ]);
      // Migrate durability on equipment if missing (saves from before this feature)
      const migrateDur = (eq: EquipmentDef | null): EquipmentDef | null => {
        if (!eq) return null;
        if (eq.durability !== undefined) return eq;
        const def = ALL_EQUIPMENT.find(e => e.id === eq.id);
        const max = def?.maxDurability ?? 100;
        return { ...eq, maxDurability: max, durability: max };
      };
      return {
        ...s,
        survivors: s.survivors.map(sv => {
          const sv2 = (sv.status === 'recycling' || sv.status === 'training' || sv.status === 'crafting' || sv.status === 'healing' || sv.status === 'farming') && !busyIds.has(sv.id)
            ? { ...sv, status: 'available' as const, recycleTaskId: undefined, trainingTaskId: undefined, craftTaskId: undefined, healingTaskId: undefined, farmingTaskId: undefined }
            : sv;
          return {
            ...sv2,
            equipment: {
              weapon:   migrateDur(sv2.equipment.weapon),
              armor:    migrateDur(sv2.equipment.armor),
              backpack: migrateDur(sv2.equipment.backpack),
            },
          };
        }),
        inventory: s.inventory.map(item => {
          if (item.durability !== undefined) return item;
          const def = ALL_EQUIPMENT.find(e => e.id === item.id);
          const max = def?.maxDurability ?? 100;
          return { ...item, maxDurability: max, durability: max };
        }),
      };
    }
    case 'UPGRADE_BUILDING': {
      const bDef = BUILDINGS.find(b => b.id === action.buildingId);
      if (!bDef) return state;
      const currentLevel = state.buildings[action.buildingId] || 0;
      if (currentLevel >= bDef.maxLevel) return state;
      const cost = getUpgradeCost(bDef, currentLevel);
      const newRes = { ...state.resources };
      for (const [res, amt] of Object.entries(cost)) { if ((newRes[res] || 0) < amt) return state; }
      for (const [res, amt] of Object.entries(cost)) { newRes[res] -= amt; }
      return { ...state, resources: newRes, buildings: { ...state.buildings, [action.buildingId]: currentLevel + 1 },
        gameLog: [{ id: uuidv4(), message: `${bDef.name} amélioré au niveau ${currentLevel + 1} !`, time: Date.now(), type: 'success' }, ...state.gameLog.slice(0, 49)] };
    }
    case 'LAUNCH_EXPEDITION': {
      const zone = ZONES.find(z => z.id === action.zoneId)
        ?? (TILE_BY_ID.has(action.zoneId) ? synthZoneDef(TILE_BY_ID.get(action.zoneId)!) : null);
      if (!zone) return state;

      // ── Calcul de la réduction de durée par les véhicules ──────────────────
      // Règle : si un survivant n'a pas de place dans un véhicule, tout le groupe
      // marche à la même vitesse → pas de bonus.
      // Sinon, c'est le véhicule le plus lent qui donne la vitesse du groupe.
      const embarkedVehicles = action.vehicleIds
        .map(id => state.garageVehicles.find(v => v.id === id))
        .filter(Boolean) as GarageVehicle[];
      const totalSeats = embarkedVehicles.reduce((sum, v) => sum + v.spaces, 0);
      const allSeated  = totalSeats >= action.survivorIds.length;
      let speedReduction = 0;
      if (allSeated && embarkedVehicles.length > 0) {
        const speeds = embarkedVehicles.map(v => {
          const def = VEHICLE_DEFS.find(d => d.id === v.type);
          return def?.speed ?? 0;
        });
        speedReduction = Math.min(...speeds);
      }

      const duration  = Math.floor(zone.baseDuration * (1 - speedReduction));
      const foodCost  = Math.max(1, Math.ceil((duration / 60) * action.survivorIds.length));
      const newRes = { ...state.resources, food: (state.resources['food'] || 0) - foodCost };
      if ((state.resources['food'] || 0) < foodCost) return state;

      // Si expédition de récupération : vérifier et déduire les coûts de réparation
      let retrievalVehicleName = '';
      if (action.retrievalMarkerId) {
        const marker = (state.vehicleMarkers ?? []).find(m => m.id === action.retrievalMarkerId);
        if (!marker) return state;
        const vDef = VEHICLE_DEFS.find(d => d.id === marker.vehicleTypeId);
        const rc = vDef?.repairCost;
        if (rc) {
          if ((state.resources['scrap']     || 0) < rc.scrap)     return state;
          if ((state.resources['materials'] || 0) < rc.materials) return state;
          if ((state.resources['fuel']      || 0) < rc.fuel)      return state;
          newRes['scrap']     = (newRes['scrap']     || 0) - rc.scrap;
          newRes['materials'] = (newRes['materials'] || 0) - rc.materials;
          newRes['fuel']      = (newRes['fuel']      || 0) - rc.fuel;
        }
        retrievalVehicleName = vDef?.name ?? marker.vehicleTypeId;
      }

      const expeditionId = uuidv4();
      const newSurvivors = state.survivors.map(s =>
        action.survivorIds.includes(s.id) ? { ...s, status: 'expedition' as const, expeditionId } : s
      );
      const expVehicleCombat = embarkedVehicles.reduce(
        (sum, v) => sum + (VEHICLE_DEFS.find(d => d.id === v.type)?.combat ?? 0), 0
      );
      const expMaxNoise = embarkedVehicles.reduce(
        (max, v) => Math.max(max, VEHICLE_DEFS.find(d => d.id === v.type)?.noise ?? 0), 0
      );
      const newExpedition: Expedition = {
        id: expeditionId, zoneId: action.zoneId,
        survivorIds: action.survivorIds, vehicleIds: action.vehicleIds,
        speedReduction, vehicleNoise: expMaxNoise, vehicleCombat: expVehicleCombat,
        startTime: Date.now(), duration, completed: false,
        retrievalMarkerId: action.retrievalMarkerId,
      };
      const speedMsg = speedReduction > 0 ? ` · -${Math.round(speedReduction * 100)}% durée` : '';
      const logMsg = action.retrievalMarkerId
        ? `Expédition de récupération : ${retrievalVehicleName} — ${foodCost} nourriture consommée${speedMsg}.`
        : `Expédition lancée vers ${zone.name} — ${foodCost} nourriture consommée${speedMsg}.`;
      return {
        ...state, resources: newRes, survivors: newSurvivors,
        expeditions: [...state.expeditions, newExpedition],
        gameLog: [{ id: uuidv4(), message: logMsg, time: Date.now(), type: 'info' }, ...state.gameLog.slice(0, 49)],
      };
    }
    case 'COMPLETE_EXPEDITION': {
      const exp = state.expeditions.find(e => e.id === action.expeditionId);
      if (!exp || exp.completed) return state;
      const expSurvivors = state.survivors.filter(s => exp.survivorIds.includes(s.id));

      const newDiscoveredZones = state.discoveredZones.includes(exp.zoneId)
        ? state.discoveredZones
        : [...state.discoveredZones, exp.zoneId];
      const newDiscoveredTiles =
        exp.zoneId.startsWith('t_') && !state.discoveredTiles.includes(exp.zoneId)
          ? [...state.discoveredTiles, exp.zoneId]
          : state.discoveredTiles;
      const restDuration = Math.ceil(exp.duration / 4);

      // Special case: contact mission — no loot, no damage
      if (exp.zoneId === 'signal_contact') {
        const alreadyKnown = state.traderCampDiscovered && state.traderCamp;
        const newCamp = alreadyKnown ? state.traderCamp! : generateTraderCamp();
        const contactResults: ExpeditionResult = {
          resources: {}, equipment: [],
          events: [alreadyKnown
            ? `Contact réaffirmé avec ${newCamp.name}. Le troc reste disponible.`
            : `Contact établi ! Un camp de survivants organisé a été localisé. Le troc est maintenant possible.`],
          survivorDamage: {},
        };
        const completedExp = { ...exp, completed: true, results: contactResults };
        return {
          ...state,
          expeditions: state.expeditions.map(e => e.id === action.expeditionId ? completedExp : e),
          survivors: state.survivors.map(s =>
            exp.survivorIds.includes(s.id)
              ? { ...s, status: 'resting' as const, restingUntil: Date.now() + restDuration * 1000, expeditionId: undefined }
              : s
          ),
          pendingResults: completedExp,
          traderCampDiscovered: true,
          traderCamp: newCamp,
          discoveredZones: newDiscoveredZones,
          discoveredTiles: newDiscoveredTiles,
          gameLog: [{
            id: uuidv4(),
            message: alreadyKnown ? `Contact réaffirmé avec ${newCamp.name}.` : `Contact établi avec ${newCamp.name} !`,
            time: Date.now(), type: 'success',
          }, ...state.gameLog.slice(0, 49)],
        };
      }

      const zone = ZONES.find(z => z.id === exp.zoneId)
        ?? (TILE_BY_ID.has(exp.zoneId) ? synthZoneDef(TILE_BY_ID.get(exp.zoneId)!) : null);
      if (!zone) return state;

      let results = generateExpeditionResults(exp, expSurvivors, state, zone);

      // ── Apply expedition event effects ─────────────────────────────────────
      let newFactionReputation = { ...(state.factionReputation ?? {}) };
      let newDiscoveredFactions = [...(state.discoveredFactions ?? [])];
      const eventExtraLogs: { id: string; message: string; time: number; type: 'info' | 'success' | 'danger' | 'warning' }[] = [];
      let eventFoodCost = 0;
      let wreckVehicleMarker: string | null = null;
      let strangerHelpedBoostRecruit = false;

      if (exp.pendingEvent && exp.resolvedEventChoice !== undefined) {
        const { results: modifiedResults, extraDamage, factionRepDelta, extraLogs, strangerHelped, vehicleWreckInspected, foodCost } =
          applyEventEffects(exp.pendingEvent, exp.resolvedEventChoice, results, expSurvivors);
        results = modifiedResults;
        for (const [sid, dmg] of Object.entries(extraDamage)) {
          results.survivorDamage[sid] = (results.survivorDamage[sid] || 0) + dmg;
        }
        if (factionRepDelta) {
          const fid = factionRepDelta.id;
          newFactionReputation[fid] = Math.max(-10, Math.min(10, (newFactionReputation[fid] ?? 0) + factionRepDelta.delta));
          if (!newDiscoveredFactions.includes(fid)) newDiscoveredFactions.push(fid);
        }
        eventExtraLogs.push(...extraLogs.map(m => ({ id: uuidv4(), message: m, time: Date.now(), type: 'info' as const })));
        eventFoodCost = foodCost ?? 0;
        strangerHelpedBoostRecruit = strangerHelped ?? false;
        if (vehicleWreckInspected) {
          // Ajouter un marqueur pour un véhicule aléatoire (excluant les vélos et blindés)
          const wreckTypes = ['moto', 'compact', 'sedan', 'suv'];
          wreckVehicleMarker = wreckTypes[Math.floor(Math.random() * wreckTypes.length)];
        }
      }

      const completedExp = { ...exp, completed: true, results };
      const dangerLevel = zone.dangerLevel;
      const weaponWear  = dangerLevel * 12;
      const armorWear   = dangerLevel * 15;
      const packWear    = dangerLevel * 6;

      // Process survivors: death, equipment wear, fatigue
      const deadNames: string[] = [];
      const brokenNames: string[] = [];
      const newSurvivors: Survivor[] = [];

      for (const s of state.survivors) {
        if (!exp.survivorIds.includes(s.id)) { newSurvivors.push(s); continue; }
        const dmg = results.survivorDamage[s.id] || 0;
        const newHP = s.health - dmg;
        if (newHP <= 0) {
          deadNames.push(s.name);
          continue; // Permanently removed
        }
        const updWeapon   = damageItem(s.equipment.weapon,   weaponWear);
        const updArmor    = damageItem(s.equipment.armor,    armorWear);
        const updBackpack = damageItem(s.equipment.backpack, packWear);
        if (s.equipment.weapon   && !updWeapon)   brokenNames.push(s.equipment.weapon.name);
        if (s.equipment.armor    && !updArmor)    brokenNames.push(s.equipment.armor.name);
        if (s.equipment.backpack && !updBackpack) brokenNames.push(s.equipment.backpack.name);
        const isInjured = newHP < 50;
        newSurvivors.push({
          ...s,
          health: Math.max(1, newHP),
          status: isInjured ? 'injured' : 'resting',
          restingUntil: isInjured ? undefined : Date.now() + restDuration * 1000,
          expeditionId: undefined,
          equipment: { weapon: updWeapon, armor: updArmor, backpack: updBackpack },
        });
      }

      const storageLevel = state.buildings['storage'] || 0;
      const newRes = { ...state.resources };
      for (const [res, amt] of Object.entries(results.resources)) { newRes[res] = (newRes[res] || 0) + amt; }
      // Appliquer le coût en nourriture lié aux événements (stranger / faction_encounter)
      if (eventFoodCost > 0) {
        newRes['food'] = Math.max(0, (newRes['food'] || 0) - eventFoodCost);
      }

      const newLogs = [
        { id: uuidv4(), message: `Expédition vers ${zone.name} terminée !`, time: Date.now(), type: 'success' as const },
        ...deadNames.map(n => ({ id: uuidv4(), message: `${n} a été tué(e) lors de l'expédition.`, time: Date.now(), type: 'danger' as const })),
        ...brokenNames.map(n => ({ id: uuidv4(), message: `${n} a été détruit(e) lors de l'expédition.`, time: Date.now(), type: 'warning' as const })),
        ...eventExtraLogs,
        ...state.gameLog.slice(0, 49),
      ];

      // Recrutement — 1 chance sur 10 (ou 25% si étranger aidé) si de la place est disponible
      const barracksLevel2 = state.buildings['barracks'] || 0;
      const newPendingRecruits = [...(state.pendingRecruits || [])];
      let finalCompletedExp = completedExp;
      const recruitChance = strangerHelpedBoostRecruit ? 0.25 : 0.1;
      if (newSurvivors.length < getMaxSurvivors(barracksLevel2) && Math.random() < recruitChance) {
        const candidate = generateSurvivor();
        const recruitEntry = { id: uuidv4(), survivor: candidate, expiresAt: Date.now() + 3_600_000 };
        newPendingRecruits.push(recruitEntry);
        // Stocker l'ID dans le résultat pour l'afficher dans le rapport
        finalCompletedExp = {
          ...completedExp,
          results: completedExp.results ? { ...completedExp.results, recruitId: recruitEntry.id } : completedExp.results,
        };
        newLogs.splice(1, 0, {
          id: uuidv4(),
          message: `${candidate.name} souhaite rejoindre votre camp — décidez dans l'heure !`,
          time: Date.now(),
          type: 'info' as const,
        });
      }

      const garageCapacity = getGarageCapacity(state.buildings['garage'] || 0);
      const newGarageVehicles = [...state.garageVehicles];
      const newVehicleMarkers = [...(state.vehicleMarkers ?? [])];

      // Expédition de récupération : ajouter le véhicule récupéré au garage
      if (completedExp.retrievalMarkerId) {
        const markerIdx = newVehicleMarkers.findIndex(m => m.id === completedExp.retrievalMarkerId);
        if (markerIdx >= 0) {
          const marker = newVehicleMarkers[markerIdx];
          const vDef = VEHICLE_DEFS.find(d => d.id === marker.vehicleTypeId);
          const usedSpaces = newGarageVehicles.reduce((sum, v) => sum + v.spaces, 0);
          if (vDef && usedSpaces + vDef.spaces <= garageCapacity) {
            newGarageVehicles.push({ id: uuidv4(), type: vDef.id, name: vDef.name, spaces: vDef.spaces });
          }
          newVehicleMarkers.splice(markerIdx, 1);
          finalCompletedExp = {
            ...finalCompletedExp,
            results: finalCompletedExp.results
              ? { ...finalCompletedExp.results, retrievedVehicleTypeId: marker.vehicleTypeId }
              : finalCompletedExp.results,
          };
        }
      }

      // Marqueur véhicule issu de l'événement vehicle_wreck (choix "Inspecter")
      if (wreckVehicleMarker) {
        newVehicleMarkers.push({ id: uuidv4(), tileId: exp.zoneId, vehicleTypeId: wreckVehicleMarker, discoveredAt: Date.now() });
      }

      // Véhicules trouvés en exploration normale :
      // - vélo → ajouté directement au garage
      // - autres → marqueur posé sur la tuile
      const foundVehicleTypeIds = finalCompletedExp.results?.vehiclesFound ?? [];
      const vehicleMarkersCreated: string[] = [];
      for (const vehicleTypeId of foundVehicleTypeIds) {
        if (vehicleTypeId === 'bike') {
          const usedSpaces = newGarageVehicles.reduce((sum, v) => sum + v.spaces, 0);
          if (usedSpaces + 1 <= garageCapacity) {
            const vDef = VEHICLE_DEFS.find(d => d.id === 'bike')!;
            newGarageVehicles.push({ id: uuidv4(), type: 'bike', name: vDef.name, spaces: 1 });
          }
        } else {
          newVehicleMarkers.push({ id: uuidv4(), tileId: exp.zoneId, vehicleTypeId, discoveredAt: Date.now() });
          vehicleMarkersCreated.push(vehicleTypeId);
        }
      }

      // Mettre à jour les résultats pour refléter la séparation vélos / marqueurs
      if (vehicleMarkersCreated.length > 0 || foundVehicleTypeIds.some(id => id === 'bike')) {
        finalCompletedExp = {
          ...finalCompletedExp,
          results: finalCompletedExp.results ? {
            ...finalCompletedExp.results,
            vehiclesFound: foundVehicleTypeIds.filter(id => id === 'bike'),
            vehicleMarkersCreated,
          } : finalCompletedExp.results,
        };
      }

      return {
        ...state,
        expeditions: state.expeditions.map(e => e.id === action.expeditionId ? finalCompletedExp : e),
        survivors: newSurvivors,
        resources: clampResources(newRes, storageLevel),
        inventory: [...state.inventory, ...results.equipment],
        pendingResults: finalCompletedExp,
        pendingRecruits: newPendingRecruits,
        discoveredZones: newDiscoveredZones,
        discoveredTiles: newDiscoveredTiles,
        garageVehicles: newGarageVehicles,
        vehicleMarkers: newVehicleMarkers,
        factionReputation: newFactionReputation,
        discoveredFactions: newDiscoveredFactions,
        gameLog: newLogs,
      };
    }
    case 'VIEW_RESULTS': return { ...state, pendingResults: action.expedition };
    case 'COLLECT_RESULTS': return { ...state, pendingResults: null, expeditions: state.expeditions.filter(e => !e.completed) };
    case 'EQUIP_ITEM': {
      const item = action.item;
      const survivor = state.survivors.find(s => s.id === action.survivorId);
      if (!survivor) return state;
      const currentEquipped = survivor.equipment[item.slot];
      const newInventory = state.inventory.filter((eq, idx) => idx !== state.inventory.findIndex(e => e.id === item.id));
      if (currentEquipped) newInventory.push(currentEquipped);
      const newSurvivors = state.survivors.map(s => s.id === action.survivorId ? { ...s, equipment: { ...s.equipment, [item.slot]: item } } : s);
      return { ...state, survivors: newSurvivors, inventory: newInventory };
    }
    case 'UNEQUIP_ITEM': {
      const survivor = state.survivors.find(s => s.id === action.survivorId);
      if (!survivor) return state;
      const item = survivor.equipment[action.slot];
      if (!item) return state;
      const newSurvivors = state.survivors.map(s => s.id === action.survivorId ? { ...s, equipment: { ...s.equipment, [action.slot]: null } } : s);
      return { ...state, survivors: newSurvivors, inventory: [...state.inventory, item] };
    }
    case 'CRAFT_ITEM': {
      const eqDef = ALL_EQUIPMENT.find(e => e.id === action.itemId);
      if (!eqDef) return state;
      const recipe = CRAFT_RECIPES[action.itemId];
      if (!recipe) return state;
      if ((state.buildings['workshop'] || 0) < eqDef.tier) return state;
      const newRes = { ...state.resources };
      for (const [res, amt] of Object.entries(recipe)) { if ((newRes[res] || 0) < amt) return state; }
      for (const [res, amt] of Object.entries(recipe)) { newRes[res] -= amt; }
      return { ...state, resources: newRes, inventory: [...state.inventory, { ...eqDef }],
        gameLog: [{ id: uuidv4(), message: `${eqDef.name} fabriqué !`, time: Date.now(), type: 'success' }, ...state.gameLog.slice(0, 49)] };
    }
    case 'HEAL_SURVIVOR': {
      const survivor = state.survivors.find(s => s.id === action.survivorId);
      if (!survivor || survivor.health >= survivor.maxHealth) return state;
      const healCost = Math.ceil((survivor.maxHealth - survivor.health) * 0.2);
      if ((state.resources['medicine'] || 0) < healCost) return state;
      const newRes = { ...state.resources, medicine: state.resources['medicine'] - healCost };
      const newSurvivors = state.survivors.map(s => s.id === action.survivorId ? { ...s, health: s.maxHealth, status: 'available' as const } : s);
      return { ...state, resources: newRes, survivors: newSurvivors,
        gameLog: [{ id: uuidv4(), message: `${survivor.name} soigné(e) complètement !`, time: Date.now(), type: 'success' }, ...state.gameLog.slice(0, 49)] };
    }
    case 'REPAIR_ITEM': {
      const survivor = state.survivors.find(s => s.id === action.survivorId);
      if (!survivor) return state;
      const item = survivor.equipment[action.slot];
      if (!item) return state;
      const repairCost = item.tier * 5;
      if ((state.resources['scrap'] || 0) < repairCost) return state;
      const repaired = Math.min(item.maxDurability, item.durability + 50);
      const newSurvivors = state.survivors.map(s =>
        s.id === action.survivorId
          ? { ...s, equipment: { ...s.equipment, [action.slot]: { ...item, durability: repaired } } }
          : s
      );
      return {
        ...state,
        resources: { ...state.resources, scrap: (state.resources['scrap'] || 0) - repairCost },
        survivors: newSurvivors,
        gameLog: [{ id: uuidv4(), message: `${item.name} réparé (+50 durabilité, coût : ${repairCost} ferraille).`, time: Date.now(), type: 'success' }, ...state.gameLog.slice(0, 49)],
      };
    }
    case 'ADD_LOG':
      return { ...state, gameLog: [{ id: uuidv4(), message: action.message, time: Date.now(), type: action.logType }, ...state.gameLog.slice(0, 49)] };
    case 'START_RECYCLE': {
      const survivor = state.survivors.find(s => s.id === action.survivorId);
      if (!survivor || survivor.status !== 'available') return state;
      const item = state.inventory[action.inventoryIndex];
      if (!item) return state;
      const engLevel = getEffectiveEngineering(survivor);
      const taskId = uuidv4();
      const task: RecycleTask = {
        id: taskId, survivorId: survivor.id, item,
        startTime: Date.now(), duration: getRecycleDuration(item.tier), engineeringLevel: engLevel,
      };
      const newInventory = [...state.inventory];
      newInventory.splice(action.inventoryIndex, 1);
      const newSurvivors = state.survivors.map(s =>
        s.id === survivor.id ? { ...s, status: 'recycling' as const, recycleTaskId: taskId } : s
      );
      return {
        ...state, inventory: newInventory, survivors: newSurvivors,
        recyclingTasks: [...state.recyclingTasks, task],
        gameLog: [{ id: uuidv4(), message: `${survivor.name} commence à recycler ${item.name}.`, time: Date.now(), type: 'info' }, ...state.gameLog.slice(0, 49)],
      };
    }
    case 'CANCEL_RECYCLE': {
      const task = state.recyclingTasks.find(t => t.id === action.taskId);
      if (!task) return state;
      const newSurvivors = state.survivors.map(s =>
        s.id === task.survivorId ? { ...s, status: 'available' as const, recycleTaskId: undefined } : s
      );
      return {
        ...state,
        recyclingTasks: state.recyclingTasks.filter(t => t.id !== action.taskId),
        survivors: newSurvivors,
        inventory: [...state.inventory, task.item],
        gameLog: [{ id: uuidv4(), message: `Recyclage de ${task.item.name} annulé. Objet rendu à l'inventaire.`, time: Date.now(), type: 'warning' }, ...state.gameLog.slice(0, 49)],
      };
    }
    case 'START_TRAINING': {
      const survivor = state.survivors.find(s => s.id === action.survivorId);
      if (!survivor || survivor.status !== 'available') return state;
      const currentCount = survivor.trainingCounts?.[action.stat] ?? 0;
      if (currentCount >= 3) return state;
      const requiredBldLevel = getTrainingBuildingLevel(currentCount + 1);
      const buildingId = TRAINING_BUILDING_REQ[action.stat];
      if ((state.buildings[buildingId] || 0) < requiredBldLevel) return state;
      const taskId = uuidv4();
      const task: TrainingTask = {
        id: taskId, survivorId: survivor.id, stat: action.stat,
        level: currentCount + 1, startTime: Date.now(), duration: TRAINING_DURATIONS[currentCount],
      };
      const newSurvivors = state.survivors.map(s =>
        s.id === survivor.id ? { ...s, status: 'training' as const, trainingTaskId: taskId } : s
      );
      return {
        ...state, survivors: newSurvivors, trainingTasks: [...state.trainingTasks, task],
        gameLog: [{ id: uuidv4(), message: `${survivor.name} commence l'entraînement ${TRAINING_STAT_LABELS[action.stat]} nv.${currentCount + 1}.`, time: Date.now(), type: 'info' }, ...state.gameLog.slice(0, 49)],
      };
    }
    case 'CANCEL_TRAINING': {
      const task = state.trainingTasks.find(t => t.id === action.taskId);
      if (!task) return state;
      const survivor = state.survivors.find(s => s.id === task.survivorId);
      const newSurvivors = state.survivors.map(s =>
        s.id === task.survivorId ? { ...s, status: 'available' as const, trainingTaskId: undefined } : s
      );
      return {
        ...state, trainingTasks: state.trainingTasks.filter(t => t.id !== action.taskId), survivors: newSurvivors,
        gameLog: [{ id: uuidv4(), message: `Entraînement de ${survivor?.name ?? 'survivant'} annulé.`, time: Date.now(), type: 'warning' }, ...state.gameLog.slice(0, 49)],
      };
    }
    case 'COMPLETE_TRAINING': {
      const task = state.trainingTasks.find(t => t.id === action.taskId);
      if (!task) return state;
      const survivor = state.survivors.find(s => s.id === task.survivorId);
      const newSurvivors = state.survivors.map(s => {
        if (s.id !== task.survivorId) return s;
        return {
          ...s, status: 'available' as const, trainingTaskId: undefined,
          skills: { ...s.skills, [task.stat]: s.skills[task.stat] + 1 },
          trainingCounts: { ...s.trainingCounts, [task.stat]: (s.trainingCounts?.[task.stat] ?? 0) + 1 },
        };
      });
      return {
        ...state, trainingTasks: state.trainingTasks.filter(t => t.id !== action.taskId), survivors: newSurvivors,
        gameLog: [{ id: uuidv4(), message: `${survivor?.name ?? 'Survivant'} a terminé son entraînement +1 ${TRAINING_STAT_LABELS[task.stat]} !`, time: Date.now(), type: 'success' }, ...state.gameLog.slice(0, 49)],
      };
    }
    case 'COMPLETE_RECYCLE': {
      const task = state.recyclingTasks.find(t => t.id === action.taskId);
      if (!task) return state;
      const yields = getRecycleYield(task.item, task.engineeringLevel);
      const storageLevel = state.buildings['storage'] || 0;
      const newRes = { ...state.resources };
      for (const [res, qty] of Object.entries(yields)) { newRes[res] = (newRes[res] || 0) + qty; }
      const survivor = state.survivors.find(s => s.id === task.survivorId);
      const newSurvivors = state.survivors.map(s =>
        s.id === task.survivorId ? { ...s, status: 'available' as const, recycleTaskId: undefined } : s
      );
      const yieldStr = Object.entries(yields).map(([, q]) => q).reduce((a, b) => a + b, 0);
      return {
        ...state,
        resources: clampResources(newRes, storageLevel),
        recyclingTasks: state.recyclingTasks.filter(t => t.id !== action.taskId),
        survivors: newSurvivors,
        gameLog: [{ id: uuidv4(), message: `${survivor?.name || 'Survivant'} a recyclé ${task.item.name} (+${yieldStr} ressources).`, time: Date.now(), type: 'success' }, ...state.gameLog.slice(0, 49)],
      };
    }
    case 'START_CRAFT': {
      const survivor = state.survivors.find(s => s.id === action.survivorId);
      if (!survivor || survivor.status !== 'available') return state;
      const eqDef = ALL_EQUIPMENT.find(e => e.id === action.itemId);
      if (!eqDef) return state;
      const recipe = CRAFT_RECIPES[action.itemId];
      if (!recipe) return state;
      if ((state.buildings['workshop'] || 0) < eqDef.tier) return state;
      const newRes = { ...state.resources };
      for (const [res, amt] of Object.entries(recipe)) { if ((newRes[res] || 0) < amt) return state; }
      for (const [res, amt] of Object.entries(recipe)) { newRes[res] -= amt; }
      const engLevel = getEffectiveEngineering(survivor);
      const taskId = uuidv4();
      const task: CraftingTask = {
        id: taskId, survivorId: survivor.id, itemId: eqDef.id, item: { ...eqDef },
        startTime: Date.now(), duration: getCraftDuration(eqDef.tier, engLevel), engineeringLevel: engLevel,
      };
      const newSurvivors = state.survivors.map(s =>
        s.id === survivor.id ? { ...s, status: 'crafting' as const, craftTaskId: taskId } : s
      );
      return {
        ...state, resources: newRes, survivors: newSurvivors,
        craftingTasks: [...state.craftingTasks, task],
        gameLog: [{ id: uuidv4(), message: `${survivor.name} commence à fabriquer ${eqDef.name}.`, time: Date.now(), type: 'info' }, ...state.gameLog.slice(0, 49)],
      };
    }
    case 'CANCEL_CRAFT': {
      const task = state.craftingTasks.find(t => t.id === action.taskId);
      if (!task) return state;
      const recipe = CRAFT_RECIPES[task.itemId];
      const newRes = { ...state.resources };
      if (recipe) { for (const [res, amt] of Object.entries(recipe)) { newRes[res] = (newRes[res] || 0) + amt; } }
      const newSurvivors = state.survivors.map(s =>
        s.id === task.survivorId ? { ...s, status: 'available' as const, craftTaskId: undefined } : s
      );
      return {
        ...state, resources: newRes, survivors: newSurvivors,
        craftingTasks: state.craftingTasks.filter(t => t.id !== action.taskId),
        gameLog: [{ id: uuidv4(), message: `Fabrication de ${task.item.name} annulée. Ressources remboursées.`, time: Date.now(), type: 'warning' }, ...state.gameLog.slice(0, 49)],
      };
    }
    case 'COMPLETE_CRAFT': {
      const task = state.craftingTasks.find(t => t.id === action.taskId);
      if (!task) return state;
      const survivor = state.survivors.find(s => s.id === task.survivorId);
      const newSurvivors = state.survivors.map(s =>
        s.id === task.survivorId ? { ...s, status: 'available' as const, craftTaskId: undefined } : s
      );
      return {
        ...state,
        craftingTasks: state.craftingTasks.filter(t => t.id !== action.taskId),
        survivors: newSurvivors,
        inventory: [...state.inventory, { ...task.item }],
        gameLog: [{ id: uuidv4(), message: `${survivor?.name || 'Survivant'} a fabriqué ${task.item.name} !`, time: Date.now(), type: 'success' }, ...state.gameLog.slice(0, 49)],
      };
    }
    case 'EXECUTE_TRADE': {
      if (!state.traderCamp) return state;
      const { give, receive } = action;

      // Resolve actual items
      const giveItem  = give.kind    === 'equipment' ? (state.inventory[give.inventoryIndex] ?? null)          : null;
      const recvItem  = receive.kind === 'equipment' ? (state.traderCamp.equipment[receive.campEquipIndex] ?? null) : null;
      if (give.kind    === 'equipment' && !giveItem)  return state;
      if (receive.kind === 'equipment' && !recvItem)  return state;

      // Equipment tier constraint (max 1 tier difference)
      if (giveItem && recvItem && Math.abs(giveItem.tier - recvItem.tier) > 1) return state;

      // Value check
      const giveVal = give.kind === 'resource'
        ? give.quantity * (RESOURCE_RARITY[give.resourceId] ?? 1)
        : getEquipmentTradeValue(giveItem!.tier);
      const recvVal = receive.kind === 'resource'
        ? receive.quantity * (RESOURCE_RARITY[receive.resourceId] ?? 1)
        : getEquipmentTradeValue(recvItem!.tier);
      if (giveVal < recvVal) return state;

      // Availability checks
      if (give.kind    === 'resource' && (state.resources[give.resourceId] || 0) < give.quantity)              return state;
      if (receive.kind === 'resource' && (state.traderCamp.resources[receive.resourceId] || 0) < receive.quantity) return state;

      // Apply trade
      const newResources   = { ...state.resources };
      const newInventory   = [...state.inventory];
      const campResources  = { ...state.traderCamp.resources };
      const campEquipment  = [...state.traderCamp.equipment];

      if (give.kind === 'resource') {
        newResources[give.resourceId] -= give.quantity;
        campResources[give.resourceId] = (campResources[give.resourceId] || 0) + give.quantity;
      } else {
        campEquipment.push(newInventory.splice(give.inventoryIndex, 1)[0]);
      }
      if (receive.kind === 'resource') {
        campResources[receive.resourceId] -= receive.quantity;
        newResources[receive.resourceId] = (newResources[receive.resourceId] || 0) + receive.quantity;
      } else {
        newInventory.push(campEquipment.splice(receive.campEquipIndex, 1)[0]);
      }

      const giveDesc    = giveItem  ? giveItem.name  : `${give.kind    === 'resource' ? give.quantity    : ''} ${give.kind    === 'resource' ? give.resourceId    : ''}`.trim();
      const receiveDesc = recvItem  ? recvItem.name  : `${receive.kind === 'resource' ? receive.quantity : ''} ${receive.kind === 'resource' ? receive.resourceId : ''}`.trim();

      return {
        ...state,
        resources: newResources,
        inventory: newInventory,
        traderCamp: { ...state.traderCamp, resources: campResources, equipment: campEquipment },
        gameLog: [{
          id: uuidv4(),
          message: `Troc conclu avec ${state.traderCamp.name} : ${giveDesc} contre ${receiveDesc}.`,
          time: Date.now(), type: 'success',
        }, ...state.gameLog.slice(0, 49)],
      };
    }
    case 'ADD_VEHICLE': {
      const vDef = VEHICLE_DEFS.find(v => v.id === action.vehicleTypeId);
      if (!vDef) return state;
      const garageLevel = state.buildings['garage'] || 0;
      const capacity = getGarageCapacity(garageLevel);
      const usedSpaces = state.garageVehicles.reduce((sum, v) => sum + v.spaces, 0);
      if (usedSpaces + vDef.spaces > capacity) return state;
      const newVehicle: GarageVehicle = { id: uuidv4(), type: vDef.id, name: vDef.name, spaces: vDef.spaces };
      return {
        ...state,
        garageVehicles: [...state.garageVehicles, newVehicle],
        gameLog: [{ id: uuidv4(), message: `${vDef.name} ajouté au garage.`, time: Date.now(), type: 'success' }, ...state.gameLog.slice(0, 49)],
      };
    }
    case 'DEV_SET_RESOURCE': {
      const val = Math.max(0, Math.floor(action.value));
      return { ...state, resources: { ...state.resources, [action.resourceId]: val } };
    }
    case 'REMOVE_VEHICLE': {
      const vehicle = state.garageVehicles.find(v => v.id === action.vehicleId);
      if (!vehicle) return state;
      return {
        ...state,
        garageVehicles: state.garageVehicles.filter(v => v.id !== action.vehicleId),
        gameLog: [{ id: uuidv4(), message: `${vehicle.name} retiré du garage.`, time: Date.now(), type: 'info' }, ...state.gameLog.slice(0, 49)],
      };
    }
    case 'ACCEPT_RECRUIT': {
      const recruit = (state.pendingRecruits || []).find(r => r.id === action.recruitId);
      if (!recruit) return state;
      const barracksLvl = state.buildings['barracks'] || 0;
      if (state.survivors.length >= getMaxSurvivors(barracksLvl)) return state;
      return {
        ...state,
        survivors: [...state.survivors, { ...recruit.survivor, status: 'available' as const }],
        pendingRecruits: (state.pendingRecruits || []).filter(r => r.id !== action.recruitId),
        gameLog: [{ id: uuidv4(), message: `${recruit.survivor.name} a rejoint votre camp !`, time: Date.now(), type: 'success' }, ...state.gameLog.slice(0, 49)],
      };
    }
    case 'DECLINE_RECRUIT': {
      const recruit = (state.pendingRecruits || []).find(r => r.id === action.recruitId);
      if (!recruit) return state;
      return {
        ...state,
        pendingRecruits: (state.pendingRecruits || []).filter(r => r.id !== action.recruitId),
        gameLog: [{ id: uuidv4(), message: `${recruit.survivor.name} a été refusé et a quitté les environs.`, time: Date.now(), type: 'warning' }, ...state.gameLog.slice(0, 49)],
      };
    }
    case 'RESOLVE_EXPEDITION_EVENT': {
      const exp = state.expeditions.find(e => e.id === action.expeditionId);
      if (!exp || !exp.pendingEvent || exp.resolvedEventChoice !== undefined) return state;
      const choiceLabel = exp.pendingEvent.options[action.choiceIndex].label;
      return {
        ...state,
        expeditions: state.expeditions.map(e =>
          e.id === action.expeditionId
            ? { ...e, resolvedEventChoice: action.choiceIndex }
            : e
        ),
        gameLog: [{
          id: uuidv4(),
          message: `Décision prise : "${choiceLabel}" — l'équipe continue sa mission.`,
          time: Date.now(),
          type: 'info',
        }, ...state.gameLog.slice(0, 49)],
      };
    }
    case 'BAN_SURVIVOR': {
      const survivor = state.survivors.find(s => s.id === action.survivorId);
      if (!survivor) return state;
      const returnedItems = Object.values(survivor.equipment).filter(Boolean) as import('@/data/gameData').EquipmentDef[];
      return {
        ...state,
        survivors: state.survivors.filter(s => s.id !== action.survivorId),
        inventory: [...state.inventory, ...returnedItems],
        gameLog: [{ id: uuidv4(), message: `${survivor.name} a été banni(e) du camp.`, time: Date.now(), type: 'warning' as const }, ...state.gameLog.slice(0, 49)],
      };
    }
    case 'START_HEALING': {
      const healer = state.survivors.find(s => s.id === action.healerId);
      const target = state.survivors.find(s => s.id === action.targetId);
      if (!healer || healer.status !== 'available') return state;
      if (!target || target.status !== 'injured') return state;
      if ((state.buildings['infirmary'] || 0) < 1) return state;
      const hpMissing = target.maxHealth - target.health;
      if (hpMissing <= 0) return state;
      const medicineCost = Math.ceil(hpMissing * HEALING_MEDICINE_FACTOR);
      if ((state.resources['medicine'] || 0) < medicineCost) return state;
      const healerMedical = Math.max(1, healer.skills.medical);
      const duration = Math.ceil(hpMissing / (healerMedical * 3)) * 60;
      const taskId = uuidv4();
      const task: HealingTask = { id: taskId, healerId: healer.id, targetId: target.id, startTime: Date.now(), duration, hpToRestore: hpMissing, medicineCost };
      return {
        ...state,
        resources: { ...state.resources, medicine: state.resources['medicine'] - medicineCost },
        healingTasks: [...state.healingTasks, task],
        survivors: state.survivors.map(s => {
          if (s.id === healer.id) return { ...s, status: 'healing' as const, healingTaskId: taskId };
          return s;
        }),
        gameLog: [{ id: uuidv4(), message: `${healer.name} soigne activement ${target.name} (${hpMissing} PV, ${duration / 60} min).`, time: Date.now(), type: 'info' }, ...state.gameLog.slice(0, 49)],
      };
    }
    case 'CANCEL_HEALING': {
      const task = state.healingTasks.find(t => t.id === action.taskId);
      if (!task) return state;
      return {
        ...state,
        resources: { ...state.resources, medicine: (state.resources['medicine'] || 0) + task.medicineCost },
        healingTasks: state.healingTasks.filter(t => t.id !== action.taskId),
        survivors: state.survivors.map(s => {
          if (s.id === task.healerId) return { ...s, status: 'available' as const, healingTaskId: undefined };
          return s;
        }),
        gameLog: [{ id: uuidv4(), message: `Soin actif annulé — ${task.medicineCost} médicament(s) remboursé(s).`, time: Date.now(), type: 'warning' }, ...state.gameLog.slice(0, 49)],
      };
    }
    case 'COMPLETE_HEALING': {
      const task = state.healingTasks.find(t => t.id === action.taskId);
      if (!task) return state;
      const healer = state.survivors.find(s => s.id === task.healerId);
      const target = state.survivors.find(s => s.id === task.targetId);
      return {
        ...state,
        healingTasks: state.healingTasks.filter(t => t.id !== action.taskId),
        survivors: state.survivors.map(s => {
          if (s.id === task.healerId) return { ...s, status: 'available' as const, healingTaskId: undefined };
          if (s.id === task.targetId) return { ...s, health: s.maxHealth, status: 'available' as const };
          return s;
        }),
        gameLog: [{ id: uuidv4(), message: `${healer?.name ?? 'Soignant'} a guéri ${target?.name ?? 'la cible'} complètement !`, time: Date.now(), type: 'success' }, ...state.gameLog.slice(0, 49)],
      };
    }
    case 'START_FARMING': {
      const survivor = state.survivors.find(s => s.id === action.survivorId);
      if (!survivor || survivor.status !== 'available') return state;
      if ((state.buildings['farm'] || 0) < 1) return state;
      if (state.farmingTasks.length >= 1) return state;
      const taskId = uuidv4();
      const task: FarmingTask = { id: taskId, survivorId: survivor.id, startTime: Date.now() };
      return {
        ...state,
        farmingTasks: [...state.farmingTasks, task],
        survivors: state.survivors.map(s => s.id === survivor.id ? { ...s, status: 'farming' as const, farmingTaskId: taskId } : s),
        gameLog: [{ id: uuidv4(), message: `${survivor.name} affecté(e) à la culture manuelle (+${FARM_BONUS_PER_FARMER} nourrit./min).`, time: Date.now(), type: 'info' }, ...state.gameLog.slice(0, 49)],
      };
    }
    case 'CANCEL_FARMING': {
      const task = state.farmingTasks.find(t => t.id === action.taskId);
      if (!task) return state;
      const survivor = state.survivors.find(s => s.id === task.survivorId);
      return {
        ...state,
        farmingTasks: state.farmingTasks.filter(t => t.id !== action.taskId),
        survivors: state.survivors.map(s => s.id === task.survivorId ? { ...s, status: 'available' as const, farmingTaskId: undefined } : s),
        gameLog: [{ id: uuidv4(), message: `${survivor?.name ?? 'Survivant'} a arrêté la culture manuelle.`, time: Date.now(), type: 'info' }, ...state.gameLog.slice(0, 49)],
      };
    }

    case 'TICK': {
      const now = Date.now();
      const tickLogs: { id: string; message: string; time: number; type: 'info' | 'success' | 'danger' | 'warning' }[] = [];

      // ── Infirmerie : soins passifs ─────────────────────────────────────────
      const infirmaryLevel = state.buildings['infirmary'] || 0;
      const healRates = [0, 0.1, 0.25, 0.4, 0.6, 0.8];
      const healRate = healRates[infirmaryLevel] || 0;
      let newSurvivors = state.survivors.map(s => {
        let sv = s;
        if (sv.status === 'resting' && sv.restingUntil && now >= sv.restingUntil) {
          sv = { ...sv, status: 'available' as const, restingUntil: undefined };
        }
        if (healRate > 0 && sv.status !== 'expedition' && sv.health < sv.maxHealth) {
          const healed = Math.min(sv.maxHealth, sv.health + healRate);
          sv = { ...sv, health: healed, status: (healed >= 50 && sv.status === 'injured' ? 'available' : sv.status) as Survivor['status'] };
        }
        return sv;
      });

      // ── Potager : production de nourriture + consommation passive ──────────
      const farmLevel = state.buildings['farm'] || 0;
      const farmFoodPerTick = FARM_FOOD_PER_MINUTE[farmLevel] / 60; // /sec
      const farmerBonus = state.farmingTasks.length * (FARM_BONUS_PER_FARMER / 60);
      const nonExpeditionCount = state.survivors.filter(s => s.status !== 'expedition').length;
      const foodConsumedPerTick = nonExpeditionCount * (FOOD_PER_SURVIVOR_PER_HOUR / 3600);
      const netFoodPerTick = farmFoodPerTick + farmerBonus - foodConsumedPerTick;
      let newFoodAccum = (state.foodAccum ?? 0) + netFoodPerTick;
      let newResources = { ...state.resources };

      if (Math.abs(newFoodAccum) >= 1) {
        const delta = newFoodAccum > 0 ? Math.floor(newFoodAccum) : Math.ceil(newFoodAccum);
        newFoodAccum -= delta;
        if (delta > 0) {
          const storLvl = state.buildings['storage'] || 0;
          newResources['food'] = Math.min(getStorageCapacity(storLvl), (newResources['food'] || 0) + delta);
        } else {
          const taken = Math.min(newResources['food'] || 0, -delta);
          newResources['food'] = Math.max(0, (newResources['food'] || 0) - taken);
          // Si manque de nourriture : les survivants non en expédition perdent 1 HP/tick
          if (taken < -delta) {
            newSurvivors = newSurvivors.map(s => {
              if (s.status === 'expedition') return s;
              const newHp = Math.max(1, s.health - 1);
              return { ...s, health: newHp, status: (newHp < 50 && s.status !== 'injured' ? 'injured' : s.status) as Survivor['status'] };
            });
          }
        }
      }

      // ── Raids sur la base ──────────────────────────────────────────────────
      let newLastRaidAt = state.lastRaidAt;
      const raidCooldownOk = !state.lastRaidAt || (now - state.lastRaidAt > RAID_COOLDOWN_MS);
      if (raidCooldownOk && Math.random() < RAID_CHANCE_PER_TICK) {
        newLastRaidAt = now;
        const watchtowerLvl = state.buildings['watchtower'] || 0;
        const dmgReduction = watchtowerLvl * 0.08;

        if (Math.random() < 0.5) {
          // Raid sur les ressources
          const raidableRes = ['scrap', 'food', 'materials'].filter(r => (newResources[r] || 0) > 0);
          if (raidableRes.length > 0) {
            const target = raidableRes[Math.floor(Math.random() * raidableRes.length)];
            const basePercent = randomInt(5, 15) / 100;
            const actualPercent = basePercent * (1 - dmgReduction);
            const loss = Math.max(1, Math.floor((newResources[target] || 0) * actualPercent));
            newResources[target] = Math.max(0, (newResources[target] || 0) - loss);
            const resNames: Record<string, string> = { scrap: 'ferraille', food: 'nourriture', materials: 'matériaux' };
            tickLogs.push({ id: uuidv4(), message: `Raid sur la base ! ${loss} ${resNames[target] ?? target} pillé(s).`, time: now, type: 'danger' });
          }
        } else {
          // Raid sur un survivant disponible
          const targets = newSurvivors.filter(s => s.status === 'available' || s.status === 'resting');
          if (targets.length > 0) {
            const target = targets[Math.floor(Math.random() * targets.length)];
            const baseDmg = randomInt(10, 25);
            const actualDmg = Math.max(1, Math.floor(baseDmg * (1 - dmgReduction)));
            newSurvivors = newSurvivors.map(s => {
              if (s.id !== target.id) return s;
              const newHp = Math.max(1, s.health - actualDmg);
              return { ...s, health: newHp, status: (newHp < 50 ? 'injured' : s.status) as Survivor['status'] };
            });
            tickLogs.push({ id: uuidv4(), message: `Raid ! ${target.name} a été attaqué(e) et perd ${actualDmg} PV.`, time: now, type: 'danger' });
          }
        }
      }

      // ── Événements d'expédition ────────────────────────────────────────────
      const newExpeditions = state.expeditions.map(exp => {
        if (exp.completed || exp.eventTriggered) return exp;
        const elapsed = now - exp.startTime;
        const progress = elapsed / (exp.duration * 1000);
        if (progress < 0.4) return exp;
        // Marquer comme testé, puis éventuellement générer un événement
        const zone = ZONES.find(z => z.id === exp.zoneId)
          ?? (TILE_BY_ID.has(exp.zoneId) ? synthZoneDef(TILE_BY_ID.get(exp.zoneId)!) : null);
        if (zone && Math.random() < 0.15) {
          const event = generateExpeditionEvent(exp, zone);
          return { ...exp, eventTriggered: true, pendingEvent: event };
        }
        return { ...exp, eventTriggered: true };
      });
      const expChanged = newExpeditions.some((e, i) => e !== state.expeditions[i]);

      // ── Recrues expirées ───────────────────────────────────────────────────
      const freshRecruits = (state.pendingRecruits || []).filter(r => r.expiresAt > now);
      const recruitsChanged = freshRecruits.length !== (state.pendingRecruits || []).length;

      // ── Assembler le nouvel état ───────────────────────────────────────────
      return {
        ...state,
        survivors: newSurvivors,
        resources: newResources,
        expeditions: expChanged ? newExpeditions : state.expeditions,
        pendingRecruits: freshRecruits,
        lastRaidAt: newLastRaidAt,
        foodAccum: newFoodAccum,
        gameLog: tickLogs.length > 0 ? [...tickLogs, ...state.gameLog.slice(0, 49)] : state.gameLog,
      };
    }
    default: return state;
  }
}

function createInitialState(): GameState {
  const survivors: Survivor[] = [];
  for (let i = 0; i < 4; i++) survivors.push(generateSurvivor());
  return {
    resources: { food: 30, scrap: 25, medicine: 10, fuel: 5, electronics: 3, materials: 15 },
    buildings: {}, survivors, expeditions: [], recyclingTasks: [], trainingTasks: [], craftingTasks: [], healingTasks: [], farmingTasks: [],
    traderCampDiscovered: false, traderCamp: null, discoveredZones: [], discoveredTiles: [], garageVehicles: [], vehicleMarkers: [],
    inventory: [{ ...ALL_EQUIPMENT.find(e => e.id === 'pipe_weapon')! }, { ...ALL_EQUIPMENT.find(e => e.id === 'rags_armor')! }],
    gameLog: [{ id: uuidv4(), message: 'Bienvenue dans votre nouvelle base. La survie commence maintenant.', time: Date.now(), type: 'info' }],
    pendingResults: null, pendingRecruits: [], initialized: false,
    factionReputation: {}, discoveredFactions: [], lastRaidAt: undefined, foodAccum: 0,
  };
}

const SAVE_KEY = 'wasteland_commander_save';

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  upgradeBuilding: (buildingId: string) => void;
  launchExpedition: (zoneId: string, survivorIds: string[], vehicleIds: string[], retrievalMarkerId?: string) => void;
  equipItem: (survivorId: string, item: EquipmentDef) => void;
  unequipItem: (survivorId: string, slot: 'weapon' | 'armor' | 'backpack') => void;
  startCraft: (survivorId: string, itemId: string) => void;
  cancelCraft: (taskId: string) => void;
  healSurvivor: (survivorId: string) => void;
  viewResults: (expedition: Expedition | null) => void;
  collectResults: () => void;
  resetGame: () => void;
  startRecycle: (survivorId: string, inventoryIndex: number) => void;
  cancelRecycle: (taskId: string) => void;
  startTraining: (survivorId: string, stat: TrainableStat) => void;
  cancelTraining: (taskId: string) => void;
  executeTrade: (give: TradeGive, receive: TradeReceive) => void;
  repairItem: (survivorId: string, slot: 'weapon' | 'armor' | 'backpack') => void;
  addVehicle: (vehicleTypeId: string) => void;
  removeVehicle: (vehicleId: string) => void;
  acceptRecruit: (recruitId: string) => void;
  declineRecruit: (recruitId: string) => void;
  resolveExpeditionEvent: (expeditionId: string, choiceIndex: 0 | 1) => void;
  banSurvivor: (survivorId: string) => void;
  startHealing:  (healerId: string, targetId: string) => void;
  cancelHealing: (taskId: string) => void;
  startFarming:  (survivorId: string) => void;
  cancelFarming: (taskId: string) => void;
  // Auth
  user: User | null;
  authLoading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  // Cloud save
  cloudSave: () => Promise<string | null>;
  cloudLoad: () => Promise<string | null>;
  cloudSaving: boolean;
  lastCloudSave: string | null;
}

const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, createInitialState());
  const tickRef = useRef<ReturnType<typeof setInterval>>();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cloudSaving, setCloudSaving] = useState(false);
  const [lastCloudSave, setLastCloudSave] = useState<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Listen to auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (session?.user) {
        loadFromCloud(session.user.id);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadFromCloud(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadFromCloud(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('game_saves')
        .select('game_state, updated_at')
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') return error.message;
      if (data && data.game_state) {
        const cloudState = data.game_state as GameState;
        dispatch({ type: 'INIT_GAME', state: { ...cloudState, pendingResults: null, initialized: true } });
        localStorage.setItem(SAVE_KEY, JSON.stringify(cloudState));
        setLastCloudSave(data.updated_at);
        return null;
      }
      return null;
    } catch (e: any) {
      return e.message || 'Erreur de chargement';
    }
  }

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as GameState;
        dispatch({ type: 'INIT_GAME', state: { ...parsed, pendingResults: null } });
      } else {
        dispatch({ type: 'INIT_GAME', state: createInitialState() });
      }
    } catch {
      dispatch({ type: 'INIT_GAME', state: createInitialState() });
    }
  }, []);

  // Save to localStorage on state change
  useEffect(() => {
    if (state.initialized) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    }
  }, [state]);

  // Tick every second
  useEffect(() => {
    tickRef.current = setInterval(() => { dispatch({ type: 'TICK' }); }, 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  // Check expedition completion every second (stateRef avoids stale closure)
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      for (const exp of stateRef.current.expeditions) {
        if (!exp.completed && now >= exp.startTime + exp.duration * 1000) {
          dispatch({ type: 'COMPLETE_EXPEDITION', expeditionId: exp.id });
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Check recycling task completion every second
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      for (const task of stateRef.current.recyclingTasks) {
        if (now >= task.startTime + task.duration * 1000) {
          dispatch({ type: 'COMPLETE_RECYCLE', taskId: task.id });
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Check training task completion every second
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      for (const task of stateRef.current.trainingTasks) {
        if (now >= task.startTime + task.duration * 1000) {
          dispatch({ type: 'COMPLETE_TRAINING', taskId: task.id });
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Check crafting task completion every second
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      for (const task of stateRef.current.craftingTasks) {
        if (now >= task.startTime + task.duration * 1000) {
          dispatch({ type: 'COMPLETE_CRAFT', taskId: task.id });
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    return null;
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return error.message;
    return null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setLastCloudSave(null);
  }, []);

  const cloudSave = useCallback(async (): Promise<string | null> => {
    if (!user) return 'Non connecté';
    setCloudSaving(true);
    try {
      const saveData = { ...stateRef.current, pendingResults: null };
      const { error } = await supabase
        .from('game_saves')
        .upsert({
          user_id: user.id,
          game_state: saveData,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      if (error) return error.message;
      setLastCloudSave(new Date().toISOString());
      return null;
    } catch (e: any) {
      return e.message || 'Erreur de sauvegarde';
    } finally {
      setCloudSaving(false);
    }
  }, [user]);

  const cloudLoad = useCallback(async (): Promise<string | null> => {
    if (!user) return 'Non connecté';
    return loadFromCloud(user.id);
  }, [user]);

  const upgradeBuilding = useCallback((buildingId: string) => { dispatch({ type: 'UPGRADE_BUILDING', buildingId }); }, []);
  const launchExpedition = useCallback((zoneId: string, survivorIds: string[], vehicleIds: string[], retrievalMarkerId?: string) => { dispatch({ type: 'LAUNCH_EXPEDITION', zoneId, survivorIds, vehicleIds, retrievalMarkerId }); }, []);
  const equipItem = useCallback((survivorId: string, item: EquipmentDef) => { dispatch({ type: 'EQUIP_ITEM', survivorId, item }); }, []);
  const unequipItem = useCallback((survivorId: string, slot: 'weapon' | 'armor' | 'backpack') => { dispatch({ type: 'UNEQUIP_ITEM', survivorId, slot }); }, []);
  const startCraft  = useCallback((survivorId: string, itemId: string) => { dispatch({ type: 'START_CRAFT', survivorId, itemId }); }, []);
  const cancelCraft = useCallback((taskId: string) => { dispatch({ type: 'CANCEL_CRAFT', taskId }); }, []);
  const healSurvivor = useCallback((survivorId: string) => { dispatch({ type: 'HEAL_SURVIVOR', survivorId }); }, []);
  const viewResults = useCallback((expedition: Expedition | null) => { dispatch({ type: 'VIEW_RESULTS', expedition }); }, []);
  const collectResults = useCallback(() => { dispatch({ type: 'COLLECT_RESULTS' }); }, []);
  const resetGame = useCallback(() => { localStorage.removeItem(SAVE_KEY); dispatch({ type: 'INIT_GAME', state: createInitialState() }); }, []);
  const startRecycle   = useCallback((survivorId: string, inventoryIndex: number) => { dispatch({ type: 'START_RECYCLE', survivorId, inventoryIndex }); }, []);
  const cancelRecycle  = useCallback((taskId: string) => { dispatch({ type: 'CANCEL_RECYCLE', taskId }); }, []);
  const startTraining  = useCallback((survivorId: string, stat: TrainableStat) => { dispatch({ type: 'START_TRAINING', survivorId, stat }); }, []);
  const cancelTraining = useCallback((taskId: string) => { dispatch({ type: 'CANCEL_TRAINING', taskId }); }, []);
  const executeTrade   = useCallback((give: TradeGive, receive: TradeReceive) => { dispatch({ type: 'EXECUTE_TRADE', give, receive }); }, []);
  const repairItem     = useCallback((survivorId: string, slot: 'weapon' | 'armor' | 'backpack') => { dispatch({ type: 'REPAIR_ITEM', survivorId, slot }); }, []);
  const addVehicle     = useCallback((vehicleTypeId: string) => { dispatch({ type: 'ADD_VEHICLE', vehicleTypeId }); }, []);
  const removeVehicle  = useCallback((vehicleId: string) => { dispatch({ type: 'REMOVE_VEHICLE', vehicleId }); }, []);
  const acceptRecruit  = useCallback((recruitId: string) => { dispatch({ type: 'ACCEPT_RECRUIT', recruitId }); }, []);
  const declineRecruit = useCallback((recruitId: string) => { dispatch({ type: 'DECLINE_RECRUIT', recruitId }); }, []);
  const resolveExpeditionEvent = useCallback((expeditionId: string, choiceIndex: 0 | 1) => { dispatch({ type: 'RESOLVE_EXPEDITION_EVENT', expeditionId, choiceIndex }); }, []);
  const banSurvivor    = useCallback((survivorId: string) => { dispatch({ type: 'BAN_SURVIVOR', survivorId }); }, []);
  const startHealing  = useCallback((healerId: string, targetId: string) => { dispatch({ type: 'START_HEALING', healerId, targetId }); }, []);
  const cancelHealing = useCallback((taskId: string) => { dispatch({ type: 'CANCEL_HEALING', taskId }); }, []);
  const startFarming  = useCallback((survivorId: string) => { dispatch({ type: 'START_FARMING', survivorId }); }, []);
  const cancelFarming = useCallback((taskId: string) => { dispatch({ type: 'CANCEL_FARMING', taskId }); }, []);

  // Check healing task completion every second
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      for (const task of stateRef.current.healingTasks) {
        if (now >= task.startTime + task.duration * 1000) {
          dispatch({ type: 'COMPLETE_HEALING', taskId: task.id });
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <GameContext.Provider value={{
      state, dispatch, upgradeBuilding, launchExpedition,
      equipItem, unequipItem, healSurvivor,
      startCraft, cancelCraft,
      viewResults, collectResults, resetGame,
      startRecycle, cancelRecycle, startTraining, cancelTraining, executeTrade, repairItem,
      addVehicle, removeVehicle, acceptRecruit, declineRecruit, resolveExpeditionEvent, banSurvivor,
      startHealing, cancelHealing, startFarming, cancelFarming,
      user, authLoading, signIn, signUp, signOut,
      cloudSave, cloudLoad, cloudSaving, lastCloudSave,
    }}>
      {children}
    </GameContext.Provider>
  );
}
