import { C, MAT, type EnemyType, type MaterialId, type TierId } from '../config';
import { seeded } from '../util';
import { Grid } from './Grid';

/*
 * "Khu phố 7", laid out like a real district at 5 px = 1 m:
 *   - streets 14 m (two lanes + 3 m sidewalks), one 24 m avenue with a tree-lined median
 *   - blocks ~110 × 95 m, each with its own planning rules: office towers on podiums,
 *     shophouses (4–6 m frontage, 16–20 m deep) with service alleys, villas in fenced gardens,
 *     an informal neighbourhood of 4 m alleys, a market, a school, an industrial yard, a square
 *   - 4 m alleys fit the APC but not the tank
 */

export type RoadKind = 'street' | 'avenue';
export interface Road { x: number; y: number; w: number; h: number; dir: 'h' | 'v'; kind: RoadKind; sidewalk: number }
export type DecalKind = 'paving' | 'grass' | 'dirt' | 'parking' | 'yard' | 'court' | 'water' | 'garden';
export interface Decal { x: number; y: number; w: number; h: number; kind: DecalKind }
export interface EnemySpawn { type: EnemyType; x: number; y: number; hull: number }
export interface Level {
  name: string;
  objective: string;
  grid: Grid;
  roads: Road[];
  decals: Decal[];
  start: { x: number; y: number; hull: number };
  stations: { x: number; y: number }[];
  enemies: EnemySpawn[];
}

const ST = 70, AV = 120; // street and avenue widths (px)
const SW_ST = 15, SW_AV = 20; // sidewalk widths
const ALLEY = 20; // 4 m
const FLOOR = 16; // 3.2 m storey
const S = Math.PI / 2, Wt = Math.PI, N = -Math.PI / 2;

type BlockKind = 'cbd' | 'twin' | 'office' | 'square' | 'shop' | 'market' | 'villa' | 'informal' | 'industrial' | 'school';

export function buildLevel1(): Level {
  // vertical streets at fixed x, rows separated by streets and the avenue
  const colW = [560, 560, 560, 560], rowH = [480, 480, 480];
  const rowGap = [ST, AV, ST, ST]; // above row0, between row0/1 (avenue), between row1/2, below row2
  const xs: number[] = []; let x = ST;
  for (const w of colW) { xs.push(x); x += w + ST; }
  const W = x;
  const ys: number[] = []; let y = rowGap[0];
  rowH.forEach((h, r) => { ys.push(y); y += h + rowGap[r + 1]; });
  const H = y;

  const grid = new Grid(W, H);
  const rng = seeded(2026);
  const R = rng.range, chance = (p: number) => rng.next() < p, pickR = <T,>(a: T[]) => a[(rng.next() * a.length) | 0];
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
  const free = (bx: number, by: number, w: number, h: number) => {
    for (let cy = Math.floor(by / C); cy < Math.ceil((by + h) / C); cy++)
      for (let cx = Math.floor(bx / C); cx < Math.ceil((bx + w) / C); cx++) if (!cellOK(cx, cy) || grid.mat[cy * grid.GW + cx]) return false;
    return true;
  };
  const tree = (tx: number, ty: number) => { if (free(tx - 5, ty - 5, 10, 10)) box(tx - 5, ty - 5, 10, 10, MAT.tree, (R(30, 42) | 0), 1); };
  const decal = (dx: number, dy: number, w: number, h: number, kind: DecalKind) => decals.push({ x: dx, y: dy, w, h, kind });
  /** low boundary wall with gate gaps (2 m thick, 2 m high) */
  const fence = (fx: number, fy: number, w: number, h: number, gates: ('n' | 's' | 'w' | 'e')[], m: MaterialId = MAT.concrete) => {
    const g = 40;
    const side = (sx: number, sy: number, len: number, hor: boolean, gate: boolean) => {
      const mid = len / 2;
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

  // ---------- roads ----------
  roads.push({ x: 0, y: 0, w: W, h: ST, dir: 'h', kind: 'street', sidewalk: SW_ST });
  rowH.forEach((h, r) => {
    const gy = ys[r] + h, gap = rowGap[r + 1], kind: RoadKind = gap === AV ? 'avenue' : 'street';
    roads.push({ x: 0, y: gy, w: W, h: gap, dir: 'h', kind, sidewalk: kind === 'avenue' ? SW_AV : SW_ST });
  });
  for (let c = 0; c <= colW.length; c++) {
    const vx = c === 0 ? 0 : xs[c - 1] + colW[c - 1];
    roads.push({ x: vx, y: 0, w: ST, h: H, dir: 'v', kind: 'street', sidewalk: SW_ST });
  }

  // ---------- blocks ----------
  const plan: BlockKind[][] = [
    ['cbd', 'twin', 'square', 'office'],
    ['shop', 'shop', 'market', 'shop'],
    ['villa', 'informal', 'industrial', 'school'],
  ];
  let shopN = 0;
  plan.forEach((row, r) => row.forEach((kind, c) => buildBlock(kind, xs[c], ys[r], colW[c], rowH[r], kind === 'shop' ? shopN++ : 0)));

  function buildBlock(kind: BlockKind, bx: number, by: number, bw: number, bh: number, variant: number) {
    switch (kind) {
      case 'cbd': {
        // one tower on a podium, plaza in front, staff car park behind
        decal(bx, by, bw, bh, 'paving');
        box(bx + 30, by + 30, bw - 60, 200, MAT.concrete, floors(3), 3);
        box(bx + 150, by + 50, 160, 140, MAT.concrete, floors(9), 3);
        decal(bx + 30, by + 270, bw - 60, 180, 'parking');
        for (let k = 0; k < 9; k++) if (chance(0.7)) box(bx + 60 + k * 50, by + 300, 10, 20, MAT.car, 8, 1);
        for (let k = 0; k < 9; k++) if (chance(0.6)) box(bx + 60 + k * 50, by + 400, 10, 20, MAT.car, 8, 1);
        for (let k = 0; k < 6; k++) tree(bx + 40 + k * 95, by + 250);
        break;
      }
      case 'twin': {
        // two slender towers on a shared podium around a garden court
        decal(bx, by, bw, bh, 'paving');
        box(bx + 20, by + 40, bw - 40, 150, MAT.concrete, floors(3), 3);
        box(bx + 60, by + 60, 120, 110, MAT.concrete, floors(8), 3);
        box(bx + bw - 180, by + 60, 120, 110, MAT.concrete, floors(7), 3);
        box(bx + 20, by + bh - 190, 220, 150, MAT.concrete, floors(4), 3); // L-shaped annex
        box(bx + 20, by + bh - 300, 90, 120, MAT.concrete, floors(4), 3);
        decal(bx + 260, by + bh - 200, bw - 290, 170, 'garden');
        for (let k = 0; k < 7; k++) tree(bx + 290 + (k % 4) * 60, by + bh - 170 + Math.floor(k / 4) * 80);
        break;
      }
      case 'office': {
        // U-shaped office block around a forecourt, surface car park
        decal(bx, by, bw, bh, 'paving');
        box(bx + 30, by + 30, 300, 60, MAT.concrete, floors(5), 3);
        box(bx + 30, by + 90, 60, 200, MAT.concrete, floors(5), 3);
        box(bx + 270, by + 90, 60, 200, MAT.concrete, floors(5), 3);
        decal(bx + 360, by + 30, bw - 390, bh - 60, 'parking');
        for (let row = 0; row < 4; row++) for (let k = 0; k < 4; k++) if (chance(0.6)) box(bx + 380 + k * 40, by + 60 + row * 100, 10, 20, MAT.car, 8, 1);
        for (let k = 0; k < 4; k++) tree(bx + 120 + k * 45, by + 200);
        break;
      }
      case 'square': {
        // public square: paving, four lawns with trees, fountain, monument, two kiosks
        decal(bx, by, bw, bh, 'paving');
        const lw = (bw - 140) / 2, lh = (bh - 140) / 2;
        for (const [gx, gy] of [[bx + 50, by + 50], [bx + bw - 50 - lw, by + 50], [bx + 50, by + bh - 50 - lh], [bx + bw - 50 - lw, by + bh - 50 - lh]]) {
          decal(gx, gy, lw, lh, 'grass');
          for (let k = 0; k < 4; k++) tree(gx + 30 + R(0, lw - 60), gy + 30 + R(0, lh - 60));
        }
        decal(bx + bw / 2 - 30, by + bh / 2 - 30, 60, 60, 'water');
        disc(bx + bw / 2, by + bh / 2, 38, MAT.stone, 4, 2); // basin rim, interior cleared to water below
        for (let cy = Math.round((by + bh / 2 - 28) / C); cy < Math.round((by + bh / 2 + 28) / C); cy++)
          for (let cx = Math.round((bx + bw / 2 - 28) / C); cx < Math.round((bx + bw / 2 + 28) / C); cx++) grid.mat[cy * grid.GW + cx] = 0;
        box(bx + bw / 2 - 10, by + 60, 20, 20, MAT.stone, floors(3), 3); // monument
        box(bx + 70, by + bh / 2 - 15, 30, 20, MAT.wood, 14, 1);
        box(bx + bw - 100, by + bh / 2 - 15, 30, 20, MAT.wood, 14, 1);
        break;
      }
      case 'shop': {
        // shophouses: narrow deep lots facing every street, alleys every few lots, back yards inside
        decal(bx, by, bw, bh, 'yard');
        const depthA = 90, cornerS = 100;
        const run = (len: number, place: (off: number, width: number, depth: number) => void) => {
          let off = cornerS, sinceAlley = 0;
          while (off < len - cornerS - 20) {
            if (sinceAlley >= 5 && chance(0.4)) { off += ALLEY; sinceAlley = 0; continue; } // service alley
            const width = pickR([20, 20, 30]);
            if (off + width > len - cornerS) break;
            place(off, width, depthA + pickR([-10, 0, 10]));
            off += width; sinceAlley++;
          }
        };
        const lot = (lx: number, ly: number, lw: number, lh: number) => box(lx, ly, lw, lh, MAT.shophouse, floors(pickR([3, 3, 4, 5])), 2);
        run(bw, (o, w2, d) => { lot(bx + o, by, w2, d); lot(bx + o, by + bh - d, w2, d); });
        run(bh, (o, w2, d) => { lot(bx, by + o, d, w2); lot(bx + bw - d, by + o, d, w2); });
        // corner buildings are bigger and taller
        for (const [cx0, cy0] of [[bx, by], [bx + bw - cornerS, by], [bx, by + bh - cornerS], [bx + bw - cornerS, by + bh - cornerS]])
          box(cx0, cy0, cornerS, cornerS, MAT.shophouse, floors(pickR([5, 6])), 2);
        // block interiors differ so the three shophouse blocks do not repeat
        const ix = bx + 120, iy = by + 120, iw = bw - 240, ih = bh - 240;
        if (variant === 0) {
          // back yards with sheds, and a through-alley (hẻm xuyên) cut north–south
          const ax = bx + Math.round(bw / 2 / C) * C;
          for (let cy = Math.round(by / C); cy < Math.round((by + bh) / C); cy++) for (let cx = ax / C; cx < ax / C + 2; cx++) grid.mat[cy * grid.GW + cx] = 0;
          for (let k = 0; k < 6; k++) { const sx = R(ix, ix + iw - 30), sy = R(iy, iy + ih - 30); if (free(sx - 10, sy - 10, 50, 40) && Math.abs(sx + 15 - ax) > 40) box(sx, sy, 30, 20, pickR([MAT.wood, MAT.brick]), 12, 1); }
          for (let k = 0; k < 4; k++) tree(R(ix, ix + iw), R(iy, iy + ih));
        } else if (variant === 1) {
          // a 7-storey apartment slab fills the inside, with a car park ramp gap
          box(ix + 20, iy + 30, iw - 40, 70, MAT.concrete, floors(7), 2);
          decal(ix + 20, iy + 130, iw - 40, ih - 140, 'parking');
          for (let k = 0; k < 5; k++) if (chance(0.6)) box(ix + 40 + k * 50, iy + 150, 10, 20, MAT.car, 8, 1);
        } else {
          // a pagoda in a walled garden: courtyard, stone hall, big old trees
          decal(ix, iy, iw, ih, 'garden');
          fence(ix, iy, iw, ih, ['s'], MAT.brick);
          box(ix + iw / 2 - 50, iy + 40, 100, 60, MAT.stone, floors(2), 2);
          box(ix + iw / 2 - 15, iy + 20, 30, 20, MAT.stone, floors(3), 2);
          for (const [tx, ty] of [[ix + 30, iy + 30], [ix + iw - 30, iy + 30], [ix + 40, iy + ih - 50], [ix + iw - 40, iy + ih - 50], [ix + iw / 2 - 60, iy + ih - 40]]) tree(tx, ty);
        }
        break;
      }
      case 'market': {
        // covered market hall with rows of stalls around it
        decal(bx, by, bw, bh, 'paving');
        box(bx + 140, by + 120, 280, 220, MAT.shed, 40, 2);
        for (let sy = by + 30; sy < by + bh - 40; sy += 50)
          for (let sx = bx + 30; sx < bx + bw - 40; sx += 40) {
            if (sx > bx + 110 && sx < bx + 430 && sy > by + 90 && sy < by + 350) continue;
            if (chance(0.75)) box(sx, sy, 30, 20, MAT.wood, 10, 1, (rng.next() * 4) | 0);
          }
        break;
      }
      case 'villa': {
        // two rows of villa plots facing the streets: house near the front, garden behind, fence and gate
        const lots = 5, lw = bw / lots, lh = bh / 2;
        for (let k = 0; k < lots; k++) for (const top of [true, false]) {
          const lx = bx + k * lw, ly = top ? by : by + lh;
          decal(lx, ly, lw, lh, 'garden');
          fence(lx, ly, lw, lh, [top ? 'n' : 's'], MAT.brick);
          const hw = R(50, 70), hd = R(50, 60), hx = lx + (lw - hw) / 2, hy = top ? ly + 40 : ly + lh - 40 - hd;
          const m = chance(0.5) ? MAT.shophouse : MAT.brick, ht = floors(pickR([2, 2, 3]));
          box(hx, hy, hw, hd, m, ht, 2);
          if (chance(0.5)) box(hx, top ? hy + hd : hy - 20, 30, 20, m, ht - FLOOR, 2); // L-wing
          if (chance(0.4)) decal(lx + 20, top ? ly + lh - 70 : ly + 30, 30, 40, 'water'); // pool
          for (let t = 0; t < 2; t++) tree(lx + R(25, lw - 25), top ? ly + R(lh - 80, lh - 25) : ly + R(25, 80));
        }
        break;
      }
      case 'informal': {
        // dense one- and two-storey houses on irregular 4 m alleys
        decal(bx, by, bw, bh, 'dirt');
        let yy = by;
        while (yy < by + bh) {
          const rowH2 = Math.round(R(60, 90) / C) * C, hNext = Math.min(by + bh, yy + rowH2);
          let xx = bx;
          while (xx < bx + bw) {
            const segW = Math.round(R(70, 130) / C) * C, xNext = Math.min(bx + bw, xx + segW);
            for (let hx = xx; hx < xNext - 10; hx += 20) for (let hy = yy; hy < hNext - 10; hy += 30)
              if (chance(0.88)) box(hx, hy, Math.min(20, xNext - hx), Math.min(30, hNext - hy), pickR([MAT.wood, MAT.wood, MAT.brick, MAT.shophouse]), floors(pickR([1, 1, 2])), 1);
            xx = xNext + ALLEY;
          }
          yy = hNext + ALLEY;
        }
        break;
      }
      case 'industrial': {
        // walled yard: two warehouses, stacked containers, gates on two sides
        decal(bx, by, bw, bh, 'yard');
        fence(bx, by, bw, bh, ['n', 'w'], MAT.concrete);
        box(bx + 40, by + 40, 200, 160, MAT.shed, 44, 2);
        box(bx + 300, by + 40, 220, 110, MAT.shed, 36, 2);
        for (let row = 0; row < 5; row++) for (let k = 0; k < 3; k++)
          if (chance(0.8)) box(bx + 60 + k * 150, by + 250 + row * 40, 60, 10, MAT.steel, chance(0.5) ? 26 : 13, 2);
        disc(bx + bw - 70, by + bh - 70, 30, MAT.stone, 60, 3); // silo
        break;
      }
      case 'school': {
        // U-shaped school around the schoolyard, sports court, perimeter fence
        decal(bx, by, bw, bh, 'yard');
        fence(bx, by, bw, bh, ['n', 'e']);
        box(bx + 30, by + 30, bw - 60, 70, MAT.shophouse, floors(3), 2, 0);
        box(bx + 30, by + 100, 70, 220, MAT.shophouse, floors(3), 2, 0);
        box(bx + bw - 100, by + 100, 70, 220, MAT.shophouse, floors(3), 2, 0);
        decal(bx + 140, by + 130, bw - 280, 170, 'court');
        for (let k = 0; k < 6; k++) tree(bx + 60 + k * 90, by + bh - 60);
        break;
      }
    }
  }

  // ---------- street furniture ----------
  // sidewalk trees every ~10 m, cars parked in the kerb lane; both kept off junctions and spawns
  const spawnPts: [number, number][] = [];
  const inJunction = (r: Road, along: number) => roads.some((o) => o.dir !== r.dir && along > (r.dir === 'h' ? o.x : o.y) - 30 && along < (r.dir === 'h' ? o.x + o.w : o.y + o.h) + 30);
  const nearSpawn = (px: number, py: number) => spawnPts.some(([sx, sy]) => Math.hypot(sx - px, sy - py) < 70);

  const start = { x: 35, y: 900, hull: N };
  const enemies: EnemySpawn[] = [
    { type: 'tank', x: 665, y: 400, hull: S },
    { type: 'apc', x: 1000, y: 35, hull: Wt },
    { type: 'tank', x: 1295, y: 590, hull: Wt },
    { type: 'td', x: 1925, y: 1185, hull: Wt },
    { type: 'apc', x: 1295, y: 1450, hull: N },
    { type: 'tank', x: 2555, y: 300, hull: S },
    { type: 'td', x: 2200, y: 630, hull: Wt },
    { type: 'apc', x: 665, y: 1500, hull: N },
    { type: 'tank', x: 1600, y: 1735, hull: Wt },
    { type: 'drone', x: 1600, y: 300, hull: Wt },
    { type: 'drone', x: 2200, y: 1400, hull: Wt },
    { type: 'drone', x: 900, y: 1400, hull: Wt },
  ];
  const stations = [{ x: 360, y: 1185 }, { x: 1925, y: 300 }];
  spawnPts.push([start.x, start.y], ...enemies.map((e) => [e.x, e.y] as [number, number]), ...stations.map((s) => [s.x, s.y] as [number, number]));

  for (const r of roads) {
    const len = r.dir === 'h' ? r.w : r.h, sw = r.sidewalk;
    const cross = r.dir === 'h' ? r.y : r.x, size = r.dir === 'h' ? r.h : r.w;
    const at = (along: number, acrossOff: number) => (r.dir === 'h' ? [along, cross + acrossOff] : [cross + acrossOff, along]) as [number, number];
    // street trees ~10–14 m apart with gaps where one died or a driveway cuts in
    for (let a = 25; a < len; a += R(50, 70)) {
      if (inJunction(r, a)) continue;
      for (const off of [sw / 2, size - sw / 2]) { const [tx, ty] = at(a + R(-5, 5), off); if (!nearSpawn(tx, ty) && chance(0.7)) tree(tx, ty); }
      if (r.kind === 'avenue') { const [tx, ty] = at(a, size / 2); if (!nearSpawn(tx, ty) && chance(0.85)) tree(tx, ty); }
    }
    for (let a = 40; a < len - 40; a += 40) {
      if (inJunction(r, a) || !chance(0.3)) continue;
      const off = chance(0.5) ? sw + 5 : size - sw - 5, [cx0, cy0] = at(a, off);
      if (nearSpawn(cx0, cy0)) continue;
      const [cw, chh] = r.dir === 'h' ? [20, 10] : [10, 20];
      if (free(cx0 - cw / 2, cy0 - chh / 2, cw, chh)) box(cx0 - cw / 2, cy0 - chh / 2, cw, chh, MAT.car, 8, 1);
    }
  }

  return {
    name: 'Khu phố 7',
    objective: 'Tiêu diệt toàn bộ địch',
    grid, roads, decals, start, stations, enemies,
  };
}
