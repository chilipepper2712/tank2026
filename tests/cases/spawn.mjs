// every level starts with the player's vehicle near the middle of a phone screen, marked for the first seconds
export default async function ({ open, assert, log }) {
  const p = await open('');
  const out = [];
  for (let n = 0; n <= 10; n++) {
    await p.goto(p.url().split('?')[0] + `?play=tank&level=${n}`); await p.waitForTimeout(700);
    const r = await p.evaluate(() => {
      const g = __game(), P = g.player; __app.ticker.stop(); g.update(1 / 30);
      const [x, y] = g.toScreen(P.x, P.y, 8), marked = g.introT > 0 && !!g.youText;
      for (let k = 0; k < 30 * 4; k++) g.update(1 / 30);
      return { x, y, w: innerWidth, h: innerHeight, marked, gone: !g.youText };
    });
    assert(Math.abs(r.x - r.w / 2) < r.w * 0.2 && Math.abs(r.y - r.h / 2) < r.h * 0.2, `level ${n}: vehicle at ${Math.round(r.x)},${Math.round(r.y)} on a ${r.w}×${r.h} screen`);
    assert(r.marked && r.gone, `level ${n}: start marker ${r.marked ? 'never cleared' : 'missing'}`);
    out.push(`${n}:${Math.round(r.x)},${Math.round(r.y)}`);
  }
  assert(!p.errors.length, p.errors[0]);
  log(out.join(' '));
}
