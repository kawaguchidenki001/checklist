// Service Workerを登録(PWA有効化)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/checklist/sw.js', { scope: '/checklist/' })
      .then((reg) => {
        console.log('[PWA] Service Worker 登録成功:', reg.scope);
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker 登録失敗:', err);
      });
  });
}
