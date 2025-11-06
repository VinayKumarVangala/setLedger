import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { BackgroundSync } from 'workbox-background-sync';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Cache API responses
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/v1/products'),
  new StaleWhileRevalidate({
    cacheName: 'products-cache',
    plugins: [{
      cacheKeyWillBeUsed: async ({ request }) => {
        return `${request.url}?t=${Math.floor(Date.now() / 60000)}`; // 1-minute cache
      }
    }]
  })
);

// Cache static resources
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [{
      cacheExpiration: {
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      }
    }]
  })
);

// Background sync for POS sales
const bgSync = new BackgroundSync('pos-sales-queue', {
  maxRetentionTime: 24 * 60 // 24 hours
});

registerRoute(
  ({ url }) => url.pathname === '/api/v1/pos/sale',
  new NetworkFirst({
    cacheName: 'pos-sales-cache',
    plugins: [bgSync]
  }),
  'POST'
);

// Handle background sync
self.addEventListener('sync', event => {
  if (event.tag === 'pos-sales-queue') {
    event.waitUntil(bgSync.replayRequests());
  }
});

// Handle offline fallback
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html');
      })
    );
  }
});

// Notify clients when back online
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', event => {
  event.waitUntil(
    clients.claim().then(() => {
      return clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_ACTIVATED' });
        });
      });
    })
  );
});