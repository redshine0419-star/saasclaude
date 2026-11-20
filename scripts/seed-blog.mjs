#!/usr/bin/env node
/**
 * 더클 블로그 첫 글 초안을 한 번 넣는다 (빌드 때 실행, 실패해도 빌드는 계속).
 * - 모두 "숨김"(draft) — 운영자가 /platform/blog 에서 검토 후 공개한다
 * - platform_settings 표시가 있으면 다시 넣지 않는다 (지운 초안이 되살아나지 않게)
 * - 같은 글 주소가 이미 있으면 그 글은 건너뛴다
 */
import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { BLOG_DRAFTS } from './blog-drafts.mjs';

const MARKER = 'seed:blog-drafts:v1';
// 이미 들어간 초안을 새 원고로 바꾼다 — 아직 숨김이고, 본문이 처음 넣은 원고 그대로일 때만(운영자가 고친 글은 지킨다)
// v3: 5번 글(student-privacy-consent)을 운영자가 준 원고로 교체. (v2는 '저장한 적 없는 글'만 바꿔서, 고치지 않고 저장만 한 글이 빠졌다)
const UPDATES = [
  { marker: 'seed:blog-drafts:v3', slug: 'student-privacy-consent', oldBodySha256: ['34753521ef1683d2a2e823ced07882c58dfa8843b50c80157d761b47cafdecd8'] },
  // v4: 4번 글(academy-website-checklist)을 운영자가 준 원고로 교체
  { marker: 'seed:blog-drafts:v4', slug: 'academy-website-checklist', oldBodySha256: ['1bb807dcf219ece2ad8e5ce8446afbe4ed6debca64a1c4d0c065a85daee76107'] },
  // v5: 3번 글(consult-to-enrollment-5-tips)을 운영자가 준 원고로 교체 — 이 글은 처음부터 공개할 수 있는 초안이라, 본문이 처음 원고 그대로면 공개 중이어도 바꾼다
  { marker: 'seed:blog-drafts:v5', slug: 'consult-to-enrollment-5-tips', oldBodySha256: ['2fca926e6d3bc3b205223cc4fff4e484e444c689b01951e6293ced3f18ae7d73'], evenIfPublished: true },
  // v6: 1번 글(tuition-change-guide)을 운영자가 준 원고로 교체
  { marker: 'seed:blog-drafts:v6', slug: 'tuition-change-guide', oldBodySha256: ['1faeef5b8c83614a7727e353f8ac794766d4f9ddc0b9861034674ed6d7ebbfba'], evenIfPublished: true },
  // v7: 2번 글(academy-ad-message-rules)을 운영자가 준 원고로 교체
  { marker: 'seed:blog-drafts:v7', slug: 'academy-ad-message-rules', oldBodySha256: ['2f8a27baa5feaa4ab4bb1b7cfa00ecace4119930aa3a16107fde88c24b0c346b'], evenIfPublished: true },
  // v8: 2026-11-16 추가 글 중 naver-place-guide를 운영자가 준 원고로 교체 (아직 숨김 초안일 때만)
  { marker: 'seed:blog-drafts:v8', slug: 'naver-place-guide', oldBodySha256: ['3a715f709cfe9dca6e43ac2e161e2464e3933cdd7b5cbf1d75ffebf9e291950b'] },
  // v9: level-test-result-guide를 운영자가 준 원고로 교체 (아직 숨김 초안일 때만)
  { marker: 'seed:blog-drafts:v9', slug: 'level-test-result-guide', oldBodySha256: ['55b9ee1bbe0fed82a1d72f71a3be42dcc6ff038bdfd7ad97cf5b7cd2de6930f1'] },
  // v10: 같은 글 FAQ 출처 표기(교육부 → 교육청) 수정 — v9가 이미 돌았으면 이걸로 바꾼다
  { marker: 'seed:blog-drafts:v10', slug: 'level-test-result-guide', oldBodySha256: ['815827fea924c12ac9acc9e05b16e68a7417dbe0a2df78f230c5fb81343e0aab', '55b9ee1bbe0fed82a1d72f71a3be42dcc6ff038bdfd7ad97cf5b7cd2de6930f1'] },
  // v11: tuition-refund-rules를 운영자가 준 원고로 교체 (【확인 필요】 표시 없는 확정 원고, 아직 숨김 초안일 때만)
  { marker: 'seed:blog-drafts:v11', slug: 'tuition-refund-rules', oldBodySha256: ['4a1a05aeab98acec934f6f680b388032a993f177c14a4803a85fc6a005810c63'] },
  // v12: parent-sms-examples를 운영자가 준 원고로 교체 (아직 숨김 초안일 때만)
  { marker: 'seed:blog-drafts:v12', slug: 'parent-sms-examples', oldBodySha256: ['61341504b7717deb8b68590de852f070bc21c1c146f375f303a517b9d46a80ca'] },
];
const sha = (t) => createHash('sha256').update(t.replace(/\r\n?/g, '\n').trim()).digest('hex');

if (!process.env.DATABASE_URL) {
  console.log('[seed-blog] DATABASE_URL 없음 — 건너뜀');
  process.exit(0);
}
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });

// 나중에 추가한 초안 — 표시가 없으면 아직 없는 글 주소만 숨김으로 넣는다
const ADDITIONS = [
  { marker: 'seed:blog-drafts:add-2026-11-16', slugs: ['naver-place-guide', 'level-test-result-guide', 'tuition-refund-rules', 'parent-sms-examples', 'homepage-blog-instagram', 'monthly-parent-report'] },
];

async function applyAdditions() {
  for (const a of ADDITIONS) {
    if (await prisma.platformSetting.findUnique({ where: { key: a.marker } })) continue;
    let n = 0;
    for (const slug of a.slugs) {
      const d = BLOG_DRAFTS.find((x) => x.slug === slug);
      if (!d || (await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } }))) continue;
      await prisma.blogPost.create({ data: { ...d, status: 'draft', authorEmail: 'seed@growweb.me' } });
      n++;
    }
    await prisma.platformSetting.create({ data: { key: a.marker, value: new Date().toISOString() } });
    console.log(`[seed-blog] 초안 ${n}편 추가 (숨김)`);
  }
}

async function applyUpdates() {
  for (const u of UPDATES) {
    if (await prisma.platformSetting.findUnique({ where: { key: u.marker } })) continue;
    const d = BLOG_DRAFTS.find((x) => x.slug === u.slug);
    const cur = await prisma.blogPost.findUnique({ where: { slug: u.slug }, select: { id: true, status: true, body: true } });
    if (d && cur) {
      const curSha = sha(cur.body);
      if (curSha === sha(d.body)) console.log(`[seed-blog] ${u.slug} 이미 새 원고`);
      // 이름 변경 마이그레이션(첫등원→더클)이 먼저 돌았어도 처음 원고로 알아보게 이전 이름으로 되돌려 비교한다
      else if ((cur.status === 'draft' || u.evenIfPublished) && (u.oldBodySha256.includes(curSha) || u.oldBodySha256.includes(sha(cur.body.replace(/더클로/g, '첫등원으로').replace(/더클/g, '첫등원'))))) {
        await prisma.blogPost.update({ where: { id: cur.id }, data: { title: d.title, summary: d.summary, body: d.body, category: d.category } });
        console.log(`[seed-blog] ${u.slug} 새 원고로 교체`);
      } else console.log(`[seed-blog] ${u.slug} 운영자가 고쳤거나 공개한 글 — 교체하지 않음`);
    }
    await prisma.platformSetting.create({ data: { key: u.marker, value: new Date().toISOString() } });
  }
}

async function main() {
  if (await prisma.platformSetting.findUnique({ where: { key: MARKER } })) {
    console.log('[seed-blog] 초안 이미 넣음 — 건너뜀');
    await applyUpdates();
    return applyAdditions();
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
  for (const u of [...UPDATES, ...ADDITIONS]) await prisma.platformSetting.upsert({ where: { key: u.marker }, update: {}, create: { key: u.marker, value: new Date().toISOString() } });
}

main()
  .catch((e) => console.error('[seed-blog] 실패 (빌드는 계속):', e instanceof Error ? e.message : e))
  .finally(() => prisma.$disconnect());
