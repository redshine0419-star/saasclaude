import { NextResponse } from 'next/server';

// 운영자 앱 설치 정보 — 홈 화면에 "첫등원 운영"으로 추가되고 플랫폼 관리자에서 열린다
export function GET() {
  return NextResponse.json(
    {
      name: '첫등원 운영',
      short_name: '첫등원 운영',
      id: '/platform',
      start_url: '/platform',
      scope: '/platform',
      display: 'standalone',
      background_color: '#F4F2EE',
      theme_color: '#1B2430',
      lang: 'ko',
      icons: [
        { src: '/api/app-icon?size=192', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/api/app-icon?size=512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=3600' } },
  );
}
