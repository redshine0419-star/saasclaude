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
// v2: 5번 글(student-privacy-consent)을 운영자가 준 원고로 교체 — 아직 숨김이고 아무도 고치지 않은 초안일 때만
const UPDATES = [{ marker: 'seed:blog-drafts:v2', slugs: ['student-privacy-consent'] }];

if (!process.env.DATABASE_URL) {
  console.log('[seed-blog] DATABASE_URL 없음 — 건너뜀');
  process.exit(0);
}
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });

async function applyUpdates() {
  for (const u of UPDATES) {
    if (await prisma.platformSetting.findUnique({ where: { key: u.marker } })) continue;
    for (const slug of u.slugs) {
      const d = BLOG_DRAFTS.find((x) => x.slug === slug);
      const cur = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true, status: true, authorEmail: true, createdAt: true, updatedAt: true } });
      if (!d || !cur) continue;
      const untouched = cur.status === 'draft' && cur.authorEmail === 'seed@growweb.me' && cur.updatedAt.getTime() - cur.createdAt.getTime() < 60_000;
      if (!untouched) { console.log(`[seed-blog] ${slug} 운영자가 고친 글 — 교체하지 않음`); continue; }
      await prisma.blogPost.update({ where: { id: cur.id }, data: { title: d.title, summary: d.summary, body: d.body, category: d.category, createdAt: new Date(), updatedAt: new Date() } });
      console.log(`[seed-blog] ${slug} 초안 교체`);
    }
    await prisma.platformSetting.create({ data: { key: u.marker, value: new Date().toISOString() } });
  }
}

async function main() {
  if (await prisma.platformSetting.findUnique({ where: { key: MARKER } })) {
    console.log('[seed-blog] 초안 이미 넣음 — 건너뜀');
    return applyUpdates();
  }
  let n = 0;
  for (const d of BLOG_DRAFTS) {
    if (await prisma.blogPost.findUnique({ where: { slug: d.slug }, select: { id: true } })) continue;
    await prisma.blogPost.create({ data: { ...d, status: 'draft', authorEmail: 'seed@growweb.me' } });
    n++;
  }
  await prisma.platformSetting.create({ data: { key: MARKER, value: new Date().toISOString() } });
  console.log(`[seed-blog] 초안 ${n}편 넣음 (숨김)`);
  // 처음 넣을 때는 이미 최신 원고이므로 교체 표시만 남긴다
  for (const u of UPDATES) await prisma.platformSetting.upsert({ where: { key: u.marker }, update: {}, create: { key: u.marker, value: new Date().toISOString() } });
}

main()
  .catch((e) => console.error('[seed-blog] 실패 (빌드는 계속):', e instanceof Error ? e.message : e))
  .finally(() => prisma.$disconnect());
