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
  // a campaign card goes straight to its level's briefing, and back returns to the campaign
  await p.click('#navStory'); await p.waitForTimeout(150);
  await p.click('.scard:nth-child(3)'); await p.waitForTimeout(200);
  assert(await p.locator('#brief').isVisible() && (await p.textContent('#briefArea')).includes('3'), 'campaign card did not open level 3 briefing');
  await p.click('#briefBack'); await p.waitForTimeout(150);
  assert(await p.locator('#story').isVisible(), 'briefing back did not return to the campaign');
  await p.click('#story [data-back]'); await p.waitForTimeout(150);
  await p.click('.card[data-class=tank]'); await p.waitForTimeout(200);
  await p.click('#goBtn'); await p.waitForTimeout(200);
  assert(await p.locator('#brief').isVisible(), 'briefing not shown');
  await p.click('#briefGo'); await p.waitForTimeout(1500);
  assert(await p.locator('#hud').isVisible(), 'battle did not start');
  assert(!p.errors.length, p.errors[0]);

  // levels not reached yet keep their picture hidden
  const q = await open('', { storage: { 'tank2026.campaign': '{"unlocked":3}' } });
  await q.goto(q.url()); await q.waitForTimeout(600);
  await q.click('#navStory'); await q.waitForTimeout(200);
  const imgs = await q.$$eval('.scard', (cs) => cs.map((c) => !!c.querySelector('img')));
  assert(imgs.slice(0, 3).every(Boolean) && !imgs.slice(3).some(Boolean), `card pictures shown: ${imgs}`);
}
