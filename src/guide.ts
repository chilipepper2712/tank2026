// The CẨM NANG screen: pick-up crates, enemy tank armour diagram, our armour kits, enemy vehicles.
// (The upgrade grid below them is built in menus.ts.) Everything drawn here is inline SVG; every word
// comes from the language file (guide.*).

import { ATGM, ENEMIES, PX_PER_M, type EnemyType } from './config';
import { t } from './lang';
import { UPGRADES } from './upgrades';

const num = (v: number, d = 1) => v.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: d });

const ENEMY = { body: '#b5523a', dark: '#6b2a22', top: '#d0785a' };
const OURS = { body: '#6f7a4a', dark: '#3d4528', top: '#8a9660' };
const STEEL = '#b9bda6';

type Kind = 'tank' | 'apc' | 'td' | 'technical' | 'infantry' | 'drone' | 'kamikaze';
interface Gear { plate?: boolean; cageAT?: boolean; cageUAV?: boolean }

/** a top-down vehicle facing right, centred on the origin; `g` adds our protection kits */
function veh(kind: Kind, p: typeof OURS, g: Gear = {}): string {
  let s = '';
  if (kind === 'tank') {
    s += `<rect x="-24" y="-16" width="48" height="7" rx="2" fill="${p.dark}"/><rect x="-24" y="9" width="48" height="7" rx="2" fill="${p.dark}"/>`;
    s += `<rect x="-22" y="-11" width="44" height="22" rx="3" fill="${p.body}"/>`;
    if (g.plate) s += `<rect x="-22" y="-11" width="44" height="22" rx="3" fill="none" stroke="${STEEL}" stroke-width="3"/><path d="M-14-11v22M-4-11v22M6-11v22" stroke="${STEEL}" stroke-width="1.2" opacity=".7"/>`;
    s += `<rect x="-8" y="-8" width="22" height="16" rx="4" fill="${p.top}"/><rect x="12" y="-1.6" width="26" height="3.2" fill="${p.dark}"/>`;
    if (g.cageAT) s += `<path d="M-26-19H26M-26 19H26" stroke="${STEEL}" stroke-width="2" stroke-dasharray="3 2"/>`;
    if (g.cageUAV) s += `<rect x="-10" y="-10" width="26" height="20" rx="3" fill="${STEEL}" fill-opacity=".18" stroke="${STEEL}" stroke-width="1.2"/><path d="M-4-10v20M2-10v20M8-10v20M-10-4h26M-10 2h26M-10 8h26" stroke="${STEEL}" stroke-width=".8" opacity=".8"/>`;
  } else if (kind === 'apc') {
    s += `<rect x="-20" y="-10" width="40" height="20" rx="5" fill="${p.body}"/>`;
    for (const x of [-13, 0, 13]) s += `<circle cx="${x}" cy="-11" r="3.4" fill="${p.dark}"/><circle cx="${x}" cy="11" r="3.4" fill="${p.dark}"/>`;
    if (g.plate) s += `<rect x="-20" y="-10" width="40" height="20" rx="5" fill="none" stroke="${STEEL}" stroke-width="3"/>`;
    s += `<circle cx="4" cy="0" r="7" fill="${p.top}"/><rect x="8" y="-1.2" width="18" height="2.4" fill="${p.dark}"/>`;
    if (g.cageAT) s += `<path d="M-23-14H23M-23 14H23" stroke="${STEEL}" stroke-width="2" stroke-dasharray="3 2"/>`;
    if (g.cageUAV) s += `<circle cx="4" cy="0" r="9" fill="${STEEL}" fill-opacity=".18" stroke="${STEEL}" stroke-width="1.2"/><path d="M-5 0h18M4-9v18M-2-6l12 12M10-6L-2 6" stroke="${STEEL}" stroke-width=".8" opacity=".8"/>`;
  } else if (kind === 'td') {
    s += `<rect x="-25" y="-15" width="50" height="6" rx="2" fill="${p.dark}"/><rect x="-25" y="9" width="50" height="6" rx="2" fill="${p.dark}"/>`;
    s += `<polygon points="-23,-10 20,-10 26,-4 26,4 20,10 -23,10" fill="${p.body}"/><polygon points="-6,-8 14,-8 18,-3 18,3 14,8 -6,8" fill="${p.top}"/><rect x="16" y="-2" width="30" height="4" fill="${p.dark}"/>`;
  } else if (kind === 'technical') {
    s += `<rect x="-16" y="-8" width="32" height="16" rx="2" fill="${p.body}"/><rect x="4" y="-8" width="12" height="16" rx="2" fill="${p.top}"/>`;
    s += `<rect x="-12" y="-6" width="14" height="4" rx="1" fill="${p.dark}" transform="rotate(-14 -5 -4)"/><rect x="-12" y="2" width="14" height="4" rx="1" fill="${p.dark}" transform="rotate(14 -5 4)"/>`;
    for (const [x, y] of [[-10, -9], [10, -9], [-10, 9], [10, 9]]) s += `<rect x="${x - 4}" y="${y - 1.5}" width="8" height="3" fill="#222"/>`;
  } else if (kind === 'infantry') {
    s += `<rect x="-8" y="-1.4" width="22" height="2.8" fill="${p.dark}"/><circle cx="-2" cy="0" r="5" fill="${p.body}"/><circle cx="2" cy="0" r="3" fill="${p.top}"/>`;
  } else if (kind === 'drone') {
    for (const [x, y] of [[-9, -9], [9, -9], [-9, 9], [9, 9]]) s += `<circle cx="${x}" cy="${y}" r="5.5" fill="none" stroke="${p.dark}" stroke-width="1.6"/>`;
    s += `<path d="M-9-9L9 9M9-9L-9 9" stroke="${p.dark}" stroke-width="2"/><rect x="-5" y="-4" width="10" height="8" rx="2" fill="${p.body}"/><circle cx="6" cy="0" r="1.6" fill="#ff4a3a"/>`;
  } else {
    s += `<polygon points="-14,-11 18,0 -14,11 -8,0" fill="${p.body}"/><polygon points="-6,-5 12,0 -6,5" fill="${p.top}"/><circle cx="14" cy="0" r="2" fill="#ff4a3a"/>`;
  }
  return s;
}
const svgVeh = (kind: Kind, p: typeof OURS, g: Gear = {}, w = 100, h = 50) =>
  `<svg viewBox="-50 -25 100 50" width="${w}" height="${h}" aria-hidden="true"><g>${veh(kind, p, g)}</g></svg>`;

// ---------- crates ----------
const crateSvg = (kind: 'up' | 'kit' | 'mis' | 'drone') => {
  const body = { up: '#8a6a2a', kit: '#6f7a4a', mis: '#5a4a3a', drone: '#3f5a5c' }[kind];
  const mark = {
    up: '<rect x="2" y="11" width="32" height="5" fill="#f0b23c"/><rect x="16" y="3" width="4" height="22" fill="#f0b23c"/>',
    kit: '<rect x="15" y="3" width="6" height="22" fill="#9fd16a"/><rect x="2" y="11" width="32" height="5" fill="#9fd16a"/>',
    mis: '<rect x="6" y="8" width="24" height="4" fill="#ff9a3c"/><rect x="6" y="16" width="24" height="4" fill="#ff9a3c"/>',
    drone: '<circle cx="18" cy="14" r="6" fill="#9fd1d6"/><path d="M8 4l20 20M28 4L8 24" stroke="#9fd1d6" stroke-width="1.5"/>',
  }[kind];
  return `<svg viewBox="0 0 36 28" width="54" height="42" aria-hidden="true"><rect x="2" y="2" width="32" height="24" rx="2" fill="${body}" stroke="#1b1a10" stroke-width="1.2"/>${mark}</svg>`;
};

function crates() {
  const rows = (['up', 'kit', 'mis', 'drone'] as const).map((k) => `<article class="gcard crate">${crateSvg(k)}<div><strong>${t(`guide.crate.${k}.name`)}</strong><p>${t(`guide.crate.${k}.text`)}</p></div></article>`).join('');
  return `<section class="gbox" id="gdCrates"><h2 class="sec">${t('guide.crates.title')}</h2><p class="sub">${t('guide.crates.intro')}</p><div class="gcards">${rows}</div></section>`;
}

// ---------- armour diagram ----------
function armour() {
  const f = ENEMIES.tank.facing, x = (v: number) => num(v, 1);
  const line = (a: string, b: string, c: string) => `<path d="${a}" fill="none" stroke="${c}" stroke-width="1.2" stroke-dasharray="2 2"/><circle cx="${b.split(',')[0]}" cy="${b.split(',')[1]}" r="2.6" fill="${c}"/>`;
  const txt = (xx: number, y: number, a: string, b: string, c: string, anchor: 'start' | 'end' | 'middle') =>
    `<text x="${xx}" y="${y}" text-anchor="${anchor}" fill="${c}" font-size="12" font-weight="700" letter-spacing=".06em">${a}</text><text x="${xx}" y="${y + 14}" text-anchor="${anchor}" fill="#ebe7d3" font-size="10.5">${b}</text>`;
  const RED = '#e4573f', AMB = '#f0b23c', GRN = '#9fd16a', CY = '#5fc8e8';
  const svg = `<svg viewBox="0 0 460 250" class="gdiagram" role="img" aria-label="${t('guide.armour.title')}">
    <defs><pattern id="gdGrid" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M14 0H0V14" fill="none" stroke="#ebe7d3" stroke-opacity=".08"/></pattern></defs>
    <rect width="460" height="250" fill="url(#gdGrid)"/>
    <g transform="translate(230 134) scale(2.6)">${veh('tank', ENEMY)}</g>
    <!-- the plates: line weight = armour thickness -->
    <path d="M296 108V160" stroke="${RED}" stroke-width="9" stroke-linecap="round"/>
    <path d="M170 108H296M170 160H296" stroke="${AMB}" stroke-width="5" stroke-linecap="round"/>
    <path d="M170 108V160" stroke="${GRN}" stroke-width="3" stroke-linecap="round"/>
    ${line('M296 140L332 196', '332,196', RED)}${txt(452, 212, t('guide.armour.front'), t('guide.armour.frontNote', { x: x(f.front) }), RED, 'end')}
    ${line('M230 108L230 58L150 40', '150,40', AMB)}${txt(146, 36, t('guide.armour.side'), t('guide.armour.sideNote', { x: x(f.side) }), AMB, 'end')}
    ${line('M170 134L120 134', '120,134', GRN)}${txt(112, 130, t('guide.armour.rear'), t('guide.armour.rearNote', { x: x(f.rear) }), GRN, 'end')}
    <path d="M336 56L246 120" stroke="${CY}" stroke-width="1.6"/><path d="M246 120l11-3-6-9z" fill="${CY}"/>${txt(450, 24, t('guide.armour.top'), t('guide.armour.atgm', { dmg: ATGM.dmg }), CY, 'end')}
  </svg>`;
  return `<section class="gbox" id="gdArmour"><h2 class="sec">${t('guide.armour.title')}</h2>${svg}<p class="gnote">${t('guide.armour.note')}</p></section>`;
}

// ---------- our armour kits ----------
function mine() {
  const kits: ['plate' | 'cageAT' | 'cageUAV', Gear][] = [['plate', { plate: true }], ['cageAT', { cageAT: true }], ['cageUAV', { cageUAV: true }]];
  const cards = kits.map(([k, g]) => `<article class="gcard kit"><div class="kitpic">${svgVeh('tank', OURS, g, 96, 48)}${svgVeh('apc', OURS, g, 80, 40)}</div><strong>${UPGRADES[k].name}</strong><p>${UPGRADES[k].perLevel}</p></article>`).join('');
  return `<section class="gbox" id="gdMine"><h2 class="sec">${t('guide.mine.title')}</h2><p class="sub">${t('guide.mine.intro')}</p><div class="gcards">${cards}</div></section>`;
}

// ---------- enemy vehicles ----------
function foes() {
  const order: EnemyType[] = ['tank', 'apc', 'td', 'technical', 'infantry', 'drone', 'kamikaze'];
  const cards = order.map((k) => {
    const e = ENEMIES[k], w = e.weapon;
    const stats = [[t('guide.stat.hp'), num(e.hp, 0)], [t('guide.stat.speed'), t('unit.mps', { n: num(e.speed / PX_PER_M, 0) })], ...(w.range > 1 ? [[t('guide.stat.range'), t('unit.meters', { n: Math.round(w.range / PX_PER_M) })]] : [])];
    return `<article class="gcard foe"><div class="foepic">${svgVeh(k, ENEMY, {}, 100, 50)}</div><strong>${t(`enemy.${k}`)}</strong>
      <dl>${stats.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl><p>${t(`guide.foe.${k}`)}</p></article>`;
  }).join('');
  return `<section class="gbox" id="gdFoes"><h2 class="sec">${t('guide.foes.title')}</h2><div class="gcards">${cards}</div></section>`;
}

/** fill #guide and wire the jump chips */
export function renderGuide() {
  const el = document.getElementById('guide');
  if (!el) return;
  const chips = [['gdCrates', 'guide.nav.crates'], ['gdArmour', 'guide.nav.armour'], ['gdMine', 'guide.nav.mine'], ['gdFoes', 'guide.nav.foes'], ['gdUp', 'guide.nav.up']];
  el.innerHTML = `<nav class="chips">${chips.map(([id, k]) => `<button class="chip" data-go="${id}">${t(k)}</button>`).join('')}</nav>${crates()}${armour()}${mine()}${foes()}`;
  for (const b of el.querySelectorAll<HTMLElement>('[data-go]')) b.addEventListener('click', () => document.getElementById(b.dataset.go!)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}
