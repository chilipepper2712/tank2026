// every text on every screen comes from the language file: no key is missing, no ⟨key⟩ shows
export default async function ({ open, assert, log }) {
  const p = await open('', { storage: { 'tank2026.campaign': '{"unlocked":10}' } });
  await p.goto(p.url()); await p.waitForTimeout(600);
  const seen = [];
  const check = async (where) => {
    const r = await p.evaluate(() => [[...__missingTexts], document.body.innerText.includes('⟨')]);
    assert(!r[0].length && !r[1], `${where}: missing ${r[0].join(', ') || 'a ⟨key⟩ on screen'}`);
    seen.push(where);
  };
  await check('menu');
  for (const id of ['navStory', 'navUp', 'navCareer']) {
    await p.click('#' + id); await p.waitForTimeout(150); await check(id);
    await p.click('.sheet:not([hidden]) [data-back]'); await p.waitForTimeout(100);
  }
  await p.click('#levelRow button:nth-child(2)'); // level 1: a plain destroy mission
  await p.click('.card[data-class=tank]'); await p.waitForTimeout(150); await check('prep');
  await p.click('#goBtn'); await p.waitForTimeout(150); await check('brief');
  await p.click('#briefGo'); await p.waitForTimeout(1500); await check('battle');
  await p.click('#pauseBtn'); await p.waitForTimeout(150); await check('settings');
  // a won mission: result screen with stats and the upgrade choice
  await p.click('#resumeBtn');
  const shown = await p.evaluate(() => { const g = __game(); __app.ticker.stop(); for (const e of g.enemies) g.kill(e); for (let f = 0; f < 90; f++) g.update(1 / 30); return !document.getElementById('result').hidden; });
  assert(shown, 'result screen not shown'); await check('result');
  // training, then its end screen
  await p.evaluate(() => { localStorage.removeItem('tank2026.campaign'); });
  const q = await open('?play=apc&level=0');
  await q.evaluate(() => { const g = __game(), T = g.training; __app.ticker.stop(); T.k = 7; T.pause = 0; T.next(); for (let f = 0; f < 90; f++) g.update(1 / 30); });
  const r = await q.evaluate(() => [[...__missingTexts], document.body.innerText.includes('⟨'), document.getElementById('resultTitle').textContent]);
  assert(!r[0].length && !r[1], `training: missing ${r[0].join(', ')}`);
  assert(!p.errors.length && !q.errors.length, p.errors[0] ?? q.errors[0]);
  log(`${seen.length + 1} screens, end "${r[2]}"`);
}
