import { Application } from 'pixi.js';
import { Game, type GameResult } from './game/Game';
import './style.css';

type ClassId = 'tank' | 'apc';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const menu = $('menu'), result = $('result'), hud = $('hud'), rotate = $('rotate');

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

function start(cls: ClassId) {
  lastClass = cls;
  game?.destroy();
  menu.hidden = true; result.hidden = true; hud.hidden = false;
  game = new Game(app, cls, end);
  app.stage.addChild(game.root);
}

function end(r: GameResult) {
  hud.hidden = true;
  $('resultTitle').textContent = r.won ? 'KHU VỰC ĐÃ SẠCH' : 'XE ĐÃ BỊ PHÁ HỦY';
  const m = Math.floor(r.time / 60), s = Math.floor(r.time % 60).toString().padStart(2, '0');
  $('resultSub').textContent = `Hạ ${r.kills}/${r.total} mục tiêu · ${m}:${s}`;
  result.hidden = false;
}

// Drop render resolution step by step if the device cannot hold ~50 fps.
let frames = 0, acc = 0;
app.ticker.add((t) => {
  game?.update(t.deltaMS / 1000);
  if (!game) return;
  frames++; acc += t.deltaMS;
  if (acc < 2500) return;
  const fps = (frames * 1000) / acc, res = app.renderer.resolution;
  if (fps < 48 && res > 1) app.renderer.resize(innerWidth, innerHeight, Math.max(1, res - 0.5));
  frames = 0; acc = 0;
});

for (const card of document.querySelectorAll<HTMLButtonElement>('.card')) card.addEventListener('click', () => start(card.dataset.class as ClassId));
$('againBtn').addEventListener('click', () => start(lastClass));
$('menuBtn').addEventListener('click', () => { game?.destroy(); game = null; result.hidden = true; menu.hidden = false; });

const coarse = matchMedia('(pointer: coarse)').matches;
const checkOrient = () => { rotate.hidden = !(coarse && innerHeight > innerWidth); };
addEventListener('resize', checkOrient);
checkOrient();

// Quick start for automated checks: ?play=tank or ?play=apc
const q = new URLSearchParams(location.search).get('play');
if (q === 'tank' || q === 'apc') { start(q); Object.assign(window, { __app: app, __game: () => game }); }
