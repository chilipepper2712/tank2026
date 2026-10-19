import { Container, Graphics, Text, type Application } from 'pixi.js';
import {
  ALLIES, ATGM, C, MAT, PIERCE, REPAIR, REPAIR_DROID_RATE, type AllyType, DRONE_ALT, DRONE_CLEARANCE, ENEMIES, K, LIGHT_VS_HEAVY, MATERIALS, MG, PLAYER_CLASSES, RUBBLE_SLOW, VIEW_SHORT, ZS, INFANTRY, KAMIKAZE, TRUCK, FRIEND_TANK,
  type EnemyType, type MaterialId, type UnitSpec,
} from '../config';
import { Particles, P } from '../render/Particles';
import { UnitView } from '../render/UnitView';
import { WorldView } from '../render/WorldView';
import { angDiff, clamp, pick, rand, rotStep } from '../util';
import { settings } from '../settings';
import { derive, emptyLevels, MAX_LEVEL, UP_IDS, UPGRADES, describe, type Levels, type Loadout, type UpId } from '../upgrades';
import { Grid, STEP } from '../world/Grid';
import { sfx } from '../audio/Sfx';
import type { Level, Mission } from '../world/city';
import { LEVELS } from '../world/levels';
import { FlowField } from './FlowField';
import { Input, STICK_R } from './Input';
import { FrameTracker, newMission, type KillWeapon, type MissionStats } from './Stats';

import type { ClassId } from '../upgrades';
type Kind = 'player' | EnemyType | AllyType | 'truck' | 'friend';

class Unit {
  hull: number; tur: number; hw = 0; tw = 0; hp: number; reload = 0; burstLeft = 0; burstT = 0;
  spread: number; vel = 0; dead = false; deadT = 0; recoil = 0; hitT = 9; emitT = 0;
  z = 0;
  target: Unit | null = null; retarget = 0; slot = 0; squad = -1;
  // ground AI: planned route, where it is heading, and the fight state (advance / fire / hide / peek)
  route: [number, number][] = []; routeT = 0; goal: [number, number] | null = null;
  mode: 'adv' | 'fire' | 'hide' | 'peek' = 'adv'; modeT = 0; peek: [number, number] | null = null; hide: [number, number] | null = null; bearing = 0;
  stuckT = 0; escT = 0; escA = 0;
  // infantry: hidden until spotted; aims visibly (telegraphT ≥ 0) before firing; may move to another house front
  hidden = false; revealT = 0; telegraphT = -1; moveTo: [number, number] | null = null; mine = false;
  // kamikaze: swarm index, lock-on timer, dive
  wp = 0; arrived = false; // supply truck on its route
  zoneRush = false;
  byPlayer = false; // last hit came from the player's vehicle (kill credit)
  hitBy: KillWeapon | '' = ''; hitAt = -1; hitFlank = false; // stats: the player's last hit on this unit, when, and whether it was side/rear
  axis: [number, number][] | null = null; // friendly tank's own attack route // hold-mission reinforcements: take the zone unless the player is in sight
  swarm = -1; lockT = -1; diving = false; lockX = 0; lockY = 0; diveFrom = 0;
  adj = 0; closer = 1; // shifts to the approach point when it turns out to have no line of sight
  lock: Unit | null = null; active = false; strafe = 1; strafeT = 0; aimTarget: number | null = null;
  view: UnitView;
  constructor(public spec: UnitSpec, public kind: Kind, public team: 0 | 1, public x: number, public y: number, hull: number) {
    this.hull = hull; this.tur = hull; this.hp = spec.hp; this.spread = spec.weapon.spread * 3;
    if (spec.flying) this.z = DRONE_ALT;
    this.view = new UnitView(spec, kind === 'player');
  }
  get flying() { return !!this.spec.flying; }
}

interface Shell { x: number; y: number; vx: number; vy: number; life: number; team: 0 | 1; dmg: number; blast: number; light: boolean; overhead: boolean; z: number; pierce: number; rpg?: boolean; own?: boolean }
interface Missile { x: number; y: number; z: number; a: number; target: Unit | null; tx: number; ty: number; life: number; trail: number }
interface Tracer { x0: number; y0: number; z0: number; x1: number; y1: number; z1: number; life: number }
interface Flash { x: number; y: number; r: number; life: number; max: number }
interface Float { t: Text; x: number; y: number; life: number }

/** how far the player's gunfire carries: enemies within this range come to investigate */
const HEARING = 1000; // 200 m
/** kills (soft targets count half) that charge one air strike; the charge carries over between missions */
const SUPPORT_KILLS = 15;
const SUPPORT_KEY = 'tank2026.support';
const loadSupport = () => { try { return Math.min(SUPPORT_KILLS, +(localStorage.getItem(SUPPORT_KEY) || 0) || 0); } catch { return 0; } };
const STREAK_GAP = 8;
const TIPS_KEY = 'tank2026.hudTips', TIPS_MISSIONS = 3, TIPS_TIME = 12;
/** inline icon from the sprite in index.html */
const ic = (id: string, cls = '') => `<svg class="ic ${cls}"><use href="#i-${id}"/></svg>`;
const STREAK_TITLES: Record<number, string> = { 2: 'DOUBLE-KILL', 5: 'ÁT CHỦ BÀI', 10: 'HUYỀN THOẠI' };
/** pick-up crates are pulled in from this far (12 m) */
const MAGNET = 60;

export interface GameResult { won: boolean; playerDead: boolean; level: number; time: number; kills: number; total: number; collected: UpId[]; stats: MissionStats }

export class Game {
  readonly root = new Container();
  private level: Level;
  private grid: Grid;
  private view: WorldView;
  private particles: Particles;
  private flow: FlowField;
  /** enemy cunning: 1 spread out and surround, 2 also use cover (peek, shoot, hide), 3 also a front anchor plus wide flankers */
  private aiTier: number;
  private squads: { route: [number, number][]; wp: number; members: Unit[]; alert: boolean; base?: number; baseT: number }[] = [];
  private input: Input;
  private units: Unit[] = [];
  private player: Unit;
  private enemies: Unit[];
  private allies: Unit[] = [];
  private convoy: Unit[] = [];
  /** expanding shockwave rings from vehicle kills, and a full-screen flash level */
  private waves: { x: number; y: number; life: number; max: number; r: number }[] = [];
  private screenFlash = 0;
  /** air support: charge from the player's kills (carried between missions), queued strikes */
  private support = loadSupport();
  private strikes: { cx: number; cy: number; ux: number; uy: number; len: number; t: number; px: number; drop: number; fired: boolean; own: boolean; flew?: boolean }[] = [];
  /** sound: an explosion that plays its own sound (vehicle, mine) silences the generic one; cells broken by the current blast */
  private quiet = false;
  private brokenN = 0;
  // performance stats for the result screen and the career record (see Stats.ts)
  readonly stats: MissionStats = newMission();
  private track = new FrameTracker(this.stats);
  private ownBlast = false; // the explosion being processed comes from the player's shell or missile
  private airBtn = document.getElementById('airBtn') as HTMLButtonElement;
  private airQueued = false; private fPrev = false; private offAir = () => {};
  /** kill streak: kills no more than STREAK_GAP s apart */
  private streak = { n: 0, t: -99 };
  private streakEl = document.getElementById('streak') as HTMLElement;
  private hudEl = document.getElementById('hud') as HTMLElement;
  private tipsT = 0;
  private streakT = 0;
  private friends: Unit[] = [];
  /** mission state: zone progress, hold clock and waves, escort count, final-enemies hint */
  private ms = { progress: 0, clock: -1, wave: 0, inZone: false, contested: false, halted: false, waiting: false, endgame: false, relieved: false };
  /** finale: index of the stage being played */
  private stage = 0;
  /** the mission being played now: the level's, or the current stage of a staged finale */
  private get mission(): Exclude<Mission, { kind: 'stages' }> {
    const m = this.level.mission;
    return m.kind === 'stages' ? m.stages[Math.min(this.stage, m.stages.length - 1)] : m;
  }
  private shells: Shell[] = [];
  private missiles: Missile[] = [];
  private tracers: Tracer[] = [];
  private mgT = 0;
  private misLoaded = 0;
  private misAmmo = 0;
  private misReload = 0;
  // upgrades: permanent levels for this class + pickups collected in this mission
  private temp: Levels = emptyLevels();
  private collected: UpId[] = [];
  private lo!: Loadout;
  private plate = 0; private cageAT = 0; private cageUAV = 0;
  /** hidden upgrade crates inside buildings, keyed by grid cell */
  private caches = new Map<number, { x: number; y: number }>();
  private toastT = 0;
  private misGap = 0;
  private kits: number = REPAIR.startKits;
  private repairT = -1; // < 0 when not repairing
  private stations: { x: number; y: number; pool: number }[] = [];
  private crates: { x: number; y: number; z: number; kind: 'kit' | 'up' | 'mis' | 'drone' }[] = [];
  private dropT = rand(REPAIR.dropEvery[0], REPAIR.dropEvery[1]);
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
  private ended = false;
  private endT = 0;
  private fpsT = 0; private fpsN = 0;
  private hud = {
    hp: document.getElementById('hpFill') as HTMLElement,
    obj: document.getElementById('objective') as HTMLElement,
    fps: document.getElementById('fps') as HTMLElement,
    fire: document.getElementById('fireBtn') as HTMLButtonElement,
    mis: document.getElementById('misBtn') as HTMLButtonElement,
    rep: document.getElementById('repBtn') as HTMLButtonElement,
    plate: document.getElementById('plateFill') as HTMLElement,
    toast: document.getElementById('toast') as HTMLElement,
    repKits: document.getElementById('repKits') as HTMLElement,
    misAmmo: document.getElementById('misAmmo') as HTMLElement,
  };
  private cls: (typeof PLAYER_CLASSES)[ClassId];

  private res: () => number;

  constructor(app: Application, classId: ClassId, private perm: Levels, allyTypes: AllyType[], private onEnd: (r: GameResult) => void, readonly levelN = 1) {
    this.res = () => app.renderer.resolution;
    this.cls = PLAYER_CLASSES[classId];
    this.level = (LEVELS[levelN - 1]?.build ?? LEVELS[0].build!)();
    this.grid = this.level.grid;
    this.view = new WorldView(app.renderer, this.level);
    this.particles = new Particles(app.renderer, this.view.sorted, this.grid, this.view);
    this.flow = new FlowField(this.grid, () => this.units.filter((u) => this.isWreck(u)).map((u) => [u.x, u.y, u.spec.radius]));
    this.root.addChild(this.view.root, this.screen);
    this.view.overlay.addChild(this.fx);

    const s = this.level.start;
    this.player = this.addUnit(this.cls, 'player', 0, s.x, s.y, s.hull);
    if (settings.testNew) this.level.enemies.push(...this.level.testExtras);
    this.enemies = this.level.enemies.map((e) => this.addUnit(ENEMIES[e.type], e.type, 1, e.x, e.y, e.hull));
    this.level.enemies.forEach((e, k) => {
      const u = this.enemies[k];
      if (e.type === 'infantry') { u.hidden = true; u.active = true; u.reload = rand(0, 2); u.mine = !!e.mine; }
      if (e.swarm !== undefined) u.swarm = e.swarm;
    });
    this.aiTier = settings.aiTest || this.level.ai;
    this.squads = this.level.squads.map((q) => ({ route: q.route, wp: q.wp, members: [] as Unit[], alert: false, baseT: 0 }));
    this.level.enemies.forEach((e, k) => { if (e.squad !== undefined) { this.enemies[k].squad = e.squad; this.squads[e.squad].members.push(this.enemies[k]); } });
    this.cam.x = s.x; this.cam.y = s.y;
    this.stations = this.level.stations.map((st) => ({ ...st, pool: this.cls.hp * REPAIR.stationPool }));
    this.classId = classId;
    this.applyLoadout(null);
    // companions spawn around the vehicle; the repair droid comes with kit upgrade level 3
    const types = [...allyTypes, ...(this.lo.repairDroid ? ['repairDroid' as AllyType] : [])];
    types.forEach((t, k) => {
      const a = this.addUnit(ALLIES[t], t, 0, s.x + (k % 2 ? 26 : -26), s.y + 30, s.hull);
      a.slot = k; a.active = true;
      if (a.flying) a.z = DRONE_ALT;
      this.allies.push(a);
    });
    // scenery wrecks: burnt-out hulls that block and give cover (not counted as enemies)
    for (const [wx, wy, wa] of this.level.wrecks ?? []) {
      const kind = Math.random() < 0.5 ? 'tank' : Math.random() < 0.5 ? 'apc' : 'technical';
      const w = this.addUnit(ENEMIES[kind], kind, 1, wx, wy, wa);
      w.dead = true; w.deadT = 99; w.hp = 0;
    }
    // co-op: friendly tanks with their own attack axis
    for (const [fx, fy] of this.level.friends?.at ?? []) {
      const f = this.addUnit(FRIEND_TANK, 'friend', 0, fx, fy, this.level.friends!.hull);
      f.active = true; f.wp = 0;
      this.friends.push(f);
    }
    // escort: trucks queue up behind the start of the route
    const m = this.mission;
    if (m.kind === 'escort') {
      const [x0, y0] = m.route[0], [x1, y1] = m.route[1], l = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / l, uy = (y1 - y0) / l;
      for (let k = 0; k < m.trucks; k++) {
        const t = this.addUnit(TRUCK, 'truck', 0, x0 - ux * 55 * k, y0 - uy * 55 * k, Math.atan2(uy, ux));
        t.wp = 1; t.active = true;
        this.convoy.push(t);
      }
    }
    this.misLoaded = Math.min(this.lo.rack, this.lo.misAmmo); this.misAmmo = this.lo.misAmmo - this.misLoaded; this.misReload = this.lo.misReload;
    this.placeCaches(4);
    // word labels under the icons for a player's first few missions
    let seen = 0;
    try { seen = Number(localStorage.getItem(TIPS_KEY)) || 0; localStorage.setItem(TIPS_KEY, String(seen + 1)); } catch { /* storage blocked */ }
    this.tipsT = seen < TIPS_MISSIONS ? TIPS_TIME : 0;
    this.hudEl.classList.toggle('tips', this.tipsT > 0);
    const onAir = (e: Event) => { e.preventDefault(); this.airQueued = true; };
    this.airBtn.addEventListener('pointerdown', onAir);
    this.offAir = () => this.airBtn.removeEventListener('pointerdown', onAir);
    this.airBtn.hidden = false; this.streakEl.hidden = true;

    this.input = new Input(app.canvas, this.hud.fire, this.hud.mis, this.hud.rep, {
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

  private classId: ClassId;

  /** Combine permanent and mission levels into the player's numbers; protection layers grow by what was added. */
  private applyLoadout(prev: Loadout | null) {
    const lv = emptyLevels();
    for (const k of UP_IDS) lv[k] = Math.min(MAX_LEVEL, this.perm[k] + this.temp[k]);
    this.lo = derive(this.classId, lv);
    this.player.spec = this.lo.spec;
    this.plate += this.lo.plate - (prev?.plate ?? 0);
    this.cageAT += this.lo.cageAT - (prev?.cageAT ?? 0);
    this.cageUAV += this.lo.cageUAV - (prev?.cageUAV ?? 0);
  }
  levels() { const lv = emptyLevels(); for (const k of UP_IDS) lv[k] = Math.min(MAX_LEVEL, this.perm[k] + this.temp[k]); return lv; }
  describeLoadout() { return describe(this.levels()) || 'Chưa có nâng cấp nào'; }

  /** Hide upgrade crates inside small and low-rise buildings; breaking the building reveals them. */
  private placeCaches(n: number) {
    const g = this.grid, s = this.level.start;
    for (let tries = 0; tries < 2000 && this.caches.size < n; tries++) {
      const i = (Math.random() * g.mat.length) | 0, m = g.mat[i];
      if (!Grid.isSolid(m) || g.tier[i] === 3) continue;
      const x = (i % g.GW) * C + 5, y = ((i / g.GW) | 0) * C + 5;
      if (Math.hypot(x - s.x, y - s.y) < 400) continue;
      this.caches.set(i, { x, y });
    }
  }

  private toast(msg: string) {
    this.hud.toast.textContent = msg; this.hud.toast.hidden = false; this.toastT = 2.4;
  }

  /** A collected upgrade crate: +1 level (this mission only) on a random upgrade that is not maxed. */
  private grantUpgrade() {
    const lv = this.levels(), open = UP_IDS.filter((k) => lv[k] < MAX_LEVEL);
    if (!open.length) { this.kits = Math.min(REPAIR.maxKits, this.kits + 1); this.toast('Đã đủ nâng cấp · +1 kit sửa'); return; }
    const id = pick(open), prev = this.lo, rackBefore = this.lo.rack, ammoBefore = this.lo.misAmmo;
    this.temp[id]++; this.collected.push(id);
    this.applyLoadout(prev);
    this.misAmmo += this.lo.misAmmo - ammoBefore;
    if (this.lo.rack > rackBefore && this.misAmmo > 0) { this.misLoaded++; this.misAmmo--; }
    this.toast(`NÂNG CẤP · ${UPGRADES[id].name} cấp ${Math.min(MAX_LEVEL, this.perm[id] + this.temp[id])} (trong màn này)`);
  }

  private addUnit(spec: UnitSpec, kind: Kind, team: 0 | 1, x: number, y: number, hull: number) {
    const u = new Unit(spec, kind, team, x, y, hull);
    this.units.push(u);
    this.view.sorted.addChild(u.view.root);
    return u;
  }

  // ---------- camera helpers ----------
  private get zoom() { return (Math.min(innerWidth, innerHeight) / VIEW_SHORT) * settings.zoom; }
  paused = false;
  private toScreen(x: number, y: number, h = 0): [number, number] {
    const z = this.zoom;
    return [(x - this.cam.x) * z + innerWidth / 2, (y * K - h * ZS - this.cam.y * K) * z + innerHeight / 2];
  }
  private screenToWorld(sx: number, sy: number): [number, number] {
    const z = this.zoom;
    return [this.cam.x + (sx - innerWidth / 2) / z, (this.cam.y * K + (sy - innerHeight / 2) / z) / K];
  }
  private onScreen(u: Unit) {
    const [sx, sy] = this.toScreen(u.x, u.y, u.flying ? u.z : 8);
    return sx > 10 && sx < innerWidth - 10 && sy > 10 && sy < innerHeight - 10;
  }
  private pickEnemyAt(sx: number, sy: number) {
    let best: Unit | null = null, bd = 48;
    for (const e of this.enemies) {
      if (e.dead || e.hidden) continue;
      const [ex, ey] = this.toScreen(e.x, e.y, e.flying ? e.z : 9);
      const d = Math.hypot(ex - sx, ey - sy);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  private nearestTarget() {
    const p = this.player;
    let best: Unit | null = null, bd = p.spec.weapon.range;
    for (const e of this.enemies) {
      if (e.dead || e.hidden) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < bd && (e.flying || this.grid.lineClear(p.x, p.y, e.x, e.y))) { bd = d; best = e; }
    }
    return best;
  }

  /** sight between two points also needs no burnt-out hull in between (AI used to shell the wreck a player hid behind) */
  private clearShot(x0: number, y0: number, x1: number, y1: number) {
    if (!this.grid.lineClear(x0, y0, x1, y1)) return false;
    const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1;
    for (const u of this.units) {
      if (!this.isWreck(u)) continue;
      const t = ((u.x - x0) * dx + (u.y - y0) * dy) / l2;
      if (t <= 0.05 || t >= 0.95) continue;
      if (Math.hypot(x0 + dx * t - u.x, y0 + dy * t - u.y) < u.spec.radius * 0.8) return false;
    }
    return true;
  }

  /** a burnt-out vehicle hull still standing on the road */
  private isWreck(u: Unit) { return u.dead && !u.flying && u.kind !== 'infantry'; }

  // ---------- movement ----------
  private blocked(u: Unit, x: number, y: number) {
    const r = u.spec.radius;
    if (x < r || y < r || x > this.grid.W - r || y > this.grid.H - r) return true;
    if (u.flying) return false;
    // terrain: slopes are fine, cliffs are not (rocket men in doorways walk through house walls)
    const g = this.grid, h0 = g.thAt(u.x, u.y), h1 = g.thAt(x, y);
    if (Math.abs(h1 - h0) > STEP + 2) return true;
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      if (g.thAt(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9) - h1 > STEP + 3) return true;
    }
    for (let k = 0; k < 8 && u.kind !== 'infantry'; k++) {
      const a = (k * Math.PI) / 4, px = x + Math.cos(a) * r * 0.9, py = y + Math.sin(a) * r * 0.9;
      if (this.grid.waterAt(px, py)) return true;
      if (!this.grid.solidAt(px, py)) continue;
      // ground units roll over trees, parked cars and low walls (one movement rule for all, and the
      // route planner counts them as open); buildings and the map edge still block
      const i = this.grid.idx(px, py), m = i >= 0 ? this.grid.mat[i] : 0;
      if (i >= 0 && this.grid.crushable(i)) {
        if (u === this.player && m !== MAT.tree && m !== MAT.car) this.stats.cells++; // walls and mud houses rammed down
        this.breakCell(i, i % this.grid.GW, (i / this.grid.GW) | 0, m as MaterialId, u.x, u.y, 2);
        if (u === this.player) this.shake = Math.max(this.shake, 1.2);
        continue;
      }
      return true;
    }
    for (const o of this.units) {
      // neither side blocks itself (companions would trap the vehicle in alleys, enemy squads would
      // jam in narrow drives); separation steering keeps friends apart instead
      // supply trucks shove past wrecks, or one kill on the route would strand the convoy
      if (o === u || o.flying || (o.dead && (o.team === 0 || u.kind === 'truck')) || (o.team === u.team && !o.dead)) continue;
      if (o.kind === 'infantry') {
        if (!o.dead && !u.spec.soft && Math.hypot(o.x - x, o.y - y) < r + 4) this.kill(o); // run over
        continue;
      }
      const d = Math.hypot(o.x - x, o.y - y);
      if (d < o.spec.radius + r - 2 && d < Math.hypot(o.x - u.x, o.y - u.y)) return true;
    }
    return false;
  }

  /** Tallest roof within `r` px of (x, y); flying things keep above it. */
  private roofAround(x: number, y: number, r: number) {
    const g = this.grid;
    let h = 0;
    for (let cy = Math.floor((y - r) / C); cy <= Math.floor((y + r) / C); cy++)
      for (let cx = Math.floor((x - r) / C); cx <= Math.floor((x + r) / C); cx++) {
        if (cx < 0 || cy < 0 || cx >= g.GW || cy >= g.GH) continue;
        const i = cy * g.GW + cx;
        if (Grid.isSolid(g.mat[i]) && g.ht[i] > h) h = g.ht[i];
        if (g.th[i] > h) h = g.th[i];
      }
    return h;
  }

  /** Steer toward direction (mx, my) with magnitude ≤ 1; hull turns with inertia, reverse when pulled backwards. */
  private drive(u: Unit, mx: number, my: number, dt: number, speedMul = 1, turnMul = 1) {
    const mag = Math.min(1, Math.hypot(mx, my));
    let v = 0, tgt = u.hull;
    if (mag > 0.15) {
      const a = Math.atan2(my, mx);
      // the hull always turns to face the stick direction; no reversing
      const d = angDiff(a, u.hull);
      tgt = u.hull + d;
      v = u.spec.speed * mag * (u.flying ? 1 : Math.max(0, Math.cos(d))) * speedMul;
    }
    [u.hull, u.hw] = rotStep(u.hull, u.hw, tgt, u.spec.hullTurn * turnMul, u.spec.hullInertia, dt);
    if (!u.flying && this.grid.rubbleAt(u.x, u.y)) v *= u.spec.heavy ? RUBBLE_SLOW : RUBBLE_SLOW * 0.8;
    if (!u.flying && this.grid.thAt(u.x + Math.cos(u.hull) * 12, u.y + Math.sin(u.hull) * 12) > this.grid.thAt(u.x, u.y)) v *= 0.7; // climbing a slope
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
    u.reload = u.spec.weapon.reload + u.spec.weapon.burst * u.spec.weapon.burstGap;
  }

  private shoot(u: Unit) {
    const w = u.spec.weapon, isP = u === this.player;
    if (isP) this.stats.shots++;
    if (isP || u.kind === 'friend') this.alarm(u.x, u.y, HEARING);
    const a = u.tur + (Math.random() * 2 - 1) * u.spread, c = Math.cos(a), s = Math.sin(a);
    const muzzle = u.flying || u.kind === 'infantry' ? 8 : u.spec.fixedGun !== undefined ? u.spec.size[0] / 2 + 16 : 26;
    const x = u.x + c * muzzle, y = u.y + s * muzzle, z = u.flying ? u.z : 13 + u.z;
    this.shells.push({ x, y, vx: c * w.speed, vy: s * w.speed, life: (w.range / w.speed) * (u.z > 10 && !u.flying ? 1.15 : 1), team: u.team, dmg: w.dmg * (u.team === 1 ? this.level.dmg : 1), blast: w.blast, light: !!w.light, overhead: !!w.overhead, z, pierce: w.overhead || w.rpg ? 0 : w.light ? PIERCE.light : PIERCE.heavy, rpg: w.rpg, own: isP });
    u.recoil = 1;
    this.fireSound(u);
    u.spread += w.light ? 0.012 : 0.05;
    const big = w.dmg >= 20;
    for (let k = 0; k < (big ? 3 : 1); k++) this.particles.emit(P.Fire, x, y, z, c * rand(40, 90), s * rand(40, 90), rand(10, 30), rand(0.08, 0.16), rand(big ? 4 : 2, big ? 7 : 4), 0xffcf6a);
    if (big) for (let k = 0; k < 3; k++) this.particles.emit(P.Smoke, x, y, z, c * rand(20, 50), s * rand(20, 50), rand(5, 15), rand(0.6, 1.1), rand(3, 6), 0x6a6862);
    if (isP) this.shake = Math.max(this.shake, big ? 2.5 : 0.8);
  }

  /** gunfire sound: the player's own at full volume, everyone else positional */
  private fireSound(u: Unit) {
    const w = u.spec.weapon;
    if (w.overhead) return; // drone guns: the buzz of the drone covers them
    if (w.rpg) { sfx.play('enemy_rpg', u.x, u.y); return; }
    if (u === this.player) { sfx.play(w.light ? 'mg_burst' : 'cannon', u.x, u.y, { gain: w.light ? 1.4 : 1, prio: true }); return; }
    if (u.kind === 'friend') { sfx.play(w.light ? 'mg_burst' : 'cannon', u.x, u.y, { gain: 0.7 }); return; }
    sfx.play(w.light ? 'mg_burst' : 'enemy_cannon', u.x, u.y);
  }

  private updateWeapon(u: Unit, dt: number) {
    u.reload -= dt; u.recoil = Math.max(0, u.recoil - dt * 5);
    if (u.burstLeft > 0) { u.burstT -= dt; if (u.burstT <= 0) { this.shoot(u); u.burstLeft--; u.burstT = u.spec.weapon.burstGap; } }
  }

  private damage(t: Unit, s: Pick<Shell, 'x' | 'y' | 'vx' | 'vy' | 'dmg' | 'light' | 'team'>, top = false) {
    let mul = 1, label = top ? 'TỪ TRÊN' : '';
    if (!t.flying && !top) {
      const rel = Math.abs(angDiff(Math.atan2(s.y - t.y, s.x - t.x), t.hull)), f = t.spec.facing;
      if (rel < Math.PI / 4) { mul = f.front; label = 'TRƯỚC'; } else if (rel > (Math.PI * 3) / 4) { mul = f.rear; label = 'SAU'; } else { mul = f.side; label = 'HÔNG'; }
    }
    if (s.light && t.spec.heavy) mul *= LIGHT_VS_HEAVY;
    let dmg = s.dmg * mul;
    if (t === this.player && !top) {
      const had = [this.plate > 0, this.cageAT > 0, this.cageUAV > 0];
      if ((s as Shell).overhead && this.cageUAV > 0) { this.cageUAV = Math.max(0, this.cageUAV - dmg); dmg = 0; }
      else if ((s as Shell).rpg && this.cageAT > 0) { const cut = dmg * INFANTRY.cageCut; this.cageAT = Math.max(0, this.cageAT - cut); dmg -= cut; } // the cage catches rockets from any side
      else if (label !== 'TRƯỚC' && this.cageAT > 0) { const cut = dmg * 0.3; this.cageAT = Math.max(0, this.cageAT - cut); dmg -= cut; }
      if (dmg > 0 && this.plate > 0) { const a = Math.min(this.plate, dmg); this.plate -= a; dmg -= a; }
      const lost = ['GIÁP PHỤ', 'LỒNG CHỐNG TĂNG', 'LỒNG CHỐNG UAV'].filter((_, k) => had[k] && [this.plate, this.cageAT, this.cageUAV][k] <= 0);
      if (lost.length) { this.toast(`Mất ${lost.join(', ')} · xe nhẹ và nhanh trở lại`); sfx.play('ui_alert'); }
    }
    if ((s as Shell).own) { t.byPlayer = true; t.hitBy = 'cannon'; t.hitAt = this.time; t.hitFlank = label === 'HÔNG' || label === 'SAU'; }
    // stats: damage the player's cannon or missile did, and where the player's hull was hit
    if (t.team === 1 && s.team === 0 && ((s as Shell).own || (top && t.byPlayer))) this.stats.dealt += Math.max(0, Math.min(dmg, t.hp));
    if (t === this.player) { if (label === 'TRƯỚC') this.stats.hitsFront++; else if (label === 'HÔNG') this.stats.hitsSide++; else if (label === 'SAU') this.stats.hitsRear++; }
    t.hp -= dmg; t.hitT = 0; t.active = true;
    if (!t.flying && t.kind !== 'infantry') sfx.play(s.light && t.spec.heavy ? 'hit_ricochet' : 'hit_armor', t.x, t.y, { prio: t === this.player });
    if (label && (t === this.player || s.team === 0) && s.dmg >= 10 && !(top && t === this.player)) this.addFloat(t.x, t.y, `${label} ×${mul.toFixed(1)}`, mul > 1.05 ? 0xff8a5c : mul < 0.95 ? 0xc9c6b4 : 0xf0b23c);
    if (t === this.player) this.hitMarks.push({ a: Math.atan2(-s.vy, -s.vx), life: 1 });
    for (let k = 0; k < 4; k++) this.particles.emit(P.Spark, s.x, s.y, 10, rand(-200, 200), rand(-200, 200), rand(40, 180), rand(0.2, 0.4), 1, 0xffd27a);
    if (t.hp <= 0) this.kill(t);
  }

  private kill(t: Unit) {
    t.dead = true; t.deadT = 0;
    if (t.team === 1 && this.enemies.includes(t)) {
      if (t.byPlayer) this.creditKill(t);
      if (t.byPlayer || (t.hitBy === 'air' && t.hitAt === this.time)) this.statKill(t);
    }
    if (t.kind === 'kamikaze') {
      this.kamiBlast(t);
      t.view.root.visible = false;
    } else if (t.flying) {
      this.explode(t.x, t.y, 0, 0, 14);
      for (let k = 0; k < 6; k++) this.particles.emit(P.Chunk, t.x, t.y, t.z, rand(-80, 80), rand(-80, 80), rand(0, 120), rand(2, 4), rand(1.5, 3), 0x3a3836);
      t.view.root.visible = false;
    } else if (t.kind === 'infantry') {
      if (t.mine) { t.mine = false; this.mineBlast(t.x, t.y); }
      for (let k = 0; k < 6; k++) this.particles.emit(P.Dust, t.x, t.y, rand(2, 8), rand(-30, 30), rand(-30, 30), 0, rand(0.6, 1.2), rand(3, 5), 0x8a8270);
      t.view.root.alpha = 0.55; t.hidden = false;
      if (Math.random() < 0.1) this.crates.push({ x: t.x, y: t.y, z: 0, kind: 'up' });
    } else {
      this.grid.version++; // the wreck now blocks: refresh route planning
      this.quiet = true; this.explode(t.x, t.y, 38, 70, 46); this.quiet = false;
      sfx.play('explode_vehicle', t.x, t.y, { prio: t === this.player });
      // make it land: shockwave ring, a second fireball, screen shake and a flash that fade with distance
      const pd = Math.hypot(this.player.x - t.x, this.player.y - t.y), near = Math.max(0, 1 - pd / 650);
      this.waves.push({ x: t.x, y: t.y, life: 0.45, max: 0.45, r: 90 });
      for (let k = 0; k < 8; k++) { const a = (k / 8) * 6.283; this.particles.emit(P.Fire, t.x + Math.cos(a) * 10, t.y + Math.sin(a) * 10, rand(6, 16), Math.cos(a) * rand(60, 120), Math.sin(a) * rand(60, 120), rand(60, 140), rand(0.35, 0.7), rand(6, 11), Math.random() < 0.5 ? 0xffb347 : 0xff7a2f); }
      for (let k = 0; k < 5; k++) this.particles.emit(P.Smoke, t.x + rand(-8, 8), t.y + rand(-8, 8), rand(14, 26), rand(-20, 20), rand(-20, 20), rand(30, 60), rand(1.8, 3), rand(8, 14), 0x3e3d39);
      this.shake = Math.max(this.shake, 4 + 10 * near);
      this.screenFlash = Math.max(this.screenFlash, 0.45 * near);
      for (let k = 0; k < 14; k++) { const a = Math.random() * 6.283, sp = rand(60, 240); this.particles.emit(P.Chunk, t.x, t.y, rand(4, 14), Math.cos(a) * sp, Math.sin(a) * sp, rand(120, 320), rand(3, 6), rand(2, 4), Math.random() < 0.5 ? 0x2c2925 : 0x4a4038); }
      this.particles.emit(P.Chunk, t.x, t.y, 16, rand(-60, 60), rand(-60, 60), 420, 6, 8, t.spec.colors.turret);
      const drop = ({ tank: 0.35, apc: 0.25, td: 0.6, infantry: 0.1 } as Record<string, number>)[t.kind] ?? 0;
      if (Math.random() < drop) this.crates.push({ x: t.x + rand(-14, 14), y: t.y + rand(-14, 14), z: 0, kind: 'up' });
      // cook-off splash
      for (const o of this.units) {
        if (o === t || o.dead) continue;
        const d = Math.hypot(o.x - t.x, o.y - t.y);
        if (d < 60) { o.hp -= 15 * (1 - d / 60); o.hitT = 0; if (o.hp <= 0) this.kill(o); }
      }
    }
    if (t === this.player) this.shake = 12;
    else if (t.team === 0 && (this.friends.includes(t) || this.allies.includes(t))) sfx.play('ui_alert');
    for (const u of this.units) if (u.lock === t) u.lock = null;
  }

  /** Terrain damage, flash, fire, smoke and a scorch mark. */
  private explode(x: number, y: number, rad: number, dmg: number, visual = rad) {
    const g = this.grid;
    let budget = 80;
    this.brokenN = 0;
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
    if (rad > 0 && dmg > 0) for (const u of this.enemies) {
      if (u.dead || u.kind !== 'infantry') continue;
      const d = Math.hypot(u.x - x, u.y - y), r = rad + 10;
      if (d < r) { u.hp -= dmg * (1 - (0.5 * d) / r); u.hitT = 0; if (u.hp <= 0) this.kill(u); }
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
    if (!this.quiet && v >= 10) sfx.play('explode_small', x, y);
    if (this.brokenN >= 10) sfx.play('building_collapse', x, y);
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
    if (m !== MAT.tree && m !== MAT.car) this.brokenN++;
    if (this.ownBlast && m !== MAT.tree && m !== MAT.car) this.stats.cells++;
    this.grid.breakCell(i);
    const cache = this.caches.get(i);
    if (cache) { this.caches.delete(i); this.crates.push({ x: cache.x, y: cache.y, z: 0, kind: 'up' }); }
    return budget - n;
  }

  /** Knock a shell-sized hole in small-house cells around (x, y); debris flies along the shot. */
  private tunnel(x: number, y: number, vx: number, vy: number) {
    const g = this.grid, l = Math.hypot(vx, vy) || 1, ex = x - (vx / l) * 20, ey = y - (vy / l) * 20;
    let budget = 6;
    for (let cy = Math.floor((y - 9) / C); cy <= Math.floor((y + 9) / C); cy++)
      for (let cx = Math.floor((x - 9) / C); cx <= Math.floor((x + 9) / C); cx++) {
        if (cx < 0 || cy < 0 || cx >= g.GW || cy >= g.GH) continue;
        const i = cy * g.GW + cx, m = g.mat[i];
        if (!Grid.isSolid(m) || g.tier[i] !== 1 || Math.hypot(cx * C + 5 - x, cy * C + 5 - y) > 9) continue;
        budget = this.breakCell(i, cx, cy, m as MaterialId, ex, ey, budget);
      }
  }

  private updateShells(dt: number) {
    for (let k = this.shells.length - 1; k >= 0; k--) {
      const s = this.shells[k], steps = Math.max(1, Math.ceil((Math.hypot(s.vx, s.vy) * dt) / 5)), sdt = dt / steps;
      let done = false;
      this.ownBlast = !!s.own;
      for (let st = 0; st < steps && !done; st++) {
        s.x += s.vx * sdt; s.y += s.vy * sdt; s.life -= sdt;
        const ci = this.grid.idx(s.x, s.y);
        if (ci < 0) { done = true; break; }
        if (!s.overhead && this.grid.th[ci] > s.z) { this.explode(s.x, s.y, s.blast * 0.5, 0, Math.max(8, s.blast * 0.6)); done = true; break; } // into a slope or cliff
        if (!s.overhead && Grid.isSolid(this.grid.mat[ci])) {
          // small houses: tunnel straight through, then keep flying
          if (this.grid.tier[ci] === 1 && s.pierce > 0) { s.pierce--; this.tunnel(s.x, s.y, s.vx, s.vy); continue; }
          this.explode(s.x, s.y, s.blast, s.dmg); done = true; break;
        }
        for (const t of this.units) {
          if (this.isWreck(t) && (t.x - s.x) ** 2 + (t.y - s.y) ** 2 < t.spec.radius ** 2) {
            // a burnt-out hull is cover: the shell bursts on it, the wreck stays
            this.explode(s.x, s.y, s.blast * 0.6, s.dmg * 0.5, Math.max(8, s.blast * 0.6));
            done = true; break;
          }
          if (t.dead || t.team === s.team) continue;
          const r = Math.max(t.spec.radius, 12) + (s.team === 0 && t.flying ? 4 : 0); // small APC hull still takes hits fairly
          if ((t.x - s.x) ** 2 + (t.y - s.y) ** 2 < r * r) { if (s.own && t.team === 1) this.stats.hits++; this.damage(t, s); this.explode(s.x, s.y, s.blast * 0.6, s.dmg * 0.5, Math.max(8, s.blast * 0.6)); done = true; break; }
        }
        if (!done && s.life <= 0) { this.explode(s.x, s.y, s.overhead ? 0 : s.blast * 0.7, s.dmg * 0.6, Math.max(6, s.blast * 0.7)); done = true; }
      }
      if (done) this.shells.splice(k, 1);
    }
    this.ownBlast = false;
  }

  // ---------- player ----------
  private updatePlayer(dt: number) {
    const p = this.player, inp = this.input;
    if (p.dead) return;
    // field repair with a kit: stand still, every weapon off; driving away cancels it (kit kept)
    const moving = Math.hypot(inp.move.x, inp.move.y) > 0.15;
    if (inp.takeRepair() && this.repairT < 0) {
      if (this.kits <= 0) this.addFloat(p.x, p.y, 'HẾT KIT SỬA', 0xc9c6b4);
      else if (p.hp >= p.spec.hp) this.addFloat(p.x, p.y, 'XE CÒN NGUYÊN', 0xc9c6b4);
      else { this.repairT = 0; sfx.play('repair_start'); }
    }
    if (this.repairT >= 0) {
      if (moving) { this.repairT = -1; this.addFloat(p.x, p.y, 'HỦY SỬA', 0xc9c6b4); }
      else if ((this.repairT += dt) >= REPAIR.kitTime) {
        p.hp = Math.min(p.spec.hp, p.hp + p.spec.hp * this.lo.kitHeal);
        this.kits--; this.repairT = -1; this.stats.kitsUsed++; sfx.play('repair_done');
        this.addFloat(p.x, p.y, `+${Math.round(this.lo.kitHeal * 100)}% GIÁP`, 0x9fd16a);
      }
    }
    const repairing = this.repairT >= 0;
    // protection layers weigh the vehicle down until they are shot away
    const lo = this.lo, slow = 1 - (this.plate > 0 ? lo.slowPlate : 0) - (this.cageAT > 0 ? lo.slowAT : 0) - (this.cageUAV > 0 ? lo.slowUAV : 0);
    this.drive(p, inp.move.x, inp.move.y, dt, slow, slow);

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
    if (!repairing && (inp.instantFire || (inp.fireHeld && (al || target === null)))) this.pull(p);
    this.updateWeapon(p, dt);
    if (!repairing) this.updateMG(dt);
    this.updateLauncher(dt, repairing);
    p.hitT += dt;
  }

  /** Auto machine gun: picks the nearest soft target in range, hitscan with a hit chance. */
  private updateMG(dt: number) {
    const p = this.player;
    this.mgT -= dt;
    if (this.mgT > 0) return;
    let best: Unit | null = null, bd = 1e9;
    for (const e of this.enemies) {
      if (e.dead || e.hidden || !e.spec.soft) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d > this.lo.mgRange) continue;
      // priority: drones, then rocket teams, then missile pickups
      const w = d * (e.flying ? 0.6 : e.kind === 'technical' ? 1.6 : 1);
      if (w < bd && (e.flying || this.grid.lineClear(p.x, p.y, e.x, e.y))) { bd = w; best = e; }
    }
    if (!best) return;
    this.mgT = 1 / MG.rate;
    sfx.play('mg_burst', p.x, p.y, { gain: 0.8, prio: true });
    const hit = Math.random() < MG.hit;
    const jx = hit ? 0 : rand(-14, 14), jy = hit ? 0 : rand(-14, 14);
    this.tracers.push({ x0: p.x, y0: p.y, z0: 17, x1: best.x + jx, y1: best.y + jy, z1: best.z, life: 0.06 });
    if (hit) {
      const md = this.lo.mgDmg * (best.kind === 'infantry' ? INFANTRY.mgMul : 1);
      this.stats.dealt += Math.max(0, Math.min(md, best.hp));
      best.hp -= md; best.hitT = 0; best.active = true; best.byPlayer = true; best.hitBy = 'mg'; best.hitAt = this.time; best.hitFlank = false;
      if (Math.random() < 0.3) this.particles.emit(P.Spark, best.x, best.y, best.z, rand(-120, 120), rand(-120, 120), rand(0, 80), 0.2, 1, 0xffd27a);
      if (best.hp <= 0) this.kill(best);
    }
  }

  /** Repair stations heal while you fight; air-dropped crates carry one repair kit. */
  private updateSupport(dt: number) {
    const p = this.player;
    if (p.dead) return;
    for (const s of this.stations) {
      if (s.pool <= 0 || p.hp >= p.spec.hp || Math.hypot(p.x - s.x, p.y - s.y) > REPAIR.stationRadius) continue;
      const h = Math.min(s.pool, p.spec.hp * REPAIR.stationRate * dt, p.spec.hp - p.hp);
      p.hp += h; s.pool -= h;
      if (Math.random() < dt * 6) this.particles.emit(P.Spark, p.x + rand(-12, 12), p.y + rand(-12, 12), rand(6, 16), 0, 0, rand(20, 60), 0.3, 1, 0x9fd16a);
    }
    if ((this.dropT -= dt) <= 0) {
      this.dropT = rand(REPAIR.dropEvery[0], REPAIR.dropEvery[1]);
      for (let k = 0; k < 30; k++) {
        const a = Math.random() * Math.PI * 2, d = rand(REPAIR.dropDist[0], REPAIR.dropDist[1]);
        const x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
        if (x < 30 || y < 30 || x > this.grid.W - 30 || y > this.grid.H - 30 || this.roofAround(x, y, 18) > 0) continue;
        const roll = Math.random(); // air drop: repair kit 40%, two missiles 25%, upgrade 20%, a spare attack drone 15%
        this.crates.push({ x, y, z: 220, kind: roll < 0.4 ? 'kit' : roll < 0.65 ? 'mis' : roll < 0.85 ? 'up' : 'drone' });
        break;
      }
    }
    for (let k = this.crates.length - 1; k >= 0; k--) {
      const c = this.crates[k];
      if (c.z > 0) { c.z = Math.max(0, c.z - 45 * dt); continue; }
      const d = Math.hypot(p.x - c.x, p.y - c.y), wanted = c.kind !== 'kit' || this.kits < REPAIR.maxKits;
      // magnet: within 12 m the crate slides to the vehicle, over wrecks and rubble
      if (wanted && !p.dead && d < MAGNET && d > 1) { const v = Math.min(d, (120 + 400 * (1 - d / MAGNET)) * dt); c.x += ((p.x - c.x) / d) * v; c.y += ((p.y - c.y) / d) * v; }
      if (Math.hypot(p.x - c.x, p.y - c.y) < 26) {
        if (c.kind !== 'kit' || this.kits < REPAIR.maxKits) { this.stats.crates++; sfx.play('pickup'); }
        if (c.kind === 'up') { this.crates.splice(k, 1); this.grantUpgrade(); continue; }
        if (c.kind === 'mis') { this.crates.splice(k, 1); this.misAmmo += 2; this.addFloat(p.x, p.y, '+2 TÊN LỬA', 0xff9a3c); continue; }
        if (c.kind === 'drone') {
          // a spare attack drone that stays with the vehicle until shot down (no companion slot used)
          this.crates.splice(k, 1);
          const a = this.addUnit(ALLIES.attackDrone, 'attackDrone', 0, p.x + 20, p.y + 20, p.hull);
          a.slot = this.allies.length; a.active = true; a.z = DRONE_ALT; this.allies.push(a);
          this.addFloat(p.x, p.y, '+1 DRONE TẤN CÔNG', 0x9fd1d6); continue;
        }
        if (this.kits >= REPAIR.maxKits) continue;
        this.kits++; this.crates.splice(k, 1);
        this.addFloat(p.x, p.y, '+1 KIT SỬA', 0x9fd16a);
      }
    }
  }

  /** Missile target: the locked ground unit, else the nearest ground enemy on screen within range. */
  private missileTarget() {
    const p = this.player, l = p.lock;
    if (l && !l.dead && !l.flying && Math.hypot(l.x - p.x, l.y - p.y) <= ATGM.range) return l;
    let best: Unit | null = null, bd = ATGM.range;
    for (const e of this.enemies) {
      if (e.dead || e.hidden || e.flying || !this.onScreen(e)) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  private updateLauncher(dt: number, locked: boolean) {
    const p = this.player;
    this.misGap -= dt;
    // reload one missile at a time while the rack has room
    if (this.misLoaded < this.lo.rack && this.misAmmo > 0) {
      this.misReload -= dt;
      if (this.misReload <= 0) { this.misLoaded++; this.misAmmo--; this.misReload = this.lo.misReload; sfx.play('reload_ready'); }
    } else this.misReload = this.lo.misReload;
    if (!this.input.takeMissile() || locked || this.misLoaded === 0 || this.misGap > 0) return;
    const t = this.missileTarget();
    if (!t) { this.addFloat(p.x, p.y, 'KHÔNG CÓ MỤC TIÊU', 0xc9c6b4); return; }
    this.misLoaded--; this.misGap = ATGM.gap; this.stats.missiles++;
    const a = Math.atan2(t.y - p.y, t.x - p.x) + rand(-0.5, 0.5);
    this.missiles.push({ x: p.x, y: p.y, z: 18, a, target: t, tx: t.x, ty: t.y, life: 4, trail: 0 });
    this.alarm(p.x, p.y, HEARING);
    sfx.play('missile_launch', p.x, p.y, { prio: true });
    for (let k = 0; k < 4; k++) this.particles.emit(P.Smoke, p.x, p.y, 16, rand(-30, 30), rand(-30, 30), rand(10, 30), rand(0.6, 1.2), rand(4, 7), 0x8a8880);
    this.shake = Math.max(this.shake, 1.5);
  }

  /** Missiles climb over roofs, home on the target and dive onto it. */
  private updateMissiles(dt: number) {
    for (let k = this.missiles.length - 1; k >= 0; k--) {
      const m = this.missiles[k];
      if (m.target && !m.target.dead) { m.tx = m.target.x; m.ty = m.target.y; } else m.target = null;
      const dx = m.tx - m.x, dy = m.ty - m.y, d = Math.hypot(dx, dy);
      m.a += clamp(angDiff(Math.atan2(dy, dx), m.a), -ATGM.turn * dt, ATGM.turn * dt);
      m.x += Math.cos(m.a) * ATGM.speed * dt; m.y += Math.sin(m.a) * ATGM.speed * dt;
      const cruise = Math.max(ATGM.cruise, this.roofAround(m.x + Math.cos(m.a) * 30, m.y + Math.sin(m.a) * 30, 20) + 16);
      const zt = d < 70 ? 8 : cruise;
      m.z += (zt - m.z) * Math.min(1, dt * (d < 70 ? 9 : 5));
      m.life -= dt;
      m.trail -= dt;
      if (m.trail <= 0) { m.trail = 0.025; this.particles.emit(P.Smoke, m.x, m.y, m.z, rand(-6, 6), rand(-6, 6), 4, rand(0.5, 0.9), rand(2, 4), 0x9a9890); }
      let hit = false;
      if (m.target && d < m.target.spec.radius + 6 && m.z < 24) {
        m.target.byPlayer = true; m.target.hitBy = 'missile'; m.target.hitAt = this.time; m.target.hitFlank = false;
        this.damage(m.target, { x: m.x, y: m.y, vx: Math.cos(m.a), vy: Math.sin(m.a), dmg: ATGM.dmg, light: false, team: 0 }, true);
        hit = true;
      } else if (!m.target && d < 10) hit = true;
      if (hit || m.life <= 0) { this.ownBlast = true; this.explode(m.x, m.y, ATGM.blast, 60, 34); this.ownBlast = false; this.missiles.splice(k, 1); }
    }
  }

  private assist(a: number) {
    const p = this.player;
    let best: Unit | null = null, bd = 10 * (Math.PI / 180);
    for (const e of this.enemies) {
      if (e.dead || e.hidden) continue;
      if (Math.hypot(e.x - p.x, e.y - p.y) > p.spec.weapon.range) continue;
      const df = Math.abs(angDiff(Math.atan2(e.y - p.y, e.x - p.x), a));
      if (df < bd && (e.flying || this.grid.lineClear(p.x, p.y, e.x, e.y))) { bd = df; best = e; }
    }
    return best;
  }

  // ---------- enemies ----------
  /** Enemies pick the nearest of the vehicle and its companions; the repair droid draws extra fire. */
  private targetFor(e: Unit, dt: number) {
    if ((e.retarget -= dt) > 0 && e.target && !e.target.dead) return e.target;
    e.retarget = 0.6;
    let best = this.player, bd = this.player.dead ? 1e9 : Math.hypot(this.player.x - e.x, this.player.y - e.y) * 0.85;
    for (const a of [...this.allies, ...this.convoy, ...this.friends]) {
      if (a.dead) continue;
      const d = Math.hypot(a.x - e.x, a.y - e.y) * (a.kind === 'repairDroid' ? 0.7 : a.kind === 'truck' ? 0.8 : 1);
      if (d < bd) { bd = d; best = a; }
    }
    e.target = best;
    return best;
  }

  private updateAlly(a: Unit, dt: number) {
    const pl = this.player;
    this.updateWeapon(a, dt);
    if (a.dead || pl.dead) { a.vel = 0; return; }
    if (a.flying) {
      const alt = Math.max(DRONE_ALT, this.roofAround(a.x, a.y, 24) + DRONE_CLEARANCE);
      a.z += (alt - a.z) * Math.min(1, dt * 4);
    }
    // keep a formation slot behind the vehicle; catch up if left far behind
    const side = a.slot % 2 ? 1 : -1, back = a.kind === 'repairDroid' ? Math.PI : Math.PI - side * 0.8;
    const r = a.flying ? 40 : 46, sx = pl.x + Math.cos(pl.hull + back) * r, sy = pl.y + Math.sin(pl.hull + back) * r;
    const d = Math.hypot(sx - a.x, sy - a.y);
    if (a.kind === 'robot') this.robotMove(a, sx, sy, dt);
    else if (!a.flying && d > 60) this.follow(a, sx, sy, dt, 1.3); // ground units path around buildings
    else if (d > 14) this.drive(a, (sx - a.x) / d, (sy - a.y) / d, dt, d > 80 ? 1.3 : Math.min(1, d / 50));
    else a.vel = 0;
    if (a.kind === 'repairDroid') {
      if (pl.hp < pl.spec.hp && Math.hypot(pl.x - a.x, pl.y - a.y) < 90) {
        pl.hp = Math.min(pl.spec.hp, pl.hp + pl.spec.hp * REPAIR_DROID_RATE * dt);
        if (Math.random() < dt * 8) this.particles.emit(P.Spark, pl.x + rand(-10, 10), pl.y + rand(-10, 10), rand(6, 14), 0, 0, rand(20, 50), 0.3, 1, 0x9fd16a);
      }
      return;
    }
    // weapons: nearest enemy in range (interceptors prefer drones)
    let best: Unit | null = null, bd = a.spec.weapon.range;
    for (const e of this.enemies) {
      if (e.dead || !e.active || e.hidden) continue;
      // interceptors prefer anything flying, attack drones prefer rocket teams
      const de = Math.hypot(e.x - a.x, e.y - a.y) * (a.kind === 'interceptor' && !e.flying ? 1.8 : a.kind === 'attackDrone' && e.kind !== 'infantry' ? 1.5 : 1);
      if (de < bd && (a.flying || e.flying || this.grid.lineClear(a.x, a.y, e.x, e.y))) { bd = de; best = e; }
    }
    if (a.flying && !best) a.hull = pl.hull;
    this.aim(a, best ? Math.atan2(best.y - a.y, best.x - a.x) : null, dt);
    if (a.flying && best) a.tur = a.aimTarget ?? a.tur;
    this.updateSpread(a, dt);
    if (best && this.aligned(a)) this.pull(a);
  }

  // ---------- ground AI ----------
  /** drive toward (tx, ty) along a planned route; replans when the goal moves or every couple of seconds */
  private follow(u: Unit, tx: number, ty: number, dt: number, pace = 1) {
    u.routeT -= dt;
    const g = u.goal;
    if (!g || u.routeT <= 0 || Math.hypot(g[0] - tx, g[1] - ty) > 40 || !u.route.length) {
      const goal = this.flow.isOpenAt(tx, ty) ? [tx, ty] as [number, number] : this.flow.nearestOpen(tx, ty);
      u.goal = [tx, ty]; u.routeT = 1.5 + Math.random() * 0.5;
      u.route = (goal && this.flow.path(u.x, u.y, goal[0], goal[1])) || [];
    }
    while (u.route.length && Math.hypot(u.route[0][0] - u.x, u.route[0][1] - u.y) < 16) u.route.shift();
    let mx = 0, my = 0;
    if (u.route.length) { mx = u.route[0][0] - u.x; my = u.route[0][1] - u.y; }
    else if (Math.hypot(tx - u.x, ty - u.y) > 16) { mx = tx - u.x; my = ty - u.y; } // last stretch, or no route: head straight
    const l = Math.hypot(mx, my);
    if (l > 0) { mx /= l; my /= l; }
    const [sx, sy] = this.separation(u);
    mx += sx; my += sy;
    if (Math.hypot(mx, my) < 0.15) { this.drive(u, 0, 0, dt); u.stuckT = 0; return; }
    if (u.escT > 0) { u.escT -= dt; this.drive(u, Math.cos(u.escA), Math.sin(u.escA), dt, 0.7); return; }
    const ok = this.drive(u, mx, my, dt, pace);
    // wedged against a wall or a friend: back off sideways for a moment, then plan again
    u.stuckT = ok && u.vel > 5 ? Math.max(0, u.stuckT - dt) : u.stuckT + dt;
    if (u.stuckT > 1) {
      u.stuckT = 0; u.escT = 0.8; u.escA = Math.atan2(my, mx) + (Math.random() < 0.5 ? 1.9 : -1.9);
      u.routeT = 0; u.adj += Math.random() < 0.5 ? 0.5 : -0.5;
    }
  }

  /** push away from nearby friends so one shell cannot catch the whole squad */
  private separation(u: Unit, r = 70): [number, number] {
    let mx = 0, my = 0;
    for (const o of u.team === 1 ? this.enemies : u.kind === 'friend' ? this.friends : []) {
      if (o === u || o.dead || o.flying) continue;
      const dx = u.x - o.x, dy = u.y - o.y, dd = Math.hypot(dx, dy);
      if (dd < r && dd > 0.1) { mx += (dx / dd) * (r - dd) / r * 1.2; my += (dy / dd) * (r - dd) / r * 1.2; }
    }
    return [mx, my];
  }

  /** a nearby open spot the target cannot see, for ducking out of sight while reloading */
  private findCover(u: Unit, tx: number, ty: number): [number, number] | null {
    let best: [number, number] | null = null, bd = 1e9;
    for (const r of [45, 80, 120]) for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2, x = u.x + Math.cos(a) * r, y = u.y + Math.sin(a) * r;
      if (!this.flow.isOpenAt(x, y) || this.grid.lineClear(x, y, tx, ty) || !this.flow.clearLine(u.x, u.y, x, y)) continue;
      let score = r - Math.hypot(x - tx, y - ty) * 0.2; // close by, and not toward the enemy
      for (const o of this.enemies) if (o !== u && !o.dead && !o.flying) { const dd = Math.hypot(o.x - x, o.y - y); if (dd < 60) score += (60 - dd) * 3; } // not where a friend already hides
      if (score < bd) { bd = score; best = [x, y]; }
    }
    return best;
  }

  /**
   * Squad tanks, APCs and tank destroyers: pick an approach bearing around the target so the
   * squad arrives from several sides, close in along real streets, fire from where they can see,
   * and (from tier 2) duck behind cover between shots.
   */
  private tactics(e: Unit, p: Unit, d: number, toP: number, canSee: boolean, dt: number) {
    const w = e.spec.weapon, tier = this.aiTier, td = e.kind === 'td';
    const mi = this.mission;
    if (e.kind === 'technical') {
      // shoot a pair, then run out of reach to reload, then come back
      if (e.reload > 1.2) {
        const ax = e.x - p.x, ay = e.y - p.y, l = Math.hypot(ax, ay) || 1;
        this.follow(e, p.x + (ax / l) * 520, p.y + (ay / l) * 520, dt);
      } else if (!(canSee && d < w.range * 0.9)) this.follow(e, p.x + Math.cos(toP + Math.PI + e.strafe * 0.8) * w.range * 0.7, p.y + Math.sin(toP + Math.PI + e.strafe * 0.8) * w.range * 0.7, dt);
      else this.drive(e, 0, 0, dt);
      return;
    }
    if (e.zoneRush && mi.kind === 'hold' && !canSee) {
      // reinforcements make for the zone first; whoever sits in it holds it against the clock
      const z = mi.zone, a = Math.atan2(e.y - z.y, e.x - z.x) + (e.squad % 3) * 0.7;
      if (Math.hypot(e.x - z.x, e.y - z.y) > z.r * 0.6) this.follow(e, z.x + Math.cos(a) * z.r * 0.4, z.y + Math.sin(a) * z.r * 0.4, dt);
      else this.drive(e, 0, 0, dt);
      return;
    }
    const want = td ? w.range * 0.8 : e.kind === 'apc' ? 220 : w.range * 0.7;
    // approach bearing (from the target): squad members fan out, loners come straight in
    const sq = e.squad >= 0 ? this.squads[e.squad] : null;
    if (sq) {
      const alive = sq.members.filter((m) => !m.dead && !m.flying), j = alive.indexOf(e);
      if (!sq.base || (sq.baseT -= dt / Math.max(1, alive.length)) <= 0) {
        const cx = alive.reduce((a, m) => a + m.x, 0) / alive.length, cy = alive.reduce((a, m) => a + m.y, 0) / alive.length;
        sq.base = Math.atan2(cy - p.y, cx - p.x); sq.baseT = 8;
      }
      const spread = tier >= 3 ? [0, 1.9, -1.9] : [0, 1, -1];
      e.bearing = sq.base + (spread[j] ?? (j % 2 ? 1 : -1) * 0.6 * j);
    } else e.bearing = Math.atan2(e.y - p.y, e.x - p.x);
    const anchor = tier >= 3 && sq && sq.members.find((m) => !m.dead) === e;
    const dist = (anchor ? want * 1.25 : want) * e.closer, brg = e.bearing + e.adj;
    const gx = p.x + Math.cos(brg) * dist, gy = p.y + Math.sin(brg) * dist;
    e.modeT += dt;
    const setMode = (m: Unit['mode']) => { e.mode = m; e.modeT = 0; };

    if (e.mode === 'adv' && canSee && d < w.range * 0.9) { setMode('fire'); e.adj *= 0.5; e.closer = Math.min(1, e.closer + 0.15); }
    // arrived but blind (a building in the way): slide round and edge closer
    if (e.mode === 'adv' && Math.hypot(gx - e.x, gy - e.y) < 40 && e.modeT > 1.5) {
      e.adj += (e.adj >= 0 ? 1 : -1) * 0.45 * (Math.abs(e.adj) > 1.3 ? -1 : 1); e.closer = Math.max(0.4, e.closer * 0.85); e.modeT = 0;
    }
    if (e.mode === 'fire') {
      if (!canSee) { setMode('adv'); }
      else if (tier >= 2 && e.reload > w.reload * 0.5 && e.modeT > 0.4) {
        e.peek = [e.x, e.y]; e.hide = this.findCover(e, p.x, p.y);
        if (e.hide) setMode('hide');
      }
    }
    if (e.mode === 'hide') {
      const hurt = e.hp < e.spec.hp * 0.35;
      if (!e.hide || (e.reload <= 0.2 && e.modeT > (hurt ? 3.5 : 1.2))) setMode('peek');
    }
    if (e.mode === 'peek') {
      if (canSee && d < w.range * 0.9) setMode('fire');
      else if (e.modeT > 3) setMode('adv'); // the target moved on
    }

    switch (e.mode) {
      case 'adv': this.follow(e, gx, gy, dt); break;
      case 'hide': this.follow(e, e.hide![0], e.hide![1], dt); break;
      case 'peek': this.follow(e, e.peek![0], e.peek![1], dt); break;
      case 'fire':
        if (td) {
          // casemate gun: swing the whole hull onto the target
          const tgt = e.hull + angDiff(toP, e.hull);
          [e.hull, e.hw] = rotStep(e.hull, e.hw, tgt, e.spec.hullTurn, e.spec.hullInertia, dt);
          e.vel = 0;
        } else if (e.kind === 'apc' && tier < 2) {
          // light vehicle keeps moving, circling at its distance
          const side = toP + (Math.PI / 2) * e.strafe, rad = (d - want) / want;
          if (!this.drive(e, Math.cos(side) + Math.cos(toP) * rad, Math.sin(side) + Math.sin(toP) * rad, dt)) e.strafe *= -1;
          e.strafeT -= dt; if (e.strafeT <= 0) { e.strafe *= -1; e.strafeT = rand(2.5, 4.5); }
        } else {
          // hold the firing spot, but sidestep a friend parked next to it
          const [sx, sy] = this.separation(e, 60);
          this.drive(e, Math.hypot(sx, sy) > 0.25 ? sx : 0, Math.hypot(sx, sy) > 0.25 ? sy : 0, dt, 0.6);
        }
    }
  }

  /**
   * Anti-tank robot: a flanker, not an escort. It picks the enemy nearest the vehicle and works
   * round to its side at rocket range, so the enemy has to choose whom to face and shows its
   * flank to one of them. Stays within reach of the vehicle and falls back when badly hurt.
   */
  private robotMove(a: Unit, sx: number, sy: number, dt: number) {
    const pl = this.player, w = a.spec.weapon;
    let tgt: Unit | null = null, bd = 520;
    for (const e of this.enemies) {
      if (e.dead || !e.active || e.flying || e.hidden) continue;
      const de = Math.hypot(e.x - pl.x, e.y - pl.y);
      if (de < bd) { bd = de; tgt = e; }
    }
    if (pl.lock && !pl.lock.dead && !pl.lock.flying && Math.hypot(pl.lock.x - pl.x, pl.lock.y - pl.y) < 520) tgt = pl.lock;
    if (!tgt || a.hp < a.spec.hp * 0.3) {
      if (Math.hypot(sx - a.x, sy - a.y) > 20) this.follow(a, sx, sy, dt, 1.2); else this.drive(a, 0, 0, dt);
      return;
    }
    // flank point: off to the side of the enemy, relative to the line enemy → vehicle
    const toPl = Math.atan2(pl.y - tgt.y, pl.x - tgt.x);
    const side = angDiff(Math.atan2(a.y - tgt.y, a.x - tgt.x), toPl) >= 0 ? 1 : -1;
    const r = w.range * 0.75;
    let fx = tgt.x + Math.cos(toPl + side * 1.4) * r, fy = tgt.y + Math.sin(toPl + side * 1.4) * r;
    const leash = Math.hypot(fx - pl.x, fy - pl.y);
    if (leash > 420) { fx = pl.x + (fx - pl.x) * 420 / leash; fy = pl.y + (fy - pl.y) * 420 / leash; }
    const de = Math.hypot(tgt.x - a.x, tgt.y - a.y);
    if (de < w.range * 0.95 && this.grid.lineClear(a.x, a.y, tgt.x, tgt.y) && Math.hypot(fx - a.x, fy - a.y) < 80) this.drive(a, 0, 0, dt);
    else this.follow(a, fx, fy, dt, 1.1);
  }

  // ---------- infantry ----------
  /**
   * Rocket team member at a house front: invisible and untargetable until the vehicle comes
   * within 18 m or a friendly drone within 60 m, and always visible for the 2.5 s it spends
   * aiming. From AI tier 2 it moves to another house front after each shot.
   */
  private updateInfantry(e: Unit, p: Unit, dt: number) {
    const pl = this.player, w = e.spec.weapon;
    let spotted = !pl.dead && Math.hypot(pl.x - e.x, pl.y - e.y) < INFANTRY.reveal;
    for (const a of this.allies) if (!a.dead && a.flying && Math.hypot(a.x - e.x, a.y - e.y) < INFANTRY.droneReveal) spotted = true;
    if (spotted) {
      if (e.hidden && e.revealT <= 0) this.addFloat(e.x, e.y, 'BỘ BINH!', 0xff8a5c);
      e.revealT = 4;
    }
    e.revealT -= dt;
    const d = Math.hypot(p.x - e.x, p.y - e.y), toP = Math.atan2(p.y - e.y, p.x - e.x);
    const sees = !p.dead && d < w.range && this.clearShot(e.x, e.y, p.x, p.y);
    if (e.moveTo) {
      const mx = e.moveTo[0] - e.x, my = e.moveTo[1] - e.y, l = Math.hypot(mx, my);
      if (l < 4 || !this.drive(e, mx / l, my / l, dt)) e.moveTo = null;
      e.revealT = Math.max(e.revealT, 0.5); // running in the open
    } else if (e.telegraphT >= 0) {
      e.telegraphT += dt;
      if (e.telegraphT >= INFANTRY.telegraph) {
        e.telegraphT = -1;
        if (sees && (p.kind === 'friend' || this.onScreen(e))) {
          this.pull(e);
          e.revealT = Math.max(e.revealT, INFANTRY.afterShot);
          for (let k = 0; k < 8; k++) this.particles.emit(P.Smoke, e.x + rand(-6, 6), e.y + rand(-6, 6), rand(4, 12), rand(-20, 20), rand(-20, 20), rand(10, 30), rand(2, 4), rand(5, 9), 0xb8b4a8); // backblast
          if (this.aiTier >= 2) e.moveTo = this.nextAnchor(e);
        } else e.reload = 1;
      }
    } else if (e.reload <= 0 && sees && (p.kind === 'friend' || this.onScreen(e))) e.telegraphT = 0;
    e.hidden = e.revealT <= 0 && e.telegraphT < 0 && !e.moveTo;
    this.aim(e, sees || e.telegraphT >= 0 ? toP : null, dt);
    this.updateSpread(e, dt);
  }

  /** another free house front a short run away */
  private nextAnchor(e: Unit): [number, number] | null {
    const opts = this.level.anchors.filter(([x, y]) => {
      const d = Math.hypot(x - e.x, y - e.y);
      return d > 30 && d < 150 && this.grid.lineClear(e.x, e.y, x, y) && !this.enemies.some((o) => o !== e && !o.dead && Math.hypot(o.x - x, o.y - y) < 20);
    });
    return opts.length ? pick(opts) : null;
  }

  // ---------- kamikaze drones ----------
  /**
   * Fly in, hold for a 1 s lock-on (members of a swarm half a second apart), then dive at where
   * the vehicle was when the lock ended. Moving off that spot dodges the impact but not the blast.
   */
  private updateKamikaze(e: Unit, dt: number) {
    const pl = this.player;
    if (pl.dead) { e.vel = 0; return; }
    if (!e.active) {
      if (Math.hypot(pl.x - e.x, pl.y - e.y) < 700) e.active = true;
      else return;
    }
    if (e.diving) {
      const dx = e.lockX - e.x, dy = e.lockY - e.y, l = Math.hypot(dx, dy), step = KAMIKAZE.dive * dt;
      e.hull = Math.atan2(dy, dx);
      if (l <= step) { e.x = e.lockX; e.y = e.lockY; e.z = 0; this.kill(e); return; }
      e.x += (dx / l) * step; e.y += (dy / l) * step;
      e.z = DRONE_ALT * Math.max(0, l / Math.max(1, e.diveFrom));
      return;
    }
    const alt = Math.max(DRONE_ALT, this.roofAround(e.x, e.y, 24) + DRONE_CLEARANCE);
    e.z += (alt - e.z) * Math.min(1, dt * 4);
    if (e.lockT >= 0) {
      // keep pace with the vehicle while locking on
      e.lockT += dt;
      const mx = pl.x - e.x, my = pl.y - e.y, l = Math.hypot(mx, my);
      if (l > KAMIKAZE.lockRange * 0.8) this.drive(e, mx / l, my / l, dt); else e.vel = 0;
      e.hull = Math.atan2(my, mx);
      if (e.lockT >= KAMIKAZE.lockTime) {
        // aim part-way ahead of a moving vehicle: driving straight on is not enough, turning is
        const dist = Math.hypot(pl.x - e.x, pl.y - e.y), lead = (pl.vel * dist) / KAMIKAZE.dive * KAMIKAZE.lead;
        e.diving = true; e.lockX = pl.x + Math.cos(pl.hull) * lead; e.lockY = pl.y + Math.sin(pl.hull) * lead; e.diveFrom = dist;
      }
      return;
    }
    const mates = this.enemies.filter((o) => o.swarm === e.swarm && o.swarm >= 0 && !o.dead);
    const j = mates.indexOf(e), d = Math.hypot(pl.x - e.x, pl.y - e.y);
    // hold a slot on a ring round the vehicle so the swarm arrives spread out, then lock in turn
    const ring = Math.atan2(e.y - pl.y, e.x - pl.x) + (j - (mates.length - 1) / 2) * 0.35;
    const tx = pl.x + Math.cos(ring) * KAMIKAZE.lockRange * 0.85, ty = pl.y + Math.sin(ring) * KAMIKAZE.lockRange * 0.85;
    const mx = tx - e.x, my = ty - e.y, l = Math.hypot(mx, my);
    if (l > 4) { e.hull = Math.atan2(my, mx); this.drive(e, mx / l, my / l, dt); }
    const lead = mates.filter((o) => o.lockT >= 0 || o.diving).length;
    const ready = !mates.some((o) => o !== e && o.lockT >= 0 && o.lockT < KAMIKAZE.stagger);
    if (d < KAMIKAZE.lockRange && ready && (lead > 0 || j === 0 || mates.length === 1) && this.onScreen(e)) { e.lockT = 0; sfx.play('kamikaze_whine', e.x, e.y, { prio: true }); }
  }

  /** a rocket man's demolition charge going off: kills him, hurts everything close, chains to other charges */
  private mineBlast(x: number, y: number) {
    const R = 60;
    this.quiet = true; this.explode(x, y, 30, 80, 52); this.quiet = false;
    sfx.play('explode_mine', x, y, { prio: true });
    this.waves.push({ x, y, life: 0.4, max: 0.4, r: 80 });
    const pd = Math.hypot(this.player.x - x, this.player.y - y);
    this.shake = Math.max(this.shake, 3 + 9 * Math.max(0, 1 - pd / 500));
    this.screenFlash = Math.max(this.screenFlash, 0.35 * Math.max(0, 1 - pd / 500));
    for (const o of this.units) {
      if (o.dead || o.flying) continue;
      const d = Math.hypot(o.x - x, o.y - y);
      if (d >= R) continue;
      o.hp -= 35 * (1 - d / R) * (o.team === 0 ? this.level.dmg : 1); o.hitT = 0;
      if (o === this.player) { this.addFloat(o.x, o.y, 'MÌN!', 0xff8a5c); this.hitMarks.push({ a: Math.atan2(y - o.y, x - o.x), life: 1 }); }
      if (o.hp <= 0) this.kill(o);
    }
  }

  /** a kamikaze going off, shot down or on impact: hits whatever is under it and everything around */
  private kamiBlast(t: Unit) {
    const K_ = KAMIKAZE;
    this.explode(t.x, t.y, 14, 30, 34);
    for (const o of this.units) {
      if (o === t || o.dead) continue;
      const d = Math.hypot(o.x - t.x, o.y - t.y);
      const direct = t.diving && t.z <= 1 && d < K_.hitRadius && !o.flying;
      if (!direct && d >= K_.halo) continue;
      if (o.flying && o.kind !== 'kamikaze' && o.kind !== 'drone' && d > K_.halo * 0.6) continue;
      let dmg = (direct ? K_.direct : K_.haloDmg * (1 - d / K_.halo)) * this.level.dmg;
      if (o === this.player && this.cageUAV > 0) {
        dmg *= 1 - K_.cageCut; this.cageUAV = Math.max(0, this.cageUAV - K_.cageCost);
        if (this.cageUAV <= 0) this.toast('Mất LỒNG CHỐNG UAV · xe nhẹ và nhanh trở lại');
      }
      o.hp -= dmg; o.hitT = 0;
      if (o === this.player) { this.hitMarks.push({ a: Math.atan2(t.y - o.y, t.x - o.x), life: 1 }); this.shake = Math.max(this.shake, direct ? 9 : 5); }
      if (direct && o === this.player) this.addFloat(o.x, o.y, 'DRONE CẢM TỬ', 0xff8a5c);
      if (o.hp <= 0) this.kill(o);
    }
  }

  // ---------- co-op ----------
  /**
   * Friendly tank: pushes along its own attack axis, stops to fight whatever it can see in range,
   * closes on enemies it knows about, and hunts the leftovers once the axis is done.
   */
  private updateFriend(f: Unit, dt: number) {
    this.updateWeapon(f, dt);
    if (f.dead) return;
    const w = f.spec.weapon, route = f.axis ?? this.level.friends?.route ?? [];
    let tgt: Unit | null = null, bd = 520;
    for (const e of this.enemies) {
      if (e.dead || e.hidden) continue;
      const d = Math.hypot(e.x - f.x, e.y - f.y);
      if (d < bd && (e.flying || this.clearShot(f.x, f.y, e.x, e.y))) { bd = d; tgt = e; }
    }
    if (tgt) {
      const toT = Math.atan2(tgt.y - f.y, tgt.x - f.x);
      if (bd < w.range * 0.9) {
        const [sx, sy] = this.separation(f, 60);
        this.drive(f, Math.hypot(sx, sy) > 0.25 ? sx : 0, Math.hypot(sx, sy) > 0.25 ? sy : 0, dt, 0.6);
      } else this.follow(f, tgt.x, tgt.y, dt);
      this.aim(f, toT, dt);
      this.updateSpread(f, dt);
      if (bd < w.range && this.aligned(f) && Math.abs(angDiff(toT, f.tur)) < 0.1) this.pull(f);
      return;
    }
    // nothing in sight: an enemy already in the fight nearby, else the next point on the axis, else the nearest enemy left
    let goal: [number, number] | null = null, nd = 450;
    for (const e of this.enemies) {
      if (e.dead || e.hidden || !e.active || e.flying) continue;
      const d = Math.hypot(e.x - f.x, e.y - f.y);
      if (d < nd) { nd = d; goal = [e.x, e.y]; }
    }
    if (!goal && f.wp < route.length) {
      goal = route[f.wp];
      if (Math.hypot(goal[0] - f.x, goal[1] - f.y) < 40) f.wp++;
    }
    if (!goal) {
      let fd = 1e9;
      for (const e of this.enemies) { if (e.dead || e.flying) continue; const d = Math.hypot(e.x - f.x, e.y - f.y); if (d < fd) { fd = d; goal = [e.x, e.y]; } }
    }
    if (goal) this.follow(f, goal[0], goal[1], dt, 0.85); else this.drive(f, 0, 0, dt);
    this.aim(f, null, dt);
    this.updateSpread(f, dt);
  }

  // ---------- kill credit, streaks, air support ----------
  private creditKill(t: Unit) {
    const soft = t.spec.soft;
    this.support = Math.min(SUPPORT_KILLS, this.support + (soft ? 0.5 : 1));
    try { localStorage.setItem(SUPPORT_KEY, String(this.support)); } catch { /* storage blocked */ }
    if (this.support >= SUPPORT_KILLS && this.support - (soft ? 0.5 : 1) < SUPPORT_KILLS) this.toast('YỂM TRỢ ĐÃ SẴN SÀNG · bấm YỂM TRỢ (phím F)');
    this.streak.n = this.time - this.streak.t <= STREAK_GAP ? this.streak.n + 1 : 1;
    this.streak.t = this.time;
    const n = this.streak.n, st = this.stats;
    st.bestStreak = Math.max(st.bestStreak, n);
    if (n === 2) st.double++; else if (n === 5) st.ace++; else if (n === 10) st.legend++;
    const title = STREAK_TITLES[this.streak.n];
    if (title) {
      sfx.play(n === 2 ? 'streak_double' : n === 5 ? 'streak_ace' : 'streak_legend');
      const el = this.streakEl;
      el.innerHTML = `${title}<small>${this.streak.n} MỤC TIÊU LIÊN TIẾP</small>`;
      el.hidden = false; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
      this.streakT = 1.8;
    }
  }

  /** stats for a kill the player earned: weapon, enemy type, flank shot, distance */
  private statKill(t: Unit) {
    const s = this.stats, w: KillWeapon = t.hitAt === this.time && t.hitBy ? t.hitBy : 'other';
    s.kills[w]++;
    s.byType[t.kind] = (s.byType[t.kind] ?? 0) + 1;
    if (w === 'cannon' && t.hitFlank) s.flank++;
    if (w === 'cannon' || w === 'missile') s.longest = Math.max(s.longest, Math.hypot(t.x - this.player.x, t.y - this.player.y));
  }

  /** where a strike does most good: the locked target, else the densest enemy group near the vehicle */
  private strikeTarget(): [number, number] | null {
    const p = this.player, l = p.lock;
    if (l && !l.dead && !l.flying) return [l.x, l.y];
    let best: Unit | null = null, bn = 0, bd = 1e9;
    for (const e of this.enemies) {
      if (e.dead || e.flying || e.hidden) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d > 560) continue;
      const n = this.enemies.filter((o) => !o.dead && !o.flying && Math.hypot(o.x - e.x, o.y - e.y) < 80).length;
      if (n > bn || (n === bn && d < bd)) { bn = n; bd = d; best = e; }
    }
    return best ? [best.x, best.y] : null;
  }

  private requestStrike() {
    if (this.support < SUPPORT_KILLS) { this.toast(`Yểm trợ chưa sẵn sàng · ${Math.floor(this.support)}/${SUPPORT_KILLS} xe`); return; }
    const tg = this.strikeTarget();
    if (!tg) { this.toast('Không có mục tiêu cho yểm trợ'); return; }
    this.support -= SUPPORT_KILLS;
    try { localStorage.setItem(SUPPORT_KEY, String(this.support)); } catch { /* storage blocked */ }
    this.callStrike(tg[0], tg[1], this.player.x, this.player.y, 0, true);
    this.stats.strikes++;
    this.toast('A-10 VÀO VÙNG · 2 giây');
  }

  /** an A-10 run along the line from (fromX, fromY) through the target: 2 s warning, then missiles, cannon and bombs */
  callStrike(tx: number, ty: number, fromX: number, fromY: number, delay = 0, own = false) {
    let ux = tx - fromX, uy = ty - fromY;
    const l = Math.hypot(ux, uy);
    if (l < 1) { ux = 1; uy = 0; } else { ux /= l; uy /= l; }
    this.strikes.push({ cx: tx, cy: ty, ux, uy, len: 300, t: -delay, px: -1e9, drop: 0, fired: false, own });
    sfx.play('strike_warning', undefined, undefined, { delay, prio: true });
  }

  private updateStrikes(dt: number) {
    const WARN = 2, SPEED = 760;
    for (let k = this.strikes.length - 1; k >= 0; k--) {
      const s = this.strikes[k];
      s.t += dt;
      if (s.t < WARN) continue;
      if (!s.flew) { s.flew = true; sfx.play('jet_flyby', s.cx, s.cy, { prio: true }); sfx.play('bomb_whistle', s.cx, s.cy, { prio: true }); }
      // along-track position of the aircraft, measured from the corridor centre
      s.px = -s.len / 2 - 500 + (s.t - WARN) * SPEED;
      const inside = s.px > -s.len / 2 && s.px < s.len / 2;
      if (inside && !s.fired) {
        // missiles first: the two toughest enemies in the corridor
        s.fired = true;
        sfx.play('gau8_burst', s.cx, s.cy, { prio: true });
        const hit = this.enemies.filter((e) => !e.dead && !e.flying && this.inCorridor(s, e.x, e.y, 60)).sort((a, b) => b.hp - a.hp).slice(0, 2);
        for (const e of hit) { this.explode(e.x, e.y, 20, 60, 30); this.strikeDamage(e.x, e.y, 30, 90, s.own); }
      }
      if (inside) {
        // cannon tracers ahead of the aircraft, bombs every 28 px along the track
        const ax = s.cx + s.ux * s.px, ay = s.cy + s.uy * s.px;
        if (Math.random() < dt * 30) this.tracers.push({ x0: ax - s.ux * 40, y0: ay - s.uy * 40, z0: 90, x1: ax + s.ux * 60 + rand(-15, 15), y1: ay + s.uy * 60 + rand(-15, 15), z1: 0, life: 0.05 });
        while (s.drop <= s.px + s.len / 2) {
          const along = s.drop - s.len / 2, j = rand(-14, 14), bx = s.cx + s.ux * along - s.uy * j, by = s.cy + s.uy * along + s.ux * j;
          this.explode(bx, by, 26, 70, 34);
          this.strikeDamage(bx, by, 48, 55, s.own);
          s.drop += 28;
        }
      }
      if (s.px > s.len / 2 + 600) this.strikes.splice(k, 1);
    }
  }

  private inCorridor(s: { cx: number; cy: number; ux: number; uy: number; len: number }, x: number, y: number, w: number) {
    const dx = x - s.cx, dy = y - s.cy, along = dx * s.ux + dy * s.uy, across = -dx * s.uy + dy * s.ux;
    return Math.abs(along) < s.len / 2 + 20 && Math.abs(across) < w;
  }

  /** strike damage hits the enemy only (no friendly fire); `own` = a run the player called (stats only, no kill credit) */
  private strikeDamage(x: number, y: number, r: number, dmg: number, own = false) {
    for (const e of this.enemies) {
      if (e.dead || e.flying) continue;
      const d = Math.hypot(e.x - x, e.y - y);
      if (d < r) {
        const v = dmg * (1 - (0.5 * d) / r);
        if (own) { this.stats.dealt += Math.max(0, Math.min(v, e.hp)); e.hitBy = 'air'; e.hitAt = this.time; e.hitFlank = false; }
        e.hp -= v; e.hitT = 0; e.active = true;
        if (e.hp <= 0) this.kill(e);
      }
    }
  }

  // ---------- missions ----------
  private enemiesIn(x: number, y: number, r: number) {
    return this.enemies.some((e) => !e.dead && !e.hidden && !e.flying && Math.hypot(e.x - x, e.y - y) < r);
  }

  private updateMission(dt: number) {
    const m = this.mission, p = this.player, ms = this.ms;
    // last two enemies: always point at them and pull rocket teams out of hiding
    if ((m.kind === 'destroy' || ms.relieved) && !ms.endgame && this.enemies.filter((e) => !e.dead).length <= 2) {
      ms.endgame = true; this.toast('Còn 2 địch cuối · mũi tên chỉ hướng');
    }
    if (ms.endgame) for (const e of this.enemies) if (!e.dead && e.kind === 'infantry') { e.revealT = 99; e.hidden = false; }
    if (m.kind === 'capture' || m.kind === 'hold') {
      const z = m.zone;
      ms.inZone = !p.dead && Math.hypot(p.x - z.x, p.y - z.y) < z.r;
      ms.contested = this.enemiesIn(z.x, z.y, z.r);
      if (ms.inZone && !ms.contested) ms.progress += dt;
      else if (m.kind === 'hold' && !ms.inZone && ms.contested) ms.progress = Math.max(0, ms.progress - dt * 0.5);
      if (m.kind === 'hold') {
        if (ms.clock < 0 && ms.inZone) { ms.clock = 0; this.toast('Bắt đầu cố thủ · địch sẽ dồn quân tới'); }
        if (ms.clock >= 0 && !ms.relieved) {
          ms.clock += dt;
          while (ms.wave < m.waves.length && ms.clock >= m.waves[ms.wave].at) this.spawnWave(ms.wave++);
        }
        if (m.relief && !ms.relieved && ms.progress >= m.time) this.relieve(m.zone, m.relief);
      }
    }
    // finale: move on to the next stage
    const all = this.level.mission;
    if (all.kind === 'stages' && this.stage < all.stages.length - 1 && !p.dead && this.stageDone()) {
      const relief = ms.relieved, inZone = ms.inZone;
      this.stage++;
      Object.assign(ms, { progress: 0, clock: -1, wave: 0, inZone: false, contested: false, endgame: false, relieved: false });
      const st = all.stages[this.stage];
      // a hold that follows a capture of the same zone starts at once (no second toast)
      if (st.kind === 'hold' && inZone) ms.clock = 0;
      sfx.play('stage_clear');
      this.toast(`${relief ? 'TIẾP VIỆN + A-10 ĐÃ TỚI · ' : ''}CHẶNG ${this.stage + 1}/${all.stages.length} · ${st.title.toUpperCase()}${st.kind === 'hold' ? ` ${st.time} GIÂY` : ''}`);
    }
  }

  /** the current mission (or stage) is complete; a hold with relief completes when the relief arrives */
  private stageDone(): boolean {
    const m = this.mission;
    if (m.kind === 'hold' && m.relief) return this.ms.relieved;
    if (m.kind === 'capture' || m.kind === 'hold') return this.ms.progress >= m.time;
    if (m.kind === 'escort') {
      const alive = this.convoy.filter((c) => !c.dead);
      return alive.length >= m.trucks - m.maxLost && alive.every((c) => c.arrived);
    }
    return this.enemies.every((e) => e.dead);
  }

  /** the hold paid off: two A-10 runs on the groups round the zone, and a friendly column rolls in to mop up */
  private relieve(z: { x: number; y: number; r: number }, relief: { at: [number, number][]; hull: number }) {
    this.ms.relieved = true;
    this.toast('TIẾP VIỆN ĐÃ TỚI · A-10 VÀO VÙNG');
    sfx.play('stage_clear');
    const near = this.enemies.filter((e) => !e.dead && !e.flying && Math.hypot(e.x - z.x, e.y - z.y) < 480);
    const groups: [number, number][] = [];
    for (const e of [...near].sort((a, b) => near.filter((o) => Math.hypot(o.x - b.x, o.y - b.y) < 90).length - near.filter((o) => Math.hypot(o.x - a.x, o.y - a.y) < 90).length))
      if (groups.length < 2 && groups.every(([gx, gy]) => Math.hypot(gx - e.x, gy - e.y) > 160)) groups.push([e.x, e.y]);
    if (!groups.length) groups.push([z.x + 120, z.y]);
    groups.forEach(([gx, gy], k) => this.callStrike(gx, gy, k === 0 ? gx - 300 : gx, k === 0 ? gy : gy - 300, k * 1.5));
    for (const [fx, fy] of relief.at) {
      const f = this.addUnit(FRIEND_TANK, 'friend', 0, fx, fy, relief.hull);
      f.active = true; f.axis = [[z.x, z.y]];
      this.friends.push(f);
    }
  }

  /** reinforcements come in from the map edge, in file, already hunting */
  private spawnWave(k: number) {
    const m = this.mission;
    if (m.kind !== 'hold') return;
    const w = m.waves[k], [fx, fy] = w.from, cx = this.grid.W / 2, cy = this.grid.H / 2;
    const l = Math.hypot(cx - fx, cy - fy), ux = (cx - fx) / l, uy = (cy - fy) / l;
    const sq = this.squads.length;
    this.squads.push({ route: [[m.zone.x, m.zone.y]], wp: 0, members: [], alert: true, baseT: 0 });
    w.units.forEach((type, j) => {
      // file in from the edge: later units further inside, never outside the map (they could not drive back in)
      const a = Math.abs(ux) > Math.abs(uy) ? [Math.sign(ux) * 40 * j, (j % 2 ? 22 : -22)] : [(j % 2 ? 22 : -22), Math.sign(uy) * 40 * j];
      const e = this.addUnit(ENEMIES[type], type, 1, fx + a[0], fy + a[1], Math.atan2(uy, ux));
      e.active = true; e.zoneRush = true;
      if (type === 'kamikaze') e.swarm = 100 + k;
      else if (type !== 'drone') { e.squad = sq; this.squads[sq].members.push(e); }
      if (e.flying) e.z = DRONE_ALT;
      this.enemies.push(e);
    });
    this.toast(w.units.includes('kamikaze') ? 'Bầy drone cảm tử đang tới' : 'Địch tăng viện đang tới');
  }

  /**
   * Supply truck: drives its route, keeps 55 px behind the truck ahead, and the whole convoy halts
   * while any visible enemy is near it or the escort has fallen far behind. Its machine gun only
   * hurts soft targets.
   */
  private updateTruck(t: Unit, dt: number) {
    const m = this.mission;
    if (t.dead || m.kind !== 'escort') return;
    const p = this.player, alive = this.convoy.filter((c) => !c.dead), k = alive.indexOf(t);
    t.reload -= dt;
    if (t.reload <= 0) {
      let best: Unit | null = null, bd = t.spec.weapon.range;
      for (const e of this.enemies) {
        if (e.dead || e.hidden || !e.spec.soft) continue;
        const d = Math.hypot(e.x - t.x, e.y - t.y);
        if (d < bd && (e.flying || this.grid.lineClear(t.x, t.y, e.x, e.y))) { bd = d; best = e; }
      }
      if (best) {
        t.reload = t.spec.weapon.reload; t.tur = Math.atan2(best.y - t.y, best.x - t.x);
        this.tracers.push({ x0: t.x, y0: t.y, z0: 12, x1: best.x + rand(-6, 6), y1: best.y + rand(-6, 6), z1: best.z, life: 0.06 });
        if (Math.random() < 0.75) { best.hp -= t.spec.weapon.dmg * (best.kind === 'infantry' ? INFANTRY.mgMul : 1); best.hitT = 0; best.active = true; if (best.hp <= 0) this.kill(best); }
      }
    }
    if (k === 0) {
      const wasHalted = this.ms.halted;
      this.ms.halted = alive.some((c) => !c.arrived && this.enemies.some((e) => !e.dead && !e.hidden && Math.hypot(e.x - c.x, e.y - c.y) < 230));
      if (!wasHalted && this.ms.halted) sfx.play('ui_alert');
      this.ms.waiting = !p.dead && alive.every((c) => !c.arrived) && Math.hypot(p.x - t.x, p.y - t.y) > 450;
    }
    if (t.arrived || this.ms.halted || this.ms.waiting) { this.drive(t, 0, 0, dt); return; }
    const ahead = alive[k - 1];
    if (ahead && Math.hypot(ahead.x - t.x, ahead.y - t.y) < 55) {
      // queue behind the truck ahead; at the destination that counts as arrived
      const end = m.route[m.route.length - 1];
      if (ahead.arrived && Math.hypot(end[0] - t.x, end[1] - t.y) < 200) { t.arrived = true; this.toast(`Xe tiếp tế tới điểm tập kết (${this.convoy.filter((c) => c.arrived).length}/${m.trucks})`); }
      this.drive(t, 0, 0, dt); return;
    }
    const [tx, ty] = m.route[Math.min(t.wp, m.route.length - 1)];
    const dx = tx - t.x, dy = ty - t.y, d = Math.hypot(dx, dy);
    if (d < 14) {
      if (t.wp >= m.route.length - 1) { t.arrived = true; this.toast(`Xe tiếp tế tới điểm tập kết (${this.convoy.filter((c) => c.arrived).length}/${m.trucks})`); }
      else t.wp++;
      return;
    }
    this.drive(t, dx / d, dy / d, dt);
  }

  /** where the objective arrow points: the zone, or the convoy's destination */
  private missionGoal(): [number, number] | null {
    const m = this.mission;
    if (m.kind === 'capture' || m.kind === 'hold') return [m.zone.x, m.zone.y];
    if (m.kind === 'escort') {
      const lead = this.convoy.find((c) => !c.dead && !c.arrived);
      return lead && Math.hypot(lead.x - this.player.x, lead.y - this.player.y) > 300 ? [lead.x, lead.y] : m.route[m.route.length - 1];
    }
    return null;
  }

  /** objective box: icons and numbers; the briefing carries the words. Returns [class, html]. */
  private missionHud(): [string, string] {
    const m = this.mission, ms = this.ms;
    const count = (n: number, of: number) => `<b>${n}</b><small>/${of}</small>`;
    const left = this.enemies.filter((e) => !e.dead).length;
    if (m.kind === 'hold' && ms.relieved) return ['', `${ic('target')}<b>${left}</b>`];
    if (m.kind === 'capture' || m.kind === 'hold') {
      const pct = Math.round(clamp(ms.progress / m.time, 0, 1) * 100);
      const st = ms.contested ? 'warn' : ms.inZone ? '' : 'out';
      return [st, `${ic('flag', st === 'out' ? '' : 'ok')}<span class="pbar"><i style="width:${pct}%"></i></span><b>${Math.max(0, Math.ceil(m.time - ms.progress))}s</b>${ms.contested ? ic('alert', 'red') : ''}`];
    }
    if (m.kind === 'escort') {
      const trucks = this.convoy.map((c) => ic('truck', c.dead ? 'gone' : c.arrived ? 'ok' : c.hp < c.spec.hp * 0.5 ? 'amber' : '')).join('');
      return [ms.halted ? 'warn' : '', trucks + (ms.halted ? ic('alert', 'red') : ms.waiting ? ic('alert', 'amber') : '')];
    }
    const fr = this.friends.length ? `<span class="sep"></span>${ic('tank', 'ok')}${count(this.friends.filter((f) => !f.dead).length, this.friends.length)}` : '';
    return ['', `${ic('target')}${count(left, this.enemies.length)}${fr}`];
  }

  /** [won, lost] */
  private missionOutcome(): [boolean, boolean] {
    const m = this.mission, all = this.level.mission;
    if (this.player.dead) return [false, true];
    if (m.kind === 'escort' && this.convoy.filter((c) => c.dead).length > m.maxLost) return [false, true];
    if (all.kind === 'stages' && this.stage < all.stages.length - 1) return [false, false];
    // a lone hold with relief: the relief arrives, then the area has to be cleared
    if (all.kind === 'hold' && all.relief) return [this.ms.relieved && this.enemies.every((e) => e.dead), false];
    return [this.stageDone(), false];
  }

  /** gunfire: idle enemies in earshot (and their whole squad) start hunting the player */
  private alarm(x: number, y: number, r: number) {
    for (const e of this.enemies) if (!e.dead && !e.active && Math.hypot(e.x - x, e.y - y) < r) e.active = true;
  }

  /** idle squads drive their loop at a walking pace, the others following in the leader's tracks */
  private patrol(e: Unit, dt: number) {
    const sq = this.squads[e.squad], alive = sq.members.filter((m) => !m.dead), k = alive.indexOf(e);
    let tx: number, ty: number, pace = 0.5;
    if (k === 0) {
      [tx, ty] = sq.route[sq.wp];
      if (Math.hypot(tx - e.x, ty - e.y) < 30) { sq.wp = (sq.wp + 1) % sq.route.length; [tx, ty] = sq.route[sq.wp]; }
      // the leader eases off when the column strings out (tanks are slower than APCs)
      const lag = Math.max(0, ...alive.map((m, j) => Math.hypot(m.x - e.x, m.y - e.y) - 45 * j));
      pace = lag > 60 ? 0.15 : 0.5 * Math.min(1, 50 / Math.max(50, lag * 1.5));
    } else {
      const lead = alive[0];
      tx = lead.x - Math.cos(lead.hull) * 45 * k; ty = lead.y - Math.sin(lead.hull) * 45 * k;
      const gap = Math.hypot(tx - e.x, ty - e.y);
      if (gap < 15) tx = e.x, ty = e.y;
      pace = gap > 40 ? 0.9 : 0.5;
    }
    // routes are planned, so loops can cross open ground (desert) as well as streets
    if (Math.hypot(tx - e.x, ty - e.y) > 20) this.follow(e, tx, ty, dt, pace); else this.drive(e, 0, 0, dt);
    this.aim(e, null, dt);
  }

  private updateEnemy(e: Unit, dt: number) {
    const pl = this.player, p = this.targetFor(e, dt);
    this.updateWeapon(e, dt);
    e.hitT += dt;
    if (e.dead) {
      e.deadT += dt;
      if (!e.flying && e.kind !== 'infantry' && e.deadT < 10) {
        e.emitT -= dt;
        if (e.emitT <= 0) {
          e.emitT = 0.08;
          this.particles.emit(P.Smoke, e.x + rand(-6, 6), e.y + rand(-6, 6), 12, rand(-8, 8), rand(-8, 8), rand(18, 34), rand(1.5, 2.6), rand(5, 9), 0x3e3d39);
          if (Math.random() < 0.7) this.particles.emit(P.Fire, e.x + rand(-8, 8), e.y + rand(-8, 8), 8, rand(-10, 10), rand(-10, 10), rand(30, 60), rand(0.3, 0.6), rand(4, 8), Math.random() < 0.5 ? 0xff9a3c : 0xffcf6a);
        }
      }
      return;
    }
    if (e.kind === 'infantry') { this.updateInfantry(e, p, dt); return; }
    if (e.kind === 'kamikaze') { this.updateKamikaze(e, dt); return; }
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy), toP = Math.atan2(dy, dx);
    if (!e.active) {
      if ((!pl.dead && Math.hypot(pl.x - e.x, pl.y - e.y) < (e.flying ? 700 : 620)) || this.friends.some((f) => !f.dead && Math.hypot(f.x - e.x, f.y - e.y) < 520)) e.active = true;
      else { if (e.squad >= 0) this.patrol(e, dt); this.updateSpread(e, dt); return; }
    }
    if (e.squad >= 0 && !this.squads[e.squad].alert) {
      // one member in contact brings the whole squad
      const sq = this.squads[e.squad];
      sq.alert = true;
      for (const m of sq.members) m.active = true;
    }
    const w = e.spec.weapon;
    const los = e.flying || this.clearShot(e.x, e.y, p.x, p.y);
    const canSee = !p.dead && los && d < w.range;
    let mx = 0, my = 0;
    if (e.flying) {
      const alt = Math.max(DRONE_ALT, this.roofAround(e.x + Math.cos(e.hull) * 20, e.y + Math.sin(e.hull) * 20, 24) + DRONE_CLEARANCE);
      e.z += (alt - e.z) * Math.min(1, dt * 4);
    }

    if (e.kind === 'drone') {
      const orbit = Math.atan2(e.y - p.y, e.x - p.x) + 0.6 * e.strafe;
      const tx = p.x + Math.cos(orbit) * 150, ty = p.y + Math.sin(orbit) * 150;
      mx = tx - e.x; my = ty - e.y;
      const l = Math.hypot(mx, my); if (l > 1) { mx /= l; my /= l; } else { mx = my = 0; }
      if (Math.hypot(mx, my) > 0.15) e.hull = Math.atan2(my, mx);
      e.strafeT -= dt; if (e.strafeT <= 0) { e.strafe = Math.random() < 0.5 ? 1 : -1; e.strafeT = rand(3, 6); }
      this.drive(e, mx, my, dt);
    } else this.tactics(e, p, d, toP, canSee, dt);
    this.aim(e, !p.dead && d < 520 ? toP : null, dt);
    this.updateSpread(e, dt);
    // fairness rule: only shoot from where the player can see you; co-op tanks fighting far away get no such shield
    if (canSee && (p.kind === 'friend' || this.onScreen(e)) && this.aligned(e) && Math.abs(angDiff(toP, e.tur)) < 0.12) this.pull(e);
  }

  /** engine rumble follows the vehicle's speed; the nearest hostile drone buzzes louder as it closes */
  private updateLoopSounds(dt: number) {
    const p = this.player;
    sfx.listen(p.x, p.y);
    sfx.engine(p.dead ? -1 : p.vel / p.spec.speed, dt);
    let best: Unit | null = null, bd = 700;
    for (const e of this.enemies) {
      if (e.dead || !e.flying) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < bd) { bd = d; best = e; }
    }
    sfx.drone(best && !p.dead ? 1 - bd / 700 : 0, best ? Math.max(-1, Math.min(1, (best.x - p.x) / 450)) : 0);
  }

  // ---------- frame ----------
  update(dtRaw: number) {
    if (this.paused) { this.input.poll(); sfx.hush(); return; }
    const dt = Math.min(0.033, dtRaw);
    this.time += dt;
    this.input.poll();
    this.updatePlayer(dt);
    this.updateLoopSounds(dt);
    this.flow.update(dt, this.player.x, this.player.y);
    for (const a of this.allies) this.updateAlly(a, dt);
    for (const e of this.enemies) this.updateEnemy(e, dt);
    for (const t of this.convoy) this.updateTruck(t, dt);
    if (this.level.biome === 'desert') for (const u of this.units) {
      if (u.dead || u.flying || u.kind === 'infantry' || u.vel < 40 || Math.random() > dt * 14) continue;
      const bx = u.x - Math.cos(u.hull) * u.spec.size[0] * 0.5, by = u.y - Math.sin(u.hull) * u.spec.size[0] * 0.5;
      this.particles.emit(P.Dust, bx + rand(-5, 5), by + rand(-5, 5), u.z + 3, -Math.cos(u.hull) * 15 + rand(-8, 8), -Math.sin(u.hull) * 15 + rand(-8, 8), 6, rand(0.8, 1.5), rand(5, 9), 0xd8c19a);
    }
    for (const f of this.friends) this.updateFriend(f, dt);
    this.updateMission(dt);
    this.updateStrikes(dt);
    const f = this.input.keys.has('f');
    if ((this.airQueued || (f && !this.fPrev)) && !this.player.dead) this.requestStrike();
    this.airQueued = false; this.fPrev = f;
    if (this.streakT > 0 && (this.streakT -= dt) <= 0) this.streakEl.hidden = true;
    this.updateShells(dt);
    this.updateMissiles(dt);
    this.updateSupport(dt);
    this.track.step(this.player.x, this.player.y, Math.max(0, this.player.hp), this.plate + this.cageAT + this.cageUAV);
    for (let k = this.tracers.length - 1; k >= 0; k--) if ((this.tracers[k].life -= dt) <= 0) this.tracers.splice(k, 1);
    this.particles.update(dt);
    for (let k = this.flashes.length - 1; k >= 0; k--) if ((this.flashes[k].life -= dt) <= 0) this.flashes.splice(k, 1);
    for (let k = this.waves.length - 1; k >= 0; k--) if ((this.waves[k].life -= dt) <= 0) this.waves.splice(k, 1);
    this.screenFlash = Math.max(0, this.screenFlash - dt * 2.2);
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
    const tx = p.x + this.look.x * vw * settings.lookAhead, ty = p.y + this.look.y * vh * settings.lookAhead, a = 1 - Math.exp(-dt * 5);
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
    // snap the camera to whole render pixels so pixel-mode edges do not shimmer
    const rs = this.res();
    vr.x = Math.round((w / 2 - this.cam.x * z + sx) * rs) / rs;
    vr.y = Math.round((h / 2 - this.cam.y * K * z + sy) * rs) / rs;
    const hw = w / 2 / z, hh = h / 2 / z;
    this.view.update(this.cam.x - hw, this.cam.x + hw, this.cam.y * K - hh, this.cam.y * K + hh);
    for (const u of this.units) { if (!u.flying) u.z = this.grid.thAt(u.x, u.y); u.view.sync(u.x, u.y, u.z, u.hull, u.tur, u.recoil, u.dead, this.time); }
    for (const e of this.enemies) if (e.kind === 'infantry') e.view.root.visible = !e.hidden;

    // world-space overlay: shells, flashes, target marker, health bars
    const g = this.fx;
    g.clear();
    for (const s of this.shells) {
      const y = s.y * K - s.z * ZS, ty = (s.y - s.vy * 0.03) * K - s.z * ZS;
      g.moveTo(s.x - s.vx * 0.03, ty).lineTo(s.x, y).stroke({ width: s.light ? 1.6 : 2.4, color: s.team ? 0xff9a7a : 0xffe2a0 });
    }
    for (const t of this.tracers) g.moveTo(t.x0, t.y0 * K - t.z0 * ZS).lineTo(t.x1, t.y1 * K - t.z1 * ZS).stroke({ width: 1.2, color: 0xfff1b0, alpha: 0.8 });
    for (const m of this.missiles) {
      const y = m.y * K - m.z * ZS;
      g.circle(m.x, y, 4.5).fill({ color: 0xff9a3c, alpha: 0.45 });
      g.moveTo(m.x - Math.cos(m.a) * 7, y - Math.sin(m.a) * 7 * K).lineTo(m.x + Math.cos(m.a) * 5, y + Math.sin(m.a) * 5 * K).stroke({ width: 3, color: 0xebe7d3 });
    }
    for (const s of this.stations) {
      const y = s.y * K, live = s.pool > 0, col = live ? 0x9fd16a : 0x6a6a5e;
      g.ellipse(s.x, y, REPAIR.stationRadius, REPAIR.stationRadius * K).fill({ color: col, alpha: live ? 0.1 : 0.05 }).stroke({ width: 1.5, color: col, alpha: 0.6 });
      g.rect(s.x - 3, y - 10, 6, 20).fill({ color: col, alpha: 0.9 }).rect(s.x - 10, y - 3, 20, 6).fill({ color: col, alpha: 0.9 });
    }
    for (const c of this.crates) {
      const y = c.y * K - c.z * ZS;
      g.ellipse(c.x, c.y * K, 9, 9 * K).fill({ color: 0x000000, alpha: 0.3 });
      if (c.z > 0) g.moveTo(c.x - 7, y - 4).lineTo(c.x, y - 26).lineTo(c.x + 7, y - 4).stroke({ width: 1, color: 0xebe7d3, alpha: 0.8 }).ellipse(c.x, y - 28, 14, 7).fill(0xebe7d3);
      if (c.kind === 'up') g.rect(c.x - 8, y - 10, 16, 12).fill(0x8a6a2a).rect(c.x - 8, y - 6, 16, 3).fill(0xf0b23c).rect(c.x - 1.5, y - 10, 3, 12).fill(0xf0b23c);
      else if (c.kind === 'mis') g.rect(c.x - 7, y - 9, 14, 11).fill(0x5a4a3a).rect(c.x - 5, y - 7, 10, 2.5).rect(c.x - 5, y - 3, 10, 2.5).fill(0xff9a3c);
      else if (c.kind === 'drone') g.rect(c.x - 7, y - 9, 14, 11).fill(0x3f5a5c).circle(c.x, y - 3.5, 3).fill(0x9fd1d6);
      else g.rect(c.x - 7, y - 9, 14, 11).fill(0x6f7a4a).rect(c.x - 2, y - 9, 4, 11).fill(0x9fd16a);
    }
    if (this.repairT >= 0 && !this.player.dead) {
      const p = this.player, y = p.y * K - 40, f = this.repairT / REPAIR.kitTime;
      g.circle(p.x, y, 9).stroke({ width: 3, color: 0x000000, alpha: 0.4 });
      g.moveTo(p.x, y - 9).arc(p.x, y, 9, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2).stroke({ width: 3, color: 0x9fd16a });
    }
    for (const sw of this.waves) {
      const k = 1 - sw.life / sw.max, r = 12 + sw.r * Math.sqrt(k);
      g.ellipse(sw.x, sw.y * K, r, r * K).stroke({ width: 4 * (1 - k) + 1, color: 0xfff1c8, alpha: 0.7 * (1 - k) });
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
        const S = clamp(20 + d * p.spread * 0.8, 20, 46), G = 8, cx = e.x, cy = e.y * K - (e.flying ? e.z : 8) * ZS;
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
      const L = p.spec.size[0] / 2, Wd = p.spec.size[1] / 2, hc = Math.cos(p.hull), hs = Math.sin(p.hull);
      const box = (sx: number, sy: number, lift: number) => [[sx, sy], [sx, -sy], [-sx, -sy], [-sx, sy]].flatMap(([a, b]) => [p.x + a * hc - b * hs, p.y * K - lift * ZS + (a * hs + b * hc) * K]);
      // cage outlines for the flat vehicle; a voxel vehicle shows its cages as parts of the model
      if (!p.view.voxel && this.cageAT > 0) g.poly(box(L + 4, Wd + 4, 6)).stroke({ width: 1.6, color: 0xb9bda6, alpha: 0.8 });
      if (!p.view.voxel && this.cageUAV > 0) g.poly(box(L * 0.8, Wd * 0.8, 20)).stroke({ width: 1.2, color: 0xb9bda6, alpha: 0.65 });
      if (this.view.occluded(p.x, p.y)) {
        const L = p.spec.size[0] / 2, Wd = p.spec.size[1] / 2, c = Math.cos(p.hull), s = Math.sin(p.hull), oy = p.y * K - 9 * ZS;
        const pts = [[L, Wd], [L, -Wd], [-L, -Wd], [-L, Wd]].flatMap(([a, b]) => [p.x + a * c - b * s, oy + (a * s + b * c) * K]);
        g.poly(pts).stroke({ width: 2, color: 0xf0b23c, alpha: 0.85 });
      }
    }
    // objective: capture/hold zone, convoy destination
    const mi = this.mission;
    if (mi.kind === 'capture' || mi.kind === 'hold') {
      const z = mi.zone, f = Math.min(1, this.ms.progress / mi.time), col = this.ms.contested ? 0xe4573f : 0x5fc8e8;
      g.ellipse(z.x, z.y * K, z.r, z.r * K).fill({ color: col, alpha: 0.1 }).stroke({ width: 2.5, color: col, alpha: 0.75 });
      if (f > 0) g.moveTo(z.x + z.r + 8, z.y * K).arc(z.x, z.y * K, z.r + 8, 0, f * Math.PI * 2).stroke({ width: 4, color: 0x9fd16a, alpha: 0.9 });
    } else if (mi.kind === 'escort') {
      const [ex, ey] = mi.route[mi.route.length - 1];
      g.ellipse(ex, ey * K, 50, 50 * K).fill({ color: 0x5fc8e8, alpha: 0.1 }).stroke({ width: 2.5, color: 0x5fc8e8, alpha: 0.75 });
      for (let k = 1; k < mi.route.length; k++) g.moveTo(mi.route[k - 1][0], mi.route[k - 1][1] * K).lineTo(mi.route[k][0], mi.route[k][1] * K);
      g.stroke({ width: 2, color: 0x5fc8e8, alpha: 0.25 });
    }
    // supply trucks: health bars, so the one about to go up is obvious
    for (const t of [...this.convoy, ...this.friends]) {
      if (t.dead) continue;
      const f = Math.max(0, t.hp / t.spec.hp), x = t.x - 16, y = t.y * K - 30;
      g.rect(x - 1, y - 1, 34, 6).fill({ color: 0x000000, alpha: 0.55 });
      g.rect(x, y, 32 * f, 4).fill(f > 0.6 ? 0x9fd16a : f > 0.3 ? 0xf0b23c : 0xe4573f);
    }
    // air strikes: red corridor while the A-10 is inbound, then the aircraft and its shadow
    for (const st of this.strikes) {
      const hl = st.len / 2, w2 = 40, ux = st.ux, uy = st.uy;
      const corner = (a: number, b: number) => [st.cx + ux * a - uy * b, (st.cy + uy * a + ux * b) * K];
      if (st.t < 2) {
        const a = 0.25 + 0.2 * Math.sin(this.time * 16);
        g.poly([...corner(-hl, -w2), ...corner(hl, -w2), ...corner(hl, w2), ...corner(-hl, w2)]).fill({ color: 0xe4573f, alpha: a * 0.5 }).stroke({ width: 2, color: 0xe4573f, alpha: a + 0.3 });
        for (let d = -hl; d < hl; d += 30) { const [x0, y0] = corner(d, 0), [x1, y1] = corner(d + 16, 0); g.moveTo(x0, y0).lineTo(x1, y1); }
        g.stroke({ width: 2, color: 0xffd0c0, alpha: 0.8 });
      } else if (Math.abs(st.px) < hl + 600) {
        const x = st.cx + ux * st.px, y = st.cy + uy * st.px, a = Math.atan2(uy * K, ux), c = Math.cos(a), sn = Math.sin(a);
        const pt = (fx: number, fy: number, oy: number) => [x + fx * c - fy * sn, y * K - oy + fx * sn + fy * c];
        const plane = (oy: number) => [
          ...pt(26, 0, oy), ...pt(16, -3, oy), ...pt(4, -3, oy), ...pt(2, -26, oy), ...pt(-6, -26, oy), ...pt(-6, -3, oy), ...pt(-16, -3, oy), ...pt(-20, -12, oy),
          ...pt(-25, -12, oy), ...pt(-24, 0, oy), ...pt(-25, 12, oy), ...pt(-20, 12, oy), ...pt(-16, 3, oy), ...pt(-6, 3, oy), ...pt(-6, 26, oy), ...pt(2, 26, oy), ...pt(4, 3, oy), ...pt(16, 3, oy)];
        g.poly(plane(0)).fill({ color: 0x000000, alpha: 0.25 }); // shadow on the ground
        g.poly(plane(80)).fill(0x6c7468).stroke({ width: 1, color: 0x3a3f38 });
        g.circle(pt(-12, -6, 80)[0], pt(-12, -6, 80)[1], 3.2).circle(pt(-12, 6, 80)[0], pt(-12, 6, 80)[1], 3.2).fill(0x4a4f48); // twin engines
      }
    }
    // warnings: a rocket team taking aim, a kamikaze locking on or diving
    const blink = 0.55 + 0.45 * Math.sin(this.time * 14);
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (e.kind === 'infantry' && e.telegraphT >= 0) {
        // big enough to catch on a phone: shrinking ring, tall "!" over the roofs
        const y = e.y * K - 44, f = e.telegraphT / INFANTRY.telegraph;
        g.circle(e.x, e.y * K - 4, 16 + 16 * (1 - f)).stroke({ width: 3, color: 0xff4a3a, alpha: blink });
        g.roundRect(e.x - 4.5, y - 24, 9, 20, 3).fill({ color: 0xff4a3a, alpha: blink }).circle(e.x, y + 4, 4.5).fill({ color: 0xff4a3a, alpha: blink });
        if (e.mine) g.rect(e.x - 3.5, e.y * K - 9, 7, 5).fill(0xf0d23c).stroke({ width: 1, color: 0x1b1a10 }); // the charge on his back
      } else if (e.kind === 'infantry' && !e.hidden) {
        // spotted soldier: a marker over the roofs so it can be found and tapped
        const y = e.y * K - 34;
        g.poly([e.x - 7, y - 10, e.x + 7, y - 10, e.x, y]).fill({ color: e.mine ? 0xf0d23c : 0xff8a5c, alpha: 0.9 });
        if (e.mine) g.rect(e.x - 3.5, e.y * K - 9, 7, 5).fill(0xf0d23c).stroke({ width: 1, color: 0x1b1a10 }); // the charge on his back
      }
      if (e.kind === 'kamikaze' && (e.lockT >= 0 || e.diving)) {
        const tx = e.diving ? e.lockX : p.x, ty = e.diving ? e.lockY : p.y;
        g.moveTo(e.x, e.y * K - e.z * ZS).lineTo(tx, ty * K).stroke({ width: 1.5, color: 0xff4a3a, alpha: 0.7 * blink });
        g.ellipse(tx, ty * K, KAMIKAZE.halo, KAMIKAZE.halo * K).stroke({ width: 2, color: 0xff4a3a, alpha: blink }).fill({ color: 0xff4a3a, alpha: 0.08 });
      }
    }
    if (settings.ranges) for (const e of this.enemies) {
      if (e.dead || !e.active || e.hidden) continue;
      const R = e.spec.weapon.range;
      g.ellipse(e.x, e.y * K, R, R * K).stroke({ width: 1.5, color: 0xe4573f, alpha: 0.35 });
    }
    for (const e of [...this.enemies, ...this.allies]) {
      if (e.dead || e.hp >= e.spec.hp) continue;
      const y = e.y * K - (e.flying ? e.z * ZS + 16 : 30);
      g.rect(e.x - 16, y, 32, 4).fill({ color: 0x000000, alpha: 0.6 });
      g.rect(e.x - 16, y, (32 * Math.max(0, e.hp)) / e.spec.hp, 4).fill(e.team ? 0xe4573f : 0x86b0ae);
    }

    // screen-space overlay: off-screen arrows, hit direction, drive stick
    const sg = this.screen;
    sg.clear();
    for (const e of this.enemies) {
      const last = this.ms.endgame;
      if (!(settings.offscreen || last) || e.dead || ((!e.active || e.hidden) && !last)) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d > 900 && !last) continue;
      const [ex, ey] = this.toScreen(e.x, e.y, 8);
      if (ex > -8 && ex < w + 8 && ey > -8 && ey < h + 8) continue;
      const dx = ex - w / 2, dy = ey - h / 2, s = Math.min((w / 2 - 34) / Math.abs(dx || 1e-6), (h / 2 - 34) / Math.abs(dy || 1e-6));
      const ix = w / 2 + dx * s, iy = h / 2 + dy * s, a = Math.atan2(dy, dx), c = Math.cos(a), sn = Math.sin(a);
      const pt = (fx: number, fy: number) => [ix + fx * c - fy * sn, iy + fx * sn + fy * c];
      const locked = d < e.spec.weapon.range;
      sg.poly([...pt(12, 0), ...pt(-6, -8), ...pt(-6, 8)]).fill({ color: locked ? 0xe4573f : 0xf0b23c, alpha: locked ? 0.75 + 0.25 * Math.sin(this.time * 12) : 0.7 });
    }
    for (const c of this.crates) {
      const [ex, ey] = this.toScreen(c.x, c.y, 0);
      if (ex > -8 && ex < w + 8 && ey > -8 && ey < h + 8) continue;
      const dx = ex - w / 2, dy = ey - h / 2, s = Math.min((w / 2 - 34) / Math.abs(dx || 1e-6), (h / 2 - 34) / Math.abs(dy || 1e-6));
      const ix = w / 2 + dx * s, iy = h / 2 + dy * s, a = Math.atan2(dy, dx), cs = Math.cos(a), sn = Math.sin(a);
      const pt = (fx: number, fy: number) => [ix + fx * cs - fy * sn, iy + fx * sn + fy * cs];
      sg.poly([...pt(12, 0), ...pt(-6, -8), ...pt(-6, 8)]).fill({ color: c.kind === 'up' ? 0xf0b23c : 0x9fd16a, alpha: 0.85 });
    }
    for (const f of this.friends) {
      if (f.dead) continue;
      const [ex, ey] = this.toScreen(f.x, f.y, 8);
      if (ex > -8 && ex < w + 8 && ey > -8 && ey < h + 8) continue;
      const dx = ex - w / 2, dy = ey - h / 2, s = Math.min((w / 2 - 34) / Math.abs(dx || 1e-6), (h / 2 - 34) / Math.abs(dy || 1e-6));
      const ix = w / 2 + dx * s, iy = h / 2 + dy * s, a = Math.atan2(dy, dx), cs = Math.cos(a), sn = Math.sin(a);
      const pt = (fx: number, fy: number) => [ix + fx * cs - fy * sn, iy + fx * sn + fy * cs];
      sg.circle(pt(0, 0)[0], pt(0, 0)[1], 6).fill({ color: 0x7a9db2, alpha: 0.85 });
    }
    const goal = this.missionGoal();
    if (goal) {
      const [ex, ey] = this.toScreen(goal[0], goal[1], 0);
      if (!(ex > -8 && ex < w + 8 && ey > -8 && ey < h + 8)) {
        const dx = ex - w / 2, dy = ey - h / 2, s = Math.min((w / 2 - 44) / Math.abs(dx || 1e-6), (h / 2 - 44) / Math.abs(dy || 1e-6));
        const ix = w / 2 + dx * s, iy = h / 2 + dy * s, a = Math.atan2(dy, dx), cs = Math.cos(a), sn = Math.sin(a);
        const pt = (fx: number, fy: number) => [ix + fx * cs - fy * sn, iy + fx * sn + fy * cs];
        sg.poly([...pt(18, 0), ...pt(-8, -12), ...pt(-2, 0), ...pt(-8, 12)]).fill({ color: 0x5fc8e8, alpha: 0.9 });
      }
    }
    const rr = Math.min(w, h) * 0.42;
    for (const m of this.hitMarks) {
      if (!settings.hitMarks) break;
      const a = Math.atan2(Math.sin(m.a) * K, Math.cos(m.a));
      sg.moveTo(w / 2 + Math.cos(a - 0.35) * rr, h / 2 + Math.sin(a - 0.35) * rr).arc(w / 2, h / 2, rr, a - 0.35, a + 0.35).stroke({ width: 6, color: 0xe4573f, alpha: m.life });
    }
    if (this.screenFlash > 0.01) sg.rect(0, 0, w, h).fill({ color: 0xfff1c8, alpha: this.screenFlash });
    if (p.hitT < 0.25 && !p.dead) sg.rect(0, 0, w, h).fill({ color: 0xe43c28, alpha: 0.22 * (1 - p.hitT / 0.25) });
    const st = this.input.stick;
    if (st.id !== null) {
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

  private lastHud = { hp: -1, pl: -2, obj: '', air: '', pips: '', state: '', rl: '', mis: '', mr: '', kit: '', kr: '' };
  private updateHud(dtRaw: number) {
    const p = this.player, H = this.hud, L = this.lastHud;
    p.view.setGear({ plate: this.plate > 0, cageAT: this.cageAT > 0, cageUAV: this.cageUAV > 0 }); // voxel vehicle shows its add-ons
    const hp = Math.round((Math.max(0, p.hp) / p.spec.hp) * 100);
    if (hp !== L.hp) { L.hp = hp; H.hp.style.width = hp + '%'; H.hp.classList.toggle('low', hp < 35); }
    const pl = this.lo.plate > 0 ? Math.round((this.plate / this.lo.plate) * 100) : -1;
    if (pl !== L.pl) { L.pl = pl; (H.plate.parentElement as HTMLElement).hidden = pl < 0; H.plate.style.width = Math.max(0, pl) + '%'; }
    if (this.toastT > 0 && (this.toastT -= dtRaw) <= 0) H.toast.hidden = true;
    const air = `${Math.floor(this.support)}|${this.support >= SUPPORT_KILLS}`;
    if (air !== L.air) {
      L.air = air; this.airBtn.style.setProperty('--rl', String(Math.min(1, this.support / SUPPORT_KILLS)));
      this.airBtn.dataset.ready = String(this.support >= SUPPORT_KILLS);
    }
    const [oc, oh0] = this.missionHud(), all = this.level.mission;
    const oh = all.kind === 'stages' ? `<b class="stg">${this.stage + 1}/${all.stages.length}</b><span class="sep"></span>${oh0}` : oh0, obj = oc + oh;
    if (obj !== L.obj) { L.obj = obj; H.obj.className = oc; H.obj.innerHTML = oh; }
    if (this.tipsT > 0 && (this.tipsT -= dtRaw) <= 0) this.hudEl.classList.remove('tips');
    const state = !(p.lock || this.pointTarget) ? 'idle' : this.aligned(p) && p.spread < p.spec.weapon.spread + 0.012 ? 'ready' : 'turning';
    if (state !== L.state) { L.state = state; H.fire.dataset.state = state; }
    const full = p.spec.weapon.reload + p.spec.weapon.burst * p.spec.weapon.burstGap;
    const rl = String(Math.round(clamp(1 - p.reload / full, 0, 1) * 20) / 20);
    if (rl !== L.rl) { L.rl = rl; H.fire.style.setProperty('--rl', rl); }
    const misTxt = String(this.misLoaded + this.misAmmo);
    const kitTxt = `${this.kits}|${p.hp < p.spec.hp}|${this.repairT >= 0}`;
    if (kitTxt !== L.kit) {
      L.kit = kitTxt; H.repKits.textContent = String(this.kits);
      H.rep.dataset.ready = String(this.kits > 0 && p.hp < p.spec.hp); H.rep.dataset.busy = String(this.repairT >= 0);
    }
    const kr = this.repairT >= 0 ? String(Math.round((this.repairT / REPAIR.kitTime) * 20) / 20) : '1';
    if (kr !== L.kr) { L.kr = kr; H.rep.style.setProperty('--rl', kr); }
    if (misTxt !== L.mis) { L.mis = misTxt; H.misAmmo.textContent = misTxt; }
    const pips = `${this.misLoaded}/${this.lo.rack}`;
    if (pips !== L.pips) {
      L.pips = pips; H.mis.dataset.ready = String(this.misLoaded > 0);
      (document.getElementById('misPips') as HTMLElement).innerHTML = '<s></s>'.repeat(this.misLoaded) + '<s class="e"></s>'.repeat(Math.max(0, this.lo.rack - this.misLoaded));
    }
    const mr = this.misLoaded >= this.lo.rack || this.misAmmo <= 0 ? (this.misLoaded > 0 ? '1' : '0') : String(Math.round(clamp(1 - this.misReload / this.lo.misReload, 0, 1) * 20) / 20);
    if (mr !== L.mr) { L.mr = mr; H.mis.style.setProperty('--rl', mr); }
    this.fpsT += dtRaw; this.fpsN++;
    H.fps.hidden = !settings.fps && !settings.touchDebug;
    if (settings.touchDebug) {
      const st = this.input.stick;
      const txt = `ngón: ${this.input.fingers} · joystick: ${st.id !== null ? '#' + st.id : 'trống'} · ${this.input.log.join(' | ') || 'chưa có chạm'}`;
      if (H.fps.textContent !== txt) H.fps.textContent = txt;
      return;
    }
    if (this.fpsT > 0.5) { H.fps.textContent = `${Math.round(this.fpsN / this.fpsT)} fps · ${this.particles.alive} hạt · ×${this.res().toFixed(2)}`; this.fpsT = 0; this.fpsN = 0; }
  }

  private checkEnd(dt: number) {
    if (this.ended) return;
    const [won, lost] = this.missionOutcome();
    if (!won && !lost) return;
    this.endT += dt;
    if (this.endT < 1.6) return;
    this.ended = true;
    sfx.play(won ? 'mission_win' : 'mission_lose', undefined, undefined, { prio: true });
    this.stats.time = this.time; this.stats.alliesLost = this.allies.filter((a) => a.dead).length;
    this.onEnd({ won, playerDead: this.player.dead, level: this.levelN, time: this.time, kills: this.enemies.filter((e) => e.dead).length, total: this.enemies.length, collected: [...this.collected], stats: this.stats });
  }

  destroy() {
    this.input.destroy();
    sfx.stopLoops();
    this.offAir(); this.airBtn.hidden = true; this.streakEl.hidden = true; this.hudEl.classList.remove('tips');
    this.root.destroy({ children: true });
    this.view.ground.destroy(true);
  }
}
