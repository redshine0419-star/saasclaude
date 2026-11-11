#!/usr/bin/env node
/**
 * 첫등원 블로그 첫 글 초안을 한 번 넣는다 (빌드 때 실행, 실패해도 빌드는 계속).
 * - 모두 "숨김"(draft) — 운영자가 /platform/blog 에서 검토 후 공개한다
 * - platform_settings 표시가 있으면 다시 넣지 않는다 (지운 초안이 되살아나지 않게)
 * - 같은 글 주소가 이미 있으면 그 글은 건너뛴다
 */
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { BLOG_DRAFTS } from './blog-drafts.mjs';

const MARKER = 'seed:blog-drafts:v1';

if (!process.env.DATABASE_URL) {
  console.log('[seed-blog] DATABASE_URL 없음 — 건너뜀');
  process.exit(0);
}
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  if (await prisma.platformSetting.findUnique({ where: { key: MARKER } })) return console.log('[seed-blog] 초안 이미 넣음 — 건너뜀');
  let n = 0;
  for (const d of BLOG_DRAFTS) {
    if (await prisma.blogPost.findUnique({ where: { slug: d.slug }, select: { id: true } })) continue;
    await prisma.blogPost.create({ data: { ...d, status: 'draft', authorEmail: 'seed@growweb.me' } });
    n++;
  }
  await prisma.platformSetting.create({ data: { key: MARKER, value: new Date().toISOString() } });
  console.log(`[seed-blog] 초안 ${n}편 넣음 (숨김)`);
}

main()
  .catch((e) => console.error('[seed-blog] 실패 (빌드는 계속):', e instanceof Error ? e.message : e))
  .finally(() => prisma.$disconnect());
