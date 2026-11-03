import { prisma } from '@/lib/prisma';
import { sendMessage } from '@/lib/messaging/send';
import { hashPhone } from '@/lib/messaging/hash';

/** 결제 실패를 원장(새 상담 알림 받는 번호)에게 알린다. 정보성, 카드 정보·금액 외 내용 없음 */
export async function sendBillingFailNotice(tenant: { id: string; name: string; slug: string }, amount: number, willRetry: boolean) {
  const recipients = await prisma.notifyRecipient.findMany({ where: { tenantId: tenant.id }, select: { phone: true } });
  const url = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://growweb.me'}/${tenant.slug}/admin/billing`;
  const body = [
    `[첫등원] ${tenant.name} 이용료 ${amount.toLocaleString('ko-KR')}원 결제에 실패했습니다.`,
    willRetry ? '내일 다시 결제를 시도합니다. 카드 상태를 확인하시거나 다른 카드로 바꿔 주세요.' : '자동 재시도를 마쳤습니다. 관리자 화면에서 카드를 다시 등록해 주세요.',
    '',
    url,
  ].join('\n');
  for (const r of recipients) {
    await sendMessage({
      tenantId: tenant.id,
      recipientId: '',
      recipientHash: hashPhone(r.phone),
      phone: r.phone,
      kind: 'billing_failed',
      body,
      isAdvertisement: false,
      consent: { marketing: false, night: false },
      requestedAt: new Date(),
    }).catch(() => undefined);
  }
}
