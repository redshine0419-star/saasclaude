import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { billingOwner } from '@/lib/billing/access';

type Params = Promise<{ slug: string }>;

// POST — 정기결제 해지: 다음 결제일부터 청구하지 않는다 (이미 낸 달은 그대로 이용)
export async function POST(_req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;
  const a = await billingOwner(slug);
  if (a instanceof NextResponse) return a;
  const r = await prisma.subscription.updateMany({ where: { tenantId: a.tenant.id, status: { not: 'canceled' } }, data: { status: 'canceled', canceledAt: new Date() } });
  if (r.count === 0) return NextResponse.json({ error: '해지할 정기결제가 없습니다.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
