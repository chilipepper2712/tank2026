import { C, MAT, type EnemyType, type MaterialId, type TierId } from '../config';
import { seeded } from '../util';
import { Grid, RUBBLE } from './Grid';

/*
 * "Khu phố 7", laid out like a real district at 5 px = 1 m, tuned for tank fights:
 *   - a 4 × 4 grid of small blocks (~72 × 64 m) so streets are never far apart
 *   - 14 m streets, one 24 m avenue with a tree-lined median
 *   - built-up area kept low: shophouses line only two faces of a block, every block has a
 *     10 m drive a tank can use and a yard big enough to turn in
 *   - open blocks (square, school, ruins, construction site, bus depot) for ambushes and flanking
 *   - 4 m alleys fit the APC only; low walls, stalls, trees and parked cars get rammed
 */

export type RoadKind = 'street' | 'avenue';
export interface Road { x: number; y: number; w: number; h: number; dir: 'h' | 'v'; kind: RoadKind; sidewalk: number }
export type DecalKind = 'paving' | 'grass' | 'dirt' | 'parking' | 'yard' | 'court' | 'water' | 'garden' | 'rail';
export interface Decal { x: number; y: number; w: number; h: number; kind: DecalKind }
/** squad: index into Level.squads; members patrol together until they spot or hear the player */
export interface EnemySpawn { type: EnemyType; x: number; y: number; hull: number; squad?: number; swarm?: number; mine?: boolean }
/** a closed patrol loop along road centre lines; `wp` is the corner the squad heads for first */
export interface Squad { route: [number, number][]; wp: number }
export interface Zone { x: number; y: number; r: number }
export interface Friends { at: [number, number][]; hull: number; route: [number, number][] }
/** reinforcements entering from the map edge, `at` seconds after the hold starts */
export interface Wave { at: number; from: [number, number]; units: EnemyType[] }
export type Mission =
  | { kind: 'destroy' }
  | { kind: 'capture'; zone: Zone; time: number; label: string }
  | { kind: 'hold'; zone: Zone; time: number; waves: Wave[]; label: string }
  | { kind: 'escort'; route: [number, number][]; trucks: number; maxLost: number };
export interface Level {
  name: string;
  objective: string;
  grid: Grid;
  roads: Road[];
  decals: Decal[];
  start: { x: number; y: number; hull: number };
  stations: { x: number; y: number }[];
  enemies: EnemySpawn[];
  squads: Squad[];
  /** enemy cunning for this level, 1–3 (see Game.tactics) */
  ai: number;
  mission: Mission;
  friends?: Friends;
  /** terrain set: city streets or open desert (ground painting differs) */
  biome: 'city' | 'desert';
  /** desert only: dirt tracks (polylines), oasis ponds, sand ridges */
  tracks?: [number, number][][];
  ponds?: { x: number; y: number; r: number }[];
  dunes?: { x: number; y: number; rx: number; ry: number; a: number }[];
  /** enemy damage multiplier: difficulty rises from level 2 on */
  dmg: number;
  /** street-facing house fronts where infantry can hide (just outside the wall, on the sidewalk) */
  anchors: [number, number][];
  /** extra enemies for play-testing types this level does not introduce yet */
  testExtras: EnemySpawn[];
}

const ST = 70, AV = 120; // street and avenue widths (px)
const SW_ST = 15, SW_AV = 20; // sidewalk widths
const ALLEY = 20; // 4 m, APC only
const DRIVE = 50; // 10 m, any vehicle
const FLOOR = 16; // 3.2 m storey
const Wt = Math.PI;

export type BlockKind = 'tower' | 'shopNS' | 'shopWE' | 'square' | 'apartment' | 'market' | 'industrial' | 'school' | 'ruins' | 'villa' | 'informal' | 'construction' | 'depot'
  | 'containers' | 'dock' | 'tankfarm' | 'warehouses' | 'railyard' | 'factory';

/** road centre lines and block origins of the 4 × 4 city, for placing spawns and objectives */
export interface CityGeo { vx: number[]; hy: number[]; xs: number[]; ys: number[]; BW: number; BH: number; W: number; H: number }
export interface CitySetup {
  start: { x: number; y: number; hull: number };
  enemies: EnemySpawn[];
  squads: Squad[];
  stations: { x: number; y: number }[];
  mission: Mission;
  /** co-op: friendly AI tanks, where they start and the attack axis they push along */
  friends?: Friends;
  /** rocket teams hidden at house fronts: how many, how far from the start, optionally near a point */
  infantry?: { teams: number; near?: [number, number]; within?: number };
}
export interface CitySpec { seed: number; name: string; objective: string; ai: number; dmg?: number;
  /** harbour basin: from the quay strip of column `col` to the east edge, rows 0..lastRow (streets there are cut away) */
  harbour?: { col: number; lastRow: number }; plan: BlockKind[][]; setup: (g: CityGeo) => CitySetup }
export const HDG = { E: 0, S: Math.PI / 2, W: Math.PI, N: -Math.PI / 2 };

export function buildCity(spec: CitySpec): Level {
  const BW = 360, BH = 320;
  const plan = spec.plan;
  const rowGap = [ST, ST, AV, ST, ST]; // above row 0, between rows (avenue in the middle), below row 3
  const xs: number[] = []; let x = ST;
  for (let c = 0; c < 4; c++) { xs.push(x); x += BW + ST; }
  const W = x;
  const ys: number[] = []; let y = rowGap[0];
  for (let r = 0; r < 4; r++) { ys.push(y); y += BH + rowGap[r + 1]; }
  const H = y;
  // road centre lines, used for spawns and patrol routes
  const vx = [ST / 2, ...xs.map((bx) => bx + BW + ST / 2)];
  const hy = [rowGap[0] / 2, ...ys.map((by, r) => by + BH + rowGap[r + 1] / 2)];

  const grid = new Grid(W, H);
  const rng = seeded(spec.seed);
  const R = rng.range, chance = (p: number) => rng.next() < p, pickR = <T,>(a: T[]) => a[(rng.next() * a.length) | 0];
  const snap = (v: number) => Math.round(v / C) * C;
  const decals: Decal[] = [];
  const roads: Road[] = [];
  const anchors: [number, number][] = [];

  // ---------- helpers ----------
  const cellOK = (cx: number, cy: number) => cx >= 0 && cy >= 0 && cx < grid.GW && cy < grid.GH;
  const box = (bx: number, by: number, w: number, h: number, m: MaterialId, height: number, tier: TierId, t = (rng.next() * 4) | 0) => {
    for (let cy = Math.round(by / C); cy < Math.round((by + h) / C); cy++)
      for (let cx = Math.round(bx / C); cx < Math.round((bx + w) / C); cx++) if (cellOK(cx, cy)) grid.set(cx, cy, m, height, t, tier, R(0.85, 1.15));
  };
  const disc = (cx0: number, cy0: number, r: number, m: MaterialId, height: number, tier: TierId) => {
    const t = (rng.next() * 4) | 0;
    for (let cy = Math.floor((cy0 - r) / C); cy <= Math.floor((cy0 + r) / C); cy++)
      for (let cx = Math.floor((cx0 - r) / C); cx <= Math.floor((cx0 + r) / C); cx++)
        if (cellOK(cx, cy) && Math.hypot(cx * C + 5 - cx0, cy * C + 5 - cy0) <= r) grid.set(cx, cy, m, height, t, tier, 1);
  };
  /** pre-broken ground: rubble cells slow vehicles and give low cover */
  const rubble = (cx0: number, cy0: number, r: number, m: MaterialId) => {
    for (let cy = Math.floor((cy0 - r) / C); cy <= Math.floor((cy0 + r) / C); cy++)
      for (let cx = Math.floor((cx0 - r) / C); cx <= Math.floor((cx0 + r) / C); cx++) {
        if (!cellOK(cx, cy) || Math.hypot(cx * C + 5 - cx0, cy * C + 5 - cy0) > r * R(0.7, 1.1)) continue;
        const i = cy * grid.GW + cx;
        if (!grid.mat[i]) { grid.mat[i] = RUBBLE + m; grid.ht[i] = 4; }
      }
  };
  const free = (bx: number, by: number, w: number, h: number) => {
    for (let cy = Math.floor(by / C); cy < Math.ceil((by + h) / C); cy++)
      for (let cx = Math.floor(bx / C); cx < Math.ceil((bx + w) / C); cx++) if (!cellOK(cx, cy) || grid.mat[cy * grid.GW + cx]) return false;
    return true;
  };
  /** a tree trunk; its height sets the crown size (4–8 m across). Spots are skipped at random. */
  const tree = (tx: number, ty: number, p = 0.5) => { if (chance(p) && free(tx - 5, ty - 5, 10, 10)) box(tx - 5, ty - 5, 10, 10, MAT.tree, (R(24, 50) | 0), 1); };
  const decal = (dx: number, dy: number, w: number, h: number, kind: DecalKind) => decals.push({ x: dx, y: dy, w, h, kind });
  /** boundary wall, 2 m high so vehicles ram through it, with gate gaps */
  const fence = (fx: number, fy: number, w: number, h: number, gates: ('n' | 's' | 'w' | 'e')[], m: MaterialId = MAT.concrete) => {
    const g = 40;
    const side = (sx: number, sy: number, len: number, hor: boolean, gate: boolean) => {
      const mid = snap(len / 2);
      if (!gate) { box(sx, sy, hor ? len : 10, hor ? 10 : len, m, 10, 1); return; }
      box(sx, sy, hor ? mid - g / 2 : 10, hor ? 10 : mid - g / 2, m, 10, 1);
      box(hor ? sx + mid + g / 2 : sx, hor ? sy : sy + mid + g / 2, hor ? len - mid - g / 2 : 10, hor ? 10 : len - mid - g / 2, m, 10, 1);
    };
    side(fx, fy, w, true, gates.includes('n'));
    side(fx, fy + h - 10, w, true, gates.includes('s'));
    side(fx, fy, h, false, gates.includes('w'));
    side(fx + w - 10, fy, h, false, gates.includes('e'));
  };
  const floors = (n: number) => n * FLOOR;

  /**
   * One row of shophouses along a street face: 4–6 m lots, bigger corner houses at both ends,
   * a 4 m alley every 5–7 lots and one 10 m drive into the yard behind.
   */
  const shopRow = (len: number, place: (off: number, width: number, depth: number, height: number) => void) => {
    const drive = snap(R(len * 0.35, len * 0.6));
    let off = 0, since = 0, drove = false;
    while (off < len) {
      const left = len - off;
      if (!drove && off >= drive && left > DRIVE + 60) { off += DRIVE; drove = true; since = 0; continue; }
      if (since >= 5 && off > 60 && left > 80 && chance(0.45)) { off += ALLEY; since = 0; continue; }
      const corner = off === 0 || left <= 40;
      const w = corner ? Math.min(40, left) : left - 40 >= 30 ? pickR([20, 20, 30]) : left - 40 >= 20 ? 20 : left;
      place(off, w, corner ? 80 : pickR([70, 80, 90]), floors(corner ? pickR([5, 6]) : pickR([3, 3, 4, 5])));
      off += w; since++;
    }
  };

  // ---------- roads ----------
  roads.push({ x: 0, y: 0, w: W, h: rowGap[0], dir: 'h', kind: 'street', sidewalk: SW_ST });
  ys.forEach((by, r) => {
    const gap = rowGap[r + 1], kind: RoadKind = gap === AV ? 'avenue' : 'street';
    roads.push({ x: 0, y: by + BH, w: W, h: gap, dir: 'h', kind, sidewalk: kind === 'avenue' ? SW_AV : SW_ST });
  });
  roads.push({ x: 0, y: 0, w: ST, h: H, dir: 'v', kind: 'street', sidewalk: SW_ST });
  for (const bx of xs) roads.push({ x: bx + BW, y: 0, w: ST, h: H, dir: 'v', kind: 'street', sidewalk: SW_ST });

  // ---------- harbour: no streets across the water ----------
  const hb = spec.harbour && { x0: xs[spec.harbour.col] + 80, y1: ys[spec.harbour.lastRow] + BH };
  if (hb) {
    const cut: Road[] = [];
    for (const r of roads) {
      if (r.dir === 'h' && r.y < hb.y1) { if (hb.x0 > r.x) cut.push({ ...r, w: Math.min(r.w, hb.x0 - 10 - r.x) }); }
      else if (r.dir === 'v' && r.x >= hb.x0) { if (r.y + r.h > hb.y1) cut.push({ ...r, y: hb.y1, h: r.y + r.h - hb.y1 }); }
      else cut.push(r);
    }
    roads.length = 0; roads.push(...cut);
  }

  // ---------- blocks ----------
  let shopN = 0;
  plan.forEach((row, r) => row.forEach((kind, c) => buildBlock(kind, xs[c], ys[r], BW, BH, kind.startsWith('shop') ? shopN++ : 0)));

  function buildBlock(kind: BlockKind, bx: number, by: number, bw: number, bh: number, variant: number) {
    switch (kind) {
      case 'tower': {
        // office tower on a podium, plaza in front, staff car park behind
        decal(bx, by, bw, bh, 'paving');
        box(bx + 80, by + 30, 200, 120, MAT.concrete, floors(3), 3);
        box(bx + 130, by + 45, 100, 90, MAT.concrete, floors(9), 3);
        decal(bx + 30, by + 200, bw - 60, 100, 'parking');
        for (let k = 0; k < 6; k++) if (chance(0.6)) box(bx + 50 + k * 50, by + 220, 10, 20, MAT.car, 8, 1);
        for (let k = 0; k < 6; k++) tree(bx + 40 + k * 56, by + 175, 0.8);
        break;
      }
      case 'apartment': {
        // two 7–8 storey slabs in an L, communal yard with a playground and parking
        decal(bx, by, bw, bh, 'yard');
        box(bx + 30, by + 30, 210, 50, MAT.concrete, floors(7), 2);
        box(bx + bw - 80, by + 30, 50, 170, MAT.concrete, floors(8), 2);
        decal(bx + 40, by + 120, 140, 90, 'court');
        decal(bx + 30, by + 240, bw - 60, 60, 'parking');
        for (let k = 0; k < 6; k++) if (chance(0.5)) box(bx + 50 + k * 50, by + 260, 10, 20, MAT.car, 8, 1);
        for (let k = 0; k < 4; k++) tree(bx + 220 + R(-10, 10), by + 110 + k * 30, 0.8);
        break;
      }
      case 'square': {
        // public square: paving, four lawns with trees, fountain, monument, two kiosks
        decal(bx, by, bw, bh, 'paving');
        const lw = (bw - 120) / 2, lh = (bh - 120) / 2;
        for (const [gx, gy] of [[bx + 40, by + 40], [bx + bw - 40 - lw, by + 40], [bx + 40, by + bh - 40 - lh], [bx + bw - 40 - lw, by + bh - 40 - lh]]) {
          decal(gx, gy, lw, lh, 'grass');
          for (let k = 0; k < 3; k++) tree(gx + 25 + R(0, lw - 50), gy + 25 + R(0, lh - 50), 0.8);
        }
        decal(bx + bw / 2 - 25, by + bh / 2 - 25, 50, 50, 'water');
        disc(bx + bw / 2, by + bh / 2, 32, MAT.stone, 4, 2); // basin rim, interior cleared to water below
        for (let cy = Math.round((by + bh / 2 - 24) / C); cy < Math.round((by + bh / 2 + 24) / C); cy++)
          for (let cx = Math.round((bx + bw / 2 - 24) / C); cx < Math.round((bx + bw / 2 + 24) / C); cx++) grid.mat[cy * grid.GW + cx] = 0;
        box(bx + bw / 2 - 10, by + 50, 20, 20, MAT.stone, floors(3), 3); // monument
        box(bx + 55, by + bh / 2 - 10, 30, 20, MAT.wood, 14, 1);
        box(bx + bw - 85, by + bh / 2 - 10, 30, 20, MAT.wood, 14, 1);
        break;
      }
      case 'shopNS':
      case 'shopWE': {
        // shophouses on the two long faces only; the yard between them is open ground
        decal(bx, by, bw, bh, 'yard');
        const ns = kind === 'shopNS', len = ns ? bw : bh;
        shopRow(len, (o, w2, d, h) => {
          if (ns) box(bx + o, by, w2, d, MAT.shophouse, h, 2); else box(bx, by + o, d, w2, MAT.shophouse, h, 2);
          if (w2 < 40) anchors.push(ns ? [bx + o + w2 / 2, by - 7] : [bx - 7, by + o + w2 / 2]);
        });
        shopRow(len, (o, w2, d, h) => {
          if (ns) box(bx + o, by + bh - d, w2, d, MAT.shophouse, h, 2); else box(bx + bw - d, by + o, d, w2, MAT.shophouse, h, 2);
          if (w2 < 40) anchors.push(ns ? [bx + o + w2 / 2, by + bh + 7] : [bx + bw + 7, by + o + w2 / 2]);
        });
        // yard between the rows (~28 m): room for a tank to turn; contents vary so blocks do not repeat
        const ix = ns ? bx + 20 : bx + 100, iy = ns ? by + 100 : by + 20, iw = ns ? bw - 40 : bw - 200, ih = ns ? bh - 200 : bh - 40;
        switch (variant % 4) {
          case 0: // back yards: a couple of sheds against the houses, trees
            for (let k = 0; k < 3; k++) {
              const sx = snap(R(ix, ix + iw - 30)), sy = snap(ns ? (chance(0.5) ? iy : iy + ih - 20) : R(iy, iy + ih - 20));
              if (free(sx - 10, sy - 10, 50, 40)) box(sx, sy, 30, 20, pickR([MAT.wood, MAT.brick]), 12, 1);
            }
            for (let k = 0; k < 4; k++) tree(R(ix + 20, ix + iw - 20), R(iy + 20, iy + ih - 20));
            break;
          case 1: // small pagoda in a walled garden
            decal(ix + iw / 2 - 70, iy + ih / 2 - 50, 140, 100, 'garden');
            fence(snap(ix + iw / 2 - 70), snap(iy + ih / 2 - 50), 140, 100, ['s', 'n'], MAT.brick);
            box(snap(ix + iw / 2 - 30), snap(iy + ih / 2 - 25), 60, 40, MAT.stone, floors(2), 2);
            for (const [tx, ty] of [[ix + 30, iy + 30], [ix + iw - 30, iy + ih - 30], [ix + iw - 30, iy + 30]]) tree(tx, ty, 0.9);
            break;
          case 2: // residents' parking
            decal(ix + 10, iy + 10, iw - 20, ih - 20, 'parking');
            for (let k = 0; k < 8; k++) if (chance(0.5)) {
              const [px, py] = ns ? [ix + 30 + k * 40, iy + ih / 2 - 10] : [ix + iw / 2 - 10, iy + 30 + k * 35];
              if (free(px, py, 20, 20)) box(px, py, ns ? 10 : 20, ns ? 20 : 10, MAT.car, 8, 1);
            }
            break;
          default: // neighbourhood sports court
            decal(ix + iw / 2 - 60, iy + ih / 2 - 40, 120, 80, 'court');
            for (let k = 0; k < 3; k++) tree(R(ix + 20, ix + iw - 20), chance(0.5) ? iy + 15 : iy + ih - 15);
        }
        break;
      }
      case 'market': {
        // covered market hall with rows of stalls (stalls get rammed)
        decal(bx, by, bw, bh, 'paving');
        box(bx + 100, by + 40, 160, 110, MAT.shed, 40, 2);
        for (let sy = by + 190; sy < by + bh - 30; sy += 50)
          for (let sx = bx + 30; sx < bx + bw - 40; sx += 50)
            if (chance(0.7)) box(sx, sy, 30, 20, MAT.wood, 10, 1);
        for (const sx of [bx + 30, bx + bw - 60]) for (let sy = by + 40; sy < by + 150; sy += 50) if (chance(0.7)) box(sx, sy, 30, 20, MAT.wood, 10, 1);
        break;
      }
      case 'industrial': {
        // walled yard: one warehouse, stacked containers, a silo
        decal(bx, by, bw, bh, 'yard');
        fence(bx, by, bw, bh, ['n', 'w', 's'], MAT.concrete);
        box(bx + 40, by + 40, 180, 110, MAT.shed, 44, 2);
        for (let row = 0; row < 3; row++) for (let k = 0; k < 2; k++)
          if (chance(0.8)) box(bx + 50 + k * 130, by + 200 + row * 30, 60, 10, MAT.steel, chance(0.5) ? 26 : 13, 2);
        disc(bx + bw - 70, by + bh - 80, 24, MAT.stone, 60, 3);
        break;
      }
      case 'school': {
        // U-shaped school around the schoolyard, sports court, perimeter wall
        decal(bx, by, bw, bh, 'yard');
        fence(bx, by, bw, bh, ['s', 'e']);
        box(bx + 30, by + 30, bw - 60, 50, MAT.shophouse, floors(3), 2, 0);
        box(bx + 30, by + 80, 50, 110, MAT.shophouse, floors(3), 2, 0);
        box(bx + bw - 80, by + 80, 50, 110, MAT.shophouse, floors(3), 2, 0);
        decal(bx + 110, by + 110, bw - 220, 100, 'court');
        for (let k = 0; k < 5; k++) tree(bx + 50 + k * 65, by + bh - 50, 0.8);
        break;
      }
      case 'ruins': {
        // a bombed-out block: wall fragments, rubble fields, burnt cars
        decal(bx, by, bw, bh, 'dirt');
        for (let k = 0; k < 4; k++) {
          const fx = snap(R(bx + 20, bx + bw - 100)), fy = snap(R(by + 20, by + bh - 100)), m = pickR([MAT.brick, MAT.concrete, MAT.shophouse]);
          const fw = snap(R(50, 90)), fh = snap(R(50, 80)), h = floors(pickR([1, 2, 2, 3]));
          box(fx, fy, fw, 10, m, h, 1); // L-shaped remains of two walls
          box(fx, fy, 10, fh, m, h, 1);
          if (chance(0.5)) box(fx + fw - 10, fy, 10, snap(fh / 2), m, Math.max(FLOOR, h - FLOOR), 1);
          rubble(fx + fw / 2, fy + fh / 2, 30, m);
        }
        for (let k = 0; k < 5; k++) rubble(R(bx + 20, bx + bw - 20), R(by + 20, by + bh - 20), R(12, 24), pickR([MAT.brick, MAT.concrete]));
        for (let k = 0; k < 2; k++) { const cx0 = snap(R(bx + 30, bx + bw - 40)), cy0 = snap(R(by + 30, by + bh - 40)); if (free(cx0, cy0, 20, 10)) box(cx0, cy0, 20, 10, MAT.car, 8, 1, 3); }
        break;
      }
      case 'villa': {
        // 3 × 2 villa plots: house near the street, garden behind, wall with a gate
        const lots = 3, lw = bw / lots, lh = bh / 2;
        for (let k = 0; k < lots; k++) for (const top of [true, false]) {
          const lx = bx + k * lw, ly = top ? by : by + lh;
          decal(lx, ly, lw, lh, 'garden');
          fence(snap(lx), ly, snap(lw), lh, [top ? 'n' : 's'], MAT.brick);
          const hw = snap(R(50, 60)), hd = snap(R(40, 50)), hx = snap(lx + (lw - hw) / 2), hy0 = top ? ly + 30 : ly + lh - 30 - hd;
          const m = chance(0.5) ? MAT.shophouse : MAT.brick, ht = floors(pickR([2, 2, 3]));
          box(hx, hy0, hw, hd, m, ht, 2);
          if (chance(0.4)) decal(lx + 20, top ? ly + lh - 60 : ly + 25, 30, 35, 'water'); // pool
          tree(lx + R(25, lw - 25), top ? ly + R(lh - 60, lh - 25) : ly + R(25, 60), 0.9);
        }
        break;
      }
      case 'informal': {
        // dense one- and two-storey houses on 4 m alleys, cut by one 10 m lane each way
        decal(bx, by, bw, bh, 'dirt');
        const laneX = snap(bx + R(bw * 0.4, bw * 0.6)), laneY = snap(by + R(bh * 0.4, bh * 0.6));
        let hy0 = by;
        while (hy0 < by + bh) {
          if (hy0 + 30 > laneY && hy0 < laneY + DRIVE) { hy0 = laneY + DRIVE; continue; }
          if (hy0 > by && chance(0.25)) { hy0 += ALLEY; continue; } // an east–west alley
          const rh = Math.min(30, by + bh - hy0);
          for (let hx = bx; hx < bx + bw; hx += 20) {
            if (hx + 20 > laneX && hx < laneX + DRIVE) continue;
            if (chance(0.72)) box(hx, hy0, 20, rh, pickR([MAT.wood, MAT.wood, MAT.brick, MAT.shophouse]), floors(pickR([1, 1, 2])), 1);
          }
          hy0 += 30;
        }
        break;
      }
      case 'construction': {
        // half-built frame: a grid of columns to weave through, a finished core, material piles
        decal(bx, by, bw, bh, 'dirt');
        fence(bx, by, bw, bh, ['n', 'e', 'w'], MAT.steel);
        const fx = bx + 60, fy = by + 60;
        for (let k = 0; k < 4; k++) for (let j = 0; j < 3; j++) box(fx + k * 60, fy + j * 60, 10, 10, MAT.concrete, floors(pickR([1, 2, 3])), 2, 0);
        box(fx + 60, fy + 60, 40, 40, MAT.concrete, floors(4), 2, 0);
        box(bx + bw - 90, by + bh - 60, 60, 20, MAT.steel, 13, 2); // site office container
        for (let k = 0; k < 4; k++) { const sx = snap(R(bx + 30, bx + bw - 60)), sy = snap(R(by + 220, by + bh - 40)); if (free(sx, sy, 30, 20)) box(sx, sy, 30, 20, pickR([MAT.stone, MAT.steel]), 6, 1); }
        break;
      }
      case 'containers': {
        // container stacks (12 × 2.4 m boxes, 1–3 high) in three columns with 12 m lanes, 4 m gaps between rows
        decal(bx, by, bw, bh, 'yard');
        for (const cx0 of [30, 150, 270]) {
          let yy = by + 25;
          for (let row = 0; yy < by + bh - 40; row++) {
            if (chance(0.82)) box(bx + cx0, yy, 60, 20, MAT.steel, pickR([13, 26, 26, 39]), 2);
            yy += row % 3 === 2 ? 70 : 40;
          }
        }
        break;
      }
      case 'dock': {
        // quay strip along the harbour basin (the water itself is built once for the whole harbour)
        decal(bx, by, 70, bh, 'yard');
        for (let yy = by + 40; yy < by + bh - 30; yy += 70) box(bx + 20, yy, 30, 20, MAT.steel, 14, 1, (rng.next() * 4) | 0); // trailers
        break;
      }
      case 'factory': {
        // works: big production hall, office annex, chimney, staff car park
        decal(bx, by, bw, bh, 'yard');
        box(bx + 30, by + 30, 230, 170, MAT.shed, 48, 2);
        box(bx + 270, by + 30, 60, 90, MAT.concrete, floors(3), 2, 1);
        disc(bx + 300, by + 160, 14, MAT.brick, 110, 3);
        decal(bx + 30, by + 230, bw - 60, 60, 'parking');
        for (let k = 0; k < 6; k++) if (chance(0.5)) box(bx + 50 + k * 50, by + 250, 10, 20, MAT.car, 8, 1);
        for (let x0 = bx + 40; x0 < bx + 260; x0 += 50) anchors.push([x0, by - 7]);
        break;
      }
      case 'tankfarm': {
        // fuel depot: four storage tanks inside a wall, pipe racks between them
        decal(bx, by, bw, bh, 'yard');
        fence(bx, by, bw, bh, ['w', 'n']);
        for (const [tx, ty] of [[bx + 95, by + 90], [bx + 265, by + 90], [bx + 95, by + 230], [bx + 265, by + 230]]) disc(tx, ty, 50, MAT.stone, 40, 2);
        box(bx + 150, by + 155, 60, 10, MAT.steel, 8, 1);
        break;
      }
      case 'warehouses': {
        // two long warehouses facing a loading apron, lorries at the doors
        decal(bx, by, bw, bh, 'yard');
        box(bx + 30, by + 30, bw - 60, 80, MAT.shed, 40, 2);
        box(bx + 30, by + bh - 110, bw - 60, 80, MAT.shed, 36, 2);
        for (let k = 0; k < 5; k++) if (chance(0.6)) box(bx + 50 + k * 60, by + 130, 20, 40, MAT.steel, 14, 1, k % 4);
        for (let x0 = bx + 40; x0 < bx + bw - 40; x0 += 60) { anchors.push([x0, by - 7]); anchors.push([x0, by + bh + 7]); }
        break;
      }
      case 'railyard': {
        // goods yard: four tracks with wagons, a signal box
        decal(bx, by, bw, bh, 'yard');
        for (let k = 0; k < 4; k++) {
          const ty = by + 50 + k * 65;
          decal(bx, ty - 6, bw, 12, 'rail');
          for (let wx = bx + 10; wx < bx + bw - 60; wx += 70) if (chance(0.55)) box(wx, ty - 7, 60, 14, MAT.steel, 16, 2, (rng.next() * 4) | 0);
        }
        box(bx + bw - 50, by + 10, 30, 30, MAT.brick, floors(2), 2);
        break;
      }
      case 'depot': {
        // bus depot: parked buses in bays, a shelter, open tarmac
        decal(bx, by, bw, bh, 'parking');
        for (let k = 0; k < 5; k++) if (chance(0.7)) box(bx + 40 + k * 60, by + 40, 20, 60, MAT.steel, 14, 1, k % 4);
        box(bx + 40, by + bh - 70, 140, 30, MAT.wood, 18, 1);
        for (let k = 0; k < 3; k++) if (chance(0.6)) box(bx + 230 + k * 30, by + bh - 100, 10, 20, MAT.car, 8, 1);
        tree(bx + bw - 40, by + bh - 40, 0.9); tree(bx + 200, by + bh - 30, 0.9);
        break;
      }
    }
  }

  if (hb) {
    // one basin out to the sea edge, walled by the quay; freighters moored along the quay, one at anchor
    decal(hb.x0, 0, W - hb.x0, hb.y1 - 10, 'water');
    box(hb.x0 - 10, 0, 10, hb.y1, MAT.stone, 4, 3);
    box(hb.x0 - 10, hb.y1 - 10, W - hb.x0 + 10, 10, MAT.stone, 4, 3);
    const ship = (sx: number, sy: number, sw: number, sl: number) => {
      box(sx, sy, sw, sl, MAT.steel, 22, 3, (rng.next() * 4) | 0); // hull
      box(sx + 10, sy + sl - 70, sw - 20, 50, MAT.concrete, 46, 3, 0); // bridge
      for (let k = 0; k < Math.floor((sl - 90) / 50); k++) if (chance(0.8)) box(sx + 10, sy + 20 + k * 50, sw - 20, 30, MAT.steel, 30, 3, k % 4); // deck cargo
    };
    ship(hb.x0 + 30, 60, 90, snap(R(380, 460)));
    ship(hb.x0 + 30, 640, 80, snap(R(320, 400)));
    ship(snap(hb.x0 + 190), snap(R(250, 420)), 70, 300);
    for (const [px, py] of [[W - 70, 80], [W - 80, hb.y1 - 160]]) { box(px, py, 40, 110, MAT.steel, 14, 3, 2); box(px + 10, py + 60, 20, 30, MAT.concrete, 28, 3, 0); } // tugs
  }

  // ---------- level-specific spawns and objective ----------
  const setup = spec.setup({ vx, hy, xs, ys, BW, BH, W, H });
  const { start, enemies, squads, stations, mission } = setup;
  const keep: [number, number][] = [...(mission.kind === 'escort' ? mission.route : mission.kind === 'destroy' ? [] : [[mission.zone.x, mission.zone.y] as [number, number]]), ...(setup.friends?.at ?? [])];
  const spawnPts: [number, number][] = [[start.x, start.y], ...enemies.map((e) => [e.x, e.y] as [number, number]), ...stations.map((s) => [s.x, s.y] as [number, number]), ...keep];

  // ---------- street furniture: trees on the sidewalks, cars in the kerb lane ----------
  const inJunction = (r: Road, along: number) => roads.some((o) => o.dir !== r.dir && along > (r.dir === 'h' ? o.x : o.y) - 30 && along < (r.dir === 'h' ? o.x + o.w : o.y + o.h) + 30);
  const nearSpawn = (px: number, py: number) => spawnPts.some(([sx, sy]) => Math.hypot(sx - px, sy - py) < 70);
  for (const r of roads) {
    const len = r.dir === 'h' ? r.w : r.h, sw = r.sidewalk;
    const cross = r.dir === 'h' ? r.y : r.x, size = r.dir === 'h' ? r.h : r.w;
    const at = (along: number, acrossOff: number) => (r.dir === 'h' ? [along, cross + acrossOff] : [cross + acrossOff, along]) as [number, number];
    for (let a = 25; a < len; a += R(50, 70)) {
      if (inJunction(r, a)) continue;
      for (const off of [sw / 2, size - sw / 2]) { const [tx, ty] = at(a + R(-5, 5), off); if (!nearSpawn(tx, ty)) tree(tx, ty, 0.35); }
      if (r.kind === 'avenue') { const [tx, ty] = at(a, size / 2); if (!nearSpawn(tx, ty)) tree(tx, ty, 0.45); }
    }
    for (let a = 40; a < len - 40; a += 40) {
      if (inJunction(r, a) || !chance(0.25)) continue;
      const off = chance(0.5) ? sw + 5 : size - sw - 5, [cx0, cy0] = at(a, off);
      if (nearSpawn(cx0, cy0)) continue;
      const [cw, chh] = r.dir === 'h' ? [20, 10] : [10, 20];
      if (free(cx0 - cw / 2, cy0 - chh / 2, cw, chh)) box(cx0 - cw / 2, cy0 - chh / 2, cw, chh, MAT.car, 8, 1);
    }
  }

  // rocket teams at house fronts (two men each), far from the start
  const usable = anchors.filter(([ax, ay]) => free(ax - 5, ay - 5, 10, 10) && Math.hypot(ax - start.x, ay - start.y) > 450);
  const placeTeams = (n: number, near?: [number, number], within = 1e9) => {
    const pool = usable.filter(([ax, ay]) => !near || Math.hypot(ax - near[0], ay - near[1]) < within);
    const teams: [number, number][] = [];
    for (const a of [...pool].sort(() => rng.next() - 0.5)) if (teams.length < n && teams.every(([tx, ty]) => Math.hypot(tx - a[0], ty - a[1]) > 220)) teams.push(a);
    const out: EnemySpawn[] = [];
    for (const [ax, ay] of teams) {
      out.push({ type: 'infantry', x: ax, y: ay, hull: 0 });
      const mate = usable.find(([bx2, by2]) => { const dd = Math.hypot(bx2 - ax, by2 - ay); return dd > 15 && dd < 45; });
      if (mate) out.push({ type: 'infantry', x: mate[0], y: mate[1], hull: 0 });
    }
    return out;
  };
  if (setup.infantry) enemies.push(...placeTeams(setup.infantry.teams, setup.infantry.near, setup.infantry.within));
  // play-test extras (pause menu toggle): more rocket teams and two kamikaze swarms
  const testExtras: EnemySpawn[] = placeTeams(4);
  [[vx[3], hy[1] + 60, 3], [vx[2] + 40, hy[0] + 40, 2]].forEach(([sx, sy, n], k) => {
    for (let j = 0; j < n; j++) testExtras.push({ type: 'kamikaze', x: sx + j * 26, y: sy + (j % 2) * 20, hull: Wt, swarm: k + 10 });
  });

  return {
    name: spec.name, objective: spec.objective,
    grid, roads, decals, start, stations, enemies, squads, ai: spec.ai, dmg: spec.dmg ?? 1, anchors, testExtras, mission, friends: setup.friends, biome: 'city',
  };
}
