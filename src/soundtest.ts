import { LOOPS, SOUNDS, sfx } from './audio/Sfx';

/** ?sounds — lists every sound the game asks for, which files were found, and plays each one. */
const GROUPS: [string, string[]][] = [
  ['Xe mình', ['cannon', 'mg_burst', 'autocannon_burst', 'missile_launch', 'reload_ready', 'repair_start', 'repair_done', 'pickup', 'engine_idle', 'engine_move']],
  ['Đạn trúng và nổ', ['hit_armor', 'hit_ricochet', 'explode_small', 'explode_vehicle', 'building_collapse', 'explode_mine']],
  ['Địch', ['enemy_cannon', 'enemy_rpg', 'drone_loop', 'kamikaze_whine', 'kamikaze_rush']],
  ['Yểm trợ A-10', ['strike_warning', 'jet_flyby', 'gau8_burst', 'bomb_whistle']],
  ['Đêm và thời tiết', ['flare_launch', 'rain_loop', 'thunder']],
  ['Giọng AI trong xe', ['vo_missile_ready', 'vo_repair_done', 'vo_airstrike_ready', 'vo_drone', 'vo_armor_low', 'vo_stage_clear', 'vo_reinforce', 'vo_win', 'vo_lose']],
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
        const n = sfx.count(name), src = sfx.source(name);
        btn.disabled = !src;
        const what = src === 'made' ? '✓ tạo bằng code' : src === 'borrowed' ? '~ mượn âm khác' : src ? `✓ ${n} file` : '✗ chưa có';
        btn.innerHTML = `<b>${name}</b><span>${what}${src && loop ? ' · lặp' : ''}</span>`;
        btn.classList.toggle('ok', src === 'file' || src === 'made');
      };
      rows.push(refresh);
      let on = false;
      btn.addEventListener('click', () => {
        if (loop) {
          on = !on; btn.classList.toggle('playing', on);
          if (name === 'drone_loop') sfx.drone(on ? 1 : 0, 0);
          else if (name === 'rain_loop') sfx.rain(on ? 1 : 0);
          else sfx.engine(name === 'engine_move' ? (on ? 1 : -1) : (on ? 0 : -1), 1);
        } else sfx.play(name, undefined, undefined, { prio: true });
      });
      grid.appendChild(btn);
      refresh();
    }
  }
  const tick = () => {
    rows.forEach((f) => f());
    found = 0; for (const [, names] of GROUPS) for (const n of names) if (sfx.source(n)) found++;
    sum.textContent = `${found}/${total} âm thanh đã có (file, tạo bằng code hoặc mượn). Thiếu thì game im lặng ở chỗ đó.`;
    state.textContent = sfx.state === 'running' ? 'âm thanh: bật' : 'chạm vào màn hình để bật âm thanh';
  };
  tick(); setInterval(tick, 700);
  void SOUNDS;
}
