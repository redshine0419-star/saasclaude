import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '입력 오류' }, { status: 400 });

  const { academyName, area, subject, directorName, phone, currentUrl,
    consentTerms, consentPrivacy, consentBeta, consentCase } = body;

  if (!academyName || !area || !subject || !directorName || !phone) {
    return NextResponse.json({ error: '필수 항목을 모두 입력해주세요.' }, { status: 400 });
  }
  if (!consentTerms || !consentPrivacy || !consentBeta) {
    return NextResponse.json({ error: '필수 동의 항목에 동의해주세요.' }, { status: 400 });
  }

  // Get next queue order
  const count = await prisma.application.count();

  const application = await prisma.application.create({
    data: {
      academyName: academyName.trim(),
      area: area.trim(),
      subject: subject.trim(),
      directorName: directorName.trim(),
      phone: phone.trim(),
      currentUrl: currentUrl?.trim() || null,
      queueOrder: count + 1,
      consentTerms: Boolean(consentTerms),
      consentPrivacy: Boolean(consentPrivacy),
      consentBeta: Boolean(consentBeta),
      consentCase: Boolean(consentCase),
    },
  });

  return NextResponse.json({ ok: true, id: application.id, queueOrder: application.queueOrder });
}
