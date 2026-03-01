// sw.js — Service Worker MiraLocks PWA
// Cache offline pour les pages et ressources essentielles

const CACHE_NAME = 'miralocks-v2';
const STATIC_CACHE = 'miralocks-static-v2';

// Ressources à mettre en cache lors de l'installation
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/services.html',
  '/gallery.html',
  '/rendezvous.html',
  '/contact.html',
  '/about.html',
  '/blog.html',
  '/faq.html',
  '/avis.html',
  '/mentions-legales.html',
  '/confidentialite.html',
  '/404.html',
  '/css/styles.css',
  '/css/optimize.css',
  '/js/dynamic-colors.js',
  '/js/hamburger-menu.js',
  '/js/main.js',
  '/js/modern-interactions.js',
  '/js/theme-loader.js',
  '/manifest.json',
  '/assets/logo.png',
  '/offline.html'
];

// ── Installation : mise en cache des ressources statiques ─────────────────────
self.addEventListener('install', function(event) {
  console.log('[SW] Installation…');
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function(cache) {
      console.log('[SW] Mise en cache des ressources statiques');
      return cache.addAll(PRECACHE_URLS.map(function(url) {
        return new Request(url, { cache: 'reload' });
      })).catch(function(err) {
        console.warn('[SW] Certaines ressources non cachées :', err);
      });
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ── Activation : nettoyage des anciens caches ─────────────────────────────────
self.addEventListener('activate', function(event) {
  console.log('[SW] Activation…');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) { return name !== STATIC_CACHE && name !== CACHE_NAME; })
          .map(function(name) {
            console.log('[SW] Suppression ancien cache :', name);
            return caches.delete(name);
          })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ── Stratégie fetch : Cache First pour statique, Network First pour API ───────
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') return;

  // Ignorer Supabase, analytics, extensions Chrome
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('cdn.jsdelivr.net') ||
    url.hostname.includes('google.com') ||
    url.hostname.includes('maps.') ||
    url.protocol === 'chrome-extension:'
  ) {
    return;
  }

  // Ressources statiques → Cache First
  if (
    event.request.destination === 'style' ||
    event.request.destination === 'script' ||
    event.request.destination === 'image' ||
    event.request.destination === 'font' ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.svg')
  ) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Pages HTML → Network First avec fallback cache
  if (event.request.destination === 'document' || url.pathname.endsWith('.html')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Tout le reste → Network First
  event.respondWith(networkFirst(event.request));
});

// ── Cache First ───────────────────────────────────────────────────────────────
async function cacheFirst(request) {
  var cached = await caches.match(request);
  if (cached) return cached;
  try {
    var response = await fetch(request);
    if (response && response.status === 200) {
      var cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch(e) {
    // offline.html en fallback ultime
    return await caches.match('/offline.html') || new Response('Hors ligne', { status: 503 });
  }
}

// ── Network First ─────────────────────────────────────────────────────────────
async function networkFirst(request) {
  try {
    var response = await fetch(request);
    if (response && response.status === 200) {
      var cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch(e) {
    // Offline : chercher dans le cache
    var cachedPage = await caches.match(request);
    if (cachedPage) return cachedPage;
    // Fallback vers la page d'accueil ou 404
    var fallback = await caches.match('/offline.html');
    if (fallback) return fallback;
    return caches.match('/404.html');
  }
}

// ── Message de mise à jour ────────────────────────────────────────────────────
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker MiraLocks chargé');
