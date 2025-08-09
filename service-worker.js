// service-worker.js
const CACHE_VERSION = 'v9-2025-08-09-2005';   // ← 毎回ここを変える
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const BASE = '/weather-pwa/';

const ASSETS = [
  BASE, BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'icons/icon-192.png',
  BASE + 'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(STATIC_CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();           // 旧SW待たず即入れ替え準備
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))) // 既存キャッシュを**全部**削除
  );
  self.clients.claim();         // すぐ新SWが全タブを制御
});

// HTMLはネット優先（失敗時キャッシュ）。他はキャッシュ優先。
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(STATIC_CACHE).then(c => c.put(BASE + 'index.html', copy));
        return res;
      }).catch(() => caches.match(BASE + 'index.html'))
    );
    return;
  }
  e.respondWith(caches.match(req).then(res => res || fetch(req)));
});
