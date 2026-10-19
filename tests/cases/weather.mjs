// rain: cheap, looks only, lightning now and then; night flares: the player's run out, enemies send theirs up when hunting
export default async function ({ open, assert, log }) {
  let p = await open('?play=tank&level=2&weather=rain');
  const r = await p.evaluate(() => {
    const g = __game(); __app.ticker.stop();
    const t0 = performance.now(); for (let k = 0; k < 90; k++) g.update(1 / 30); const ms = (performance.now() - t0) / 90;
    let bolt = 0; for (let k = 0; k < 30 * 30 && !bolt; k++) { g.update(1 / 30); if (g.weather.bolt > 0) bolt = k / 30; }
    return { ms, bolt, flareBtn: !document.getElementById('flareBtn').hidden };
  });
  assert(r.ms < 8, `rain: ${r.ms.toFixed(1)} ms per update`);
  assert(r.bolt > 0, 'rain: no lightning in 30 s');
  assert(!r.flareBtn, 'the flare button shows by day');
  assert(!p.errors.length, p.errors[0]);
  await p.context().close();

  p = await open('?play=apc&level=5');
  const n = await p.evaluate(() => {
    const g = __game(), P = g.player; __app.ticker.stop();
    const fired = [];
    for (let k = 0; k < 6; k++) { g.flareQueued = true; for (let f = 0; f < 60; f++) g.update(1 / 30); fired.push(g.flaresLeft); }
    const own = g.flares.filter((f) => f.own).length;
    // a hunting enemy close by sends a flare up over the player
    const e = g.enemies.find((e) => !e.dead && !e.flying && e.kind !== 'infantry');
    e.x = P.x + 300; e.y = P.y; e.active = true; g.enemyFlareT = 1;
    for (let f = 0; f < 60; f++) g.update(1 / 30);
    const theirs = g.flares.find((f) => !f.own);
    return { fired, own, theirs: theirs ? Math.hypot(theirs.x - P.x, theirs.y - P.y) : -1 };
  });
  assert(n.fired.join() === '3,2,1,0,0,0', `player flares left after each try: ${n.fired}`);
  assert(n.theirs >= 0 && n.theirs < 120, `enemy flare ${n.theirs < 0 ? 'never fired' : `${Math.round(n.theirs)} px from the player`}`);
  assert(!p.errors.length, p.errors[0]);
  log(`rain ${r.ms.toFixed(1)}ms, lightning at ${r.bolt.toFixed(0)} s · flares ${n.fired.join('/')}`);
}
