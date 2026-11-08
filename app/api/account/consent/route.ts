import { after, NextRequest, NextResponse } from 'next/server';
import { maskEmail, pushToOperators } from '@/lib/push';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ensureUser } from '@/lib/users';
import { CONSENT_VERSION } from '@/lib/legal/documents';

// POST — 회원가입 동의 (필수: 만 14세 이상·이용약관·개인정보 수집·이용 / 선택: 홍보 목적 수집·이용, 광고성 정보 수신)
export async function POST(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  const b = await req.json().catch(() => null);
  if (!b || b.age !== true || b.terms !== true || b.privacy !== true) {
    return NextResponse.json({ error: '필수 항목에 모두 동의해 주세요.' }, { status: 400 });
  }
  // 광고성 정보 수신(ad)은 기존 marketing 칸에 기록한다 (예전 화면이 보내는 marketing도 받는다)
  const marketing = b.ad === true || b.marketing === true;
  const promo = b.promo === true || (b.promo === undefined && b.marketing === true);
  const now = new Date();
  const user = await ensureUser(email, session.user?.name, session.user?.image);
  // 처음 동의 = 회원가입 완료 (약관이 바뀌어 다시 동의하는 경우는 제외)
  const isNewSignup = !user.termsAgreedAt;
  const wasMarketing = !!user.marketingAgreedAt && !user.marketingRevokedAt;
  const wasPromo = !!user.promoAgreedAt && !user.promoRevokedAt;

  const logs: { type: string; action: string }[] = [
    { type: 'age', action: 'agree' },
    { type: 'terms', action: 'agree' },
    { type: 'privacy', action: 'agree' },
  ];
  if (marketing && !wasMarketing) logs.push({ type: 'marketing', action: 'agree' });
  if (!marketing && wasMarketing) logs.push({ type: 'marketing', action: 'revoke' });
  if (promo && !wasPromo) logs.push({ type: 'promo', action: 'agree' });
  if (!promo && wasPromo) logs.push({ type: 'promo', action: 'revoke' });

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        ageConfirmedAt: now, termsAgreedAt: now, privacyAgreedAt: now, consentVersion: CONSENT_VERSION,
        ...(marketing ? (wasMarketing ? {} : { marketingAgreedAt: now, marketingRevokedAt: null }) : wasMarketing ? { marketingRevokedAt: now } : {}),
        ...(promo ? (wasPromo ? {} : { promoAgreedAt: now, promoRevokedAt: null }) : wasPromo ? { promoRevokedAt: now } : {}),
      },
    }),
    prisma.userConsentLog.createMany({ data: logs.map((l) => ({ ...l, userId: user.id, version: CONSENT_VERSION })) }),
  ]);
  if (isNewSignup) {
    after(() =>
      pushToOperators({ title: '새 회원가입', body: `${maskEmail(email)}${promo || marketing ? ' · 마케팅 수신 동의' : ''}`, url: '/platform', tag: 'op-signup' }).catch(() => 0),
    );
  }
  return NextResponse.json({ ok: true });
}
