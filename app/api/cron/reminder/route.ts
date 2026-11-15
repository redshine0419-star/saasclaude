import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSmsTask } from '@/lib/sms/tasks';
import { notifyOwner } from '@/lib/notify/owner';

// Vercel Cron: 0 9 * * * — 매일 18:00 KST (09:00 UTC)
// 학부모에게 보낼 문자를 '보낼 문자'에 올리고 원장에게 알린다 (자동 발송하지 않는다 — 원장이 휴대폰 문자로 보낸다)
//  - 레벨테스트 전날 안내: 내일(KST) 테스트가 확정된 상담
//  - 상담 후 안내: 연락·테스트 뒤 2일 넘게 결정이 없는 최근 30일 상담 (정보성 — 광고 문구 금지)

const DAY = 24 * 3600 * 1000;
const KST = 9 * 3600 * 1000;

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  // 내일 KST 하루의 UTC 범위
  const k = new Date(now.getTime() + KST);
  const tomorrowStart = new Date(Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate() + 1) - KST);
  const tomorrowEnd = new Date(tomorrowStart.getTime() + DAY);

  const created = new Map<string, number>(); // tenantId → 새로 만든 수
  const bump = (t: string) => created.set(t, (created.get(t) ?? 0) + 1);

  const reminders = await prisma.lead.findMany({
    where: { status: 'test_booked', testAt: { gte: tomorrowStart, lt: tomorrowEnd } },
    select: { id: true, tenantId: true, testAt: true },
    take: 500,
  });
  for (const l of reminders) {
    if (l.testAt && (await createSmsTask(l.tenantId, l.id, 'reminder', now, l.testAt.toISOString()))) bump(l.tenantId);
  }

  const followups = await prisma.lead.findMany({
    where: {
      status: { in: ['contacted', 'test_done'] },
      statusChangedAt: { lte: new Date(now.getTime() - 2 * DAY) },
      createdAt: { gte: new Date(now.getTime() - 30 * DAY) },
    },
    select: { id: true, tenantId: true },
    take: 500,
  });
  for (const l of followups) {
    if (await createSmsTask(l.tenantId, l.id, 'followup', now)) bump(l.tenantId);
  }

  // 학원마다 한 번 알림 (데모 학원 제외)
  let notified = 0;
  for (const [tenantId, n] of created) {
    const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true, name: true } });
    if (!t || t.slug.startsWith('demo')) continue;
    await notifyOwner(tenantId, {
      kind: 'sms_due',
      title: `학부모에게 보낼 문자 ${n}건 — ${t.name}`,
      body: '레벨테스트 전날 안내·상담 후 안내 문자가 준비되었습니다. 눌러서 휴대폰 문자로 보내 주세요.',
      url: `/${t.slug}/admin/sms`,
      tag: 'sms-due',
    }).catch(() => undefined);
    notified++;
  }

  return NextResponse.json({ ok: true, reminders: reminders.length, followups: followups.length, created: [...created.values()].reduce((a, b) => a + b, 0), notified, at: now.toISOString() });
}
