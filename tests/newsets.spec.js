const {test, expect} = require('@playwright/test');
const {gotoApp, chooseSet} = require('./helpers');
test('picker grouped by era newest first, all new sets load with real pack art', async ({page}) => {
  await gotoApp(page);
  const eras = await page.$$eval('#sets .era', e => e.map(x => x.dataset.era));
  expect(eras).toEqual(['me','sv','swsh','base']);
  const n = await page.$$eval('.tile[data-i]', t => t.length);
  expect(n).toBe(17);
  const r = await page.evaluate(async () => {
    const out = {};
    for (const s of SETS.slice(6)) {
      const c = await getCards(s); const pools = c.pools; let bad = 0, hits = {};
      for (let i = 0; i < 2000; i++) { const p = buildPack(s, pools);
        if (p.length !== 10 || !p[0].energy) bad++;
        const best = Math.max(...p.map(x => TIERS[x.tier])); if (TIERS[p[9].tier] !== best) bad++;
        p.forEach(x => { hits[x.rarity] = (hits[x.rarity]||0) + 1 }); }
      out[s.dex] = {n: c.n, src: c.src, bad, art: (PACKART[s.dex]||[]).length, hits};
    }
    return out;
  });
  for (const [k, v] of Object.entries(r)) {
    expect(v.src, k).toBe('local'); expect(v.bad, k).toBe(0); expect(v.art, k).toBeGreaterThan(0);
    expect(v.hits['Illustration rare'] || v.hits['Special illustration rare'], k).toBeGreaterThan(0);
  }
  console.log(JSON.stringify(r));
  const resp = await page.request.get('assets/packs/me05/mega-darkrai.webp'); expect(resp.ok()).toBeTruthy();
});
