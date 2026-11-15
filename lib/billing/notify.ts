import { notifyOwner } from '@/lib/notify/owner';

/** 결제 실패를 원장에게 알린다 (알림함·앱 알림·이메일). 정보성, 카드 정보·금액 외 내용 없음 */
export async function sendBillingFailNotice(tenant: { id: string; name: string; slug: string }, amount: number, willRetry: boolean) {
  await notifyOwner(tenant.id, {
    kind: 'billing',
    title: `이용료 결제 실패 — ${tenant.name}`,
    body: `${amount.toLocaleString('ko-KR')}원 결제에 실패했습니다. ${willRetry ? '내일 다시 시도합니다. 카드 상태를 확인하시거나 다른 카드로 바꿔 주세요.' : '자동 재시도를 마쳤습니다. 결제 화면에서 카드를 다시 등록해 주세요.'}`,
    url: `/${tenant.slug}/admin/billing`,
    tag: 'billing',
    email: true,
  }).catch(() => undefined);
}
