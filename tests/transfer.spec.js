const {test, expect} = require('@playwright/test');
const zlib = require('zlib');
const {gotoApp} = require('./helpers');

// Rip City: #transfer=<base64url(deflate-raw JSON)> from the old rippermon origin merges into this origin's collection.
test.use({serviceWorkers: 'block'});
const quiet = e => !/Failed to load resource|net::|ERR_|CORS|access.control|Cross-Origin/i.test(e);
const DEX = ['sv08', 'sv06', 'sv04.5', 'sv03.5'];

function bigCollection(packs = 5530, cards = 2000) {
  const sets = {}, coll = {};
  for (let i = 0; i < cards; i++) {
    const d = DEX[i % DEX.length], n = String(1000 + Math.floor(i / DEX.length));
    (sets[d] = sets[d] || {})[n] = {name: 'Fake ' + i, rarity: i % 9 ? 'Common' : 'Rare Holo', imgs: [], n: 1 + (i % 4), rv: i % 7 ? 0 : 1.5, id: d + '-' + n};
  }
  return {packs, coll, hist: Array.from({length: 300}, (_, i) => ({t: 1.7e12 + i, s: 'sv08'})), migrated: 1, sets};
}
const payload = (store, extra = {}) => ({pps: JSON.stringify(store), ppsAch: JSON.stringify({u: {first: 1.7e12}, since: 1.7e12}), ppsPrefs: JSON.stringify({sound: false, newHits: true}), ppsChase: JSON.stringify({x: 1}), ...extra});
const b64url = buf => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const deflated = data => b64url(zlib.deflateRawSync(Buffer.from(JSON.stringify({app: 'rippermon', kind: 'transfer', v: 1, data}))));

async function setup(page, seed) {
  await page.route(/api\.pokemontcg\.io|api\.tcgdex\.net\/v2\/en\/cards|api\.lorcast\.com/, r => r.abort());
  await page.addInitScript(seed => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    localStorage.setItem('ppsNudge', String(Date.now() + 9e9));
    if (seed) for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v); }, seed || null);
}
const stored = page => page.evaluate(() => { const p = JSON.parse(localStorage.getItem('pps') || '{}'); let u = 0, nsum = 0;
  for (const d in p.sets || {}) for (const n in p.sets[d]) { u++; nsum += p.sets[d][n].n; }
  return {packs: p.packs, unique: u, nsum, hist: (p.hist || []).length, ach: JSON.parse(localStorage.getItem('ppsAch') || '{}').u, prefs: JSON.parse(localStorage.getItem('ppsPrefs') || '{}'), chase: localStorage.getItem('ppsChase'), hash: location.hash, mem: typeof store === 'object' ? store.packs : null}; });

test('transfer hash with ~2,000 cards moves the whole collection over, toasts, strips the hash', async ({page}) => {
  await setup(page);
  const big = bigCollection(), hash = deflated(payload(big));
  expect(hash.length).toBeGreaterThan(1000);
  const {errs} = await gotoApp(page, '/#transfer=' + hash);
  await expect(page.locator('#bktoast.on')).toContainText('Collection moved over from Rippermon ✓', {timeout: 20000});
  const s = await stored(page);
  expect(s).toMatchObject({packs: 5530, unique: 2000, hist: 300, hash: '', mem: 5530, chase: '{"x":1}'});
  expect(s.nsum).toBe(big && Object.values(big.sets).flatMap(Object.values).reduce((a, e) => a + e.n, 0));
  expect(s.ach.first).toBe(1.7e12);
  expect(s.prefs.sound).toBe(false);
  expect(page.url()).not.toContain('transfer');
  await expect(page.locator('#count')).toContainText(/5,?530/);
  expect(errs.filter(quiet)).toEqual([]);
});

test('merges into what is already here (nothing wiped) and is idempotent', async ({page}) => {
  const here = {packs: 12, coll: {}, hist: [{t: 1, s: 'sv08'}], migrated: 1, sets: {sv08: {'9999': {name: 'Mine', rarity: 'Common', imgs: [], n: 3, id: 'sv08-9999'}, '1000': {name: 'Fake 0', rarity: 'Rare Holo', imgs: [], n: 9, id: 'sv08-1000'}}}};
  await setup(page, {pps: JSON.stringify(here), ppsPrefs: JSON.stringify({tilt: false})});
  const hash = deflated(payload(bigCollection(400, 200)));
  await gotoApp(page, '/#transfer=' + hash);
  await expect(page.locator('#bktoast.on')).toContainText('moved over', {timeout: 20000});
  const a = await stored(page);
  expect(a).toMatchObject({packs: 400, unique: 201, hash: ''});
  const own = await page.evaluate(() => JSON.parse(localStorage.getItem('pps')).sets.sv08);
  expect(own['9999'].n).toBe(3);       // only on this device: kept
  expect(own['1000'].n).toBe(9);       // higher count wins, never summed
  expect(a.prefs.tilt).toBe(false);    // this device's prefs win
  // same link again (e.g. the old icon opened twice): no change
  await page.goto('/?again=1#transfer=' + hash); await page.waitForSelector('.tile');
  await expect(page.locator('#bktoast.on')).toContainText('moved over', {timeout: 20000});
  const b = await stored(page);
  expect({packs: b.packs, unique: b.unique, nsum: b.nsum, hist: b.hist}).toEqual({packs: a.packs, unique: a.unique, nsum: a.nsum, hist: a.hist});
});

test('plain base64 JSON fallback works; a broken link changes nothing', async ({page}) => {
  await setup(page, {pps: JSON.stringify({packs: 7, coll: {}, hist: [], migrated: 1, sets: {sv06: {'5': {name: 'Keep', rarity: 'Common', imgs: [], n: 1}}}})});
  const plain = Buffer.from(JSON.stringify(payload(bigCollection(50, 20)))).toString('base64');
  await gotoApp(page, '/#transfer=' + plain);
  await expect(page.locator('#bktoast.on')).toContainText('moved over', {timeout: 20000});
  expect(await stored(page)).toMatchObject({packs: 50, unique: 21, hash: ''});
  await page.goto('/?again=1#transfer=not-a-real-payload!!'); await page.waitForSelector('.tile');
  await expect(page.locator('#bktoast.on')).toContainText("Couldn't read", {timeout: 20000});
  expect(await stored(page)).toMatchObject({packs: 50, unique: 21, hash: ''});
});
