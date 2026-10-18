import { C, MAT, type MaterialId, type TierId } from '../config';
import { seeded } from '../util';
import { missionPoints, type EnemySpawn, type Friends, type Level, type Mission, type Squad } from './city';
import { Grid } from './Grid';

/*
 * Highlands at 5 px = 1 m: rock massifs in stepped tiers (grass on the shelves, bare rock on the
 * summits, cliffs between), dirt roads that climb onto the shelves by ramps cut into the cliff,
 * grassy knolls for hull-down cover, streams with plank bridges, pine woods and hamlets of log
 * cabins and stone huts. Buildings and trees only stand on the valley floor (height 0).
 * Optional stone fortress for the finale.
 */

/** a massif: union of discs [x, y, r]; each later tier stands `inset` cells inside the one below */
export interface Massif { lobes: [number, number, number][]; tiers: number[]; inset?: number }
/** straight road cut from a (low end) to b (high end); height runs evenly between the two ends */
export interface Ramp { a: [number, number]; b: [number, number]; w?: number }
export interface Fort { x: number; y: number; w: number; h: number; gates: { side: 'n' | 's' | 'e' | 'w'; at: number; w: number }[] }
export interface MountainSetup {
  start: { x: number; y: number; hull: number };
  enemies: EnemySpawn[];
  squads: Squad[];
  stations: { x: number; y: number }[];
  mission: Mission;
  friends?: Friends;
  /** rocket teams at house fronts */
  infantry?: { teams: number; mines: number; near?: [number, number]; within?: number };
}
export interface MountainSpec {
  seed: number; name: string; objective: string; ai: number; dmg: number;
  W: number; H: number;
  roads: [number, number][][];
  massifs: Massif[];
  ramps: Ramp[];
  streams: { pts: [number, number][]; w: number }[];
  /** plank bridges: rectangles where a stream is left dry (put them where a road crosses) */
  bridges: { x: number; y: number; w: number; h: number }[];
  forests: { x: number; y: number; r: number; n: number }[];
  hamlets: { x: number; y: number; r: number }[];
  /** grassy knolls (passable, hide a hull), loose boulders, burnt-out wrecks */
  knolls: number; boulders: number; wrecks: number;
  fort?: Fort;
  setup: () => MountainSetup;
}

export function buildMountain(spec: MountainSpec): Level {
  const { W, H } = spec;
  const grid = new Grid(W, H);
  const { GW, GH } = grid;
  const rng = seeded(spec.seed);
  const R = rng.range, chance = (p: number) => rng.next() < p, pickR = <T,>(a: T[]) => a[(rng.next() * a.length) | 0];
  const snap = (v: number) => Math.round(v / C) * C;
  const ok = (cx: number, cy: number) => cx >= 0 && cy >= 0 && cx < GW && cy < GH;
  const at = (x: number, y: number) => Math.floor(y / C) * GW + Math.floor(x / C);
  const segDist = (x: number, y: number, [ax, ay]: [number, number], [bx, by]: [number, number]) => {
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (l2 || 1)));
    return Math.hypot(x - ax - dx * t, y - ay - dy * t);
  };
  const lineDist = (x: number, y: number, pts: [number, number][]) => { let d = 1e9; for (let k = 1; k < pts.length; k++) d = Math.min(d, segDist(x, y, pts[k - 1], pts[k])); return d; };
  const roadDist = (x: number, y: number) => Math.min(...spec.roads.map((r) => lineDist(x, y, r)), ...spec.ramps.map((r) => segDist(x, y, r.a, r.b)));

  const setup = spec.setup();
  const keep: [number, number][] = [[setup.start.x, setup.start.y], ...setup.enemies.map((e) => [e.x, e.y] as [number, number]), ...setup.stations.map((s) => [s.x, s.y] as [number, number]), ...missionPoints(setup.mission), ...(setup.friends?.at ?? [])];
  const nearKeep = (x: number, y: number, r: number) => keep.some(([kx, ky]) => Math.hypot(kx - x, ky - y) < r);

  // ---------- massifs: tiers of rock, grass shelves, bare summits ----------
  for (const m of spec.massifs) {
    const inset = m.inset ?? 4;
    const inT = (px: number, py: number) => m.lobes.some(([lx, ly, lr]) => Math.hypot(px - lx, (py - ly) * 1.1) < lr);
    const x0 = Math.min(...m.lobes.map((l) => l[0] - l[2])), x1 = Math.max(...m.lobes.map((l) => l[0] + l[2]));
    const y0 = Math.min(...m.lobes.map((l) => l[1] - l[2])), y1 = Math.max(...m.lobes.map((l) => l[1] + l[2]));
    for (let cy = Math.max(0, Math.floor(y0 / C)); cy <= Math.min(GH - 1, Math.floor(y1 / C)); cy++)
      for (let cx = Math.max(0, Math.floor(x0 / C)); cx <= Math.min(GW - 1, Math.floor(x1 / C)); cx++) {
        const px = cx * C + 5, py = cy * C + 5;
        if (!inT(px, py)) continue;
        // depth = how many cells inside the outline (checked on a ring, cheap enough at map build)
        let depth = 0;
        for (let d = 1; d <= inset * (m.tiers.length - 1); d++) {
          const r = d * C;
          if (!inT(px + r, py) || !inT(px - r, py) || !inT(px, py + r) || !inT(px, py - r) || !inT(px + r * 0.7, py + r * 0.7) || !inT(px - r * 0.7, py - r * 0.7) || !inT(px + r * 0.7, py - r * 0.7) || !inT(px - r * 0.7, py + r * 0.7)) break;
          depth = d;
        }
        const tier = Math.min(m.tiers.length - 1, Math.floor(depth / inset)), i = cy * GW + cx;
        if (m.tiers[tier] > grid.th[i]) { grid.th[i] = m.tiers[tier]; grid.rock[i] = tier === m.tiers.length - 1 && m.tiers.length > 2 ? 1 : 0; }
      }
  }

  // ---------- grassy knolls: 3.2 m, 4 px per cell, round ----------
  for (let k = 0, tries = 0; k < spec.knolls && tries < 400; tries++) {
    const x = R(80, W - 80), y = R(80, H - 80), r = R(45, 80);
    if (grid.th[at(x, y)] || roadDist(x, y) < r + 30 || nearKeep(x, y, r + 50) || spec.hamlets.some((h) => Math.hypot(h.x - x, h.y - y) < h.r + r)) continue;
    k++;
    for (let cy = Math.floor((y - r) / C); cy <= Math.floor((y + r) / C); cy++)
      for (let cx = Math.floor((x - r) / C); cx <= Math.floor((x + r) / C); cx++) {
        if (!ok(cx, cy)) continue;
        const d = Math.hypot(cx * C + 5 - x, (cy * C + 5 - y) * 1.25), h = 16 - 4 * Math.ceil(Math.max(0, d - r + 40) / C);
        const i = cy * GW + cx;
        if (h > grid.th[i]) grid.th[i] = h;
      }
  }

  // ---------- ramps: road cuts with an even grade (≤ 4 px per cell), road surface ----------
  for (const rp of spec.ramps) {
    const w = rp.w ?? 70, h0 = grid.th[at(...rp.a)], h1 = grid.th[at(...rp.b)];
    const dx = rp.b[0] - rp.a[0], dy = rp.b[1] - rp.a[1], l = Math.hypot(dx, dy);
    for (let cy = Math.floor((Math.min(rp.a[1], rp.b[1]) - w) / C); cy <= Math.floor((Math.max(rp.a[1], rp.b[1]) + w) / C); cy++)
      for (let cx = Math.floor((Math.min(rp.a[0], rp.b[0]) - w) / C); cx <= Math.floor((Math.max(rp.a[0], rp.b[0]) + w) / C); cx++) {
        if (!ok(cx, cy)) continue;
        const px = cx * C + 5, py = cy * C + 5, t = ((px - rp.a[0]) * dx + (py - rp.a[1]) * dy) / (l * l);
        if (t < -0.02 || t > 1.02 || segDist(px, py, rp.a, rp.b) > w / 2) continue;
        const i = cy * GW + cx;
        grid.th[i] = Math.round(h0 + (h1 - h0) * Math.max(0, Math.min(1, t))); grid.rock[i] = 2;
      }
  }
  // roads over raised ground get the dirt surface too
  for (let cy = 0; cy < GH; cy++) for (let cx = 0; cx < GW; cx++) {
    const i = cy * GW + cx;
    if (grid.th[i] && grid.rock[i] !== 2 && spec.roads.some((r) => lineDist(cx * C + 5, cy * C + 5, r) < 24)) grid.rock[i] = 2;
  }

  // ---------- streams (water blocks vehicles, not shells) and the bridges over them ----------
  for (const st of spec.streams)
    for (let cy = 0; cy < GH; cy++) for (let cx = 0; cx < GW; cx++) {
      const px = cx * C + 5, py = cy * C + 5, i = cy * GW + cx;
      if (grid.th[i] || lineDist(px, py, st.pts) > st.w / 2) continue;
      if (spec.bridges.some((b) => px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h)) continue;
      grid.water[i] = 1;
    }

  // ---------- solids only on the valley floor ----------
  const flat = (bx: number, by: number, w: number, h: number) => {
    for (let cy = Math.floor(by / C); cy < Math.ceil((by + h) / C); cy++)
      for (let cx = Math.floor(bx / C); cx < Math.ceil((bx + w) / C); cx++) {
        if (!ok(cx, cy)) return false;
        const i = cy * GW + cx;
        if (grid.mat[i] || grid.water[i] || grid.th[i]) return false;
      }
    return true;
  };
  const box = (bx: number, by: number, w: number, h: number, m: MaterialId, height: number, tier: TierId, t = (rng.next() * 4) | 0) => {
    for (let cy = Math.round(by / C); cy < Math.round((by + h) / C); cy++)
      for (let cx = Math.round(bx / C); cx < Math.round((bx + w) / C); cx++) if (ok(cx, cy) && !grid.th[cy * GW + cx]) grid.set(cx, cy, m, height, t, tier, R(0.85, 1.15));
  };
  const tree = (tx: number, ty: number) => { tx = snap(tx); ty = snap(ty); if (flat(tx - 5, ty - 5, 10, 10) && roadDist(tx, ty) > 32 && !nearKeep(tx, ty, 40)) box(tx - 5, ty - 5, 10, 10, MAT.tree, (R(40, 60) | 0), 1); };

  // fortress: thick stone curtain walls with gates, corner towers, a keep and barracks inside
  const anchors: [number, number][] = [];
  const fort = spec.fort;
  if (fort) {
    const T = 20, { x, y, w, h } = fort;
    const gap = (side: 'n' | 's' | 'e' | 'w', p: number) => fort.gates.some((g) => g.side === side && Math.abs(p - g.at) < g.w / 2);
    for (let px = x; px < x + w; px += C) {
      if (!gap('n', px + 5)) box(px, y, C, T, MAT.stone, 34, 3, 1);
      if (!gap('s', px + 5)) box(px, y + h - T, C, T, MAT.stone, 34, 3, 1);
    }
    for (let py = y; py < y + h; py += C) {
      if (!gap('w', py + 5)) box(x, py, T, C, MAT.stone, 34, 3, 1);
      if (!gap('e', py + 5)) box(x + w - T, py, T, C, MAT.stone, 34, 3, 1);
    }
    for (const [tx, ty] of [[x, y], [x + w - 40, y], [x, y + h - 40], [x + w - 40, y + h - 40]]) box(tx, ty, 40, 40, MAT.stone, 46, 3, 0);
    // keep against the north wall, barracks and sheds along the sides; leave the courtyard open
    box(x + w / 2 - 70, y + T + 30, 140, 70, MAT.stone, 40, 3, 2);
    for (const [bx, by, bw, bh] of [[x + T + 30, y + T + 40, 60, 40], [x + w - T - 90, y + T + 40, 60, 40], [x + T + 30, y + h / 2, 40, 70], [x + w - T - 70, y + h / 2, 40, 70]] as [number, number, number, number][]) {
      box(bx, by, bw, bh, MAT.stone, 24, 2);
      anchors.push([bx + bw / 2, by + bh - 5]);
    }
    for (let k = 0; k < 6; k++) box(snap(x + R(60, w - 100)), snap(y + R(150, h - 120)), 20, 10, MAT.wood, 10, 1); // crates and carts: rammed
  }

  // hamlets: log cabins (wood) and a few stone huts on loose plots
  for (const v of spec.hamlets) {
    for (let gy = v.y - v.r; gy < v.y + v.r; gy += 50) for (let gx = v.x - v.r; gx < v.x + v.r; gx += 50) {
      const px = snap(gx + R(-6, 6)), py = snap(gy + R(-6, 6));
      if (Math.hypot(px + 15 - v.x, py + 15 - v.y) > v.r || !chance(0.65)) continue;
      if (roadDist(px + 15, py + 15) < 42 || nearKeep(px + 15, py + 15, 60)) continue;
      const w = pickR([20, 30, 30]), h = pickR([20, 30]);
      if (!flat(px - 10, py - 10, w + 20, h + 20)) continue;
      const stone = chance(0.25);
      box(px, py, w, h, stone ? MAT.stone : MAT.wood, stone ? pickR([20, 24]) : pickR([14, 18]), stone ? 2 : 1);
      if (!stone && chance(0.35)) box(px + w, py + h - 10, 10, 10, MAT.wood, 8, 1); // woodpile
      anchors.push([px + w / 2, py + h - 5]);
    }
  }

  // pine woods, then lone pines and boulders
  for (const f of spec.forests) for (let k = 0; k < f.n; k++) { const a = rng.next() * 6.283, r = Math.sqrt(rng.next()) * f.r; tree(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r); }
  for (let k = 0; k < 40; k++) tree(R(30, W - 30), R(30, H - 30));
  for (let k = 0, tries = 0; k < spec.boulders && tries < 400; tries++) {
    const x = snap(R(40, W - 40)), y = snap(R(40, H - 40)), w = chance(0.5) ? 20 : 10;
    if (roadDist(x, y) < 40 || nearKeep(x, y, 50) || !flat(x - 10, y - 10, w + 20, 30)) continue;
    k++; box(x, y, w, 10, MAT.stone, (R(8, 16) | 0), 3, 1);
  }

  // ---------- rocket teams at house fronts ----------
  const enemies = setup.enemies;
  if (setup.infantry) {
    const inf = setup.infantry;
    const pool = anchors.filter(([ax, ay]) => Math.hypot(ax - setup.start.x, ay - setup.start.y) > 450 && (!inf.near || Math.hypot(ax - inf.near[0], ay - inf.near[1]) < (inf.within ?? 1e9)));
    const teams: [number, number][] = [];
    for (const a of [...pool].sort(() => rng.next() - 0.5)) if (teams.length < inf.teams && teams.every(([tx, ty]) => Math.hypot(tx - a[0], ty - a[1]) > 140)) teams.push(a);
    for (const [ax, ay] of teams) {
      enemies.push({ type: 'infantry', x: ax, y: ay, hull: 0, mine: chance(inf.mines) });
      const mate = anchors.find(([bx, by]) => { const d = Math.hypot(bx - ax, by - ay); return d > 15 && d < 60; });
      if (mate) enemies.push({ type: 'infantry', x: mate[0], y: mate[1], hull: 0, mine: chance(inf.mines) });
    }
  }

  // burnt-out vehicles by the roads, valley floor only
  const wrecks: [number, number, number][] = [];
  for (let k = 0, tries = 0; k < spec.wrecks && tries < 200; tries++) {
    const r = pickR(spec.roads), j = 1 + ((rng.next() * (r.length - 1)) | 0), f = rng.next(), side = chance(0.5) ? 1 : -1;
    const [ax, ay] = r[j - 1], [bx, by] = r[j], l = Math.hypot(bx - ax, by - ay);
    const x = ax + (bx - ax) * f - ((by - ay) / l) * side * R(36, 60), y = ay + (by - ay) * f + ((bx - ax) / l) * side * R(36, 60);
    if (!flat(x - 20, y - 15, 40, 30) || nearKeep(x, y, 80)) continue;
    wrecks.push([x, y, rng.next() * Math.PI * 2]); k++;
  }

  return {
    name: spec.name, objective: spec.objective, grid, roads: [], decals: [], wrecks,
    start: setup.start, stations: setup.stations, enemies, squads: setup.squads, friends: setup.friends,
    ai: spec.ai, dmg: spec.dmg, anchors, testExtras: [], mission: setup.mission,
    biome: 'mountain', tracks: spec.roads, streams: spec.streams, bridges: spec.bridges,
  };
}
