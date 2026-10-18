import { C, MAT, TIERS, type MaterialId, type TierId } from '../config';

/**
 * The destructible world: a grid of 10px cells. A cell holds a material (1–5),
 * rubble (RUBBLE + material) or nothing (0), plus remaining strength and height. A separate
 * dune layer marks sand ridges: drivable but slow, and they block line of sight.
 */
/** rubble of material m is stored as RUBBLE + m */
export const RUBBLE = 16;

export class Grid {
  readonly GW: number;
  readonly GH: number;
  readonly mat: Uint8Array;
  readonly hp: Float32Array;
  readonly ht: Uint8Array;
  readonly tint: Uint8Array;
  readonly tier: Uint8Array;
  readonly dune: Uint8Array;
  /** open water: blocks ground vehicles, not sight or shells */
  readonly water: Uint8Array;
  /** rows whose look changed since the renderer last rebuilt them */
  readonly dirtyRows = new Set<number>();
  /** bumped on every destroyed cell so path finding knows to refresh */
  version = 0;

  constructor(readonly W: number, readonly H: number) {
    this.GW = Math.ceil(W / C);
    this.GH = Math.ceil(H / C);
    const n = this.GW * this.GH;
    this.mat = new Uint8Array(n);
    this.hp = new Float32Array(n);
    this.ht = new Uint8Array(n);
    this.tint = new Uint8Array(n);
    this.tier = new Uint8Array(n);
    this.dune = new Uint8Array(n);
    this.water = new Uint8Array(n);
  }

  static isSolid(m: number) { return m >= 1 && m < RUBBLE; }
  /** vehicles drive straight through trees, parked cars, garden walls and stalls (small tier, ≤ 2 m high) */
  crushable(i: number) {
    const m = this.mat[i];
    return m === MAT.tree || m === MAT.car || m === MAT.mud || (Grid.isSolid(m) && this.tier[i] === 1 && this.ht[i] <= 10);
  }

  idx(x: number, y: number) {
    if (x < 0 || y < 0 || x >= this.W || y >= this.H) return -1;
    return ((y / C) | 0) * this.GW + ((x / C) | 0);
  }
  solidAt(x: number, y: number) {
    const i = this.idx(x, y);
    return i < 0 || Grid.isSolid(this.mat[i]);
  }
  rubbleAt(x: number, y: number) {
    const i = this.idx(x, y);
    return i >= 0 && this.mat[i] > RUBBLE;
  }
  /** true when the lower neighbour (or edge) is lower than height h, i.e. a wall face shows */
  lowerAt(i: number, h: number) { return !Grid.isSolid(this.mat[i]) || this.ht[i] < h; }

  set(cx: number, cy: number, m: MaterialId, h: number, t: number, tier: TierId, strength: number) {
    if (cx < 0 || cy < 0 || cx >= this.GW || cy >= this.GH) return;
    const i = cy * this.GW + cx;
    this.mat[i] = m;
    this.hp[i] = TIERS[tier].hp * strength;
    this.tier[i] = tier;
    this.ht[i] = h;
    this.tint[i] = t;
  }

  lineClear(x0: number, y0: number, x1: number, y1: number) {
    const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 6);
    for (let k = 1; k < n; k++) {
      const i = this.idx(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n);
      if (i >= 0 && Grid.isSolid(this.mat[i])) return false;
      // sand ridges hide what is behind them, except right next to either end (you can see off a ridge you sit on)
      if (i >= 0 && this.dune[i] && k * 6 > 20 && (n - k) * 6 > 20) return false;
    }
    return true;
  }
  waterAt(x: number, y: number) { const i = this.idx(x, y); return i >= 0 && this.water[i] > 0; }
  duneAt(x: number, y: number) { const i = this.idx(x, y); return i >= 0 && this.dune[i] > 0; }

  /** Destroy a cell; leaves rubble about half the time. */
  breakCell(i: number) {
    const m = this.mat[i];
    if (Math.random() < 0.55) { this.mat[i] = RUBBLE + m; this.ht[i] = 4; }
    else { this.mat[i] = 0; this.ht[i] = 0; }
    const r = (i / this.GW) | 0;
    this.dirtyRows.add(r - 1).add(r).add(r + 1);
    this.version++;
  }
}
