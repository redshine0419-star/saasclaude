import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { billingOwner } from '@/lib/billing/access';
import { getBillingAdapter } from '@/lib/billing';
import { chargeSubscription } from '@/lib/billing/charge';
import { firstBillingAt } from '@/lib/billing/schedule';
import { sendBillingFailNotice } from '@/lib/billing/notify';

type Params = Promise<{ slug: string }>;

// POST — 카드 등록(또는 변경) + 정기결제 동의. 결제일이 이미 지났으면(베타 끝난 뒤) 바로 첫 결제
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;
  const a = await billingOwner(slug);
  if (a instanceof NextResponse) return a;
  const body = await req.json().catch(() => null);
  if (body?.consent !== true) return NextResponse.json({ error: '정기결제 안내를 확인하고 동의해 주세요.' }, { status: 400 });
  if (body?.thirdPartyConsent !== true) return NextResponse.json({ error: '결제대행사 개인정보 제공에 동의해야 카드를 등록할 수 있습니다.' }, { status: 400 });

  const now = new Date();
  const card = await getBillingAdapter().registerCard({ customerKey: a.tenant.id, testFail: body.testFail === true });
  const existing = await prisma.subscription.findUnique({ where: { tenantId: a.tenant.id } });
  // 정상 이용 중 카드만 바꾸는 경우 결제일은 그대로, 실패·해지 상태에서 다시 등록하면 지금(또는 베타 종료일)부터
  const keepDate = existing && existing.status === 'active' && existing.nextBillingAt > now;
  const nextBillingAt = keepDate ? existing.nextBillingAt : firstBillingAt(now, a.tenant.planStatus, a.tenant.betaEndsAt);

  const sub = await prisma.subscription.upsert({
    where: { tenantId: a.tenant.id },
    create: { tenantId: a.tenant.id, provider: getBillingAdapter().provider, billingKey: card.billingKey, cardLabel: card.cardLabel, nextBillingAt, consentAt: now, consentBy: a.email, thirdPartyConsentAt: now },
    update: { provider: getBillingAdapter().provider, billingKey: card.billingKey, cardLabel: card.cardLabel, nextBillingAt, status: 'active', failCount: 0, canceledAt: null, consentAt: now, consentBy: a.email, thirdPartyConsentAt: now },
  });

  let charged = null;
  if (sub.nextBillingAt <= now) {
    charged = await chargeSubscription(sub.id, now);
    if (charged.status === 'failed') await sendBillingFailNotice(a.tenant, charged.amount, true);
  }
  return NextResponse.json({ ok: true, cardLabel: card.cardLabel, nextBillingAt: sub.nextBillingAt, charged });
}
