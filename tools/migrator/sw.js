/* rippermon.netlify.app is now Rip City: this worker replaces the old app's one, wipes its caches, removes itself and reloads open pages (which then move the collection to ripcity.netlify.app). */
self.addEventListener('install',function(){self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil((async function(){
  try{const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}catch(_){}
  try{await self.clients.claim()}catch(_){}
  try{await self.registration.unregister()}catch(_){}
  try{const cs=await self.clients.matchAll({type:'window',includeUncontrolled:true});cs.forEach(c=>{try{c.navigate(c.url)}catch(_){}})}catch(_){}
})())});
