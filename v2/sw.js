const BUILD_ID="20261015-56";
const CACHE_NAME="frame-atlas-v2-shell-"+BUILD_ID;
const CORE_FILES=["./?fa_build="+BUILD_ID,"./index.html?fa_build="+BUILD_ID,"./assets/app.css?v="+BUILD_ID,"./assets/app.js?v="+BUILD_ID,"./data/places.json","./manifest.webmanifest?v="+BUILD_ID,"./icons/atlas-mark.svg?v="+BUILD_ID,"./icons/atlas-touch-"+BUILD_ID+".svg","./icons/icon-192.png","./icons/icon-180.png"];
const APP_BASE=new URL("./",self.location.href);
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE_FILES)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(
 caches.keys()
  .then(keys=>Promise.all(keys.filter(key=>key.startsWith("frame-atlas-v2-")&&key!==CACHE_NAME).map(key=>caches.delete(key))))
  .then(()=>self.clients.claim())
  .then(()=>self.clients.matchAll({type:"window",includeUncontrolled:true}))
  .then(windows=>Promise.all(windows.map(client=>{
   const url=new URL(client.url);
   if(url.origin!==self.location.origin||!url.pathname.startsWith(APP_BASE.pathname)||!(url.pathname.endsWith("/index.html")||url.pathname.endsWith("/v2/")))return Promise.resolve();
   if(url.searchParams.get("fa_build")===BUILD_ID)return Promise.resolve();
   url.searchParams.set("fa_build",BUILD_ID);
   return client.navigate(url.toString()).catch(()=>null);
  })))
));
self.addEventListener("fetch",event=>{
 const request=event.request;if(request.method!=="GET")return;
 const url=new URL(request.url);if(url.origin!==self.location.origin||!url.pathname.startsWith(APP_BASE.pathname))return;
 if(request.mode==="navigate"){
  // Always request this deployment's versioned entry page; this avoids a stale unversioned index being reused on first open.
  const freshUrl=new URL("./index.html?fa_build="+BUILD_ID,APP_BASE);
  const fresh=new Request(freshUrl.toString(),{method:"GET",headers:request.headers,mode:"same-origin",credentials:"same-origin",cache:"reload",redirect:"follow"});
  event.respondWith(fetch(fresh).then(response=>{
   if(response&&response.ok&&response.type==="basic"){
    const copy=response.clone();
    caches.open(CACHE_NAME).then(async cache=>{
     await cache.put(request,copy.clone());
     await cache.put(new URL("./index.html",APP_BASE).toString(),copy.clone());
     await cache.put(new URL("./",APP_BASE).toString(),copy.clone());
    });
   }
   return response;
  }).catch(async()=> (await caches.match(request))||(await caches.match("./index.html?fa_build="+BUILD_ID))||(await caches.match("./index.html"))||Response.error()));
  return;
 }
 if(url.pathname.endsWith("/data/places.json")){
  event.respondWith(fetch(request).then(response=>{if(response&&response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put("./data/places.json",copy));}return response;}).catch(async()=> (await caches.match("./data/places.json"))||Response.error()));
  return;
 }
 event.respondWith(fetch(request).then(response=>{if(response&&response.ok&&response.type==="basic"){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));}return response;}).catch(async()=> (await caches.match(request)) || (request.mode==="navigate" ? (await caches.match("./index.html")) : Response.error()));
});