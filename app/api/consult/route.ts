import { after, NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { runDiagnosis } from '@/lib/diagnosis/run';
import { maskPhoneForMail, notifyOperator } from '@/lib/mail/operator';

const SCORE_LABEL = { homepage: '홈페이지 현황', seo: 'SEO 노출도', conversion: '상담 전환 구조', mobile: '모바일 최적화' } as const;

export const maxDuration = 20;

function text(v: unknown, max: number) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '입력 오류' }, { status: 400 });

  const academyName = text(body.academyName, 60);
  const area = text(body.area, 60);
  const subject = text(body.subject, 40);
  const phone = text(body.phone, 20);
  const currentUrl = text(body.currentUrl, 500) || null;

  if (!academyName || !area || !subject || !phone) {
    return NextResponse.json({ error: '필수 항목을 모두 입력해주세요.' }, { status: 400 });
  }
  if (!body.agreed) {
    return NextResponse.json({ error: '개인정보 수집·이용에 동의해주세요.' }, { status: 400 });
  }

  const record = await prisma.diagnosticRequest.create({
    data: { academyName, area, subject, phone, currentUrl },
  });

  // 자동 진단: 결과를 바로 보여주고, 운영자는 P-03에서 필요할 때만 보완한다.
  const result = await runDiagnosis(currentUrl);
  const scores = {
    homepage: { score: result.items.homepage.score, note: result.items.homepage.note },
    seo: { score: result.items.seo.score, note: result.items.seo.note },
    conversion: { score: result.items.conversion.score, note: result.items.conversion.note },
    mobile: { score: result.items.mobile.score, note: result.items.mobile.note },
    auto: { kind: result.kind, platform: result.platform ?? null, at: new Date().toISOString(), items: result.items },
  };
  await prisma.diagnosticRequest.update({
    where: { id: record.id },
    data: {
      scores: scores as unknown as Prisma.InputJsonValue,
      status: 'done',
      resultNote: '자동 진단 완료',
    },
  });

  after(() =>
    notifyOperator({
      subject: `[첫등원] 무료 진단 신청 — ${academyName}`,
      heading: '무료 진단 신청이 들어왔습니다',
      rows: [
        ['학원명', academyName],
        ['지역 · 과목', `${area} · ${subject}`],
        ['연락처', maskPhoneForMail(phone)],
        ['현재 홈페이지', currentUrl ?? '없음'],
        ...(Object.keys(SCORE_LABEL) as (keyof typeof SCORE_LABEL)[]).map(
          (k): [string, string] => [SCORE_LABEL[k], `${result.items[k].score}/3 · ${result.items[k].note}`],
        ),
      ],
      linkPath: '/platform/diagnosis',
      linkLabel: '플랫폼 관리자에서 보기',
    }),
  );

  return NextResponse.json({ ok: true, id: record.id });
}
