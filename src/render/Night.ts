import { Container, RenderTexture, Sprite, Texture, type Renderer } from 'pixi.js';
import { K, ZS } from '../config';

/*
 * Night: the world is multiplied by a light map. The light map starts as moonlight (a dim blue)
 * and every light source is added onto it: headlight cones, brake lights, street and work lamps,
 * flares, blasts and fires. It is drawn at half resolution (light is soft) into a render texture,
 * which one sprite multiplies over the world, under the shells, markers and health bars.
 */

function tex(w: number, h: number, f: (u: number, v: number) => number) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d')!, img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const a = Math.max(0, Math.min(1, f(x / (w - 1), y / (h - 1)))), k = (y * w + x) * 4;
    img.data[k] = img.data[k + 1] = img.data[k + 2] = 255; img.data[k + 3] = Math.round(a * 255);
  }
  g.putImageData(img, 0, 0);
  return Texture.from(cv);
}
const smooth = (e0: number, e1: number, x: number) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
let DOT: Texture | null = null, CONE: Texture | null = null;

export interface Lamp { x: number; y: number; r: number; color: number }
export interface NightLight { x: number; y: number; z: number; r: number; color: number; a: number }

export class Night {
  /** the multiply sprite: put it in the world view just under the overlay */
  readonly shade: Sprite;
  private rt: RenderTexture;
  private scene = new Container(); // mirrors the world view's transform
  private ground = new Container(); // squashed by K: world-plane shapes (cones) keep their footprint
  private flat = new Container(); // already-projected lights (round pools)
  private pool: Sprite[] = [];
  private used = 0;
  private scale = 0.5;

  constructor(private renderer: Renderer, readonly ambient: number) {
    DOT ??= tex(64, 64, (u, v) => { const d = Math.hypot(u - 0.5, v - 0.5) * 2; return Math.pow(Math.max(0, 1 - d), 1.6); });
    // headlight cone: bright near the lamp, fading with distance, soft edges, about 34° wide
    CONE ??= tex(128, 64, (u, v) => {
      const dy = (v - 0.5) * 2, half = 0.08 + u * 0.92;
      return Math.pow(1 - u, 1.3) * (1 - smooth(half * 0.55, half, Math.abs(dy))) * smooth(0, 0.06, u);
    });
    this.rt = RenderTexture.create({ width: 8, height: 8 });
    this.shade = new Sprite(this.rt);
    this.shade.blendMode = 'multiply';
    this.ground.scale.y = K;
    this.scene.addChild(this.ground, this.flat);
  }

  private sprite(t: Texture, parent: Container) {
    let s = this.pool[this.used];
    if (!s) { s = new Sprite(); s.blendMode = 'add'; this.pool.push(s); }
    this.used++;
    if (s.parent !== parent) parent.addChild(s);
    s.texture = t; s.visible = true; s.rotation = 0;
    return s;
  }
  begin() { this.used = 0; }
  /** a round pool of light on the ground (lamp, flare, blast); `z` lifts it with the 3/4 view */
  pool_(x: number, y: number, z: number, r: number, color: number, a: number) {
    const s = this.sprite(DOT!, this.flat);
    s.anchor.set(0.5); s.tint = color; s.alpha = Math.min(1, a);
    s.position.set(x, y * K - z * ZS * 0.5); s.width = r * 2; s.height = r * 2 * K;
  }
  /** a headlight cone from (x, y) along heading `a`, `len` long */
  cone(x: number, y: number, a: number, len: number, color: number, alpha: number) {
    const s = this.sprite(CONE!, this.ground);
    s.anchor.set(0, 0.5); s.tint = color; s.alpha = alpha;
    s.position.set(x, y); s.rotation = a; s.width = len; s.height = len * 0.62;
  }
  /** render the light map for this frame with the world view's transform */
  end(viewX: number, viewY: number, zoom: number, w: number, h: number) {
    for (let k = this.used; k < this.pool.length; k++) this.pool[k].visible = false;
    const sw = Math.ceil(w * this.scale), sh = Math.ceil(h * this.scale);
    if (this.rt.width !== sw || this.rt.height !== sh) this.rt.resize(sw, sh);
    this.scene.scale.set(zoom * this.scale); this.scene.position.set(viewX * this.scale, viewY * this.scale);
    this.renderer.render({ container: this.scene, target: this.rt, clear: true, clearColor: this.ambient });
    // the shade sprite lives in world space: undo the world view's transform so it covers the screen
    this.shade.position.set(-viewX / zoom, -viewY / zoom);
    this.shade.width = w / zoom; this.shade.height = h / zoom;
  }
}
