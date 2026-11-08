'use client';

import { useEffect } from 'react';

/** 관리자 화면에서 서비스 워커를 등록한다 — 홈 화면 설치와 푸시 알림에 필요 */
export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  }, []);
  return null;
}
