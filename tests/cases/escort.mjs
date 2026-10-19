// level 3 with the road cleared: the convoy follows its route to the end
export default async function ({ open, assert, log }) {
  const p = await open('?play=tank&level=3');
  const r = await p.evaluate(() => {
    const g = __game(), P = g.player; __app.ticker.stop();
    for (const e of g.enemies) { e.hp = 0; e.dead = true; e.view.root.visible = false; }
    for (let k = 0; k < 30 * 240 && !g.ended; k++) {
      const lead = g.convoy.find((c) => !c.dead && !c.arrived) || g.convoy[0];
      P.hp = P.spec.hp; P.x = lead.x - 40; P.y = lead.y; g.update(1 / 30);
    }
    return { arrived: g.convoy.filter((c) => c.arrived).length, t: g.time, won: g.missionOutcome()[0] };
  });
  assert(r.arrived === 3 && r.won, `${r.arrived}/3 trucks arrived`);
  assert(!p.errors.length, p.errors[0]);
  log(`convoy in at ${r.t.toFixed(0)} s`);
}
