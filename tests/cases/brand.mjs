// the hidden credit: a BRAVO6 plate on an apartment slab in level 1, painted on a container in level 4
export default async function ({ open, assert, log }) {
  for (const [lv, plate] of [[1, true], [4, false]]) {
    const p = await open(`?play=tank&level=${lv}`);
    const r = await p.evaluate(() => {
      const L = __game().level, s = L.signs ?? [], g = L.grid, sg = s[0];
      if (!sg) return { n: 0 };
      const cx = Math.floor((sg.x0 + sg.w / 2) / 10), cy = Math.floor((sg.yBase - 1) / 10);
      return { n: s.length, text: sg.text, plate: sg.plate, wall: g.ht[cy * g.GW + cx], inStrip: Math.floor(sg.x0 / 300) === Math.floor((sg.x0 + sg.w - 1) / 300) };
    });
    assert(r.n === 1 && r.text === 'BRAVO6' && r.plate === plate, `level ${lv}: sign ${JSON.stringify(r)}`);
    assert(r.wall > 0 && r.inStrip, `level ${lv}: sign not on a standing wall or crosses a strip seam ${JSON.stringify(r)}`);
    assert(!p.errors.length, p.errors[0]);
    log(`level ${lv} ok`);
    await p.context().close();
  }
  // the other city levels carry none
  const q = await open('?play=tank&level=2');
  assert(!(await q.evaluate(() => (__game().level.signs ?? []).length)), 'level 2 has a sign');
}
