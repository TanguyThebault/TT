import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import {
  BUILDINGS, ZONES, ALL_EQUIPMENT, CRAFT_RECIPES,
  SURVIVOR_FIRST_NAMES_MALE, SURVIVOR_FIRST_NAMES_FEMALE, SURVIVOR_LAST_NAMES, SURVIVOR_TRAITS,
  getUpgradeCost, getStorageCapacity, getExpeditionDurationMultiplier,
  getDangerReduction, getMaxSurvivors,
  getRecycleMinEngineering, getRecycleYield, getRecycleDuration,
  type EquipmentDef,
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
  status: 'available' | 'expedition' | 'injured' | 'recycling';
  expeditionId?: string;
  recycleTaskId?: string;
}

export interface RecycleTask {
  id: string;
  survivorId: string;
  item: EquipmentDef;
  startTime: number;
  duration: number;
  engineeringLevel: number;
}

export interface Expedition {
  id: string;
  zoneId: string;
  survivorIds: string[];
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
}

export interface GameState {
  resources: Record<string, number>;
  buildings: Record<string, number>;
  survivors: Survivor[];
  expeditions: Expedition[];
  inventory: EquipmentDef[];
  recyclingTasks: RecycleTask[];
  gameLog: { id: string; message: string; time: number; type: 'info' | 'success' | 'danger' | 'warning' }[];
  pendingResults: Expedition | null;
  initialized: boolean;
}

type GameAction =
  | { type: 'INIT_GAME'; state: GameState }
  | { type: 'UPGRADE_BUILDING'; buildingId: string }
  | { type: 'LAUNCH_EXPEDITION'; zoneId: string; survivorIds: string[] }
  | { type: 'COMPLETE_EXPEDITION'; expeditionId: string }
  | { type: 'VIEW_RESULTS'; expedition: Expedition | null }
  | { type: 'COLLECT_RESULTS' }
  | { type: 'EQUIP_ITEM'; survivorId: string; item: EquipmentDef }
  | { type: 'UNEQUIP_ITEM'; survivorId: string; slot: 'weapon' | 'armor' | 'backpack' }
  | { type: 'CRAFT_ITEM'; itemId: string }
  | { type: 'HEAL_SURVIVOR'; survivorId: string }
  | { type: 'ADD_LOG'; message: string; logType: 'info' | 'success' | 'danger' | 'warning' }
  | { type: 'START_RECYCLE'; survivorId: string; inventoryIndex: number }
  | { type: 'CANCEL_RECYCLE'; taskId: string }
  | { type: 'COMPLETE_RECYCLE'; taskId: string }
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
  }, 0);
  const watchtowerLevel = state.buildings['watchtower'] || 0;
  const dangerReduction = getDangerReduction(watchtowerLevel);
  const effectiveDanger = Math.max(0, zone.dangerLevel * (1 - dangerReduction));
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
    const combatCheck = teamCombat / (survivors.length * 5);
    if (combatCheck < Math.random() * effectiveDanger) {
      events.push('L\'équipe a été attaquée par des pillards !');
      survivors.forEach(s => {
        const armorHP = s.equipment.armor?.stats.health || 0;
        const baseDmg = randomInt(20, 45) * (effectiveDanger / 2);
        survivorDamage[s.id] = Math.max(1, Math.floor(baseDmg - armorHP * 0.3));
      });
    } else {
      events.push('L\'équipe a repoussé une attaque de pillards !');
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

function clampResources(resources: Record<string, number>, storageLevel: number): Record<string, number> {
  const cap = getStorageCapacity(storageLevel);
  const clamped = { ...resources };
  for (const key of Object.keys(clamped)) { clamped[key] = Math.min(clamped[key], cap); }
  return clamped;
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT_GAME': {
      const s: GameState = { ...action.state, initialized: true, recyclingTasks: action.state.recyclingTasks || [] };
      // Repair survivors stuck in 'recycling' with no corresponding task (corrupted/old saves)
      const taskSurvivorIds = new Set(s.recyclingTasks.map(t => t.survivorId));
      return {
        ...s,
        survivors: s.survivors.map(sv =>
          sv.status === 'recycling' && !taskSurvivorIds.has(sv.id)
            ? { ...sv, status: 'available' as const, recycleTaskId: undefined }
            : sv
        ),
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
      const garageLevel = state.buildings['garage'] || 0;
      const duration = Math.floor(zone.baseDuration * getExpeditionDurationMultiplier(garageLevel));
      const foodCost = Math.max(1, Math.ceil((duration / 60) * action.survivorIds.length));
      if ((state.resources['food'] || 0) < foodCost) return state;
      const expeditionId = uuidv4();
      const newSurvivors = state.survivors.map(s => action.survivorIds.includes(s.id) ? { ...s, status: 'expedition' as const, expeditionId } : s);
      const newExpedition: Expedition = { id: expeditionId, zoneId: action.zoneId, survivorIds: action.survivorIds, startTime: Date.now(), duration, completed: false };
      const newRes = { ...state.resources, food: (state.resources['food'] || 0) - foodCost };
      return { ...state, resources: newRes, survivors: newSurvivors, expeditions: [...state.expeditions, newExpedition],
        gameLog: [{ id: uuidv4(), message: `Expédition lancée vers ${zone.name} — ${foodCost} nourriture consommée.`, time: Date.now(), type: 'info' }, ...state.gameLog.slice(0, 49)] };
    }
    case 'COMPLETE_EXPEDITION': {
      const exp = state.expeditions.find(e => e.id === action.expeditionId);
      if (!exp || exp.completed) return state;
      const expSurvivors = state.survivors.filter(s => exp.survivorIds.includes(s.id));
      const results = generateExpeditionResults(exp, expSurvivors, state);
      const completedExp = { ...exp, completed: true, results };
      const newSurvivors = state.survivors.map(s => {
        if (!exp.survivorIds.includes(s.id)) return s;
        const dmg = results.survivorDamage[s.id] || 0;
        const newHP = Math.max(1, s.health - dmg);
        return { ...s, status: (newHP < 50 ? 'injured' : 'available') as Survivor['status'], health: newHP, expeditionId: undefined };
      });
      const storageLevel = state.buildings['storage'] || 0;
      const newRes = { ...state.resources };
      for (const [res, amt] of Object.entries(results.resources)) { newRes[res] = (newRes[res] || 0) + amt; }
      const zone = ZONES.find(z => z.id === exp.zoneId);
      return { ...state, expeditions: state.expeditions.map(e => e.id === action.expeditionId ? completedExp : e),
        survivors: newSurvivors, resources: clampResources(newRes, storageLevel), inventory: [...state.inventory, ...results.equipment], pendingResults: completedExp,
        gameLog: [{ id: uuidv4(), message: `Expédition vers ${zone?.name || 'zone inconnue'} terminée !`, time: Date.now(), type: 'success' }, ...state.gameLog.slice(0, 49)] };
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
    case 'TICK': {
      const infirmaryLevel = state.buildings['infirmary'] || 0;
      if (infirmaryLevel > 0) {
        const healRates = [0, 0.1, 0.25, 0.4, 0.6, 0.8];
        const healRate = healRates[infirmaryLevel] || 0;
        const newSurvivors = state.survivors.map(s => {
          if (s.status === 'expedition' || s.health >= s.maxHealth) return s;
          const healed = Math.min(s.maxHealth, s.health + healRate);
          return { ...s, health: healed, status: (healed >= 50 && s.status === 'injured' ? 'available' : s.status) as Survivor['status'] };
        });
        return { ...state, survivors: newSurvivors };
      }
      return state;
    }
    default: return state;
  }
}

function createInitialState(): GameState {
  const survivors: Survivor[] = [];
  for (let i = 0; i < 4; i++) survivors.push(generateSurvivor());
  return {
    resources: { food: 30, scrap: 25, medicine: 10, fuel: 5, electronics: 3, materials: 15 },
    buildings: {}, survivors, expeditions: [], recyclingTasks: [],
    inventory: [{ ...ALL_EQUIPMENT.find(e => e.id === 'pipe_weapon')! }, { ...ALL_EQUIPMENT.find(e => e.id === 'rags_armor')! }],
    gameLog: [{ id: uuidv4(), message: 'Bienvenue dans votre nouvelle base. La survie commence maintenant.', time: Date.now(), type: 'info' }],
    pendingResults: null, initialized: false,
  };
}

const SAVE_KEY = 'wasteland_commander_save';

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  upgradeBuilding: (buildingId: string) => void;
  launchExpedition: (zoneId: string, survivorIds: string[]) => void;
  equipItem: (survivorId: string, item: EquipmentDef) => void;
  unequipItem: (survivorId: string, slot: 'weapon' | 'armor' | 'backpack') => void;
  craftItem: (itemId: string) => void;
  healSurvivor: (survivorId: string) => void;
  viewResults: (expedition: Expedition | null) => void;
  collectResults: () => void;
  resetGame: () => void;
  startRecycle: (survivorId: string, inventoryIndex: number) => void;
  cancelRecycle: (taskId: string) => void;
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
  const launchExpedition = useCallback((zoneId: string, survivorIds: string[]) => { dispatch({ type: 'LAUNCH_EXPEDITION', zoneId, survivorIds }); }, []);
  const equipItem = useCallback((survivorId: string, item: EquipmentDef) => { dispatch({ type: 'EQUIP_ITEM', survivorId, item }); }, []);
  const unequipItem = useCallback((survivorId: string, slot: 'weapon' | 'armor' | 'backpack') => { dispatch({ type: 'UNEQUIP_ITEM', survivorId, slot }); }, []);
  const craftItem = useCallback((itemId: string) => { dispatch({ type: 'CRAFT_ITEM', itemId }); }, []);
  const healSurvivor = useCallback((survivorId: string) => { dispatch({ type: 'HEAL_SURVIVOR', survivorId }); }, []);
  const viewResults = useCallback((expedition: Expedition | null) => { dispatch({ type: 'VIEW_RESULTS', expedition }); }, []);
  const collectResults = useCallback(() => { dispatch({ type: 'COLLECT_RESULTS' }); }, []);
  const resetGame = useCallback(() => { localStorage.removeItem(SAVE_KEY); dispatch({ type: 'INIT_GAME', state: createInitialState() }); }, []);
  const startRecycle = useCallback((survivorId: string, inventoryIndex: number) => { dispatch({ type: 'START_RECYCLE', survivorId, inventoryIndex }); }, []);
  const cancelRecycle = useCallback((taskId: string) => { dispatch({ type: 'CANCEL_RECYCLE', taskId }); }, []);

  return (
    <GameContext.Provider value={{
      state, dispatch, upgradeBuilding, launchExpedition,
      equipItem, unequipItem, craftItem, healSurvivor,
      viewResults, collectResults, resetGame,
      startRecycle, cancelRecycle,
      user, authLoading, signIn, signUp, signOut,
      cloudSave, cloudLoad, cloudSaving, lastCloudSave,
    }}>
      {children}
    </GameContext.Provider>
  );
}
