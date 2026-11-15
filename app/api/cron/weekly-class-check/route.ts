import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyOwner } from '@/lib/notify/owner';

// Vercel Cron: 0 0 * * 1 — 매주 월요일 00:00 UTC (KST 09:00)
// 반이 있는 모든 활성 학원에 "이번 주 수업 확인" 알림 (알림함 + 앱 알림)

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  let sent = 0;
  let failed = 0;

  const tenants = await prisma.tenant.findMany({
    where: { status: 'active' },
    select: { id: true, slug: true, name: true, classes: { orderBy: { sortOrder: 'asc' }, select: { name: true, seatsLeft: true } } },
  });

  for (const tenant of tenants) {
    if (tenant.classes.length === 0) continue;
    const summary = tenant.classes
      .slice(0, 6)
      .map((c) => `${c.name}${c.seatsLeft !== null ? ` 잔여 ${c.seatsLeft}석` : ''}`)
      .join(' · ');
    try {
      const r = await notifyOwner(tenant.id, {
        kind: 'class_check',
        title: `이번 주 수업 확인 — ${tenant.name}`,
        body: `반 ${tenant.classes.length}개의 잔여석이 맞는지 확인해 주세요.\n${summary}${tenant.classes.length > 6 ? ' …' : ''}`,
        url: `/${tenant.slug}/admin/classes`,
        tag: 'weekly-class',
      });
      sent += r.pushed;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ ok: true, sent, failed, at: now.toISOString() });
}
