import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/mail/send';
import { renderDiagnosisMail, type DiagnosisScores } from '@/lib/diagnosis/result-mail';

type Params = Promise<{ id: string }>;

function isScores(v: unknown): v is DiagnosisScores {
  const o = v as Record<string, { score?: unknown }> | null;
  return !!o && ['homepage', 'seo', 'conversion', 'mobile'].every((k) => typeof o[k]?.score === 'number');
}

/**
 * POST /api/platform/diagnosis/[id]/send — 운영자가 진단 결과를 다시 보낸다.
 * 이메일로 받은 신청(2026-11-16~)은 메일로 보내고, 예전 휴대폰 신청은 운영자가 문자 앱으로 직접 보낸 뒤 처리 완료만 기록한다.
 */
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
  const resultNote: string = typeof body.resultNote === 'string' ? body.resultNote.slice(0, 2000) : request.resultNote ?? '';
  const scores = isScores(body.scores) ? body.scores : isScores(request.scores) ? request.scores : null;

  if (request.email) {
    // 운영자 메모(resultNote)는 내부용이라 메일에는 넣지 않는다 — 항목별 메모만 들어간다
    const m = renderDiagnosisMail(request, scores, '');
    const r = await sendMail({ to: [request.email], ...m });
    if (!r.sent) {
      return NextResponse.json({ error: r.reason === 'mock' ? '메일 발송이 설정되지 않았습니다 (RESEND_API_KEY).' : `메일을 보내지 못했습니다 (${r.reason ?? '오류'})` }, { status: 502 });
    }
  }

  await prisma.diagnosticRequest.update({ where: { id }, data: { status: 'done', resultNote: resultNote || undefined } });
  return NextResponse.json({ ok: true, via: request.email ? 'email' : 'manual' });
}
