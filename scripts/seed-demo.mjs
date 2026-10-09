#!/usr/bin/env node
/**
 * Inserts demo tenants (demo-warm, demo-result, demo-bright) and their
 * default sections if they don't already exist. Runs as part of the build
 * after prisma migrate deploy.
 */
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

const DEMOS = [
  {
    slug: 'demo-warm',
    name: '따뜻한수학학원',
    theme: 'warm',
    accentColor: '#1E5645',
    subjects: '수학',
    targetGrades: '중1~고3',
    address: '서울시 강남구 역삼동 123, 역삼빌딩 3층',
    phone: '02-1234-5678',
    hours: '평일 14:00~22:00 / 토 10:00~18:00',
    regNo: '제2024-서울강남-0001호',
    sections: ['hero', 'quick_info', 'director', 'classes', 'fees', 'reviews', 'news', 'consult_form'],
  },
  {
    slug: 'demo-result',
    name: '결과수학학원',
    theme: 'result',
    accentColor: '#1D3FA8',
    subjects: '수학',
    targetGrades: '중1~고3',
    address: '서울시 서초구 서초동 456, 서초빌딩 5층',
    phone: '02-2345-6789',
    hours: '평일 15:00~22:00 / 토 10:00~16:00',
    regNo: '제2024-서울서초-0002호',
    sections: ['hero', 'results_stats', 'exam_system', 'curriculum', 'score_cases', 'teachers', 'fees', 'consult_form'],
  },
  {
    slug: 'demo-bright',
    name: '해피영어학원',
    theme: 'bright',
    accentColor: '#0F766E',
    subjects: '영어',
    targetGrades: '7세~초6',
    address: '서울시 마포구 동교로 150, 홍대빌딩 2층',
    phone: '02-3456-7890',
    hours: '평일 14:00~20:00 / 토 10:00~14:00',
    regNo: '제2024-서울마포-0003호',
    sections: ['hero', 'day_flow', 'classes', 'gallery', 'safety', 'reviews', 'consult_form'],
  },
];

async function main() {
  // Check tenants table exists
  const tableExists = await sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'tenants'
    ) AS exists
  `;
  if (!tableExists[0].exists) {
    console.log('tenants table not found — skipping demo seed');
    return;
  }

  for (const demo of DEMOS) {
    // Check if already exists
    const existing = await sql`SELECT id FROM tenants WHERE slug = ${demo.slug}`;
    if (existing.length > 0) {
      console.log(`${demo.slug} already exists, skipping`);
      continue;
    }

    // Insert tenant
    const [tenant] = await sql`
      INSERT INTO tenants (
        id, slug, name, theme, "accentColor", subjects, "targetGrades",
        address, phone, hours, "regNo", status,
        "planStatus", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid()::text,
        ${demo.slug}, ${demo.name}, ${demo.theme}::"Theme",
        ${demo.accentColor}, ${demo.subjects}, ${demo.targetGrades},
        ${demo.address}, ${demo.phone}, ${demo.hours}, ${demo.regNo},
        'active', 'beta', now(), now()
      )
      RETURNING id
    `;

    // Insert sections
    for (let i = 0; i < demo.sections.length; i++) {
      await sql`
        INSERT INTO tenant_sections ("tenantId", "sectionKey", enabled, "sortOrder")
        VALUES (${tenant.id}, ${demo.sections[i]}, true, ${i})
      `;
    }

    console.log(`Created demo tenant: ${demo.slug} (id: ${tenant.id})`);
  }

  console.log('Demo seed complete.');
}

main().catch(e => {
  console.error('seed-demo error:', e.message);
  // Don't exit with error — demo seed failure shouldn't break the build
});
