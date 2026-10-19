// the menu fits a phone screen; side screens open and close; class → allies → briefing → battle
export default async function ({ open, assert }) {
  const p = await open('', { storage: { 'tank2026.campaign': '{"unlocked":10}' } });
  await p.goto(p.url()); await p.waitForTimeout(600);
  const h = await p.evaluate(() => [document.getElementById('menu').scrollHeight, innerHeight]);
  assert(h[0] <= h[1], `menu ${h[0]} px tall on a ${h[1]} px screen`);
  for (const id of ['navStory', 'navUp', 'navCareer']) {
    await p.click('#' + id); await p.waitForTimeout(150);
    assert(await p.locator('.sheet:not([hidden])').count() === 1, `${id}: screen did not open`);
    await p.click('.sheet:not([hidden]) [data-back]'); await p.waitForTimeout(150);
    assert(await p.locator('#menu').isVisible(), `${id}: back did not return to the menu`);
  }
  await p.click('.card[data-class=tank]'); await p.waitForTimeout(200);
  await p.click('#goBtn'); await p.waitForTimeout(200);
  assert(await p.locator('#brief').isVisible(), 'briefing not shown');
  await p.click('#briefGo'); await p.waitForTimeout(1500);
  assert(await p.locator('#hud').isVisible(), 'battle did not start');
  assert(!p.errors.length, p.errors[0]);
}
