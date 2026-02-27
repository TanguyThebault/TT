import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import {
  BUILDINGS, ZONES, ALL_EQUIPMENT, CRAFT_RECIPES,
  SURVIVOR_FIRST_NAMES_MALE, SURVIVOR_FIRST_NAMES_FEMALE, SURVIVOR_LAST_NAMES, SURVIVOR_TRAITS,
  getUpgradeCost, getStorageCapacity,
  getDangerReduction, getMaxSurvivors,
  getRecycleMinEngineering, getRecycleYield, getRecycleDuration,
  TRAINING_DURATIONS, TRAINING_BUILDING_REQ, TRAINING_STAT_LABELS, getTrainingBuildingLevel,
  RESOURCE_RARITY, getEquipmentTradeValue,
  VEHICLE_DEFS, getGarageCapacity,
  type TrainableStat, type EquipmentDef,
} from '@/data/gameData';

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
  status: 'available' | 'expedition' | 'injured' | 'recycling' | 'training' | 'resting';
  restingUntil?: number;
  expeditionId?: string;
  recycleTaskId?: string;
  trainingTaskId?: string;
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

export interface GarageVehicle {
  id: string;
  type: string;
  name: string;
  spaces: number;
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
}

export interface ExpeditionResult {
  resources: Record<string, number>;
  equipment: EquipmentDef[];
  events: string[];
  survivorDamage: Record<string, number>;
  recruitId?: string; // ID du PendingRecruit généré lors de cette expédition
}

export interface GameState {
  resources: Record<string, number>;
  buildings: Record<string, number>;
  survivors: Survivor[];
  expeditions: Expedition[];
  inventory: EquipmentDef[];
  recyclingTasks: RecycleTask[];
  trainingTasks: TrainingTask[];
  traderCampDiscovered: boolean;
  traderCamp: TraderCamp | null;
  discoveredZones: string[];
  garageVehicles: GarageVehicle[];
  gameLog: { id: string; message: string; time: number; type: 'info' | 'success' | 'danger' | 'warning' }[];
  pendingResults: Expedition | null;
  pendingRecruits: PendingRecruit[];
  initialized: boolean;
}

type GameAction =
  | { type: 'INIT_GAME'; state: GameState }
  | { type: 'UPGRADE_BUILDING'; buildingId: string }
  | { type: 'LAUNCH_EXPEDITION'; zoneId: string; survivorIds: string[]; vehicleIds: string[] }
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
  | { type: 'EXECUTE_TRADE'; give: TradeGive; receive: TradeReceive }
  | { type: 'ADD_VEHICLE'; vehicleTypeId: string }
  | { type: 'REMOVE_VEHICLE'; vehicleId: string }
  | { type: 'DEV_SET_RESOURCE'; resourceId: string; value: number }
  | { type: 'ACCEPT_RECRUIT'; recruitId: string }
  | { type: 'DECLINE_RECRUIT'; recruitId: string }
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

function generateExpeditionResults(expedition: Expedition, survivors: Survivor[], state: GameState): ExpeditionResult {
  const zone = ZONES.find(z => z.id === expedition.zoneId)!;
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
  const effectiveDanger = Math.max(0, zone.dangerLevel * (1 - dangerReduction) + noiseDangerBonus);
  const scavBonus = 1 + teamScavenging * 0.05;
  for (const loot of zone.lootTable) {
    if (Math.random() < loot.chance * scavBonus) {
      if (loot.type === 'resource') {
        const qty = Math.floor(randomInt(loot.minQty, loot.maxQty) * scavBonus);
        resources[loot.id] = (resources[loot.id] || 0) + qty;
      } else {
        const eq = ALL_EQUIPMENT.find(e => e.id === loot.id);
        if (eq) equipment.push({ ...eq });
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
  if (events.length === 0) events.push('Expédition sans incident. Bonne récolte !');
  return { resources, equipment, events, survivorDamage };
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
        traderCampDiscovered: action.state.traderCampDiscovered ?? false,
        traderCamp:           action.state.traderCamp           ?? null,
        discoveredZones:      action.state.discoveredZones      ?? [],
        garageVehicles:       action.state.garageVehicles       ?? [],
        pendingRecruits:      action.state.pendingRecruits      ?? [],
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
          const sv2 = (sv.status === 'recycling' || sv.status === 'training') && !busyIds.has(sv.id)
            ? { ...sv, status: 'available' as const, recycleTaskId: undefined, trainingTaskId: undefined }
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
      const zone = ZONES.find(z => z.id === action.zoneId);
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
      if ((state.resources['food'] || 0) < foodCost) return state;
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
      };
      const newRes = { ...state.resources, food: (state.resources['food'] || 0) - foodCost };
      const speedMsg = speedReduction > 0 ? ` · -${Math.round(speedReduction * 100)}% durée` : '';
      return {
        ...state, resources: newRes, survivors: newSurvivors,
        expeditions: [...state.expeditions, newExpedition],
        gameLog: [{ id: uuidv4(), message: `Expédition lancée vers ${zone.name} — ${foodCost} nourriture consommée${speedMsg}.`, time: Date.now(), type: 'info' }, ...state.gameLog.slice(0, 49)],
      };
    }
    case 'COMPLETE_EXPEDITION': {
      const exp = state.expeditions.find(e => e.id === action.expeditionId);
      if (!exp || exp.completed) return state;
      const expSurvivors = state.survivors.filter(s => exp.survivorIds.includes(s.id));

      const newDiscoveredZones = state.discoveredZones.includes(exp.zoneId)
        ? state.discoveredZones
        : [...state.discoveredZones, exp.zoneId];
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
          gameLog: [{
            id: uuidv4(),
            message: alreadyKnown ? `Contact réaffirmé avec ${newCamp.name}.` : `Contact établi avec ${newCamp.name} !`,
            time: Date.now(), type: 'success',
          }, ...state.gameLog.slice(0, 49)],
        };
      }

      const results = generateExpeditionResults(exp, expSurvivors, state);
      const completedExp = { ...exp, completed: true, results };
      const zone = ZONES.find(z => z.id === exp.zoneId);
      const dangerLevel = zone?.dangerLevel ?? 0;
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

      const newLogs = [
        { id: uuidv4(), message: `Expédition vers ${zone?.name || 'zone inconnue'} terminée !`, time: Date.now(), type: 'success' as const },
        ...deadNames.map(n => ({ id: uuidv4(), message: `${n} a été tué(e) lors de l'expédition.`, time: Date.now(), type: 'danger' as const })),
        ...brokenNames.map(n => ({ id: uuidv4(), message: `${n} a été détruit(e) lors de l'expédition.`, time: Date.now(), type: 'warning' as const })),
        ...state.gameLog.slice(0, 49),
      ];

      // Recrutement — 1 chance sur 10 si de la place est disponible dans le camp
      const barracksLevel2 = state.buildings['barracks'] || 0;
      const newPendingRecruits = [...(state.pendingRecruits || [])];
      let finalCompletedExp = completedExp;
      if (newSurvivors.length < getMaxSurvivors(barracksLevel2) && Math.random() < 0.1) {
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

      return {
        ...state,
        expeditions: state.expeditions.map(e => e.id === action.expeditionId ? finalCompletedExp : e),
        survivors: newSurvivors,
        resources: clampResources(newRes, storageLevel),
        inventory: [...state.inventory, ...results.equipment],
        pendingResults: finalCompletedExp,
        pendingRecruits: newPendingRecruits,
        discoveredZones: newDiscoveredZones,
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
      if (engLevel < getRecycleMinEngineering(item.tier)) return state;
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
    case 'TICK': {
      const now = Date.now();
      const infirmaryLevel = state.buildings['infirmary'] || 0;
      const healRates = [0, 0.1, 0.25, 0.4, 0.6, 0.8];
      const healRate = healRates[infirmaryLevel] || 0;
      const newSurvivors = state.survivors.map(s => {
        let sv = s;
        // Resting → available
        if (sv.status === 'resting' && sv.restingUntil && now >= sv.restingUntil) {
          sv = { ...sv, status: 'available' as const, restingUntil: undefined };
        }
        // Infirmary healing
        if (healRate > 0 && sv.status !== 'expedition' && sv.health < sv.maxHealth) {
          const healed = Math.min(sv.maxHealth, sv.health + healRate);
          sv = { ...sv, health: healed, status: (healed >= 50 && sv.status === 'injured' ? 'available' : sv.status) as Survivor['status'] };
        }
        return sv;
      });
      const changed = newSurvivors.some((s, i) => s !== state.survivors[i]);
      const freshRecruits = (state.pendingRecruits || []).filter(r => r.expiresAt > now);
      const recruitsChanged = freshRecruits.length !== (state.pendingRecruits || []).length;
      return (changed || recruitsChanged)
        ? { ...state, survivors: newSurvivors, pendingRecruits: freshRecruits }
        : state;
    }
    default: return state;
  }
}

function createInitialState(): GameState {
  const survivors: Survivor[] = [];
  for (let i = 0; i < 4; i++) survivors.push(generateSurvivor());
  return {
    resources: { food: 30, scrap: 25, medicine: 10, fuel: 5, electronics: 3, materials: 15 },
    buildings: {}, survivors, expeditions: [], recyclingTasks: [], trainingTasks: [],
    traderCampDiscovered: false, traderCamp: null, discoveredZones: [], garageVehicles: [],
    inventory: [{ ...ALL_EQUIPMENT.find(e => e.id === 'pipe_weapon')! }, { ...ALL_EQUIPMENT.find(e => e.id === 'rags_armor')! }],
    gameLog: [{ id: uuidv4(), message: 'Bienvenue dans votre nouvelle base. La survie commence maintenant.', time: Date.now(), type: 'info' }],
    pendingResults: null, pendingRecruits: [], initialized: false,
  };
}

const SAVE_KEY = 'wasteland_commander_save';

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  upgradeBuilding: (buildingId: string) => void;
  launchExpedition: (zoneId: string, survivorIds: string[], vehicleIds: string[]) => void;
  equipItem: (survivorId: string, item: EquipmentDef) => void;
  unequipItem: (survivorId: string, slot: 'weapon' | 'armor' | 'backpack') => void;
  craftItem: (itemId: string) => void;
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
  const launchExpedition = useCallback((zoneId: string, survivorIds: string[], vehicleIds: string[]) => { dispatch({ type: 'LAUNCH_EXPEDITION', zoneId, survivorIds, vehicleIds }); }, []);
  const equipItem = useCallback((survivorId: string, item: EquipmentDef) => { dispatch({ type: 'EQUIP_ITEM', survivorId, item }); }, []);
  const unequipItem = useCallback((survivorId: string, slot: 'weapon' | 'armor' | 'backpack') => { dispatch({ type: 'UNEQUIP_ITEM', survivorId, slot }); }, []);
  const craftItem = useCallback((itemId: string) => { dispatch({ type: 'CRAFT_ITEM', itemId }); }, []);
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

  return (
    <GameContext.Provider value={{
      state, dispatch, upgradeBuilding, launchExpedition,
      equipItem, unequipItem, craftItem, healSurvivor,
      viewResults, collectResults, resetGame,
      startRecycle, cancelRecycle, startTraining, cancelTraining, executeTrade, repairItem,
      addVehicle, removeVehicle, acceptRecruit, declineRecruit,
      user, authLoading, signIn, signUp, signOut,
      cloudSave, cloudLoad, cloudSaving, lastCloudSave,
    }}>
      {children}
    </GameContext.Provider>
  );
}
