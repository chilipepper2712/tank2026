// weather: each kind runs cheaply; what lies beyond sight can neither be targeted nor shoot; lightning lights the field
export default async function ({ open, assert, log }) {
  const out = [];
  for (const [w, lv] of [['fog', 1], ['rain', 1], ['storm', 1], ['sand', 8]]) {
    const p = await open(`?play=tank&level=${lv}&weather=${w}`);
    const r = await p.evaluate(() => {
      const g = __game(), P = g.player; __app.ticker.stop();
      const t0 = performance.now(); for (let k = 0; k < 90; k++) g.update(1 / 30); const ms = (performance.now() - t0) / 90;
      for (const a of g.allies) a.dead = true; // the tank would rightly shoot at a companion it can see
      const v = g.weather.spec.vis, e = g.enemies.find((e) => !e.dead && !e.flying && e.kind !== 'infantry');
      // an enemy tank parked beyond sight, facing the player, in range of its gun
      e.x = P.x + v + 30; e.y = P.y; e.spec = { ...e.spec, speed: 0.01, weapon: { ...e.spec.weapon, range: 1000 } }; e.active = true; e.squad = -1;
      P.lock = null; g.pointTarget = null;
      g.weather.nextBolt = 99; // no lightning while sight is checked (it lights both sides up)
      const hp = P.hp, shells = () => (e.recoil > 0.9 ? 1 : 0); // this tank's gun just went off
      let fired = 0;
      for (let k = 0; k < 150; k++) { g.update(1 / 30); fired += shells(); }
      const near = g.nearestTarget(), alpha = e.view.root.alpha;
      // control: the same tank inside sight does fire
      e.x = P.x + v * 0.6; let firedIn = 0;
      for (let k = 0; k < 150 && !firedIn; k++) { g.update(1 / 30); firedIn += shells(); }
      // lightning: storms strike within their interval
      let bolt = false;
      if (g.weather.spec.lightning) g.weather.nextBolt = g.weather.spec.lightning[1];
      if (g.weather.spec.lightning) for (let k = 0; k < 30 * 16 && !bolt; k++) { g.update(1 / 30); bolt = g.visR === Infinity; }
      return { ms, near: near === e, alpha, fired, firedIn, bolt, hurt: P.hp < hp };
    });
    assert(r.ms < 8, `${w}: ${r.ms.toFixed(1)} ms per update`);
    assert(!r.near && r.alpha === 0, `${w}: an enemy beyond sight is ${r.near ? 'targetable' : `drawn (alpha ${r.alpha})`}`);
    assert(!r.fired, `${w}: an enemy beyond sight fired`);
    assert(r.firedIn, `${w}: control failed, the tank inside sight never fired`);
    if (w === 'storm') assert(r.bolt, 'storm: no lightning in 16 s');
    assert(!p.errors.length, `${w}: ${p.errors[0]}`);
    out.push(`${w} ${r.ms.toFixed(1)}ms`);
    await p.context().close();
  }
  // the briefing names the weather where it can change, and not where it cannot
  const p = await open('', { storage: { 'tank2026.campaign': '{"unlocked":10}' } });
  await p.goto(p.url()); await p.waitForTimeout(500);
  const row = async (n) => { await p.click(`#levelRow button:nth-child(${n + 1})`); await p.click('.card[data-class=tank]'); await p.click('#goBtn'); await p.waitForTimeout(100);
    const v = await p.locator('#bWea').isVisible(); await p.click('#briefBack'); return v; };
  assert(await row(3) && !(await row(1)), 'weather line in the briefing');
  log(out.join(' · '));
}
