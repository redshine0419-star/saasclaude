import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 제작 대행 신청(F-06)은 2026-11 삭제 — 예전 링크는 셀프 개설로 보낸다
  async redirects() {
    return [
      { source: '/apply', destination: '/start', permanent: false },
      { source: '/apply/:path*', destination: '/start', permanent: false },
    ];
  },
  // 보안 헤더 — HTTPS 강제, 다른 사이트 안에 끼워 넣기(클릭재킹) 차단, 파일 형식 위장 차단, 주소 노출 최소화
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=(), usb=()' },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.vercel-storage.com' },
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' },
    ],
  },
};

export default nextConfig;
