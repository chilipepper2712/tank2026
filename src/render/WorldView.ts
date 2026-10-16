import { Container, Graphics, RenderTexture, Sprite, type Renderer } from 'pixi.js';
import { C, K, MATERIALS, ZS, type MaterialId } from '../config';
import { shade } from '../util';
import { Grid } from '../world/Grid';
import type { Level } from '../world/level1';

const STRIP = 30; // columns per building strip
const TINTS = [0.9, 0.96, 1.03, 1.1];
const TOP = Object.fromEntries(Object.entries(MATERIALS).map(([k, m]) => [k, TINTS.map((f) => shade(m.top, f))])) as Record<string, number[]>;
const SIDE = Object.fromEntries(Object.entries(MATERIALS).map(([k, m]) => [k, TINTS.map((f) => shade(m.side, f))])) as Record<string, number[]>;
const RUB = Object.fromEntries(Object.entries(MATERIALS).map(([k, m]) => [k, [shade(m.top, 0.66), shade(m.top, 0.46)]])) as Record<string, number[]>;

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
  private rubble: (Graphics | null)[];
  private builds: (Graphics | null)[];
  private bakeG = new Graphics();
  private bakeCount = 0;
  private readonly strips: number;

  constructor(private renderer: Renderer, private level: Level) {
    const g = level.grid;
    this.strips = Math.ceil(g.GW / STRIP);
    this.rubble = new Array(g.GH * this.strips).fill(null);
    this.builds = new Array(g.GH * this.strips).fill(null);
    this.ground = RenderTexture.create({ width: g.W, height: g.H, resolution: 1 });
    this.paintGround();
    const gs = new Sprite(this.ground);
    gs.scale.y = K;
    this.groundLayer.addChild(gs);
    this.root.addChild(this.groundLayer, this.sorted, this.overlay);
    for (let r = 0; r < g.GH; r++) for (let s = 0; s < this.strips; s++) this.buildStrip(r, s);
  }

  private paintGround() {
    const { grid: g, blocks, road, block } = this.level;
    const p = new Graphics();
    p.rect(0, 0, g.W, g.H).fill(0x30322c);
    for (const b of blocks) {
      p.rect(b.x, b.y, block, block).fill(0x4f5048);
      p.rect(b.x + 10, b.y + 10, block - 20, block - 20).fill(b.type === 'park' ? 0x3b4a2e : b.type === 'yard' ? 0x47473f : 0x43443c);
    }
    for (let y = road / 2; y < g.H; y += block + road) for (let x = 0; x < g.W; x += 44) p.rect(x, y - 1, 22, 2);
    for (let x = road / 2; x < g.W; x += block + road) for (let y = 0; y < g.H; y += 44) p.rect(x - 1, y, 2, 22);
    p.fill(0x6d6950);
    for (let k = 0; k < 4000; k++) { const s = Math.random() * 3 + 1; p.rect(Math.random() * g.W, Math.random() * g.H, s, s); }
    p.fill({ color: 0x000000, alpha: 0.09 });
    for (let k = 0; k < 4000; k++) { const s = Math.random() * 3 + 1; p.rect(Math.random() * g.W, Math.random() * g.H, s, s); }
    p.fill({ color: 0xfffff0, alpha: 0.035 });
    this.renderer.render({ container: p, target: this.ground, clear: true });
    p.destroy();
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

  private buildStrip(r: number, s: number) {
    const g = this.level.grid, GW = g.GW, k = r * this.strips + s;
    const c0 = s * STRIP, c1 = Math.min(GW - 1, c0 + STRIP - 1), y = r * C, fy = (y + C) * K, last = r === g.GH - 1;
    let hasRubble = false, hasBuild = false;
    for (let c = c0; c <= c1; c++) { const m = g.mat[r * GW + c]; if (m > 10) hasRubble = true; else if (m) hasBuild = true; }

    // rubble: low decal on the ground layer, never hides units
    let rg = this.rubble[k];
    if (hasRubble) {
      if (!rg) { rg = this.rubble[k] = new Graphics(); this.groundLayer.addChild(rg); }
      rg.clear();
      for (let c = c0; c <= c1; c++) {
        const i = r * GW + c, m = g.mat[i];
        if (m <= 10) continue;
        const [a, b] = RUB[m - 10];
        rg.rect(c * C, y * K - 3 * ZS, C, C * K).fill(a);
        rg.rect(c * C + (i * 7) % 6, y * K - 3 * ZS + (i % 4), 3, 2).fill(b);
        rg.rect(c * C, fy - 3 * ZS, C, 3 * ZS).fill(b);
      }
    } else if (rg) { rg.destroy(); this.rubble[k] = null; }

    let bg = this.builds[k];
    if (!hasBuild) { if (bg) { bg.destroy(); this.builds[k] = null; } return; }
    if (!bg) { bg = this.builds[k] = new Graphics(); bg.zIndex = (r + 1) * C; this.sorted.addChild(bg); }
    bg.clear();
    // front faces where the row below is lower
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
      const x0 = st * C, w = (c - st) * C, top = fy - h * ZS;
      bg.rect(x0, top, w + 0.5, h * ZS).fill(SIDE[m][t]);
      const win = MATERIALS[m as MaterialId].windows;
      if (win !== undefined && h > 20) {
        for (let wy = top + 5; wy + 6 < fy - 3; wy += 12) for (let wx = x0 + 3; wx + 4 < x0 + w; wx += 10) bg.rect(wx, wy, 4, 6);
        bg.fill(win);
      }
      bg.rect(x0, top, w, 1.2).fill({ color: 0xfffae6, alpha: 0.14 });
      bg.rect(x0, fy - 1.5, w, 1.5).fill({ color: 0x000000, alpha: 0.35 });
    }
    // roofs
    c = c0;
    while (c <= c1) {
      const i = r * GW + c, m = g.mat[i];
      if (!Grid.isSolid(m)) { c++; continue; }
      const t = g.tint[i], h = g.ht[i], st = c;
      while (c <= c1 && g.mat[r * GW + c] === m && g.tint[r * GW + c] === t && g.ht[r * GW + c] === h) c++;
      bg.rect(st * C, y * K - h * ZS, (c - st) * C + 0.5, C * K + 0.5).fill(TOP[m][t]);
    }
    // roof edge highlight where the row behind is lower
    let any = false;
    for (c = c0; c <= c1; c++) {
      const i = r * GW + c;
      if (!Grid.isSolid(g.mat[i])) continue;
      if (r === 0 || g.lowerAt(i - GW, g.ht[i])) { bg.rect(c * C, y * K - g.ht[i] * ZS, C, 1.5); any = true; }
    }
    if (any) bg.fill({ color: 0xfffceb, alpha: 0.2 });
  }

  /** Rebuild strips touched by destruction, flush baked marks, cull off-screen strips. */
  update(viewX0: number, viewX1: number, viewY0: number, viewY1: number) {
    const g = this.level.grid;
    if (g.dirtyRows.size) {
      const sMin = 0, sMax = this.strips - 1;
      for (const r of g.dirtyRows) if (r >= 0 && r < g.GH) for (let s = sMin; s <= sMax; s++) this.buildStrip(r, s);
      g.dirtyRows.clear();
    }
    if (this.bakeCount) {
      this.renderer.render({ container: this.bakeG, target: this.ground, clear: false });
      this.bakeG.clear();
      this.bakeCount = 0;
    }
    // cull: rows whose projected band intersects the view (tall fronts reach ~80 units up)
    const r0 = Math.floor(viewY0 / K / C) - 1, r1 = Math.ceil((viewY1 + 80 * ZS) / K / C);
    const s0 = Math.floor(viewX0 / C / STRIP), s1 = Math.floor(viewX1 / C / STRIP);
    for (let r = 0; r < g.GH; r++) {
      const rowVis = r >= r0 && r <= r1;
      for (let s = 0; s < this.strips; s++) {
        const vis = rowVis && s >= s0 && s <= s1, k = r * this.strips + s;
        const b = this.builds[k], rb = this.rubble[k];
        if (b) b.visible = vis;
        if (rb) rb.visible = vis;
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
        if (Grid.isSolid(g.mat[j]) && rr * C * K - g.ht[j] * ZS < y * K + 6) return true;
      }
    return false;
  }
}
