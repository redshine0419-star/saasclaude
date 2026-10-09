import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';
import { sendMessage } from '@/lib/messaging/send';
import { hashPhone } from '@/lib/messaging/hash';

type Params = Promise<{ slug: string; month: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { slug, month } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await getAdminMembership(tenant.id, session.user.email!);
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '입력 오류' }, { status: 400 });

  const report = await prisma.monthlyReport.upsert({
    where: { tenantId_month: { tenantId: tenant.id, month } },
    update: {
      ...(body.aiCheck !== undefined && { aiCheck: body.aiCheck }),
      ...(body.managerNote !== undefined && { managerNote: body.managerNote }),
    },
    create: {
      tenantId: tenant.id,
      month,
      snapshot: {},
      aiCheck: body.aiCheck ?? null,
      managerNote: body.managerNote ?? null,
    },
  });

  return NextResponse.json({ ok: true, report: { month: report.month, managerNote: report.managerNote } });
}

// POST — 월간 요약 카카오 수동 발송
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug, month } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({
    where: { slug, status: 'active' },
    select: { id: true, name: true, slug: true, notifyRecipients: true },
  });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await getAdminMembership(tenant.id, session.user.email!);
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [y, m] = month.split('-').map(Number);
  const monthStart = new Date(Date.UTC(y, m - 1, 1));
  const monthEnd = new Date(Date.UTC(y, m, 1));

  const [totalLeads, enrolledLeads, messagesSent, marketingConsents] = await Promise.all([
    prisma.lead.count({ where: { tenantId: tenant.id, createdAt: { gte: monthStart, lt: monthEnd } } }),
    prisma.lead.count({ where: { tenantId: tenant.id, createdAt: { gte: monthStart, lt: monthEnd }, status: 'enrolled' } }),
    prisma.message.count({ where: { tenantId: tenant.id, createdAt: { gte: monthStart, lt: monthEnd }, status: 'sent' } }),
    prisma.consent.count({ where: { tenantId: tenant.id, type: 'marketing', grantedAt: { not: null }, revokedAt: null } }),
  ]);

  const conversionRate = totalLeads > 0 ? Math.round((enrolledLeads / totalLeads) * 100) : 0;

  if (tenant.notifyRecipients.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: '수신자 없음' });
  }

  const summaryBody =
    `[${tenant.name}] ${month} 월간 리포트\n\n` +
    `상담 신청: ${totalLeads}건\n` +
    `등록 전환: ${enrolledLeads}건 (${conversionRate}%)\n` +
    `카톡 발송: ${messagesSent}건\n` +
    `마케팅 동의: ${marketingConsents}명\n\n` +
    `상세 리포트: ${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://growweb.me'}/${tenant.slug}/admin/report`;

  const now = new Date();
  let sent = 0;
  for (const recipient of tenant.notifyRecipients as { id: string; phone: string }[]) {
    await sendMessage({
      tenantId: tenant.id,
      recipientId: recipient.id,
      recipientHash: hashPhone(recipient.phone),
      phone: recipient.phone,
      kind: 'owner_alert',
      body: summaryBody,
      isAdvertisement: false,
      consent: { marketing: true, night: false },
      requestedAt: now,
    }).catch(() => {});
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
