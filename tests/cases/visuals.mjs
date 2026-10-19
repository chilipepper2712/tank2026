// voxel vehicles bake for every kind; night levels have lamps and flares; the sound test page opens
export default async function ({ open, assert, log }) {
  let p = await open('?voxel&grid&kinds=tank,apc,pz4,patria,su100,hilux,mastiff');
  await p.waitForTimeout(1500);
  assert(!p.errors.length, `voxel grid: ${p.errors[0]}`);
  await p.context().close();
  p = await open('?play=apc&level=7');
  const n = await p.evaluate(() => { const g = __game(); __app.ticker.stop(); for (const e of g.enemies) e.active = false; for (let k = 0; k < 30 * 8; k++) { g.player.hp = g.player.spec.hp; g.update(1 / 30); } return { vox: g.player.view.voxel, lamps: g.lamps.length, flares: g.flares.length, night: !!g.night }; });
  assert(n.vox, 'player vehicle is not voxel');
  assert(n.night && n.lamps > 5 && n.flares > 0, `night: ${JSON.stringify(n)}`);
  assert(!p.errors.length, `night: ${p.errors[0]}`);
  await p.context().close();
  p = await open('?play=tank&level=1');
  assert(!(await p.evaluate(() => !!__game().night)), 'level 1 should be daytime');
  await p.context().close();
  p = await open('?sounds');
  await p.locator('.stbtn').first().waitFor({ timeout: 10000 }); // the page is loaded on demand
  const rows = await p.locator('.stbtn').count();
  assert(rows === 34, `sound page lists ${rows} sounds`);
  assert(!p.errors.length, `sound page: ${p.errors[0]}`);
  log(`night lamps ${n.lamps}, sounds ${rows}`);
}
