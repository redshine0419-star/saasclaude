import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { DEFAULT_SECTION_ORDER, type ThemeKey } from '@/lib/sections';

export type SiteSnapshot = {
  theme: string;
  accentColor: string | null;
  sections: { key: string; enabled: boolean; sortOrder: number }[];
};

export const SITE_VERSION_KEEP = 20;

export async function takeSiteSnapshot(tenantId: string): Promise<SiteSnapshot> {
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: { theme: true, accentColor: true, sections: { orderBy: { sortOrder: 'asc' } } },
  });
  return {
    theme: tenant.theme,
    accentColor: tenant.accentColor,
    sections: tenant.sections.map((s) => ({ key: s.sectionKey, enabled: s.enabled, sortOrder: s.sortOrder })),
  };
}

/** 현재 구성을 이력에 남기고, 오래된 이력은 SITE_VERSION_KEEP개만 남긴다. */
export async function recordSiteVersion(tenantId: string, actorEmail: string, reason: string) {
  const snapshot = await takeSiteSnapshot(tenantId);
  await prisma.siteVersion.create({
    data: { tenantId, actorEmail, reason, snapshot: snapshot as unknown as Prisma.InputJsonValue },
  });
  const stale = await prisma.siteVersion.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    skip: SITE_VERSION_KEEP,
    select: { id: true },
  });
  if (stale.length > 0) {
    await prisma.siteVersion.deleteMany({ where: { tenantId, id: { in: stale.map((v) => v.id) } } });
  }
}

/** 첫 변경 전에 현재 상태를 기준 이력으로 남긴다 (셀프 개설 이전에 만든 학원 대비). */
export async function ensureBaselineVersion(tenantId: string, actorEmail: string) {
  const count = await prisma.siteVersion.count({ where: { tenantId } });
  if (count === 0) await recordSiteVersion(tenantId, actorEmail, 'initial');
}

/** 테마·섹션(·강조색)을 한 번에 적용한다. sections는 normalizeSections를 거친 값이어야 한다. */
export async function applySiteConfig(
  tenantId: string,
  config: { theme: ThemeKey; sections: { key: string; enabled: boolean; sortOrder: number }[]; accentColor?: string | null },
) {
  const allowed = DEFAULT_SECTION_ORDER[config.theme];
  await prisma.$transaction([
    prisma.tenant.update({
      where: { id: tenantId },
      data: { theme: config.theme, ...(config.accentColor !== undefined ? { accentColor: config.accentColor } : {}) },
    }),
    ...config.sections.map((s) =>
      prisma.tenantSection.upsert({
        where: { tenantId_sectionKey: { tenantId, sectionKey: s.key } },
        update: { enabled: s.enabled, sortOrder: s.sortOrder },
        create: { tenantId, sectionKey: s.key, enabled: s.enabled, sortOrder: s.sortOrder },
      }),
    ),
    prisma.tenantSection.updateMany({
      where: { tenantId, sectionKey: { notIn: allowed } },
      data: { enabled: false },
    }),
  ]);
}
