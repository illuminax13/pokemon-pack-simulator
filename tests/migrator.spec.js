const {test, expect} = require('@playwright/test');
const path = require('path'), fs = require('fs');

// End to end: the old origin (rippermon.netlify.app, now the tiny migrator site in tools/migrator) hands its
// localStorage to the app on ripcity.netlify.app, which merges it. Both origins are served from this repo via routes.
test.use({serviceWorkers: 'block'});
const ROOT = path.join(__dirname, '..'), MIG = path.join(ROOT, 'tools/migrator');
async function serve(page) {
  await page.route(/api\.pokemontcg\.io|api\.tcgdex\.net\/v2\/en\/cards|api\.lorcast\.com/, r => r.abort());
  await page.route('https://rippermon.netlify.app/**', r => {
    const p = new URL(r.request().url()).pathname;
    return r.fulfill({path: path.join(MIG, p === '/sw.js' ? 'sw.js' : 'index.html'), headers: {'cache-control': 'no-cache'}});
  });
  await page.route('https://ripcity.netlify.app/**', r => {
    let p = decodeURIComponent(new URL(r.request().url()).pathname); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p);
    return f.startsWith(ROOT) && fs.existsSync(f) ? r.fulfill({path: f}) : r.fulfill({status: 404, body: 'nf'});
  });
}
const oldStore = {packs: 5530, coll: {}, hist: [{t: 1.7e12, s: 'sv08'}], migrated: 1, sets: {}};
for (let i = 0; i < 2000; i++) (oldStore.sets[['sv08', 'sv06'][i % 2]] = oldStore.sets[['sv08', 'sv06'][i % 2]] || {})[String(2000 + (i >> 1))] = {name: 'Old ' + i, rarity: 'Common', imgs: [], n: 2, id: 'x' + i};

test('old origin -> migrator -> Rip City: collection arrives merged, hash stripped, old data kept', async ({page}) => {
  await serve(page);
  await page.addInitScript(old => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    if (location.host === 'rippermon.netlify.app') { localStorage.setItem('pps', JSON.stringify(old)); localStorage.setItem('ppsAch', JSON.stringify({u: {first: 1.7e12}}));
      localStorage.setItem('ppsPrefs', JSON.stringify({sound: false})); localStorage.setItem('ppsPrice', 'huge-cache-not-moved'); }
    if (location.host === 'ripcity.netlify.app') { localStorage.setItem('ppsNudge', String(Date.now() + 9e9));
      localStorage.setItem('pps', JSON.stringify({packs: 3, coll: {}, hist: [], migrated: 1, sets: {sv08: {'1': {name: 'Already here', rarity: 'Common', imgs: [], n: 1}}}})); }
  }, oldStore);
  await page.goto('https://rippermon.netlify.app/some/old/path');
  await page.waitForURL(/^https:\/\/ripcity\.netlify\.app\//, {timeout: 30000});
  await page.waitForSelector('.tile', {timeout: 30000});
  await expect(page.locator('#bktoast.on')).toContainText('Collection moved over from Rippermon ✓', {timeout: 20000});
  const r = await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('pps')); let u = 0; for (const d in p.sets) u += Object.keys(p.sets[d]).length;
    return {packs: p.packs, u, here: p.sets.sv08['1'] && p.sets.sv08['1'].name, ach: JSON.parse(localStorage.getItem('ppsAch')).u.first, sound: JSON.parse(localStorage.getItem('ppsPrefs')).sound,
      price: localStorage.getItem('ppsPrice'), hash: location.hash, title: document.title, h1: document.querySelector('header h1').textContent}; });
  expect(r).toEqual({packs: 5530, u: 2001, here: 'Already here', ach: 1.7e12, sound: false, price: null, hash: '', title: 'Rip City', h1: 'RIP CITY'});
});

test('migrator with nothing saved just redirects; with data it offers a backup download', async ({page}) => {
  await serve(page);
  await page.goto('https://rippermon.netlify.app/');
  await page.waitForURL(/^https:\/\/ripcity\.netlify\.app\/$/, {timeout: 30000});
  await page.waitForSelector('.tile', {timeout: 30000});
  expect(await page.evaluate(() => sessionStorage.getItem('ppsMoved'))).toBeNull();
  // a page with data: stop the auto-redirect to look at the screen + backup link
  await page.unroute('https://ripcity.netlify.app/**');
  await page.route('https://ripcity.netlify.app/**', r => new Promise(ok => setTimeout(ok, 12000)).then(() => r.abort()).catch(() => {}));  // navigation stays pending
  await page.addInitScript(old => { if (location.host === 'rippermon.netlify.app') localStorage.setItem('pps', JSON.stringify(old)); }, {packs: 9, sets: {}, coll: {}, hist: []});
  await page.goto('https://rippermon.netlify.app/');
  await expect(page.locator('#msg')).toContainText('Rip City is the new name');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('#dl').click()]);
  expect(dl.suggestedFilename()).toMatch(/^rippermon-backup-\d{4}-\d\d-\d\d\.json$/);
  { const j = JSON.parse(fs.readFileSync(await dl.path(), 'utf8')); expect(j.app).toBe('rippermon'); expect(JSON.parse(j.data.pps).packs).toBe(9); }
});
