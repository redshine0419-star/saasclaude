'use client';

import { useEffect, useState } from 'react';

const MESSAGE = '데모에서는 저장되지 않습니다. 직접 써 보시려면 무료로 시작해 보세요.';

/**
 * 데모 둘러보기: 저장·삭제·발송 요청을 보내지 않고 안내만 띄운다.
 * (서버도 실제 로그인·소속이 없으면 거절하므로 이건 화면 안내용이다)
 * 각 화면은 응답의 error 문구를 그대로 보여 주므로, 같은 형식으로 돌려준다.
 */
export function DemoReadOnly() {
  const [toast, setToast] = useState(false);

  useEffect(() => {
    const original = window.fetch;
    let timer: ReturnType<typeof setTimeout> | undefined;
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
      if (method !== 'GET' && method !== 'HEAD' && new URL(url, location.href).pathname.startsWith('/api/')) {
        setToast(true);
        clearTimeout(timer);
        timer = setTimeout(() => setToast(false), 3500);
        return new Response(JSON.stringify({ error: MESSAGE, demo: true }), { status: 403, headers: { 'Content-Type': 'application/json' } });
      }
      return original(input, init);
    };
    return () => {
      window.fetch = original;
      clearTimeout(timer);
    };
  }, []);

  if (!toast) return null;
  return (
    <div role="status" style={{ position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 10001, maxWidth: 'calc(100vw - 32px)', padding: '12px 18px', borderRadius: 12, background: '#1B2430', color: '#FFFFFF', fontSize: 14, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif" }}>
      {MESSAGE}
    </div>
  );
}
