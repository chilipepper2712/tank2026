import { Container, Graphics } from 'pixi.js';
import { DRONE_ALT, K, ZS, type UnitSpec } from '../config';

const lift = (h: number) => (-h * ZS) / K; // height → offset inside the K-squashed container

/**
 * A unit drawn as stacked rotated boxes inside a container squashed by K,
 * which fakes the 3/4 view without real 3D.
 */
export class UnitView {
  readonly root = new Container();
  private shadow = new Graphics();
  private tracks = new Container();
  private side = new Container();
  private top = new Container();
  private turret = new Container();
  private barrel = new Graphics();
  private heading?: Graphics;
  private rotor?: Graphics;

  constructor(private spec: UnitSpec, isPlayer: boolean) {
    const [L, Wd] = spec.size, c = spec.colors;
    this.root.scale.y = K;
    const flyH = spec.flying ? DRONE_ALT : 0;
    this.shadow.ellipse(spec.flying ? 0 : 1, spec.flying ? 0 : 2, L * 0.62, Wd * 0.68).fill({ color: 0x000000, alpha: spec.flying ? 0.22 : 0.32 });
    this.root.addChild(this.shadow);

    if (spec.flying) {
      this.top.y = lift(flyH);
      const body = new Graphics();
      body.rect(-6, -6, 12, 12).fill(c.body);
      for (const [dx, dy] of [[-8, -8], [8, -8], [8, 8], [-8, 8]]) body.circle(dx, dy, 5).fill({ color: c.top, alpha: 0.9 });
      body.circle(0, 0, 2.5).fill(c.turret);
      this.rotor = body;
      this.top.addChild(body);
      this.root.addChild(this.top);
      return;
    }

    this.tracks.y = lift(2); this.side.y = lift(5); this.top.y = lift(9); this.turret.y = lift(13);
    this.tracks.addChild(new Graphics().rect(-L / 2 - 1, -Wd / 2 - 1, L + 2, Wd + 2).fill(0x23241e));
    this.side.addChild(new Graphics().rect(-L / 2 + 2, -Wd / 2 + 3, L - 4, Wd - 6).fill(c.body));
    const top = new Graphics().rect(-L / 2 + 2, -Wd / 2 + 3, L - 4, Wd - 6).fill(c.top).rect(L / 2 - 8, -Wd / 2 + 5, 5, Wd - 10).fill({ color: 0xffffff, alpha: 0.14 });
    if (isPlayer) top.poly([L / 2 + 2, 0, L / 2 - 8, -7, L / 2 - 8, 7]).fill(0xf0b23c);
    this.top.addChild(top);
    if (spec.fixedGun !== undefined) {
      // casemate gun: barrel fixed to the hull, mounted low and forward
      this.barrel.rect(0, -2.6, 28, 5.2).fill(c.turret);
      this.barrel.x = L / 2 - 10;
      this.turret.addChild(this.barrel);
    } else {
      this.turret.addChild(new Graphics().rect(-8, -8, 16, 16).fill(c.turret).rect(-8, 4, 16, 4).fill({ color: 0x000000, alpha: 0.25 }));
      this.barrel.rect(0, -2.2, 22, 4.4).fill(c.turret);
      this.barrel.x = 6;
      this.turret.addChild(this.barrel);
    }
    if (isPlayer) {
      this.heading = new Graphics().moveTo(26, -8).lineTo(35, 0).lineTo(26, 8).stroke({ width: 3, color: 0xf0b23c, alpha: 0.8, join: 'round', cap: 'round' });
      this.root.addChildAt(this.heading, 1);
    }
    this.root.addChild(this.tracks, this.side, this.top, this.turret);
  }

  sync(x: number, y: number, z: number, hull: number, tur: number, recoil: number, dead: boolean, t: number) {
    this.root.x = x;
    this.root.y = y * K;
    this.root.zIndex = y;
    if (this.spec.flying) {
      // drones always fly above the roofs, so draw them over everything
      this.root.zIndex = y + 1e5;
      if (this.rotor) this.rotor.rotation = hull + Math.sin(t * 40) * 0.05;
      this.top.y = lift(z + Math.sin(t * 3 + x) * 2);
      return;
    }
    this.tracks.rotation = this.side.rotation = this.top.rotation = hull;
    if (this.heading) { this.heading.rotation = hull; this.heading.visible = !dead; }
    this.turret.rotation = this.spec.fixedGun !== undefined ? hull : tur;
    this.barrel.x = (this.spec.fixedGun !== undefined ? this.spec.size[0] / 2 - 10 : 6) - recoil * 4;
    if (this.spec.fixedGun !== undefined) this.barrel.rotation = tur - hull;
    if (dead) {
      this.turret.visible = false;
      this.root.tint = 0x2c2925;
    }
  }

  destroy() { this.root.destroy({ children: true }); }
}
