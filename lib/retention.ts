import { list, del } from '@vercel/blob';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '@/lib/prisma';

/**
 * 개인정보 보유 기간 정리 (개인정보처리방침 2·7번).
 * - 학원: 홈페이지가 비공개로 바뀐 뒤 TENANT_PURGE_DAYS일이 지나면 학원의 모든 데이터를 영구 삭제한다.
 *   결제 기록만 전자상거래법(5년)에 따라 PaymentArchive로 옮겨 보관한다.
 * - 직원 초대: 만료된 초대는 지운다.
 * - 보관 결제 기록: 5년이 지나면 지운다.
 */
export const TENANT_PURGE_DAYS = 30;
export const PAYMENT_KEEP_YEARS = 5;
const DAY = 24 * 60 * 60 * 1000;

export function purgeDueAt(inactiveAt: Date): Date {
  return new Date(inactiveAt.getTime() + TENANT_PURGE_DAYS * DAY);
}

export function paymentDeleteAfter(paidAt: Date): Date {
  const d = new Date(paidAt);
  d.setUTCFullYear(d.getUTCFullYear() + PAYMENT_KEEP_YEARS);
  return d;
}

/** 학원이 올린 파일(사진·동의서·레벨테스트 답안 사진) 삭제 — 저장 경로가 모두 `{slug}/`로 시작한다 (lib/storage.ts) */
async function deleteTenantFiles(slug: string): Promise<number> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    let removed = 0;
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: `${slug}/`, cursor, limit: 1000 });
      if (page.blobs.length) {
        await del(page.blobs.map((b) => b.url));
        removed += page.blobs.length;
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return removed;
  }
  if (process.env.NODE_ENV !== 'production') {
    await rm(path.join(process.cwd(), 'public', 'dev-uploads', slug), { recursive: true, force: true });
  }
  return 0;
}

/** 학원 하나의 데이터를 영구 삭제한다. 되돌릴 수 없다. */
export async function purgeTenant(tenantId: string): Promise<{ slug: string; payments: number; files: number }> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, slug: true, name: true, regNo: true } });
  if (!tenant) throw new Error('tenant not found');

  // 1) 결제 기록 보관 (5년)
  const payments = await prisma.payment.findMany({ where: { tenantId } });
  if (payments.length) {
    await prisma.paymentArchive.createMany({
      skipDuplicates: true,
      data: payments.map((p) => ({
        deleteAfter: paymentDeleteAfter(p.createdAt),
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        regNo: tenant.regNo,
        orderId: p.orderId,
        tierKey: p.tierKey,
        amount: p.amount,
        status: p.status,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        paidAt: p.createdAt,
      })),
    });
  }

  // 2) 올린 파일
  const files = await deleteTenantFiles(tenant.slug);

  // 3) DB — 서로 막고 있는(Restrict) 시험 기록과 연결 없는 기록부터 지우고, 나머지는 학원 삭제로 함께 지운다
  await prisma.$transaction([
    prisma.testResponse.deleteMany({ where: { tenantId } }),
    prisma.testAttempt.deleteMany({ where: { tenantId } }),
    prisma.testItem.deleteMany({ where: { test: { tenantId } } }),
    prisma.tenantContactLog.deleteMany({ where: { tenantId } }),
    prisma.proxyAccessLog.deleteMany({ where: { tenantId } }),
    prisma.tenant.delete({ where: { id: tenantId } }),
  ]);

  return { slug: tenant.slug, payments: payments.length, files };
}

/** 매일 한 번 (Vercel Cron) */
export async function runRetention(now: Date = new Date()) {
  const cutoff = new Date(now.getTime() - TENANT_PURGE_DAYS * DAY);
  const due = await prisma.tenant.findMany({
    where: { status: 'inactive', inactiveAt: { not: null, lt: cutoff } },
    select: { id: true },
  });
  const purged: { slug: string; payments: number; files: number }[] = [];
  const failed: string[] = [];
  for (const t of due) {
    try {
      purged.push(await purgeTenant(t.id));
    } catch (e) {
      // 다음 날 다시 시도한다. 로그에는 학원 id만 남긴다
      console.error('[retention] 학원 파기 실패', t.id, e instanceof Error ? e.message : e);
      failed.push(t.id);
    }
  }
  const invites = await prisma.memberInvite.deleteMany({ where: { expiresAt: { lt: now } } });
  const archives = await prisma.paymentArchive.deleteMany({ where: { deleteAfter: { lt: now } } });
  return { purged, failed, expiredInvites: invites.count, expiredPaymentArchives: archives.count };
}
