const {test, expect} = require('@playwright/test');
const {gotoApp} = require('./helpers');
test('simulated pull rates match data/pullrates.json (10k packs/set)', async ({page}) => {
  test.setTimeout(120000);
  await gotoApp(page);
  const out = await page.evaluate(async () => {
    const cfg = await loadPR(), N = 10000, res = {};
    const key = c => { const r = (c.rarity||'').toLowerCase();
      if (c.pat) return c.pat; if (c.energy) return 'energy';
      return /ace spec/.test(r)?'ace':/special illustration/.test(r)?'sir':/illustration/.test(r)?'ir':/hyper|black white/.test(r)?'hr':/double/.test(r)?'dr':/secret/.test(r)?'sec':/vmax/.test(r)?'vmax':/holo rare v|rare holo v/.test(r)?'v':/ultra/.test(r)?'ur':/holo/.test(r)?'holo':'x'; };
    for (const s of SETS) { const C = cfg[s.dex]; const d = await getCards(s); const cnt = {}; let bad = 0;
      for (let i = 0; i < N; i++) { const p = buildPack(s, d.pools);
        if (p.length !== (s.era==='wotc'?11:10) || p.filter(x=>x.energy).length !== (s.dex==='base1'?2:0)) bad++;
        const best = Math.max(...p.map(x => TIERS[x.tier])); if (TIERS[p[p.length-1].tier] !== best) bad++;
        new Set(p.map(key)).forEach(k => cnt[k] = (cnt[k]||0) + 1); }
      const rows = {}; for (const [k, t] of Object.entries(C.rates)) { if (!t) continue; rows[k] = {t, o: (cnt[k]||0)/N}; }
      res[s.dex] = {bad, rows}; }
    return res; });
  const fails = [];
  for (const [set, {bad, rows}] of Object.entries(out)) {
    if (bad) fails.push(`${set}: ${bad} malformed packs`);
    for (const [k, {t, o}] of Object.entries(rows)) { const tol = 4*Math.sqrt(t*(1-t)/10000) + 0.002;
      if (Math.abs(o - t) > tol) fails.push(`${set}.${k}: target ${t.toFixed(4)} observed ${o.toFixed(4)}`); } }
  console.log(JSON.stringify(out));
  expect(fails).toEqual([]);
});
