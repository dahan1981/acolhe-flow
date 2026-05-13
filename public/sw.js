// Athena – Service Worker (Offline First / Panic Button)
const CACHE_NAME = 'athena-v1';
const PANIC_QUEUE_KEY = 'athena-panic-queue';

// Cache shell assets on install
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Intercept /api/panic requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method === 'POST' && url.pathname === '/api/panic') {
    event.respondWith(handlePanicRequest(event.request.clone()));
  }
});

async function handlePanicRequest(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    // Offline – save to IndexedDB queue
    const body = await request.json().catch(() => ({}));
    await enqueuePanic(body);

    // Register background sync if supported
    if ('SyncManager' in self) {
      await self.registration.sync.register('panic-sync');
    }

    // Return synthetic 202 so the app knows it was queued
    return new Response(JSON.stringify({ queued: true }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'panic-sync') {
    event.waitUntil(flushPanicQueue());
  }
});

// ─── IndexedDB helpers ────────────────────────────────────────────────────────

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('athena-sw', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('panic-queue', { autoIncrement: true });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function enqueuePanic(payload) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('panic-queue', 'readwrite');
    tx.objectStore('panic-queue').add({ payload, enqueuedAt: Date.now() });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function flushPanicQueue() {
  const db = await openDB();
  const items = await new Promise((resolve, reject) => {
    const tx = db.transaction('panic-queue', 'readonly');
    const req = tx.objectStore('panic-queue').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  for (const item of items) {
    try {
      await fetch('/api/panic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(item.payload),
      });

      // Remove from queue after success
      await new Promise((resolve, reject) => {
        const tx = db.transaction('panic-queue', 'readwrite');
        tx.objectStore('panic-queue').delete(item.key);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Still offline – will retry next sync
    }
  }

  // Notify clients that sync is done
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    client.postMessage({ type: 'PANIC_SYNC_COMPLETE' });
  }
}
