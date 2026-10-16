const {test, expect} = require('@playwright/test');
const {gotoApp, chooseSet} = require('./helpers');
test('foil shots', async ({page}) => {
  const {errs} = await gotoApp(page);
  await chooseSet(page, 0);
  const shot = async (name, picks) => {
    await page.evaluate(async (picks) => {
      document.querySelectorAll('#foiltest').forEach(x=>x.remove());
      const w=document.createElement('div');w.id='foiltest';w.style.cssText='position:fixed;inset:0;z-index:9999;background:#1d2030;display:flex;gap:16px;align-items:center;justify-content:center;perspective:900px';
      document.body.appendChild(w);
      for (const [si,t,rev,mx,my] of picks){const s=SETS[si];const d=await getCards(s);const c={...d.pools[t][0],tier:t,rev};
        const prev=set; set=s; const el=cardEl(c,0); set=prev; el.classList.add('flipped','tilting');el.style.width='160px';
        el.style.setProperty('--ry','-14deg');el.style.setProperty('--rx','8deg');el.style.setProperty('--mx',mx);el.style.setProperty('--my',my);w.appendChild(el)}
    }, picks);
    await page.waitForTimeout(2500);
    await page.screenshot({path:name});
  };
  // Base Set holo (WOTC), SV10 holo-rare (modern)
  await shot('screenshot-holo.png', [[0,'holo',false,'25%','30%'],[8,'rare',false,'25%','30%'],[16,'sir',false,'30%','30%']]);
  await shot('screenshot-reverse.png', [[0,'common',true,'25%','30%'],[8,'common',true,'25%','30%']]);
  const cls = await page.$$eval('#foiltest .card', e=>e.map(x=>x.className));
  expect(cls.join(' ')).toContain('f-rev');
  expect(errs.filter(e=>!/Failed to load resource/.test(e))).toEqual([]);
});
