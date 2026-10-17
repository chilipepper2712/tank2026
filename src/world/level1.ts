import { C, MAT, type EnemyType, type MaterialId, type TierId } from '../config';
import { seeded } from '../util';
import { Grid } from './Grid';

export type BlockType = 'city' | 'houses' | 'shanty' | 'yard' | 'park';
export interface Block { x: number; y: number; type: BlockType }
export interface EnemySpawn { type: EnemyType; x: number; y: number; hull: number }
export interface Level {
  name: string;
  objective: string;
  grid: Grid;
  blocks: Block[];
  road: number;
  block: number;
  start: { x: number; y: number; hull: number };
  stations: { x: number; y: number }[];
  enemies: EnemySpawn[];
}

const ROAD = 100, BLK = 300, NX = 5, NY = 3;
const TYPES: BlockType[] = ['city', 'houses', 'city', 'yard', 'houses', 'park', 'city', 'shanty', 'houses', 'city', 'yard', 'houses', 'shanty', 'city', 'park'];
const E = 0, S = Math.PI / 2, Wt = Math.PI, N = -Math.PI / 2;

/** Level 1, "Khu phố 7": a 5×3 grid of city blocks. Clear every enemy to win. */
export function buildLevel1(): Level {
  const W = ROAD + NX * (BLK + ROAD), H = ROAD + NY * (BLK + ROAD);
  const grid = new Grid(W, H);
  const rng = seeded(1016);
  const R = rng.range;

  const box = (x: number, y: number, w: number, h: number, m: MaterialId, height: number, tier: TierId) => {
    const t = (rng.next() * 4) | 0;
    for (let cy = Math.round(y / C); cy < Math.round((y + h) / C); cy++)
      for (let cx = Math.round(x / C); cx < Math.round((x + w) / C); cx++) grid.set(cx, cy, m, height, t, tier, R(0.85, 1.15));
  };
  const blob = (x: number, y: number, r: number, m: MaterialId, height: number, tier: TierId) => {
    const t = (rng.next() * 4) | 0;
    for (let cy = Math.floor((y - r) / C); cy <= Math.ceil((y + r) / C); cy++)
      for (let cx = Math.floor((x - r) / C); cx <= Math.ceil((x + r) / C); cx++)
        if (Math.hypot(cx * C + 5 - x, cy * C + 5 - y) < r * R(0.78, 1)) grid.set(cx, cy, m, height, t, tier, R(0.85, 1.15));
  };
  const free = (x: number, y: number, w: number, h: number) => {
    for (let cy = Math.floor(y / C); cy < Math.ceil((y + h) / C); cy++)
      for (let cx = Math.floor(x / C); cx < Math.ceil((x + w) / C); cx++) {
        if (cx < 0 || cy < 0 || cx >= grid.GW || cy >= grid.GH || grid.mat[cy * grid.GW + cx]) return false;
      }
    return true;
  };
  const lots = (x: number, y: number, w: number, h: number, depth: number, out: number[][]) => {
    if (depth <= 0 || (w < 80 && h < 80)) { out.push([x, y, w, h]); return; }
    if (w >= h) { const s = w * R(0.38, 0.62); lots(x, y, s, h, depth - 1, out); lots(x + s, y, w - s, h, depth - 1, out); }
    else { const s = h * R(0.38, 0.62); lots(x, y, w, s, depth - 1, out); lots(x, y + s, w, h - s, depth - 1, out); }
  };

  const blocks: Block[] = [];
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const x = ROAD + i * (BLK + ROAD), y = ROAD + j * (BLK + ROAD), type = TYPES[j * NX + i];
    blocks.push({ x, y, type });
    const ix = x + 12, iy = y + 12, iw = BLK - 24, L: number[][] = [];
    if (type === 'city') {
      lots(ix, iy, iw, iw, rng.next() < 0.5 ? 1 : 2, L);
      for (const [a, b, w, h] of L) box(a + 6, b + 6, w - 12, h - 12, MAT.concrete, R(54, 74) | 0, 3);
    } else if (type === 'houses') {
      lots(ix, iy, iw, iw, 3, L);
      for (const [a, b, w, h] of L) if (w >= 36 && h >= 36) box(a + 8, b + 8, w - 16, h - 16, rng.next() < 0.2 ? MAT.wood : MAT.brick, R(28, 44) | 0, 2);
    } else if (type === 'shanty') {
      lots(ix, iy, iw, iw, 4, L);
      for (const [a, b, w, h] of L) if (rng.next() >= 0.25 && w >= 30 && h >= 30) box(a + 7, b + 7, w - 14, h - 14, rng.next() < 0.6 ? MAT.wood : MAT.brick, R(16, 24) | 0, 1);
    } else if (type === 'yard') {
      box(ix, iy, iw, 10, MAT.concrete, 16, 1);
      box(ix, iy + iw - 10, iw * 0.4, 10, MAT.concrete, 16, 1);
      box(ix + iw * 0.6, iy + iw - 10, iw * 0.4, 10, MAT.concrete, 16, 1);
      box(ix, iy, 10, iw, MAT.concrete, 16, 1);
      box(ix + iw - 10, iy, 10, iw * 0.45, MAT.concrete, 16, 1);
      box(ix + iw - 10, iy + iw * 0.65, 10, iw * 0.35, MAT.concrete, 16, 1);
      let placed = 0, tries = 0;
      while (placed < 9 && tries++ < 300) {
        const hor = rng.next() < 0.5, w = hor ? 60 : 20, h = hor ? 20 : 60;
        const a = R(ix + 26, ix + iw - 26 - w), b = R(iy + 26, iy + iw - 26 - h);
        if (free(a - 12, b - 12, w + 24, h + 24)) { box(a, b, w, h, MAT.steel, 26, 2); placed++; }
      }
    } else {
      for (let k = 0; k < 8; k++) blob(R(ix + 30, ix + iw - 30), R(iy + 30, iy + iw - 30), R(10, 26), MAT.stone, R(14, 24) | 0, 2);
      box(ix + 20, iy + iw - 30, iw * 0.5, 10, MAT.stone, 14, 1);
    }
  }

  // Road centre lines sit at 50 + 400k. Tank destroyers guard junctions, drones patrol the east.
  const enemies: EnemySpawn[] = [
    { type: 'tank', x: 450, y: 450, hull: Wt },
    { type: 'apc', x: 850, y: 250, hull: S },
    { type: 'tank', x: 1250, y: 50, hull: Wt },
    { type: 'td', x: 1250, y: 850, hull: Wt },
    { type: 'apc', x: 1650, y: 650, hull: N },
    { type: 'tank', x: 1650, y: 1250, hull: Wt },
    { type: 'td', x: 2050, y: 450, hull: Wt },
    { type: 'apc', x: 850, y: 1250, hull: E },
    { type: 'tank', x: 2050, y: 1050, hull: N },
    { type: 'drone', x: 1450, y: 450, hull: Wt },
    { type: 'drone', x: 1850, y: 850, hull: Wt },
    { type: 'drone', x: 1050, y: 1050, hull: Wt },
  ];

  return {
    name: 'Khu phố 7',
    objective: 'Tiêu diệt toàn bộ địch',
    grid, blocks, road: ROAD, block: BLK,
    start: { x: 50, y: 650, hull: N },
    stations: [{ x: 450, y: 1050 }, { x: 1650, y: 850 }],
    enemies,
  };
}
