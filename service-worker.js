// service-worker.js
const CACHE_VERSION = 'v10-2025-08-09-2100';   // ★毎回ここを変える
const STATIC_CACHE  = `static-${CACHE_VERSION}`;
const BASE = '/weather-pwa/';

const ASSETS = [
  BASE,                     // ← ルート
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'icons/icon-192.png',
  BASE + 'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(STATIC_CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting(); // すぐ新SWに
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))) // 既存キャッシュ全削除
  );
  self.clients.claim();
});

// HTMLはネット最優先（HTTPキャッシュも無視）→ 失敗時キャッシュ
self.addEventListener('fetch', (e) => {
  const req = e.request;

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const net = await fetch(new Request(req.url, { cache: 'reload' }));
        // 同じ内容を "/" と "/index.html" の両方に保存
        const copy1 = net.clone();
        const copy2 = net.clone();
        const c = await caches.open(STATIC_CACHE);
        await c.put(BASE, copy1);
        await c.put(BASE + 'index.html', copy2);
        return net;
      } catch {
        // どちらかがあれば返す
        return (await caches.match(req)) ||
               (await caches.match(BASE)) ||
               (await caches.match(BASE + 'index.html'));
      }
    })());
    return;
  }

  // それ以外はキャッシュ優先
  e.respondWith(caches.match(req).then(res => res || fetch(req)));
});
