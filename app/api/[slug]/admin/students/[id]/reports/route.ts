import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { studentAccess } from '@/lib/students/access';
import { REPORT_TTL_DAYS, buildReportSnapshot, newReportToken, parseReportInput } from '@/lib/students/report';
import { kstToday } from '@/lib/format-date';

type Params = Promise<{ slug: string; id: string }>;

// POST — 학부모 공유 리포트 미리보기(preview: true) 또는 발행 (원장·실장)
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;
  const a = await studentAccess(slug);
  if (a instanceof NextResponse) return a;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  const parsed = parseReportInput(body, kstToday());
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const input = parsed.data;

  const [student, tenant] = await Promise.all([
    prisma.student.findFirst({
      where: { id, tenantId: a.tenantId },
      select: {
        name: true, grade: true, consentAt: true, class: { select: { name: true } },
        scores: { where: { tenantId: a.tenantId, examDate: { gte: input.start, lte: input.end } }, select: { examDate: true, kind: true, label: true, subject: true, score: true, maxScore: true, rankGrade: true } },
        attendances: { where: { tenantId: a.tenantId, date: { gte: input.start, lte: input.end } }, select: { date: true, status: true } },
      },
    }),
    prisma.tenant.findUnique({ where: { id: a.tenantId }, select: { name: true, slug: true, phone: true, kakaoChannelUrl: true } }),
  ]);
  if (!student || !tenant) return NextResponse.json({ error: '학생을 찾을 수 없습니다.' }, { status: 404 });
  // 학부모 동의 기록이 없으면 학부모에게 내보내지 않는다
  if (!student.consentAt) return NextResponse.json({ error: '학부모 동의 기록이 있어야 리포트를 만들 수 있습니다. 학생부 맨 위에서 먼저 기록해 주세요.' }, { status: 400 });

  const snapshot = buildReportSnapshot({
    academy: { name: tenant.name, slug: tenant.slug, phone: tenant.phone, kakaoChannelUrl: tenant.kakaoChannelUrl },
    student: { name: student.name, grade: student.grade, className: student.class?.name ?? null },
    input,
    scores: student.scores,
    attendances: student.attendances,
  });
  if (body.preview === true) return NextResponse.json({ ok: true, snapshot });

  const report = await prisma.studentReport.create({
    data: {
      tenantId: a.tenantId,
      studentId: id,
      token: newReportToken(),
      periodStart: input.start,
      periodEnd: input.end,
      comment: input.comment,
      snapshot,
      expiresAt: new Date(Date.now() + REPORT_TTL_DAYS * 86400000),
      createdBy: a.email,
    },
    select: { id: true, token: true, expiresAt: true },
  });
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://growweb.me';
  return NextResponse.json({ ok: true, id: report.id, url: `${base}/r/${report.token}`, expiresAt: report.expiresAt });
}
