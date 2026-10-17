import { C, MAT, type EnemyType, type MaterialId, type TierId } from '../config';
import { seeded } from '../util';
import { Grid } from './Grid';

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
export type DecalKind = 'paving' | 'grass' | 'dirt' | 'parking' | 'yard' | 'court' | 'water' | 'garden';
export interface Decal { x: number; y: number; w: number; h: number; kind: DecalKind }
/** squad: index into Level.squads; members patrol together until they spot or hear the player */
export interface EnemySpawn { type: EnemyType; x: number; y: number; hull: number; squad?: number }
/** a closed patrol loop along road centre lines; `wp` is the corner the squad heads for first */
export interface Squad { route: [number, number][]; wp: number }
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
}

const ST = 70, AV = 120; // street and avenue widths (px)
const SW_ST = 15, SW_AV = 20; // sidewalk widths
const ALLEY = 20; // 4 m, APC only
const DRIVE = 50; // 10 m, any vehicle
const FLOOR = 16; // 3.2 m storey
const S = Math.PI / 2, Wt = Math.PI, N = -Math.PI / 2;

type BlockKind = 'tower' | 'shopNS' | 'shopWE' | 'square' | 'apartment' | 'market' | 'industrial' | 'school' | 'ruins' | 'villa' | 'informal' | 'construction' | 'depot';

export function buildLevel1(): Level {
  const BW = 360, BH = 320;
  const plan: BlockKind[][] = [
    ['tower', 'shopNS', 'square', 'apartment'],
    ['shopWE', 'market', 'shopNS', 'industrial'],
    ['school', 'ruins', 'shopWE', 'villa'],
    ['informal', 'construction', 'depot', 'shopNS'],
  ];
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
  const rng = seeded(2026);
  const R = rng.range, chance = (p: number) => rng.next() < p, pickR = <T,>(a: T[]) => a[(rng.next() * a.length) | 0];
  const snap = (v: number) => Math.round(v / C) * C;
  const decals: Decal[] = [];
  const roads: Road[] = [];

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
        if (!grid.mat[i]) { grid.mat[i] = 10 + m; grid.ht[i] = 4; }
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
        shopRow(len, (o, w2, d, h) => ns ? box(bx + o, by, w2, d, MAT.shophouse, h, 2) : box(bx, by + o, d, w2, MAT.shophouse, h, 2));
        shopRow(len, (o, w2, d, h) => ns ? box(bx + o, by + bh - d, w2, d, MAT.shophouse, h, 2) : box(bx + bw - d, by + o, d, w2, MAT.shophouse, h, 2));
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

  // ---------- spawns: three patrolling squads, two dug-in tank destroyers, drones ----------
  const start = { x: vx[0], y: hy[4] - 150, hull: N };
  const loop = (c0: number, r0: number, c1: number, r1: number): [number, number][] => [[vx[c0], hy[r0]], [vx[c1], hy[r0]], [vx[c1], hy[r1]], [vx[c0], hy[r1]]];
  const squads: Squad[] = [
    { route: loop(1, 0, 3, 1), wp: 1 }, // north blocks
    { route: loop(2, 1, 4, 3), wp: 2 }, // east side, crosses the avenue
    { route: loop(2, 3, 3, 4), wp: 3 }, // south-east block
  ];
  // the first listed member of a squad leads; the rest follow in file
  const enemies: EnemySpawn[] = [
    { type: 'tank', x: vx[2] - 40, y: hy[0], hull: 0, squad: 0 },
    { type: 'apc', x: vx[2] - 90, y: hy[0], hull: 0, squad: 0 },
    { type: 'tank', x: vx[4], y: hy[2] - 20, hull: S, squad: 1 },
    { type: 'tank', x: vx[4], y: hy[2] - 70, hull: S, squad: 1 },
    { type: 'apc', x: vx[4], y: hy[2] - 120, hull: S, squad: 1 },
    { type: 'apc', x: vx[3] - 60, y: hy[4], hull: Wt, squad: 2 },
    { type: 'tank', x: vx[3] - 10, y: hy[4], hull: Wt, squad: 2 },
    { type: 'td', x: vx[3], y: hy[1] + 120, hull: Wt },
    { type: 'td', x: vx[2], y: hy[3] - 140, hull: Wt },
    { type: 'drone', x: vx[3] + 150, y: hy[0] + 150, hull: Wt },
    { type: 'drone', x: vx[2] + 100, y: hy[2] + 150, hull: Wt },
    { type: 'drone', x: vx[1] + 150, y: hy[1] + 100, hull: Wt },
  ];
  const stations = [{ x: vx[1], y: hy[3] }, { x: vx[3], y: hy[0] }];
  const spawnPts: [number, number][] = [[start.x, start.y], ...enemies.map((e) => [e.x, e.y] as [number, number]), ...stations.map((s) => [s.x, s.y] as [number, number])];

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

  return {
    name: 'Khu phố 7',
    objective: 'Tiêu diệt toàn bộ địch',
    grid, roads, decals, start, stations, enemies, squads, ai: 1,
  };
}
