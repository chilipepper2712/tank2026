/*
 * Sounds made in code instead of from files: the plain ones (interface beeps, chimes, rain, thunder,
 * a whistle, a whoosh) that a recording adds little to and that would only add download weight.
 * Each maker returns one or more takes as raw samples at the audio context's rate. A file in
 * public/audio with the same name always wins over the made one.
 */

type Maker = (sr: number) => Float32Array[];

const TAU = Math.PI * 2;
let seed = 1;
/** repeatable noise, so a sound is the same on every load */
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const noise = () => rnd() * 2 - 1;

/** a buffer of `sec` seconds filled by f(t, i) */
function render(sr: number, sec: number, f: (t: number, i: number) => number) {
  const n = Math.ceil(sr * sec), out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = f(i / sr, i);
  return out;
}

/** one-pole low-pass, in place; cutoff may change over time */
function lowpass(x: Float32Array, sr: number, hz: number | ((t: number) => number)) {
  let y = 0;
  for (let i = 0; i < x.length; i++) {
    const fc = typeof hz === 'number' ? hz : hz(i / sr), a = 1 - Math.exp(-TAU * fc / sr);
    y += a * (x[i] - y); x[i] = y;
  }
  return x;
}
function highpass(x: Float32Array, sr: number, hz: number) {
  const a = Math.exp(-TAU * hz / sr);
  let px = 0, y = 0;
  for (let i = 0; i < x.length; i++) { y = a * (y + x[i] - px); px = x[i]; x[i] = y; }
  return x;
}
/** state-variable band-pass, in place */
function bandpass(x: Float32Array, sr: number, hz: number | ((t: number) => number), q = 2) {
  let lo = 0, bp = 0;
  for (let i = 0; i < x.length; i++) {
    const fc = typeof hz === 'number' ? hz : hz(i / sr), f = 2 * Math.sin(Math.PI * Math.min(fc, sr / 6) / sr);
    const hi = x[i] - lo - bp / q; bp += f * hi; lo += f * bp; x[i] = bp;
  }
  return x;
}
/** scale so the loudest sample sits at `peak` */
function norm(x: Float32Array, peak = 0.9) {
  let m = 0; for (const v of x) m = Math.max(m, Math.abs(v));
  if (m > 0) for (let i = 0; i < x.length; i++) x[i] *= peak / m;
  return x;
}
/** fold the last `sec` seconds over the start, so the buffer loops without a seam */
function loopable(x: Float32Array, sr: number, sec: number) {
  const f = Math.floor(sr * sec), n = x.length - f, out = x.slice(0, n);
  for (let k = 0; k < f; k++) { const t = k / f; out[k] = x[k] * Math.sin(t * Math.PI / 2) + x[n + k] * Math.cos(t * Math.PI / 2); }
  return out;
}

/** a soft bell: a sine with an inharmonic overtone, struck and ringing out */
const bell = (t: number, hz: number, decay: number) => t < 0 ? 0 : Math.exp(-t / decay) * Math.min(1, t * 400) * (Math.sin(TAU * hz * t) + 0.35 * Math.sin(TAU * hz * 2.76 * t) * Math.exp(-t / (decay * 0.4)));
/** a short beep with a click-free edge */
const beep = (t: number, hz: number, len: number) => t < 0 || t > len ? 0 : Math.min(1, t * 300, (len - t) * 300) * (Math.sin(TAU * hz * t) + 0.25 * Math.sin(TAU * hz * 3 * t));
/** a brassy note: a few harmonics, a swell in and a fall out */
const horn = (t: number, hz: number, len: number) => {
  if (t < 0 || t > len + 0.5) return 0;
  const env = Math.min(1, t / 0.04) * (t > len ? Math.exp(-(t - len) / 0.08) : 1) * (0.85 + 0.15 * Math.exp(-t / 0.1));
  let s = 0; for (let h = 1; h <= 6; h++) s += Math.sin(TAU * hz * h * t * (1 + 0.002 * Math.sin(TAU * 5 * t))) / (h * h * 0.6 + 0.4);
  return env * s;
};

export const SYNTH: Record<string, Maker> = {
  // interface
  ui_click: (sr) => [norm(render(sr, 0.035, (t) => Math.exp(-t / 0.004) * Math.sin(TAU * 1900 * t) + 0.3 * Math.exp(-t / 0.002) * noise()), 0.5)],
  ui_alert: (sr) => [norm(render(sr, 0.32, (t) => beep(t, 1040, 0.09) + beep(t - 0.14, 780, 0.12)), 0.6)],
  pickup: (sr) => [norm(render(sr, 0.3, (t) => [660, 880, 1320].reduce((s, hz, k) => s + bell(t - k * 0.05, hz, 0.06 + k * 0.03), 0)), 0.6)],
  repair_done: (sr) => [norm(render(sr, 0.7, (t) => bell(t, 990, 0.18) + bell(t - 0.09, 1320, 0.3)), 0.6)],
  stage_clear: (sr) => [norm(render(sr, 1.3, (t) => [523, 659, 784, 1047].reduce((s, hz, k) => s + bell(t - k * 0.08, hz, k === 3 ? 0.45 : 0.2), 0)), 0.65)],
  mission_win: (sr) => [norm(render(sr, 1.9, (t) => horn(t, 392, 0.14) + horn(t - 0.16, 523, 0.14) + horn(t - 0.32, 659, 0.14) + 1.2 * horn(t - 0.48, 784, 1.1)), 0.7)],
  mission_lose: (sr) => [norm(lowpass(render(sr, 2.2, (t) => horn(t, 330, 0.4) + horn(t - 0.45, 311, 0.4) + 1.1 * horn(t - 0.9, 262, 1.0)), sr, 1400), 0.65)],
  // air support: a radio warning and the bombs falling
  strike_warning: (sr) => {
    const x = render(sr, 0.75, (t) => [0, 0.22, 0.44].reduce((s, at) => s + beep(t - at, 1000, 0.13), 0) + 0.06 * noise());
    return [norm(bandpass(x, sr, 1100, 0.8), 0.6)];
  },
  bomb_whistle: (sr) => {
    const len = 1.8;
    let ph = 0;
    return [norm(render(sr, len, (t) => {
      const hz = 2100 * Math.pow(450 / 2100, t / len) * (1 + 0.004 * Math.sin(TAU * 7 * t));
      ph += TAU * hz / sr;
      return Math.min(1, t / 0.25) * Math.min(1, (len - t) / 0.03) * (0.4 + 0.6 * t / len) * (Math.sin(ph) + 0.02 * noise());
    }), 0.55)];
  },
  // night: the flare going up
  flare_launch: (sr) => {
    const pop = render(sr, 0.7, (t) => Math.exp(-t / 0.012) * noise());
    const hiss = bandpass(render(sr, 0.7, (t) => Math.min(1, t / 0.03) * Math.exp(-t / 0.3) * noise()), sr, (t) => 900 + 3500 * t, 1.2);
    lowpass(pop, sr, 2500); norm(hiss, 1); norm(pop, 0.5);
    return [norm(hiss.map((v, i) => v + pop[i]), 0.6)];
  },
  // weather
  thunder: (sr) => [0, 1].map((k) => {
    seed = 7 + k * 101;
    const len = 4.5, crackAt = 0.02 + k * 0.05;
    // a few rolling swells after the crack
    const swells = Array.from({ length: 5 }, (_, j) => ({ at: 0.25 + j * (0.5 + rnd() * 0.4), amp: 0.5 + rnd() * 0.5, w: 0.35 + rnd() * 0.4 }));
    let brown = 0, env = 0;
    const rumble = render(sr, len, (t, i) => {
      brown = (brown + 0.02 * noise()) * 0.998;
      // the envelope moves slowly: work it out every 64 samples
      if (!(i & 63)) env = Math.min(1, t / 0.1) * Math.exp(-t / 1.6) + swells.reduce((s, w) => s + w.amp * Math.exp(-(((t - w.at) / w.w) ** 2)), 0) * Math.exp(-t / 2.2);
      return brown * env;
    });
    lowpass(lowpass(rumble, sr, 180), sr, 260);
    const crack = lowpass(render(sr, len, (t) => t < crackAt ? 0 : Math.exp(-(t - crackAt) / 0.06) * noise()), sr, 2600);
    norm(rumble, 1); norm(crack, 0.45);
    return norm(rumble.map((v, i) => v + crack[i]), 0.95);
  }),
  rain_loop: (sr) => {
    seed = 3;
    const len = 4.4;
    // light rain: a soft, slowly breathing hiss under scattered fine drops on the hull
    const wash = highpass(lowpass(lowpass(render(sr, len, (t) => noise() * (0.8 + 0.2 * Math.sin(TAU * t / len * 3))), sr, 2400), sr, 2400), sr, 500);
    const drops = new Float32Array(wash.length);
    for (let k = 0; k < len * 28; k++) {
      const at = Math.floor(rnd() * (wash.length - sr * 0.02)), hz = 1400 + rnd() * 2600, a = 0.08 + rnd() * 0.3;
      for (let i = 0; i < sr * 0.02; i++) drops[at + i] += a * Math.exp(-i / (sr * 0.0025)) * Math.sin(TAU * hz * i / sr);
    }
    norm(wash, 1); norm(drops, 1);
    const x = wash.map((v, i) => 0.3 * v + 0.6 * drops[i]);
    return [norm(loopable(x, sr, 0.4), 0.6)];
  },

};

/** names that borrow another sound until their own file exists */
export const BORROW: Record<string, string> = { enemy_cannon: 'cannon', explode_mine: 'explode_small' };
