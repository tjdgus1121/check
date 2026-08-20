const CACHE = 'yaja-v5';
const ASSETS = [
  './check.html',
  './check.webmanifest',
  './check-sw.js',
  './faviconstudy.png',
  './share.png',
  './more.png',
];

self.addEventListener('install', e => {
  // addAll은 하나라도 404면 전체 설치가 실패하므로, 자산 하나씩 개별 추가 후 실패는 무시
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.allSettled(ASSETS.map(a => c.add(a)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 브라우저가 기본으로 요청하는 /favicon.ico는 실제 파일이 없으므로 faviconstudy.png로 대신 응답
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.pathname.endsWith('/favicon.ico')) {
    e.respondWith(
      caches.match('./faviconstudy.png').then(cached => cached || fetch('./faviconstudy.png'))
    );
    return;
  }
  // 네트워크 우선, 실패 시 캐시 사용 (항상 최신 데이터)
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
