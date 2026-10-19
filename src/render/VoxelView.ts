import { Container, Sprite } from 'pixi.js';
import { K, ZS } from '../config';
import { armaHull, armaTurret, PALETTES, tigerHull, tigerTurret, type Gear } from './vehicles';
import { bake, frameOf, type Baked } from './Voxel';

export type VoxKind = 'tank' | 'apc';
export type Side = keyof typeof PALETTES;

/** where the turret ring sits on the hull: forward offset and height (world px) */
const MOUNT: Record<VoxKind, { x: number; z: number }> = { tank: { x: 1, z: 9 }, apc: { x: -1, z: 11 } };

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
    const m = which === 'hull' ? (kind === 'tank' ? tigerHull(g) : armaHull(g)) : kind === 'tank' ? tigerTurret(g) : armaTurret(g);
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
/** bake every add-on combination of a vehicle in the background */
export function prebake(kind: VoxKind, side: Side) {
  const todo: [('hull' | 'turret'), Gear][] = [];
  for (const plate of [false, true]) for (const cageAT of [false, true]) todo.push(['hull', { plate, cageAT, cageUAV: false }]);
  todo.push(['turret', { plate: false, cageAT: false, cageUAV: true }], ['turret', { plate: false, cageAT: false, cageUAV: false }]);
  const step = () => {
    const next = todo.find(([w, g]) => !cache.has(keyOf(kind, side, w, g)));
    if (!next) return;
    part(kind, side, next[0], next[1]);
    setTimeout(step, 120);
  };
  setTimeout(step, 400);
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
    const m = MOUNT[this.kind], back = recoil * 1.5;
    const rx = Math.cos(hull) * m.x - Math.cos(tur) * back, ry = Math.sin(hull) * m.x - Math.sin(tur) * back;
    this.turret.position.set(rx, ry * K - m.z * ZS);
  }
}
