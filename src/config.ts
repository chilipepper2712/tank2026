// Tunable numbers live here so balance changes never touch game logic.

export const C = 10; // world px per destructible cell; scale is 5 px = 1 m, so a cell is 2 m
export const PX_PER_M = 5;
export const K = 0.78; // ground depth squash of the 3/4 camera
export const ZS = 0.75; // screen px per unit of height
export const DEG = Math.PI / 180;
export const VIEW_SHORT = 480; // world px across the short screen side at zoom 1

// ---------- materials ----------
export type MaterialId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export interface Material {
  name: string;
  top: number;
  side: number;
  debris: number[];
  dust?: number;
  size: [number, number];
  chunks: number;
  splinter?: boolean;
  spark?: boolean;
  windows?: number;
  /** explicit colours per tint instead of shades of `top` (containers, cars) */
  palette?: number[];
  /** explicit wall colours per tint (painted facades) */
  sidePalette?: number[];
}
export const MAT = { concrete: 1, brick: 2, wood: 3, steel: 4, stone: 5, tree: 6, car: 7, shophouse: 8, shed: 9 } as const;
export const MATERIALS: Record<MaterialId, Material> = {
  1: { name: 'Bê tông', top: 0x8f9297, side: 0x5c5f65, debris: [0xaaacaf, 0x7d8085, 0xc7c5bd], dust: 0xa3a39c, size: [2, 4.5], chunks: 3, windows: 0x2a3039 },
  2: { name: 'Gạch', top: 0xa65a40, side: 0x6f3727, debris: [0xb9643f, 0x8a4630, 0xd08a64], dust: 0xa57966, size: [2, 3.5], chunks: 3, windows: 0x3b261f },
  3: { name: 'Gỗ', top: 0x9c7849, side: 0x664b2e, debris: [0xb78e5b, 0x7d5d3a, 0xd3b07a], dust: 0x8f7a57, size: [1.6, 1.8], chunks: 3, splinter: true },
  4: { name: 'Thép', top: 0x6a7d8b, side: 0x43505b, palette: [0xb5652f, 0x3f6f8f, 0x4f7f4a, 0x9a3a32], debris: [0x8d9ba7, 0x56636e], size: [1.5, 2.5], chunks: 1, spark: true },
  5: { name: 'Đá', top: 0x8c8371, side: 0x5d5649, debris: [0xa2987f, 0x716959, 0x585145], dust: 0x8a8270, size: [2.5, 5], chunks: 2 },
  6: { name: 'Cây', top: 0x4f7a3a, side: 0x355a28, debris: [0x5f8f45, 0x3f6a2e, 0x7a5a36], size: [1.6, 2.4], chunks: 3, splinter: true },
  7: { name: 'Ô tô', top: 0xb8483a, side: 0x6b2a22, palette: [0xb8483a, 0xd9d6cc, 0x3d5f8c, 0xd0a83a], debris: [0x9aa3a8, 0x2c2f33, 0xc9d6dc], size: [1.5, 3], chunks: 2, spark: true },
  8: { name: 'Nhà phố', top: 0x9c9890, side: 0xd8c99a, sidePalette: [0xe6d6a2, 0xeec3a0, 0xa9cbd2, 0xc6dcab], debris: [0xd8c99a, 0x9c9890, 0xc9b9a0], dust: 0xc4b9a4, size: [2, 4], chunks: 3, windows: 0x2d3338 },
  9: { name: 'Nhà xưởng', top: 0x9aa4a8, side: 0x6f7a80, debris: [0xa8b2b6, 0x6f7a80], size: [1.5, 3], chunks: 2, spark: true },
};
export const RUBBLE_SLOW = 0.55;

// ---------- building tiers ----------
// Gameplay comes from building size; material is only the look and the debris.
export type TierId = 1 | 2 | 3;
export const TIERS: Record<TierId, { name: string; hp: number }> = {
  1: { name: 'Nhà nhỏ', hp: 12 }, // shells punch straight through
  2: { name: 'Nhà thấp tầng', hp: 45 }, // takes several shots to open a gap
  3: { name: 'Nhà cao tầng', hp: Infinity }, // indestructible, only the facade chips
};
/** cells of small house a shell can tunnel through before it detonates */
export const PIERCE = { heavy: 8, light: 2 };

// ---------- units ----------
export interface Facing { front: number; side: number; rear: number }
export interface WeaponSpec {
  dmg: number;
  speed: number;
  range: number;
  reload: number;
  burst: number; // shots per trigger pull
  burstGap: number;
  blast: number; // radius of terrain damage, 0 = none
  spread: number; // base dispersion (rad)
  light?: boolean; // weak against heavy armour
  overhead?: boolean; // flies over buildings (drones)
}
export interface UnitSpec {
  id: string;
  name: string;
  hp: number;
  speed: number;
  hullTurn: number; // rad/s
  hullInertia: number; // s to reach full turn speed
  turretTurn: number;
  turretInertia: number;
  fixedGun?: number; // half arc (rad) for casemate guns
  facing: Facing;
  heavy: boolean;
  radius: number;
  aimTime: number;
  weapon: WeaponSpec;
  colors: { body: number; top: number; turret: number };
  flying?: boolean;
  soft?: boolean; // machine guns only hurt soft targets (drones, robots, infantry)
  size: [number, number]; // hull length, width
}

export const LIGHT_VS_HEAVY = 0.45;

export const PLAYER_CLASSES: Record<'tank' | 'apc', UnitSpec & { skill: 'rapid' | 'nitro'; skillName: string; skillCd: number }> = {
  tank: {
    id: 'tank', name: 'Xe tăng', hp: 165, speed: 130,
    hullTurn: 90 * DEG, hullInertia: 0.25, turretTurn: 70 * DEG, turretInertia: 0.15,
    facing: { front: 0.5, side: 1, rear: 1.6 }, heavy: true, radius: 15, aimTime: 0.8, size: [34, 26],
    weapon: { dmg: 44, speed: 560, range: 560, reload: 0.9, burst: 1, burstGap: 0, blast: 24, spread: 0.012 },
    colors: { body: 0x56653a, top: 0x7e9150, turret: 0x9db35f },
    skill: 'rapid', skillName: 'NẠP NHANH', skillCd: 9,
  },
  apc: {
    id: 'apc', name: 'Xe bọc thép', hp: 105, speed: 210,
    hullTurn: 150 * DEG, hullInertia: 0.15, turretTurn: 140 * DEG, turretInertia: 0.1,
    facing: { front: 0.7, side: 1, rear: 1.5 }, heavy: false, radius: 9, aimTime: 0.5, size: [32, 18],
    weapon: { dmg: 24, speed: 640, range: 480, reload: 1.02, burst: 3, burstGap: 0.09, blast: 12, spread: 0.02, light: true },
    colors: { body: 0x4d5c4a, top: 0x748a6c, turret: 0x93ad88 },
    skill: 'nitro', skillName: 'NITRO', skillCd: 7,
  },
};

export type EnemyType = 'tank' | 'apc' | 'td' | 'drone';
export const ENEMIES: Record<EnemyType, UnitSpec> = {
  tank: {
    id: 'e-tank', name: 'Xe tăng địch', hp: 100, speed: 70,
    hullTurn: 60 * DEG, hullInertia: 0.3, turretTurn: 50 * DEG, turretInertia: 0.2,
    facing: { front: 0.5, side: 1, rear: 1.6 }, heavy: true, radius: 15, aimTime: 1, size: [34, 26],
    weapon: { dmg: 14, speed: 380, range: 300, reload: 2.4, burst: 1, burstGap: 0, blast: 16, spread: 0.03 },
    colors: { body: 0x6e3a2d, top: 0x9c553f, turret: 0xb6644a },
  },
  apc: {
    id: 'e-apc', name: 'Xe bọc thép địch', hp: 55, speed: 125,
    hullTurn: 120 * DEG, hullInertia: 0.2, turretTurn: 110 * DEG, turretInertia: 0.15,
    facing: { front: 0.8, side: 1, rear: 1.4 }, heavy: false, radius: 14, aimTime: 0.6, size: [34, 20],
    weapon: { dmg: 4, speed: 460, range: 260, reload: 1.8, burst: 3, burstGap: 0.12, blast: 8, spread: 0.05, light: true },
    colors: { body: 0x6b4434, top: 0x8f5f48, turret: 0xa8705a },
  },
  td: {
    id: 'e-td', name: 'Pháo diệt tăng', hp: 150, speed: 45,
    hullTurn: 35 * DEG, hullInertia: 0.4, turretTurn: 30 * DEG, turretInertia: 0.2, fixedGun: 12 * DEG,
    facing: { front: 0.3, side: 1.2, rear: 1.8 }, heavy: true, radius: 16, aimTime: 1.2, size: [38, 26],
    weapon: { dmg: 30, speed: 520, range: 380, reload: 3.2, burst: 1, burstGap: 0, blast: 22, spread: 0.02 },
    colors: { body: 0x5e3426, top: 0x7f4733, turret: 0x8f523b },
  },
  drone: {
    id: 'e-drone', name: 'Drone', hp: 22, speed: 150,
    hullTurn: 360 * DEG, hullInertia: 0.1, turretTurn: 360 * DEG, turretInertia: 0.05,
    facing: { front: 1, side: 1, rear: 1 }, heavy: false, radius: 11, aimTime: 0.3, size: [18, 18], flying: true, soft: true,
    weapon: { dmg: 3, speed: 420, range: 210, reload: 1.3, burst: 2, burstGap: 0.15, blast: 0, spread: 0.06, light: true, overhead: true },
    colors: { body: 0x3a3836, top: 0x5c5853, turret: 0xe4573f },
  },
};
/**
 * Repair. No passive regeneration: the crew repairs with a kit (vehicle must stay still,
 * every weapon off), at a repair station (heals while fighting, limited pool) or picks up
 * air-dropped kits.
 */
export const REPAIR = {
  kitHeal: 0.1, // share of max HP per kit; upgrades raise it
  kitTime: 6,
  startKits: 3,
  maxKits: 5,
  stationRate: 0.08, // share of max HP per second while inside
  stationPool: 0.6, // total share of max HP one station can give
  stationRadius: 55,
  dropEvery: [50, 70] as [number, number],
  dropDist: [250, 450] as [number, number],
};

// ---------- companions ----------
export type AllyType = 'attackDrone' | 'interceptor' | 'robot' | 'repairDroid';
export const ALLY_SLOTS = { tank: 1, apc: 2 } as const;
/** Repair droid (kit upgrade level 3): heals this share of max HP per second while near the vehicle. */
export const REPAIR_DROID_RATE = 0.03;
const ALLY_COLORS = { body: 0x3f5a5c, top: 0x5f8584, turret: 0x86b0ae };
export const ALLIES: Record<AllyType, UnitSpec & { title: string; role: string }> = {
  attackDrone: {
    id: 'a-drone', name: 'Drone tấn công', title: 'Drone tấn công', role: 'Bay theo xe, bắn loạt nhẹ vào mọi mục tiêu trong tầm',
    hp: 30, speed: 210, hullTurn: 360 * DEG, hullInertia: 0.1, turretTurn: 360 * DEG, turretInertia: 0.05,
    facing: { front: 1, side: 1, rear: 1 }, heavy: false, radius: 10, aimTime: 0.3, size: [16, 16], flying: true, soft: true,
    weapon: { dmg: 6, speed: 500, range: 240, reload: 1, burst: 3, burstGap: 0.1, blast: 0, spread: 0.04, light: true, overhead: true },
    colors: ALLY_COLORS,
  },
  interceptor: {
    id: 'a-intercept', name: 'Drone đánh chặn', title: 'Drone đánh chặn', role: 'Ưu tiên bắn hạ drone địch, tầm xa',
    hp: 25, speed: 240, hullTurn: 360 * DEG, hullInertia: 0.1, turretTurn: 360 * DEG, turretInertia: 0.05,
    facing: { front: 1, side: 1, rear: 1 }, heavy: false, radius: 10, aimTime: 0.2, size: [16, 16], flying: true, soft: true,
    weapon: { dmg: 5, speed: 600, range: 300, reload: 0.5, burst: 2, burstGap: 0.08, blast: 0, spread: 0.02, light: true, overhead: true },
    colors: ALLY_COLORS,
  },
  robot: {
    id: 'a-robot', name: 'Robot chống tăng', title: 'Robot chống tăng', role: 'Đi bộ cạnh xe, bắn rocket chống tăng chậm mà đau',
    hp: 70, speed: 150, hullTurn: 220 * DEG, hullInertia: 0.1, turretTurn: 200 * DEG, turretInertia: 0.08,
    facing: { front: 1, side: 1, rear: 1.2 }, heavy: false, radius: 10, aimTime: 0.5, size: [18, 16], soft: true,
    weapon: { dmg: 28, speed: 420, range: 300, reload: 3.5, burst: 1, burstGap: 0, blast: 14, spread: 0.02 },
    colors: ALLY_COLORS,
  },
  repairDroid: {
    id: 'a-repair', name: 'Droid sửa chữa', title: 'Droid sửa chữa', role: 'Tự sửa xe khi ở gần, xe vẫn bắn được',
    hp: 60, speed: 150, hullTurn: 260 * DEG, hullInertia: 0.1, turretTurn: 200 * DEG, turretInertia: 0.08,
    facing: { front: 1, side: 1, rear: 1 }, heavy: false, radius: 9, aimTime: 0.5, size: [16, 14], soft: true,
    weapon: { dmg: 0, speed: 1, range: 0, reload: 99, burst: 0, burstGap: 0, blast: 0, spread: 0 },
    colors: { body: 0x3f5a5c, top: 0x9fd16a, turret: 0xebe7d3 },
  },
};
export const PICKABLE_ALLIES: AllyType[] = ['attackDrone', 'interceptor', 'robot'];

export const DRONE_ALT = 34; // minimum cruise height; drones climb over taller roofs
export const DRONE_CLEARANCE = 14;

/** Auto machine gun on both player vehicles: shoots soft targets only, never vehicles. */
export const MG = { range: 240, rate: 10, dmg: 2.9, hit: 0.8 };

/**
 * Anti-tank guided missile on both player vehicles. Flies over buildings and hits from above
 * (no armour facing). The launcher holds 2 and reloads one missile at a time (`reloadEach` s),
 * so the player has to break off and take cover between volleys. Ammo is limited per mission.
 */
export const ATGM = { dmg: 77, range: 420, speed: 300, turn: 3.2, perLoad: 2, reloadEach: 6, ammo: 6, blast: 26, gap: 0.35, cruise: 46 };
