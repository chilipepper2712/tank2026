import { Container, Sprite, Texture } from 'pixi.js';
import { K, ZS } from '../config';

/*
 * Cheap lighting, no shaders and no extra full-screen passes:
 *   - additive light sprites (a soft radial gradient) for explosions, muzzle flashes, missile exhausts
 *     and burning wrecks, lying on the ground plane so they light the ground, walls and vehicles near them;
 *   - cloud shadows: a few large soft dark blobs drifting over the map;
 *   - a vignette darkening the screen corners (screen space).
 */

function radial(stops: [number, string][], size = 128) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const g = cv.getContext('2d')!, gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  return Texture.from(cv);
}
let LIGHT: Texture | null = null, CLOUD: Texture | null = null;

interface Light { x: number; y: number; z: number; r: number; life: number; max: number; color: number; a: number }

export class Lighting {
  /** additive lights: goes in the world view above buildings and units */
  readonly layer = new Container();
  /** cloud shadows: in the world view under the lights */
  readonly clouds = new Container();
  private pool: Sprite[] = [];
  private used = 0;
  private lights: Light[] = [];
  private cloudV: { s: Sprite; x: number; y: number }[] = [];

  constructor(private W: number, private H: number) {
    LIGHT ??= radial([[0, 'rgba(255,255,255,1)'], [0.22, 'rgba(255,255,255,0.62)'], [0.55, 'rgba(255,255,255,0.18)'], [1, 'rgba(255,255,255,0)']]);
    CLOUD ??= radial([[0, 'rgba(0,0,0,1)'], [0.5, 'rgba(0,0,0,0.75)'], [1, 'rgba(0,0,0,0)']], 256);
    // clouds: soft blobs scattered over the map, each a cluster of three
    for (let k = 0; k < 6; k++) {
      const cx = Math.random() * W, cy = Math.random() * H;
      for (let j = 0; j < 3; j++) {
        const s = new Sprite(CLOUD); s.anchor.set(0.5);
        const r = 160 + Math.random() * 160;
        s.width = r * 2; s.height = r * 2 * K * 0.8; s.alpha = 0.13;
        this.clouds.addChild(s);
        this.cloudV.push({ s, x: cx + (Math.random() - 0.5) * 260, y: cy + (Math.random() - 0.5) * 160 });
      }
    }
  }

  /** a light that fades out over `life` seconds (explosion, muzzle flash) */
  flash(x: number, y: number, z: number, r: number, life: number, color: number, a: number) {
    if (this.lights.length > 60) this.lights.shift();
    this.lights.push({ x, y, z, r, life, max: life, color, a });
  }

  /** start a frame: timed lights age, the pool is reset */
  begin(dt: number) {
    this.used = 0;
    for (let k = this.lights.length - 1; k >= 0; k--) {
      const l = this.lights[k];
      if ((l.life -= dt) <= 0) { this.lights.splice(k, 1); continue; }
      const f = l.life / l.max;
      this.light(l.x, l.y, l.z, l.r * (0.8 + 0.2 * f), l.color, l.a * f * f);
    }
    // clouds drift with the wind and wrap round the map
    for (const c of this.cloudV) {
      c.x += 7 * dt; c.y += 2.5 * dt;
      if (c.x > this.W + 400) c.x -= this.W + 800;
      if (c.y > this.H + 300) c.y -= this.H + 600;
      c.s.position.set(c.x, c.y * K);
    }
  }
  /** a light for this frame only (burning wreck, missile exhaust) */
  light(x: number, y: number, z: number, r: number, color: number, a: number) {
    if (a < 0.02) return;
    let s = this.pool[this.used];
    if (!s) { s = new Sprite(LIGHT!); s.anchor.set(0.5); s.blendMode = 'add'; this.pool.push(s); this.layer.addChild(s); }
    this.used++;
    s.visible = true; s.tint = color; s.alpha = Math.min(1, a);
    s.position.set(x, y * K - z * ZS * 0.5);
    s.width = r * 2; s.height = r * 2 * K;
  }
  /** end a frame: hide unused pooled sprites */
  end() { for (let k = this.used; k < this.pool.length; k++) this.pool[k].visible = false; }
}

/** screen-corner darkening, as one sprite stretched over the screen */
export function vignette() {
  const s = new Sprite(radial([[0, 'rgba(0,0,0,0)'], [0.55, 'rgba(0,0,0,0)'], [0.8, 'rgba(0,0,0,0.18)'], [1, 'rgba(0,0,0,0.42)']], 256));
  return s;
}
