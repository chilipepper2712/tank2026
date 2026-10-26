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

  // a thumb that lands just off the fire button, towards the corner, still fires and keeps the target
  const q = await open('?play=tank&level=1');
  const r = await q.evaluate(() => {
    const g = __game(), c = __app.canvas, b = document.getElementById('fireBtn').getBoundingClientRect();
    const cx = b.left + b.width / 2, cy = b.top + b.height / 2, rad = b.width / 2;
    g.player.lock = g.enemies[0];
    const locked = g.player.lock;
    const touch = (type, id, x, y) => { const t = new Touch({ identifier: id, target: c, clientX: x, clientY: y }); c.dispatchEvent(new TouchEvent(type, { touches: type === 'touchend' ? [] : [t], changedTouches: [t], bubbles: true, cancelable: true })); };
    const out = {};
    // 20 px past the edge, towards the bottom-right corner
    const d = (rad + 20) / Math.SQRT2;
    touch('touchstart', 5, cx + d, cy + d); out.near = g.input.fireHeld; out.kept = g.player.lock === locked;
    touch('touchend', 5, cx + d, cy + d); out.released = !g.input.fireHeld;
    // 60 px past the edge: not the button's, so it retargets and does not fire
    touch('touchstart', 6, cx + rad + 60, cy); out.far = g.input.fireHeld;
    touch('touchend', 6, cx + rad + 60, cy);
    return out;
  });
  assert(r.near && r.kept && r.released, `near-miss on fire: ${JSON.stringify(r)}`);
  assert(!r.far, 'a touch 60 px off the fire button fired');
  assert(!q.errors.length, q.errors[0]);
}
