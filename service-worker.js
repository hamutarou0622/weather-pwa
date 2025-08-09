// service-worker.js
const CACHE_VERSION = 'v5-2025-08-09';   // ★日付などで毎回変更
const STATIC_CACHE = `static-${CACHE_VERSION}`;

const ASSETS = [
  '/weather-pwa/',           // ★サブパスに合わせる
  '/weather-pwa/index.html',
  '/weather-pwa/manifest.json',
  '/weather-pwa/icons/icon-192.png',
  '/weather-pwa/icons/icon-512.png',
  // 必要に応じてCSS/JS/画像を追記
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // すぐ新SWに切替
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== STATIC_CACHE) ? caches.delete(k) : null))
    )
  );
  self.clients.claim(); // すぐ制御
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // HTMLは常にネット優先→失敗時キャッシュ（古い配信を避ける）
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(STATIC_CACHE).then(c => c.put('/weather-pwa/index.html', copy));
        return res;
      }).catch(() => caches.match('/weather-pwa/index.html'))
    );
    return;
  }
  // それ以外はキャッシュ優先フォールバック
  event.respondWith(
    caches.match(req).then(res => res || fetch(req))
  );
});
