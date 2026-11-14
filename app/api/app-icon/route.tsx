import { ImageResponse } from 'next/og';

// 관리자 앱 아이콘 — 남색 바탕에 스쿨버스 노랑 원 (더클 표시)
export async function GET(req: Request) {
  const u = new URL(req.url);
  const size = Math.min(512, Math.max(48, Number(u.searchParams.get('size')) || 192));
  const badge = u.searchParams.get('badge') === '1';
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: badge ? 'transparent' : '#14213D' }}>
        <div style={{ width: size * 0.56, height: size * 0.56, borderRadius: '50%', background: badge ? '#FFFFFF' : '#F5B700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: size * 0.2, height: size * 0.2, borderRadius: '50%', background: badge ? 'transparent' : '#14213D' }} />
        </div>
      </div>
    ),
    { width: size, height: size, headers: { 'Cache-Control': 'public, max-age=604800, immutable' } },
  );
}
