import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { studentAccess } from '@/lib/students/access';
import { pushToTenant } from '@/lib/push';

type Params = Promise<{ slug: string }>;

// POST — 내 기기로 테스트 알림
export async function POST(_req: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const a = await studentAccess(slug);
  if (a instanceof NextResponse) return a;
  const t = await prisma.tenant.findUnique({ where: { id: a.tenantId }, select: { name: true } });
  const n = await pushToTenant(a.tenantId, { title: `${t?.name ?? '첫등원'} 알림 테스트`, body: '이 기기에서 새 상담 알림을 받을 수 있습니다.', url: `/${slug}/admin`, tag: 'test' }, { email: a.email });
  if (n === 0) return NextResponse.json({ error: '보낼 기기가 없습니다. 먼저 이 기기에서 알림 받기를 켜 주세요.' }, { status: 404 });
  return NextResponse.json({ ok: true, sent: n });
}
