/* FRAME ATLAS v5.31: GitHub Pages shared data is always checked online first. */
const CACHE_NAME = 'frame-atlas-v5.32-20261010-change-alerts';
const APP_FILES = ['./', './index.html', './data/places.js', './data/DB_SCHEMA.json', './data/review-workflow.js', './data/image-registry.js', './manifest.json', './assets/icons/icon-128.png', './assets/icons/icon-180.png', './assets/icons/icon-192.png', './assets/icons/icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    /* Do not let a stale HTTP cache seed the new app cache. */
    await Promise.all(APP_FILES.map(async path => {
      try {
        const response = await fetch(new Request(path, {cache:'no-store'}));
        if (response.ok) await cache.put(path, response);
      } catch (_) { /* offline first install: remaining files can be fetched later */ }
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('frame-atlas-') && k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const path = url.pathname;
  const sharedFresh = req.mode === 'navigate' || /\/(?:index\.html|data\/places\.js|data\/image-registry\.js|data\/review-workflow\.js|data\/DB_SCHEMA\.json|manifest\.json|sw\.js)$/.test(path);
  if (sharedFresh) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        /* cache:'no-store' is essential: bypass both SW and browser HTTP caches. */
        const fresh = await fetch(new Request(req, {cache:'no-store'}));
        if (fresh && fresh.ok) {
          const key = req.mode === 'navigate' ? './index.html' : req;
          await cache.put(key, fresh.clone());
        }
        return fresh;
      } catch (_) {
        return (await caches.match(req)) || (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const hit = await caches.match(req);
    if (hit) return hit;
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (_) { return hit || Response.error(); }
  })());
});
