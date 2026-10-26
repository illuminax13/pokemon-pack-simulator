// WebKit iPhone 13 screenshot of a booster box summary with NEW ribbons + the chase callout (git-ignored output)
const {webkit,devices}=require('@playwright/test');const {gotoApp,chooseSet}=require('../tests/helpers');
(async()=>{const b=await webkit.launch();const ctx=await b.newContext({...devices['iPhone 13'],serviceWorkers:'block',baseURL:process.env.BASE_URL||'http://127.0.0.1:8765'});const page=await ctx.newPage();
await page.addInitScript(()=>{if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s',1);
 localStorage.setItem('pps',JSON.stringify({packs:180,coll:{},hist:[],migrated:1,sets:{}}));localStorage.setItem('ppsNudge',String(Date.now()+9e9));
 localStorage.setItem('ppsAch',JSON.stringify({v:1,u:{},bf:{},st:{},since:Date.now(),toasts:0}))});
await gotoApp(page);await chooseSet(page,12);
await page.evaluate(async()=>{await openBox(set);const all=Object.values(cache[set.dex].pools).flat(),ch=nhChase(set);
 const chase=chRank(set,chCards(cache[set.dex])).slice(0,3).map(r=>r.c);
 const com=all.filter(c=>c.tier==='common'),rares=all.filter(c=>c.tier==='rare'&&!c.rev),drs=all.filter(c=>/double rare/i.test(c.rarity));
 newBox(set,{name:'Booster box',n:36,real:0});
 BOX.packs=BOX.packs.map((p,k)=>{const x=[...p];x[x.length-1]={...(k===4?chase[0]:k===19?chase[2]:k%5===2?drs[k%drs.length]:rares[k%rares.length])};return x});
 BOX.done=BOX.packs.map(()=>0);BOX.wrap=1;BOX.lid=1;boxSave();boxIntro();});
await page.evaluate(()=>{boxFast();document.getElementById('bxskip').click()});
await page.waitForSelector('#boxv .bxsum .bxnh',{timeout:30000});await page.waitForTimeout(3500);
await page.evaluate(()=>{document.querySelectorAll('#achtoast,#nhtoast').forEach(e=>e.classList.remove('on'));const e=document.querySelector('#boxv .bxsum .bxnh');e.scrollIntoView({block:'start'});document.scrollingElement.scrollBy(0,-120);(e.closest('.bxsum')||e.parentElement).scrollTop=Math.max(0,e.offsetTop-120)});
await page.waitForTimeout(2500);console.log(await page.$eval('#boxv .bxsum .bxnh',e=>e.textContent),await page.locator('#boxv .nhrib').count());
await page.screenshot({path:'screenshot-box-new.png'});await b.close()})();
