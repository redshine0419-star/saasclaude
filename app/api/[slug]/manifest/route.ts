import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ slug: string }>;

// 학원별 관리자 앱 설치 정보 — 홈 화면에 "학원 이름" 아이콘으로 추가되고 관리자 첫 화면에서 열린다
export async function GET(_req: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const t = await prisma.tenant.findUnique({ where: { slug }, select: { name: true } });
  if (!t) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const short = t.name.length > 12 ? t.name.slice(0, 12) : t.name;
  return NextResponse.json(
    {
      name: `${t.name} 관리`,
      short_name: short,
      description: `${t.name} 상담·학생부·알림 관리 (첫등원)`,
      id: `/${slug}/admin`,
      start_url: `/${slug}/admin`,
      scope: `/${slug}/admin`,
      display: 'standalone',
      background_color: '#F4F2EE',
      theme_color: '#1B2430',
      lang: 'ko',
      icons: [
        { src: '/api/app-icon?size=192', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/api/app-icon?size=512', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/api/app-icon?size=512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=3600' } },
  );
}
