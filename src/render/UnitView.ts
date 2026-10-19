import { Container, Graphics } from 'pixi.js';
import { C, DRONE_ALT, K, ZS, type UnitSpec } from '../config';
import { shade } from '../util';
import { settings } from '../settings';
import type { Gear } from './vehicles';
import { prebake, VoxelVehicle } from './VoxelView';

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
  private infantry = false;
  private truck = false;
  /** voxel prototype (player's tank / APC when the setting is on) */
  private vox?: VoxelVehicle;

  constructor(private spec: UnitSpec, isPlayer: boolean) {
    const [L, Wd] = spec.size, c = spec.colors;
    this.root.scale.y = K;
    const flyH = spec.flying ? DRONE_ALT : 0;
    this.shadow.ellipse(spec.flying ? 0 : 1, spec.flying ? 0 : 2, L * 0.62, Wd * 0.68).fill({ color: 0x000000, alpha: spec.flying ? 0.22 : 0.32 });
    this.root.addChild(this.shadow);

    if (isPlayer && settings.voxel && (spec.id === 'tank' || spec.id === 'apc')) {
      this.vox = new VoxelVehicle(spec.id, 'player', { plate: false, cageAT: false, cageUAV: false });
      this.vox.root.scale.y = 1 / K; // the baked frames already carry the 3/4 projection
      this.heading = new Graphics().moveTo(26, -8).lineTo(35, 0).lineTo(26, 8).stroke({ width: 3, color: 0xf0b23c, alpha: 0.8, join: 'round', cap: 'round' });
      this.root.addChild(this.heading, this.vox.root);
      prebake(spec.id, 'player');
      return;
    }

    if (spec.id === 'e-kami') {
      // loitering munition: delta wing with a warhead nose and a pusher prop
      this.top.y = lift(flyH);
      const body = new Graphics();
      body.poly([11, 0, -7, -10, -4, 0, -7, 10]).fill(c.top).poly([11, 0, -4, 0, -7, 10]).fill({ color: 0x000000, alpha: 0.25 });
      body.rect(-5, -1.6, 15, 3.2).fill(c.body).circle(10, 0, 2.4).fill(c.turret);
      body.rect(-8, -4, 1.4, 8).fill({ color: 0xcfcac0, alpha: 0.6 });
      this.rotor = body;
      this.top.addChild(body);
      this.root.addChild(this.top);
      return;
    }
    if (spec.id === 'a-truck' || spec.id === 'e-tech') {
      const tech = spec.id === 'e-tech';
      // supply truck: wheels, cab at the front, canvas-covered cargo bed, roof machine gun
      this.tracks.y = lift(2); this.top.y = lift(10); this.turret.y = lift(15);
      const wh = new Graphics();
      for (const wx of [-L / 2 + 5, -L / 2 + 11, L / 2 - 6]) wh.rect(wx - 2.5, -Wd / 2 - 1, 5, 3).rect(wx - 2.5, Wd / 2 - 2, 5, 3);
      wh.fill(0x1d1e19);
      this.tracks.addChild(wh);
      const body = new Graphics().rect(-L / 2, -Wd / 2 + 1, L, Wd - 2).fill(c.body);
      body.rect(-L / 2 + 1, -Wd / 2 + 2, L * 0.62, Wd - 4).fill(tech ? 0x3a3128 : 0xb5ac86); // canvas cover, or the pickup's open bed
      for (let k = -L / 2 + 4; k < L * 0.1; k += 4) body.rect(k, -Wd / 2 + 2, 1, Wd - 4);
      body.fill({ color: 0x000000, alpha: 0.18 });
      body.rect(L / 2 - 9, -Wd / 2 + 2, 8, Wd - 4).fill(c.top).rect(L / 2 - 3, -Wd / 2 + 3, 2, Wd - 6).fill(0x22313b); // cab, windscreen
      body.rect(-L / 2, -Wd / 2 + 1, L, 1.2).fill({ color: 0xffffff, alpha: 0.2 });
      this.top.addChild(body);
      if (tech) { this.barrel.rect(-6, -3, 14, 6).fill(c.turret).rect(-6, -3, 14, 1.5).fill({ color: 0xffffff, alpha: 0.18 }).rect(7, -2.5, 2, 5).fill(0x1d1e19); this.barrel.x = -L / 2 + 8; } // twin missile launcher on the bed
      else { this.barrel.rect(0, -1, 9, 2).fill(c.turret).circle(0, 0, 2.4).fill(c.turret); this.barrel.x = L / 2 - 6; }
      this.turret.addChild(this.barrel);
      this.turret.x = 0;
      this.root.addChild(this.tracks, this.top, this.turret);
      this.truck = true;
      return;
    }
    if (spec.id === 'e-inf') {
      // soldier from above: shoulders, helmet, rocket tube over the shoulder
      this.top.y = lift(6); this.turret.y = lift(8);
      this.top.addChild(new Graphics().ellipse(0, 0, 3.4, 4.6).fill(c.body).circle(0, 0, 2.6).fill(c.top).circle(-0.6, -0.6, 1).fill({ color: 0xffffff, alpha: 0.2 }));
      this.barrel.rect(-4, 1.5, 12, 2.6).fill(c.turret).rect(7, 1.1, 2.2, 3.4).fill(0x2a2a24);
      this.turret.addChild(this.barrel);
      this.root.addChild(this.top, this.turret);
      this.infantry = true;
      return;
    }
    if (spec.flying) {
      // quadcopter: X frame, four translucent rotor discs, body with a sensor eye
      this.top.y = lift(flyH);
      const body = new Graphics();
      body.moveTo(-8, -8).lineTo(8, 8).moveTo(8, -8).lineTo(-8, 8).stroke({ width: 2, color: shade(c.body, 0.8) });
      for (const [dx, dy] of [[-8, -8], [8, -8], [8, 8], [-8, 8]]) body.circle(dx, dy, 5).fill({ color: c.top, alpha: 0.35 }).circle(dx, dy, 1.4).fill(c.body);
      body.rect(-5, -4, 10, 8).fill(c.body).rect(-5, -4, 10, 2).fill({ color: 0xffffff, alpha: 0.15 });
      body.circle(4, 0, 1.8).fill(c.turret);
      this.rotor = body;
      this.top.addChild(body);
      this.root.addChild(this.top);
      return;
    }

    this.tracks.y = lift(2); this.side.y = lift(5); this.top.y = lift(9); this.turret.y = lift(13);
    // tracks: dark belts with tread bars and a row of road wheels
    const tr = new Graphics().rect(-L / 2 - 1, -Wd / 2 - 1, L + 2, Wd + 2).fill(0x1d1e19);
    for (const sy of [-Wd / 2 - 1, Wd / 2 - 4]) {
      for (let x = -L / 2; x < L / 2; x += 3) tr.rect(x, sy, 1.4, 5);
      tr.fill({ color: 0x3a3b33, alpha: 0.9 });
    }
    this.tracks.addChild(tr);
    this.side.addChild(new Graphics().rect(-L / 2 + 2, -Wd / 2 + 3, L - 4, Wd - 6).fill(c.body));
    // upper hull: bevelled plate, engine grille at the rear, headlights at the front
    const top = new Graphics().rect(-L / 2 + 2, -Wd / 2 + 3, L - 4, Wd - 6).fill(c.top);
    top.rect(-L / 2 + 2, -Wd / 2 + 3, L - 4, 1.4).fill({ color: 0xffffff, alpha: 0.18 }).rect(-L / 2 + 2, Wd / 2 - 4.4, L - 4, 1.4).fill({ color: 0x000000, alpha: 0.25 });
    for (let k = 0; k < 4; k++) top.rect(-L / 2 + 4 + k * 2.2, -Wd / 2 + 6, 1, Wd - 12);
    top.fill({ color: 0x000000, alpha: 0.3 });
    top.rect(L / 2 - 3, -Wd / 2 + 4, 1.6, 2).rect(L / 2 - 3, Wd / 2 - 6, 1.6, 2).fill(0xf3e6b0);
    if (isPlayer) top.poly([L / 2 + 2, 0, L / 2 - 8, -7, L / 2 - 8, 7]).fill(0xf0b23c);
    this.top.addChild(top);
    if (spec.fixedGun !== undefined) {
      // casemate gun: barrel fixed to the hull, mounted low and forward, with a mantlet
      this.barrel.rect(0, -2.6, 28, 5.2).fill(c.turret).rect(24, -3.4, 5, 6.8).fill(shade(c.turret, 0.7)).rect(-3, -5, 6, 10).fill(shade(c.turret, 0.85));
      this.barrel.x = L / 2 - 10;
      this.turret.addChild(this.barrel);
    } else {
      // turret: chamfered octagon, commander hatch, periscope, barrel with muzzle brake
      const tw = 8;
      const tg = new Graphics().poly([-tw, -tw + 3, -tw + 3, -tw, tw - 1, -tw, tw + 2, -tw + 3, tw + 2, tw - 3, tw - 1, tw, -tw + 3, tw, -tw, tw - 3]).fill(c.turret);
      tg.rect(-tw, tw - 3.5, 2 * tw + 2, 3.5).fill({ color: 0x000000, alpha: 0.22 }).rect(-tw + 2, -tw, 2 * tw - 2, 1.4).fill({ color: 0xffffff, alpha: 0.2 });
      tg.circle(-2.5, -2, 2.6).fill(shade(c.turret, 0.72)).circle(-2.5, -2, 1.2).fill(shade(c.turret, 1.15));
      tg.rect(2, 3, 3, 2).fill(0x22313b);
      this.turret.addChild(tg);
      this.barrel.rect(0, -2.2, 22, 4.4).fill(c.turret).rect(0, -2.2, 22, 1.2).fill({ color: 0xffffff, alpha: 0.15 }).rect(19, -3, 4, 6).fill(shade(c.turret, 0.7));
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
    this.root.y = y * K - (this.spec.flying ? 0 : z * ZS);
    // on raised ground draw after the terrain strip of its own row
    this.root.zIndex = y + (z > 0 && !this.spec.flying ? C : 0);
    if (this.spec.flying) {
      // drones always fly above the roofs, so draw them over everything
      this.root.zIndex = y + 1e5;
      if (this.rotor) this.rotor.rotation = hull + Math.sin(t * 40) * 0.05;
      this.top.y = lift(z + Math.sin(t * 3 + x) * 2);
      return;
    }
    if (this.vox) {
      this.vox.sync(hull, tur, recoil);
      if (this.heading) { this.heading.rotation = hull; this.heading.visible = !dead; }
      if (dead) { this.vox.turretVisible = false; this.root.tint = 0x2c2925; }
      return;
    }
    if (this.infantry) { this.turret.rotation = tur; this.root.zIndex = y + C; return; } // standing in a doorway: over the house front
    if (this.truck) {
      this.tracks.rotation = this.top.rotation = hull; this.turret.rotation = tur;
      if (dead) this.root.tint = 0x2c2925;
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

  get voxel() { return !!this.vox; }
  /** show add-on armour and cages on a voxel vehicle */
  setGear(g: Gear) { this.vox?.setGear(g); }

  destroy() { this.root.destroy({ children: true }); }
}
