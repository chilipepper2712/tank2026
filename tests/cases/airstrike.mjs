// a charged A-10 run: 7 bomb circles, all land, kills what stands on the target, never hurts the player
export default async function ({ open, assert, log }) {
  const p = await open('?play=tank&level=1', { storage: { 'tank2026.support': '15' } });
  const r = await p.evaluate(() => {
    const g = __game(), P = g.player; __app.ticker.stop();
    const ts = g.enemies.filter((e) => e.kind === 'tank').slice(0, 2);
    ts.forEach((e, k) => { e.x = P.x + 30 * k - 15; e.y = P.y - 220; e.active = false; e.squad = -1; e.spec = { ...e.spec, speed: 0 }; });
    P.lock = ts[0]; const hp = P.hp;
    g.airQueued = true; g.update(1 / 30);
    const st = g.strikes[0], bombs = st ? st.bombs.length : 0;
    for (let k = 0; k < 150; k++) g.update(1 / 30);
    return { support: g.support, bombs, landed: st ? st.bombs.filter((b) => b.done).length : 0, dead: ts.filter((e) => e.dead).length, hurt: P.hp < hp };
  });
  assert(r.support < 1, `support not spent (${r.support})`); // the machine gun may earn half a point meanwhile
  assert(r.bombs === 7 && r.landed === 7, `bombs ${r.landed}/${r.bombs} landed`);
  assert(r.dead === 2, `${r.dead}/2 targets destroyed`);
  assert(!r.hurt, 'the strike hurt the player');
  assert(!p.errors.length, p.errors[0]);
  log(`bombs ${r.landed}/7, targets ${r.dead}/2`);
}
