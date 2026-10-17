/* FRAME ATLAS root bridge: migrate stale legacy root tabs into the versioned 2.0 entry. */
const BUILD_ID = '20261017-128';
const CACHE_NAME = 'frame-atlas-root-bridge-20261017-9';
const APP_FILES = ['./', './index.html', './manifest.json', './assets/icons/icon-180.png', './assets/icons/icon-192.png', './assets/icons/icon-512.png'];
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
    await Promise.all(keys.filter(k => k.startsWith('frame-atlas-') && k !== CACHE_NAME && !k.startsWith('frame-atlas-v2-')).map(k => caches.delete(k)));
    await self.clients.claim();

    // Upgrade an already-open legacy root tab without navigating unrelated pages
    // or tabs already inside the separately scoped v2 application.
    const scopeUrl = new URL(self.registration.scope);
    const rootEntryPaths = new Set([
      scopeUrl.pathname,
      new URL('./index.html', scopeUrl).pathname
    ]);
    const latestV2 = new URL('./v2/index.html?fa_build=' + BUILD_ID, scopeUrl).toString();
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      try {
        const current = new URL(client.url);
        if (current.origin !== scopeUrl.origin || !rootEntryPaths.has(current.pathname)) continue;
        if (current.searchParams.get('fa_build') === BUILD_ID) continue;
        client.navigate(latestV2).catch(() => null);
      } catch (_) { /* ignore a closing or inaccessible client */ }
    }
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const path = url.pathname;
  // The v2 app owns a nested service-worker scope and a separate cache namespace.
  // A root-scope worker must neither cache v2 navigations as ./index.html nor clear v2 caches.
  const scopePath = new URL(self.registration.scope).pathname;
  const v2Prefix = scopePath.endsWith('/') ? scopePath + 'v2/' : scopePath + '/v2/';
  if (path === v2Prefix.slice(0, -1) || path.startsWith(v2Prefix)) return;
  const sharedFresh = req.mode === 'navigate' || /\/(?:index\.html|manifest\.json|sw\.js)$/.test(path);
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
