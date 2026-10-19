// iOS WebKit sends negative touch identifiers: the drive stick must still take them
export default async function ({ open, assert, log }) {
  const p = await open('?play=tank&level=1');
  const moved = await p.evaluate(async () => {
    const g = __game(), c = __app.canvas, P = g.player, a = [P.x, P.y];
    const mk = (type, x, y) => { const t = new Touch({ identifier: -1490760785, target: c, clientX: x, clientY: y }); return new TouchEvent(type, { touches: type === 'touchend' ? [] : [t], changedTouches: [t], bubbles: true, cancelable: true }); };
    c.dispatchEvent(mk('touchstart', 120, 300));
    for (let k = 1; k <= 10; k++) c.dispatchEvent(mk('touchmove', 120 + k * 5, 300 - k * 4));
    __app.ticker.stop(); for (let k = 0; k < 45; k++) g.update(1 / 30);
    window.dispatchEvent(mk('touchend', 170, 260));
    return Math.round(Math.hypot(P.x - a[0], P.y - a[1]));
  });
  assert(moved > 30, `vehicle moved only ${moved} px`);
  assert(!p.errors.length, p.errors[0]);
  log('moved', moved);
}
