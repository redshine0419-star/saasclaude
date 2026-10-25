import { after, NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { maskPhoneForMail, notifyOperator } from '@/lib/mail/operator';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '입력 오류' }, { status: 400 });

  const { academyName, area, subject, directorName, phone, currentUrl,
    wantsPhotoShoot, consentTerms, consentPrivacy, consentBeta, consentCase, uploadedFiles } = body;

  if (!academyName || !area || !subject || !directorName || !phone) {
    return NextResponse.json({ error: '필수 항목을 모두 입력해주세요.' }, { status: 400 });
  }
  if (!consentTerms || !consentPrivacy || !consentBeta) {
    return NextResponse.json({ error: '필수 동의 항목에 동의해주세요.' }, { status: 400 });
  }

  let application;
  try {
    const count = await prisma.application.count();
    application = await prisma.application.create({
      data: {
        academyName: String(academyName).trim().slice(0, 60),
        area: String(area).trim().slice(0, 60),
        subject: String(subject).trim().slice(0, 40),
        directorName: String(directorName).trim().slice(0, 40),
        phone: String(phone).trim().slice(0, 20),
        currentUrl: typeof currentUrl === 'string' && currentUrl.trim() ? currentUrl.trim().slice(0, 500) : null,
        wantsPhotoShoot: Boolean(wantsPhotoShoot),
        queueOrder: count + 1,
        consentTerms: Boolean(consentTerms),
        consentPrivacy: Boolean(consentPrivacy),
        consentBeta: Boolean(consentBeta),
        consentCase: Boolean(consentCase),
        uploadedFiles: Array.isArray(uploadedFiles)
          ? uploadedFiles.filter((u: unknown): u is string => typeof u === 'string' && /^https:\/\//.test(u)).slice(0, 10)
          : [],
      },
    });
  } catch (e) {
    console.error('[apply] create failed:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: '신청을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 });
  }

  // 운영자는 P-04 칸반에서 확인한다. 로그에는 연락처를 남기지 않는다.
  console.log('[apply] 제작 대행 신청 접수:', { id: application.id, academy: application.academyName, queueOrder: application.queueOrder });

  const a = application;
  after(() =>
    notifyOperator({
      subject: `[첫등원] 제작 대행 신청 — ${a.academyName}`,
      heading: `제작 대행 신청이 들어왔습니다 (대기 ${a.queueOrder}번)`,
      rows: [
        ['학원명', a.academyName],
        ['지역 · 과목', `${a.area} · ${a.subject}`],
        ['원장', a.directorName],
        ['연락처', maskPhoneForMail(a.phone)],
        ['현재 홈페이지', a.currentUrl ?? '없음'],
        ['사진 촬영 희망', a.wantsPhotoShoot ? '예' : '아니오'],
        ['첨부 자료', `${a.uploadedFiles.length}개`],
      ],
      linkPath: '/platform/queue',
      linkLabel: '제작 대기열에서 보기',
    }),
  );

  return NextResponse.json({ ok: true, id: application.id, queueOrder: application.queueOrder });
}
