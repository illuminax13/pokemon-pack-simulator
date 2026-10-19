const {test, expect} = require('@playwright/test');
const {gotoApp, chooseSet} = require('./helpers');
// Foil v3: one screened texture x light-band layer per foil; no rainbow wash; commons have no foil.
test('foil tiers', async ({page}) => {
  const {errs} = await gotoApp(page);
  await chooseSet(page, 0);
  const r = await page.evaluate(async () => {
    const S=d=>SETS.find(s=>s.dex===d);
    const mk=async(dex,t,f,extra)=>{const s=S(dex);const d=await getCards(s);const pool=d.pools[t]||[];const c=pool.find(f||(()=>true))||pool[0];const prev=set;set=s;const el=cardEl({...c,tier:t,...(extra||{})},0);set=prev;document.body.appendChild(el);el.classList.add('flipped');return el};
    const els={common:await mk('sv08','common'),wotc:await mk('base1','holo'),mod:await mk('sv08','rare'),rev:await mk('sv08','common',null,{rev:true}),
      mb:await mk('sv08.5','uncommon',null,{rev:true,pat:'mb'}),pb:await mk('sv08.5','common',null,{rev:true,pat:'pb'}),
      ur:await mk('sv08','ultra'),sir:await mk('sv08','sir',c=>/special/i.test(c.rarity)),gold:await mk('sv08','sir',c=>/hyper/i.test(c.rarity))};
    const out={};for(const [k,el] of Object.entries(els)){const a=el.querySelector('.fx .a'),cs=getComputedStyle(a);
      out[k]={cls:el.className,blend:cs.mixBlendMode,bbm:cs.backgroundBlendMode,fx:getComputedStyle(el.querySelector('.fx')).opacity,img:cs.backgroundImage,clip:cs.clipPath,legacy:getComputedStyle(el.querySelector('.foil')).display,spark:getComputedStyle(el.querySelector('.sparkle')).display};el.remove()}
    return out});
  expect(r.common.cls).not.toMatch(/f-(holo|rev|etch)/); expect(r.common.fx).toBe('0');
  expect(r.wotc.cls).toContain('f-holo'); expect(r.wotc.cls).toContain('e-wotc'); expect(r.wotc.clip).toContain('inset');
  expect(r.mod.cls).toContain('f-holo'); expect(r.rev.cls).toContain('f-rev'); expect(r.rev.clip).toContain('polygon');
  expect(r.mb.cls).toContain('p-mb'); expect(r.pb.cls).toContain('p-pb');
  expect(r.ur.cls).toContain('f-etch'); expect(r.sir.cls).toContain('t-sir'); expect(r.gold.cls).toContain('t-gold');
  for (const k of ['wotc','mod','rev','mb','pb','ur','sir','gold']) {
    expect(r[k].blend).toBe('screen'); expect(r[k].bbm).toMatch(/multiply/); expect(r[k].fx).toBe('1');
    expect(r[k].legacy).toBe('none'); expect(r[k].spark).toBe('none');
    // no saturated rainbow stops in the foil layer
    expect(r[k].img).not.toMatch(/rgb\(255, (0|61|79), /);
  }
  expect(errs.filter(e=>!/Failed to load resource/.test(e))).toEqual([]);
});
