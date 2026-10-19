import { Container, Graphics, RenderTexture, Sprite, type Renderer } from 'pixi.js';
import { C, K, MAT, MATERIALS, ZS, type MaterialId } from '../config';
import { shade } from '../util';
import { Grid, RUBBLE, STEP } from '../world/Grid';
import type { Decal, Level, Road } from '../world/city';

const STRIP = 30; // columns per building strip
const TINTS = [0.9, 0.96, 1.03, 1.1];
const mats = Object.entries(MATERIALS) as [string, (typeof MATERIALS)[MaterialId]][];
const TOP = Object.fromEntries(mats.map(([k, m]) => [k, (m.palette ?? TINTS.map((f) => shade(m.top, f))).slice()])) as Record<string, number[]>;
const SIDE = Object.fromEntries(mats.map(([k, m]) => [k, m.sidePalette ?? (m.palette ? m.palette.map((c) => shade(c, 0.62)) : TINTS.map((f) => shade(m.side, f)))])) as Record<string, number[]>;
const SAND_TOP = [0xd8b882, 0xd2b07a, 0xdcbf8a], ROCK_TOP = [0xbf8452, 0xb77c4a, 0xc78d5a];
/** highlands: grass shelves, grey rock summits and cliffs, dirt road cuts */
const GRASS_TOP = 0x6d7d43, GREY_TOP = [0x8f8b80, 0x878377, 0x979386], ROAD_TOP = 0x8f7d5d;
const RUB = Object.fromEntries(mats.map(([k, m]) => [k, [shade(m.palette?.[0] ?? m.top, 0.66), shade(m.palette?.[0] ?? m.top, 0.46)]])) as Record<string, number[]>;

/** Cheap deterministic hash so details (AC units, lit windows) stay put across rebuilds. */
const hash = (i: number) => { let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); return (h ^ (h >>> 16)) >>> 0; };

/**
 * Draws the level in the 3/4 projection: screen x = x, screen y = y·K − height·ZS.
 * Ground is a render texture that debris and scorch marks get baked into.
 * Buildings are split into row strips; each strip's zIndex is the ground y of its front
 * edge, so units sorted by their own y are hidden by buildings standing in front of them.
 */
export class WorldView {
  readonly root = new Container();
  readonly ground: RenderTexture;
  readonly groundLayer = new Container();
  /** shared depth-sorted layer: building strips, units, particles */
  readonly sorted = new Container({ sortableChildren: true });
  readonly overlay = new Container();
  private low: (Graphics | null)[]; // rubble + cast shadows, drawn on the ground under units
  private builds: (Graphics | null)[];
  private bakeG = new Graphics();
  private bakeCount = 0;
  private readonly strips: number;

  constructor(private renderer: Renderer, private level: Level) {
    const g = level.grid;
    this.strips = Math.ceil(g.GW / STRIP);
    this.low = new Array(g.GH * this.strips).fill(null);
    this.builds = new Array(g.GH * this.strips).fill(null);
    this.ground = RenderTexture.create({ width: g.W, height: g.H, resolution: 1 });
    this.paintGround();
    this.bakeAO();
    const gs = new Sprite(this.ground);
    gs.scale.y = K;
    this.groundLayer.addChild(gs);
    this.root.addChild(this.groundLayer, this.sorted, this.overlay);
    for (let r = 0; r < g.GH; r++) for (let s = 0; s < this.strips; s++) this.buildStrip(r, s);
  }

  // ---------------------------------------------------------------- ground
  private paintGround() {
    if (this.level.biome === 'desert') { this.paintDesert(); return; }
    if (this.level.biome === 'mountain') { this.paintMountain(); return; }
    const { grid: g, roads, decals } = this.level;
    const p = new Graphics(), rnd = Math.random;
    // block ground under everything, then lot surfaces, then the road network on top
    p.rect(0, 0, g.W, g.H).fill(0x5a5952);
    for (const d of decals) this.paintDecal(p, d);

    /** stretches of road `r` that are a junction with a crossing road (along-axis intervals) */
    const crosses = (r: Road, o: Road) => o.dir !== r.dir && o.x < r.x + r.w && o.x + o.w > r.x && o.y < r.y + r.h && o.y + o.h > r.y;
    const junctions = (r: Road) => roads.filter((o) => crosses(r, o)).map((o) => (r.dir === 'h' ? [o.x - r.x, o.x + o.w - r.x] : [o.y - r.y, o.y + o.h - r.y]) as [number, number]);
    const inJ = (js: [number, number][], a: number, pad = 0) => js.some(([j0, j1]) => a > j0 - pad && a < j1 + pad);
    const rect = (r: Road, along: number, across: number, len: number, wid: number) =>
      r.dir === 'h' ? p.rect(r.x + along, r.y + across, len, wid) : p.rect(r.x + across, r.y + along, wid, len);
    const lenOf = (r: Road) => (r.dir === 'h' ? r.w : r.h), widOf = (r: Road) => (r.dir === 'h' ? r.h : r.w);
    /** stretches between junctions, shrunk by `pad` at each junction */
    const gaps = (js: [number, number][], L: number, pad: number) => {
      const out: [number, number][] = []; let a = 0;
      for (const [j0, j1] of [...js].sort((u, v) => u[0] - v[0])) { if (j0 - pad > a) out.push([a, Math.min(L, j0 - pad)]); a = Math.max(a, j1 + pad); }
      if (a < L) out.push([a, L]);
      return out;
    };

    // sidewalks: paving with joints and a kerb line
    for (const r of roads) { rect(r, 0, 0, lenOf(r), r.sidewalk); rect(r, 0, widOf(r) - r.sidewalk, lenOf(r), r.sidewalk); }
    p.fill(0x77746a);
    for (const r of roads) for (let a = 0; a < lenOf(r); a += 10) { rect(r, a, 0, 1, r.sidewalk); rect(r, a, widOf(r) - r.sidewalk, 1, r.sidewalk); }
    p.fill({ color: 0x000000, alpha: 0.12 });
    // carriageways cover the sidewalks where roads cross, which opens the junctions
    for (const r of roads) rect(r, 0, r.sidewalk, lenOf(r), widOf(r) - 2 * r.sidewalk);
    p.fill(0x2f312a); // asphalt, 10% darker than first painted so vehicles stand out (owner)
    for (const r of roads) for (const [a0, a1] of gaps(junctions(r), lenOf(r), 0)) { rect(r, a0, r.sidewalk, a1 - a0, 2); rect(r, a0, widOf(r) - r.sidewalk - 2, a1 - a0, 2); }
    p.fill({ color: 0x000000, alpha: 0.3 }); // kerb shadow
    // asphalt grain
    for (let k = 0; k < 9000; k++) { const s = rnd() * 3 + 1; p.rect(rnd() * g.W, rnd() * g.H, s, s); }
    p.fill({ color: 0x000000, alpha: 0.08 });

    // markings
    for (const r of roads) {
      const js = junctions(r), w = widOf(r), L = lenOf(r);
      if (r.kind === 'avenue') {
        // planted median, two lanes each way with dashed dividers
        for (const [a0, a1] of gaps(js, L, 20)) rect(r, a0, w / 2 - 6, a1 - a0, 12);
        p.fill(0x6b6a62);
        for (const [a0, a1] of gaps(js, L, 21)) rect(r, a0, w / 2 - 5, a1 - a0, 10);
        p.fill(0x4d6a31);
        for (let a = 0; a < L; a += 30) if (!inJ(js, a, 10)) for (const q of [0.25, 0.75]) rect(r, a, r.sidewalk + (w - 2 * r.sidewalk) * q - 1, 14, 2);
        p.fill({ color: 0xe8e4d4, alpha: 0.6 });
      } else {
        for (let a = 0; a < L; a += 30) if (!inJ(js, a, 14)) rect(r, a, w / 2 - 1, 16, 2);
        p.fill({ color: 0xc9b25a, alpha: 0.85 });
      }
      // zebra crossings at every junction mouth, stop lines before them
      for (const [j0, j1] of js) for (const at of [j0 - 14, j1 + 2]) {
        if (at < 0 || at > L - 12) continue;
        for (let k = r.sidewalk + 3; k < w - r.sidewalk - 4; k += 8) rect(r, at, k, 12, 5);
      }
      p.fill({ color: 0xe8e4d4, alpha: 0.7 });
    }
    // manholes and drain grates
    for (const r of roads) for (let a = 60 + rnd() * 80; a < lenOf(r); a += 120 + rnd() * 120) {
      const across = r.sidewalk + 10 + rnd() * (widOf(r) - 2 * r.sidewalk - 20);
      const [x, y] = r.dir === 'h' ? [r.x + a, r.y + across] : [r.x + across, r.y + a];
      p.circle(x, y, 3.5);
    }
    p.fill({ color: 0x1e1f1b, alpha: 0.8 });

    this.renderer.render({ container: p, target: this.ground, clear: true });
    p.destroy();
  }

  /** Desert floor: grained sand, dirt tracks with tyre ruts, sand ridges lit from the north-west, ponds with reeds. */
  private paintDesert() {
    const { grid: g, tracks = [], ponds = [] } = this.level;
    const p = new Graphics(), rnd = Math.random;
    p.rect(0, 0, g.W, g.H).fill(0xc9a873);
    for (let k = 0; k < 260; k++) p.ellipse(rnd() * g.W, rnd() * g.H, 20 + rnd() * 60, 8 + rnd() * 20);
    p.fill({ color: 0xb8955f, alpha: 0.25 });
    for (let k = 0; k < 9000; k++) { const s2 = rnd() * 2 + 1; p.rect(rnd() * g.W, rnd() * g.H, s2, s2); }
    p.fill({ color: 0x7a5a32, alpha: 0.12 });
    for (let k = 0; k < 5000; k++) { const s2 = rnd() * 2 + 1; p.rect(rnd() * g.W, rnd() * g.H, s2, s2); }
    p.fill({ color: 0xfff0d0, alpha: 0.1 });
    // dirt tracks
    for (const tr of tracks) {
      p.moveTo(tr[0][0], tr[0][1]); for (const [x, y] of tr.slice(1)) p.lineTo(x, y);
      p.stroke({ width: 46, color: 0xa88a5c, join: 'round', cap: 'round' });
      for (const off of [-9, 9]) {
        const pts = tr.map(([x, y], k) => { const [nx, ny] = tr[Math.min(k + 1, tr.length - 1)], [px2, py2] = tr[Math.max(k - 1, 0)], a = Math.atan2(ny - py2, nx - px2); return [x - Math.sin(a) * off, y + Math.cos(a) * off]; });
        p.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts.slice(1)) p.lineTo(x, y);
        p.stroke({ width: 4, color: 0x8a6e45, alpha: 0.6, join: 'round', cap: 'round' });
      }
    }
    // oasis ponds: reed ring, water, glints
    for (const o of ponds) {
      p.ellipse(o.x, o.y, o.r + 14, (o.r + 14) * 0.75).fill(0x7d8a4a);
      p.ellipse(o.x, o.y, o.r + 4, (o.r + 4) * 0.75).fill(0x5f7a3c);
      p.ellipse(o.x, o.y, o.r, o.r * 0.75).fill(0x2f6a86);
      for (let k = 0; k < 20; k++) p.rect(o.x + (rnd() - 0.5) * o.r * 1.4, o.y + (rnd() - 0.5) * o.r, 6 + rnd() * 6, 1);
      p.fill({ color: 0xbfe2ee, alpha: 0.35 });
    }
    this.renderer.render({ container: p, target: this.ground, clear: true });
    p.destroy();
  }

  /** Highland valley floor: meadow with darker tussocks, dirt roads with ruts, streams with muddy banks, plank bridges. */
  private paintMountain() {
    const { grid: g, tracks = [], streams = [], bridges = [] } = this.level;
    const p = new Graphics(), rnd = Math.random;
    const line = (pts: [number, number][]) => { p.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts.slice(1)) p.lineTo(x, y); };
    p.rect(0, 0, g.W, g.H).fill(0x5f6e3b);
    for (let k = 0; k < 240; k++) p.ellipse(rnd() * g.W, rnd() * g.H, 20 + rnd() * 70, 10 + rnd() * 26);
    p.fill({ color: 0x748446, alpha: 0.3 });
    for (let k = 0; k < 160; k++) p.ellipse(rnd() * g.W, rnd() * g.H, 14 + rnd() * 40, 8 + rnd() * 18);
    p.fill({ color: 0x4b5a2e, alpha: 0.3 });
    for (let k = 0; k < 7000; k++) { const s2 = rnd() * 2 + 1; p.rect(rnd() * g.W, rnd() * g.H, s2, s2); }
    p.fill({ color: 0x33401f, alpha: 0.2 });
    for (let k = 0; k < 3000; k++) { const s2 = rnd() * 2 + 1; p.rect(rnd() * g.W, rnd() * g.H, s2, s2); }
    p.fill({ color: 0xc8d49a, alpha: 0.12 });
    for (const st of streams) {
      line(st.pts); p.stroke({ width: st.w + 16, color: 0x4a4a32, join: 'round', cap: 'round' });
      line(st.pts); p.stroke({ width: st.w, color: 0x2e5a70, join: 'round', cap: 'round' });
      line(st.pts); p.stroke({ width: st.w * 0.35, color: 0x3f7590, alpha: 0.7, join: 'round', cap: 'round' });
    }
    for (const tr of tracks) {
      line(tr); p.stroke({ width: 44, color: ROAD_TOP, join: 'round', cap: 'round' });
      for (const off of [-9, 9]) {
        const pts = tr.map(([x, y], k) => { const [nx, ny] = tr[Math.min(k + 1, tr.length - 1)], [px2, py2] = tr[Math.max(k - 1, 0)], a = Math.atan2(ny - py2, nx - px2); return [x - Math.sin(a) * off, y + Math.cos(a) * off] as [number, number]; });
        line(pts); p.stroke({ width: 4, color: 0x6e5f45, alpha: 0.55, join: 'round', cap: 'round' });
      }
    }
    for (const b of bridges) {
      p.rect(b.x, b.y, b.w, b.h).fill(0x7a5a36);
      const along = b.w < b.h; // planks run across the direction of travel
      if (along) for (let k = 3; k < b.h; k += 5) p.rect(b.x, b.y + k, b.w, 1); else for (let k = 3; k < b.w; k += 5) p.rect(b.x + k, b.y, 1, b.h);
      p.fill({ color: 0x3f2c19, alpha: 0.5 });
      if (along) p.rect(b.x - 3, b.y, 3, b.h).rect(b.x + b.w, b.y, 3, b.h); else p.rect(b.x, b.y - 3, b.w, 3).rect(b.x, b.y + b.h, b.w, 3);
      p.fill(0x4e3820);
    }
    this.renderer.render({ container: p, target: this.ground, clear: true });
    p.destroy();
  }

  /**
   * Ambient occlusion baked into the ground once: a soft dark skirt round the foot of every
   * building and wall, and at the base of cliffs. Free at run time.
   */
  private bakeAO() {
    const g = this.level.grid, { GW, GH } = g, p = new Graphics();
    const solid = (i: number) => Grid.isSolid(g.mat[i]) && g.mat[i] !== MAT.tree && g.mat[i] !== MAT.car && g.ht[i] >= 6;
    const inner: number[] = [], outer: number[] = [];
    for (let cy = 0; cy < GH; cy++) for (let cx = 0; cx < GW; cx++) {
      const i = cy * GW + cx;
      if (solid(i)) {
        const open = (cx > 0 && !solid(i - 1)) || (cx < GW - 1 && !solid(i + 1)) || (cy > 0 && !solid(i - GW)) || (cy < GH - 1 && !solid(i + GW));
        if (open) { inner.push(cx * C - 3, cy * C - 3); outer.push(cx * C - 7, cy * C - 7); }
      } else {
        // cliff base: this cell sits well below a neighbour
        const h = g.th[i], up = (j: number) => g.th[j] > h + STEP;
        if ((cx > 0 && up(i - 1)) || (cx < GW - 1 && up(i + 1)) || (cy > 0 && up(i - GW)) || (cy < GH - 1 && up(i + GW))) inner.push(cx * C - 2, cy * C - 2);
      }
    }
    for (let k = 0; k < outer.length; k += 2) p.rect(outer[k], outer[k + 1], C + 14, C + 14);
    p.fill({ color: 0x000000, alpha: 0.05 });
    for (let k = 0; k < inner.length; k += 2) p.rect(inner[k], inner[k + 1], C + 6, C + 6);
    p.fill({ color: 0x000000, alpha: 0.1 });
    this.renderer.render({ container: p, target: this.ground, clear: false });
    p.destroy();
  }

  /** Lot surface: paving, lawn, garden, dirt, car park, service yard, sports court or water. */
  private paintDecal(p: Graphics, d: Decal) {
    const { x, y, w, h } = d, rnd = Math.random, n = (per: number) => Math.ceil((w * h) / per);
    const scatter = (count: number, r0: number, r1: number) => { for (let k = 0; k < count; k++) p.circle(x + rnd() * w, y + rnd() * h, r0 + rnd() * (r1 - r0)); };
    switch (d.kind) {
      case 'paving':
        p.rect(x, y, w, h).fill(0x68665e);
        for (let k = 0; k < w; k += 20) p.rect(x + k, y, 1, h);
        for (let k = 0; k < h; k += 20) p.rect(x, y + k, w, 1);
        p.fill({ color: 0x000000, alpha: 0.1 });
        break;
      case 'grass':
        p.rect(x, y, w, h).fill(0x4a6a2f);
        scatter(n(120), 2, 7); p.fill({ color: 0x5f8040, alpha: 0.45 });
        scatter(n(200), 2, 5); p.fill({ color: 0x2f4521, alpha: 0.35 });
        p.rect(x, y, w, 2).rect(x, y, 2, h).fill({ color: 0x8a8778, alpha: 0.8 }); // kerb
        break;
      case 'garden':
        p.rect(x, y, w, h).fill(0x4b5e34);
        scatter(n(150), 1, 4); p.fill({ color: 0x627843, alpha: 0.45 });
        scatter(n(900), 1, 1.6); p.fill({ color: 0xe0c64a, alpha: 0.7 }); // flowers
        break;
      case 'dirt':
        p.rect(x, y, w, h).fill(0x5d4e3a);
        for (let k = 0; k < n(40); k++) { const s = rnd() * 3 + 1; p.rect(x + rnd() * w, y + rnd() * h, s, s); }
        p.fill({ color: 0x3e3326, alpha: 0.3 });
        break;
      case 'parking':
        p.rect(x, y, w, h).fill(0x45463f);
        for (let yy = y + 10; yy < y + h - 20; yy += 50) for (let xx = x + 15; xx < x + w; xx += 25) p.rect(xx, yy, 1.5, 30);
        p.fill({ color: 0xe8e4d4, alpha: 0.45 });
        break;
      case 'yard':
        p.rect(x, y, w, h).fill(0x585750);
        for (let k = 0; k < n(3000); k++) p.ellipse(x + rnd() * w, y + rnd() * h, rnd() * 10 + 4, rnd() * 6 + 3);
        p.fill({ color: 0x1b1a17, alpha: 0.18 }); // oil and water stains
        break;
      case 'court':
        p.rect(x, y, w, h).fill(0x3d6a58);
        p.rect(x + 8, y + 8, w - 16, h - 16).stroke({ color: 0xe8e4d4, width: 2, alpha: 0.8 });
        p.moveTo(x + w / 2, y + 8).lineTo(x + w / 2, y + h - 8).stroke({ color: 0xe8e4d4, width: 2, alpha: 0.8 });
        p.moveTo(x + w / 2 + 20, y + h / 2).arc(x + w / 2, y + h / 2, 20, 0, Math.PI * 2).stroke({ color: 0xe8e4d4, width: 2, alpha: 0.8 });
        break;
      case 'rail':
        // ballast, sleepers, two rails
        p.rect(x, y, w, h).fill(0x5a5246);
        for (let k = 0; k < w; k += 5) p.rect(x + k, y + 1, 2, h - 2);
        p.fill(0x4a3a2a);
        p.rect(x, y + h * 0.25, w, 1.5).rect(x, y + h * 0.7, w, 1.5).fill(0xb8b4a8);
        break;
      case 'water':
        p.rect(x - 2, y - 2, w + 4, h + 4).fill(0x9a978c);
        p.rect(x, y, w, h).fill(0x2f6a86);
        for (let k = 0; k < n(150); k++) p.rect(x + rnd() * (w - 8), y + rnd() * h, 6 + rnd() * 6, 1);
        p.fill({ color: 0xbfe2ee, alpha: 0.35 });
        break;
    }
  }

  /** Queue a debris speck or scorch mark to be stamped into the ground texture. */
  bakeRect(x: number, y: number, w: number, h: number, color: number, alpha = 0.9) {
    if (this.level.grid.solidAt(x, y)) return;
    this.bakeG.rect(x - w / 2, y - h / 2, w, h).fill({ color, alpha });
    this.bakeCount++;
  }
  bakeScorch(x: number, y: number, r: number) {
    if (this.level.grid.solidAt(x, y)) return;
    this.bakeG.circle(x, y, r).fill({ color: 0x0e0d0b, alpha: 0.22 });
    this.bakeG.circle(x, y, r * 0.55).fill({ color: 0x0e0d0b, alpha: 0.28 });
    this.bakeCount++;
  }

  // ---------------------------------------------------------------- buildings
  private buildStrip(r: number, s: number) {
    const g = this.level.grid, GW = g.GW, k = r * this.strips + s;
    const c0 = s * STRIP, c1 = Math.min(GW - 1, c0 + STRIP - 1), y = r * C, fy = (y + C) * K, last = r === g.GH - 1;
    let hasLow = false, hasBuild = false;
    for (let c = c0; c <= c1; c++) { const m = g.mat[r * GW + c]; if (m > RUBBLE) hasLow = true; else if (m) { hasBuild = true; hasLow = true; } if (g.th[r * GW + c]) { hasBuild = true; hasLow = true; } }

    // ground level: rubble and the shadow each building throws to the east
    let lg = this.low[k];
    if (hasLow) {
      if (!lg) { lg = this.low[k] = new Graphics(); this.groundLayer.addChild(lg); }
      lg.clear();
      let shadow = false;
      for (let c = c0; c <= c1; c++) {
        const i = r * GW + c, m = g.mat[i];
        if (m > RUBBLE) {
          const [a, b] = RUB[m - RUBBLE];
          lg.rect(c * C, y * K - 3 * ZS, C, C * K).fill(a);
          lg.rect(c * C + (i * 7) % 6, y * K - 3 * ZS + (i % 4), 3, 2).fill(b);
          lg.rect(c * C, fy - 3 * ZS, C, 3 * ZS).fill(b);
        } else if (g.th[i] && (c === GW - 1 || g.th[i + 1] + STEP < g.th[i])) {
          lg.rect((c + 1) * C, y * K - g.th[i + 1] * ZS, Math.min((g.th[i] - (c === GW - 1 ? 0 : g.th[i + 1])) * 0.5, 30), C * K + 0.5); shadow = true;
        } else if (m === MAT.tree) {
          lg.ellipse(c * C + C / 2 + g.ht[i] * 0.2, y * K + C * K / 2 + 2, g.ht[i] * 0.3, g.ht[i] * 0.18); shadow = true;
        } else if (Grid.isSolid(m) && (c === GW - 1 || g.lowerAt(i + 1, g.ht[i]))) {
          lg.rect((c + 1) * C, y * K, Math.min(g.ht[i] * 0.4, 40), C * K + 0.5); shadow = true;
        }
      }
      if (shadow) lg.fill({ color: 0x000000, alpha: 0.28 });
    } else if (lg) { lg.destroy(); this.low[k] = null; }

    let bg = this.builds[k];
    if (!hasBuild) { if (bg) { bg.destroy(); this.builds[k] = null; } return; }
    if (!bg) { bg = this.builds[k] = new Graphics(); bg.zIndex = (r + 1) * C; this.sorted.addChild(bg); }
    bg.clear();

    // ---- raised terrain first: stepped tops, slope and cliff faces, lit and shaded edges
    const mtn = this.level.biome === 'mountain';
    for (let c2 = c0; c2 <= c1; c2++) {
      const i = r * GW + c2, h = g.th[i];
      if (!h) continue;
      const x = c2 * C, top = y * K - h * ZS, rock = g.rock[i] === 1, road = g.rock[i] === 2, tone = hash(i) % 3;
      // soft ground stays one tone per height so slopes read as smooth; rock gets three
      const topCol = mtn ? (road ? ROAD_TOP : rock ? GREY_TOP[tone] : shade(GRASS_TOP, 1 + h / 260)) : rock ? ROCK_TOP[tone] : shade(SAND_TOP[0], 1 + h / 300);
      bg.rect(x, top, C + 0.5, C * K + 0.5).fill(topCol);
      const hs = last ? 0 : g.th[i + GW];
      if (hs < h) {
        const fh = (h - hs) * ZS, cliff = h - hs > STEP;
        bg.rect(x, fy - h * ZS, C + 0.5, fh + 0.5).fill(cliff ? (mtn ? (rock ? 0x625e55 : 0x6b6452) : rock ? 0x8a5534 : 0xa07d4c) : shade(topCol, 0.9));
        if (cliff) for (let ly = fy - h * ZS + 3; ly < fy - hs * ZS - 1; ly += 4) bg.rect(x + (hash(i + ly) % 3), ly, C - 2, 1).fill({ color: 0x000000, alpha: 0.18 }); // strata
      }
      if (r > 0 && g.th[i - GW] + STEP < h) bg.rect(x, top, C, 1.4).fill({ color: 0xfff4d8, alpha: 0.35 }); // only cliff rims get lit edges
      if (c2 > 0 && g.th[i - 1] + STEP < h) bg.rect(x, top, 1.2, C * K).fill({ color: 0xfff4d8, alpha: 0.2 });
      if (c2 < GW - 1 && g.th[i + 1] + STEP < h) bg.rect(x + C - 1.2, top, 1.2, C * K).fill({ color: 0x000000, alpha: 0.22 });
    }

    // ---- front faces where the row below is lower
    let c = c0;
    while (c <= c1) {
      const i = r * GW + c, m = g.mat[i];
      if (!Grid.isSolid(m)) { c++; continue; }
      const h = g.ht[i], t = g.tint[i];
      if (!(last || g.lowerAt(i + GW, h))) { c++; continue; }
      const st = c++;
      while (c <= c1) {
        const j = r * GW + c;
        if (g.mat[j] !== m || g.ht[j] !== h || g.tint[j] !== t || !(last || g.lowerAt(j + GW, h))) break;
        c++;
      }
      this.facade(bg, m as MaterialId, st * C, (c - st) * C, fy, h, t, g.tier[i], i);
    }

    // ---- roofs, cell by cell so edges get a parapet and interiors get clutter
    for (c = c0; c <= c1; c++) {
      const i = r * GW + c, m = g.mat[i];
      if (!Grid.isSolid(m)) continue;
      const h = g.ht[i], t = g.tint[i], x = c * C, ry = y * K - h * ZS, rh = C * K;
      if (m !== MAT.tree) bg.rect(x, ry, C + 0.5, rh + 0.5).fill(TOP[m][t]);
      const nN = r === 0 || g.lowerAt(i - GW, h), nS = last || g.lowerAt(i + GW, h);
      const nW = c === 0 || g.lowerAt(i - 1, h), nE = c === GW - 1 || g.lowerAt(i + 1, h);
      this.roofDetail(bg, m as MaterialId, x, ry, rh, i, g.tier[i], t, nN, nS, nW, nE, c, r);
    }
  }

  /** Wall face from roof edge down to the ground, dressed per material. */
  private facade(bg: Graphics, m: MaterialId, x0: number, w: number, fy: number, h: number, t: number, tier: number, i: number) {
    const top = fy - h * ZS, hh = h * ZS;
    if (m === MAT.tree && this.level.biome === 'desert' && h < 22) {
      // saguaro-style cactus: ribbed column with two arms
      for (let lx = x0 + C / 2; lx < x0 + w; lx += C) {
        bg.roundRect(lx - 3, top + 2, 6, hh - 2, 3).fill(0x4f7d3a).rect(lx - 1, top + 3, 1, hh - 4).fill({ color: 0xffffff, alpha: 0.15 });
        bg.roundRect(lx - 8, top + hh * 0.35, 4, hh * 0.3, 2).roundRect(lx + 4, top + hh * 0.2, 4, hh * 0.3, 2).fill(0x456e33);
      }
      return;
    }
    if (m === MAT.tree && this.level.biome === 'mountain') {
      // pines in 3/4 view: three stacked triangles of needles over a stub of trunk (1 in 5 is a leafy tree)
      for (let lx = x0 + C / 2, j = i; lx < x0 + w; lx += C, j++) {
        if (hash(j) % 5 === 0) { bg.rect(lx - 2, top + 4, 4, hh - 4).fill(0x5a3f26); continue; }
        bg.rect(lx - 1.5, fy - 6, 3, 6).fill(0x4a3420);
        const tiers = [[0.62, 1], [0.34, 0.8], [0.06, 0.58]] as const, hw = Math.min(11, hh * 0.27);
        for (const [f, s2] of tiers) {
          const ty = top + hh * f, base = Math.min(fy - 4, ty + hh * 0.42);
          bg.poly([lx, ty, lx + hw * s2 + 1, base + 1, lx - hw * s2 + 1, base + 1]).fill(0x1c2e1d);
          bg.poly([lx, ty, lx + hw * s2, base, lx - hw * s2, base]).fill(0x2f4d2d);
          bg.poly([lx, ty, lx - hw * s2 * 0.15, base, lx - hw * s2, base]).fill(0x3d6239);
        }
      }
      return;
    }
    if (m === MAT.tree) {
      // just the trunk; the crown is drawn with the roof pass
      for (let lx = x0 + C / 2; lx < x0 + w; lx += C) bg.rect(lx - 2, top + 4, 4, hh - 4).fill(0x5a3f26).rect(lx - 2, top + 4, 1.5, hh - 4).fill({ color: 0xffffff, alpha: 0.12 });
      return;
    }
    bg.rect(x0, top, w + 0.5, hh).fill(SIDE[m][t]);
    if (m === MAT.concrete) {
      // curtain-wall office block: floor bands and glass, a few lit panes, darker ground floor
      for (let fyy = top + 3; fyy + 8 < fy - 10; fyy += 12) {
        bg.rect(x0, fyy + 7, w, 1.2).fill({ color: 0xffffff, alpha: 0.08 });
        for (let wx = x0 + 2; wx + 6 <= x0 + w; wx += 8) {
          const lit = hash(i * 31 + wx * 7 + fyy) % 9 === 0;
          bg.rect(wx, fyy, 6, 8).fill(lit ? 0xb9c4a8 : tier === 3 ? 0x2f3d4a : 0x2a3039);
          bg.rect(wx, fyy, 6, 1).fill({ color: 0xd8e4ee, alpha: 0.25 });
        }
      }
      bg.rect(x0, fy - 10, w, 10).fill({ color: 0x000000, alpha: 0.25 });
    } else if (m === MAT.shophouse) {
      // tube house: each lot a different colour, shutters per storey, balcony rail, open shop front
      const lot = 20, fl = 12; // 4 m frontage, 3.2 m storeys on screen
      for (let lx = x0; lx < x0 + w - 1; lx += lot) {
        const lw = Math.min(lot, x0 + w - lx), hs = hash(i * 17 + lx);
        if (lx > x0) bg.rect(lx, top, 1, hh).fill({ color: 0x000000, alpha: 0.25 }); // party wall
        for (let fyy = top + 3; fyy + 7 < fy - 12; fyy += fl) {
          const lit = hash(hs + fyy) % 11 === 0;
          bg.rect(lx + 3, fyy, lw - 6, 6).fill(lit ? 0xd6c48a : 0x3a3a38);
          for (let sx = lx + 5; sx < lx + lw - 4; sx += 3) bg.rect(sx, fyy, 0.8, 6);
          bg.fill({ color: 0xffffff, alpha: 0.12 }); // shutter slats
          if (hash(hs + fyy * 3) % 3 === 0) bg.rect(lx + 2, fyy + 6, lw - 4, 1.5).fill(0x2c2c2c); // balcony rail
        }
        bg.rect(lx + 2, fy - 10, lw - 4, 10).fill(0x23211f); // open shop front
        bg.rect(lx + 1, fy - 12, lw - 2, 3).fill([0x3f6f8f, 0x9a3a32, 0x4f7f4a, 0xd0a83a, 0xe0dcd0][hs % 5]); // awning
      }
    } else if (m === MAT.shed) {
      for (let lx = x0 + 1; lx < x0 + w; lx += 3) bg.rect(lx, top, 1, hh);
      bg.fill({ color: 0x000000, alpha: 0.16 });
      for (let lx = x0 + 8; lx + 22 < x0 + w; lx += 50) {
        bg.rect(lx, fy - 20, 22, 20).fill(0x5a6268); // roller door
        for (let ly = fy - 19; ly < fy; ly += 2) bg.rect(lx, ly, 22, 0.7);
        bg.fill({ color: 0x000000, alpha: 0.25 });
      }
      bg.rect(x0, top + 3, w, 3).fill({ color: 0xc7d3d8, alpha: 0.35 }); // clerestory
    } else if (m === MAT.mud) {
      // adobe: plastered wall, small dark openings, a doorway, rough top edge
      for (let k = 0; k < w / 4; k++) bg.rect(x0 + (hash(i + k) % Math.max(1, w | 0)), top + (hash(i * 5 + k) % Math.max(1, hh | 0)), 2, 1.5);
      bg.fill({ color: 0x000000, alpha: 0.1 });
      for (let wx = x0 + 4; wx + 4 < x0 + w; wx += 12) if (hh > 10) bg.rect(wx, top + 3, 4, 4).fill(0x3a2a1a);
      if (w >= 10) bg.rect(x0 + w / 2 - 3, fy - 8, 6, 8).fill(0x2e2014);
    } else if (m === MAT.brick) {
      for (let ly = top + 2; ly < fy; ly += 3) bg.rect(x0, ly, w, 0.8);
      bg.fill({ color: 0x000000, alpha: 0.14 });
      for (let fyy = top + 4; fyy + 7 < fy - 6; fyy += 11)
        for (let wx = x0 + 3; wx + 4 <= x0 + w; wx += 9) bg.rect(wx - 0.6, fyy - 0.6, 5.2, 7.2).fill(0xa89884).rect(wx, fyy, 4, 6).fill(hash(i + wx * 13 + fyy) % 7 === 0 ? 0xc9b47a : 0x33292a);
      if (h > 20) bg.rect(x0, fy - 9, w, 2.5).fill([0x3f6f8f, 0x9a3a32, 0x4f7f4a, 0xd0a83a][hash(i) % 4]); // shop awning
    } else if (m === MAT.wood) {
      for (let lx = x0 + 2; lx < x0 + w; lx += 3) bg.rect(lx, top, 0.8, hh);
      bg.fill({ color: 0x000000, alpha: 0.18 });
      if (w >= 10) bg.rect(x0 + w / 2 - 2.5, fy - 7, 5, 7).fill(0x2a2118); // door
    } else if (m === MAT.steel) {
      for (let lx = x0 + 1; lx < x0 + w; lx += 2.5) bg.rect(lx, top, 1, hh);
      bg.fill({ color: 0x000000, alpha: 0.2 });
    } else if (m === MAT.stone) {
      for (let k = 0; k < w / 3; k++) bg.rect(x0 + (hash(i + k) % Math.max(1, w)), top + (hash(i * 3 + k) % Math.max(1, hh | 0)), 2, 2);
      bg.fill({ color: 0x000000, alpha: 0.2 });
    } else if (m === MAT.car) {
      bg.rect(x0 + 1, top + 1, w - 2, Math.min(4, hh / 2)).fill(0x22313b); // windows
      bg.rect(x0 + 2, fy - 2.5, 4, 2.5).rect(x0 + w - 6, fy - 2.5, 4, 2.5).fill(0x111111); // wheels
    }
    bg.rect(x0, top, w, 1.2).fill({ color: 0xfffae6, alpha: 0.16 });
    bg.rect(x0, fy - 1.5, w, 1.5).fill({ color: 0x000000, alpha: 0.4 });
  }

  /** Roof dressing: parapet rim on edges, clutter inside, texture per material. */
  private roofDetail(bg: Graphics, m: MaterialId, x: number, ry: number, rh: number, i: number, tier: number, t: number, nN: boolean, nS: boolean, nW: boolean, nE: boolean, cx: number, cy: number) {
    const hsh = hash(i), edge = nN || nS || nW || nE;
    if (m === MAT.concrete || m === MAT.brick || m === MAT.shophouse || m === MAT.mud) {
      if (nN) bg.rect(x, ry, C, 1.6);
      if (nW) bg.rect(x, ry, 1.6, rh);
      if (nN || nW) bg.fill({ color: 0xffffff, alpha: 0.18 });
      if (nS) bg.rect(x, ry + rh - 1.6, C, 1.6);
      if (nE) bg.rect(x + C - 1.6, ry, 1.6, rh);
      if (nS || nE) bg.fill({ color: 0x000000, alpha: 0.25 });
    }
    if (m === MAT.concrete && !edge) {
      // solar arrays come in 3×2 cell groups so they read as panels, not noise
      const group = hash(Math.floor(cx / 3) * 7919 + Math.floor(cy / 2) * 104729);
      if (t % 2 === 0 && group % 6 === 0) { bg.rect(x + 0.5, ry + 0.5, C - 1, rh - 1).fill(0x26365a).rect(x + 0.5, ry + rh / 2, C - 1, 0.6).fill({ color: 0x8aa6d6, alpha: 0.45 }); }
      else if (hsh % 29 === 0) { bg.rect(x + 2, ry + 1.5, 6, 4.5).fill(0xb6b8b4).circle(x + 5, ry + 3.7, 1.6).fill(0x55585b); } // AC unit
      else if (tier === 3 && hsh % 53 === 1) { bg.ellipse(x + 5, ry + rh / 2 + 1, 4.5, 3.6).fill({ color: 0x000000, alpha: 0.25 }).ellipse(x + 5, ry + rh / 2 - 0.5, 4.2, 3.3).fill(0xb8a888); } // water tank
    } else if (m === MAT.shophouse && !edge) {
      if (hsh % 13 === 0) { bg.ellipse(x + 5, ry + rh / 2 + 1, 3.6, 2.8).fill({ color: 0x000000, alpha: 0.25 }).ellipse(x + 5, ry + rh / 2 - 0.8, 3.4, 2.6).fill(0xc9ccd0); } // stainless water tank
      else if (hsh % 17 === 0) bg.rect(x + 2, ry + 2, 6, 4).fill(0xb6b8b4); // AC unit
      else if (hsh % 23 === 0) bg.rect(x + 1, ry + 1, 8, rh - 2).fill({ color: 0x8a5a3a, alpha: 0.6 }); // rooftop clutter
    } else if (m === MAT.shed) {
      for (let k = 1; k < C; k += 2.5) bg.rect(x + k, ry, 0.8, rh);
      bg.fill({ color: 0x000000, alpha: 0.12 });
      if (hsh % 7 === 0) bg.rect(x + 1, ry + 1, C - 2, rh - 2).fill({ color: 0xd8e6ea, alpha: 0.35 }); // skylight
    } else if (m === MAT.brick) {
      for (let k = 1.5; k < rh; k += 2.5) bg.rect(x, ry + k, C, 0.7);
      bg.fill({ color: 0x000000, alpha: 0.13 }); // roof tiles
    } else if (m === MAT.wood) {
      for (let k = 1; k < C; k += 2) bg.rect(x + k, ry, 0.7, rh);
      bg.fill({ color: 0x000000, alpha: 0.14 }); // corrugated sheet
    } else if (m === MAT.steel) {
      for (let k = 1; k < C; k += 2.5) bg.rect(x + k, ry, 0.8, rh);
      bg.fill({ color: 0xffffff, alpha: 0.1 });
    } else if (m === MAT.tree) {
      if (this.level.biome === 'desert' && this.level.grid.ht[i] < 22) { bg.circle(x + C / 2, ry + rh / 2 + 2, 3).fill(0x5d8f45); return; } // cactus top
      // symbolic crowns: four shapes, size from tree height, flat shading so they read at a glance
      const cxp = x + C / 2, cyp = ry + rh / 2, rr = this.level.grid.ht[i] * 0.3, col = TOP[m][t], kind = this.level.biome === 'desert' ? (hsh % 4 === 0 ? 0 : 2) : this.level.biome === 'mountain' ? (hsh % 5 === 0 ? 1 : 4) : hsh % 4; // desert: mostly date palms; mountains: mostly pines
      const dark = shade(col, 0.6), lit = shade(col, 1.25);
      if (kind === 0) { // broad round crown
        bg.circle(cxp + 1.5, cyp + 1.5, rr).fill(dark).circle(cxp, cyp, rr).fill(col).circle(cxp - rr * 0.3, cyp - rr * 0.3, rr * 0.45).fill(lit);
      } else if (kind === 1) { // clumped crown of three lobes
        const lobes: [number, number][] = [[-0.4, 0.15], [0.4, 0.2], [0, -0.35]];
        for (const [ox, oy] of lobes) bg.circle(cxp + ox * rr + 1.5, cyp + oy * rr + 1.5, rr * 0.65);
        bg.fill(dark);
        for (const [ox, oy] of lobes) bg.circle(cxp + ox * rr, cyp + oy * rr, rr * 0.65);
        bg.fill(col).circle(cxp - rr * 0.1, cyp - rr * 0.5, rr * 0.3).fill(lit);
      } else if (kind === 2) { // palm: star of fronds
        const pts: number[] = [], n = 7, rot = (hsh % 90) / 30;
        for (let k = 0; k < n * 2; k++) { const a = rot + (k * Math.PI) / n, r2 = k % 2 ? rr * 0.25 : rr * 1.05; pts.push(cxp + Math.cos(a) * r2, cyp + Math.sin(a) * r2 * 0.85); }
        bg.poly(pts.map((v) => v + 1.5)).fill(dark).poly(pts).fill(shade(col, 1.1)).circle(cxp, cyp, rr * 0.18).fill(0x6b5a2a);
      } else if (kind === 4) { // pine: the facade pass drew it whole; only a pine hidden behind another needs a crown
        if (nS) return;
        const n = 10, rot = (hsh % 60) / 20, star = (r0: number, r1: number, dx = 0) => { const pts: number[] = []; for (let k = 0; k < n * 2; k++) { const a = rot + (k * Math.PI) / n, r2 = k % 2 ? r0 : r1; pts.push(cxp + dx + Math.cos(a) * r2, cyp + dx + Math.sin(a) * r2 * 0.9); } return pts; };
        bg.poly(star(rr * 0.75, rr, 1.5)).fill(0x1c2e1d).poly(star(rr * 0.75, rr)).fill(0x2f4d2d).poly(star(rr * 0.4, rr * 0.6)).fill(0x3d6239).circle(cxp - 0.5, cyp - 0.5, rr * 0.18).fill(0x5d8452);
      } else { // small dense ornamental tree, darker leaves
        const r3 = rr * 0.75, c2 = shade(col, 0.82);
        bg.circle(cxp + 1.2, cyp + 1.2, r3).fill(shade(c2, 0.6)).circle(cxp, cyp, r3).fill(c2).circle(cxp - r3 * 0.3, cyp - r3 * 0.35, r3 * 0.4).fill(shade(c2, 1.25));
      }
    } else if (m === MAT.car) {
      bg.rect(x + 1.5, ry + 1, C - 3, rh - 2).fill({ color: 0xffffff, alpha: 0.12 });
      if (hsh % 3 === 0) bg.rect(x + 1.5, ry + rh / 2 - 1, C - 3, 2).fill(0x22313b); // windscreen
    }
  }

  /** Rebuild strips touched by destruction, flush baked marks, cull off-screen strips. */
  update(viewX0: number, viewX1: number, viewY0: number, viewY1: number) {
    const g = this.level.grid;
    if (g.dirtyRows.size) {
      for (const r of g.dirtyRows) if (r >= 0 && r < g.GH) for (let s = 0; s < this.strips; s++) this.buildStrip(r, s);
      g.dirtyRows.clear();
    }
    if (this.bakeCount) {
      this.renderer.render({ container: this.bakeG, target: this.ground, clear: false });
      this.bakeG.clear();
      this.bakeCount = 0;
    }
    // cull: rows whose projected band intersects the view (tall fronts reach ~80 units up)
    const r0 = Math.floor((viewY0 - 20) / K / C) - 1, r1 = Math.ceil((viewY1 + 150 * ZS) / K / C);
    const s0 = Math.floor((viewX0 - 45) / C / STRIP), s1 = Math.floor((viewX1 + 20) / C / STRIP);
    for (let r = 0; r < g.GH; r++) {
      const rowVis = r >= r0 && r <= r1;
      for (let s = 0; s < this.strips; s++) {
        const vis = rowVis && s >= s0 && s <= s1, k = r * this.strips + s;
        const b = this.builds[k], lo = this.low[k];
        if (b) b.visible = vis;
        if (lo) lo.visible = vis;
      }
    }
  }

  /** Is the unit at ground (x, y) hidden behind a building in front of it? */
  occluded(x: number, y: number) {
    const g = this.level.grid, pr = (y / C) | 0, pc = (x / C) | 0;
    for (let rr = pr + 1; rr <= Math.min(g.GH - 1, pr + 16); rr++)
      for (let cc = pc - 2; cc <= pc + 2; cc++) {
        if (cc < 0 || cc >= g.GW) continue;
        const j = rr * g.GW + cc;
        if (Grid.isSolid(g.mat[j]) && g.mat[j] !== MAT.tree && g.ht[j] > 14 && rr * C * K - g.ht[j] * ZS < y * K + 6) return true;
      }
    return false;
  }
}
