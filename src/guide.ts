// The CẨM NANG screen, around the upgrade grid built in menus.ts: enemy tank armour as a line
// drawing, our armour kits and the enemy vehicles as pictures taken from the game's own renderer,
// and the pick-up crates at the end. Every word comes from the language file (guide.*).

import { Container, Graphics, type Renderer } from 'pixi.js';
import { ATGM, ENEMIES, K, PLAYER_CLASSES, PX_PER_M, type EnemyType, type UnitSpec } from './config';
import { t } from './lang';
import { UnitView } from './render/UnitView';
import { VOXEL_OF, VoxelVehicle, type Side, type VoxKind } from './render/VoxelView';
import type { Gear } from './render/vehicles';
import { UPGRADES } from './upgrades';

const num = (v: number, d = 1) => v.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: d });

// ---------- pictures from the game renderer ----------
let renderer: Renderer | null = null;
/** main.ts hands over the renderer once Pixi is up */
export function setGuideRenderer(r: Renderer) { renderer = r; }

/** the three-quarter view the cards use: nose up and to the right */
const POSE = -0.55;
const shots = new Map<string, { url: string; h: number }>();
type Shot = { spec: UnitSpec; vox?: [VoxKind, Side]; gear?: Gear };
const NOGEAR: Gear = { plate: false, cageAT: false, cageUAV: false };

/** draw one unit off-screen (voxel vehicles straight from their baked frames) and return a PNG data URL */
function shoot(s: Shot): { url: string; h: number } {
  const c = new Container();
  const [L, W] = s.spec.size;
  if (s.vox) {
    const sh = new Graphics().ellipse(2, 3 * K, L * 0.62, W * 0.68 * K).fill({ color: 0x000000, alpha: 0.32 });
    const v = new VoxelVehicle(s.vox[0], s.vox[1], s.gear ?? NOGEAR);
    v.sync(POSE, POSE);
    c.addChild(sh, v.root);
  } else {
    const u = new UnitView(s.spec, false);
    u.sync(0, 0, 0, POSE, POSE, 0, false, 0);
    c.addChild(u.root);
  }
  // the extract ignores the target's own scale, so the size goes in as resolution; small units
  // (soldier, drones) come out larger so every card reads at the same size
  const res = 4 * Math.min(1.6, Math.max(1, 30 / L));
  const cv = renderer!.extract.canvas({ target: c, resolution: res, antialias: true }) as HTMLCanvasElement;
  const url = cv.toDataURL('image/png'), h = cv.height;
  c.destroy({ children: true });
  return { url, h };
}

/** picture slots are filled one per frame after the page is shown, so opening the screen never stalls */
const pending: [HTMLImageElement, string, Shot][] = [];
let pumping = false;
function pump() {
  const job = pending.shift();
  if (!job) { pumping = false; return; }
  const [img, key, s] = job;
  try {
    if (!shots.has(key)) shots.set(key, shoot(s));
    show(img, shots.get(key)!);
  } catch { /* no renderer yet or a WebGL hiccup: the slot stays empty */ }
  setTimeout(pump, 16);
}
/** shown at half the pixels it was drawn with (sharp on 2x screens), never taller than the frame */
const show = (img: HTMLImageElement, s: { url: string; h: number }) => { img.src = s.url; img.style.height = `${Math.min(84, Math.round(s.h / 2))}px`; img.classList.add('on'); };
const slots = new Map<string, Shot>();
const pic = (key: string, s: Shot) => { slots.set(key, s); return `<img class="gpic" data-shot="${key}" alt="">`; };

// ---------- enemy armour, as a technical drawing ----------
function armour() {
  const f = ENEMIES.tank.facing;
  // armour band depth on the drawing: thicker plate → wider band (6 px at ×1)
  const band = (m: number) => Math.round((6 / m) * 10) / 10;
  const tF = band(f.front), tS = band(f.side), tR = band(f.rear);
  const INK = 'rgba(235,231,211,.82)', FAINT = 'rgba(235,231,211,.38)', AMB = '#f0b23c', CY = '#5fc8e8';
  const label = (x: number, y: number, w: number, title: string, value: string, end = false, color = AMB) => {
    const tx = end ? x + w : x, a = end ? 'end' : 'start';
    return `<path d="M${x} ${y}h${w}" stroke="${INK}" stroke-width=".9"/>`
      + `<text x="${tx}" y="${y - 6}" text-anchor="${a}" class="gd-t">${title}</text>`
      + `<text x="${tx}" y="${y + 15}" text-anchor="${a}" class="gd-v" fill="${color}">${value}</text>`;
  };
  const lead = (pts: string, color = INK) => `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width=".9"/><circle cx="${pts.split(' ')[0].split(',')[0]}" cy="${pts.split(' ')[0].split(',')[1]}" r="2.4" fill="${color}"/>`;
  let links = '';
  for (let x = 186; x <= 414; x += 9) links += `M${x} 90v20M${x} 190v20`;
  let grille = '';
  for (let y = 126; y <= 174; y += 8) grille += `M200 ${y}h48`;
  const svg = `<svg viewBox="0 0 640 300" class="gdiagram" role="img" aria-label="${t('guide.armour.title')}">
  <defs>
    <pattern id="gdMinor" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" fill="none" stroke="rgba(235,231,211,.05)"/></pattern>
    <pattern id="gdMajor" width="50" height="50" patternUnits="userSpaceOnUse"><rect width="50" height="50" fill="url(#gdMinor)"/><path d="M50 0H0V50" fill="none" stroke="rgba(235,231,211,.1)"/></pattern>
    <pattern id="gdHatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V5" stroke="${AMB}" stroke-width="1.2"/></pattern>
  </defs>
  <rect width="640" height="300" fill="url(#gdMajor)"/>
  <g fill="none" stroke-linejoin="round">
    <!-- tracks and hull -->
    <path d="M182 88h236v24H182zM182 188h236v24H182z" stroke="${FAINT}"/>
    <path d="${links}" stroke="${FAINT}" stroke-width=".7"/>
    <path d="M190 104h215l15 14v64l-15 14H190z" stroke="${INK}" stroke-width="1.5"/>
    <path d="M196 120h56v60h-56z" stroke="${FAINT}"/><path d="${grille}" stroke="${FAINT}" stroke-width=".8"/>
    <!-- turret, hatches, gun -->
    <path d="M262 118h76l14 12v40l-14 14h-76l-10-12v-42z" stroke="${INK}" stroke-width="1.5"/>
    <circle cx="276" cy="134" r="10" stroke="${INK}"/><circle cx="276" cy="134" r="5" stroke="${FAINT}"/><circle cx="284" cy="169" r="7" stroke="${FAINT}"/>
    <path d="M352 138h14v24h-14zM366 146h134v8H366zM500 141h16v18h-16z" stroke="${INK}" stroke-width="1.2"/>
    <path d="M300 92v-14M300 222v-14M168 150h12M300 150m-4 0h8m-4 -4v8" stroke="${FAINT}" stroke-width=".8"/>
  </g>
  <!-- armour plates: band depth = thickness -->
  <g fill="url(#gdHatch)" stroke="${AMB}" stroke-width=".9">
    <path d="M420 118h${tF}v64h-${tF}z"/>
    <path d="M186 ${88 - tS}h228v${tS}H186zM186 212h228v${tS}H186z"/>
    <path d="M${180 - tR} 104h${tR}v92h-${tR}z"/>
  </g>
  ${lead(`${420 + tF / 2},176 462,236 474,236`)}${label(474, 236, 150, t('guide.armour.front'), t('guide.armour.frontNote', { x: num(f.front) }))}
  ${lead(`300,${88 - tS / 2} 300,52 286,52`)}${label(136, 52, 150, t('guide.armour.side'), t('guide.armour.sideNote', { x: num(f.side) }), true)}
  ${lead(`${180 - tR / 2},150 150,150 138,150`)}${label(14, 150, 124, t('guide.armour.rear'), t('guide.armour.rearNote', { x: num(f.rear) }), true)}
  <path d="M470 52Q400 54 316 128" fill="none" stroke="${CY}" stroke-width="1.4" stroke-dasharray="5 4"/><path d="M316 128l3-11 7 6z" fill="${CY}"/>
  ${label(470, 52, 154, t('guide.armour.top'), t('guide.armour.atgm', { dmg: ATGM.dmg }), false, CY)}
  <path d="M14 270h10v10H14z" fill="url(#gdHatch)" stroke="${AMB}" stroke-width=".9"/>
  <text x="32" y="279" class="gd-c">${t('guide.armour.legend')}</text>
  <text x="626" y="279" text-anchor="end" class="gd-c">${t('guide.armour.caption')}</text>
</svg>`;
  return section('gdArmour', 'guide.armour.title', null, `<figure class="gfig">${svg}</figure><p class="glead strong">${t('guide.armour.note')}</p>`);
}

// ---------- our armour kits ----------
function mine() {
  const kits: ['plate' | 'cageAT' | 'cageUAV', Gear][] = [['plate', { ...NOGEAR, plate: true }], ['cageAT', { ...NOGEAR, cageAT: true }], ['cageUAV', { ...NOGEAR, cageUAV: true }]];
  const cards = kits.map(([k, g]) => `<article class="gcard"><div class="gpics two">
      ${pic(`tank-${k}`, { spec: PLAYER_CLASSES.tank, vox: ['tank', 'player'], gear: g })}${pic(`apc-${k}`, { spec: PLAYER_CLASSES.apc, vox: ['apc', 'player'], gear: g })}
    </div><h3>${UPGRADES[k].name}</h3><p>${UPGRADES[k].perLevel}</p></article>`).join('');
  return section('gdMine', 'guide.mine.title', 'guide.mine.intro', `<div class="gcards three">${cards}</div>`);
}

// ---------- enemy vehicles ----------
function foes() {
  const order: EnemyType[] = ['tank', 'apc', 'td', 'technical', 'infantry', 'drone', 'kamikaze'];
  const cards = order.map((k) => {
    const e = ENEMIES[k], w = e.weapon, vox = VOXEL_OF[e.id];
    const stats: [string, string][] = [[t('guide.stat.hp'), num(e.hp, 0)], [t('guide.stat.speed'), t('unit.mps', { n: num(e.speed / PX_PER_M, 0) })], [t('guide.stat.range'), w.range > 1 ? t('unit.meters', { n: Math.round(w.range / PX_PER_M) }) : '–']];
    return `<article class="gcard"><div class="gpics">${pic(`foe-${k}`, { spec: e, vox })}</div><h3>${t(`enemy.${k}`)}</h3>
      <dl>${stats.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl><p>${t(`guide.foe.${k}`)}</p></article>`;
  }).join('');
  return section('gdFoes', 'guide.foes.title', 'guide.foes.intro', `<div class="gcards">${cards}</div>`);
}

// ---------- crates (drawn as they look on the ground) ----------
const crateSvg = (kind: 'up' | 'kit' | 'mis' | 'drone') => {
  const body = { up: '#8a6a2a', kit: '#6f7a4a', mis: '#5a4a3a', drone: '#3f5a5c' }[kind];
  const mark = {
    up: '<rect x="2" y="11" width="32" height="5" fill="#f0b23c"/><rect x="16" y="3" width="4" height="22" fill="#f0b23c"/>',
    kit: '<rect x="15" y="3" width="6" height="22" fill="#9fd16a"/><rect x="2" y="11" width="32" height="5" fill="#9fd16a"/>',
    mis: '<rect x="6" y="8" width="24" height="4" fill="#ff9a3c"/><rect x="6" y="16" width="24" height="4" fill="#ff9a3c"/>',
    drone: '<circle cx="18" cy="14" r="6" fill="#9fd1d6"/>',
  }[kind];
  return `<svg viewBox="0 0 36 28" width="45" height="35" aria-hidden="true"><rect x="2" y="2" width="32" height="24" rx="2" fill="${body}" stroke="#1b1a10" stroke-width="1.2"/>${mark}</svg>`;
};
function crates() {
  const cards = (['up', 'kit', 'mis', 'drone'] as const).map((k) => `<article class="gcard row2"><div class="gicon">${crateSvg(k)}</div><div><h3>${t(`guide.crate.${k}.name`)}</h3><p>${t(`guide.crate.${k}.text`)}</p></div></article>`).join('');
  return section('gdCrates', 'guide.crates.title', 'guide.crates.intro', `<div class="gcards">${cards}</div>`);
}

/** one section: title, optional lead line, body */
const section = (id: string, title: string, lead: string | null, body: string) =>
  `<section class="gsec" id="${id}"><div class="gsec-head"><h2 class="sec">${t(title)}</h2></div>${lead ? `<p class="glead">${t(lead)}</p>` : ''}${body}</section>`;

/** fill the guide parts around the upgrade grid, wire the jump chips, then take the pictures */
export function renderGuide() {
  const top = document.getElementById('guide'), end = document.getElementById('guideEnd');
  if (!top || !end) return;
  slots.clear();
  const chips = [['gdArmour', 'guide.nav.armour'], ['gdMine', 'guide.nav.mine'], ['gdFoes', 'guide.nav.foes'], ['gdUp', 'guide.nav.up'], ['gdCrates', 'guide.nav.crates']];
  top.innerHTML = `<nav class="chips">${chips.map(([id, k]) => `<button class="chip" data-go="${id}">${t(k)}</button>`).join('')}</nav>${armour()}${mine()}${foes()}`;
  end.innerHTML = crates();
  for (const b of top.querySelectorAll<HTMLElement>('[data-go]')) b.addEventListener('click', () => document.getElementById(b.dataset.go!)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  if (!renderer) return;
  for (const img of top.querySelectorAll<HTMLImageElement>('img[data-shot]')) {
    const key = img.dataset.shot!, s = slots.get(key)!;
    if (shots.has(key)) show(img, shots.get(key)!); else pending.push([img, key, s]);
  }
  if (!pumping && pending.length) { pumping = true; setTimeout(pump, 30); }
}
