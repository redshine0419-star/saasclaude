import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PlatformSide } from '@/components/platform/PlatformSide';

function betaDaysLeft(betaEndsAt: Date | null): number | null {
  if (!betaEndsAt) return null;
  const diff = betaEndsAt.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function themeBadge(theme: string) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    warm: { label: '테마 A', bg: '#E4EEE9', color: '#1E5645' },
    result: { label: '테마 B', bg: '#E6EBF8', color: '#1D3FA8' },
    bright: { label: '테마 C', bg: '#DCFCE7', color: '#0F766E' },
  };
  return map[theme] ?? { label: theme, bg: '#F0F1F3', color: '#3C4659' };
}

function statusBadge(status: string) {
  return status === 'active'
    ? { label: '운영 중', bg: '#D8E8E0', color: '#1E5645' }
    : { label: '비공개', bg: '#F3E3DC', color: '#8A3A1C' };
}

export default async function PlatformAcademiesPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { leads: true, memberships: true } },
    },
  });

  const totalActive = tenants.filter((t) => t.status === 'active').length;
  const totalBeta = tenants.filter((t) => t.planStatus === 'beta').length;
  const expiringCount = tenants.filter((t) => {
    const days = betaDaysLeft(t.betaEndsAt);
    return days !== null && days <= 14 && days >= 0;
  }).length;

  return (
    <div style={{ display: 'flex', flex: 1 }}>
      <PlatformSide active="academies" />
      <main style={{ flex: 1, padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 24, color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif", minHeight: '100vh', background: '#F4F2EE' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>학원 목록</h1>
            <div style={{ fontSize: 14, color: '#5A6270', marginTop: 4 }}>운영 중인 모든 학원을 관리합니다.</div>
          </div>
          <Link
            href="/platform/academies/new"
            style={{ height: 44, padding: '0 18px', borderRadius: 10, background: '#1E5645', color: '#FFFFFF', textDecoration: 'none', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
            새 학원 추가
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
          {[
            { label: '전체 학원', value: tenants.length },
            { label: '운영 중', value: totalActive },
            { label: '베타 진행 중', value: totalBeta },
            { label: '만료 임박 (14일 이내)', value: expiringCount, warn: expiringCount > 0 },
          ].map((s) => (
            <div key={s.label} style={{ padding: '20px 24px', borderRadius: 12, background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 13, color: '#5A6270' }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.warn ? '#8A3A1C' : '#1B2430' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ borderRadius: 12, background: '#FFFFFF', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2DDD2', background: '#F9F8F5' }}>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>학원명</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>슬러그</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>테마</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>상태</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>베타 남은 일수</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>상담 수</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}></th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => {
                const theme = themeBadge(t.theme);
                const st = statusBadge(t.status);
                const daysLeft = betaDaysLeft(t.betaEndsAt);
                const isExpiring = daysLeft !== null && daysLeft <= 14 && daysLeft >= 0;
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid #F0EDE7' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 600 }}>
                      <Link href={`/${t.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1B2430', textDecoration: 'none' }}>{t.name}</Link>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#5A6270', fontFamily: 'monospace' }}>{t.slug}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: theme.bg, color: theme.color }}>{theme.label}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
                    </td>
                    <td style={{ padding: '14px 16px', color: isExpiring ? '#8A3A1C' : '#5A6270', fontWeight: isExpiring ? 700 : 400 }}>
                      {daysLeft === null ? '—' : daysLeft < 0 ? '만료됨' : `${daysLeft}일`}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#5A6270' }}>{t._count.leads}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <Link href={`/platform/academies/${t.id}`} style={{ color: '#1E5645', fontWeight: 600, textDecoration: 'none', fontSize: 13 }}>편집</Link>
                    </td>
                  </tr>
                );
              })}
              {tenants.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: '#9AA3AF' }}>등록된 학원이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
