const CACHE_NAME = 'setledger-v1';
const API_CACHE = 'setledger-api-v1';
const OFFLINE_QUEUE = 'offline-requests';

// Cache static assets
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else {
    // Handle static assets
    event.respondWith(handleStaticRequest(request));
  }
});

async function handleApiRequest(request) {
  const method = request.method.toUpperCase();
  
  // For GET requests, try cache first, then network
  if (method === 'GET') {
    try {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        // Try to update cache in background
        fetch(request).then(response => {
          if (response.ok) {
            caches.open(API_CACHE).then(cache => {
              cache.put(request, response.clone());
            });
          }
        }).catch(() => {});
        
        return cachedResponse;
      }
      
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(API_CACHE);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      return new Response(JSON.stringify({ error: 'Offline' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // For POST/PUT/DELETE requests
  if (['POST', 'PUT', 'DELETE'].includes(method)) {
    try {
      const response = await fetch(request);
      
      // If successful, process any queued requests
      if (response.ok) {
        processQueuedRequests();
      }
      
      return response;
    } catch (error) {
      // Queue the request for later
      await queueRequest(request);
      
      // Return optimistic response
      return new Response(JSON.stringify({
        success: true,
        queued: true,
        message: 'Request queued for sync when online'
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // Default: try network first
  try {
    return await fetch(request);
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

async function handleStaticRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

async function queueRequest(request) {
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: request.method !== 'GET' ? await request.text() : null,
    timestamp: Date.now(),
    id: generateId()
  };
  
  const db = await openDB();
  const tx = db.transaction(['requests'], 'readwrite');
  await tx.objectStore('requests').add(requestData);
  await tx.complete;
  
  // Notify client about queued request
  notifyClients('request-queued', { id: requestData.id, url: requestData.url });
}

async function processQueuedRequests() {
  const db = await openDB();
  const tx = db.transaction(['requests'], 'readonly');
  const requests = await tx.objectStore('requests').getAll();
  
  if (requests.length === 0) return;
  
  for (const requestData of requests) {
    try {
      const response = await fetch(requestData.url, {
        method: requestData.method,
        headers: requestData.headers,
        body: requestData.body
      });
      
      if (response.ok) {
        // Remove from queue
        const deleteTx = db.transaction(['requests'], 'readwrite');
        await deleteTx.objectStore('requests').delete(requestData.id);
        
        // Notify client
        notifyClients('request-synced', { 
          id: requestData.id, 
          url: requestData.url,
          success: true 
        });
      }
    } catch (error) {
      console.error('Failed to sync request:', error);
      notifyClients('request-failed', { 
        id: requestData.id, 
        url: requestData.url,
        error: error.message 
      });
    }
  }
}

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_QUEUE, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('requests')) {
        const store = db.createObjectStore('requests', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function notifyClients(type, data) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type, data });
    });
  });
}

// Listen for online event to process queue
self.addEventListener('message', (event) => {
  if (event.data.type === 'ONLINE') {
    processQueuedRequests();
  }
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(processQueuedRequests());
  }
});