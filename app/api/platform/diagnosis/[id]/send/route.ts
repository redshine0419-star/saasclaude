import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendMessage } from '@/lib/messaging/send';
import { hashPhone } from '@/lib/messaging/hash';

type Params = Promise<{ id: string }>;

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { user: { email: session.user.email }, role: 'platform_admin' },
  });
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const request = await prisma.diagnosticRequest.findUnique({ where: { id } });
  if (!request) return NextResponse.json({ error: '신청을 찾을 수 없습니다.' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const resultNote: string = body.resultNote ?? request.resultNote ?? '';

  const messageBody =
    `[첫등원] ${request.academyName} 무료 진단 결과입니다.\n\n` +
    `과목: ${request.subject} / 지역: ${request.area}\n\n` +
    `${resultNote || '담당자가 곧 상세 결과를 안내해 드립니다.'}\n\n` +
    `첫등원 홈페이지 제작 서비스로 더 많은 원생을 모집해보세요.\n` +
    `상담 신청: ${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://growweb.me'}/apply`;

  const recipientHash = hashPhone(request.phone);

  // Use a system tenant id for platform-level messages — null tenant is not possible,
  // so we pass a sentinel value. Adapters only need phone + body + hash.
  const result = await sendMessage({
    tenantId: 'platform',
    recipientId: request.id,
    recipientHash,
    phone: request.phone,
    kind: 'receipt',
    body: messageBody,
    isAdvertisement: false,
    consent: { marketing: false, night: false },
    requestedAt: new Date(),
  });

  if (!result.dispatched) {
    return NextResponse.json({ error: result.reason }, { status: 502 });
  }

  // Mark as done after sending
  await prisma.diagnosticRequest.update({
    where: { id },
    data: { status: 'done', resultNote: resultNote || undefined },
  });

  return NextResponse.json({ ok: true });
}
