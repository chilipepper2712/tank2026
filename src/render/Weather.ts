import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { K } from '../config';

/*
 * Rain, drawn in screen space over the world and under the HUD marks: a darker sky, thin slanting
 * rain with ripples where it lands, and now and then a lightning flash with thunder. Looks only:
 * rain changes nothing in how either side sees, hears or fights (owner's call, 2026-10-19).
 */

export type WeatherId = 'clear' | 'rain';
export const WEATHER_IDS: WeatherId[] = ['clear', 'rain'];

const TINT = { color: 0x1a2430, alpha: 0.22 };
/** drops on screen at once: sparse, so the rain never hides the field */
const DROPS = 70;
/** seconds between lightning strikes */
const LIGHTNING: [number, number] = [12, 25];

interface Drop { x: number; y: number; v: number; l: number }

export class Weather {
  readonly layer = new Container();
  private tint = new Sprite(Texture.WHITE);
  private fall = new Graphics();
  private drops: Drop[] = [];
  private splashes: { x: number; y: number; t: number }[] = [];
  /** lightning: time to the next strike, and the flash now (1 → 0) */
  private nextBolt = 6 + Math.random() * 8;
  bolt = 0;

  /** at night the moonlight already darkens everything: the overcast tint mostly goes */
  constructor(night = false) {
    this.tint.tint = TINT.color; this.tint.alpha = TINT.alpha * (night ? 0.3 : 1);
    this.layer.addChild(this.tint, this.fall);
    for (let k = 0; k < DROPS; k++) this.drops.push({ x: Math.random(), y: Math.random(), v: 0.8 + Math.random() * 0.5, l: 0.6 + Math.random() * 0.6 });
  }

  /** advance; returns true on the frame lightning strikes */
  update(dt: number) {
    this.bolt = Math.max(0, this.bolt - dt * 1.6);
    if ((this.nextBolt -= dt) > 0) return false;
    this.nextBolt = LIGHTNING[0] + Math.random() * (LIGHTNING[1] - LIGHTNING[0]);
    this.bolt = 1;
    return true;
  }

  draw(w: number, h: number, dt: number) {
    this.tint.width = w; this.tint.height = h;
    const g = this.fall, sp = h * 2.6 * dt, dx = 0.18;
    g.clear();
    // slanting streaks, a ripple where some of them land
    for (const d of this.drops) {
      d.y += (sp * d.v) / h; d.x -= (sp * d.v * dx) / w;
      if (d.y > 1) {
        if (Math.random() < 0.35) this.splashes.push({ x: d.x * w, y: Math.random() * h, t: 0 });
        d.y -= 1 + Math.random() * 0.1; d.x = Math.random() * 1.1;
      }
      if (d.x < 0) d.x += 1.1;
      const x = d.x * w, y = d.y * h, len = 14 * d.l;
      g.moveTo(x, y).lineTo(x + len * dx, y - len);
    }
    g.stroke({ width: 1, color: 0xc8d4e0, alpha: 0.26 });
    for (let k = this.splashes.length - 1; k >= 0; k--) {
      const s = this.splashes[k];
      if ((s.t += dt * 3.5) >= 1) { this.splashes.splice(k, 1); continue; }
      g.ellipse(s.x, s.y, 2 + 6 * s.t, (2 + 6 * s.t) * K * 0.6).stroke({ width: 1, color: 0xc8d4e0, alpha: 0.3 * (1 - s.t) });
    }
    if (this.bolt > 0) g.rect(0, 0, w, h).fill({ color: 0xe8eeff, alpha: 0.4 * this.bolt * this.bolt });
  }

  destroy() { this.layer.destroy({ children: true }); }
}
