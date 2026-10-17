import { Container, Graphics, Sprite, type Renderer, type Texture } from 'pixi.js';
import { K, ZS } from '../config';
import type { Grid } from '../world/Grid';
import type { WorldView } from './WorldView';

export const P = { Chunk: 0, Spark: 1, Smoke: 2, Fire: 3, Splinter: 4, Dust: 5 } as const;
export type PType = (typeof P)[keyof typeof P];

const N = 700;

/**
 * Fixed pool of debris, sparks, smoke and fire. Chunks bounce off the ground and walls,
 * then get stamped into the ground texture when they expire, so settled debris costs nothing.
 */
export class Particles {
  private x = new Float32Array(N); private y = new Float32Array(N); private z = new Float32Array(N);
  private vx = new Float32Array(N); private vy = new Float32Array(N); private vz = new Float32Array(N);
  private life = new Float32Array(N); private max = new Float32Array(N); private size = new Float32Array(N);
  private type = new Uint8Array(N); private color = new Uint32Array(N);
  private sprites: Sprite[] = [];
  private head = 0;
  alive = 0;

  constructor(renderer: Renderer, layer: Container, private grid: Grid, private view: WorldView) {
    const sq = renderer.generateTexture(new Graphics().rect(0, 0, 4, 4).fill(0xffffff));
    const dot = renderer.generateTexture(new Graphics().circle(16, 16, 16).fill(0xffffff));
    for (let i = 0; i < N; i++) {
      const s = new Sprite(sq as Texture);
      s.anchor.set(0.5);
      s.visible = false;
      (s as Sprite & { round: Texture; square: Texture }).round = dot;
      (s as Sprite & { round: Texture; square: Texture }).square = sq;
      layer.addChild(s);
      this.sprites.push(s);
    }
  }

  emit(t: PType, x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, size: number, color: number) {
    const i = this.head; this.head = (this.head + 1) % N;
    this.x[i] = x; this.y[i] = y; this.z[i] = z; this.vx[i] = vx; this.vy[i] = vy; this.vz[i] = vz;
    this.life[i] = life; this.max[i] = life; this.size[i] = size; this.type[i] = t; this.color[i] = color;
    const s = this.sprites[i] as Sprite & { round: Texture; square: Texture };
    s.texture = t === P.Smoke || t === P.Fire || t === P.Dust ? s.round : s.square;
    s.tint = color;
  }

  update(dt: number) {
    const g = this.grid, fr = Math.pow(0.02, dt), frs = Math.pow(0.3, dt);
    let alive = 0;
    for (let i = 0; i < N; i++) {
      const s = this.sprites[i];
      if (this.life[i] <= 0) { if (s.visible) s.visible = false; continue; }
      this.life[i] -= dt; alive++;
      const t = this.type[i];
      if (t === P.Chunk || t === P.Splinter) {
        if (this.z[i] > 0 || this.vz[i] > 0) {
          this.vz[i] -= 800 * dt;
          const nx = this.x[i] + this.vx[i] * dt, ny = this.y[i] + this.vy[i] * dt, ci = g.idx(nx, ny);
          if (ci >= 0 && g.mat[ci] >= 1 && g.mat[ci] < 10 && this.z[i] < g.ht[ci]) { this.vx[i] *= -0.3; this.vy[i] *= -0.3; }
          else { this.x[i] = nx; this.y[i] = ny; }
          this.z[i] += this.vz[i] * dt;
          if (this.z[i] <= 0) {
            this.z[i] = 0;
            if (this.vz[i] < -90) { this.vz[i] *= -0.32; this.vx[i] *= 0.55; this.vy[i] *= 0.55; } else this.vz[i] = 0;
          }
          const cj = g.idx(this.x[i], this.y[i]);
          if (cj >= 0 && g.mat[cj] >= 1 && g.mat[cj] < 10 && this.z[i] < g.ht[cj] - 2) { this.life[i] = 0; s.visible = false; continue; }
        } else { this.x[i] += this.vx[i] * dt; this.y[i] += this.vy[i] * dt; this.vx[i] *= fr; this.vy[i] *= fr; }
        if (this.life[i] <= 0) {
          const sz = this.size[i];
          if (t === P.Splinter) this.view.bakeRect(this.x[i], this.y[i], sz * 3.2, sz, this.color[i]);
          else this.view.bakeRect(this.x[i], this.y[i], sz, sz, this.color[i]);
          s.visible = false; continue;
        }
      } else if (t === P.Spark) {
        this.vz[i] -= 500 * dt; this.x[i] += this.vx[i] * dt; this.y[i] += this.vy[i] * dt; this.z[i] += this.vz[i] * dt;
        if (this.z[i] < 0) { this.life[i] = 0; s.visible = false; continue; }
      } else if (t === P.Smoke) {
        this.x[i] += this.vx[i] * dt; this.y[i] += this.vy[i] * dt; this.z[i] += this.vz[i] * dt; this.size[i] += 12 * dt;
      } else if (t === P.Fire) {
        this.x[i] += this.vx[i] * dt; this.y[i] += this.vy[i] * dt; this.z[i] += this.vz[i] * dt; this.size[i] *= 1 - 1.6 * dt;
      } else {
        this.x[i] += this.vx[i] * dt; this.y[i] += this.vy[i] * dt; this.vx[i] *= frs; this.vy[i] *= frs; this.size[i] += 16 * dt;
      }
      // project and style
      const k = this.life[i] / this.max[i], sz = this.size[i];
      s.visible = true;
      s.x = this.x[i];
      s.y = this.y[i] * K - this.z[i] * ZS;
      s.zIndex = this.y[i];
      if (t === P.Splinter) { s.width = sz * 3.2; s.height = sz; s.alpha = 1; }
      else if (t === P.Chunk) { s.width = sz; s.height = sz; s.alpha = 1; }
      else if (t === P.Spark) { s.width = 2.4; s.height = 2.4; s.alpha = k; }
      else { const d = Math.max(1, sz * 2); s.width = d; s.height = d; s.alpha = t === P.Fire ? Math.min(1, k * 1.4) : k * 0.45; }
    }
    this.alive = alive;
  }
}
