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
  /** sand ridges, rock outcrops, stepped mesas (with sand ramps), burnt-out wrecks */
  dunes: number; rocks: number; mesas: number; wrecks: number;
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
      anchors.push([px + w / 2, py + h - 5]); // just inside the front wall: hidden in the house
    }
    for (let k = 0; k < 5; k++) tree(v.x + R(-v.r, v.r), v.y + R(-v.r, v.r));
  }

  // ---------- terrain: stepped mesas with sand ramps, low sand ridges ----------
  const clear = (x: number, y: number, r: number) => trackDist(x, y) > r + 30 && !spec.villages.some((v) => Math.hypot(v.x - x, v.y - y) < v.r + r + 20) && !nearKeep(x, y, r + 60);
  const raise = (cx: number, cy: number, h: number, rock: boolean) => {
    if (!cellOK(cx, cy)) return;
    const i = cy * grid.GW + cx;
    if (grid.water[i] || grid.mat[i]) return;
    if (h > grid.th[i]) { grid.th[i] = h; grid.rock[i] = rock ? 1 : 0; }
  };
  for (let k = 0, tries = 0; k < spec.mesas && tries < 300; tries++) {
    const x = R(140, W - 140), y = R(140, H - 140);
    if (!clear(x, y, 130)) continue;
    k++;
    // tier 1 (4.8 m): a union of discs gives a ragged, stepped outline on the cell grid
    const lobes = Array.from({ length: (R(3, 6) | 0) }, () => [x + R(-60, 60), y + R(-45, 45), R(40, 75)] as [number, number, number]);
    const inT1 = (px: number, py: number) => lobes.some(([lx, ly, lr]) => Math.hypot(px - lx, (py - ly) * 1.15) < lr);
    const cells: [number, number][] = [];
    for (let cy = Math.floor((y - 140) / C); cy <= Math.floor((y + 140) / C); cy++)
      for (let cx = Math.floor((x - 150) / C); cx <= Math.floor((x + 150) / C); cx++)
        if (inT1(cx * C + 5, cy * C + 5)) { raise(cx, cy, 24, true); cells.push([cx, cy]); }
    // tier 2 (9.6 m): cells at least 3 cells inside the outline
    for (const [cx, cy] of cells) {
      let inner = true;
      for (let dy = -3; dy <= 3 && inner; dy++) for (let dx = -3; dx <= 3; dx++) if (!inT1((cx + dx) * C + 5, (cy + dy) * C + 5)) { inner = false; break; }
      if (inner) raise(cx, cy, 48, true);
    }
    // ramps: a straight 7-cell wide sand slope down each tier, 4 px per cell, facing N/E/S/W
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].sort(() => rng.next() - 0.5).slice(0, chance(0.5) ? 2 : 1);
    const ccx = Math.floor(x / C), ccy = Math.floor(y / C);
    for (const [ux, uy] of dirs) for (const to of [24, 48]) {
      // walk out from the centre to the first cell below `to`
      let d = 0;
      while (d < 30 && cellOK(ccx + ux * d, ccy + uy * d) && grid.th[(ccy + uy * d) * grid.GW + ccx + ux * d] >= to) d++;
      if (d >= 30 || d === 0) continue;
      // a full-width landing on the tier at the top of the ramp (the tier edge can be ragged there)
      for (let k2 = -3; k2 < 0; k2++) for (let w2 = -3; w2 <= 3; w2++) raise(ccx + ux * (d + k2) + uy * w2, ccy + uy * (d + k2) + ux * w2, to, true);
      for (let k2 = 0; to - 4 * (k2 + 1) > 0; k2++) // run all the way down, so a top-tier ramp never ends at a drop
        for (let w2 = -3; w2 <= 3; w2++) {
          const cx = ccx + ux * (d + k2) + uy * w2, cy = ccy + uy * (d + k2) + ux * w2;
          if (!cellOK(cx, cy)) continue;
          const i = cy * grid.GW + cx, hh = to - 4 * (k2 + 1);
          if (grid.th[i] < hh) { grid.th[i] = hh; grid.rock[i] = 0; }
        }
    }
  }
  for (let k = 0, tries = 0; k < spec.dunes && tries < 400; tries++) {
    // low sand ridge: 3.2 m at the crest, sloping 4 px per cell, enough to hide a vehicle behind it
    const x = R(80, W - 80), y = R(80, H - 80), len = R(80, 160), a = R(-0.5, 0.5), Hh = 16, half = Hh / 4 * C;
    if (!clear(x, y, len)) continue;
    k++;
    const c = Math.cos(a), s2 = Math.sin(a);
    for (let cy = Math.floor((y - len) / C); cy <= Math.floor((y + len) / C); cy++)
      for (let cx = Math.floor((x - len) / C); cx <= Math.floor((x + len) / C); cx++) {
        const dx = cx * C + 5 - x, dy = cy * C + 5 - y, u = dx * c + dy * s2, v = -dx * s2 + dy * c;
        const along = Math.max(0, Math.abs(u) - (len - half)), h = Hh - (4 * Math.ceil(Math.max(Math.abs(v), along) / C));
        if (h > 0) raise(cx, cy, h, false);
      }
  }
  for (let k = 0, tries = 0; k < spec.rocks && tries < 400; tries++) {
    const x = R(60, W - 60), y = R(60, H - 60);
    if (!clear(x, y, 40)) continue;
    k++;
    const n = (R(2, 5) | 0), ht = (R(14, 30) | 0);
    for (let j = 0; j < n; j++) {
      const ox = x + R(-30, 30), oy = y + R(-20, 20), rr = R(12, 26);
      for (let cy = Math.floor((oy - rr) / C); cy <= Math.floor((oy + rr) / C); cy++)
        for (let cx = Math.floor((ox - rr) / C); cx <= Math.floor((ox + rr) / C); cx++)
          if (cellOK(cx, cy) && !grid.th[cy * grid.GW + cx] && Math.hypot(cx * C + 5 - ox, (cy * C + 5 - oy) * 1.2) < rr) grid.set(cx, cy, MAT.stone, ht, 1, 3, 1);
    }
  }
  // boulders and cactus scattered over the open ground
  for (let k = 0; k < 40; k++) {
    const x = snap(R(40, W - 40)), y = snap(R(40, H - 40));
    if (trackDist(x, y) < 40 || nearKeep(x, y, 50) || grid.th[Math.floor(y / C) * grid.GW + Math.floor(x / C)]) continue;
    if (chance(0.5)) { if (free(x, y, 10, 10)) box(x, y, chance(0.5) ? 10 : 20, 10, MAT.stone, (R(8, 14) | 0), 3, 1); }
    else if (free(x, y, 10, 10)) box(x, y, 10, 10, MAT.tree, (R(14, 21) | 0), 1); // cactus: short "trees"
  }
  // scrub: a few lone acacias
  for (let k = 0; k < 18; k++) { const x = R(40, W - 40), y = R(40, H - 40); if (trackDist(x, y) > 40 && !nearKeep(x, y, 50)) tree(x, y); }

  // ---------- rocket teams at house fronts ----------
  const enemies = setup.enemies;
  const usable = anchors.filter(([ax, ay]) => Math.hypot(ax - setup.start.x, ay - setup.start.y) > 450);
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

  // burnt-out vehicles near the tracks (cover, and they block)
  const wrecks: [number, number, number][] = [];
  for (let k = 0, tries = 0; k < spec.wrecks && tries < 200; tries++) {
    const tr = pickR(spec.tracks), j = 1 + ((rng.next() * (tr.length - 1)) | 0), f = rng.next(), side = chance(0.5) ? 1 : -1;
    const [ax, ay] = tr[j - 1], [bx, by] = tr[j], l = Math.hypot(bx - ax, by - ay);
    const x = ax + (bx - ax) * f - ((by - ay) / l) * side * R(40, 70), y = ay + (by - ay) * f + ((bx - ax) / l) * side * R(40, 70);
    if (!free(x - 20, y - 15, 40, 30) || nearKeep(x, y, 80) || grid.th[Math.floor(y / C) * grid.GW + Math.floor(x / C)]) continue;
    wrecks.push([x, y, rng.next() * Math.PI * 2]); k++;
  }

  return {
    name: spec.name, objective: spec.objective, grid, roads: [], decals: [], wrecks,
    start: setup.start, stations: setup.stations, enemies, squads: setup.squads,
    ai: spec.ai, dmg: spec.dmg, anchors, testExtras: [], mission: setup.mission,
    biome: 'desert', tracks: spec.tracks, ponds,
  };
}
