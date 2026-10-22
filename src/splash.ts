import { t } from './lang';

/*
 * Menu backdrop: battlefield scenes as seen by security cameras, one after another through a cut to
 * black, under a dark veil, with scanlines, a rolling bar and a camera overlay: REC and the game's
 * version, the camera's name, a military date-time group, and coordinates and a satellite readout
 * whose last digits never sit still (made up: it only has to look like a live feed).
 */

const SHOTS = [
  { img: 'art/splash-1.jpg', at: [48.2021, 37.7477] },
  { img: 'art/splash-2.jpg', at: [48.6113, 38.0152] },
  { img: 'art/splash-3.jpg', at: [48.9478, 38.4904] },
];
/** seconds each camera is shown, and the cut to black between two */
const HOLD = 7, CUT = 0.45;

const pad = (n: number, w = 2) => String(n).padStart(w, '0');
/** degrees as 48°12'07.3" */
const dms = (v: number) => {
  const d = Math.floor(v), m = Math.floor((v - d) * 60), s = ((v - d) * 60 - m) * 60;
  return `${pad(d)}°${pad(m)}'${s.toFixed(1).padStart(4, '0')}"`;
};

export function initSplash() {
  const el = document.getElementById('splash') as HTMLElement;
  const q = (c: string) => el.querySelector(c) as HTMLElement;
  const pic = q('.sp-pic'), black = q('.sp-black'), cam = q('.sp-cam'), dtg = q('.sp-dtg'), pos = q('.sp-pos'), scan = q('.sp-scan-t');
  q('.sp-ver').textContent = t('splash.version', { v: __APP_VERSION__ });
  for (const s of SHOTS) new Image().src = s.img; // warm the cache, so a cut never shows an empty frame
  const months = t('splash.months').split(' ');
  let at = 0, timer = 0, live = 0, running = false;
  const show = (k: number) => {
    pic.style.backgroundImage = `url(${SHOTS[k].img})`;
    cam.textContent = t('splash.cam', { n: pad(k + 1), place: t(`splash.place.${k + 1}`) });
  };
  const next = () => {
    black.classList.add('on');
    setTimeout(() => { at = (at + 1) % SHOTS.length; show(at); black.classList.remove('on'); }, CUT * 1000);
  };
  const tick = () => {
    const d = new Date();
    // date-time group, Zulu time: DD HHMM:SSZ MON YY
    dtg.textContent = `${pad(d.getUTCDate())} ${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}Z ${months[d.getUTCMonth()] ?? ''} ${pad(d.getUTCFullYear() % 100)}`;
    const [la, lo] = SHOTS[at].at, j = () => (Math.random() - 0.5) * 0.00012;
    pos.textContent = `N ${dms(la + j())}  E ${dms(lo + j())}`;
    scan.textContent = t('splash.scan', { sat: 7, hex: Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0'), pct: 84 + Math.floor(Math.random() * 12) });
  };
  show(0);
  return {
    /** shown behind the menus, stopped (and hidden) during a battle */
    set(on: boolean) {
      if (on === running) return;
      running = on; el.hidden = !on;
      clearInterval(timer); clearInterval(live);
      if (on) { tick(); timer = window.setInterval(next, HOLD * 1000); live = window.setInterval(tick, 160); }
    },
  };
}
