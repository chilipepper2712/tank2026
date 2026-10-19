import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { K } from '../config';

/*
 * Weather, drawn in screen space over the world and under the HUD marks: a haze that closes in at
 * the edge of what can be seen (centred on the player's vehicle, squashed like the ground), an
 * overall tint, and falling rain or blowing sand. The game reads `vis` for what each side can see.
 */

export type WeatherId = 'clear' | 'fog' | 'rain' | 'storm' | 'sand';

export interface WeatherSpec {
  /** how far either side can see, world px (Infinity: as far as the screen shows) */
  vis: number;
  /** share of the normal distance gunfire is heard at */
  hearing: number;
  haze?: { color: number; alpha: number };
  tint?: { color: number; alpha: number };
  /** rain drops or sand streaks on screen at once */
  rain?: number;
  sand?: number;
  /** seconds between lightning strikes */
  lightning?: [number, number];
}

export const WEATHER: Record<WeatherId, WeatherSpec> = {
  clear: { vis: Infinity, hearing: 1 },
  fog: { vis: 260, hearing: 1, haze: { color: 0xc4c8c4, alpha: 0.92 }, tint: { color: 0xb8bdb8, alpha: 0.12 } },
  rain: { vis: 400, hearing: 0.5, haze: { color: 0x39424c, alpha: 0.6 }, tint: { color: 0x1a2430, alpha: 0.2 }, rain: 170 },
  storm: { vis: 320, hearing: 0.4, haze: { color: 0x262c34, alpha: 0.8 }, tint: { color: 0x10161e, alpha: 0.32 }, rain: 300, lightning: [7, 13] },
  sand: { vis: 240, hearing: 0.6, haze: { color: 0xc49a64, alpha: 0.9 }, tint: { color: 0xa0703a, alpha: 0.16 }, sand: 200 },
};

/** the haze texture: clear in the middle, solid from a quarter of its half-size outward */
const HAZE_SOLID = 0.25;
let hazeTex: Texture | null = null;
function hazeTexture() {
  if (hazeTex) return hazeTex;
  const n = 512, cv = document.createElement('canvas');
  cv.width = cv.height = n;
  const g = cv.getContext('2d')!, gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  gr.addColorStop(0, 'rgba(255,255,255,0)');
  gr.addColorStop(HAZE_SOLID * 0.7, 'rgba(255,255,255,0)');
  gr.addColorStop(HAZE_SOLID, 'rgba(255,255,255,1)');
  gr.addColorStop(1, 'rgba(255,255,255,1)');
  g.fillStyle = gr; g.fillRect(0, 0, n, n);
  return (hazeTex = Texture.from(cv));
}

interface Drop { x: number; y: number; v: number; l: number }

export class Weather {
  readonly layer = new Container();
  private haze: Sprite | null = null;
  private tint: Sprite | null = null;
  private fall = new Graphics();
  private drops: Drop[] = [];
  private splashes: { x: number; y: number; t: number }[] = [];
  /** lightning: time to the next strike, and the flash now (1 → 0) */
  private nextBolt = 0;
  bolt = 0;

  /** at night the moonlight already darkens everything: the overcast tint mostly goes */
  constructor(readonly id: WeatherId, night = false, readonly spec = WEATHER[id]) {
    if (spec.tint) {
      this.tint = new Sprite(Texture.WHITE);
      this.tint.tint = spec.tint.color; this.tint.alpha = spec.tint.alpha * (night ? 0.3 : 1);
      this.layer.addChild(this.tint);
    }
    if (spec.haze) {
      this.haze = new Sprite(hazeTexture());
      this.haze.anchor.set(0.5); this.haze.tint = spec.haze.color; this.haze.alpha = spec.haze.alpha;
      this.layer.addChild(this.haze);
    }
    this.layer.addChild(this.fall);
    const n = spec.rain ?? spec.sand ?? 0;
    for (let k = 0; k < n; k++) this.drops.push({ x: Math.random(), y: Math.random(), v: 0.8 + Math.random() * 0.5, l: 0.6 + Math.random() * 0.6 });
    if (spec.lightning) this.nextBolt = spec.lightning[0] * 0.5 + Math.random() * 3;
  }

  /** advance; returns true on the frame lightning strikes */
  update(dt: number) {
    const L = this.spec.lightning;
    this.bolt = Math.max(0, this.bolt - dt * 1.6);
    if (!L || (this.nextBolt -= dt) > 0) return false;
    this.nextBolt = L[0] + Math.random() * (L[1] - L[0]);
    this.bolt = 1;
    return true;
  }

  /** how far can be seen right now: lightning lights the whole field for a moment */
  get vis() { return this.bolt > 0.35 ? Infinity : this.spec.vis; }

  /** lay out for this frame: (px, py) is the player's vehicle on screen, z the world zoom */
  draw(px: number, py: number, z: number, w: number, h: number, dt: number) {
    if (this.tint) { this.tint.width = w; this.tint.height = h; }
    if (this.haze) {
      const s = (this.spec.vis * z) / (256 * HAZE_SOLID);
      this.haze.position.set(px, py); this.haze.scale.set(s, s * K);
      this.haze.alpha = this.spec.haze!.alpha * (1 - 0.85 * this.bolt);
    }
    const g = this.fall;
    g.clear();
    if (this.spec.rain) {
      // slanting streaks, each a little ripple where it lands
      const sp = h * 2.6 * dt, dx = 0.18;
      for (const d of this.drops) {
        d.y += (sp * d.v) / h; d.x -= (sp * d.v * dx) / w;
        if (d.y > 1) {
          if (Math.random() < 0.35) this.splashes.push({ x: d.x * w, y: Math.random() * h, t: 0 });
          d.y -= 1 + Math.random() * 0.1; d.x = Math.random() * 1.1;
        }
        if (d.x < 0) d.x += 1.1;
        const x = d.x * w, y = d.y * h, len = 16 * d.l;
        g.moveTo(x, y).lineTo(x + len * dx, y - len);
      }
      g.stroke({ width: 1, color: 0xc8d4e0, alpha: this.spec.lightning ? 0.38 : 0.3 });
      for (let k = this.splashes.length - 1; k >= 0; k--) {
        const s = this.splashes[k];
        if ((s.t += dt * 3.5) >= 1) { this.splashes.splice(k, 1); continue; }
        g.ellipse(s.x, s.y, 2 + 6 * s.t, (2 + 6 * s.t) * K * 0.6).stroke({ width: 1, color: 0xc8d4e0, alpha: 0.35 * (1 - s.t) });
      }
    } else if (this.spec.sand) {
      // grit blowing across: long faint streaks, fast
      const sp = w * 1.4 * dt;
      for (const d of this.drops) {
        d.x += (sp * d.v) / w; d.y += (sp * d.v * 0.06) / h;
        if (d.x > 1.05) { d.x -= 1.1; d.y = Math.random(); }
        if (d.y > 1) d.y -= 1;
        const x = d.x * w, y = d.y * h, len = 30 * d.l;
        g.moveTo(x - len, y - len * 0.06).lineTo(x, y);
      }
      g.stroke({ width: 1.2, color: 0xf0d8a8, alpha: 0.28 });
    }
    if (this.bolt > 0) g.rect(0, 0, w, h).fill({ color: 0xe8eeff, alpha: 0.45 * this.bolt * this.bolt });
  }

  destroy() { this.layer.destroy({ children: true }); }
}
