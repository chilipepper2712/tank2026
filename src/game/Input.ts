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
  gpAim: [number, number] | null = null;
  gpFire = false;
  fireHeld = false;
  private skillQueued = false;
  private gpSkillPrev = false;
  private off: (() => void)[] = [];

  constructor(private canvas: HTMLCanvasElement, private fireBtn: HTMLButtonElement, private skillBtn: HTMLButtonElement, private hooks: InputHooks) {
    const on = <K extends keyof HTMLElementEventMap>(el: HTMLElement | Window, ev: K, fn: (e: HTMLElementEventMap[K]) => void, opts?: AddEventListenerOptions) => {
      el.addEventListener(ev, fn as EventListener, opts);
      this.off.push(() => el.removeEventListener(ev, fn as EventListener, opts));
    };
    on(canvas, 'pointerdown', (e) => this.down(e));
    on(canvas, 'pointermove', (e) => this.moveEv(e));
    on(canvas, 'pointerup', (e) => this.up(e));
    on(canvas, 'pointercancel', (e) => this.up(e));
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
    on(window, 'keydown', (e) => {
      const k = e.key.toLowerCase();
      this.keys.add(k);
      if (k === 'e' && !e.repeat) this.skillQueued = true;
      if (k === ' ' || k.startsWith('arrow')) e.preventDefault();
      hooks.firstInput();
    });
    on(window, 'keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    on(window, 'blur', () => { this.keys.clear(); this.mouse.down = false; this.fireHeld = false; });
    this.fireBtn.hidden = false;
    this.skillBtn.hidden = false;
  }

  inStickZone(x: number, y: number) { return x < innerWidth * 0.45 && y > innerHeight * 0.38; }

  private down(e: PointerEvent) {
    this.hooks.firstInput();
    if (e.pointerType === 'mouse') { Object.assign(this.mouse, { active: true, down: true, x: e.clientX, y: e.clientY }); return; }
    this.mouse.active = false;
    try { this.canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    if (this.hooks.tapUnit(e.clientX, e.clientY)) return;
    if (this.inStickZone(e.clientX, e.clientY) && this.stick.id < 0) {
      Object.assign(this.stick, { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now(), moved: 0 });
    } else this.hooks.tapPoint(e.clientX, e.clientY);
  }
  private moveEv(e: PointerEvent) {
    if (e.pointerType === 'mouse') { Object.assign(this.mouse, { active: true, x: e.clientX, y: e.clientY }); return; }
    const s = this.stick;
    if (e.pointerId === s.id) { s.x = e.clientX; s.y = e.clientY; s.moved = Math.max(s.moved, Math.hypot(s.x - s.ox, s.y - s.oy)); }
  }
  private up(e: PointerEvent) {
    if (e.pointerType === 'mouse') { this.mouse.down = false; return; }
    const s = this.stick;
    if (e.pointerId === s.id) {
      if (performance.now() - s.t0 < 220 && s.moved < 12) this.hooks.tapPoint(s.ox, s.oy);
      s.id = -1;
    }
  }

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
        break;
      }
    } catch { /* gamepad API blocked */ }
    const l = Math.hypot(mx, my);
    this.move = l > 1 ? { x: mx / l, y: my / l } : { x: clamp(mx, -1, 1), y: clamp(my, -1, 1) };
  }

  takeSkill() { const s = this.skillQueued; this.skillQueued = false; return s; }
  get instantFire() { return (this.mouse.active && this.mouse.down) || this.keys.has(' ') || this.gpFire; }

  destroy() { this.off.forEach((f) => f()); this.fireHeld = false; }
}
