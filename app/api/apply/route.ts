import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
      wantsPhotoShoot: Boolean(wantsPhotoShoot),
      queueOrder: count + 1,
      consentTerms: Boolean(consentTerms),
      consentPrivacy: Boolean(consentPrivacy),
      consentBeta: Boolean(consentBeta),
      consentCase: Boolean(consentCase),
      uploadedFiles: Array.isArray(uploadedFiles) ? uploadedFiles.filter((u: unknown) => typeof u === 'string') : [],
    },
  });

  // 플랫폼 관리자에게 신청 접수 알림 (운영 로그 — 실제 이메일 연동 전까지)
  const platformAdmins = await prisma.membership.findMany({
    where: { role: 'platform_admin' },
    include: { user: { select: { email: true } } },
  });
  const adminEmails = platformAdmins.map((m) => m.user.email).filter(Boolean);
  console.log('[apply] 베타 신청 접수:', {
    admins: adminEmails,
    academy: application.academyName,
    area: application.area,
    subject: application.subject,
    queueOrder: application.queueOrder,
    id: application.id,
  });

  return NextResponse.json({ ok: true, id: application.id, queueOrder: application.queueOrder });
}
