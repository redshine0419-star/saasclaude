import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ slug: string }>;

// 종합 데이터 내보내기 — 베타 종료 시 상담 기록·콘텐츠 내보내기 (SPEC 10장)
export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await prisma.membership.findFirst({
    where: { tenantId: tenant.id, user: { email: session.user.email }, role: 'owner' },
  });
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [leads, reviews, posts, classes, staff, messages] = await Promise.all([
    prisma.lead.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
      include: {
        events: { orderBy: { createdAt: 'asc' }, select: { type: true, createdAt: true, payload: true } },
      },
    }),
    prisma.review.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.post.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.classItem.findMany({
      where: { tenantId: tenant.id },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.staffProfile.findMany({
      where: { tenantId: tenant.id },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.message.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
      take: 5000,
      select: { scenario: true, kind: true, channel: true, status: true, sentAt: true, createdAt: true },
    }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    academy: {
      name: tenant.name,
      slug: tenant.slug,
      phone: tenant.phone,
      address: tenant.address,
      hours: tenant.hours,
      betaEndsAt: tenant.betaEndsAt,
    },
    leads: leads.map((l) => ({
      createdAt: l.createdAt,
      parentName: l.parentName,
      phone: l.phone,
      studentGrade: l.studentGrade,
      consultType: l.consultType,
      source: l.source,
      status: l.status,
      statusChangedAt: l.statusChangedAt,
      message: l.message,
      events: l.events,
    })),
    reviews: reviews.map((r) => ({
      kind: r.kind,
      body: r.body,
      authorLabel: r.authorLabel,
      source: r.source,
      beforeValue: r.beforeValue,
      afterValue: r.afterValue,
      periodLabel: r.periodLabel,
      comment: r.comment,
      gradeBand: r.gradeBand,
      visible: r.visible,
      consentConfirmed: r.consentConfirmed,
      createdAt: r.createdAt,
    })),
    posts: posts.map((p) => ({
      title: p.title,
      body: p.body,
      summaryFields: p.summaryFields,
      images: p.images,
      publishedAt: p.publishedAt,
      createdAt: p.createdAt,
    })),
    classes: classes.map((c) => ({
      name: c.name,
      gradeBand: c.gradeBand,
      days: c.days,
      startTime: c.startTime,
      endTime: c.endTime,
      seatsLeft: c.seatsLeft,
      description: c.description,
    })),
    staff: staff.map((s) => ({
      name: s.name,
      roleLabel: s.roleLabel,
      summary: s.summary,
    })),
    messageSummary: {
      total: messages.length,
      sent: messages.filter((m) => m.status === 'sent').length,
      failed: messages.filter((m) => m.status === 'failed').length,
    },
  };

  const filename = `export_${slug}_${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
