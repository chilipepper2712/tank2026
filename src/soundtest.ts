import { LOOPS, SOUNDS, sfx } from './audio/Sfx';

/** ?sounds — lists every sound the game asks for, which files were found, and plays each one. */
const GROUPS: [string, string[]][] = [
  ['Xe mình', ['cannon', 'mg_burst', 'missile_launch', 'reload_ready', 'repair_start', 'repair_done', 'pickup', 'engine_idle', 'engine_move']],
  ['Đạn trúng và nổ', ['hit_armor', 'hit_ricochet', 'explode_small', 'explode_vehicle', 'building_collapse', 'explode_mine']],
  ['Địch', ['enemy_cannon', 'enemy_rpg', 'drone_loop', 'kamikaze_whine']],
  ['Yểm trợ A-10', ['strike_warning', 'jet_flyby', 'gau8_burst', 'bomb_whistle']],
  ['Đêm và thời tiết', ['flare_launch', 'rain_loop', 'thunder']],
  ['Giao diện', ['ui_click', 'ui_alert', 'streak_double', 'streak_ace', 'streak_legend', 'mission_win', 'mission_lose', 'stage_clear']],
];

export function openSoundTest() {
  document.getElementById('menu')!.hidden = true;
  const root = document.createElement('section');
  root.className = 'screen sheet'; root.id = 'soundtest';
  root.innerHTML = '<header class="sheet-head"><h1>THỬ ÂM THANH</h1><span class="sub" id="stState"></span></header><p class="sub" id="stSum"></p><div id="stBody"></div>';
  document.body.appendChild(root);
  const body = root.querySelector('#stBody')!, sum = root.querySelector('#stSum')!, state = root.querySelector('#stState')!;
  let found = 0, total = 0;
  const rows: (() => void)[] = [];
  for (const [title, names] of GROUPS) {
    const h = document.createElement('h2'); h.className = 'sec'; h.textContent = title.toUpperCase(); body.appendChild(h);
    const grid = document.createElement('div'); grid.className = 'stgrid'; body.appendChild(grid);
    for (const name of names) {
      total++;
      const loop = name in LOOPS, btn = document.createElement('button');
      btn.className = 'stbtn';
      const refresh = () => {
        const n = sfx.count(name);
        btn.disabled = n === 0;
        btn.innerHTML = `<b>${name}</b><span>${n ? `✓ ${n} file${loop ? ' · lặp' : ''}` : '✗ chưa có'}</span>`;
        btn.classList.toggle('ok', n > 0);
      };
      rows.push(refresh);
      let on = false;
      btn.addEventListener('click', () => {
        if (loop) {
          on = !on; btn.classList.toggle('playing', on);
          if (name === 'drone_loop') sfx.drone(on ? 1 : 0, 0);
          else sfx.engine(name === 'engine_move' ? (on ? 1 : -1) : (on ? 0 : -1), 1);
        } else sfx.play(name, undefined, undefined, { prio: true });
      });
      grid.appendChild(btn);
      refresh();
    }
  }
  const tick = () => {
    rows.forEach((f) => f());
    found = 0; for (const [, names] of GROUPS) for (const n of names) if (sfx.has(n)) found++;
    sum.textContent = `${found}/${total} âm thanh đã có file. Thiếu thì game im lặng ở chỗ đó.`;
    state.textContent = sfx.state === 'running' ? 'âm thanh: bật' : 'chạm vào màn hình để bật âm thanh';
  };
  tick(); setInterval(tick, 700);
  void SOUNDS;
}
