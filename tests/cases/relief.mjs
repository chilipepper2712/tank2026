// level 8: holding the oasis 40 s brings the relief column and two A-10 runs, then the area can be cleared
export default async function ({ open, assert, log }) {
  const p = await open('?play=tank&level=8');
  const r = await p.evaluate(() => {
    const g = __game(), P = g.player, z = g.level.mission.zone; __app.ticker.stop(); let at = -1;
    for (let k = 0; k < 30 * 200 && !g.ended; k++) {
      P.hp = P.spec.hp; P.x = z.x; P.y = z.y; g.update(1 / 30);
      if (k % 30 === 0) for (const e of g.enemies) if (!e.dead && Math.hypot(e.x - z.x, e.y - z.y) < z.r + 60) { e.hp = 0; g.kill(e); }
      if (at < 0 && g.ms.relieved) at = g.time;
      if (g.ms.relieved && k % 60 === 0) { const e = g.enemies.find((e) => !e.dead); if (e) { e.hp = 0; g.kill(e); } }
    }
    return { at, friends: g.friends.length, won: g.missionOutcome()[0] };
  });
  assert(r.at > 38 && r.at < 60, `relief at ${r.at.toFixed(1)} s`);
  assert(r.friends >= 5, `${r.friends} relief tanks`);
  assert(r.won, 'not won after the relief');
  assert(!p.errors.length, p.errors[0]);
  log(`relief at ${r.at.toFixed(1)} s`);
}
