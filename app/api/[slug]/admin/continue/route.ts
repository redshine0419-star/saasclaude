import { after, NextResponse } from 'next/server';
import { pushToOperators } from '@/lib/push';
import type { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';

type Params = Promise<{ slug: string }>;

// 베타 종료 전후 원장의 "계속 이용 신청" — 운영자는 P-01에서 확인 후 플랜을 전환한다.
export async function POST(_req: Request, { params }: { params: Params }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true, slug: true, name: true, lifecycleNotices: true } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await getAdminMembership(tenant.id, session.user.email);
  if (!membership || membership.role !== 'owner') {
    return NextResponse.json({ error: '원장만 신청할 수 있습니다.' }, { status: 403 });
  }

  const prev = (tenant.lifecycleNotices ?? {}) as Record<string, unknown>;
  if (!prev.continueRequestedAt) {
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        lifecycleNotices: { ...prev, continueRequestedAt: new Date().toISOString(), continueRequestedBy: session.user.email } as Prisma.InputJsonValue,
      },
    });
    console.log('[continue] 계속 이용 신청:', tenant.slug);
    after(() => pushToOperators({ title: `계속 이용 신청 — ${tenant.name}`, body: `growweb.me/${tenant.slug} · 무료 기간 이후 계속 쓰겠다고 신청했습니다`, url: '/platform/academies', tag: 'op-continue' }).catch(() => 0));
  }

  return NextResponse.json({ ok: true });
}
