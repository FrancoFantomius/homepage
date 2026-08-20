/**
 * Homepage Service Worker
 * Provides offline support and local caching for application assets & favicons.
 */

const CACHE_VERSION = 'v1';
const CORE_CACHE = `homepage-core-${CACHE_VERSION}`;
const FAVICON_CACHE = `homepage-favicons-${CACHE_VERSION}`;

// Pre-cached core local assets
const CORE_ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.webmanifest',
  './css/styles.css',
  './css/variables.css',
  './css/base.css',
  './css/clock.css',
  './css/search.css',
  './css/bookmarks.css',
  './css/modal.css',
  './css/settings.css',
  './css/responsive.css',
  './js/state.js',
  './js/i18n.js',
  './js/theme.js',
  './js/clock.js',
  './js/bookmarks.js',
  './js/search.js',
  './js/modal.js',
  './js/settings.js',
  './js/shortcuts.js',
  './js/pwa.js',
  './img/icon.svg',
  './img/add.svg',
  './img/arrow_forward.svg',
  './img/bookmark.svg',
  './img/check.svg',
  './img/close.svg',
  './img/delete.svg',
  './img/edit.svg',
  './img/expand_more.svg',
  './img/more_vert.svg',
  './img/search.svg',
  './img/settings.svg',
  './langs/en.json',
  './langs/it.json',
  './langs/es.json',
  './langs/fr.json',
  './langs/de.json',
  './langs/pt.json',
  './langs/ru.json',
  './langs/zh.json',
  './langs/ja.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[SW] Pre-cache failed for some assets:', err);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CORE_CACHE && key !== FAVICON_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1. DuckDuckGo Favicon Caching Strategy (Cache-First / Stale-While-Revalidate)
  if (url.hostname === 'icons.duckduckgo.com' || url.pathname.endsWith('.ico')) {
    event.respondWith(
      caches.open(FAVICON_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);

        // Fetch fresh copy in the background / when online
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Network failed, nothing to update
          return null;
        });

        // Return cached icon immediately if available, otherwise wait for network
        return cachedResponse || (await fetchPromise) || new Response('', { status: 404 });
      })
    );
    return;
  }

  // 2. Ignore real-time search suggestion APIs (network only)
  if (
    url.hostname.includes('suggest') ||
    url.hostname.includes('duckduckgo.com') && url.pathname.includes('/ac') ||
    url.hostname.includes('startpage.com') && url.pathname.includes('/suggestions')
  ) {
    return;
  }

  // 3. Same-origin assets & local files (Stale-While-Revalidate / Cache-First)
  if (url.origin === location.origin) {
    event.respondWith(
      caches.open(CORE_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);

        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // If offline and request is for an HTML navigation, fallback to root index.html
          if (request.mode === 'navigate') {
            return cache.match('./index.html') || cache.match('./');
          }
          return null;
        });

        return cachedResponse || (await fetchPromise);
      })
    );
    return;
  }

  // 4. Default strategy for other external assets
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request);
    })
  );
});
