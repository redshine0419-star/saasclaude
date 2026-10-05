import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Vercel Cron: 0 9 * * * — 매일 오전 9시
// 베타 종료 2주 이내 학원을 찾아 운영자에게 알림

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const in30DaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 베타 만료 2주 이내 학원 (운영자 알림)
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
      betaEndsAt: { lt: in30DaysAgo },
    },
    select: { id: true, name: true, slug: true },
  });

  // 비공개 전환
  if (toDeactivate.length > 0) {
    await prisma.tenant.updateMany({
      where: { id: { in: toDeactivate.map((t) => t.id) } },
      data: { status: 'inactive' },
    });
  }

  // 운영자에게 알림 — 현재는 콘솔 로그 (카카오 연동 후 실제 발송)
  // TODO: platform_admin에게 카카오 알림톡 발송
  if (expiring.length > 0) {
    console.log('[beta-check] 만료 임박 학원:', expiring.map((t) => `${t.name}(${t.slug}) ${t.betaEndsAt?.toLocaleDateString('ko-KR')}`).join(', '));
  }
  if (toDeactivate.length > 0) {
    console.log('[beta-check] 비공개 전환:', toDeactivate.map((t) => t.name).join(', '));
  }

  return NextResponse.json({
    ok: true,
    expiring: expiring.length,
    deactivated: toDeactivate.length,
    at: now.toISOString(),
  });
}
