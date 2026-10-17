import { C } from '../config';
import { Grid } from '../world/Grid';

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
        const i = cy * g.GW + cx;
        if (Grid.isSolid(g.mat[i]) && !g.crushable(i)) { ok = 0; break; } // crushed obstacles do not block paths
      }
      this.open[fy * this.FW + fx] = ok;
    }
  }

  update(dt: number, px: number, py: number) {
    this.timer -= dt;
    const cell = this.cellOf(px, py);
    if (this.timer > 0 || (cell === this.lastCell && this.grid.version === this.lastVersion)) return;
    this.ensureOpen();
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

  /** coarse cells are recomputed lazily; route planning needs them before the first field update */
  private ensureOpen() {
    if (this.grid.version !== this.openVersion) { this.computeOpen(); this.openVersion = this.grid.version; }
  }
  private openVersion = -1;

  isOpenAt(x: number, y: number) { this.ensureOpen(); const c = this.cellOf(x, y); return c >= 0 && this.open[c] === 1; }

  /** nearest open cell centre to (x, y), searching outward ring by ring */
  nearestOpen(x: number, y: number, maxR = 8): [number, number] | null {
    this.ensureOpen();
    const fx = (x / FC) | 0, fy = (y / FC) | 0;
    for (let r = 0; r <= maxR; r++) {
      let best = -1, bd = 1e9;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const nx = fx + dx, ny = fy + dy;
        if (nx < 0 || ny < 0 || nx >= this.FW || ny >= this.FH || !this.open[ny * this.FW + nx]) continue;
        const d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = ny * this.FW + nx; }
      }
      if (best >= 0) return [(best % this.FW) * FC + FC / 2, ((best / this.FW) | 0) * FC + FC / 2];
    }
    return null;
  }

  /** straight drive between two points stays on open cells */
  clearLine(x0: number, y0: number, x1: number, y1: number) {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (FC / 2));
    for (let k = 1; k < n; k++) { const c = this.cellOf(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n); if (c < 0 || !this.open[c]) return false; }
    return true;
  }

  private gScore = new Float32Array(0);
  private came = new Int32Array(0);
  private seen = new Int32Array(0);
  private stamp = 0;

  /**
   * A* over the coarse grid from (sx, sy) to (tx, ty). Returns waypoints with straight
   * stretches collapsed, ending at the goal, or null when the goal cannot be reached.
   */
  path(sx: number, sy: number, tx: number, ty: number): [number, number][] | null {
    this.ensureOpen();
    const { FW, FH, open } = this, n = FW * FH;
    if (this.gScore.length !== n) { this.gScore = new Float32Array(n); this.came = new Int32Array(n); this.seen = new Int32Array(n); }
    const s0 = this.cellOf(sx, sy), goal = this.cellOf(tx, ty);
    if (s0 < 0 || goal < 0 || !open[goal]) return null;
    const st = ++this.stamp, g = this.gScore, came = this.came, seen = this.seen;
    const gx = goal % FW, gy = (goal / FW) | 0;
    const h = (c: number) => { const dx = Math.abs((c % FW) - gx), dy = Math.abs(((c / FW) | 0) - gy); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
    // binary heap of [f, cell]
    const hf: number[] = [], hc: number[] = [];
    const push = (f: number, c: number) => {
      let i = hf.length; hf.push(f); hc.push(c);
      while (i > 0) { const pa = (i - 1) >> 1; if (hf[pa] <= f) break; hf[i] = hf[pa]; hc[i] = hc[pa]; i = pa; }
      hf[i] = f; hc[i] = c;
    };
    const pop = () => {
      const c = hc[0], lf = hf.pop()!, lc = hc.pop()!;
      if (hf.length) {
        let i = 0;
        for (;;) { let m = 2 * i + 1; if (m >= hf.length) break; if (m + 1 < hf.length && hf[m + 1] < hf[m]) m++; if (hf[m] >= lf) break; hf[i] = hf[m]; hc[i] = hc[m]; i = m; }
        hf[i] = lf; hc[i] = lc;
      }
      return c;
    };
    g[s0] = 0; came[s0] = -1; seen[s0] = st; push(h(s0), s0);
    let found = false, iter = 0;
    while (hf.length && iter++ < n) {
      const c = pop();
      if (c === goal) { found = true; break; }
      const cx = c % FW, cy = (c / FW) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= FW || ny >= FH) continue;
        const nb = ny * FW + nx;
        if (!open[nb] || (dx && dy && (!open[cy * FW + nx] || !open[ny * FW + cx]))) continue;
        const ng = g[c] + (dx && dy ? 1.414 : 1);
        if (seen[nb] === st && g[nb] <= ng) continue;
        seen[nb] = st; g[nb] = ng; came[nb] = c; push(ng + h(nb), nb);
      }
    }
    if (!found) return null;
    const cells: number[] = [];
    for (let c = goal; c >= 0; c = came[c]) cells.push(c);
    cells.reverse();
    const pts = cells.map((c) => [(c % FW) * FC + FC / 2, ((c / FW) | 0) * FC + FC / 2] as [number, number]);
    pts[pts.length - 1] = [tx, ty];
    // string pulling: keep only corners
    const out: [number, number][] = [];
    let from: [number, number] = [sx, sy], k = 0;
    while (k < pts.length) {
      let far = k;
      for (let j = pts.length - 1; j > k; j--) if (this.clearLine(from[0], from[1], pts[j][0], pts[j][1])) { far = j; break; }
      out.push(pts[far]); from = pts[far]; k = far + 1;
    }
    return out;
  }
}
