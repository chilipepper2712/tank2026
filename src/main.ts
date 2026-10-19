import { Application } from 'pixi.js';
import { Game, type GameResult } from './game/Game';
import { resetSettings, saveSettings, settings } from './settings';
import { describe, loadPerm, MAX_LEVEL, savePerm, UP_IDS, UPGRADES, GROUP_NAME, type UpId } from './upgrades';
import { initMenus, showResultStats } from './menus';
import { recordMission } from './game/Stats';
import './style.css';
import { LEVELS, unlockedLevel, unlockLevel } from './world/levels';
import { sfx } from './audio/Sfx';
import { prebake } from './render/VoxelView';

import type { ClassId } from './upgrades';
import { ALLIES, ALLY_SLOTS, PICKABLE_ALLIES, VIEW_SHORT, type AllyType } from './config';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
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
const playable = (n: number) => !!LEVELS[n - 1]?.build && n <= unlockedLevel();
/** the highest unlocked level that is already built */
const latestPlayable = () => { let n = 1; for (const l of LEVELS) if (playable(l.n)) n = l.n; return n; };
let levelN = latestPlayable();

function start(cls: ClassId) {
  lastClass = cls;
  game?.destroy();
  menu.hidden = true; result.hidden = true; hud.hidden = false;
  game = new Game(app, cls, loadPerm(cls), loadAllies(cls), end, levelN);
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
  $('resultTitle').textContent = r.won ? 'NHIỆM VỤ HOÀN THÀNH' : r.playerDead ? 'XE ĐÃ BỊ PHÁ HỦY' : 'NHIỆM VỤ THẤT BẠI';
  const m = Math.floor(r.time / 60), s = Math.floor(r.time % 60).toString().padStart(2, '0');
  $('resultSub').textContent = `Màn ${r.level} · ${LEVELS[r.level - 1].title} · hạ ${r.kills}/${r.total} mục tiêu · ${m}:${s}${!r.won && !r.playerDead ? ' · mất đoàn xe' : ''}`;
  recordMission(r.stats, { cls: lastClass, level: r.level, won: r.won, dead: r.playerDead });
  showResultStats(r.stats);
  if (r.won) unlockLevel(r.level + 1);
  $('nextBtn').hidden = !(r.won && LEVELS[r.level]?.build);
  renderLevels();
  showKeepChoice(r);
  result.hidden = false;
}

/** After a win the player keeps one upgrade for this class: one picked up in the mission, or one of three random. */
function showKeepChoice(r: GameResult) {
  const box = $('choices'), note = $('keepNote'), perm = loadPerm(lastClass);
  box.innerHTML = ''; $('resultActions').hidden = false;
  if (!r.won) { note.textContent = 'Thua thì các nâng cấp nhặt trong màn không được giữ lại.'; return; }
  let opts = [...new Set(r.collected)].filter((k) => perm[k] < MAX_LEVEL);
  const fromMission = opts.length > 0;
  if (!fromMission) opts = UP_IDS.filter((k) => perm[k] < MAX_LEVEL).sort(() => Math.random() - 0.5).slice(0, 3);
  if (!opts.length) { note.textContent = 'Xe đã đạt cấp tối đa mọi nâng cấp.'; return; }
  $('resultActions').hidden = true; // pick first so the reward is not skipped by accident
  note.textContent = fromMission ? 'Chọn 1 nâng cấp đã nhặt trong màn để giữ vĩnh viễn cho class này:' : 'Màn này không nhặt được nâng cấp nào. Chọn 1 trong 3:';
  for (const k of opts) {
    const b = document.createElement('button');
    b.className = 'choice';
    b.innerHTML = `<em>${GROUP_NAME[UPGRADES[k].group]}</em><strong>${UPGRADES[k].name} → cấp ${perm[k] + 1}</strong><small>${UPGRADES[k].perLevel}</small>`;
    b.addEventListener('click', () => keep(k));
    box.appendChild(b);
  }
}
function keep(k: UpId) {
  const perm = loadPerm(lastClass);
  perm[k] = Math.min(MAX_LEVEL, perm[k] + 1);
  savePerm(lastClass, perm);
  $('choices').innerHTML = ''; $('resultActions').hidden = false;
  $('keepNote').textContent = `Đã giữ ${UPGRADES[k].name} cấp ${perm[k]}. Nâng cấp hiện có: ${describe(perm)}`;
  refreshMenu();
}
function refreshMenu() {
  for (const el of document.querySelectorAll<HTMLElement>('[data-perm]')) {
    const d = describe(loadPerm(el.dataset.perm as ClassId));
    el.textContent = d ? `Đã nâng cấp: ${d}` : 'Chưa có nâng cấp';
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
  picking = c; picked = loadAllies(c);
  menu.hidden = true; prep.hidden = false;
  renderPrep();
}
function renderPrep() {
  const n = ALLY_SLOTS[picking];
  $('prepSub').textContent = `${picking === 'tank' ? 'Xe tăng' : 'Xe bọc thép'} mang được ${n} đồng đội · đã chọn ${picked.length}/${n}. Đồng đội bị hạ là mất trong màn đó.`;
  $('prepDroid').textContent = loadPerm(picking).kit >= MAX_LEVEL ? 'Droid sửa chữa đi kèm (từ Kit sửa chữa cấp 3), không chiếm chỗ.' : '';
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
  for (const l of LEVELS) {
    const b = document.createElement('button');
    b.textContent = String(l.n);
    b.disabled = !playable(l.n);
    b.title = l.build ? (l.n <= unlockedLevel() ? l.title : 'Chưa mở khóa') : 'Đang xây dựng';
    b.setAttribute('aria-pressed', String(l.n === levelN));
    b.addEventListener('click', () => { levelN = l.n; renderLevels(); });
    row.appendChild(b);
  }
  const l = LEVELS[levelN - 1];
  $('levelInfo').textContent = `Màn ${l.n} · ${l.title} · ${l.area} · ${l.brief.task}`;
}
renderLevels();
initMenus({ menu, pickLevel: (n) => { levelN = n; renderLevels(); }, upgradesReset: refreshMenu });
$('unlockAll').addEventListener('click', () => { unlockLevel(LEVELS.length); renderLevels(); });
const brief = $('brief');
function showBrief() {
  const l = LEVELS[levelN - 1];
  $('briefArea').textContent = `Màn ${l.n} · ${l.area}`;
  $('briefTitle').textContent = l.title.toUpperCase();
  $('bSit').textContent = l.brief.situation; $('bTask').textContent = l.brief.task; $('bLose').textContent = l.brief.lose;
  $('bNote').textContent = l.brief.note ?? ''; $('bNote').hidden = $('bNoteT').hidden = !l.brief.note;
  menu.hidden = true; hud.hidden = true; brief.hidden = false;
}
$('briefGo').addEventListener('click', () => { brief.hidden = true; start(lastClass); });
$('briefBack').addEventListener('click', () => { brief.hidden = true; menu.hidden = false; renderLevels(); });
$('backBtn').addEventListener('click', () => { prep.hidden = true; menu.hidden = false; });

for (const card of document.querySelectorAll<HTMLButtonElement>('.card[data-class]')) card.addEventListener('click', () => openPrep(card.dataset.class as ClassId));
$('againBtn').addEventListener('click', () => start(lastClass));
$('nextBtn').addEventListener('click', () => { levelN++; result.hidden = true; game?.destroy(); game = null; showBrief(); });
$('menuBtn').addEventListener('click', () => { game?.destroy(); game = null; result.hidden = true; menu.hidden = false; });

// ---------- pause + settings ----------
const sVol = $<HTMLInputElement>('sVol'), sZoom = $<HTMLInputElement>('sZoom'), sLook = $<HTMLInputElement>('sLook'), sAi = $<HTMLInputElement>('sAi');
const checks: [string, 'offscreen' | 'hitMarks' | 'ranges' | 'fps' | 'touchDebug' | 'pixel' | 'testNew' | 'mute' | 'voxel' | 'lighting'][] = [['sMute', 'mute'], ['sVox', 'voxel'], ['sLight', 'lighting'], ['sOff', 'offscreen'], ['sHit', 'hitMarks'], ['sRange', 'ranges'], ['sFps', 'fps'], ['sDbg', 'touchDebug'], ['sPix', 'pixel'], ['sNew', 'testNew']];
function syncSettingsUI() {
  sZoom.value = String(settings.zoom); $('oZoom').textContent = Math.round(settings.zoom * 100) + '%';
  sVol.value = String(settings.volume); $('oVol').textContent = Math.round(settings.volume * 100) + '%';
  sLook.value = String(settings.lookAhead); $('oLook').textContent = Math.round(settings.lookAhead * 100) + '%';
  sAi.value = String(settings.aiTest); $('oAi').textContent = settings.aiTest ? 'cấp ' + settings.aiTest : 'theo màn';
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
  if (on) { syncSettingsUI(); $('loadout').textContent = 'Nâng cấp trong trận: ' + game.describeLoadout(); }
}
$('pauseBtn').addEventListener('click', () => pause(true));
$('resumeBtn').addEventListener('click', () => { pause(false); applyRender(); });
$('restartBtn').addEventListener('click', () => { setScreen.hidden = true; start(lastClass); });
$('quitBtn').addEventListener('click', () => { setScreen.hidden = true; game?.destroy(); game = null; menu.hidden = false; });
$('resetBtn').addEventListener('click', () => { resetSettings(); syncSettingsUI(); sfx.applySettings(); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && game) pause(!game.paused); });

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
if (qs.get('level')) levelN = Math.max(1, Math.min(LEVELS.length, +qs.get('level')!));
if (q === 'tank' || q === 'apc') start(q);
if (qs.has('sounds')) void import('./soundtest').then((m) => m.openSoundTest());
if (qs.has('voxel')) void import('./voxeltest').then((m) => m.openVoxelTest(app));
// sound: load the files, click on every menu button
sfx.init();
document.addEventListener('pointerdown', (e) => { const b = (e.target as Element).closest?.('button'); if (b && !b.closest('#hud')) sfx.play('ui_click'); }, true);
Object.assign(window, { __app: app, __game: () => game, __sfx: sfx }); // hooks for automated checks
