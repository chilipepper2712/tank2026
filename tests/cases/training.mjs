// recruit training: a bot walks through every station; a new player lands on it first and can skip it
export default async function ({ open, assert, log }) {
  // a fresh player: the menu picks training, a class card leads to its briefing with a skip button
  let p = await open('');
  await p.goto(p.url()); await p.waitForTimeout(600);
  assert(await p.locator('#levelRow button[aria-pressed=true]').textContent() === 'HL', 'training is not preselected for a new player');
  await p.click('.card[data-class=apc]'); await p.waitForTimeout(200);
  // the story panels come first: next through one, skip the rest, then the orders with the skip button
  assert(await p.locator('#brief').isVisible() && await p.locator('#storyText').isVisible(), 'training story not shown before the briefing');
  const first = await p.locator('#storyText').textContent();
  await p.click('#storyNext'); await p.waitForTimeout(100);
  assert(await p.locator('#storyText').textContent() !== first, 'next did not turn the story panel');
  await p.click('#storySkip'); await p.waitForTimeout(100);
  assert(await p.locator('#briefSkip').isVisible() && await p.locator('#bTask').isVisible(), 'training briefing or its skip button missing');
  await p.click('#briefSkip'); await p.waitForTimeout(200);
  assert(await p.locator('#prep').isVisible(), 'skip did not lead to the companion picker');
  assert(await p.evaluate(() => localStorage.getItem('tank2026.trained')) === '1', 'skip not remembered');
  assert(!p.errors.length, p.errors[0]);

  for (const cls of ['tank', 'apc']) {
    p = await open(`?play=${cls}&level=0`);
    const r = await p.evaluate(() => {
      const g = __game(), P = g.player, T = g.training, I = g.input; __app.ticker.stop();
      const times = [];
      let frames = 0, minHp = P.hp;
      const run = (k, max, each) => {
        for (let f = 0; f < max && T.k === k && !T.done; f++) { each?.(f); g.update(1 / 30); frames++; minHp = Math.min(minHp, P.hp); }
        times.push(T.k === k ? -1 : +(frames / 30).toFixed(1)); frames = 0;
        for (let f = 0; f < 60 && T.pause > 0; f++) g.update(1 / 30); // the "done" beat
      };
      const near = (u, d, a = Math.PI) => { P.x = u.x + Math.cos(a) * d; P.y = u.y + Math.sin(a) * d; };
      const coach = () => document.getElementById('coachTitle').textContent;
      const titles = [coach()];
      // 1 drive to both rings
      run(0, 300, (f) => { const q = T.goal(); if (q && f % 20 === 0) { P.x = q[0]; P.y = q[1]; } });
      titles.push(coach());
      // 2 lock and fire
      run(1, 900, () => { near(T.target, 250); P.lock = T.target; I.keys.add(' '); });
      titles.push(coach());
      // 3 flank: from the tank's left side
      run(2, 900, () => { const t = T.target; near(t, 220, t.hull + Math.PI / 2); P.lock = t; });
      titles.push(coach());
      I.keys.delete(' ');
      // 4 missiles only
      const t4 = T.target;
      run(3, 900, (f) => { near(t4, 250, t4.hull + Math.PI / 2); P.lock = t4; if (f % 15 === 0) I.missileQueued = true; });
      titles.push(coach());
      // 5 crate: wait for it to land, drive over it
      run(4, 600, () => { const c = g.crates.find((c) => c.z === 0); if (c) { P.x = c.x; P.y = c.y; } });
      titles.push(coach());
      // 6 repair: stand still
      run(5, 600, (f) => { if (f === 2) I.repairQueued = true; });
      titles.push(coach());
      // 7 A-10 on the group
      let left = -1;
      run(6, 900, (f) => {
        const u = g.enemies.find((e) => !e.dead && e.dummy);
        if (u && f === 0) { near(u, 260); P.lock = u; g.airQueued = true; }
        if (f === 150) { left = g.enemies.filter((e) => !e.dead).length; I.keys.add(' '); } // the run is over: finish off what is left
        if (u && f > 150) P.lock = u;
      });
      I.keys.delete(' ');
      titles.push(coach());
      // 8 live fight: hunt each enemy down
      I.keys.add(' ');
      run(7, 3600, () => {
        const u = g.enemies.find((e) => !e.dead);
        if (!u) return;
        if (u.hidden) { u.hidden = false; u.revealT = 9; }
        near(u, 180); P.lock = u;
      });
      I.keys.delete(' ');
      for (let f = 0; f < 120; f++) g.update(1 / 30); // the end screen follows 1.6 s after
      return { times, titles, left, done: T.done, dead: P.dead, minHp: Math.round(minHp), support: localStorage.getItem('tank2026.support') };
    });
    await p.waitForTimeout(300);
    const res = await p.evaluate(() => [document.getElementById('result').hidden, document.getElementById('resultTitle').textContent, localStorage.getItem('tank2026.trained')]);
    assert(r.done, `${cls}: stuck at station ${r.times.indexOf(-1) + 1} (${r.titles.at(-1)}); times ${r.times.join(' ')}`);
    assert(!r.dead && r.minHp > 0, `${cls}: the vehicle was destroyed in training`);
    assert(!r.support, `${cls}: training saved an air-support charge`);
    assert(!res[0] && res[1] === 'TỐT NGHIỆP TÂN BINH' && res[2] === '1', `${cls}: end screen ${res}`);
    assert(!p.errors.length, p.errors[0]);
    log(`${cls} ${r.times.join('/')}s, A-10 left ${r.left}`);
    await p.context().close();
  }
}
