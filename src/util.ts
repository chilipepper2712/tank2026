export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const angDiff = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const pick = <T>(arr: readonly T[]) => arr[(Math.random() * arr.length) | 0];

/** Deterministic RNG so a level layout is identical on every run. */
export function seeded(seed: number) {
  let s = seed | 0;
  const next = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { next, range: (a: number, b: number) => a + next() * (b - a) };
}

/**
 * Turn `cur` toward `target` with a top speed and an acceleration derived from `inertia`.
 * Brakes early (v = sqrt(2·a·d)) so it never overshoots. Returns [angle, angularVelocity].
 */
export function rotStep(cur: number, w: number, target: number, max: number, inertia: number, dt: number): [number, number] {
  const d = angDiff(target, cur);
  const acc = inertia > 0.01 ? max / inertia : 1e6;
  const vdes = Math.sign(d) * Math.min(max, Math.sqrt(2 * acc * Math.abs(d)));
  w += clamp(vdes - w, -acc * dt, acc * dt);
  let step = w * dt;
  if (Math.sign(step) === Math.sign(d) && Math.abs(step) >= Math.abs(d)) { step = d; w = 0; }
  return [cur + step, w];
}

export function shade(c: number, f: number) {
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return (ch((c >> 16) & 255) << 16) | (ch((c >> 8) & 255) << 8) | ch(c & 255);
}
