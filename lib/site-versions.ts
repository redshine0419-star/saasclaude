import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

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
