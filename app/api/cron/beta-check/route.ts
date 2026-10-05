import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Vercel Cron: 0 0 * * * — 매일 00:00 UTC (KST 09:00)
// 베타 종료 2주 이내 학원 감지 + 베타 만료 30일 초과 시 비공개 전환

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 베타 만료 2주 이내 학원
  const expiring = await prisma.tenant.findMany({
    where: {
      status: 'active',
      planStatus: 'beta',
      betaEndsAt: { gte: now, lte: in14Days },
    },
    select: { id: true, name: true, slug: true, betaEndsAt: true },
  });

  // 베타 만료 후 30일 초과 → 비공개 전환
  const toDeactivate = await prisma.tenant.findMany({
    where: {
      status: 'active',
      planStatus: 'beta',
      betaEndsAt: { lt: thirtyDaysAgo },
    },
    select: { id: true, name: true, slug: true },
  });

  if (toDeactivate.length > 0) {
    await prisma.tenant.updateMany({
      where: { id: { in: toDeactivate.map((t) => t.id) } },
      data: { status: 'inactive' },
    });
  }

  // 플랫폼 관리자 이메일 조회 (알림 수신 대상)
  const platformAdmins = await prisma.membership.findMany({
    where: { role: 'platform_admin' },
    include: { user: { select: { email: true, name: true } } },
  });
  const adminEmails = platformAdmins.map((m) => m.user.email).filter(Boolean);

  // 운영 로그 — 실제 이메일 발송은 외부 서비스 연동 후 교체
  if (expiring.length > 0) {
    console.log('[beta-check] 만료 임박 학원 (운영자 알림 대상):', {
      admins: adminEmails,
      tenants: expiring.map((t) => ({ name: t.name, slug: t.slug, betaEndsAt: t.betaEndsAt })),
    });
  }
  if (toDeactivate.length > 0) {
    console.log('[beta-check] 비공개 전환 완료:', {
      admins: adminEmails,
      tenants: toDeactivate.map((t) => ({ name: t.name, slug: t.slug })),
    });
  }

  return NextResponse.json({
    ok: true,
    expiring: expiring.length,
    deactivated: toDeactivate.length,
    adminCount: adminEmails.length,
    at: now.toISOString(),
  });
}
