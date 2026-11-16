import { prisma } from '@/lib/prisma';
import { PlatformSide } from '@/components/platform/PlatformSide';
import { EventsClient } from './EventsClient';

export const dynamic = 'force-dynamic';

// 플랫폼 관리자 — 무료 기간 이벤트 신청 확인·승인 (권한은 platform/layout.tsx에서 확인)
export default async function PlatformEventsPage() {
  const rows = await prisma.eventClaim.findMany({
    orderBy: { createdAt: 'desc' },
    take: 300,
    include: { tenant: { select: { name: true, slug: true, planStatus: true, betaEndsAt: true } } },
  });
  // 확인 중인 것을 먼저
  const sorted = [...rows.filter((r) => r.status === 'pending'), ...rows.filter((r) => r.status !== 'pending')];
  const pending = sorted.filter((r) => r.status === 'pending').length;

  return (
    <div style={{ display: 'flex', flex: 1 }}>
      <PlatformSide active="events" />
      <main style={{ flex: 1, minWidth: 0, padding: '32px 40px', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif", background: '#F4F2EE', minHeight: '100vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 980 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>이벤트</h1>
            <div style={{ fontSize: 14, color: '#5A6270', marginTop: 4, lineHeight: 1.7 }}>
              개선 제안(1개월)·블로그 소개글(3개월) 무료 기간 이벤트 신청입니다. 승인하면 무료 종료일(결제 중이면 다음 결제일)이 바로 늘어나고 원장에게 알림이 갑니다.
              {pending > 0 && <span style={{ marginLeft: 8, background: '#C8433A', color: '#FFFFFF', borderRadius: 10, fontSize: 12, fontWeight: 700, padding: '2px 7px' }}>확인 중 {pending}건</span>}
            </div>
          </div>
          <EventsClient
            claims={sorted.map((r) => ({
              id: r.id,
              kind: r.kind,
              status: r.status,
              months: r.months,
              content: r.content,
              url: r.url,
              createdAt: r.createdAt.toISOString(),
              reviewedAt: r.reviewedAt?.toISOString() ?? null,
              rejectReason: r.rejectReason,
              freeUntil: r.freeUntil?.toISOString() ?? null,
              appliedTo: r.appliedTo,
              tenant: { name: r.tenant.name, slug: r.tenant.slug, planStatus: r.tenant.planStatus, betaEndsAt: r.tenant.betaEndsAt?.toISOString() ?? null },
            }))}
          />
        </div>
      </main>
    </div>
  );
}
