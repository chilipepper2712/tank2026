// a won mission lands in the career record and survives a reload
export default async function ({ open, assert }) {
  const p = await open('?play=tank&level=1');
  await p.evaluate(() => { const g = __game(); for (const e of g.enemies) { e.byPlayer = true; g.kill(e); } });
  await p.locator('#result').waitFor({ state: 'visible', timeout: 15000 });
  await p.reload(); await p.waitForTimeout(800);
  const c = await p.evaluate(() => JSON.parse(localStorage.getItem('tank2026.stats') || '{}'));
  assert(JSON.stringify(c).includes('"played":1') || c.played === 1 || c.career?.played === 1, `career record: ${JSON.stringify(c).slice(0, 120)}`);
  assert(!p.errors.length, p.errors[0]);
}
