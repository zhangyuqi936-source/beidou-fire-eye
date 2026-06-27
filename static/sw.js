/* ═══════════════════════════════════════════════════════════
   北斗火眼·消防智查 — Service Worker v1.0
   分层缓存策略：Cache-First(static) / Network-First(API) / Stale-while-revalidate(images)
   ═══════════════════════════════════════════════════════════ */

const CACHE_VERSION = 'bdhy-v1-20260627';
const STATIC_CACHE = 'bdhy-static-' + CACHE_VERSION;
const IMAGE_CACHE = 'bdhy-images-' + CACHE_VERSION;
const API_CACHE = 'bdhy-api-' + CACHE_VERSION;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/critical.css',
  '/static/dark-mode.css',
  '/static/manifest.json',
  '/static/offline.html'
];

const IMAGE_EXTENSIONS = /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i;
const API_PREFIX = '/api/';

/* ─── Install: 预缓存静态资源 ─── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

/* ─── Activate: 清理旧版本缓存 ─── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => {
          return key.startsWith('bdhy-') && !key.includes(CACHE_VERSION);
        }).map((key) => {
          return caches.delete(key);
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

/* ─── Fetch: 分层缓存策略 ─── */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  /* 跳过非 GET 请求 */
  if (request.method !== 'GET') return;

  /* API 请求: Network-First */
  if (url.pathname.startsWith(API_PREFIX)) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  /* 图片请求: Stale-While-Revalidate */
  if (IMAGE_EXTENSIONS.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  /* 静态资源: Cache-First */
  event.respondWith(cacheFirst(request, STATIC_CACHE));
});

/* ─── Cache-First 策略 ─── */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetchWithTimeout(request, 8000);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    /* 返回离线降级页 */
    if (request.destination === 'document') {
      const offlinePage = await caches.match('/static/offline.html');
      if (offlinePage) return offlinePage;
    }
    return new Response('Offline', { status: 503 });
  }
}

/* ─── Network-First 策略 ─── */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetchWithTimeout(request, 8000);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ success: false, error: 'NETWORK_UNAVAILABLE', message: '网络不可用，请稍后重试' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/* ─── Stale-While-Revalidate 策略 ─── */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetchWithTimeout(request, 8000)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

/* ─── 带超时的 fetch ─── */
function fetchWithTimeout(request, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
    fetch(request).then((res) => {
      clearTimeout(timer);
      resolve(res);
    }).catch((err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/* ─── Push Notification ─── */
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '北斗火眼·消防智查';
  const options = {
    body: data.body || '您有新的消防检查提醒',
    icon: '/static/icons/icon-192x192.png',
    badge: '/static/icons/icon-72x72.png',
    data: { url: data.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
