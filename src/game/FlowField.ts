import { C } from '../config';
import type { Grid } from '../world/Grid';

const FC = 20; // coarse cell (2×2 world cells)

/**
 * Breadth-first distance field from the player over a coarse grid. Cells next to walls count
 * as blocked so tanks keep clear of corners. Enemies walk downhill on it. Rebuilt when the
 * player changes cell or buildings get destroyed.
 */
export class FlowField {
  readonly FW: number;
  readonly FH: number;
  private dist: Int32Array;
  private open: Uint8Array;
  private queue: Int32Array;
  private lastCell = -1;
  private lastVersion = -1;
  private timer = 0;

  constructor(private grid: Grid) {
    this.FW = Math.ceil(grid.W / FC);
    this.FH = Math.ceil(grid.H / FC);
    this.dist = new Int32Array(this.FW * this.FH);
    this.open = new Uint8Array(this.FW * this.FH);
    this.queue = new Int32Array(this.FW * this.FH);
  }

  private computeOpen() {
    const g = this.grid, per = FC / C;
    for (let fy = 0; fy < this.FH; fy++) for (let fx = 0; fx < this.FW; fx++) {
      let ok = 1;
      for (let cy = fy * per - 1; cy <= fy * per + per && ok; cy++) for (let cx = fx * per - 1; cx <= fx * per + per; cx++) {
        if (cx < 0 || cy < 0 || cx >= g.GW || cy >= g.GH) continue;
        const m = g.mat[cy * g.GW + cx];
        if (m >= 1 && m <= 5) { ok = 0; break; } // trees and parked cars get crushed, so they do not block paths
      }
      this.open[fy * this.FW + fx] = ok;
    }
  }

  update(dt: number, px: number, py: number) {
    this.timer -= dt;
    const cell = this.cellOf(px, py);
    if (this.timer > 0 || (cell === this.lastCell && this.grid.version === this.lastVersion)) return;
    if (this.grid.version !== this.lastVersion) this.computeOpen();
    this.lastVersion = this.grid.version; this.lastCell = cell; this.timer = 0.5;
    const { FW, FH, dist, open, queue } = this;
    dist.fill(-1);
    if (cell < 0) return;
    let h = 0, t = 0;
    dist[cell] = 0; queue[t++] = cell;
    while (h < t) {
      const c = queue[h++], cx = c % FW, cy = (c / FW) | 0, d = dist[c] + 1;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= FW || ny >= FH) continue;
        const n = ny * FW + nx;
        if (dist[n] >= 0 || !open[n]) continue;
        if (dx && dy && (!open[cy * FW + nx] || !open[ny * FW + cx])) continue;
        dist[n] = d; queue[t++] = n;
      }
    }
  }

  cellOf(x: number, y: number) {
    const fx = (x / FC) | 0, fy = (y / FC) | 0;
    return fx < 0 || fy < 0 || fx >= this.FW || fy >= this.FH ? -1 : fy * this.FW + fx;
  }

  /** Next waypoint toward the player, or null when this spot is off the field. */
  next(x: number, y: number): [number, number] | null {
    const c = this.cellOf(x, y);
    if (c < 0) return null;
    const cx = c % this.FW, cy = (c / this.FW) | 0;
    let best = -1, bd = this.dist[c] >= 0 ? this.dist[c] : 1e9;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = cx + dx, ny = cy + dy;
      if ((!dx && !dy) || nx < 0 || ny < 0 || nx >= this.FW || ny >= this.FH) continue;
      const n = ny * this.FW + nx, d = this.dist[n];
      if (d >= 0 && d < bd) { bd = d; best = n; }
    }
    if (best < 0) return null;
    return [(best % this.FW) * FC + FC / 2, ((best / this.FW) | 0) * FC + FC / 2];
  }
}
