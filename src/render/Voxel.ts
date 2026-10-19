import { Rectangle, Texture } from 'pixi.js';
import { K, ZS } from '../config';

/*
 * Voxel vehicles, pre-rendered. A model is a small 3D grid of palette roles (1 voxel = 1 world px =
 * 0.2 m). At load it is "photographed" from N headings in the game's 3/4 projection (screen x = x,
 * screen y = y·K − z·ZS), with flat shading per face (lit tops, sides darker away from the light)
 * and a thin dark outline, into one atlas canvas. At run time a vehicle is just two sprites
 * (hull, turret) picking the frame for its heading: cheap, and it rotates with real volume.
 */

export class VoxelModel {
  readonly data: Uint8Array;
  /** model coords run x ∈ [−ox, X−ox), y ∈ [−oy, Y−oy), z ∈ [0, Z) ; +x is forward */
  constructor(readonly X: number, readonly Y: number, readonly Z: number, readonly ox: number, readonly oy: number) {
    this.data = new Uint8Array(X * Y * Z);
  }
  private i(x: number, y: number, z: number) {
    const ix = Math.floor(x) + this.ox, iy = Math.floor(y) + this.oy, iz = Math.floor(z);
    return ix < 0 || iy < 0 || iz < 0 || ix >= this.X || iy >= this.Y || iz >= this.Z ? -1 : (iz * this.Y + iy) * this.X + ix;
  }
  get(x: number, y: number, z: number) { const i = this.i(x, y, z); return i < 0 ? 0 : this.data[i]; }
  set(x: number, y: number, z: number, c: number) { const i = this.i(x, y, z); if (i >= 0) this.data[i] = c; }
  /** solid box, half-open ranges [x0, x1) × [y0, y1) × [z0, z1) */
  box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, c: number) {
    for (let z = z0; z < z1; z++) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) this.set(x, y, z, c);
    return this;
  }
  /** cylinder along z (round hatches, stacks), along x (barrels) or along y (wheels) */
  cylZ(cx: number, cy: number, r: number, z0: number, z1: number, c: number) {
    for (let z = z0; z < z1; z++) for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) this.set(x, y, z, c);
    return this;
  }
  cylX(cy: number, cz: number, r: number, x0: number, x1: number, c: number) {
    for (let x = x0; x < x1; x++) for (let z = Math.floor(cz - r); z <= cz + r; z++) for (let y = Math.floor(cy - r); y <= cy + r; y++) if ((y + 0.5 - cy) ** 2 + (z + 0.5 - cz) ** 2 <= r * r) this.set(x, y, z, c);
    return this;
  }
  cylY(cx: number, cz: number, r: number, y0: number, y1: number, c: number) {
    for (let y = y0; y < y1; y++) for (let z = Math.floor(cz - r); z <= cz + r; z++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x + 0.5 - cx) ** 2 + (z + 0.5 - cz) ** 2 <= r * r) this.set(x, y, z, c);
    return this;
  }
  /** recolour voxels: `fn` gets (x, y, z, role) and returns the new role */
  paint(fn: (x: number, y: number, z: number, c: number) => number) {
    for (let iz = 0; iz < this.Z; iz++) for (let iy = 0; iy < this.Y; iy++) for (let ix = 0; ix < this.X; ix++) {
      const k = (iz * this.Y + iy) * this.X + ix, c = this.data[k];
      if (c) this.data[k] = fn(ix - this.ox, iy - this.oy, iz, c);
    }
    return this;
  }
}

/** palette: role → colour; 0 is empty */
export type Palette = Record<number, number>;

export interface Baked {
  textures: Texture[];
  /** number of headings; frame k shows heading k·2π/n */
  n: number;
  /** canvas px per world px */
  s: number;
}

const DIRS: [number, number, number][] = [[0, 0, 1], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0]];
const LIGHT: [number, number] = [-0.8, -0.35]; // from the north-west, as the terrain is lit
const hash = (x: number, y: number, z: number) => { let h = Math.imul(x * 73856093 ^ y * 19349663 ^ z * 83492791, 0x9e3779b1); h ^= h >>> 15; return (h >>> 0) / 4294967296; };

/** a face of a surface voxel that has no neighbour on that side */
interface Face { x: number; y: number; z: number; d: number; c: number; v: number }

function faces(m: VoxelModel): Face[] {
  const out: Face[] = [];
  for (let iz = 0; iz < m.Z; iz++) for (let iy = 0; iy < m.Y; iy++) for (let ix = 0; ix < m.X; ix++) {
    const c = m.data[(iz * m.Y + iy) * m.X + ix];
    if (!c) continue;
    const x = ix - m.ox, y = iy - m.oy;
    const v = 0.96 + hash(x, y, iz) * 0.08; // a little grain so flat plates are not dead flat
    DIRS.forEach(([dx, dy, dz], d) => { if (!m.get(x + dx, y + dy, iz + dz)) out.push({ x, y, z: iz, d, c, v }); });
  }
  return out;
}

const rgb = (col: number, b: number) => `rgb(${Math.min(255, ((col >> 16) & 255) * b) | 0},${Math.min(255, ((col >> 8) & 255) * b) | 0},${Math.min(255, (col & 255) * b) | 0})`;

/**
 * Render `models` (each from n headings, s canvas px per world px) into one atlas.
 * Returns one Baked per model, in order.
 */
export function bake(models: { m: VoxelModel; pal: Palette }[], n = 48, s = 3): Baked[] {
  type Frame = { w: number; h: number; ax: number; ay: number; draw: (g: CanvasRenderingContext2D, ox: number, oy: number) => void };
  const frames: Frame[][] = models.map(({ m, pal }) => {
    const fs = faces(m), out: Frame[] = [];
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      const P = (x: number, y: number, z: number): [number, number] => [(x * ca - y * sa) * s, ((x * sa + y * ca) * K - z * ZS) * s];
      // visible faces: tops, and sides turned toward the viewer (south, +y on screen)
      const vis = fs.filter((f) => f.d === 0 || (DIRS[f.d][0] * sa + DIRS[f.d][1] * ca) > 0.02);
      // painter's order: far to near (rotated y), low to high, sides before tops
      const depth = (f: Face) => { const cx = f.x + 0.5, cy = f.y + 0.5; return (cx * sa + cy * ca) * 1000 + f.z * 2 + (f.d === 0 ? 1 : 0); };
      vis.sort((p, q) => depth(p) - depth(q));
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      const polys = vis.map((f) => {
        const { x, y, z, d } = f;
        let pts: [number, number][];
        if (d === 0) pts = [P(x, y, z + 1), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)];
        else {
          const [dx, dy] = DIRS[d];
          // the edge of the cell on side d, from bottom to top
          const ex0 = dx ? x + (dx > 0 ? 1 : 0) : x, ex1 = dx ? ex0 : x + 1, ey0 = dy ? y + (dy > 0 ? 1 : 0) : y, ey1 = dy ? ey0 : y + 1;
          pts = [P(ex0, ey0, z), P(ex1, ey1, z), P(ex1, ey1, z + 1), P(ex0, ey0, z + 1)];
        }
        for (const [px, py] of pts) { x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py); }
        let b = 1.06;
        if (d) {
          const nx = DIRS[d][0] * ca - DIRS[d][1] * sa, ny = DIRS[d][0] * sa + DIRS[d][1] * ca;
          b = 0.6 + 0.32 * Math.max(0, nx * LIGHT[0] + ny * LIGHT[1]);
          b *= 0.82 + 0.18 * Math.min(1, z / 5); // darker toward the ground
        }
        return { pts, col: rgb(pal[f.c] ?? 0xff00ff, b * f.v) };
      });
      const pad = 2;
      out.push({
        w: Math.ceil(x1 - x0) + pad * 2, h: Math.ceil(y1 - y0) + pad * 2, ax: -x0 + pad, ay: -y0 + pad,
        draw: (g, ox, oy) => {
          g.lineWidth = 0.6; g.lineJoin = 'round';
          for (const { pts, col } of polys) {
            g.beginPath(); g.moveTo(pts[0][0] + ox, pts[0][1] + oy);
            for (let j = 1; j < 4; j++) g.lineTo(pts[j][0] + ox, pts[j][1] + oy);
            g.closePath(); g.fillStyle = col; g.strokeStyle = col; g.fill(); g.stroke(); // stroke hides seams between faces
          }
        },
      });
    }
    return out;
  });
  // shelf-pack every frame into one atlas
  const W = 2048, place: [number, number][][] = [];
  let cx = 0, cy = 0, row = 0;
  for (const fr of frames) {
    const pl: [number, number][] = [];
    for (const f of fr) {
      if (cx + f.w + 2 > W) { cx = 0; cy += row + 2; row = 0; }
      pl.push([cx + 1, cy + 1]); cx += f.w + 2; row = Math.max(row, f.h);
    }
    place.push(pl);
  }
  const H = cy + row + 2;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d', { willReadFrequently: true })!; // CPU canvas: thousands of tiny fills are faster there than on a GPU canvas
  frames.forEach((fr, mi) => fr.forEach((f, k) => f.draw(g, place[mi][k][0] + f.ax, place[mi][k][1] + f.ay)));
  // dark 1 px outline under everything, done once for the whole atlas (frames have 2 px of padding)
  const sil = document.createElement('canvas'); sil.width = W; sil.height = H;
  const sg = sil.getContext('2d', { willReadFrequently: true })!;
  sg.drawImage(cv, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = 'rgba(16,14,10,0.7)'; sg.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'destination-over';
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.drawImage(sil, dx, dy);
  g.globalCompositeOperation = 'source-over';
  const base = Texture.from(cv);
  return frames.map((fr, mi) => ({
    n, s,
    textures: fr.map((f, k) => {
      const [px, py] = place[mi][k];
      return new Texture({ source: base.source, frame: new Rectangle(px, py, f.w, f.h), defaultAnchor: { x: f.ax / f.w, y: f.ay / f.h } });
    }),
  }));
}

/** frame index for a heading */
export const frameOf = (b: Baked, a: number) => ((Math.round((a / (Math.PI * 2)) * b.n) % b.n) + b.n) % b.n;
