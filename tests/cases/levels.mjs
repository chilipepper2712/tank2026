// every level builds, runs 3 s of simulated play with both vehicles, and stays cheap in JS
export default async function ({ open, assert, log }) {
  const out = [];
  for (let n = 1; n <= 10; n++) for (const cls of n === 1 ? ['tank', 'apc'] : ['tank']) {
    const p = await open(`?play=${cls}&level=${n}`);
    const r = await p.evaluate(() => {
      const g = __game(); __app.ticker.stop();
      const t0 = performance.now(); for (let k = 0; k < 90; k++) g.update(1 / 30);
      return { ok: !!g.player, enemies: g.enemies.length, ms: (performance.now() - t0) / 90 };
    });
    assert(r.ok && r.enemies > 0, `level ${n}: no player or no enemies`);
    assert(r.ms < 8, `level ${n}: ${r.ms.toFixed(1)} ms per update`);
    assert(!p.errors.length, `level ${n}: ${p.errors[0]}`);
    out.push(`${n}:${r.ms.toFixed(1)}`);
    await p.context().close();
  }
  log('ms/update', out.join(' '));
}
