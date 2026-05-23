// お仕事メニュー Service Worker
// バージョンを変えるとキャッシュが更新される
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `oshigoto-menu-${CACHE_VERSION}`;

// 事前にキャッシュするファイル(オフラインでも開けるようにする)
const PRECACHE_URLS = [
  '/checklist/',
  '/checklist/index.html',
  '/checklist/tasks/',
  '/checklist/orders/',
  '/checklist/pending/',
  '/checklist/manifest.json',
  '/checklist/icons/icon-192.png',
  '/checklist/icons/icon-512.png'
];

// インストール時:必要ファイルを事前キャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('プリキャッシュ失敗:', err))
  );
});

// アクティベート時:古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// fetch時:ネットワーク優先、失敗時はキャッシュから返す
// (常に最新を取りに行きつつ、オフラインでも動く戦略)
self.addEventListener('fetch', (event) => {
  // GET以外は何もしない
  if (event.request.method !== 'GET') return;

  // 外部ドメインは無視
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 成功したらキャッシュも更新
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // ネットワーク失敗時はキャッシュから返す
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // ナビゲーション要求の場合はトップページを返す
          if (event.request.mode === 'navigate') {
            return caches.match('/checklist/');
          }
          return new Response('オフラインです', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        });
      })
  );
});
