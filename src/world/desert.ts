import { C, MAT, type MaterialId, type TierId } from '../config';
import { seeded } from '../util';
import type { EnemySpawn, Level, Mission, Squad } from './city';
import { Grid } from './Grid';

/*
 * Open desert at 5 px = 1 m: dirt tracks, sand ridges that hide what is behind them and slow
 * vehicles, rock outcrops for hard cover, and oasis villages of mud houses (rammed through by any
 * vehicle) round a pond with date palms. A few stone houses stand among the mud ones. Rocket teams
 * hide at house fronts; some carry demolition mines.
 */

export interface Village { x: number; y: number; r: number; pond: number }
export interface DesertSetup {
  start: { x: number; y: number; hull: number };
  enemies: EnemySpawn[];
  squads: Squad[];
  stations: { x: number; y: number }[];
  mission: Mission;
  /** rocket teams at house fronts; `mines` is the share carrying a demolition charge */
  infantry?: { teams: number; mines: number; near?: [number, number]; within?: number };
}
export interface DesertSpec {
  seed: number; name: string; objective: string; ai: number; dmg: number;
  W: number; H: number;
  tracks: [number, number][][];
  villages: Village[];
  dunes: number; rocks: number;
  setup: () => DesertSetup;
}

export function buildDesert(spec: DesertSpec): Level {
  const { W, H } = spec;
  const grid = new Grid(W, H);
  const rng = seeded(spec.seed);
  const R = rng.range, chance = (p: number) => rng.next() < p, pickR = <T,>(a: T[]) => a[(rng.next() * a.length) | 0];
  const snap = (v: number) => Math.round(v / C) * C;
  const cellOK = (cx: number, cy: number) => cx >= 0 && cy >= 0 && cx < grid.GW && cy < grid.GH;
  const box = (bx: number, by: number, w: number, h: number, m: MaterialId, height: number, tier: TierId, t = (rng.next() * 4) | 0) => {
    for (let cy = Math.round(by / C); cy < Math.round((by + h) / C); cy++)
      for (let cx = Math.round(bx / C); cx < Math.round((bx + w) / C); cx++) if (cellOK(cx, cy)) grid.set(cx, cy, m, height, t, tier, R(0.85, 1.15));
  };
  const free = (bx: number, by: number, w: number, h: number) => {
    for (let cy = Math.floor(by / C); cy < Math.ceil((by + h) / C); cy++)
      for (let cx = Math.floor(bx / C); cx < Math.ceil((bx + w) / C); cx++) {
        if (!cellOK(cx, cy)) return false;
        const i = cy * grid.GW + cx;
        if (grid.mat[i] || grid.water[i]) return false;
      }
    return true;
  };
  /** distance from (x, y) to the nearest track, to keep tracks clear */
  const segDist = (x: number, y: number, [ax, ay]: [number, number], [bx, by]: [number, number]) => {
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (l2 || 1)));
    return Math.hypot(x - ax - dx * t, y - ay - dy * t);
  };
  const trackDist = (x: number, y: number) => {
    let d = 1e9;
    for (const tr of spec.tracks) for (let k = 1; k < tr.length; k++) d = Math.min(d, segDist(x, y, tr[k - 1], tr[k]));
    return d;
  };
  const tree = (tx: number, ty: number) => { if (free(tx - 5, ty - 5, 10, 10)) box(tx - 5, ty - 5, 10, 10, MAT.tree, (R(30, 50) | 0), 1); };

  const setup = spec.setup();
  const keep: [number, number][] = [[setup.start.x, setup.start.y], ...setup.enemies.map((e) => [e.x, e.y] as [number, number]), ...setup.stations.map((s) => [s.x, s.y] as [number, number])];
  if (setup.mission.kind === 'escort') keep.push(...setup.mission.route);
  if (setup.mission.kind === 'hold' || setup.mission.kind === 'capture') keep.push([setup.mission.zone.x, setup.mission.zone.y]);
  const nearKeep = (x: number, y: number, r: number) => keep.some(([kx, ky]) => Math.hypot(kx - x, ky - y) < r);

  // ---------- oasis villages ----------
  const ponds: { x: number; y: number; r: number }[] = [];
  const anchors: [number, number][] = [];
  for (const v of spec.villages) {
    if (v.pond > 0) {
      ponds.push({ x: v.x, y: v.y, r: v.pond });
      for (let cy = Math.floor((v.y - v.pond) / C); cy <= Math.floor((v.y + v.pond) / C); cy++)
        for (let cx = Math.floor((v.x - v.pond) / C); cx <= Math.floor((v.x + v.pond) / C); cx++)
          if (cellOK(cx, cy) && Math.hypot((cx * C + 5 - v.x) / 1, (cy * C + 5 - v.y) / 0.75) < v.pond) grid.water[cy * grid.GW + cx] = 1;
      // date palms round the water
      for (let k = 0; k < 14; k++) { const a = rng.next() * 6.283, rr = v.pond + R(12, 40); tree(v.x + Math.cos(a) * rr, v.y + Math.sin(a) * rr * 0.75); }
    }
    // houses on a loose grid of plots with lanes between them; mostly mud, a few of stone
    for (let gy = v.y - v.r; gy < v.y + v.r; gy += 50) for (let gx = v.x - v.r; gx < v.x + v.r; gx += 50) {
      const px = snap(gx + R(-6, 6)), py = snap(gy + R(-6, 6));
      if (Math.hypot(px + 15 - v.x, py + 15 - v.y) > v.r || !chance(0.7)) continue;
      if (Math.hypot(px + 15 - v.x, py + 15 - v.y) < v.pond + 34) continue;
      if (trackDist(px + 15, py + 15) < 40 || nearKeep(px + 15, py + 15, 60)) continue;
      const w = pickR([20, 30, 30]), h = pickR([20, 30]);
      if (!free(px - 10, py - 10, w + 20, h + 20)) continue;
      const stone = chance(0.18);
      box(px, py, w, h, stone ? MAT.stone : MAT.mud, stone ? pickR([24, 32]) : pickR([14, 18, 22]), stone ? 2 : 1);
      if (!stone && chance(0.4)) box(px + w, py, 10, h, MAT.mud, 10, 1); // courtyard wall stub
      anchors.push([px + w / 2, py + h + 7]);
    }
    for (let k = 0; k < 5; k++) tree(v.x + R(-v.r, v.r), v.y + R(-v.r, v.r));
  }

  // ---------- sand ridges and rock outcrops away from the tracks ----------
  const dunes: { x: number; y: number; rx: number; ry: number; a: number }[] = [];
  for (let k = 0, tries = 0; k < spec.dunes && tries < 400; tries++) {
    const x = R(80, W - 80), y = R(80, H - 80), rx = R(70, 150), ry = R(18, 30), a = R(-0.6, 0.6);
    if (trackDist(x, y) < rx * 0.6 + 40 || spec.villages.some((v) => Math.hypot(v.x - x, v.y - y) < v.r + rx) || nearKeep(x, y, rx + 30)) continue;
    dunes.push({ x, y, rx, ry, a }); k++;
    const c = Math.cos(a), s = Math.sin(a);
    for (let cy = Math.floor((y - rx) / C); cy <= Math.floor((y + rx) / C); cy++)
      for (let cx = Math.floor((x - rx) / C); cx <= Math.floor((x + rx) / C); cx++) {
        if (!cellOK(cx, cy)) continue;
        const dx = cx * C + 5 - x, dy = cy * C + 5 - y, u = dx * c + dy * s, v = -dx * s + dy * c;
        if ((u / rx) ** 2 + (v / ry) ** 2 < 1) grid.dune[cy * grid.GW + cx] = 1;
      }
  }
  for (let k = 0, tries = 0; k < spec.rocks && tries < 400; tries++) {
    const x = R(60, W - 60), y = R(60, H - 60);
    if (trackDist(x, y) < 70 || spec.villages.some((v) => Math.hypot(v.x - x, v.y - y) < v.r + 40) || nearKeep(x, y, 80)) continue;
    k++;
    const n = (R(2, 5) | 0), ht = (R(14, 30) | 0);
    for (let j = 0; j < n; j++) {
      const ox = x + R(-30, 30), oy = y + R(-20, 20), rr = R(12, 26);
      for (let cy = Math.floor((oy - rr) / C); cy <= Math.floor((oy + rr) / C); cy++)
        for (let cx = Math.floor((ox - rr) / C); cx <= Math.floor((ox + rr) / C); cx++)
          if (cellOK(cx, cy) && Math.hypot(cx * C + 5 - ox, (cy * C + 5 - oy) * 1.2) < rr) grid.set(cx, cy, MAT.stone, ht, 1, 3, 1);
    }
  }
  // scrub: a few lone acacias
  for (let k = 0; k < 18; k++) { const x = R(40, W - 40), y = R(40, H - 40); if (trackDist(x, y) > 40 && !nearKeep(x, y, 50)) tree(x, y); }

  // ---------- rocket teams at house fronts ----------
  const enemies = setup.enemies;
  const usable = anchors.filter(([ax, ay]) => free(ax - 5, ay - 5, 10, 10) && Math.hypot(ax - setup.start.x, ay - setup.start.y) > 450);
  if (setup.infantry) {
    const inf = setup.infantry, pool = usable.filter(([ax, ay]) => !inf.near || Math.hypot(ax - inf.near[0], ay - inf.near[1]) < (inf.within ?? 1e9));
    const teams: [number, number][] = [];
    for (const a of [...pool].sort(() => rng.next() - 0.5)) if (teams.length < inf.teams && teams.every(([tx, ty]) => Math.hypot(tx - a[0], ty - a[1]) > 150)) teams.push(a);
    for (const [ax, ay] of teams) {
      enemies.push({ type: 'infantry', x: ax, y: ay, hull: 0, mine: chance(inf.mines) });
      const mate = usable.find(([bx, by]) => { const d = Math.hypot(bx - ax, by - ay); return d > 15 && d < 60; });
      if (mate) enemies.push({ type: 'infantry', x: mate[0], y: mate[1], hull: 0, mine: chance(inf.mines) });
    }
  }

  return {
    name: spec.name, objective: spec.objective, grid, roads: [], decals: [],
    start: setup.start, stations: setup.stations, enemies, squads: setup.squads,
    ai: spec.ai, dmg: spec.dmg, anchors, testExtras: [], mission: setup.mission,
    biome: 'desert', tracks: spec.tracks, ponds, dunes,
  };
}
