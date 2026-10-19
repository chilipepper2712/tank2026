// clearing the map shows the win screen with stats; losing the vehicle shows the loss screen; restart works
export default async function ({ open, assert }) {
  for (const mode of ['win', 'lose']) {
    const p = await open('?play=apc&level=1');
    await p.evaluate((m) => { const g = __game(); if (m === 'win') for (const e of g.enemies) g.kill(e); else g.kill(g.player); }, mode);
    await p.locator('#result').waitFor({ state: 'visible', timeout: 15000 });
    const title = await p.textContent('#resultTitle');
    assert(mode === 'win' ? /HOÀN THÀNH/.test(title) : /PHÁ HỦY/.test(title), `${mode}: title "${title}"`);
    if (mode === 'win') {
      if (await p.locator('.choice').count()) await p.locator('.choice').first().click();
      await p.click('#againBtn'); await p.waitForTimeout(600);
      assert(await p.locator('#hud').isVisible(), 'restart: HUD hidden');
    }
    assert(!p.errors.length, p.errors[0]);
    await p.context().close();
  }
}
