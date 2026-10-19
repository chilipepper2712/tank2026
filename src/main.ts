import { Application } from 'pixi.js';
import { Game, type GameResult } from './game/Game';
import { resetSettings, saveSettings, settings } from './settings';
import { describe, loadPerm, MAX_LEVEL, savePerm, UP_IDS, UPGRADES, GROUP_NAME, type UpId } from './upgrades';
import { initMenus, showResultStats } from './menus';
import { recordMission } from './game/Stats';
import './style.css';
import { applyTexts, missing, t } from './lang';
import { levelDef, LEVELS, markTrained, pickWeather, trained, unlockedLevel, unlockLevel } from './world/levels';
import { WEATHER_IDS, type WeatherId } from './render/Weather';
import { sfx } from './audio/Sfx';
import { prebake } from './render/VoxelView';

import type { ClassId } from './upgrades';
import { ALLIES, ALLY_SLOTS, PICKABLE_ALLIES, VIEW_SHORT, type AllyType } from './config';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
applyTexts(); // every fixed word on the page comes from the language file
// the itch.io build (npm run itch) hides the play-testing tools and keeps their settings at the defaults
if (import.meta.env.MODE === 'itch') {
  for (const el of document.querySelectorAll<HTMLElement>('[data-dev]')) el.hidden = true;
  Object.assign(settings, { voxel: true, testNew: false, aiTest: 0, touchDebug: false });
}
const menu = $('menu'), result = $('result'), hud = $('hud'), rotate = $('rotate'), setScreen = $('settings');

const app = new Application();
await app.init({
  resizeTo: window,
  background: 0x121309,
  antialias: false,
  resolution: Math.min(2, window.devicePixelRatio || 1),
  autoDensity: true,
  powerPreference: 'high-performance',
});
$('game').appendChild(app.canvas);

let game: Game | null = null;
let lastClass: ClassId = 'tank';
/** level 0 is recruit training, always open */
const playable = (n: number) => n === 0 || (!!LEVELS[n - 1]?.build && n <= unlockedLevel());
/** the highest unlocked level that is already built */
const latestPlayable = () => { let n = 1; for (const l of LEVELS) if (playable(l.n)) n = l.n; return n; };
// a new player starts with training
let levelN = trained() ? latestPlayable() : 0;
/** this attempt's weather: drawn when the briefing opens, kept for a restart */
let weather: WeatherId = 'clear';

function start(cls: ClassId) {
  lastClass = cls;
  game?.destroy();
  menu.hidden = true; result.hidden = true; hud.hidden = false;
  game = new Game(app, cls, loadPerm(cls), loadAllies(cls), end, levelN, weather);
  app.stage.addChild(game.root);
  applyRender();
}

/** Pixel mode renders one pixel per world pixel and lets the browser scale it up without smoothing. */
function applyRender() {
  const dpr = window.devicePixelRatio || 1, z = (Math.min(innerWidth, innerHeight) / VIEW_SHORT) * settings.zoom;
  const res = settings.pixel ? Math.min(2, dpr, 1 / z) : Math.min(2, dpr);
  app.canvas.style.imageRendering = settings.pixel ? 'pixelated' : 'auto';
  if (Math.abs(app.renderer.resolution - res) > 0.01) app.renderer.resize(innerWidth, innerHeight, res);
}
addEventListener('resize', () => setTimeout(applyRender, 50));

function end(r: GameResult) {
  hud.hidden = true;
  if (r.level === 0) { endTraining(r); return; }
  $('resultTitle').textContent = t(r.won ? 'result.won' : r.playerDead ? 'result.dead' : 'result.failed');
  const m = Math.floor(r.time / 60), s = Math.floor(r.time % 60).toString().padStart(2, '0');
  const sub = t('result.sub', { n: r.level, title: LEVELS[r.level - 1].title, kills: r.kills, total: r.total, time: `${m}:${s}` });
  $('resultSub').textContent = !r.won && !r.playerDead ? `${sub} · ${t('result.convoyLost')}` : sub;
  recordMission(r.stats, { cls: lastClass, level: r.level, won: r.won, dead: r.playerDead });
  showResultStats(r.stats);
  if (r.won) unlockLevel(r.level + 1);
  $('nextBtn').hidden = !(r.won && LEVELS[r.level]?.build); $('nextBtn').textContent = t('result.next');
  renderLevels();
  showKeepChoice(r);
  result.hidden = false;
}

/** Training done: no record, no upgrade to keep; the way on is the campaign. */
function endTraining(r: GameResult) {
  markTrained();
  const m = Math.floor(r.time / 60), s = Math.floor(r.time % 60).toString().padStart(2, '0');
  $('resultTitle').textContent = t('result.trainedTitle');
  $('resultSub').textContent = t('result.trainedSub', { time: `${m}:${s}`, n: r.kills });
  $('resultStats').innerHTML = ''; $('choices').innerHTML = ''; $('resultActions').hidden = false;
  $('keepNote').textContent = t('result.trainedNote');
  $('nextBtn').hidden = false; $('nextBtn').textContent = t('result.toCampaign');
  renderLevels();
  result.hidden = false;
}
/** Skip (or finish) training: straight on to the companion picker for level 1. */
function skipTraining() {
  markTrained();
  game?.destroy(); game = null;
  hud.hidden = true; brief.hidden = true; result.hidden = true; setScreen.hidden = true;
  levelN = 1; renderLevels();
  openPrep(lastClass);
}

/** After a win the player keeps one upgrade for this class: one picked up in the mission, or one of three random. */
function showKeepChoice(r: GameResult) {
  const box = $('choices'), note = $('keepNote'), perm = loadPerm(lastClass);
  box.innerHTML = ''; $('resultActions').hidden = false;
  if (!r.won) { note.textContent = t('result.keepLost'); return; }
  let opts = [...new Set(r.collected)].filter((k) => perm[k] < MAX_LEVEL);
  const fromMission = opts.length > 0;
  if (!fromMission) opts = UP_IDS.filter((k) => perm[k] < MAX_LEVEL).sort(() => Math.random() - 0.5).slice(0, 3);
  if (!opts.length) { note.textContent = t('result.keepMaxed'); return; }
  $('resultActions').hidden = true; // pick first so the reward is not skipped by accident
  note.textContent = t(fromMission ? 'result.keepPicked' : 'result.keepRandom');
  for (const k of opts) {
    const b = document.createElement('button');
    b.className = 'choice';
    b.innerHTML = `<em>${GROUP_NAME[UPGRADES[k].group]}</em><strong>${t('result.keepChoice', { name: UPGRADES[k].name, n: perm[k] + 1 })}</strong><small>${UPGRADES[k].perLevel}</small>`;
    b.addEventListener('click', () => keep(k));
    box.appendChild(b);
  }
}
function keep(k: UpId) {
  const perm = loadPerm(lastClass);
  perm[k] = Math.min(MAX_LEVEL, perm[k] + 1);
  savePerm(lastClass, perm);
  $('choices').innerHTML = ''; $('resultActions').hidden = false;
  $('keepNote').textContent = t('result.kept', { name: UPGRADES[k].name, n: perm[k], list: describe(perm) });
  refreshMenu();
}
function refreshMenu() {
  for (const el of document.querySelectorAll<HTMLElement>('[data-perm]')) {
    const d = describe(loadPerm(el.dataset.perm as ClassId));
    el.textContent = d ? t('menu.perm', { list: d }) : t('menu.permNone');
  }
}
refreshMenu();

// Drop render resolution step by step if the device cannot hold ~50 fps.
let frames = 0, acc = 0;
app.ticker.add((t) => {
  game?.update(t.deltaMS / 1000);
  if (!game) return;
  frames++; acc += t.deltaMS;
  if (acc < 2500) return;
  const fps = (frames * 1000) / acc, res = app.renderer.resolution;
  if (!settings.pixel && fps < 48 && res > 1) app.renderer.resize(innerWidth, innerHeight, Math.max(1, res - 0.5));
  frames = 0; acc = 0;
});

// ---------- companion picker before each mission ----------
const prep = $('prep');
const ALLY_KEY = (c: ClassId) => `tank2026.allies.${c}`;
function loadAllies(c: ClassId): AllyType[] {
  let v: AllyType[] = [];
  try { v = JSON.parse(localStorage.getItem(ALLY_KEY(c)) || '[]'); } catch { /* storage blocked */ }
  v = v.filter((t) => PICKABLE_ALLIES.includes(t)).slice(0, ALLY_SLOTS[c]);
  return v.length ? v : PICKABLE_ALLIES.slice(0, ALLY_SLOTS[c]);
}
function saveAllies(c: ClassId, v: AllyType[]) { try { localStorage.setItem(ALLY_KEY(c), JSON.stringify(v)); } catch { /* storage blocked */ } }
let picking: ClassId = 'tank', picked: AllyType[] = [];
function openPrep(c: ClassId) {
  if (settings.voxel) prebake(c, 'player'); // bake the voxel vehicle while the player reads the prep and briefing screens
  if (levelN === 0) { lastClass = c; showBrief(); return; } // training takes no companions
  picking = c; picked = loadAllies(c);
  menu.hidden = true; prep.hidden = false;
  renderPrep();
}
function renderPrep() {
  const n = ALLY_SLOTS[picking];
  $('prepSub').textContent = t('prep.sub', { cls: t(`class.${picking}`), n, picked: picked.length });
  $('prepDroid').textContent = loadPerm(picking).kit >= MAX_LEVEL ? t('prep.droid') : '';
  const box = $('allyCards');
  box.innerHTML = '';
  for (const t of PICKABLE_ALLIES) {
    const b = document.createElement('button'), on = picked.includes(t);
    b.className = 'card ally'; b.setAttribute('aria-pressed', String(on));
    b.innerHTML = `<strong>${ALLIES[t].title}</strong><em>${ALLIES[t].role}</em>`;
    b.addEventListener('click', () => {
      if (on) picked = picked.filter((x) => x !== t);
      else { picked.push(t); if (picked.length > n) picked.shift(); }
      renderPrep();
    });
    box.appendChild(b);
  }
}
$('goBtn').addEventListener('click', () => { saveAllies(picking, picked); prep.hidden = true; lastClass = picking; showBrief(); });

// ---------- level picker and mission briefing ----------
function renderLevels() {
  const row = $('levelRow');
  row.innerHTML = '';
  if (!playable(levelN)) levelN = latestPlayable();
  const hl = document.createElement('button');
  hl.textContent = t('menu.trainingChip'); hl.title = t('menu.trainingChipTip'); hl.setAttribute('aria-pressed', String(levelN === 0));
  hl.addEventListener('click', () => { levelN = 0; renderLevels(); });
  row.appendChild(hl);
  for (const l of LEVELS) {
    const b = document.createElement('button');
    b.textContent = String(l.n);
    b.disabled = !playable(l.n);
    b.title = l.build ? (l.n <= unlockedLevel() ? l.title : t('menu.locked')) : t('menu.building');
    b.setAttribute('aria-pressed', String(l.n === levelN));
    b.addEventListener('click', () => { levelN = l.n; renderLevels(); });
    row.appendChild(b);
  }
  const l = levelDef(levelN);
  $('levelInfo').textContent = t(levelN === 0 ? 'menu.infoTraining' : 'menu.info', { n: l.n, title: l.title, area: l.area, task: l.brief.task });
}
renderLevels();
initMenus({ menu, pickLevel: (n) => { levelN = n; renderLevels(); }, upgradesReset: refreshMenu });
$('unlockAll').addEventListener('click', () => { unlockLevel(LEVELS.length); renderLevels(); });
const brief = $('brief');
function showBrief() {
  const l = levelDef(levelN);
  $('briefArea').textContent = levelN === 0 ? l.area : t('brief.area', { n: l.n, area: l.area });
  $('briefSkip').hidden = levelN !== 0;
  $('briefTitle').textContent = l.title.toUpperCase();
  $('bSit').textContent = l.brief.situation; $('bTask').textContent = l.brief.task; $('bLose').textContent = l.brief.lose;
  $('bNote').textContent = l.brief.note ?? ''; $('bNote').hidden = $('bNoteT').hidden = !l.brief.note;
  weather = pickWeather(levelN);
  $('bWea').textContent = t(`weather.${weather}.brief`);
  $('bWea').hidden = $('bWeaT').hidden = (l.weather ?? []).length < 2; // only where the weather can change
  menu.hidden = true; hud.hidden = true; brief.hidden = false;
}
$('briefGo').addEventListener('click', () => { brief.hidden = true; start(lastClass); });
$('briefSkip').addEventListener('click', skipTraining);
$('coachSkip').addEventListener('click', skipTraining);
$('briefBack').addEventListener('click', () => { brief.hidden = true; menu.hidden = false; renderLevels(); });
$('backBtn').addEventListener('click', () => { prep.hidden = true; menu.hidden = false; });

for (const card of document.querySelectorAll<HTMLButtonElement>('.card[data-class]')) card.addEventListener('click', () => openPrep(card.dataset.class as ClassId));
$('againBtn').addEventListener('click', () => start(lastClass));
$('nextBtn').addEventListener('click', () => { if (levelN === 0) { skipTraining(); return; } levelN++; result.hidden = true; game?.destroy(); game = null; showBrief(); });
$('menuBtn').addEventListener('click', () => { game?.destroy(); game = null; result.hidden = true; menu.hidden = false; });

// ---------- pause + settings ----------
const sVol = $<HTMLInputElement>('sVol'), sZoom = $<HTMLInputElement>('sZoom'), sLook = $<HTMLInputElement>('sLook'), sAi = $<HTMLInputElement>('sAi');
const checks: [string, 'offscreen' | 'hitMarks' | 'ranges' | 'fps' | 'touchDebug' | 'pixel' | 'testNew' | 'mute' | 'voxel' | 'lighting'][] = [['sMute', 'mute'], ['sVox', 'voxel'], ['sLight', 'lighting'], ['sOff', 'offscreen'], ['sHit', 'hitMarks'], ['sRange', 'ranges'], ['sFps', 'fps'], ['sDbg', 'touchDebug'], ['sPix', 'pixel'], ['sNew', 'testNew']];
function syncSettingsUI() {
  sZoom.value = String(settings.zoom); $('oZoom').textContent = Math.round(settings.zoom * 100) + '%';
  sVol.value = String(settings.volume); $('oVol').textContent = Math.round(settings.volume * 100) + '%';
  sLook.value = String(settings.lookAhead); $('oLook').textContent = Math.round(settings.lookAhead * 100) + '%';
  sAi.value = String(settings.aiTest); $('oAi').textContent = settings.aiTest ? t('set.aiLevel', { n: settings.aiTest }) : t('set.aiAuto');
  for (const [id, k] of checks) $<HTMLInputElement>(id).checked = settings[k];
}
sZoom.addEventListener('input', () => { settings.zoom = +sZoom.value; saveSettings(); syncSettingsUI(); });
sVol.addEventListener('input', () => { settings.volume = +sVol.value; saveSettings(); syncSettingsUI(); sfx.applySettings(); });
sLook.addEventListener('input', () => { settings.lookAhead = +sLook.value; saveSettings(); syncSettingsUI(); });
sAi.addEventListener('input', () => { settings.aiTest = +sAi.value; saveSettings(); syncSettingsUI(); });
for (const [id, k] of checks) $<HTMLInputElement>(id).addEventListener('change', (e) => { settings[k] = (e.target as HTMLInputElement).checked; saveSettings(); sfx.applySettings(); });
function pause(on: boolean) {
  if (!game) return;
  game.paused = on; setScreen.hidden = !on; hud.hidden = on;
  if (on) { syncSettingsUI(); $('loadout').textContent = t('set.loadout', { list: game.describeLoadout() }); }
}
$('pauseBtn').addEventListener('click', () => pause(true));
// quick look at the mission: the winning and losing conditions, game paused behind it
const missionScr = $('missionScr');
function missionView(on: boolean) {
  if (!game) return;
  if (on) {
    const l = levelDef(game.levelN);
    $('missionArea').textContent = game.levelN === 0 ? l.area : t('brief.area', { n: l.n, area: l.area });
    $('mTask').textContent = l.brief.task; $('mLose').textContent = l.brief.lose;
  }
  game.paused = on; missionScr.hidden = !on; hud.hidden = on;
  if (!on) applyRender();
}
$('missionBtn').addEventListener('click', () => missionView(true));
$('missionClose').addEventListener('click', () => missionView(false));
$('resumeBtn').addEventListener('click', () => { pause(false); applyRender(); });
$('restartBtn').addEventListener('click', () => { setScreen.hidden = true; start(lastClass); });
$('quitBtn').addEventListener('click', () => { setScreen.hidden = true; game?.destroy(); game = null; menu.hidden = false; });
$('resetBtn').addEventListener('click', () => { resetSettings(); syncSettingsUI(); sfx.applySettings(); });
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && game) { if (!missionScr.hidden) missionView(false); else pause(!game.paused); }
});

// iOS Safari ignores user-scalable=no: block its zoom gestures and double-tap zoom ourselves.
for (const ev of ['gesturestart', 'gesturechange', 'dblclick'] as const) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = performance.now();
  if (now - lastTouchEnd < 350 && !(e.target as HTMLElement).closest('.screen')) e.preventDefault();
  lastTouchEnd = now;
}, { passive: false });
for (const b of document.querySelectorAll<HTMLElement>('#hud .round')) b.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

const coarse = matchMedia('(pointer: coarse)').matches;
const checkOrient = () => { rotate.hidden = !(coarse && innerHeight > innerWidth); };
addEventListener('resize', checkOrient);
checkOrient();

// Quick start for automated checks: ?play=tank or ?play=apc
const qs = new URLSearchParams(location.search), q = qs.get('play');
if (qs.get('level')) levelN = Math.max(0, Math.min(LEVELS.length, +qs.get('level')!));
const qw = qs.get('weather') as WeatherId | null;
if (qw && WEATHER_IDS.includes(qw)) weather = qw;
if (q === 'tank' || q === 'apc') start(q);
if (qs.has('sounds')) void import('./soundtest').then((m) => m.openSoundTest());
if (qs.has('voxel')) void import('./voxeltest').then((m) => m.openVoxelTest(app));
// sound: load the files, click on every menu button
sfx.init();
document.addEventListener('pointerdown', (e) => { const b = (e.target as Element).closest?.('button'); if (b && !b.closest('#hud')) sfx.play('ui_click'); }, true);
Object.assign(window, { __app: app, __game: () => game, __sfx: sfx, __missingTexts: missing }); // hooks for automated checks
