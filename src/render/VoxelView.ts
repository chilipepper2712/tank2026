import { Container, Sprite } from 'pixi.js';
import { K, ZS } from '../config';
import { armaHull, armaTurret, hiluxHull, hiluxLauncher, mastiffGun, mastiffHull, PALETTES, patriaHull, patriaTurret, pz4Hull, pz4Turret, su100Gun, su100Hull, tigerHull, tigerTurret, type Gear } from './vehicles';
import type { VoxelModel } from './Voxel';
import { bake, frameOf, type Baked } from './Voxel';

export type VoxKind = 'tank' | 'apc' | 'pz4' | 'patria' | 'su100' | 'hilux' | 'mastiff';
export type Side = keyof typeof PALETTES;

/** each vehicle: hull and turret builders, and where the turret (or the casemate gun) pivots: forward offset, height (world px) */
const KINDS: Record<VoxKind, { hull: (g: Gear) => VoxelModel; turret: (g: Gear) => VoxelModel; x: number; z: number }> = {
  tank: { hull: tigerHull, turret: tigerTurret, x: 1, z: 9 },
  apc: { hull: armaHull, turret: armaTurret, x: -1, z: 11 },
  pz4: { hull: pz4Hull, turret: pz4Turret, x: 1, z: 8 },
  patria: { hull: patriaHull, turret: patriaTurret, x: 3, z: 11 },
  su100: { hull: su100Hull, turret: su100Gun, x: 12, z: 8 }, // the gun leaves the casemate glacis
  hilux: { hull: hiluxHull, turret: hiluxLauncher, x: -6, z: 4 },
  mastiff: { hull: mastiffHull, turret: mastiffGun, x: -2, z: 13 },
};
/** game unit spec id → voxel vehicle and colours */
export const VOXEL_OF: Record<string, [VoxKind, Side]> = { tank: ['tank', 'player'], apc: ['apc', 'player'], 'f-tank': ['tank', 'friend'], 'e-tank': ['pz4', 'enemy'], 'e-apc': ['patria', 'enemy'], 'e-td': ['su100', 'enemy'], 'e-tech': ['hilux', 'enemy'], 'a-truck': ['mastiff', 'convoy'] };

/*
 * Hull and turret are baked separately: the hull varies with add-on armour and the slat cage, the
 * turret with the anti-drone net, so a vehicle needs at most 4 + 2 bakes. The set in use is baked
 * at once; the others are baked in the background, one per idle slot, so picking up a cage mid
 * fight swaps the picture without a stall.
 */
const cache = new Map<string, Baked>();
const keyOf = (kind: VoxKind, side: Side, part: 'hull' | 'turret', g: Gear) => `${kind}|${side}|${part}|${part === 'hull' ? `${+g.plate}${+g.cageAT}` : `${+g.cageUAV}`}`;
export let lastBakeMs = 0;
function part(kind: VoxKind, side: Side, which: 'hull' | 'turret', g: Gear) {
  const key = keyOf(kind, side, which, g);
  let b = cache.get(key);
  if (!b) {
    const t0 = performance.now();
    const m = which === 'hull' ? KINDS[kind].hull(g) : KINDS[kind].turret(g);
    [b] = bake([{ m, pal: PALETTES[side] }]);
    lastBakeMs = performance.now() - t0;
    cache.set(key, b);
  }
  return b;
}
export function voxelSet(kind: VoxKind, side: Side, g: Gear) {
  const t0 = performance.now(), hull = part(kind, side, 'hull', g), turret = part(kind, side, 'turret', g);
  return { hull, turret, ms: performance.now() - t0 };
}
/**
 * Bake in the background, one part per idle slot: every add-on combination of the player's vehicle,
 * then the bare enemy and friendly vehicles. Already baked parts are skipped.
 */
const queue: [VoxKind, Side, 'hull' | 'turret', Gear][] = [];
let running = false;
const NONE: Gear = { plate: false, cageAT: false, cageUAV: false };
export function prebake(kind: VoxKind, side: Side) {
  queue.push([kind, side, 'hull', NONE], [kind, side, 'turret', NONE]);
  if (side === 'player') {
    for (const plate of [false, true]) for (const cageAT of [false, true]) queue.push([kind, side, 'hull', { plate, cageAT, cageUAV: false }]);
    queue.push([kind, side, 'turret', { ...NONE, cageUAV: true }]);
    for (const [, [k, sd]] of Object.entries(VOXEL_OF)) if (sd !== 'player') queue.push([k, sd, 'hull', NONE], [k, sd, 'turret', NONE]);
  }
  if (running) return;
  running = true;
  const step = () => {
    let next = queue.shift();
    while (next && cache.has(keyOf(next[0], next[1], next[2], next[3]))) next = queue.shift();
    if (!next) { running = false; return; }
    part(next[0], next[1], next[2], next[3]);
    setTimeout(step, 80);
  };
  setTimeout(step, 300);
}

/** a voxel vehicle on screen: hull sprite and turret sprite, frames picked by heading */
export class VoxelVehicle {
  readonly root = new Container();
  private hull = new Sprite();
  private turret = new Sprite();
  private set: { hull: Baked; turret: Baked };
  private gearKey = '';
  constructor(readonly kind: VoxKind, readonly side: Side, gear: Gear) {
    this.set = voxelSet(kind, side, gear);
    this.gearKey = `${+gear.plate}${+gear.cageAT}${+gear.cageUAV}`;
    this.root.addChild(this.hull, this.turret);
    this.scale();
  }
  private scale() { const s = 1 / this.set.hull.s; this.hull.scale.set(s); this.turret.scale.set(s); }
  setGear(g: Gear) {
    const k = `${+g.plate}${+g.cageAT}${+g.cageUAV}`;
    if (k === this.gearKey) return;
    this.gearKey = k; this.set = voxelSet(this.kind, this.side, g); this.scale();
    this.hull.texture = this.turret.texture; // force a frame refresh on the next sync
  }
  set turretVisible(v: boolean) { this.turret.visible = v; }
  /** hull and turret headings (rad), recoil 0–1; positions are relative to the unit's ground point */
  sync(hull: number, tur: number, recoil = 0) {
    // a sprite only takes a texture's anchor when it is created, so copy it on every frame change
    const th = this.set.hull.textures[frameOf(this.set.hull, hull)], tt = this.set.turret.textures[frameOf(this.set.turret, tur)];
    if (this.hull.texture !== th) { this.hull.texture = th; this.hull.anchor.copyFrom(th.defaultAnchor!); }
    if (this.turret.texture !== tt) { this.turret.texture = tt; this.turret.anchor.copyFrom(tt.defaultAnchor!); }
    const m = KINDS[this.kind], back = recoil * 1.5;
    const rx = Math.cos(hull) * m.x - Math.cos(tur) * back, ry = Math.sin(hull) * m.x - Math.sin(tur) * back;
    this.turret.position.set(rx, ry * K - m.z * ZS);
  }
}
