// Menu screens beside the play flow: campaign story cards, upgrade overview, career record,
// and the stats panel on the result screen.

import { ALLIES, REPAIR_DROID_RATE, PX_PER_M, type AllyType } from './config';
import {
  accuracy, ENEMY_NAME, fmtArea, fmtDist, fmtInt, fmtPct, fmtTime, loadCareer, resetCareer, totalKills, WEAPON_NAME, KILL_WEAPONS, type MissionStats,
} from './game/Stats';
import { STORY } from './story';
import {
  ALLY_UPGRADES, GROUP_NAME, loadPerm, MAX_LEVEL, metricSeries, PLANNED, resetPerm, UP_ICON, UP_IDS, UP_METRIC, UPGRADES, type ClassId, type Group,
} from './upgrades';
import { LEVELS, unlockedLevel } from './world/levels';
import { t as tr } from './lang';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const ic = (id: string, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const num = (v: number, digits = 0) => v.toLocaleString('vi-VN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const GROUPS: Group[] = ['fire', 'protect', 'move', 'support'];
const CLASS_NAME: Record<ClassId, string> = { tank: tr('class.tank'), apc: tr('class.apc') };

interface MenuHooks {
  menu: HTMLElement;
  /** a story card was tapped: select that level in the picker */
  pickLevel: (n: number) => void;
  /** permanent upgrades were wiped: refresh whatever shows them */
  upgradesReset: () => void;
}

export function initMenus(h: MenuHooks) {
  const screens = { story: $('story'), up: $('upgradesScr'), career: $('career') };
  const open = (s: HTMLElement, render: () => void) => { render(); h.menu.hidden = true; s.hidden = false; s.scrollTop = 0; };
  const close = () => { for (const s of Object.values(screens)) s.hidden = true; h.menu.hidden = false; };
  for (const b of document.querySelectorAll<HTMLElement>('[data-back]')) b.addEventListener('click', close);

  // ---------- campaign story ----------
  $('navStory').addEventListener('click', () => open(screens.story, renderStory));
  function renderStory() {
    const box = $('storyCards'), top = unlockedLevel();
    $('storySub').textContent = tr('story.sub', { n: Math.min(top, LEVELS.length), of: LEVELS.length });
    box.innerHTML = '';
    for (const l of LEVELS) {
      const st = STORY.find((s) => s.level === l.n), open = l.n <= top, ready = open && !!l.build;
      const card = document.createElement('button');
      card.className = 'scard' + (open ? '' : ' locked');
      card.disabled = !ready;
      const art = st?.cover ? `<img src="${st.cover}" alt="">` : `<div class="panels"><i></i><i></i><i></i></div><span>${open ? tr('story.comicSoon') : ''}</span>`;
      card.innerHTML = `<div class="frame">${art}${open ? '' : ic('lock', 'lockic')}</div>
        <em>${tr('story.cardHead', { n: l.n, area: l.area.toUpperCase() })}</em><strong>${st?.headline ?? l.title}</strong>
        <small>${!open ? tr('menu.locked') : !l.build ? tr('menu.building') : l.brief.situation}</small>`;
      card.addEventListener('click', () => { h.pickLevel(l.n); close(); });
      box.appendChild(card);
    }
  }

  // ---------- upgrades ----------
  let tab: ClassId = 'tank';
  $('navUp').addEventListener('click', () => open(screens.up, renderUpgrades));
  for (const t of document.querySelectorAll<HTMLElement>('[data-tab]')) t.addEventListener('click', () => { tab = t.dataset.tab as ClassId; renderUpgrades(); });
  $('resetProg').addEventListener('click', () => {
    if (!confirm(tr('up.resetAsk'))) return;
    resetPerm(); h.upgradesReset(); renderUpgrades();
  });
  function renderUpgrades() {
    for (const t of document.querySelectorAll<HTMLElement>('[data-tab]')) t.setAttribute('aria-selected', String(t.dataset.tab === tab));
    const perm = loadPerm(tab), owned = UP_IDS.reduce((n, k) => n + Math.min(MAX_LEVEL, perm[k]), 0);
    $('upSub').textContent = tr('up.sub', { cls: CLASS_NAME[tab], n: owned, of: UP_IDS.length * MAX_LEVEL });
    $('upGrid').innerHTML = GROUPS.map((g) => {
      const tiles = UP_IDS.filter((k) => UPGRADES[k].group === g).map((k) => {
        const lv = Math.min(MAX_LEVEL, perm[k]), m = UP_METRIC[k], series = metricSeries(tab, k);
        const pips = Array.from({ length: MAX_LEVEL }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('');
        const vals = series.map((v, i) => (i === lv ? `<b>${num(v, m.digits)}</b>` : num(v, m.digits))).join(' › ');
        return `<article class="uptile${lv ? ' own' : ''}${lv >= MAX_LEVEL ? ' max' : ''}">
          <div class="uphead">${ic(UP_ICON[k])}<strong>${UPGRADES[k].name}</strong><span class="lvpips" aria-label="${tr('up.level', { n: lv, of: MAX_LEVEL })}">${pips}</span></div>
          <p>${UPGRADES[k].perLevel}</p><p class="metric">${vals} <small>${m.unit}</small></p></article>`;
      });
      for (const p of PLANNED.filter((p) => p.group === g)) {
        tiles.push(`<article class="uptile locked"><div class="uphead">${ic(p.icon)}<strong>${p.name}</strong><span class="soon">${ic('lock')}${tr('up.soon')}</span></div><p>${p.note}</p></article>`);
      }
      return `<section class="upcol"><h3>${GROUP_NAME[g]}</h3>${tiles.join('')}</section>`;
    }).join('');
    const allies: [AllyType, string][] = [['attackDrone', 'drone'], ['interceptor', 'drone'], ['robot', 'robot'], ['repairDroid', 'wrench']];
    $('allyGrid').innerHTML = allies.map(([t, icon]) => {
      const a = ALLIES[t], w = a.weapon;
      const s = num(w.reload, w.reload % 1 ? 1 : 0);
      const fire = t === 'repairDroid' ? tr('up.allyRepair', { n: num(REPAIR_DROID_RATE * 100) }) : w.burst > 1 ? tr('up.allyBurst', { dmg: num(w.dmg), burst: w.burst, s }) : tr('up.allyShot', { dmg: num(w.dmg), s });
      const rows = [[tr('up.allyHp'), num(a.hp)], [tr('up.allyFire'), fire], ...(w.range ? [[tr('up.allyRange'), tr('unit.meters', { n: Math.round(w.range / PX_PER_M) })]] : [])];
      const ups = ALLY_UPGRADES[t].map((u) => `<li>${u.name}: ${u.perLevel}</li>`).join('');
      return `<article class="allycard"><div class="uphead">${ic(icon)}<strong>${a.title}</strong></div><em>${a.role}${t === 'repairDroid' ? tr('up.allyDroidNote') : ''}</em>
        <dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>${ups ? `<ul>${ups}</ul>` : ''}</article>`;
    }).join('');
  }

  // ---------- career ----------
  $('navCareer').addEventListener('click', () => open(screens.career, renderCareer));
  $('resetCareer').addEventListener('click', () => {
    if (!confirm(tr('career.resetAsk'))) return;
    resetCareer(); renderCareer();
  });
  function renderCareer() {
    const c = loadCareer(), s = c.sum, kills = totalKills(s);
    const tile = (v: string, label: string) => `<div><b>${v}</b><span>${label}</span></div>`;
    $('careerTop').innerHTML = c.played
      ? tile(fmtInt(c.played), tr('career.played')) + tile(`${fmtInt(c.won)} <small>${fmtPct(c.won / c.played)}</small>`, tr('career.won')) + tile(fmtInt(kills), tr('career.kills')) + tile(fmtPct(accuracy(s)), tr('career.accuracy')) + tile(fmtDist(s.distance), tr('career.driven'))
      : `<p class="sub">${tr('career.empty')}</p>`;
    const row = (k: string, v: string) => `<dt>${k}</dt><dd>${v}</dd>`;
    const byType = Object.entries(s.byType).sort((a, b) => b[1] - a[1]).map(([t, n]) => row(tr('career.killsType', { type: (ENEMY_NAME[t] ?? t).toLowerCase() }), fmtInt(n))).join('');
    const times = Object.entries(c.bestTime).map(([l, t]) => row(tr('career.bestTime', { n: l }), fmtTime(t))).join('');
    const groups: [string, string][] = [
      [tr('career.gFire'), row(tr('career.accuracyRow'), `${fmtPct(accuracy(s))} <small>${fmtInt(s.hits)}/${fmtInt(s.shots)}</small>`)
        + row(tr('career.missiles'), fmtInt(s.missiles))
        + KILL_WEAPONS.map((w) => row(w === 'other' ? tr('career.killsOther') : tr('career.killsBy', { weapon: w === 'air' ? WEAPON_NAME[w] : WEAPON_NAME[w].toLowerCase() }), fmtInt(s.kills[w]))).join('')
        + row(tr('career.flank'), fmtInt(s.flank))
        + row(tr('career.dealt'), fmtInt(s.dealt))
        + row(tr('career.longest'), tr('unit.meters', { n: Math.round(s.longest / PX_PER_M) }))],
      [tr('career.gSurvive'), row(tr('career.taken'), fmtInt(s.taken))
        + row(tr('career.absorbed'), fmtInt(s.absorbed))
        + row(tr('career.hitSides'), `${fmtInt(s.hitsFront)} · ${fmtInt(s.hitsSide)} · ${fmtInt(s.hitsRear)}`)
        + row(tr('career.repaired'), fmtInt(s.repaired))
        + row(tr('career.kitsUsed'), fmtInt(s.kitsUsed))
        + row(tr('career.deaths'), fmtInt(c.deaths))
        + row(tr('career.alliesLost'), fmtInt(s.alliesLost))],
      [tr('career.gMove'), row(tr('career.distance'), fmtDist(s.distance))
        + row(tr('career.time'), fmtTime(s.time))
        + row(tr('career.flattened'), fmtArea(s.cells))
        + row(tr('career.crates'), fmtInt(s.crates))
        + times],
      [tr('career.gHonours'), row(tr('career.bestStreak'), fmtInt(s.bestStreak))
        + row(tr('streak.2'), tr('unit.times', { n: fmtInt(s.double) }))
        + row(tr('streak.5'), tr('unit.times', { n: fmtInt(s.ace) }))
        + row(tr('streak.10'), tr('unit.times', { n: fmtInt(s.legend) }))
        + row(tr('career.strikes'), tr('unit.runs', { n: fmtInt(s.strikes) }))
        + row(tr('career.asTank'), tr('career.classRow', { missions: fmtInt(c.perClass.tank.missions), kills: fmtInt(c.perClass.tank.kills) }))
        + row(tr('career.asApc'), tr('career.classRow', { missions: fmtInt(c.perClass.apc.missions), kills: fmtInt(c.perClass.apc.kills) }))
        + byType],
    ];
    $('careerGrid').innerHTML = groups.map(([t, rows]) => `<section><h3>${t}</h3><dl>${rows}</dl></section>`).join('');
  }
}

/** the few numbers that tell how the mission went, on the result screen */
export function showResultStats(m: MissionStats) {
  const k = totalKills(m);
  const split = [[tr('stats.wCannon'), m.kills.cannon], [tr('stats.wMissile'), m.kills.missile], [tr('stats.wMg'), m.kills.mg], [tr('stats.wAir'), m.kills.air]].filter(([, n]) => n).map(([w, n]) => `${w} ${n}`).join(' · ');
  const title = tr(m.legend ? 'streak.10' : m.ace ? 'streak.5' : m.double ? 'streak.2' : 'stats.streakNone');
  const tiles: [string, string, string][] = [
    [m.shots ? fmtPct(accuracy(m)) : '–', tr('stats.accuracy'), tr('stats.shells', { hits: m.hits, shots: m.shots })],
    [fmtInt(k), tr('stats.kills'), split || tr('stats.noKills')],
    [fmtInt(m.flank), tr('stats.flank'), tr('stats.flankNote')],
    [fmtInt(m.dealt), tr('stats.dealt'), [tr('stats.taken', { n: fmtInt(m.taken) }), m.absorbed > 0.5 ? tr('stats.absorbed', { n: fmtInt(m.absorbed) }) : ''].filter(Boolean).join(' · ')],
    [fmtDist(m.distance), tr('stats.driven'), m.cells ? tr('stats.flattened', { area: fmtArea(m.cells) }) : ''],
    [fmtInt(m.bestStreak), tr('stats.streak'), m.bestStreak >= 2 ? title : ''],
  ];
  $('resultStats').innerHTML = tiles.map(([v, l, sub]) => `<div><b>${v}</b><span>${l}</span>${sub ? `<small>${sub}</small>` : ''}</div>`).join('');
}
