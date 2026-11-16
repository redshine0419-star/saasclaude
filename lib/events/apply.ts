import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { notifyOwner } from '@/lib/notify/owner';
import { formatKstDate } from '@/lib/format-date';
import { EVENTS, isEventKind, planExtension, resetBetaNotices, type ExtensionPlan } from './index';

type TenantForExtension = { id: string; lifecycleNotices: unknown };
type SubForExtension = { id: string; status: string; nextBillingAt: Date } | null;

const TENANT_SELECT = { id: true, slug: true, planStatus: true, betaEndsAt: true, lifecycleNotices: true, subscription: { select: { id: true, status: true, nextBillingAt: true } } } as const;

/** 계획대로 무료 종료일 또는 다음 결제일을 늦춘다 (한 트랜잭션) */
async function applyExtension(t: TenantForExtension, sub: SubForExtension, plan: ExtensionPlan) {
  const ops: Prisma.PrismaPromise<unknown>[] = [];
  if (plan.target === 'subscription') {
    ops.push(prisma.subscription.update({ where: { id: sub!.id }, data: { nextBillingAt: plan.until } }));
  } else {
    ops.push(
      prisma.tenant.update({
        where: { id: t.id },
        data: { planStatus: 'beta', betaEndsAt: plan.until, lifecycleNotices: resetBetaNotices(t.lifecycleNotices) as Prisma.InputJsonValue },
      }),
    );
    // 무료 기간 중에 카드를 미리 등록했다면 첫 결제일도 새 종료일로 늦춘다
    if (sub && sub.status !== 'canceled' && sub.nextBillingAt < plan.until) {
      ops.push(prisma.subscription.update({ where: { id: sub.id }, data: { nextBillingAt: plan.until } }));
    }
  }
  await prisma.$transaction(ops);
}

/**
 * 운영자 승인 — 무료 종료일(또는 다음 결제일)을 늦추고 원장에게 알린다.
 * 같은 신청을 두 번 승인하지 않도록 pending일 때만 바꾼다.
 */
export async function approveClaim(claimId: string, reviewer: string, now = new Date()) {
  const claim = await prisma.eventClaim.findUnique({
    where: { id: claimId },
    include: { tenant: { select: TENANT_SELECT } },
  });
  if (!claim) return { ok: false as const, error: '신청을 찾을 수 없습니다.' };
  if (claim.status !== 'pending') return { ok: false as const, error: '이미 처리한 신청입니다.' };
  // 같은 이벤트를 이미 받은 학원이면 승인하지 않는다
  const already = await prisma.eventClaim.findFirst({ where: { tenantId: claim.tenantId, kind: claim.kind, status: 'approved' }, select: { id: true } });
  if (already) return { ok: false as const, error: '이 학원은 이 이벤트 혜택을 이미 받았습니다.' };

  const t = claim.tenant;
  const sub = t.subscription;
  const plan = planExtension(t, sub, claim.months, now);

  // 1) 먼저 신청을 승인으로 잡는다 — 동시에 두 번 눌러도 한 번만 통과한다
  const claimed = await prisma.eventClaim.updateMany({
    where: { id: claim.id, status: 'pending' },
    data: { status: 'approved', reviewedAt: now, reviewedBy: reviewer, appliedTo: plan.target, freeUntil: plan.until, rejectReason: null },
  });
  if (claimed.count === 0) return { ok: false as const, error: '이미 처리한 신청입니다.' };

  // 2) 기간 늘리기
  try {
    await applyExtension(t, sub, plan);
  } catch (e) {
    // 기간을 못 늘렸으면 신청을 확인 중으로 되돌린다
    await prisma.eventClaim.update({ where: { id: claim.id }, data: { status: 'pending', reviewedAt: null, reviewedBy: null, appliedTo: null, freeUntil: null } }).catch(() => undefined);
    throw e;
  }

  const title = isEventKind(claim.kind) ? EVENTS[claim.kind].title : '이벤트';
  await notifyOwner(t.id, {
    kind: 'event',
    title: `이벤트 혜택 적용 — ${claim.months}개월 무료`,
    body: plan.target === 'subscription'
      ? `"${title}" 신청이 승인되어 다음 결제일이 ${formatKstDate(plan.until)}로 늦춰졌습니다.`
      : `"${title}" 신청이 승인되어 무료 이용 기간이 ${formatKstDate(plan.until)}까지 늘었습니다.`,
    url: `/${t.slug}/admin/billing`,
    tag: 'event',
    email: true,
  }).catch(() => undefined);

  return { ok: true as const, target: plan.target, until: plan.until };
}

export async function rejectClaim(claimId: string, reviewer: string, reason: string, now = new Date()) {
  const claim = await prisma.eventClaim.findUnique({ where: { id: claimId }, include: { tenant: { select: { id: true, slug: true } } } });
  if (!claim) return { ok: false as const, error: '신청을 찾을 수 없습니다.' };
  if (claim.status !== 'pending') return { ok: false as const, error: '이미 처리한 신청입니다.' };
  const r = await prisma.eventClaim.updateMany({ where: { id: claim.id, status: 'pending' }, data: { status: 'rejected', reviewedAt: now, reviewedBy: reviewer, rejectReason: reason } });
  if (r.count === 0) return { ok: false as const, error: '이미 처리한 신청입니다.' };
  const title = isEventKind(claim.kind) ? EVENTS[claim.kind].title : '이벤트';
  await notifyOwner(claim.tenant.id, {
    kind: 'event',
    title: `이벤트 신청을 다시 확인해 주세요`,
    body: `"${title}" 신청이 반려되었습니다. 사유: ${reason}. 고쳐서 다시 신청할 수 있습니다.`,
    url: `/${claim.tenant.slug}/admin/billing`,
    tag: 'event',
    email: true,
  }).catch(() => undefined);
  return { ok: true as const };
}

export const GRANT_MAX_MONTHS = 12;

/**
 * 운영자가 신청 없이 학원에 무료 기간을 직접 더한다 (예: 오프라인 행사, 장애 보상).
 * 이벤트 기록(event_claims, kind=manual)에 사유와 함께 남긴다 — 학원 이벤트(개선 제안·블로그) 횟수에는 세지 않는다.
 */
export async function grantFreeMonths(
  tenantId: string,
  months: number,
  reason: string,
  operator: string,
  opts: { notify: boolean },
  now = new Date(),
) {
  if (!Number.isInteger(months) || months < 1 || months > GRANT_MAX_MONTHS) return { ok: false as const, error: `1~${GRANT_MAX_MONTHS}개월 사이로 넣어 주세요.` };
  const why = reason.trim().slice(0, 300);
  if (!why) return { ok: false as const, error: '사유를 적어 주세요.' };
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: TENANT_SELECT });
  if (!t) return { ok: false as const, error: '학원을 찾을 수 없습니다.' };

  const plan = planExtension(t, t.subscription, months, now);
  const rec = await prisma.eventClaim.create({
    data: { tenantId: t.id, kind: 'manual', status: 'approved', months, content: why, submittedBy: operator, reviewedAt: now, reviewedBy: operator, appliedTo: plan.target, freeUntil: plan.until },
    select: { id: true },
  });
  try {
    await applyExtension(t, t.subscription, plan);
  } catch (e) {
    await prisma.eventClaim.delete({ where: { id: rec.id } }).catch(() => undefined);
    throw e;
  }

  if (opts.notify) {
    await notifyOwner(t.id, {
      kind: 'event',
      title: `무료 이용 기간 ${months}개월 추가`,
      body: plan.target === 'subscription'
        ? `더클 운영자가 ${months}개월 혜택을 드려 다음 결제일이 ${formatKstDate(plan.until)}로 늦춰졌습니다.`
        : `더클 운영자가 무료 이용 기간을 ${formatKstDate(plan.until)}까지 늘려 드렸습니다.`,
      url: `/${t.slug}/admin/billing`,
      tag: 'event',
      email: true,
    }).catch(() => undefined);
  }
  return { ok: true as const, target: plan.target, until: plan.until };
}
