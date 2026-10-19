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
  /** this frame's lights, for the night light map */
  readonly frame: { x: number; y: number; z: number; r: number; color: number; a: number }[] = [];

  constructor(private W: number, private H: number) {
    LIGHT ??= radial([[0, 'rgba(255,255,255,1)'], [0.22, 'rgba(255,255,255,0.62)'], [0.55, 'rgba(255,255,255,0.18)'], [1, 'rgba(255,255,255,0)']]);
    CLOUD ??= (() => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 256;
      const g = cv.getContext('2d')!;
      for (const [x, y, r] of [[128, 128, 90], [80, 110, 60], [175, 140, 70], [120, 175, 55], [150, 85, 50]]) {
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
      }
      return Texture.from(cv);
    })();
    // clouds: six soft shadows drifting over the map, one sprite each (fill cost matters on phones)
    for (let k = 0; k < 6; k++) {
      const s = new Sprite(CLOUD); s.anchor.set(0.5);
      const r = 260 + Math.random() * 160;
      s.width = r * 2; s.height = r * 2 * K * 0.7; s.alpha = 0.32; // the first, deeper look (owner went back to it)
      this.clouds.addChild(s);
      this.cloudV.push({ s, x: Math.random() * W, y: Math.random() * H });
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
    this.frame.length = 0;
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
    this.frame.push({ x, y, z, r, color, a });
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
