import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 제작 대행 신청(F-06)은 2026-11 삭제 — 예전 링크는 셀프 개설로 보낸다
  async redirects() {
    return [
      { source: '/apply', destination: '/start', permanent: false },
      { source: '/apply/:path*', destination: '/start', permanent: false },
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
