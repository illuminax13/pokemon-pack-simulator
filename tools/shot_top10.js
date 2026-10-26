// WebKit iPhone 13 screenshot of the Top 10 Hits showcase with a realistic collection (git-ignored output in the repo root)
const {webkit,devices}=require('@playwright/test');
const C={'me02.5':{'295':['Mega Dragonite ex','Mega Hyper Rare'],'290':['Mega Dragonite ex','Special illustration rare'],'281':['Pikachu ex','Special illustration rare']},
 'sv03.5':{'199':['Charizard ex','Special illustration rare'],'205':['Mew ex','Hyper rare'],'173':['Bulbasaur','Illustration rare']},
 'sv08.5':{'161':['Umbreon ex','Special illustration rare'],'156':['Sylveon ex','Special illustration rare']},
 'swsh7':{'215':['Umbreon VMAX','Secret Rare']},'base1':{'4':['Charizard','Rare Holo'],'2':['Blastoise','Rare Holo']},
 'sv08':{'238':['Pikachu ex','Special illustration rare'],'247':['Pikachu ex','Hyper rare']},'neo1':{'9':['Lugia','Rare Holo']},
 'lorcana-1':{'205':['Hades - King of Olympus','Enchanted','1|crd_a9c86e6316084d76a03b32be95977091?1709690747|510148']}};
(async()=>{const b=await webkit.launch();const ctx=await b.newContext({...devices['iPhone 13'],serviceWorkers:'block',baseURL:process.env.BASE_URL||'http://127.0.0.1:8765'});const page=await ctx.newPage();
await page.addInitScript(C=>{if(sessionStorage.getItem('s'))return;sessionStorage.setItem('s',1);const sets={},coll={};
 for(const [d,o] of Object.entries(C))for(const [n,[name,rarity,x]] of Object.entries(o)){(sets[d]=sets[d]||{})[n]={name,rarity,n:1+(n.length%2),lid:n,...(x?{x}:{})};coll[d+'-'+n]={name,rarity,n:1,t:4,...(x?{x}:{})}}
 localStorage.setItem('pps',JSON.stringify({packs:6292,coll,hist:[],migrated:1,sets}));localStorage.setItem('ppsNudge',String(Date.now()+9e9));
 localStorage.setItem('ppsAch',JSON.stringify({v:1,u:{},bf:{},st:{},since:Date.now(),toasts:0}))},C);
await page.goto('/');await page.waitForSelector('.tile');await page.waitForTimeout(6000);
console.log(JSON.stringify(await page.evaluate(()=>window.__top10.map(r=>[r.rank,r.id,r.v]))));
await page.evaluate(()=>{const e=document.getElementById('t10sec');window.scrollTo(0,e.getBoundingClientRect().top+scrollY-60)});
await page.waitForFunction(()=>[...document.querySelectorAll('#top10 img')].slice(0,4).every(i=>i.complete),null,{timeout:30000}).catch(()=>{});await page.waitForTimeout(2500);
console.log(await page.$eval('#top10 .hero img',i=>i.currentSrc));
await page.screenshot({path:'screenshot-top10.png'});await b.close()})();
