const CACHE='pps-v17';
const SHELL=['./','./index.html','./manifest.webmanifest','./assets/card-back.jpg','./assets/icons/favicon-64.png','./assets/icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  // same-origin: stale-while-revalidate for assets/data, network-first for html
  if(u.origin===location.origin){
    if(u.pathname.endsWith('.html')||u.pathname.endsWith('/')||u.pathname.endsWith('/pokemon-pack-simulator')){
      e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)));
      return;
    }
    e.respondWith(caches.open(CACHE).then(async c=>{
      const hit=await c.match(e.request);
      const net=fetch(e.request).then(r=>{if(r.ok)c.put(e.request,r.clone());return r}).catch(()=>hit);
      return hit||net;
    }));
    return;
  }
  // remote card/logo images: cache first, revalidate
  if(/assets\.tcgdex\.net|images\.pokemontcg\.io/.test(u.hostname)){
    e.respondWith(caches.open(CACHE).then(async c=>{
      const hit=await c.match(e.request);
      const net=fetch(e.request,{mode:'cors',credentials:'omit'}).then(r=>{if(r&&r.ok)c.put(e.request,r.clone());return r}).catch(()=>hit);
      return hit||net;
    }));
  }
});
