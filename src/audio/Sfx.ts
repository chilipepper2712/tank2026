import { settings } from '../settings';
import { BORROW, SYNTH } from './synth';

/*
 * Sound effects from files in public/audio (see docs/GDD.md, "Âm thanh"). Every sound is looked up by
 * name; variants are `name_1`, `name_2`, … and one is picked at random. A sound with no file is simply
 * silent, so files can be added one by one. The plain ones are made in code (synth.ts) until a file
 * replaces them, and a few borrow a close sound (BORROW) meanwhile. Positional sounds fade, dull and pan with the distance and
 * side relative to the player's vehicle. Web Audio only starts after a tap/key (browser rule), which
 * `unlock` takes from the first interaction anywhere on the page.
 */

interface Def {
  /** base loudness 0–1 */
  gain: number;
  /** most copies playing at once */
  max: number;
  /** minimum seconds between two starts */
  gap: number;
  /** random pitch spread (± fraction) */
  pitch?: number;
  /** positional: fades, dulls and pans by distance from the listener */
  spatial?: boolean;
}
const D = (gain: number, max: number, gap: number, pitch = 0, spatial = false): Def => ({ gain, max, gap, pitch, spatial });

/** one-shot sounds: every name the game can ask for, with its mix settings */
export const SOUNDS: Record<string, Def> = {
  // player's vehicle
  cannon: D(1, 3, 0.05, 0.05),
  mg_burst: D(0.5, 2, 0.28, 0.04, true),
  autocannon_burst: D(0.8, 2, 0.28, 0.04, true),
  missile_launch: D(0.9, 2, 0.2, 0.03),
  reload_ready: D(0.6, 1, 0.2),
  repair_start: D(0.7, 1, 0.5),
  repair_done: D(0.7, 1, 0.5),
  pickup: D(0.7, 2, 0.1),
  // impacts and explosions
  hit_armor: D(0.8, 3, 0.07, 0.06, true),
  hit_ricochet: D(0.8, 2, 0.1, 0.06, true),
  explode_small: D(0.7, 4, 0.06, 0.08, true),
  explode_vehicle: D(1, 3, 0.12, 0.05, true),
  building_collapse: D(0.9, 2, 0.4, 0.04, true),
  explode_mine: D(1, 2, 0.2, 0.04, true),
  // driving through things: a wall or mud house giving way, a tree snapping, a car flattened
  crush_wall: D(0.8, 2, 0.35, 0.08, true),
  crush_tree: D(0.7, 2, 0.3, 0.1, true),
  crush_car: D(0.8, 1, 0.5, 0.06, true),
  // enemies
  enemy_cannon: D(0.8, 3, 0.1, 0.06, true),
  enemy_cannon_destroyer: D(0.9, 2, 0.15, 0.04, true),
  enemy_rpg: D(0.8, 2, 0.15, 0.04, true),
  kamikaze_whine: D(0.9, 3, 0.3, 0.03, true),
  kamikaze_rush: D(1.25, 3, 0.2, 0.04, true), // meant to startle: loud on purpose
  // air support
  strike_warning: D(0.8, 1, 1),
  jet_flyby: D(0.9, 2, 0.5, 0, true),
  gau8_burst: D(0.9, 1, 0.5, 0, true),
  bomb_whistle: D(0.8, 1, 0.5, 0, true),
  // interface
  ui_click: D(0.6, 2, 0.05),
  ui_alert: D(0.7, 1, 0.8),
  streak_double: D(0.9, 1, 0.5),
  streak_ace: D(0.9, 1, 0.5),
  streak_legend: D(0.9, 1, 0.5),
  mission_win: D(0.9, 1, 1),
  mission_lose: D(0.9, 1, 1),
  stage_clear: D(0.8, 1, 1),
  // the vehicle's assistant AI speaking (vo_*): one line at a time, see `say`
  vo_missile_ready: D(1, 1, 0), vo_repair_done: D(1, 1, 0), vo_airstrike_ready: D(1, 1, 0), vo_drone: D(1, 1, 0),
  vo_armor_low: D(1, 1, 0), vo_stage_clear: D(1, 1, 0), vo_reinforce: D(1, 1, 0), vo_win: D(1, 1, 0), vo_lose: D(1, 1, 0),
  // weather (rain_loop is a loop)
  thunder: D(1, 2, 2),
  // night
  flare_launch: D(0.7, 1, 0.3, 0.04, true),
};

/** looping sounds (WAV so the loop point is seamless); their level is driven by the game each frame */
export const LOOPS: Record<string, number> = { engine_idle: 0.4, engine_move: 0.45, drone_loop: 0.5, rain_loop: 0.3 };

const RANGE = 900; // beyond this a positional sound is inaudible
const MAX_VOICES = 24;
const ext = /\.(mp3|wav|m4a|ogg)$/i;

interface Clip { buf: AudioBuffer; off: number }
interface Loop { gain: GainNode; pan: StereoPannerNode | null; src: AudioBufferSourceNode }

class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bank = new Map<string, Clip[]>();
  /** where each sound in the bank came from */
  private made = new Set<string>();
  private loops = new Map<string, Loop>();
  private lastAt = new Map<string, number>();
  private live = new Map<string, number>();
  private voices = 0;
  private lx = 0; private ly = 0;
  private level = new Map<string, number>(); // wanted loop levels
  private pans = new Map<string, number>();
  private moveSm = 0;
  ready = false;
  /** names that were asked for but have no file (for the test page and debugging) */
  readonly missing = new Set<string>();
  /** recent plays, for automated checks */
  readonly log: string[] = [];
  played = 0;

  /** create the audio context, start loading and wire the unlock on the first interaction */
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.applySettings();
    const unlock = () => {
      const c = this.ctx!;
      if (c.state !== 'running') c.resume().catch(() => { /* needs a real gesture */ });
      // a silent blip wakes iOS's audio session
      const b = c.createBuffer(1, 1, 22050), s = c.createBufferSource();
      s.buffer = b; s.connect(c.destination); s.start(0);
    };
    for (const ev of ['pointerdown', 'touchend', 'keydown', 'click'] as const) addEventListener(ev, unlock, { capture: true });
    document.addEventListener('visibilitychange', () => {
      const c = this.ctx!;
      if (document.hidden) c.suspend().catch(() => { /* ignore */ });
      else c.resume().catch(() => { /* ignore */ });
    });
    void this.load();
  }

  private async load() {
    const base = import.meta.env.BASE_URL + 'audio/';
    let files: string[] = [];
    try { files = await (await fetch(base + 'manifest.json')).json(); } catch { return; }
    await Promise.all(files.filter((f) => ext.test(f)).map(async (f) => {
      try {
        const data = await (await fetch(base + f)).arrayBuffer();
        const buf = await this.ctx!.decodeAudioData(data);
        const name = f.replace(ext, '').replace(/_\d+$/, '');
        const clips = this.bank.get(name) ?? [];
        // one-shots: skip the leading silence a video editor leaves, so the sound starts on the frame; loops are used whole
        clips.push({ buf, off: name in LOOPS ? 0 : leadSilence(buf) });
        this.bank.set(name, clips);
      } catch { /* a file the browser cannot decode: ignore it */ }
    }));
    // the plain sounds without a file: make them
    const c = this.ctx!;
    for (const [name, make] of Object.entries(SYNTH)) {
      if (this.bank.has(name)) continue;
      await new Promise((r) => setTimeout(r)); // one at a time, so the page never stalls
      this.bank.set(name, make(c.sampleRate).map((d) => {
        const buf = c.createBuffer(1, d.length, c.sampleRate);
        buf.getChannelData(0).set(d);
        return { buf, off: 0 };
      }));
      this.made.add(name);
    }
    this.ready = true;
  }

  /** sounds the page has files for */
  has(name: string) { return this.bank.has(name); }
  /** 'file', 'made' (in code), 'borrowed' (another sound's file) or null (silent) */
  source(name: string) { return this.made.has(name) ? 'made' : this.bank.has(name) ? 'file' : BORROW[name] && this.bank.has(BORROW[name]) ? 'borrowed' : null; }
  count(name: string) { return this.bank.get(name)?.length ?? 0; }
  get state() { return this.ctx?.state ?? 'none'; }

  applySettings() {
    if (this.master) this.master.gain.value = settings.mute ? 0 : settings.volume;
  }

  /** where the listener (the player's vehicle) is, for positional sounds */
  listen(x: number, y: number) { this.lx = x; this.ly = y; }

  /**
   * Play a one-shot. With x, y it is positional (when the sound is defined as such).
   * `prio` sounds (things happening to the player) ignore the voice limits; `delay` is in seconds.
   */
  play(name: string, x?: number, y?: number, o: { gain?: number; delay?: number; prio?: boolean } = {}) {
    const c = this.ctx, def = SOUNDS[name];
    if (!c || !this.master || !def || c.state !== 'running' || settings.mute) return;
    const clips = this.bank.get(name) ?? this.bank.get(BORROW[name]);
    if (!clips) { this.missing.add(name); return; }
    const now = c.currentTime;
    if (!o.prio && now - (this.lastAt.get(name) ?? -9) < def.gap) return;
    if (!o.prio && ((this.live.get(name) ?? 0) >= def.max || this.voices >= MAX_VOICES)) return;
    let vol = def.gain * (o.gain ?? 1), pan = 0, cutoff = 0;
    if (def.spatial && x !== undefined && y !== undefined) {
      const dx = x - this.lx, dy = y - this.ly, d = Math.hypot(dx, dy);
      if (d > RANGE) return;
      const f = 1 - d / RANGE;
      vol *= Math.pow(f, 1.4);
      if (vol < 0.02) return;
      pan = Math.max(-1, Math.min(1, dx / 450)) * 0.8;
      cutoff = 1500 + 12000 * f * f; // far explosions lose their top end
    }
    const clip = clips[(Math.random() * clips.length) | 0];
    const src = c.createBufferSource(), g = c.createGain();
    src.buffer = clip.buf;
    if (def.pitch) src.playbackRate.value = 1 + (Math.random() * 2 - 1) * def.pitch;
    g.gain.value = vol;
    let tail: AudioNode = src;
    tail.connect(g); tail = g;
    if (cutoff) { const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cutoff; tail.connect(lp); tail = lp; }
    if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; tail.connect(p); tail = p; }
    tail.connect(this.master);
    this.voices++; this.live.set(name, (this.live.get(name) ?? 0) + 1);
    this.lastAt.set(name, now);
    src.onended = () => { this.voices--; this.live.set(name, (this.live.get(name) ?? 1) - 1); };
    src.start(now + (o.delay ?? 0), clip.off);
    this.played++;
    this.log.push(name); if (this.log.length > 60) this.log.shift();
  }

  // ---------- the assistant's voice ----------
  private voiceFree = 0; // context time the current line ends
  private voiceNext = '';
  /**
   * A line from the vehicle's assistant AI (a vo_* or streak_* sound). Lines never talk over each other: one that
   * comes while another is speaking waits for it, unless it would wait more than 2.5 s or is already
   * waiting. Without a file for the line, `instead` plays (the old cue), so nothing goes quiet.
   */
  say(name: string, instead?: string, delay = 0) {
    const c = this.ctx, clips = this.bank.get(name);
    if (!clips || !c || c.state !== 'running') { if (instead) this.play(instead, undefined, undefined, { prio: true, delay }); return; }
    const now = c.currentTime, start = Math.max(now + delay, this.voiceFree + 0.15);
    if (start - now - delay > 2.5 || this.voiceNext === name) return;
    const clip = clips[(Math.random() * clips.length) | 0];
    this.voiceFree = start + clip.buf.duration - clip.off;
    if (start > now + delay + 0.01) { this.voiceNext = name; setTimeout(() => { if (this.voiceNext === name) this.voiceNext = ''; }, (start - now) * 1000); }
    this.play(name, undefined, undefined, { prio: true, delay: start - now });
  }

  // ---------- loops ----------
  private loop(name: string): Loop | null {
    const c = this.ctx;
    let l = this.loops.get(name);
    if (l) return l;
    const clips = this.bank.get(name);
    if (!c || !this.master || !clips || c.state !== 'running') return null;
    const src = c.createBufferSource(), gain = c.createGain();
    src.buffer = clips[0].buf; src.loop = true; gain.gain.value = 0;
    src.connect(gain);
    let pan: StereoPannerNode | null = null;
    if (c.createStereoPanner) { pan = c.createStereoPanner(); gain.connect(pan); pan.connect(this.master); } else gain.connect(this.master);
    src.start();
    l = { gain, pan, src };
    this.loops.set(name, l);
    return l;
  }
  private setLoop(name: string, level: number, pan = 0) {
    // only touch the audio param when the target really moved (every call adds an event to its timeline)
    const prev = this.level.get(name) ?? -1;
    if ((level === 0 ? prev === 0 : Math.abs(prev - level) < 0.01) && Math.abs((this.pans.get(name) ?? 0) - pan) < 0.02) return;
    const l = this.loop(name);
    if (!l || !this.ctx) return;
    this.pans.set(name, pan);
    l.gain.gain.setTargetAtTime(level * (LOOPS[name] ?? 0.5), this.ctx.currentTime, 0.08);
    if (l.pan) l.pan.pan.setTargetAtTime(pan, this.ctx.currentTime, 0.1);
    this.level.set(name, level);
  }

  /** engine rumble: `move` 0–1 is how fast the vehicle goes; negative = engine off (dead) */
  engine(move: number, dt: number) {
    if (move < 0) { this.setLoop('engine_idle', 0); this.setLoop('engine_move', 0); return; }
    this.moveSm += (Math.min(1, move) - this.moveSm) * Math.min(1, dt * 6);
    this.setLoop('engine_idle', 1 - this.moveSm);
    this.setLoop('engine_move', this.moveSm);
  }
  /** drone buzz: `near` 0–1 (1 = on top of us), `pan` −1…1 */
  drone(near: number, pan: number) { this.setLoop('drone_loop', near * near, pan * 0.8); }
  /** rain on the hull */
  rain(level: number) { this.setLoop('rain_loop', level); }
  /** all loops to silence (pause, end of mission) */
  hush() { for (const n of this.loops.keys()) this.setLoop(n, 0); }
  stopLoops() {
    for (const l of this.loops.values()) { try { l.src.stop(); } catch { /* already stopped */ } l.gain.disconnect(); }
    this.loops.clear(); this.moveSm = 0;
  }
}

/** seconds of near-silence at the start of a clip (kept to 5 ms before the first audible sample) */
function leadSilence(buf: AudioBuffer): number {
  const d = buf.getChannelData(0), thr = 0.012, lim = Math.min(d.length, buf.sampleRate); // look at the first second only
  for (let i = 0; i < lim; i++) if (Math.abs(d[i]) > thr) return Math.max(0, i / buf.sampleRate - 0.005);
  return 0;
}

export const sfx = new Sfx();
