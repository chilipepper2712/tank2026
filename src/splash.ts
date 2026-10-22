import { t } from './lang';

/*
 * Menu backdrop: battlefield scenes as seen by security cameras, one after another through a cut to
 * black, under a dark veil, with scanlines, a rolling bar and a camera overlay (REC, camera name, clock).
 * Pictures are public/art/splash-N.jpg; until those exist it borrows level key art.
 */

const SHOTS = [
  { img: 'art/splash-1.jpg', stand: 'art/level-01.jpg' },
  { img: 'art/splash-2.jpg', stand: 'art/level-04.jpg' },
  { img: 'art/splash-3.jpg', stand: 'art/level-05.jpg' },
  { img: 'art/splash-4.jpg', stand: 'art/level-10.jpg' },
];
/** seconds each camera is shown, and the cut to black between two */
const HOLD = 7, CUT = 0.45;

const pad = (n: number) => String(n).padStart(2, '0');

export function initSplash() {
  const el = document.getElementById('splash') as HTMLElement;
  const pic = el.querySelector('.sp-pic') as HTMLElement, black = el.querySelector('.sp-black') as HTMLElement;
  const cam = el.querySelector('.sp-cam') as HTMLElement, clock = el.querySelector('.sp-clock') as HTMLElement;
  // each shot uses its own picture once it has loaded, the stand-in until then
  const src = SHOTS.map((s) => s.stand);
  SHOTS.forEach((s, k) => { const im = new Image(); im.onload = () => { src[k] = s.img; if (k === at) show(k); }; im.src = s.img; });
  let at = 0, timer = 0, running = false;
  const show = (k: number) => {
    pic.style.backgroundImage = `url(${src[k]})`;
    cam.textContent = t('splash.cam', { n: pad(k + 1), place: t(`splash.place.${k + 1}`) });
  };
  const next = () => {
    black.classList.add('on');
    setTimeout(() => { at = (at + 1) % SHOTS.length; show(at); black.classList.remove('on'); }, CUT * 1000);
  };
  const tick = () => {
    const d = new Date();
    clock.textContent = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };
  let clockT = 0;
  show(0);
  return {
    /** shown behind the menus, stopped (and hidden) during a battle */
    set(on: boolean) {
      if (on === running) return;
      running = on; el.hidden = !on;
      clearInterval(timer); clearInterval(clockT);
      if (on) { tick(); timer = window.setInterval(next, HOLD * 1000); clockT = window.setInterval(tick, 1000); }
    },
  };
}
