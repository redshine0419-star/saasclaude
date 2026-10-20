import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/level-test/guard';
import { newAttemptToken } from '@/lib/level-test/attempt';

type Params = Promise<{ slug: string; id: string }>;

// 상담 건에 레벨테스트 응시 링크 발급
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;
  const g = await guardAdmin(slug);
  if ('error' in g) return g.error;

  const lead = await prisma.lead.findFirst({ where: { id, tenantId: g.tenant.id }, select: { id: true } });
  if (!lead) return NextResponse.json({ error: '상담을 찾을 수 없습니다.' }, { status: 404 });

  const b = await req.json().catch(() => ({}));
  const test = await prisma.test.findFirst({
    where: { id: String(b.testId ?? ''), tenantId: g.tenant.id, archived: false },
    include: { _count: { select: { items: true } } },
  });
  if (!test) return NextResponse.json({ error: '시험지를 선택해 주세요.' }, { status: 400 });
  if (test._count.items === 0) return NextResponse.json({ error: '문항이 없는 시험지입니다.' }, { status: 400 });

  const attempt = await prisma.testAttempt.create({
    data: { tenantId: g.tenant.id, testId: test.id, leadId: lead.id, token: newAttemptToken(), issuedBy: g.email },
  });
  await prisma.leadEvent.create({
    data: { leadId: lead.id, type: 'note', payload: { note: `레벨테스트 링크 발급: ${test.title}` }, actorId: g.email },
  });

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://growweb.me';
  return NextResponse.json({ ok: true, attemptId: attempt.id, url: `${base}/${slug}/test/${attempt.token}` });
}
