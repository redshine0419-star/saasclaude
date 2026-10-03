import { PrismaClient, Theme } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  // Demo academy A — warm theme (원장직강형)
  const tenantA = await prisma.tenant.upsert({
    where: { slug: 'hanbit-math' },
    update: {},
    create: {
      slug: 'hanbit-math',
      name: '한빛수학학원',
      theme: Theme.warm,
      subjects: '수학',
      targetGrades: '초등~고등',
      address: '서울시 노원구 상계로 123',
      phone: '02-1234-5678',
      hours: '평일 14:00~22:00 / 토 10:00~18:00',
      status: 'active',
      planStatus: 'beta',
      betaStartedAt: new Date(),
    },
  });

  // Demo academy B — result theme (성과중심형)
  const tenantB = await prisma.tenant.upsert({
    where: { slug: 'sky-english' },
    update: {},
    create: {
      slug: 'sky-english',
      name: '스카이영어학원',
      theme: Theme.result,
      subjects: '영어',
      targetGrades: '중등~고등',
      address: '서울시 강남구 테헤란로 456',
      phone: '02-9876-5432',
      hours: '평일 15:00~22:00',
      status: 'active',
      planStatus: 'beta',
      betaStartedAt: new Date(),
    },
  });

  // Demo academy C — bright theme (밝은친근형)
  const tenantC = await prisma.tenant.upsert({
    where: { slug: 'rainbow-kids' },
    update: {},
    create: {
      slug: 'rainbow-kids',
      name: '레인보우어린이영어',
      theme: Theme.bright,
      subjects: '영어',
      targetGrades: '유아~초등',
      address: '서울시 마포구 월드컵로 789',
      phone: '02-1111-2222',
      hours: '평일 10:00~20:00',
      status: 'active',
      planStatus: 'beta',
      betaStartedAt: new Date(),
    },
  });

  // Default enabled sections for each tenant
  const warmSections = [
    { key: 'hero', order: 0, enabled: true },
    { key: 'intro', order: 1, enabled: true },
    { key: 'features', order: 2, enabled: true },
    { key: 'teachers', order: 3, enabled: true },
    { key: 'reviews', order: 4, enabled: true },
    { key: 'consult_cta', order: 5, enabled: true },
  ];

  for (const s of warmSections) {
    await prisma.tenantSection.upsert({
      where: { tenantId_sectionKey: { tenantId: tenantA.id, sectionKey: s.key } },
      update: { sortOrder: s.order, enabled: s.enabled },
      create: { tenantId: tenantA.id, sectionKey: s.key, sortOrder: s.order, enabled: s.enabled },
    });
  }

  // B and C get same structure but result/bright themes render them differently
  for (const tenant of [tenantB, tenantC]) {
    const sections = [
      { key: 'hero', order: 0, enabled: true },
      { key: 'intro', order: 1, enabled: true },
      { key: 'result_stats', order: 2, enabled: true },
      { key: 'features', order: 3, enabled: true },
      { key: 'teachers', order: 4, enabled: true },
      { key: 'reviews', order: 5, enabled: true },
      { key: 'classes', order: 6, enabled: true },
      { key: 'consult_cta', order: 7, enabled: true },
    ];
    for (const s of sections) {
      await prisma.tenantSection.upsert({
        where: { tenantId_sectionKey: { tenantId: tenant.id, sectionKey: s.key } },
        update: { sortOrder: s.order, enabled: s.enabled },
        create: { tenantId: tenant.id, sectionKey: s.key, sortOrder: s.order, enabled: s.enabled },
      });
    }
  }

  console.log('Seed complete:', tenantA.slug, tenantB.slug, tenantC.slug);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
