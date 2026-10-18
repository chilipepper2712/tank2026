import { clamp } from '../util';

export const STICK_R = 52;

export interface InputHooks {
  /** tapped near an enemy on screen → lock it; returns true if something was locked */
  tapUnit(sx: number, sy: number): boolean;
  /** tapped the ground or a building → aim at that world point */
  tapPoint(sx: number, sy: number): void;
  onFirePress(): void;
  firstInput(): void;
}

/**
 * Touch: lower-left zone spawns the drive stick; a quick tap there (or a tap anywhere else)
 * selects a target. Fire and skill are fixed DOM buttons. Also mouse/keyboard and gamepad.
 */
export class Input {
  readonly coarse = matchMedia('(pointer: coarse)').matches;
  readonly keys = new Set<string>();
  readonly mouse = { x: 0, y: 0, down: false, active: false };
  readonly stick = { id: -1, ox: 0, oy: 0, x: 0, y: 0, t0: 0, moved: 0 };
  move = { x: 0, y: 0 };
  fingers = 0;
  gpAim: [number, number] | null = null;
  gpFire = false;
  fireHeld = false;
  private skillQueued = false;
  private missileQueued = false;
  private repairQueued = false;
  private gpRepPrev = false;
  private gpMisPrev = false;
  private gpSkillPrev = false;
  private off: (() => void)[] = [];

  constructor(canvas: HTMLCanvasElement, private fireBtn: HTMLButtonElement, private skillBtn: HTMLButtonElement, private misBtn: HTMLButtonElement, private repBtn: HTMLButtonElement, private hooks: InputHooks) {
    const on = <K extends keyof HTMLElementEventMap>(el: HTMLElement | Window, ev: K, fn: (e: HTMLElementEventMap[K]) => void, opts?: AddEventListenerOptions) => {
      el.addEventListener(ev, fn as EventListener, opts);
      this.off.push(() => el.removeEventListener(ev, fn as EventListener, opts));
    };
    // Mouse uses pointer events; fingers use touch events, which iOS Safari handles far more
    // reliably than pointer capture. Touch-generated pointer events are ignored.
    on(canvas, 'pointerdown', (e) => this.down(e));
    on(canvas, 'pointermove', (e) => this.moveEv(e));
    on(window, 'pointerup', (e) => this.up(e));
    const tOpts = { passive: false };
    on(canvas, 'touchstart', (e) => { e.preventDefault(); this.fingers = e.touches.length; for (const t of Array.from(e.changedTouches)) this.touchDown(t.identifier, t.clientX, t.clientY); }, tOpts);
    on(canvas, 'touchmove', (e) => { e.preventDefault(); for (const t of Array.from(e.changedTouches)) this.touchMove(t.identifier, t.clientX, t.clientY); }, tOpts);
    on(window, 'touchend', (e) => { this.fingers = e.touches.length; for (const t of Array.from(e.changedTouches)) this.touchUp(t.identifier); if (e.touches.length === 0) this.releaseAll(); });
    on(window, 'touchcancel', (e) => { this.fingers = e.touches.length; for (const t of Array.from(e.changedTouches)) this.touchUp(t.identifier); if (e.touches.length === 0) this.releaseAll(); });
    on(window, 'blur', () => this.releaseAll());
    on(canvas, 'contextmenu', (e) => e.preventDefault());
    on(fireBtn, 'pointerdown', (e) => {
      e.preventDefault();
      try { fireBtn.setPointerCapture(e.pointerId); } catch { /* not all browsers allow capture here */ }
      this.fireHeld = true; fireBtn.classList.add('held'); hooks.firstInput(); hooks.onFirePress();
    });
    const rel = () => { this.fireHeld = false; fireBtn.classList.remove('held'); };
    on(fireBtn, 'pointerup', rel); on(fireBtn, 'pointercancel', rel);
    on(fireBtn, 'contextmenu', (e) => e.preventDefault());
    on(skillBtn, 'pointerdown', (e) => { e.preventDefault(); this.skillQueued = true; hooks.firstInput(); });
    on(misBtn, 'pointerdown', (e) => { e.preventDefault(); this.missileQueued = true; hooks.firstInput(); });
    on(misBtn, 'contextmenu', (e) => e.preventDefault());
    on(repBtn, 'pointerdown', (e) => { e.preventDefault(); this.repairQueued = true; hooks.firstInput(); });
    on(repBtn, 'contextmenu', (e) => e.preventDefault());
    on(window, 'keydown', (e) => {
      const k = e.key.toLowerCase();
      this.keys.add(k);
      if (k === 'e' && !e.repeat) this.skillQueued = true;
      if (k === 'q' && !e.repeat) this.missileQueued = true;
      if (k === 'r' && !e.repeat) this.repairQueued = true;
      if (k === ' ' || k.startsWith('arrow')) e.preventDefault();
      hooks.firstInput();
    });
    on(window, 'keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    on(window, 'blur', () => { this.keys.clear(); this.mouse.down = false; this.fireHeld = false; });
    this.fireBtn.hidden = false;
    this.skillBtn.hidden = false;
    this.misBtn.hidden = false;
    this.repBtn.hidden = false;
  }

  inStickZone(x: number, y: number) { return x < innerWidth * 0.45 && y > innerHeight * 0.38; }

  /** Last few input events, shown on screen when touch diagnostics are on. */
  readonly log: string[] = [];
  private note(msg: string) { this.log.push(msg); if (this.log.length > 5) this.log.shift(); }

  private down(e: PointerEvent) {
    if (e.pointerType !== 'mouse') return;
    this.hooks.firstInput();
    Object.assign(this.mouse, { active: true, down: true, x: e.clientX, y: e.clientY });
  }
  private moveEv(e: PointerEvent) {
    if (e.pointerType === 'mouse') Object.assign(this.mouse, { active: true, x: e.clientX, y: e.clientY });
  }
  private up(e: PointerEvent) {
    if (e.pointerType === 'mouse') this.mouse.down = false;
  }

  private touchDown(id: number, x: number, y: number) {
    this.hooks.firstInput();
    this.mouse.active = false;
    // the drive zone always starts the stick (an enemy drawn under the thumb must not steal it);
    // a quick tap there still locks or aims on release
    if (this.inStickZone(x, y) && this.stick.id < 0) {
      Object.assign(this.stick, { id, ox: x, oy: y, x, y, t0: performance.now(), moved: 0 });
      this.note(`chạm #${id}: joystick`);
    } else if (this.hooks.tapUnit(x, y)) { this.note(`chạm #${id}: khóa địch`); }
    else { this.hooks.tapPoint(x, y); this.note(`chạm #${id}: nhắm điểm${this.stick.id >= 0 ? ' (joystick đang giữ #' + this.stick.id + ')' : ''}`); }
  }
  private touchMove(id: number, x: number, y: number) {
    const s = this.stick;
    if (id !== s.id) return;
    s.x = x; s.y = y; s.moved = Math.max(s.moved, Math.hypot(x - s.ox, y - s.oy));
  }
  private touchUp(id: number) {
    const s = this.stick;
    if (id !== s.id) return;
    if (performance.now() - s.t0 < 220 && s.moved < 12 && !this.hooks.tapUnit(s.ox, s.oy)) this.hooks.tapPoint(s.ox, s.oy);
    s.id = -1;
    this.note(`nhả #${id}`);
  }

  releaseAll() { this.stick.id = -1; this.fireHeld = false; this.fireBtn.classList.remove('held'); }

  stickVec(): [number, number] {
    const s = this.stick;
    let dx = (s.x - s.ox) / STICK_R, dy = (s.y - s.oy) / STICK_R;
    const l = Math.hypot(dx, dy);
    if (l > 1) { dx /= l; dy /= l; }
    return [dx, dy];
  }

  /** Read keyboard, stick and gamepad into `move`, `gpAim`, `gpFire`. */
  poll() {
    let mx = 0, my = 0;
    const k = this.keys;
    if (k.has('a') || k.has('arrowleft')) mx--;
    if (k.has('d') || k.has('arrowright')) mx++;
    if (k.has('w') || k.has('arrowup')) my--;
    if (k.has('s') || k.has('arrowdown')) my++;
    if (this.stick.id >= 0) [mx, my] = this.stickVec();
    this.gpAim = null; this.gpFire = false;
    try {
      for (const g of navigator.getGamepads ? navigator.getGamepads() : []) {
        if (!g) continue;
        const a = g.axes;
        if (Math.hypot(a[0], a[1]) > 0.2) { mx = a[0]; my = a[1]; }
        if (a.length > 3 && Math.hypot(a[2], a[3]) > 0.3) this.gpAim = [a[2], a[3]];
        this.gpFire = !!(g.buttons[7]?.pressed || g.buttons[5]?.pressed);
        const sk = !!(g.buttons[0]?.pressed || g.buttons[4]?.pressed);
        if (sk && !this.gpSkillPrev) this.skillQueued = true;
        this.gpSkillPrev = sk;
        const ms = !!(g.buttons[1]?.pressed || g.buttons[6]?.pressed);
        if (ms && !this.gpMisPrev) this.missileQueued = true;
        this.gpMisPrev = ms;
        const rp = !!g.buttons[3]?.pressed;
        if (rp && !this.gpRepPrev) this.repairQueued = true;
        this.gpRepPrev = rp;
        break;
      }
    } catch { /* gamepad API blocked */ }
    const l = Math.hypot(mx, my);
    this.move = l > 1 ? { x: mx / l, y: my / l } : { x: clamp(mx, -1, 1), y: clamp(my, -1, 1) };
  }

  takeRepair() { const s = this.repairQueued; this.repairQueued = false; return s; }
  takeMissile() { const s = this.missileQueued; this.missileQueued = false; return s; }
  takeSkill() { const s = this.skillQueued; this.skillQueued = false; return s; }
  get instantFire() { return (this.mouse.active && this.mouse.down) || this.keys.has(' ') || this.gpFire; }

  destroy() { this.off.forEach((f) => f()); this.fireHeld = false; }
}
