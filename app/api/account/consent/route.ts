import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ensureUser } from '@/lib/users';
import { CONSENT_VERSION } from '@/lib/legal/documents';

// POST — 회원가입 동의 (필수: 만 14세 이상·이용약관·개인정보 수집·이용 / 선택: 마케팅 수신)
export async function POST(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  const b = await req.json().catch(() => null);
  if (!b || b.age !== true || b.terms !== true || b.privacy !== true) {
    return NextResponse.json({ error: '필수 항목에 모두 동의해 주세요.' }, { status: 400 });
  }
  const marketing = b.marketing === true;
  const now = new Date();
  const user = await ensureUser(email, session.user?.name, session.user?.image);
  const wasMarketing = !!user.marketingAgreedAt && !user.marketingRevokedAt;

  const logs: { type: string; action: string }[] = [
    { type: 'age', action: 'agree' },
    { type: 'terms', action: 'agree' },
    { type: 'privacy', action: 'agree' },
  ];
  if (marketing && !wasMarketing) logs.push({ type: 'marketing', action: 'agree' });
  if (!marketing && wasMarketing) logs.push({ type: 'marketing', action: 'revoke' });

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        ageConfirmedAt: now, termsAgreedAt: now, privacyAgreedAt: now, consentVersion: CONSENT_VERSION,
        ...(marketing ? (wasMarketing ? {} : { marketingAgreedAt: now, marketingRevokedAt: null }) : wasMarketing ? { marketingRevokedAt: now } : {}),
      },
    }),
    prisma.userConsentLog.createMany({ data: logs.map((l) => ({ ...l, userId: user.id, version: CONSENT_VERSION })) }),
  ]);
  return NextResponse.json({ ok: true });
}
