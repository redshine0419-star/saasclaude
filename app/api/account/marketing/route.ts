import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { CONSENT_VERSION } from '@/lib/legal/documents';

// PATCH — 마케팅 수신 동의/철회 (선택 동의, 언제든 바꿀 수 있다)
export async function PATCH(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  const b = await req.json().catch(() => null);
  if (typeof b?.agree !== 'boolean') return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: '회원 정보를 찾을 수 없습니다.' }, { status: 404 });
  const now = new Date();
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: b.agree ? { marketingAgreedAt: now, marketingRevokedAt: null } : { marketingRevokedAt: now } }),
    prisma.userConsentLog.create({ data: { userId: user.id, type: 'marketing', action: b.agree ? 'agree' : 'revoke', version: CONSENT_VERSION } }),
  ]);
  return NextResponse.json({ ok: true, agreed: b.agree });
}
