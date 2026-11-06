import { prisma } from '@/lib/prisma';
import { PlatformSide } from '@/components/platform/PlatformSide';
import { daysSince } from '@/lib/retention';
import { HiddenClient, type HiddenRow } from './HiddenClient';

export const dynamic = 'force-dynamic';

export default async function PlatformHiddenPage() {
  const now = new Date();
  const tenants = await prisma.tenant.findMany({
    where: { OR: [{ published: false }, { status: 'inactive' }, { deletionRequestedAt: { not: null } }] },
    select: {
      id: true, slug: true, name: true, status: true, published: true, unpublishedAt: true, inactiveAt: true, updatedAt: true,
      deletionRequestedAt: true, deletionRequestedBy: true, deletionReason: true, planStatus: true, betaEndsAt: true,
      _count: { select: { leads: true, students: true } },
    },
  });

  const rows: HiddenRow[] = tenants
    .map((t) => {
      // 비공개 시작: 원장 비공개와 운영 중지 중 이른 쪽 (기록이 없으면 마지막 수정 시각)
      const starts = [t.published ? null : t.unpublishedAt, t.status === 'inactive' ? t.inactiveAt : null].filter((d): d is Date => !!d);
      const since = starts.length ? new Date(Math.min(...starts.map((d) => d.getTime()))) : t.updatedAt;
      const reason =
        t.status === 'inactive'
          ? t.planStatus === 'beta' && t.betaEndsAt && t.betaEndsAt < now ? '운영 중지 (베타 만료)' : '운영 중지 (운영자)'
          : t.deletionRequestedAt ? '원장 비공개 (삭제 요청)' : '원장 비공개';
      return {
        id: t.id,
        slug: t.slug,
        name: t.name,
        reason,
        hiddenSince: since.toISOString(),
        hiddenDays: daysSince(since, now),
        exactSince: starts.length > 0,
        deletionRequestedAt: t.deletionRequestedAt?.toISOString() ?? null,
        deletionRequestedBy: t.deletionRequestedBy,
        deletionReason: t.deletionReason,
        leads: t._count.leads,
        students: t._count.students,
        canRestore: true,
        isDemo: t.slug.startsWith('demo'),
      };
    })
    .sort((a, b) => Number(!!b.deletionRequestedAt) - Number(!!a.deletionRequestedAt) || b.hiddenDays - a.hiddenDays);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F2EE', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif" }}>
      <PlatformSide active="hidden" />
      <main style={{ flex: 1, minWidth: 0, padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>비공개·삭제 요청</h1>
          <div style={{ fontSize: 14, color: '#5A6270', marginTop: 4 }}>
            홈페이지가 비공개인 학원과 원장이 삭제를 요청한 학원입니다. 비공개만으로는 지워지지 않고, 삭제는 여기서 직접 눌러야 진행됩니다.
          </div>
        </div>
        <HiddenClient rows={rows} />
      </main>
    </div>
  );
}
