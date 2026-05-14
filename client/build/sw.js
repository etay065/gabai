const CACHE = 'gabai-v3';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll(['/', '/index.html', '/logo-transparent.png', '/logo192.png'])
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  
  // Never intercept landing.html - let it go to network
  if (url.pathname === '/landing.html') return;

  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('/index.html').then(cached => cached || fetch(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
