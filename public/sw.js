/* 첫등원 관리자 앱 서비스 워커 — 푸시 알림 표시와 알림을 눌렀을 때 화면 열기만 한다 (오프라인 캐시 없음) */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { title: '첫등원', body: event.data ? event.data.text() : '' }; }
  const title = data.title || '첫등원';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      tag: data.tag || undefined,
      renotify: !!data.tag,
      icon: '/api/app-icon?size=192',
      badge: '/api/app-icon?size=96&badge=1',
      data: { url: typeof data.url === 'string' && data.url.startsWith('/') ? data.url : '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (new URL(c.url).pathname === url && 'focus' in c) return c.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});

// 설치형 앱 요건을 맞추기 위한 빈 fetch 처리 (네트워크 그대로 사용)
self.addEventListener('fetch', () => {});
