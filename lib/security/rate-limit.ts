import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientIp, ipHash } from './ip';

/**
 * 공개 API 요청 횟수 제한 — 서버가 여러 대여도 같은 기준이 되도록 DB(rate_limits)에 센다.
 * 한도를 넘으면 429 응답을, 아니면 null을 돌려준다. DB 오류 때는 막지 않는다(서비스가 멈추지 않게).
 */
export async function rateLimit(
  req: Request,
  scope: string,
  opts: { limit: number; windowSec: number; key?: string },
): Promise<NextResponse | null> {
  const who = opts.key ?? ipHash(clientIp(req));
  const now = Date.now();
  const windowStart = Math.floor(now / (opts.windowSec * 1000));
  const key = `${scope}:${who}:${windowStart}`;
  const expiresAt = new Date((windowStart + 1) * opts.windowSec * 1000);
  try {
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO "rate_limits" ("key", "count", "expiresAt") VALUES (${key}, 1, ${expiresAt})
      ON CONFLICT ("key") DO UPDATE SET "count" = "rate_limits"."count" + 1
      RETURNING "count"`;
    const count = Number(rows[0]?.count ?? 0);
    if (count > opts.limit) {
      const retry = Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000));
      return NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
        { status: 429, headers: { 'Retry-After': String(retry) } },
      );
    }
  } catch (e) {
    console.error('[rate-limit] 확인 실패 (통과시킴)', e instanceof Error ? e.message : e);
  }
  return null;
}

/** 만료된 횟수 기록 정리 (매일 크론) */
export function purgeRateLimits(now = new Date()) {
  return prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: now } } });
}
