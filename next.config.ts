import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // www → non-www 영구 리디렉션 (301) — Google canonical 충돌 방지
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.growweb.me' }],
        destination: 'https://growweb.me/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
