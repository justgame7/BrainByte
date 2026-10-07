// Bump CACHE version whenever you change any files, so installed apps pick up updates.
const CACHE = 'brainbyte-v2';
const ASSETS = [
  './', 'index.html', 'postgresql.html', 'redshift.html',
  'app.css', 'app.js', 'postgresql.js', 'redshift.js',
  'pg-phase1.js', 'pg-phase1b.js', 'manifest.json', 'install.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  // Tolerant: one missing file must not break service worker install.
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(ASSETS.map(a => c.add(a))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first (so updates show up when online), falling back to cache offline.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
