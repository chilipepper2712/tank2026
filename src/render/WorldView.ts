import { Container, Graphics, RenderTexture, Sprite, type Renderer } from 'pixi.js';
import { C, K, MAT, MATERIALS, ZS, type MaterialId } from '../config';
import { shade } from '../util';
import { Grid } from '../world/Grid';
import type { Block, Level } from '../world/level1';

const STRIP = 30; // columns per building strip
const TINTS = [0.9, 0.96, 1.03, 1.1];
const mats = Object.entries(MATERIALS) as [string, (typeof MATERIALS)[MaterialId]][];
const TOP = Object.fromEntries(mats.map(([k, m]) => [k, (m.palette ?? TINTS.map((f) => shade(m.top, f))).slice()])) as Record<string, number[]>;
const SIDE = Object.fromEntries(mats.map(([k, m]) => [k, m.palette ? m.palette.map((c) => shade(c, 0.62)) : TINTS.map((f) => shade(m.side, f))])) as Record<string, number[]>;
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
    const gs = new Sprite(this.ground);
    gs.scale.y = K;
    this.groundLayer.addChild(gs);
    this.root.addChild(this.groundLayer, this.sorted, this.overlay);
    for (let r = 0; r < g.GH; r++) for (let s = 0; s < this.strips; s++) this.buildStrip(r, s);
  }

  // ---------------------------------------------------------------- ground
  private paintGround() {
    const { grid: g, blocks, road, block } = this.level;
    const p = new Graphics();
    const period = block + road;
    // asphalt with grain
    p.rect(0, 0, g.W, g.H).fill(0x34362f);
    for (let k = 0; k < 7000; k++) { const s = Math.random() * 3 + 1; p.rect(Math.random() * g.W, Math.random() * g.H, s, s); }
    p.fill({ color: 0x000000, alpha: 0.12 });
    for (let k = 0; k < 4000; k++) { const s = Math.random() * 2 + 1; p.rect(Math.random() * g.W, Math.random() * g.H, s, s); }
    p.fill({ color: 0xfffff0, alpha: 0.04 });
    // sidewalks along every road edge, tiled, with a darker curb
    const SW = 12;
    for (let j = 0; j * period <= g.H; j++) {
      const y0 = j * period;
      for (const y of [y0, y0 + road - SW]) p.rect(0, y, g.W, SW);
    }
    for (let i = 0; i * period <= g.W; i++) {
      const x0 = i * period;
      for (const x of [x0, x0 + road - SW]) p.rect(x, 0, SW, g.H);
    }
    p.fill(0x6e6c62);
    for (let j = 0; j * period <= g.H; j++) {
      const y0 = j * period;
      for (let x = 0; x < g.W; x += 10) { p.rect(x, y0, 1, SW); p.rect(x, y0 + road - SW, 1, SW); }
      p.rect(0, y0 + SW, g.W, 2); p.rect(0, y0 + road - SW - 2, g.W, 2);
    }
    for (let i = 0; i * period <= g.W; i++) {
      const x0 = i * period;
      for (let y = 0; y < g.H; y += 10) { p.rect(x0, y, SW, 1); p.rect(x0 + road - SW, y, SW, 1); }
      p.rect(x0 + SW, 0, 2, g.H); p.rect(x0 + road - SW - 2, 0, 2, g.H);
    }
    p.fill({ color: 0x000000, alpha: 0.22 });
    // junction squares are plain asphalt again, kerbs only around them
    for (let j = 0; j * period <= g.H; j++) for (let i = 0; i * period <= g.W; i++) p.rect(i * period + SW + 2, j * period + SW + 2, road - 2 * SW - 4, road - 2 * SW - 4);
    p.fill(0x34362f);
    // lane markings: dashed centre line, solid edge lines, zebra crossings at every junction mouth
    for (let j = 0; j * period <= g.H; j++) {
      const yc = j * period + road / 2;
      for (let x = 0; x < g.W; x += 40) if ((x % period) > road + 14 && (x % period) < period - 34) p.rect(x, yc - 1.5, 22, 3);
    }
    for (let i = 0; i * period <= g.W; i++) {
      const xc = i * period + road / 2;
      for (let y = 0; y < g.H; y += 40) if ((y % period) > road + 14 && (y % period) < period - 34) p.rect(xc - 1.5, y, 3, 22);
    }
    p.fill(0xc9b25a);
    for (let j = 0; j * period <= g.H; j++) for (let i = 0; i * period <= g.W; i++) {
      const x0 = i * period, y0 = j * period;
      for (let k = SW + 4; k < road - SW - 4; k += 8) {
        p.rect(x0 + road + 2, y0 + k, 12, 5); p.rect(x0 - 14, y0 + k, 12, 5); // east / west mouths
        p.rect(x0 + k, y0 + road + 2, 5, 12); p.rect(x0 + k, y0 - 14, 5, 12); // south / north mouths
      }
    }
    p.fill({ color: 0xe8e4d4, alpha: 0.75 });
    // manholes
    for (let k = 0; k < 40; k++) {
      const onH = Math.random() < 0.5, line = Math.floor(Math.random() * ((onH ? g.H : g.W) / period + 1)) * period + road / 2 + (Math.random() < 0.5 ? -20 : 20);
      const along = Math.random() * (onH ? g.W : g.H);
      p.circle(onH ? along : line, onH ? line : along, 4);
    }
    p.fill({ color: 0x1e1f1b, alpha: 0.8 });

    for (const b of blocks) this.paintLot(p, b, block);
    this.renderer.render({ container: p, target: this.ground, clear: true });
    p.destroy();
  }

  /** Ground inside a city block: plaza paving, yards, dirt, container yard or park. */
  private paintLot(p: Graphics, b: Block, size: number) {
    const x = b.x, y = b.y, rnd = Math.random;
    p.rect(x, y, size, size).fill(0x585750); // low kerb wall
    const ix = x + 6, iy = y + 6, iw = size - 12;
    if (b.type === 'park') {
      p.rect(ix, iy, iw, iw).fill(0x45602f);
      for (let k = 0; k < 260; k++) { const r = rnd() * 7 + 2; p.circle(ix + rnd() * iw, iy + rnd() * iw, r); }
      p.fill({ color: 0x5d7a3a, alpha: 0.45 });
      for (let k = 0; k < 200; k++) { const r = rnd() * 5 + 2; p.circle(ix + rnd() * iw, iy + rnd() * iw, r); }
      p.fill({ color: 0x2f4521, alpha: 0.4 });
      p.rect(ix, iy + iw / 2 - 6, iw, 12).rect(ix + iw / 2 - 6, iy, 12, iw).fill(0x8a7f63); // footpaths
      for (let k = 0; k < 30; k++) p.circle(ix + rnd() * iw, iy + rnd() * iw, 1.5);
      p.fill({ color: 0xe0c64a, alpha: 0.8 }); // flowers
    } else if (b.type === 'yard') {
      p.rect(ix, iy, iw, iw).fill(0x55554d);
      for (let k = 0; k < iw; k += 34) p.rect(ix + k, iy + 4, 2, iw - 8);
      p.fill({ color: 0xc9b25a, alpha: 0.5 }); // painted bay lines
      for (let k = 0; k < 14; k++) p.ellipse(ix + rnd() * iw, iy + rnd() * iw, rnd() * 10 + 4, rnd() * 6 + 3);
      p.fill({ color: 0x1b1a17, alpha: 0.25 }); // oil stains
    } else if (b.type === 'shanty') {
      p.rect(ix, iy, iw, iw).fill(0x5a4c38);
      for (let k = 0; k < 500; k++) { const s = rnd() * 3 + 1; p.rect(ix + rnd() * iw, iy + rnd() * iw, s, s); }
      p.fill({ color: 0x3e3326, alpha: 0.35 });
    } else if (b.type === 'houses') {
      p.rect(ix, iy, iw, iw).fill(0x4b5a36);
      for (let k = 0; k < 200; k++) { const r = rnd() * 4 + 1; p.circle(ix + rnd() * iw, iy + rnd() * iw, r); }
      p.fill({ color: 0x5f6f40, alpha: 0.4 });
    } else {
      p.rect(ix, iy, iw, iw).fill(0x5d5c55);
      for (let k = 0; k < iw; k += 20) { p.rect(ix + k, iy, 1, iw); p.rect(ix, iy + k, iw, 1); }
      p.fill({ color: 0x000000, alpha: 0.12 }); // plaza paving grid
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
    for (let c = c0; c <= c1; c++) { const m = g.mat[r * GW + c]; if (m > 10) hasLow = true; else if (m) { hasBuild = true; hasLow = true; } }

    // ground level: rubble and the shadow each building throws to the east
    let lg = this.low[k];
    if (hasLow) {
      if (!lg) { lg = this.low[k] = new Graphics(); this.groundLayer.addChild(lg); }
      lg.clear();
      let shadow = false;
      for (let c = c0; c <= c1; c++) {
        const i = r * GW + c, m = g.mat[i];
        if (m > 10) {
          const [a, b] = RUB[m - 10];
          lg.rect(c * C, y * K - 3 * ZS, C, C * K).fill(a);
          lg.rect(c * C + (i * 7) % 6, y * K - 3 * ZS + (i % 4), 3, 2).fill(b);
          lg.rect(c * C, fy - 3 * ZS, C, 3 * ZS).fill(b);
        } else if (Grid.isSolid(m) && (c === GW - 1 || g.lowerAt(i + 1, g.ht[i]))) {
          lg.rect((c + 1) * C, y * K, Math.min(g.ht[i] * 0.45, 26), C * K + 0.5); shadow = true;
        }
      }
      if (shadow) lg.fill({ color: 0x000000, alpha: 0.28 });
    } else if (lg) { lg.destroy(); this.low[k] = null; }

    let bg = this.builds[k];
    if (!hasBuild) { if (bg) { bg.destroy(); this.builds[k] = null; } return; }
    if (!bg) { bg = this.builds[k] = new Graphics(); bg.zIndex = (r + 1) * C; this.sorted.addChild(bg); }
    bg.clear();

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
    bg.rect(x0, top, w + 0.5, hh).fill(SIDE[m][t]);
    if (m === MAT.concrete) {
      // curtain-wall office block: floor bands and glass, a few lit panes, darker ground floor
      for (let fyy = top + 3; fyy + 8 < fy - 8; fyy += 10) {
        bg.rect(x0, fyy + 7, w, 1.2).fill({ color: 0xffffff, alpha: 0.08 });
        for (let wx = x0 + 2; wx + 6 <= x0 + w; wx += 8) {
          const lit = hash(i * 31 + wx * 7 + fyy) % 9 === 0;
          bg.rect(wx, fyy, 6, 6).fill(lit ? 0xb9c4a8 : tier === 3 ? 0x2f3d4a : 0x2a3039);
          bg.rect(wx, fyy, 6, 1).fill({ color: 0xd8e4ee, alpha: 0.25 });
        }
      }
      bg.rect(x0, fy - 8, w, 8).fill({ color: 0x000000, alpha: 0.25 });
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
    } else if (m === MAT.tree) {
      if (w <= 30) bg.rect(x0 + w / 2 - 1.5, fy - Math.min(hh, 8), 3, Math.min(hh, 8)).fill(0x5a3f26); // trunk
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
    if (m === MAT.concrete || m === MAT.brick) {
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
      // canopy: overlapping discs per cell give a round crown; dark rim, lit top-left, leaf specks
      const cxp = x + C / 2, cyp = ry + rh / 2;
      bg.ellipse(cxp + 0.8, cyp + 0.8, 7.2, 6.2).fill(0x2a4a1f);
      bg.ellipse(cxp, cyp, 6.6, 5.6).fill(TOP[m][t]);
      bg.ellipse(cxp - 1.6, cyp - 1.4, 3.6, 3).fill({ color: 0x8fbf5e, alpha: 0.45 });
      bg.rect(cxp - 3 + (hsh % 6), cyp - 2 + ((hsh >> 3) % 4), 1.6, 1.6).fill({ color: 0xb6dc84, alpha: 0.7 });
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
    const r0 = Math.floor(viewY0 / K / C) - 1, r1 = Math.ceil((viewY1 + 80 * ZS) / K / C);
    const s0 = Math.floor((viewX0 - 30) / C / STRIP), s1 = Math.floor(viewX1 / C / STRIP);
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
    for (let rr = pr + 1; rr <= Math.min(g.GH - 1, pr + 10); rr++)
      for (let cc = pc - 2; cc <= pc + 2; cc++) {
        if (cc < 0 || cc >= g.GW) continue;
        const j = rr * g.GW + cc;
        if (Grid.isSolid(g.mat[j]) && g.ht[j] > 14 && rr * C * K - g.ht[j] * ZS < y * K + 6) return true;
      }
    return false;
  }
}
