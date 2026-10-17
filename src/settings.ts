/** Player-adjustable view and HUD options, kept in this browser between sessions. */
export interface Settings {
  zoom: number; // 0.6 – 1.3, share of the default view
  lookAhead: number; // 0 – 0.5, how far the camera leans toward the target
  offscreen: boolean; // arrows for enemies outside the screen
  hitMarks: boolean; // red arcs showing where hits come from
  ranges: boolean; // enemy firing range circles
  fps: boolean;
  touchDebug: boolean; // show recent touch events, to diagnose control problems
  pixel: boolean; // render one screen pixel per world pixel and scale up crisp
}

const KEY = 'tank2026.settings';
const DEFAULTS: Settings = { zoom: 0.85, lookAhead: 0.3, offscreen: true, hitMarks: true, ranges: false, fps: true, touchDebug: false, pixel: false };

export const settings: Settings = { ...DEFAULTS };
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
  // v2: pixel mode became opt-in (jagged on tablets and laptops), so drop the old default
  if (!saved.v) delete saved.pixel;
  Object.assign(settings, saved);
} catch { /* storage blocked or corrupt */ }

export function saveSettings() {
  try { localStorage.setItem(KEY, JSON.stringify({ ...settings, v: 2 })); } catch { /* storage blocked */ }
}
export function resetSettings() { Object.assign(settings, DEFAULTS); saveSettings(); }
