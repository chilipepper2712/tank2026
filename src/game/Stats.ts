// Player performance: counters for one mission, and career totals kept on this device.
// Only the player's own vehicle counts (same kill-credit rule as air-support charging),
// except kills by an A-10 run the player called in.

import { PX_PER_M } from '../config';
import { t } from '../lang';

export type KillWeapon = 'cannon' | 'missile' | 'mg' | 'air' | 'other';
export const KILL_WEAPONS: KillWeapon[] = ['cannon', 'missile', 'mg', 'air', 'other'];
export const WEAPON_NAME = Object.fromEntries(KILL_WEAPONS.map((w) => [w, t(`weapon.${w}`)])) as Record<KillWeapon, string>;
export const ENEMY_NAME: Record<string, string> = Object.fromEntries(['tank', 'apc', 'td', 'technical', 'infantry', 'drone', 'kamikaze', 'robot'].map((k) => [k, t(`enemy.${k}`)]));

export interface MissionStats {
  shots: number; // cannon rounds fired
  hits: number; // cannon rounds that struck an enemy unit
  missiles: number; // anti-tank missiles launched
  kills: Record<KillWeapon, number>;
  byType: Record<string, number>; // kills per enemy kind
  flank: number; // kills whose last hit landed on the side or rear
  dealt: number; // damage done to enemies
  taken: number; // damage that reached the hull
  absorbed: number; // damage the add-on armour and cages soaked up
  hitsFront: number; hitsSide: number; hitsRear: number;
  distance: number; // px driven
  longest: number; // longest kill, px
  cells: number; // building cells (2 × 2 m) the player brought down
  crates: number;
  kitsUsed: number;
  repaired: number; // HP restored by kits, stations and the repair droid
  bestStreak: number;
  double: number; ace: number; legend: number; // streak call-outs reached (2, 5, 10)
  strikes: number; // A-10 runs called
  alliesLost: number;
  time: number; // s
}

export const newMission = (): MissionStats => ({
  shots: 0, hits: 0, missiles: 0,
  kills: { cannon: 0, missile: 0, mg: 0, air: 0, other: 0 }, byType: {},
  flank: 0, dealt: 0, taken: 0, absorbed: 0, hitsFront: 0, hitsSide: 0, hitsRear: 0,
  distance: 0, longest: 0, cells: 0, crates: 0, kitsUsed: 0, repaired: 0,
  bestStreak: 0, double: 0, ace: 0, legend: 0, strikes: 0, alliesLost: 0, time: 0,
});

export const totalKills = (m: MissionStats) => KILL_WEAPONS.reduce((n, k) => n + m.kills[k], 0);
export const accuracy = (m: MissionStats) => (m.shots ? m.hits / m.shots : 0);
export const metres = (px: number) => px / PX_PER_M;

/**
 * Per-frame bookkeeping that is easier to read off the vehicle than to hook at every source:
 * distance driven, damage reaching the hull, protection soaked up and HP repaired.
 */
export class FrameTracker {
  private x = NaN; private y = NaN; private hp = NaN; private guard = NaN;
  constructor(private s: MissionStats) {}
  step(x: number, y: number, hp: number, guard: number) {
    const d = Math.hypot(x - this.x, y - this.y);
    if (d < 40) this.s.distance += d; // larger jumps are spawns or test teleports
    if (hp < this.hp) this.s.taken += this.hp - hp; else if (hp > this.hp) this.s.repaired += hp - this.hp;
    if (guard < this.guard) this.s.absorbed += this.guard - guard;
    this.x = x; this.y = y; this.hp = hp; this.guard = guard;
  }
}

// ---------- career ----------
export interface Career {
  v: 1;
  played: number; won: number; lost: number; deaths: number;
  perClass: Record<'tank' | 'apc', { missions: number; kills: number }>;
  bestTime: Record<number, number>; // level → fastest win, s
  sum: MissionStats; // totals, except longest and bestStreak which hold the best single value
}
const KEY = 'tank2026.stats';
const empty = (): Career => ({ v: 1, played: 0, won: 0, lost: 0, deaths: 0, perClass: { tank: { missions: 0, kills: 0 }, apc: { missions: 0, kills: 0 } }, bestTime: {}, sum: newMission() });

export function loadCareer(): Career {
  const c = empty();
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && s.v === 1) {
      Object.assign(c, s, { perClass: { ...c.perClass, ...s.perClass }, sum: { ...c.sum, ...s.sum } });
      c.sum.kills = { ...newMission().kills, ...s.sum?.kills };
    }
  } catch { /* storage blocked or corrupt */ }
  return c;
}
function saveCareer(c: Career) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* storage blocked */ } }
export function resetCareer() { saveCareer(empty()); }

/** fold one finished mission into the career totals and save */
export function recordMission(m: MissionStats, info: { cls: 'tank' | 'apc'; level: number; won: boolean; dead: boolean }) {
  const c = loadCareer(), s = c.sum;
  c.played++; if (info.won) c.won++; else c.lost++; if (info.dead) c.deaths++;
  c.perClass[info.cls].missions++; c.perClass[info.cls].kills += totalKills(m);
  if (info.won && (!c.bestTime[info.level] || m.time < c.bestTime[info.level])) c.bestTime[info.level] = m.time;
  for (const k of Object.keys(m) as (keyof MissionStats)[]) {
    if (k === 'kills') for (const w of KILL_WEAPONS) s.kills[w] += m.kills[w];
    else if (k === 'byType') for (const [t, n] of Object.entries(m.byType)) s.byType[t] = (s.byType[t] ?? 0) + n;
    else if (k === 'longest' || k === 'bestStreak') s[k] = Math.max(s[k], m[k]);
    else (s[k] as number) += m[k] as number;
  }
  saveCareer(c);
  return c;
}

// ---------- formatting ----------
export const fmtInt = (n: number) => Math.round(n).toLocaleString('vi-VN');
export const fmtPct = (n: number) => `${Math.round(n * 100)}%`;
export const fmtTime = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
export const fmtDist = (px: number) => { const m = metres(px); return m >= 1000 ? `${(m / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} km` : `${Math.round(m)} m`; };
/** a cell is 2 × 2 m of building footprint */
export const fmtArea = (cells: number) => `${fmtInt(cells * 4)} m²`;
