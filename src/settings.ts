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
  testNew: boolean; // add the not-yet-introduced enemies (infantry, kamikaze drones) to level 1
  volume: number; // 0 – 1, master sound level
  mute: boolean;
  aiTest: number; // 0 = the level decides, 1–3 forces an enemy AI tier (play-testing)
}

const KEY = 'tank2026.settings';
const DEFAULTS: Settings = { zoom: 1.2, lookAhead: 0.3, offscreen: true, hitMarks: true, ranges: false, fps: false, touchDebug: false, pixel: false, aiTest: 0, testNew: false, volume: 0.8, mute: false };

export const settings: Settings = { ...DEFAULTS };
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
  // v2: pixel mode became opt-in (jagged on tablets and laptops), so drop the old default
  if (!saved.v) delete saved.pixel;
  // v3: default zoom raised to 120% (infantry need a closer view), so drop the old saved zoom once
  if (!saved.v || saved.v < 3) delete saved.zoom;
  // v4: the fps readout left the default HUD (icon HUD); it stays one tick away in settings
  if (!saved.v || saved.v < 4) delete saved.fps;
  Object.assign(settings, saved);
} catch { /* storage blocked or corrupt */ }

export function saveSettings() {
  try { localStorage.setItem(KEY, JSON.stringify({ ...settings, v: 4 })); } catch { /* storage blocked */ }
}
export function resetSettings() { Object.assign(settings, DEFAULTS); saveSettings(); }
