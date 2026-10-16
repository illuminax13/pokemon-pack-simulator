const CACHE='pps-v19';
const fail=()=>new Response('',{status:504,statusText:'offline'});
const SHELL=['./','./index.html','./manifest.webmanifest','./assets/card-back.jpg','./assets/icons/favicon-64.png','./assets/icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(async()=>{await self.clients.claim();const cs=await self.clients.matchAll({type:'window'});cs.forEach(c=>c.postMessage({type:'SW_UPDATED',cache:CACHE}))}))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  if(u.origin===location.origin){
    // Always network-first for navigations / HTML so deploys aren't stuck on stale shell
    if(e.request.mode==='navigate'||u.pathname.endsWith('.html')||u.pathname.endsWith('/')||/pokemon-pack-simulator\/?$/.test(u.pathname)){
      e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(m=>m||caches.match('./index.html')).then(m=>m||fail())));
      return;
    }
    e.respondWith(caches.open(CACHE).then(async c=>{
      const hit=await c.match(e.request);
      const net=fetch(e.request).then(r=>{if(r.ok)c.put(e.request,r.clone());return r}).catch(()=>hit||fail());
      return hit||net;
    }));
    return;
  }
  if(/assets\.tcgdex\.net|images\.pokemontcg\.io/.test(u.hostname)){
    e.respondWith(caches.open(CACHE).then(async c=>{
      const hit=await c.match(e.request);
      const net=fetch(e.request).then(r=>{if(r&&(r.ok||r.type==='opaque'))c.put(e.request,r.clone()).catch(()=>{});return r}).catch(()=>hit||fail());
      return hit||net;
    }));
  }
});
