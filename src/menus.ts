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

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const ic = (id: string, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const num = (v: number, digits = 0) => v.toLocaleString('vi-VN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const GROUPS: Group[] = ['fire', 'protect', 'move', 'support'];
const CLASS_NAME: Record<ClassId, string> = { tank: 'Xe tăng', apc: 'Xe bọc thép' };

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
    $('storySub').textContent = `Đã mở ${Math.min(top, LEVELS.length)}/${LEVELS.length} màn`;
    box.innerHTML = '';
    for (const l of LEVELS) {
      const st = STORY.find((s) => s.level === l.n), open = l.n <= top, ready = open && !!l.build;
      const card = document.createElement('button');
      card.className = 'scard' + (open ? '' : ' locked');
      card.disabled = !ready;
      const art = st?.cover ? `<img src="${st.cover}" alt="">` : `<div class="panels"><i></i><i></i><i></i></div><span>${open ? 'Comic sắp có' : ''}</span>`;
      card.innerHTML = `<div class="frame">${art}${open ? '' : ic('lock', 'lockic')}</div>
        <em>MÀN ${l.n} · ${l.area.toUpperCase()}</em><strong>${st?.headline ?? l.title}</strong>
        <small>${!open ? 'Chưa mở khóa' : !l.build ? 'Đang xây dựng' : l.brief.situation}</small>`;
      card.addEventListener('click', () => { h.pickLevel(l.n); close(); });
      box.appendChild(card);
    }
  }

  // ---------- upgrades ----------
  let tab: ClassId = 'tank';
  $('navUp').addEventListener('click', () => open(screens.up, renderUpgrades));
  for (const t of document.querySelectorAll<HTMLElement>('[data-tab]')) t.addEventListener('click', () => { tab = t.dataset.tab as ClassId; renderUpgrades(); });
  $('resetProg').addEventListener('click', () => {
    if (!confirm('Xóa toàn bộ nâng cấp đã giữ của cả hai class?')) return;
    resetPerm(); h.upgradesReset(); renderUpgrades();
  });
  function renderUpgrades() {
    for (const t of document.querySelectorAll<HTMLElement>('[data-tab]')) t.setAttribute('aria-selected', String(t.dataset.tab === tab));
    const perm = loadPerm(tab), owned = UP_IDS.reduce((n, k) => n + Math.min(MAX_LEVEL, perm[k]), 0);
    $('upSub').textContent = `${CLASS_NAME[tab]}: đã giữ ${owned}/${UP_IDS.length * MAX_LEVEL} cấp · nhặt thùng vàng trong màn, thắng thì giữ vĩnh viễn 1 món`;
    $('upGrid').innerHTML = GROUPS.map((g) => {
      const tiles = UP_IDS.filter((k) => UPGRADES[k].group === g).map((k) => {
        const lv = Math.min(MAX_LEVEL, perm[k]), m = UP_METRIC[k], series = metricSeries(tab, k);
        const pips = Array.from({ length: MAX_LEVEL }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('');
        const vals = series.map((v, i) => (i === lv ? `<b>${num(v, m.digits)}</b>` : num(v, m.digits))).join(' › ');
        return `<article class="uptile${lv ? ' own' : ''}${lv >= MAX_LEVEL ? ' max' : ''}">
          <div class="uphead">${ic(UP_ICON[k])}<strong>${UPGRADES[k].name}</strong><span class="lvpips" aria-label="cấp ${lv}/${MAX_LEVEL}">${pips}</span></div>
          <p>${UPGRADES[k].perLevel}</p><p class="metric">${vals} <small>${m.unit}</small></p></article>`;
      });
      for (const p of PLANNED.filter((p) => p.group === g)) {
        tiles.push(`<article class="uptile locked"><div class="uphead">${ic(p.icon)}<strong>${p.name}</strong><span class="soon">${ic('lock')}sắp có</span></div><p>${p.note}</p></article>`);
      }
      return `<section class="upcol"><h3>${GROUP_NAME[g]}</h3>${tiles.join('')}</section>`;
    }).join('');
    const allies: [AllyType, string][] = [['attackDrone', 'drone'], ['interceptor', 'drone'], ['robot', 'robot'], ['repairDroid', 'wrench']];
    $('allyGrid').innerHTML = allies.map(([t, icon]) => {
      const a = ALLIES[t], w = a.weapon;
      const fire = t === 'repairDroid' ? `sửa ${num(REPAIR_DROID_RATE * 100)}% máu xe/giây` : `${num(w.dmg)}${w.burst > 1 ? ` × ${w.burst}` : ''} mỗi ${num(w.reload, w.reload % 1 ? 1 : 0)} giây`;
      const rows = [['Máu', num(a.hp)], ['Hỏa lực', fire], ...(w.range ? [['Tầm', `${Math.round(w.range / PX_PER_M)} m`]] : [])];
      const ups = ALLY_UPGRADES[t].map((u) => `<li>${u.name}: ${u.perLevel}</li>`).join('');
      return `<article class="allycard"><div class="uphead">${ic(icon)}<strong>${a.title}</strong></div><em>${a.role}${t === 'repairDroid' ? '. Đi kèm khi Kit sửa chữa đạt cấp 3, không chiếm chỗ' : ''}</em>
        <dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>${ups ? `<ul>${ups}</ul>` : ''}</article>`;
    }).join('');
  }

  // ---------- career ----------
  $('navCareer').addEventListener('click', () => open(screens.career, renderCareer));
  $('resetCareer').addEventListener('click', () => {
    if (!confirm('Xóa toàn bộ hồ sơ chiến đấu (mọi chỉ số đã ghi)?')) return;
    resetCareer(); renderCareer();
  });
  function renderCareer() {
    const c = loadCareer(), s = c.sum, kills = totalKills(s);
    const tile = (v: string, label: string) => `<div><b>${v}</b><span>${label}</span></div>`;
    $('careerTop').innerHTML = c.played
      ? tile(fmtInt(c.played), 'trận') + tile(`${fmtInt(c.won)} <small>${fmtPct(c.won / c.played)}</small>`, 'thắng') + tile(fmtInt(kills), 'xe địch hạ') + tile(fmtPct(accuracy(s)), 'chính xác pháo') + tile(fmtDist(s.distance), 'đã lái')
      : '<p class="sub">Chưa có trận nào. Đánh xong một màn (thắng hay thua) là hồ sơ bắt đầu ghi.</p>';
    const row = (k: string, v: string) => `<dt>${k}</dt><dd>${v}</dd>`;
    const byType = Object.entries(s.byType).sort((a, b) => b[1] - a[1]).map(([t, n]) => row(`Hạ ${(ENEMY_NAME[t] ?? t).toLowerCase()}`, fmtInt(n))).join('');
    const times = Object.entries(c.bestTime).map(([l, t]) => row(`Nhanh nhất màn ${l}`, fmtTime(t))).join('');
    const groups: [string, string][] = [
      ['Hỏa lực', row('Độ chính xác pháo', `${fmtPct(accuracy(s))} <small>${fmtInt(s.hits)}/${fmtInt(s.shots)}</small>`)
        + row('Tên lửa đã phóng', fmtInt(s.missiles))
        + KILL_WEAPONS.map((w) => row(w === 'other' ? 'Hạ cách khác (mìn, nổ lan)' : `Hạ bằng ${w === 'air' ? 'A-10' : WEAPON_NAME[w].toLowerCase()}`, fmtInt(s.kills[w]))).join('')
        + row('Hạ từ hông, đuôi', fmtInt(s.flank))
        + row('Sát thương gây ra', fmtInt(s.dealt))
        + row('Phát hạ xa nhất', `${Math.round(s.longest / PX_PER_M)} m`)],
      ['Sống sót', row('Sát thương vào thân xe', fmtInt(s.taken))
        + row('Giáp phụ, lồng đỡ được', fmtInt(s.absorbed))
        + row('Trúng đạn trước · hông · sau', `${fmtInt(s.hitsFront)} · ${fmtInt(s.hitsSide)} · ${fmtInt(s.hitsRear)}`)
        + row('Máu đã sửa', fmtInt(s.repaired))
        + row('Kit sửa đã dùng', fmtInt(s.kitsUsed))
        + row('Xe bị phá hủy', fmtInt(c.deaths))
        + row('Đồng đội mất', fmtInt(s.alliesLost))],
      ['Cơ động', row('Quãng đường', fmtDist(s.distance))
        + row('Thời gian chiến đấu', fmtTime(s.time))
        + row('Công trình san phẳng', fmtArea(s.cells))
        + row('Thùng hàng nhặt', fmtInt(s.crates))
        + times],
      ['Chiến công', row('Chuỗi hạ dài nhất', fmtInt(s.bestStreak))
        + row('DOUBLE-KILL', `${fmtInt(s.double)} lần`)
        + row('ÁT CHỦ BÀI', `${fmtInt(s.ace)} lần`)
        + row('HUYỀN THOẠI', `${fmtInt(s.legend)} lần`)
        + row('A-10 đã gọi', `${fmtInt(s.strikes)} lượt`)
        + row('Lái xe tăng', `${fmtInt(c.perClass.tank.missions)} trận · ${fmtInt(c.perClass.tank.kills)} hạ`)
        + row('Lái xe bọc thép', `${fmtInt(c.perClass.apc.missions)} trận · ${fmtInt(c.perClass.apc.kills)} hạ`)
        + byType],
    ];
    $('careerGrid').innerHTML = groups.map(([t, rows]) => `<section><h3>${t}</h3><dl>${rows}</dl></section>`).join('');
  }
}

/** the few numbers that tell how the mission went, on the result screen */
export function showResultStats(m: MissionStats) {
  const k = totalKills(m);
  const split = [['pháo', m.kills.cannon], ['tên lửa', m.kills.missile], ['súng máy', m.kills.mg], ['A-10', m.kills.air]].filter(([, n]) => n).map(([w, n]) => `${w} ${n}`).join(' · ');
  const title = m.legend ? 'HUYỀN THOẠI' : m.ace ? 'ÁT CHỦ BÀI' : m.double ? 'DOUBLE-KILL' : 'liên tiếp';
  const tiles: [string, string, string][] = [
    [m.shots ? fmtPct(accuracy(m)) : '–', 'chính xác', `${m.hits}/${m.shots} phát pháo`],
    [fmtInt(k), 'hạ', split || 'chưa hạ xe nào'],
    [fmtInt(m.flank), 'hạ từ hông, đuôi', 'bắn vào chỗ giáp mỏng'],
    [fmtInt(m.dealt), 'sát thương', `nhận ${fmtInt(m.taken)}${m.absorbed > 0.5 ? ` · giáp phụ đỡ ${fmtInt(m.absorbed)}` : ''}`],
    [fmtDist(m.distance), 'đã lái', m.cells ? `san phẳng ${fmtArea(m.cells)}` : ''],
    [fmtInt(m.bestStreak), 'chuỗi dài nhất', m.bestStreak >= 2 ? title : ''],
  ];
  $('resultStats').innerHTML = tiles.map(([v, l, sub]) => `<div><b>${v}</b><span>${l}</span>${sub ? `<small>${sub}</small>` : ''}</div>`).join('');
}
