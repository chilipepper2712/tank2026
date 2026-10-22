// winning the last level thanks the player; "play again from the start" wipes upgrades and campaign progress
export default async function ({ open, assert }) {
  const p = await open('?play=tank&level=10', { storage: { 'tank2026.campaign': '{"unlocked":10}', 'tank2026.perm.tank': '{"cannon":2}' } });
  await p.evaluate(() => { const g = __game(); g.missionOutcome = () => [true, false]; });
  await p.locator('#demoEnd').waitFor({ state: 'visible', timeout: 15000 });
  await p.click('#demoClose'); await p.waitForTimeout(100);
  assert(!(await p.locator('#demoEnd').isVisible()) && await p.locator('#result').isVisible(), 'close did not leave the result screen');
  await p.evaluate(() => { document.getElementById('demoEnd').hidden = false; });
  await p.click('#demoRestart'); await p.waitForTimeout(300);
  const s = await p.evaluate(() => [localStorage.getItem('tank2026.campaign'), document.getElementById('menu').hidden]);
  assert(s[0] === null && s[1] === false, `restart: campaign ${s[0]}, menu hidden ${s[1]}`);
  assert(!p.errors.length, p.errors[0]);
}
