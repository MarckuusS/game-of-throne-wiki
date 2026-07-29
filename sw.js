/**
 * Service worker — cache hors ligne.
 *
 * Stratégie :
 *   navigation  -> réseau d'abord, repli sur index.html en cache (SPA hors ligne)
 *   ressources  -> cache d'abord, mise à jour en arrière-plan (stale-while-revalidate)
 *
 * IMPORTANT : incrémenter CACHE à chaque déploiement, sinon les anciens fichiers
 * restent servis. Les chemins sont relatifs à la portée du service worker, ce qui
 * permet de publier l'application dans un sous-dossier (GitHub Pages).
 */

const CACHE = 'chroniques-v3';

const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './main.js',
  './manifest.webmanifest',
  './assets/favicon.svg',
  './assets/icon-180.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable-512.png',
  './src/state.js',
  './src/spoiler.js',
  './src/ui.js',
  './src/map.js',
  './src/tree.js',
  './src/panzoom.js',
  './src/views/recap.js',
  './src/views/episodes.js',
  './src/views/characters.js',
  './src/views/mapview.js',
  './src/views/settings.js',
  './data/index.js',
  './data/characters.js',
  './data/places.js',
  './data/family.js',
  './data/seasons/s1.js',
  './data/seasons/s2.js',
  './data/seasons/s3.js',
  './data/seasons/s4.js',
  './data/seasons/s5.js',
  './data/seasons/s6.js',
  './data/seasons/s7.js',
  './data/seasons/s8.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // addAll échoue en bloc si un seul fichier manque : on tolère les absences.
      .then((cache) => Promise.allSettled(ASSETS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html').then((r) => r || caches.match('./'))),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const fresh = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fresh;
    }),
  );
});
