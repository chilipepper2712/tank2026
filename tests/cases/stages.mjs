// level 10: capture → hold (relief arrives) → destroy, then the win
export default async function ({ open, assert, log }) {
  const p = await open('?play=tank&level=10');
  const r = await p.evaluate(() => {
    const g = __game(), P = g.player; __app.ticker.stop(); const seen = [];
    for (let k = 0; k < 30 * 400 && !g.ended; k++) {
      P.hp = P.spec.hp; P.x = 950; P.y = 620; g.update(1 / 30);
      if (k % 30 === 0) for (const e of g.enemies) if (!e.dead && Math.hypot(e.x - 950, e.y - 610) < 160 && e.kind !== 'infantry') { e.hp = 0; g.kill(e); }
      if (g.stage === 2 && k % 150 === 0) { const e = g.enemies.find((e) => !e.dead); if (e) { e.hp = 0; g.kill(e); } }
      if (seen[seen.length - 1] !== g.stage) seen.push(g.stage);
    }
    return { seen, ended: g.ended, won: g.missionOutcome()[0], t: g.time };
  });
  assert(r.seen.join() === '0,1,2', `stages seen ${r.seen}`);
  assert(r.ended && r.won, 'finale not won');
  assert(!p.errors.length, p.errors[0]);
  log(`won at ${r.t.toFixed(0)} s`);
}
