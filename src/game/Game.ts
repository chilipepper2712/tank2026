import { Container, Graphics, Text, type Application } from 'pixi.js';
import {
  C, DRONE_ALT, ENEMIES, K, LIGHT_VS_HEAVY, LOOK_AHEAD, MATERIALS, PLAYER_CLASSES, RUBBLE_SLOW, VIEW_SHORT, ZOOM, ZS,
  type EnemyType, type MaterialId, type UnitSpec,
} from '../config';
import { Particles, P } from '../render/Particles';
import { UnitView } from '../render/UnitView';
import { WorldView } from '../render/WorldView';
import { angDiff, clamp, pick, rand, rotStep } from '../util';
import { Grid } from '../world/Grid';
import { buildLevel1, type Level } from '../world/level1';
import { FlowField } from './FlowField';
import { Input, STICK_R } from './Input';

type ClassId = keyof typeof PLAYER_CLASSES;
type Kind = 'player' | EnemyType;

class Unit {
  hull: number; tur: number; hw = 0; tw = 0; hp: number; reload = 0; burstLeft = 0; burstT = 0;
  spread: number; vel = 0; dead = false; deadT = 0; recoil = 0; hitT = 9; emitT = 0;
  lock: Unit | null = null; active = false; strafe = 1; strafeT = 0; aimTarget: number | null = null;
  view: UnitView;
  constructor(public spec: UnitSpec, public kind: Kind, public team: 0 | 1, public x: number, public y: number, hull: number) {
    this.hull = hull; this.tur = hull; this.hp = spec.hp; this.spread = spec.weapon.spread * 3;
    this.view = new UnitView(spec, kind === 'player');
  }
  get flying() { return !!this.spec.flying; }
}

interface Shell { x: number; y: number; vx: number; vy: number; life: number; team: 0 | 1; dmg: number; blast: number; light: boolean; overhead: boolean; z: number }
interface Flash { x: number; y: number; r: number; life: number; max: number }
interface Float { t: Text; x: number; y: number; life: number }

export interface GameResult { won: boolean; time: number; kills: number; total: number }

export class Game {
  readonly root = new Container();
  private level: Level;
  private grid: Grid;
  private view: WorldView;
  private particles: Particles;
  private flow: FlowField;
  private input: Input;
  private units: Unit[] = [];
  private player: Unit;
  private enemies: Unit[];
  private shells: Shell[] = [];
  private flashes: Flash[] = [];
  private floats: Float[] = [];
  private hitMarks: { a: number; life: number }[] = [];
  private fx = new Graphics();
  private screen = new Graphics();
  private cam = { x: 0, y: 0 };
  private look = { x: 0, y: 0 };
  private shake = 0;
  private pointTarget: { x: number; y: number } | null = null;
  private time = 0;
  private skillCd = 0;
  private nitroT = 0;
  private rapidLeft = 0;
  private ended = false;
  private endT = 0;
  private fpsT = 0; private fpsN = 0;
  private hud = {
    hp: document.getElementById('hpFill') as HTMLElement,
    obj: document.getElementById('objective') as HTMLElement,
    fps: document.getElementById('fps') as HTMLElement,
    fire: document.getElementById('fireBtn') as HTMLButtonElement,
    skill: document.getElementById('skillBtn') as HTMLButtonElement,
  };
  private cls: (typeof PLAYER_CLASSES)[ClassId];

  private res: () => number;

  constructor(app: Application, classId: ClassId, private onEnd: (r: GameResult) => void) {
    this.res = () => app.renderer.resolution;
    this.cls = PLAYER_CLASSES[classId];
    this.level = buildLevel1();
    this.grid = this.level.grid;
    this.view = new WorldView(app.renderer, this.level);
    this.particles = new Particles(app.renderer, this.view.sorted, this.grid, this.view);
    this.flow = new FlowField(this.grid);
    this.root.addChild(this.view.root, this.screen);
    this.view.overlay.addChild(this.fx);

    const s = this.level.start;
    this.player = this.addUnit(this.cls, 'player', 0, s.x, s.y, s.hull);
    this.enemies = this.level.enemies.map((e) => this.addUnit(ENEMIES[e.type], e.type, 1, e.x, e.y, e.hull));
    this.cam.x = s.x; this.cam.y = s.y;
    this.hud.skill.textContent = this.cls.skillName;

    this.input = new Input(app.canvas, this.hud.fire, this.hud.skill, {
      tapUnit: (sx, sy) => {
        const u = this.pickEnemyAt(sx, sy);
        if (!u) return false;
        this.player.lock = u; this.pointTarget = null; return true;
      },
      tapPoint: (sx, sy) => { const [x, y] = this.screenToWorld(sx, sy); this.pointTarget = { x, y }; this.player.lock = null; },
      onFirePress: () => { if (!this.player.lock && !this.pointTarget) this.player.lock = this.nearestTarget(); },
      firstInput: () => {},
    });
  }

  private addUnit(spec: UnitSpec, kind: Kind, team: 0 | 1, x: number, y: number, hull: number) {
    const u = new Unit(spec, kind, team, x, y, hull);
    this.units.push(u);
    this.view.sorted.addChild(u.view.root);
    return u;
  }

  // ---------- camera helpers ----------
  private get zoom() { return (Math.min(innerWidth, innerHeight) / VIEW_SHORT) * ZOOM; }
  private toScreen(x: number, y: number, h = 0): [number, number] {
    const z = this.zoom;
    return [(x - this.cam.x) * z + innerWidth / 2, (y * K - h * ZS - this.cam.y * K) * z + innerHeight / 2];
  }
  private screenToWorld(sx: number, sy: number): [number, number] {
    const z = this.zoom;
    return [this.cam.x + (sx - innerWidth / 2) / z, (this.cam.y * K + (sy - innerHeight / 2) / z) / K];
  }
  private onScreen(u: Unit) {
    const [sx, sy] = this.toScreen(u.x, u.y, u.flying ? DRONE_ALT : 8);
    return sx > 10 && sx < innerWidth - 10 && sy > 10 && sy < innerHeight - 10;
  }
  private pickEnemyAt(sx: number, sy: number) {
    let best: Unit | null = null, bd = 48;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const [ex, ey] = this.toScreen(e.x, e.y, e.flying ? DRONE_ALT : 9);
      const d = Math.hypot(ex - sx, ey - sy);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  private nearestTarget() {
    const p = this.player;
    let best: Unit | null = null, bd = p.spec.weapon.range;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < bd && (e.flying || this.grid.lineClear(p.x, p.y, e.x, e.y))) { bd = d; best = e; }
    }
    return best;
  }

  // ---------- movement ----------
  private blocked(u: Unit, x: number, y: number) {
    const r = u.spec.radius;
    if (x < r || y < r || x > this.grid.W - r || y > this.grid.H - r) return true;
    if (u.flying) return false;
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      if (this.grid.solidAt(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9)) return true;
    }
    for (const o of this.units) {
      if (o === u || o.flying || (o.dead && o.kind === 'player')) continue;
      const d = Math.hypot(o.x - x, o.y - y);
      if (d < o.spec.radius + r - 2 && d < Math.hypot(o.x - u.x, o.y - u.y)) return true;
    }
    return false;
  }

  /** Steer toward direction (mx, my) with magnitude ≤ 1; hull turns with inertia, reverse when pulled backwards. */
  private drive(u: Unit, mx: number, my: number, dt: number, speedMul = 1) {
    const mag = Math.min(1, Math.hypot(mx, my));
    let v = 0, tgt = u.hull;
    if (mag > 0.15) {
      const a = Math.atan2(my, mx);
      let d = angDiff(a, u.hull), dir = 1;
      if (!u.flying && Math.abs(d) > 2.5) { d = angDiff(a + Math.PI, u.hull); dir = -1; }
      tgt = u.hull + d;
      v = u.spec.speed * mag * (u.flying ? 1 : Math.max(0, Math.cos(d))) * (dir < 0 ? 0.6 : 1) * dir * speedMul;
    }
    [u.hull, u.hw] = rotStep(u.hull, u.hw, tgt, u.spec.hullTurn, u.spec.hullInertia, dt);
    if (!u.flying && this.grid.rubbleAt(u.x, u.y)) v *= u.spec.heavy ? RUBBLE_SLOW : RUBBLE_SLOW * 0.8;
    const dirA = u.flying && mag > 0.15 ? Math.atan2(my, mx) : u.hull;
    const nx = u.x + Math.cos(dirA) * v * dt, ny = u.y + Math.sin(dirA) * v * dt;
    let moved = false;
    if (!this.blocked(u, nx, u.y)) { u.x = nx; moved = true; }
    if (!this.blocked(u, u.x, ny)) { u.y = ny; moved = true; }
    u.vel = moved ? Math.abs(v) : 0;
    return moved || mag <= 0.15;
  }

  /** Turn the gun toward `target`; casemate guns only swing within their arc. */
  private aim(u: Unit, target: number | null, dt: number) {
    u.aimTarget = target;
    const s = u.spec;
    if (target === null) { u.tw = 0; return; }
    if (s.fixedGun !== undefined) {
      const rel = clamp(angDiff(target, u.hull), -s.fixedGun, s.fixedGun);
      [u.tur, u.tw] = rotStep(u.tur, u.tw, u.hull + rel, s.turretTurn, s.turretInertia, dt);
    } else [u.tur, u.tw] = rotStep(u.tur, u.tw, u.tur + angDiff(target, u.tur), s.turretTurn, s.turretInertia, dt);
  }

  private aligned(u: Unit) {
    return u.aimTarget !== null && Math.abs(angDiff(u.aimTarget, u.tur)) < Math.max(0.03, u.spread);
  }

  private updateSpread(u: Unit, dt: number) {
    const base = u.spec.weapon.spread;
    const tgt = base + Math.abs(u.tw) * 0.09 + Math.abs(u.hw) * 0.07 + (u.vel / u.spec.speed) * 0.05;
    if (tgt > u.spread) u.spread = tgt;
    else u.spread += (tgt - u.spread) * (1 - Math.exp((-dt * 3) / Math.max(0.05, u.spec.aimTime)));
  }

  // ---------- weapons ----------
  private pull(u: Unit) {
    if (u.reload > 0 || u.burstLeft > 0) return;
    u.burstLeft = u.spec.weapon.burst; u.burstT = 0;
    const isP = u === this.player;
    if (isP && this.rapidLeft > 0) { this.rapidLeft--; u.reload = 0.18; }
    else u.reload = u.spec.weapon.reload + u.spec.weapon.burst * u.spec.weapon.burstGap;
  }

  private shoot(u: Unit) {
    const w = u.spec.weapon, isP = u === this.player;
    const a = u.tur + (Math.random() * 2 - 1) * u.spread, c = Math.cos(a), s = Math.sin(a);
    const muzzle = u.flying ? 8 : u.spec.fixedGun !== undefined ? u.spec.size[0] / 2 + 16 : 26;
    const x = u.x + c * muzzle, y = u.y + s * muzzle, z = u.flying ? DRONE_ALT : 13;
    this.shells.push({ x, y, vx: c * w.speed, vy: s * w.speed, life: w.range / w.speed, team: u.team, dmg: w.dmg, blast: w.blast, light: !!w.light, overhead: !!w.overhead, z });
    u.recoil = 1;
    u.spread += w.light ? 0.012 : 0.05;
    const big = w.dmg >= 20;
    for (let k = 0; k < (big ? 3 : 1); k++) this.particles.emit(P.Fire, x, y, z, c * rand(40, 90), s * rand(40, 90), rand(10, 30), rand(0.08, 0.16), rand(big ? 4 : 2, big ? 7 : 4), 0xffcf6a);
    if (big) for (let k = 0; k < 3; k++) this.particles.emit(P.Smoke, x, y, z, c * rand(20, 50), s * rand(20, 50), rand(5, 15), rand(0.6, 1.1), rand(3, 6), 0x6a6862);
    if (isP) this.shake = Math.max(this.shake, big ? 2.5 : 0.8);
  }

  private updateWeapon(u: Unit, dt: number) {
    u.reload -= dt; u.recoil = Math.max(0, u.recoil - dt * 5);
    if (u.burstLeft > 0) { u.burstT -= dt; if (u.burstT <= 0) { this.shoot(u); u.burstLeft--; u.burstT = u.spec.weapon.burstGap; } }
  }

  private damage(t: Unit, s: Shell) {
    let mul = 1, label = '';
    if (!t.flying) {
      const rel = Math.abs(angDiff(Math.atan2(s.y - t.y, s.x - t.x), t.hull)), f = t.spec.facing;
      if (rel < Math.PI / 4) { mul = f.front; label = 'TRƯỚC'; } else if (rel > (Math.PI * 3) / 4) { mul = f.rear; label = 'SAU'; } else { mul = f.side; label = 'HÔNG'; }
    }
    if (s.light && t.spec.heavy) mul *= LIGHT_VS_HEAVY;
    t.hp -= s.dmg * mul; t.hitT = 0; t.active = true;
    if (label && (t === this.player || s.team === 0) && s.dmg >= 10) this.addFloat(t.x, t.y, `${label} ×${mul.toFixed(1)}`, mul > 1.05 ? 0xff8a5c : mul < 0.95 ? 0xc9c6b4 : 0xf0b23c);
    if (t === this.player) this.hitMarks.push({ a: Math.atan2(-s.vy, -s.vx), life: 1 });
    for (let k = 0; k < 4; k++) this.particles.emit(P.Spark, s.x, s.y, 10, rand(-200, 200), rand(-200, 200), rand(40, 180), rand(0.2, 0.4), 1, 0xffd27a);
    if (t.hp <= 0) this.kill(t);
  }

  private kill(t: Unit) {
    t.dead = true; t.deadT = 0;
    if (t.flying) {
      this.explode(t.x, t.y, 0, 0, 14);
      for (let k = 0; k < 6; k++) this.particles.emit(P.Chunk, t.x, t.y, DRONE_ALT, rand(-80, 80), rand(-80, 80), rand(0, 120), rand(2, 4), rand(1.5, 3), 0x3a3836);
      t.view.root.visible = false;
    } else {
      this.explode(t.x, t.y, 38, 70, 46);
      for (let k = 0; k < 14; k++) { const a = Math.random() * 6.283, sp = rand(60, 240); this.particles.emit(P.Chunk, t.x, t.y, rand(4, 14), Math.cos(a) * sp, Math.sin(a) * sp, rand(120, 320), rand(3, 6), rand(2, 4), Math.random() < 0.5 ? 0x2c2925 : 0x4a4038); }
      this.particles.emit(P.Chunk, t.x, t.y, 16, rand(-60, 60), rand(-60, 60), 420, 6, 8, t.spec.colors.turret);
      // cook-off splash
      for (const o of this.units) {
        if (o === t || o.dead) continue;
        const d = Math.hypot(o.x - t.x, o.y - t.y);
        if (d < 60) { o.hp -= 15 * (1 - d / 60); o.hitT = 0; if (o.hp <= 0) this.kill(o); }
      }
    }
    if (t === this.player) this.shake = 12;
    for (const u of this.units) if (u.lock === t) u.lock = null;
  }

  /** Terrain damage, flash, fire, smoke and a scorch mark. */
  private explode(x: number, y: number, rad: number, dmg: number, visual = rad) {
    const g = this.grid;
    let budget = 80;
    if (rad > 0) {
      const c0 = Math.max(0, Math.floor((x - rad) / C)), c1 = Math.min(g.GW - 1, Math.floor((x + rad) / C));
      const r0 = Math.max(0, Math.floor((y - rad) / C)), r1 = Math.min(g.GH - 1, Math.floor((y + rad) / C));
      for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) {
        const i = cy * g.GW + cx, m = g.mat[i];
        if (!Grid.isSolid(m)) continue;
        const d = Math.hypot(cx * C + 5 - x, cy * C + 5 - y);
        if (d > rad) continue;
        g.hp[i] -= dmg * (1 - (0.65 * d) / rad);
        const mt = MATERIALS[m as MaterialId];
        if (g.hp[i] <= 0) budget = this.breakCell(i, cx, cy, m as MaterialId, x, y, budget);
        else if (budget > 0 && Math.random() < 0.25) {
          this.particles.emit(P.Chunk, cx * C + 5, cy * C + 5, rand(0, g.ht[i]), rand(-90, 90), rand(-90, 90), rand(60, 160), rand(2, 4), mt.size[0], mt.debris[0]);
          if (mt.spark) this.particles.emit(P.Spark, cx * C + 5, cy * C + 5, rand(2, g.ht[i]), rand(-200, 200), rand(-200, 200), rand(40, 160), 0.3, 1, 0xffd27a);
          budget--;
        }
      }
    }
    const v = Math.max(visual, 8);
    this.flashes.push({ x, y, r: v * 1.6, life: 0.16, max: 0.16 });
    const nf = v > 15 ? 6 : 2;
    for (let k = 0; k < nf; k++) this.particles.emit(P.Fire, x + rand(-4, 4), y + rand(-4, 4), rand(2, 8), rand(-40, 40), rand(-40, 40), rand(30, 70), rand(0.25, 0.5), rand(3, v * 0.35), Math.random() < 0.5 ? 0xffb347 : 0xff7a2f);
    for (let k = 0; k < nf - 1; k++) this.particles.emit(P.Smoke, x + rand(-6, 6), y + rand(-6, 6), rand(4, 12), rand(-18, 18), rand(-18, 18), rand(14, 30), rand(1.2, 2.4), rand(4, 9), 0x56554f);
    for (let k = 0; k < nf; k++) this.particles.emit(P.Spark, x, y, rand(2, 10), rand(-220, 220), rand(-220, 220), rand(40, 180), rand(0.15, 0.35), 1, 0xffe0a0);
    if (rad > 12) this.view.bakeScorch(x, y, rad * 0.9);
    const pd = Math.hypot(this.player.x - x, this.player.y - y);
    if (pd < 380) this.shake = Math.max(this.shake, (1 - pd / 380) * v * 0.28);
  }

  private breakCell(i: number, cx: number, cy: number, m: MaterialId, ex: number, ey: number, budget: number) {
    const o = MATERIALS[m], ccx = cx * C + 5, ccy = cy * C + 5, h = this.grid.ht[i];
    let ax = ccx - ex, ay = ccy - ey;
    const al = Math.hypot(ax, ay);
    if (al < 1) { const a = Math.random() * 6.283; ax = Math.cos(a); ay = Math.sin(a); } else { ax /= al; ay /= al; }
    const base = Math.atan2(ay, ax), n = Math.min(budget, o.chunks + (Math.random() < 0.5 ? 1 : 0));
    for (let k = 0; k < n; k++) {
      const sp = rand(60, 230), a = base + rand(-0.9, 0.9);
      this.particles.emit(o.splinter ? P.Splinter : P.Chunk, ccx + rand(-4, 4), ccy + rand(-4, 4), rand(0, h), Math.cos(a) * sp, Math.sin(a) * sp, rand(60, 270), rand(2.5, 5), rand(o.size[0], o.size[1]), pick(o.debris));
    }
    if (o.spark) for (let k = 0; k < 4; k++) this.particles.emit(P.Spark, ccx, ccy, rand(2, h), rand(-260, 260), rand(-260, 260), rand(40, 200), rand(0.2, 0.5), 1, Math.random() < 0.5 ? 0xffd27a : 0xfff4c8);
    if (o.dust !== undefined && Math.random() < 0.6) this.particles.emit(P.Dust, ccx, ccy, rand(0, h * 0.6), ax * rand(10, 40), ay * rand(10, 40), 0, rand(1, 2), rand(4, 8), o.dust);
    this.grid.breakCell(i);
    return budget - n;
  }

  private updateShells(dt: number) {
    for (let k = this.shells.length - 1; k >= 0; k--) {
      const s = this.shells[k], steps = Math.max(1, Math.ceil((Math.hypot(s.vx, s.vy) * dt) / 5)), sdt = dt / steps;
      let done = false;
      for (let st = 0; st < steps && !done; st++) {
        s.x += s.vx * sdt; s.y += s.vy * sdt; s.life -= sdt;
        const ci = this.grid.idx(s.x, s.y);
        if (ci < 0) { done = true; break; }
        if (!s.overhead && Grid.isSolid(this.grid.mat[ci])) { this.explode(s.x, s.y, s.blast, s.dmg); done = true; break; }
        for (const t of this.units) {
          if (t.dead || t.team === s.team) continue;
          const r = t.spec.radius + (s.team === 0 && t.flying ? 4 : 0);
          if ((t.x - s.x) ** 2 + (t.y - s.y) ** 2 < r * r) { this.damage(t, s); this.explode(s.x, s.y, s.blast * 0.6, s.dmg * 0.5, Math.max(8, s.blast * 0.6)); done = true; break; }
        }
        if (!done && s.life <= 0) { this.explode(s.x, s.y, s.overhead ? 0 : s.blast * 0.7, s.dmg * 0.6, Math.max(6, s.blast * 0.7)); done = true; }
      }
      if (done) this.shells.splice(k, 1);
    }
  }

  // ---------- player ----------
  private updatePlayer(dt: number) {
    const p = this.player, inp = this.input;
    if (p.dead) return;
    // skill
    this.skillCd -= dt; this.nitroT -= dt;
    if (inp.takeSkill() && this.skillCd <= 0) {
      this.skillCd = this.cls.skillCd;
      if (this.cls.skill === 'nitro') this.nitroT = 2;
      else { this.rapidLeft = 2; p.reload = Math.min(p.reload, 0.1); }
    }
    const nitro = this.nitroT > 0;
    if (nitro && Math.random() < 0.5) this.particles.emit(P.Smoke, p.x - Math.cos(p.hull) * 18, p.y - Math.sin(p.hull) * 18, 6, 0, 0, 10, 0.5, 3, 0x6a6862);
    this.drive(p, inp.move.x, inp.move.y, dt, nitro ? 1.75 : 1);

    // aim: gamepad stick (soft assist) > mouse > touch target
    let target: number | null = null, lx = 0, ly = 0;
    if (p.lock && (p.lock.dead || Math.hypot(p.lock.x - p.x, p.lock.y - p.y) > 800)) p.lock = null;
    if (inp.gpAim) {
      const raw = Math.atan2(inp.gpAim[1], inp.gpAim[0]);
      p.lock = this.assist(raw);
      target = p.lock ? Math.atan2(p.lock.y - p.y, p.lock.x - p.x) : raw;
      [lx, ly] = inp.gpAim;
    } else if (inp.mouse.active) {
      const [wx, wy] = this.screenToWorld(inp.mouse.x, inp.mouse.y);
      target = Math.atan2(wy - p.y, wx - p.x); p.lock = null;
      lx = clamp((inp.mouse.x - innerWidth / 2) / (innerWidth / 2), -1, 1);
      ly = clamp((inp.mouse.y - innerHeight / 2) / (innerHeight / 2), -1, 1);
    } else {
      const tg = p.lock ?? this.pointTarget;
      if (tg) {
        const dx = tg.x - p.x, dy = tg.y - p.y, d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 400) * 0.8;
        target = Math.atan2(dy, dx); lx = (dx / d) * k; ly = (dy / d) * k;
      } else { lx = Math.cos(p.tur) * 0.35; ly = Math.sin(p.tur) * 0.35; }
    }
    this.look.x += (lx - this.look.x) * Math.min(1, dt * 8);
    this.look.y += (ly - this.look.y) * Math.min(1, dt * 8);
    this.aim(p, target, dt);
    this.updateSpread(p, dt);
    const al = this.aligned(p);
    if (inp.instantFire || (inp.fireHeld && (al || target === null))) this.pull(p);
    this.updateWeapon(p, dt);
    p.hitT += dt;
    if (p.hitT > 3) p.hp = Math.min(p.spec.hp, p.hp + 3 * dt);
  }

  private assist(a: number) {
    const p = this.player;
    let best: Unit | null = null, bd = 10 * (Math.PI / 180);
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (Math.hypot(e.x - p.x, e.y - p.y) > p.spec.weapon.range) continue;
      const df = Math.abs(angDiff(Math.atan2(e.y - p.y, e.x - p.x), a));
      if (df < bd && (e.flying || this.grid.lineClear(p.x, p.y, e.x, e.y))) { bd = df; best = e; }
    }
    return best;
  }

  // ---------- enemies ----------
  private updateEnemy(e: Unit, dt: number) {
    const p = this.player;
    this.updateWeapon(e, dt);
    e.hitT += dt;
    if (e.dead) {
      e.deadT += dt;
      if (!e.flying && e.deadT < 10) {
        e.emitT -= dt;
        if (e.emitT <= 0) {
          e.emitT = 0.08;
          this.particles.emit(P.Smoke, e.x + rand(-6, 6), e.y + rand(-6, 6), 12, rand(-8, 8), rand(-8, 8), rand(18, 34), rand(1.5, 2.6), rand(5, 9), 0x3e3d39);
          if (Math.random() < 0.7) this.particles.emit(P.Fire, e.x + rand(-8, 8), e.y + rand(-8, 8), 8, rand(-10, 10), rand(-10, 10), rand(30, 60), rand(0.3, 0.6), rand(4, 8), Math.random() < 0.5 ? 0xff9a3c : 0xffcf6a);
        }
      }
      return;
    }
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy), toP = Math.atan2(dy, dx);
    if (!e.active) {
      if (!p.dead && d < (e.flying ? 700 : 620)) e.active = true;
      else { this.updateSpread(e, dt); return; }
    }
    const w = e.spec.weapon;
    const los = e.flying || this.grid.lineClear(e.x, e.y, p.x, p.y);
    const canSee = !p.dead && los && d < w.range;
    let mx = 0, my = 0;

    switch (e.kind) {
      case 'drone': {
        const orbit = Math.atan2(e.y - p.y, e.x - p.x) + 0.6 * e.strafe;
        const tx = p.x + Math.cos(orbit) * 150, ty = p.y + Math.sin(orbit) * 150;
        mx = tx - e.x; my = ty - e.y;
        const l = Math.hypot(mx, my); if (l > 1) { mx /= l; my /= l; } else { mx = my = 0; }
        if (Math.hypot(mx, my) > 0.15) e.hull = Math.atan2(my, mx);
        e.strafeT -= dt; if (e.strafeT <= 0) { e.strafe = Math.random() < 0.5 ? 1 : -1; e.strafeT = rand(3, 6); }
        break;
      }
      case 'td': {
        // ambusher: hold position, swing the whole hull toward the player, creep forward only when blind
        if (!(canSee || (los && d < w.range + 120))) {
          const n = d < 900 ? this.flow.next(e.x, e.y) : null;
          if (n) { mx = (n[0] - e.x) * 0.6; my = (n[1] - e.y) * 0.6; const l = Math.hypot(mx, my); if (l > 0.6) { mx *= 0.6 / l; my *= 0.6 / l; } }
        } else {
          const tgt = e.hull + angDiff(toP, e.hull);
          [e.hull, e.hw] = rotStep(e.hull, e.hw, tgt, e.spec.hullTurn, e.spec.hullInertia, dt);
          e.vel = 0;
        }
        break;
      }
      case 'apc': {
        if (canSee) {
          // circle the player at ~200 px
          const side = toP + (Math.PI / 2) * e.strafe, rad = (d - 200) / 200;
          mx = Math.cos(side) + Math.cos(toP) * rad; my = Math.sin(side) + Math.sin(toP) * rad;
          e.strafeT -= dt; if (e.strafeT <= 0) { e.strafe *= -1; e.strafeT = rand(2.5, 4.5); }
        } else { const n = this.flow.next(e.x, e.y); if (n) { mx = n[0] - e.x; my = n[1] - e.y; } else { mx = dx; my = dy; } }
        break;
      }
      default: {
        if (!(canSee && d < w.range * 0.85)) { const n = this.flow.next(e.x, e.y); if (n) { mx = n[0] - e.x; my = n[1] - e.y; } else { mx = dx; my = dy; } }
      }
    }
    if (e.kind !== 'td' || mx || my) {
      const ok = this.drive(e, mx, my, dt);
      if (!ok && e.kind === 'apc') e.strafe *= -1;
    }
    this.aim(e, !p.dead && d < 520 ? toP : null, dt);
    this.updateSpread(e, dt);
    // fairness rule: only shoot from where the player can see you
    if (canSee && this.onScreen(e) && this.aligned(e) && Math.abs(angDiff(toP, e.tur)) < 0.12) this.pull(e);
  }

  // ---------- frame ----------
  update(dtRaw: number) {
    const dt = Math.min(0.033, dtRaw);
    this.time += dt;
    this.input.poll();
    this.updatePlayer(dt);
    this.flow.update(dt, this.player.x, this.player.y);
    for (const e of this.enemies) this.updateEnemy(e, dt);
    this.updateShells(dt);
    this.particles.update(dt);
    for (let k = this.flashes.length - 1; k >= 0; k--) if ((this.flashes[k].life -= dt) <= 0) this.flashes.splice(k, 1);
    for (let k = this.hitMarks.length - 1; k >= 0; k--) if ((this.hitMarks[k].life -= dt * 0.9) <= 0) this.hitMarks.splice(k, 1);
    for (let k = this.floats.length - 1; k >= 0; k--) {
      const f = this.floats[k];
      f.life -= dt;
      if (f.life <= 0) { f.t.destroy(); this.floats.splice(k, 1); continue; }
      f.t.alpha = Math.min(1, f.life * 2);
      f.t.y = f.y * K - 30 - (1.1 - f.life) * 26;
    }
    this.updateCamera(dt);
    this.render();
    this.updateHud(dtRaw);
    this.checkEnd(dt);
  }

  private updateCamera(dt: number) {
    const z = this.zoom, vw = innerWidth / z, vh = innerHeight / z / K, p = this.player;
    const tx = p.x + this.look.x * vw * LOOK_AHEAD, ty = p.y + this.look.y * vh * LOOK_AHEAD, a = 1 - Math.exp(-dt * 5);
    this.cam.x += (tx - this.cam.x) * a; this.cam.y += (ty - this.cam.y) * a;
    const W = this.grid.W, H = this.grid.H;
    this.cam.x = W > vw ? clamp(this.cam.x, vw / 2, W - vw / 2) : W / 2;
    this.cam.y = H > vh ? clamp(this.cam.y, vh / 2, H - vh / 2) : H / 2;
    this.shake *= Math.pow(0.004, dt);
  }

  private render() {
    const z = this.zoom, w = innerWidth, h = innerHeight;
    const sx = (Math.random() - 0.5) * this.shake, sy = (Math.random() - 0.5) * this.shake;
    const vr = this.view.root;
    vr.scale.set(z);
    vr.x = w / 2 - this.cam.x * z + sx;
    vr.y = h / 2 - this.cam.y * K * z + sy;
    const hw = w / 2 / z, hh = h / 2 / z;
    this.view.update(this.cam.x - hw, this.cam.x + hw, this.cam.y * K - hh, this.cam.y * K + hh);
    for (const u of this.units) u.view.sync(u.x, u.y, u.hull, u.tur, u.recoil, u.dead, this.time);

    // world-space overlay: shells, flashes, target marker, health bars
    const g = this.fx;
    g.clear();
    for (const s of this.shells) {
      const y = s.y * K - s.z * ZS, ty = (s.y - s.vy * 0.03) * K - s.z * ZS;
      g.moveTo(s.x - s.vx * 0.03, ty).lineTo(s.x, y).stroke({ width: s.light ? 1.6 : 2.4, color: s.team ? 0xff9a7a : 0xffe2a0 });
    }
    for (const f of this.flashes) {
      const k = f.life / f.max, y = f.y * K - 6;
      g.circle(f.x, y, f.r).fill({ color: 0xff9a3c, alpha: 0.35 * k });
      g.circle(f.x, y, f.r * 0.5).fill({ color: 0xffecb4, alpha: 0.75 * k });
    }
    const p = this.player;
    if (!p.dead) {
      const e = p.lock;
      if (e && !e.dead) {
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        const ok = d < p.spec.weapon.range && (e.flying || this.grid.lineClear(p.x, p.y, e.x, e.y));
        const al = this.aligned(p);
        const col = !ok ? 0xebe7d3 : al && p.spread < p.spec.weapon.spread + 0.012 ? 0x9fd16a : 0xf0b23c;
        const S = clamp(20 + d * p.spread * 0.8, 20, 46), G = 8, cx = e.x, cy = e.y * K - (e.flying ? DRONE_ALT : 8) * ZS;
        for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) g.moveTo(cx + a * S, cy + b * (S - G) * K).lineTo(cx + a * S, cy + b * S * K).lineTo(cx + a * (S - G), cy + b * S * K);
        g.stroke({ width: 2.2, color: col, alpha: ok ? 1 : 0.55 });
      } else if (this.pointTarget) {
        const { x, y } = this.pointTarget, yy = y * K;
        g.moveTo(x - 7, yy - 7 * K).lineTo(x + 7, yy + 7 * K).moveTo(x + 7, yy - 7 * K).lineTo(x - 7, yy + 7 * K).stroke({ width: 2, color: 0xf0b23c });
      }
      if (this.input.mouse.active) {
        const D = 200, ex = p.x + Math.cos(p.tur) * D, ey = (p.y + Math.sin(p.tur) * D) * K - 13 * ZS, rr = Math.max(3, D * p.spread);
        g.ellipse(ex, ey, rr, rr * K).stroke({ width: 1.4, color: this.aligned(p) ? 0x9fd16a : 0xf0b23c });
      }
      if (this.view.occluded(p.x, p.y)) {
        const L = p.spec.size[0] / 2, Wd = p.spec.size[1] / 2, c = Math.cos(p.hull), s = Math.sin(p.hull), oy = p.y * K - 9 * ZS;
        const pts = [[L, Wd], [L, -Wd], [-L, -Wd], [-L, Wd]].flatMap(([a, b]) => [p.x + a * c - b * s, oy + (a * s + b * c) * K]);
        g.poly(pts).stroke({ width: 2, color: 0xf0b23c, alpha: 0.85 });
      }
    }
    for (const e of this.enemies) {
      if (e.dead || e.hp >= e.spec.hp) continue;
      const y = e.y * K - (e.flying ? DRONE_ALT * ZS + 16 : 30);
      g.rect(e.x - 16, y, 32, 4).fill({ color: 0x000000, alpha: 0.6 });
      g.rect(e.x - 16, y, (32 * Math.max(0, e.hp)) / e.spec.hp, 4).fill(0xe4573f);
    }

    // screen-space overlay: off-screen arrows, hit direction, drive stick
    const sg = this.screen;
    sg.clear();
    for (const e of this.enemies) {
      if (e.dead || !e.active) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d > 900) continue;
      const [ex, ey] = this.toScreen(e.x, e.y, 8);
      if (ex > -8 && ex < w + 8 && ey > -8 && ey < h + 8) continue;
      const dx = ex - w / 2, dy = ey - h / 2, s = Math.min((w / 2 - 34) / Math.abs(dx || 1e-6), (h / 2 - 34) / Math.abs(dy || 1e-6));
      const ix = w / 2 + dx * s, iy = h / 2 + dy * s, a = Math.atan2(dy, dx), c = Math.cos(a), sn = Math.sin(a);
      const pt = (fx: number, fy: number) => [ix + fx * c - fy * sn, iy + fx * sn + fy * c];
      const locked = d < e.spec.weapon.range;
      sg.poly([...pt(12, 0), ...pt(-6, -8), ...pt(-6, 8)]).fill({ color: locked ? 0xe4573f : 0xf0b23c, alpha: locked ? 0.75 + 0.25 * Math.sin(this.time * 12) : 0.7 });
    }
    const rr = Math.min(w, h) * 0.42;
    for (const m of this.hitMarks) {
      const a = Math.atan2(Math.sin(m.a) * K, Math.cos(m.a));
      sg.arc(w / 2, h / 2, rr, a - 0.35, a + 0.35).stroke({ width: 6, color: 0xe4573f, alpha: m.life });
    }
    if (p.hitT < 0.25 && !p.dead) sg.rect(0, 0, w, h).fill({ color: 0xe43c28, alpha: 0.22 * (1 - p.hitT / 0.25) });
    const st = this.input.stick;
    if (st.id >= 0) {
      const [dx, dy] = this.input.stickVec();
      sg.circle(st.ox, st.oy, STICK_R).stroke({ width: 2, color: 0xebe7d3, alpha: 0.35 });
      sg.circle(st.ox + dx * STICK_R, st.oy + dy * STICK_R, 20).fill({ color: 0xebe7d3, alpha: 0.55 });
    } else if (this.input.coarse) {
      const gx = Math.max(84, w * 0.13), gy = h - 96;
      sg.circle(gx, gy, STICK_R).stroke({ width: 2, color: 0xebe7d3, alpha: 0.16 });
      sg.circle(gx, gy, 20).fill({ color: 0xebe7d3, alpha: 0.12 });
    }
  }

  private addFloat(x: number, y: number, txt: string, color: number) {
    const t = new Text({ text: txt, style: { fontFamily: 'Chakra Petch, ui-monospace, monospace', fontSize: 11, fontWeight: '600', fill: color } });
    const stack = this.floats.filter((f) => f.life > 0.6 && Math.abs(f.x - x) < 30 && Math.abs(f.y - y) < 30).length;
    y -= stack * 14 / K;
    t.anchor.set(0.5); t.x = x; t.y = y * K - 30; t.resolution = 2;
    t.scale.set(1 / this.zoom);
    this.view.overlay.addChild(t);
    this.floats.push({ t, x, y, life: 1.1 });
    if (this.floats.length > 8) { const f = this.floats.shift()!; f.t.destroy(); }
  }

  private lastHud = { hp: -1, left: -1, state: '', rl: '', sk: '' };
  private updateHud(dtRaw: number) {
    const p = this.player, H = this.hud, L = this.lastHud;
    const hp = Math.round((Math.max(0, p.hp) / p.spec.hp) * 100);
    if (hp !== L.hp) { L.hp = hp; H.hp.style.width = hp + '%'; H.hp.classList.toggle('low', hp < 35); }
    const left = this.enemies.filter((e) => !e.dead).length;
    if (left !== L.left) { L.left = left; H.obj.textContent = `${this.level.objective} · còn ${left}/${this.enemies.length}`; }
    const state = !(p.lock || this.pointTarget) ? 'idle' : this.aligned(p) && p.spread < p.spec.weapon.spread + 0.012 ? 'ready' : 'turning';
    if (state !== L.state) { L.state = state; H.fire.dataset.state = state; }
    const full = p.spec.weapon.reload + p.spec.weapon.burst * p.spec.weapon.burstGap;
    const rl = String(Math.round(clamp(1 - p.reload / full, 0, 1) * 20) / 20);
    if (rl !== L.rl) { L.rl = rl; H.fire.style.setProperty('--rl', rl); }
    const sk = String(Math.round(clamp(1 - this.skillCd / this.cls.skillCd, 0, 1) * 20) / 20);
    if (sk !== L.sk) { L.sk = sk; H.skill.style.setProperty('--rl', sk); H.skill.dataset.ready = String(this.skillCd <= 0); }
    this.fpsT += dtRaw; this.fpsN++;
    if (this.fpsT > 0.5) { H.fps.textContent = `${Math.round(this.fpsN / this.fpsT)} fps · ${this.particles.alive} hạt · ×${this.res()}`; this.fpsT = 0; this.fpsN = 0; }
  }

  private checkEnd(dt: number) {
    if (this.ended) return;
    const won = this.enemies.every((e) => e.dead), lost = this.player.dead;
    if (!won && !lost) return;
    this.endT += dt;
    if (this.endT < 1.6) return;
    this.ended = true;
    this.onEnd({ won, time: this.time, kills: this.enemies.filter((e) => e.dead).length, total: this.enemies.length });
  }

  destroy() {
    this.input.destroy();
    this.root.destroy({ children: true });
    this.view.ground.destroy(true);
  }
}
