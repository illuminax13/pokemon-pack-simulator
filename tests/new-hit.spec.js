const {test, expect} = require('@playwright/test');
const {gotoApp, chooseSet, skipAndLand, tapCenterPack, doTear} = require('./helpers');

// NEW-hit alerts: a hit you didn't own before this pack -> ribbon + toast on reveal, NEW tags + count in the summary.
test.use({serviceWorkers: 'block'});
const quiet = e => !/Failed to load resource|net::|ERR_|CORS|access.control|Cross-Origin/i.test(e);

async function setup(page, sets = {}, prefs) {
  await page.route(/api\.pokemontcg\.io|api\.tcgdex\.net\/v2\/en\/cards|api\.lorcast\.com/, r => r.abort());
  await page.addInitScript(([sets, prefs]) => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    localStorage.setItem('pps', JSON.stringify({packs: 25, coll: {}, hist: [], migrated: 1, sets}));
    localStorage.setItem('ppsNudge', String(Date.now() + 9e9)); if (prefs) localStorage.setItem('ppsPrefs', JSON.stringify(prefs)); }, [sets, prefs]);
  return gotoApp(page);
}
// open a pack on Surging Sparks whose contents are fixed: 9 commons + `kind` last ('dr' = a Double rare off the chase list, 'chase' = #1 chase card, 'none' = a plain Rare)
async function openFixed(page, kind) {
  await chooseSet(page, 12); await skipAndLand(page);
  const hit = await page.evaluate(k => {
    const all = Object.values(cache[set.dex].pools).flat(), ch = nhChase(set);
    const com = all.filter(c => c.tier === 'common').slice(0, 9);
    const h = k === 'chase' ? chRank(set, chCards(cache[set.dex]))[0].c
      : k === 'dr' ? all.find(c => /double rare/i.test(c.rarity) && !ch.has(keyOf(c.id).join('|')))
      : all.find(c => c.tier === 'rare');
    NEXT = {s: set, p: [...com, h].map(c => ({...c}))};
    return {id: h.id, name: h.name, rarity: h.rarity, key: keyOf(h.id)};
  }, kind);
  await tapCenterPack(page); await doTear(page);
  return hit;
}
async function revealWatching(page) {
  await page.evaluate(() => { window.__nhSeen = []; const t0 = () => { const t = document.getElementById('nhtoast'); if (t && t.classList.contains('on')) { const x = t.textContent; if (window.__nhSeen[window.__nhSeen.length - 1] !== x) window.__nhSeen.push(x); } };
    window.__nhPoll = setInterval(t0, 50); });
  await page.locator('#reveal').click();
  await page.waitForSelector('#summary.on', {timeout: 60000});
  await page.waitForTimeout(400);
  return page.evaluate(() => { clearInterval(window.__nhPoll); return {toasts: window.__nhSeen, log: window.__newHits.slice()}; });
}

test('new hit: ribbon + toast on reveal, NEW tag and count in the summary, then it is owned', async ({page}) => {
  const {errs} = await setup(page);
  const hit = await openFixed(page, 'dr');
  // ribbon appears on the card face when flipped (before the summary)
  await page.evaluate(() => { for (let i = 0; i < 9; i++) { flipTop(); sendAway(1); } });
  await page.waitForTimeout(700);
  await page.evaluate(() => flipTop());
  await expect(page.locator('#nhtoast')).toHaveClass(/on/);
  await expect(page.locator('#nhtoast')).toContainText('New hit for your binder!');
  await expect(page.locator('#nhtoast')).toContainText(hit.name);
  await expect(page.locator('#stack .card.flipped .nhrib')).toHaveCount(1);
  expect(await page.evaluate(() => window.__newHits.map(x => [x.name, x.chase]))).toEqual([[hit.name, false]]);
  await page.evaluate(() => sendAway(1));
  await page.waitForSelector('#summary.on', {timeout: 20000});
  await expect(page.locator('#summary .sgrid .card .nhrib')).toHaveCount(1);
  await expect(page.locator('#summary .sgrid .card').nth(9).locator('.nhrib')).toHaveCount(1);
  await expect(page.locator('#summary .nhsum')).toHaveText(/1 new hit for your binder/);
  await expect(page.locator('#summary .nhsum')).not.toContainText('Chase');
  expect(await page.evaluate(k => store.sets[k[0]][k[1]].n, hit.key)).toBe(1);
  expect(errs.filter(quiet)).toEqual([]);
});

test('chase-list card says "Chase card pulled!"', async ({page}) => {
  await setup(page);
  const hit = await openFixed(page, 'chase');
  const r = await revealWatching(page);
  expect(r.log.map(x => [x.name, x.chase])).toEqual([[hit.name, true]]);
  expect(r.toasts.join('|')).toContain('Chase card pulled!');
  await expect(page.locator('#summary .nhsum')).toContainText('Chase card pulled!');
  await expect(page.locator('#summary .nhrib.chase')).toHaveCount(1);
});

test('duplicate hit shows nothing (subset keys resolve like the binder)', async ({page}) => {
  // own the Double rare that the fixed pack will contain: find it first, seed, reload
  await setup(page);
  await chooseSet(page, 12);
  const k = await page.evaluate(() => { const all = Object.values(cache[set.dex].pools).flat(), ch = nhChase(set);
    return keyOf(all.find(c => /double rare/i.test(c.rarity) && !ch.has(keyOf(c.id).join('|'))).id); });
  await page.evaluate(k => { store.sets[k[0]] = store.sets[k[0]] || {}; store.sets[k[0]][k[1]] = {name: 'x', rarity: 'Double rare', n: 1}; save(); }, k);
  await page.reload(); await page.waitForSelector('.tile');
  const hit = await openFixed(page, 'dr');
  expect(hit.key).toEqual(k);
  const r = await revealWatching(page);
  expect(r.log).toEqual([]); expect(r.toasts).toEqual([]);
  await expect(page.locator('#summary .nhrib, #summary .nhsum')).toHaveCount(0);
  expect(await page.evaluate(k => store.sets[k[0]][k[1]].n, k)).toBe(2);
  // subset cards: an owned 30th Classic Collection card saved under its canonical key is a duplicate, a new one is new
  const sub = await page.evaluate(() => { const S = SETBY['30th'], save0 = store.sets['30th'];
    store.sets['30th'] = {CC02: {n: 2}, CC05: {n: 1}};   // CC02 owned before (+1 now), CC05 first copy now
    const p = [{id: '30th-cc02', name: 'Charizard', rarity: 'Classic Collection', tier: 'ultra'}, {id: '30th-cc05', name: 'X', rarity: 'Classic Collection', tier: 'ultra'}];
    const m = nhMark(p, S); store.sets['30th'] = save0; return [...m.keys()]; });
  expect(sub).toEqual([1]);
});

test('non-hit pulls show nothing', async ({page}) => {
  await setup(page);
  await openFixed(page, 'none');
  const r = await revealWatching(page);
  expect(r.log).toEqual([]); expect(r.toasts).toEqual([]);
  await expect(page.locator('#summary .nhrib, #summary .nhsum')).toHaveCount(0);
});

test('settings toggle turns alerts off (and persists)', async ({page}) => {
  await setup(page);
  await page.locator('#setbtn').click();
  const opt = page.locator('#optNew');
  await expect(opt).toBeChecked();
  await opt.uncheck();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ppsPrefs')).newHits)).toBe(false);
  await page.mouse.click(5, 300);
  await page.reload(); await page.waitForSelector('.tile');
  expect(await page.evaluate(() => PREF.newHits)).toBe(false);
  const hit = await openFixed(page, 'dr');
  const r = await revealWatching(page);
  expect(r.log).toEqual([]); expect(r.toasts).toEqual([]);
  await expect(page.locator('#summary .nhrib, #summary .nhsum')).toHaveCount(0);
  expect(await page.evaluate(k => store.sets[k[0]][k[1]].n, hit.key)).toBe(1);   // still saved, just not announced
});
