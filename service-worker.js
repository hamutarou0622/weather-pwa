// オフライン起動＆軽量キャッシュ対応
const VERSION = 'v1.0.0';
const STATIC_CACHE = `static-${VERSION}`;
const APP_SHELL = [ './', './index.html', './manifest.json' ];

self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(STATIC_CACHE).then(c=>c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e)=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==STATIC_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', (e)=>{
  const url = new URL(e.request.url);
  if(url.origin === location.origin){
    // 自サイトはキャッシュ優先
    e.respondWith(
      caches.match(e.request).then(res=> res || fetch(e.request).then(r=>{
        const copy = r.clone(); caches.open(STATIC_CACHE).then(c=>c.put(e.request, copy)); return r; }))
    );
    return;
  }
  // API等はネット優先
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});

// Push通知を使いたい場合の雛形
self.addEventListener('push', (event)=>{
  const data = event.data ? event.data.json() : { title: 'お知らせ', body: '更新があります' };
  event.waitUntil(
    self.registration.showNotification(data.title || 'お知らせ', {
      body: data.body,
      icon: 'icons/icon-192.png',
      badge: 'icons/icon-192.png'
    })
  );
});