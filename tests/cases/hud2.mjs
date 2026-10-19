// mission button, first-night flare hint, friendly tanks joining the holds on levels 5 and 10
export default async function ({ open, assert, log }) {
  // flare hint: shown on the first night level, gone once a flare is fired, not shown again
  let p = await open('?play=tank&level=5');
  assert(await p.locator('#flareTip').isVisible(), 'flare hint not shown on the first night level');
  assert((await p.locator('#flareTip').textContent()) === 'Bắn pháo sáng để nhìn trong đêm.', 'flare hint text');
  await p.evaluate(() => { const g = __game(); __app.ticker.stop(); g.flareQueued = true; for (let k = 0; k < 5; k++) g.update(1 / 30); });
  assert(!(await p.locator('#flareTip').isVisible()), 'flare hint stays after a flare');
  await p.reload(); await p.waitForTimeout(1200);
  assert(!(await p.locator('#flareTip').isVisible()), 'flare hint shown a second time');
  await p.context().close();

  // mission button: opens a card with the task, pauses, closes back to the game
  p = await open('?play=tank&level=3');
  await p.click('#missionBtn'); await p.waitForTimeout(200);
  assert(await p.locator('#missionScr').isVisible(), 'mission card did not open');
  assert((await p.locator('#mTask').textContent()).includes('Hộ tống'), 'mission card shows the wrong task');
  assert(await p.evaluate(() => __game().paused), 'game not paused behind the mission card');
  await p.click('#missionClose'); await p.waitForTimeout(200);
  assert(!(await p.evaluate(() => __game().paused)) && await p.locator('#hud').isVisible(), 'mission card did not close');
  assert(!p.errors.length, p.errors[0]);
  await p.context().close();

  // level 5: friendly tanks at 60 s of holding
  p = await open('?play=tank&level=5');
  const a = await p.evaluate(() => {
    const g = __game(), P = g.player, z = g.mission.zone; __app.ticker.stop();
    for (const e of g.enemies) { e.hp = 1e6; }
    P.hp = 1e6; P.x = z.x; P.y = z.y;
    const n0 = g.friends.length; let at = -1;
    for (let k = 0; k < 30 * 70; k++) { P.x = z.x; P.y = z.y; g.update(1 / 30); if (at < 0 && g.friends.length > n0) at = g.ms.clock; }
    return { n: g.friends.length - n0, at, win: g.mission.kind };
  });
  assert(a.n === 3 && a.at >= 60 && a.at < 62, `level 5: ${a.n} friends at ${a.at.toFixed?.(1)} s`);
  await p.context().close();

  // level 10, hold stage: friendly tanks once the first wave is beaten (not before)
  p = await open('?play=tank&level=10');
  const b = await p.evaluate(() => {
    const g = __game(), P = g.player; __app.ticker.stop();
    g.stage = 1; Object.assign(g.ms, { progress: 0, clock: 0, wave: 0, relieved: false, supported: false }); g.waveUnits = [];
    const z = g.mission.zone; P.hp = 1e6; P.x = z.x; P.y = z.y;
    const n0 = g.friends.length;
    for (let k = 0; k < 30 * 4; k++) { P.x = z.x; P.y = z.y; g.update(1 / 30); }
    const before = g.friends.length - n0, wave = g.waveUnits[0]?.length ?? 0;
    for (const u of g.waveUnits[0] ?? []) g.kill(u);
    for (let k = 0; k < 5; k++) g.update(1 / 30);
    return { before, wave, after: g.friends.length - n0 };
  });
  assert(b.wave > 0 && b.before === 0 && b.after === 3, `level 10: wave ${b.wave}, friends before ${b.before}, after ${b.after}`);
  assert(!p.errors.length, p.errors[0]);
  log('flare hint, mission card, support at 60 s and after wave 1');
}
