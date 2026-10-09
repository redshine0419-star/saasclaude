import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';
import { AdminSide } from '@/components/admin/AdminSide';

const SCENARIO_LABEL: Record<string, string> = {
  receipt: '① 상담 접수 확인',
  reminder: '② 테스트 전날 리마인드',
  followup: '③ 미등록 후속 안내',
  campaign: '④ 시즌 모집 공지',
  owner_alert: '원장 알림',
  reconfirm: '동의 재확인',
};

function maskHash(hash: string) {
  return hash.slice(0, 4) + '****';
}

function formatKST(date: Date) {
  const kst = new Date(date.getTime() + 9 * 3600 * 1000);
  const mm = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(kst.getUTCDate()).padStart(2, '0');
  const hh = String(kst.getUTCHours()).padStart(2, '0');
  const min = String(kst.getUTCMinutes()).padStart(2, '0');
  return `${mm}.${dd} ${hh}:${min}`;
}

export default async function KakaoLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { slug } = await params;
  const { month } = await searchParams;

  const session = await auth();
  if (!session?.user?.email) redirect('/auth/signin');

  const tenant = await prisma.tenant.findUnique({
    where: { slug, status: 'active' },
  });
  if (!tenant) notFound();

  const membership = await getAdminMembership(tenant.id, session.user.email!);
  if (!membership) redirect('/auth/signin');

  // Parse month param (YYYY-MM) or default to current month
  const now = new Date();
  let year = now.getFullYear();
  let mon = now.getMonth(); // 0-indexed
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split('-').map(Number);
    year = y;
    mon = m - 1;
  }
  const monthStart = new Date(Date.UTC(year, mon, 1));
  const monthEnd = new Date(Date.UTC(year, mon + 1, 0, 23, 59, 59, 999));

  const [messages, marketingCount, nightCount, revokedCount] = await Promise.all([
    prisma.message.findMany({
      where: {
        tenantId: tenant.id,
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        lead: {
          include: {
            consents: {
              where: { type: { in: ['marketing', 'night'] } },
            },
          },
        },
      },
    }),
    prisma.consent.count({
      where: {
        tenantId: tenant.id,
        type: 'marketing',
        grantedAt: { not: null },
        revokedAt: null,
      },
    }),
    prisma.consent.count({
      where: {
        tenantId: tenant.id,
        type: 'night',
        grantedAt: { not: null },
        revokedAt: null,
      },
    }),
    prisma.consent.count({
      where: {
        tenantId: tenant.id,
        type: 'marketing',
        revokedAt: { not: null },
      },
    }),
  ]);

  const totalSent = messages.filter((m) => m.status === 'sent').length;
  const totalFailed = messages.filter((m) => m.status === 'failed').length;
  const totalCost = messages.reduce((sum, m) => sum + (m.cost ?? 0), 0);

  const monthLabel = `${year}년 ${mon + 1}월`;

  // Build month options: current month and past 11 months
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    return { value: `${y}-${String(m).padStart(2, '0')}`, label: `${y}년 ${m}월` };
  });
  const currentMonthValue = `${year}-${String(mon + 1).padStart(2, '0')}`;

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: '100vh' }}>
      <AdminSide slug={slug} tenantName={tenant.name} active="kakaolog" />
      <main
        style={{
          flex: 1,
          padding: '32px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          background: '#F4F2EE',
          color: '#1B2430',
          fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif",
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>발송 내역·수신 동의</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {monthOptions.slice(0, 6).map((o) => (
              <a
                key={o.value}
                href={`?month=${o.value}`}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid #D5D0C6',
                  background: o.value === currentMonthValue ? '#1E5645' : '#FFFFFF',
                  color: o.value === currentMonthValue ? '#FFFFFF' : '#3E4652',
                  fontSize: 13,
                  fontWeight: o.value === currentMonthValue ? 600 : 400,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {o.label}
              </a>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20 }}>
          {/* Left: stats + table */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
              <div style={{ padding: 18, background: '#FFFFFF', borderRadius: 12 }}>
                <div style={{ fontSize: 13, color: '#5A6270' }}>총 발송</div>
                <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>{totalSent}건</div>
              </div>
              <div style={{ padding: 18, background: '#FFFFFF', borderRadius: 12 }}>
                <div style={{ fontSize: 13, color: '#5A6270' }}>카톡 전달 실패 → 문자 대체</div>
                <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>{totalFailed}건</div>
              </div>
              <div style={{ padding: 18, background: '#FFFFFF', borderRadius: 12 }}>
                <div style={{ fontSize: 13, color: '#5A6270' }}>예상 비용</div>
                <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>
                  {totalCost.toLocaleString()}원
                </div>
              </div>
            </div>

            {/* Table */}
            <div style={{ background: '#FFFFFF', borderRadius: 12, overflow: 'hidden' }}>
              {messages.length === 0 ? (
                <div
                  style={{
                    padding: 48,
                    textAlign: 'center',
                    color: '#9AA3AF',
                    fontSize: 14,
                  }}
                >
                  {monthLabel} 발송 내역이 없습니다.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: '#5A6270', background: '#FAF9F6' }}>
                      <th style={{ padding: '14px 16px', fontWeight: 600 }}>일시</th>
                      <th style={{ padding: '14px 16px', fontWeight: 600 }}>받는 사람</th>
                      <th style={{ padding: '14px 16px', fontWeight: 600 }}>메시지</th>
                      <th style={{ padding: '14px 16px', fontWeight: 600 }}>유형</th>
                      <th style={{ padding: '14px 16px', fontWeight: 600 }}>수신 동의</th>
                      <th style={{ padding: '14px 16px', fontWeight: 600 }}>결과</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map((msg) => {
                      const consents = msg.lead?.consents ?? [];
                      const hasMarketing = consents.some(
                        (c) => c.type === 'marketing' && c.grantedAt && !c.revokedAt,
                      );
                      const hasNight = consents.some(
                        (c) => c.type === 'night' && c.grantedAt && !c.revokedAt,
                      );
                      const consentLabel =
                        msg.kind !== 'ad'
                          ? null
                          : hasMarketing
                          ? hasNight
                            ? '동의·야간'
                            : '동의'
                          : '미동의';
                      const consentStyle =
                        consentLabel === null
                          ? {}
                          : consentLabel === '미동의'
                          ? { background: '#FCE4DC', color: '#8A3A1C' }
                          : { background: '#D8E8E0', color: '#1E5645' };

                      return (
                      <tr key={msg.id} style={{ borderTop: '1px solid #EEEAE2' }}>
                        <td style={{ padding: '14px 16px' }}>
                          {msg.sentAt ? formatKST(msg.sentAt) : formatKST(msg.createdAt)}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#5A6270' }}>
                          {maskHash(msg.recipientHash)} 수신자
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {SCENARIO_LABEL[msg.scenario] ?? msg.scenario}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {msg.kind === 'ad' ? '광고성' : '정보성'}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {consentLabel ? (
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: 5,
                                fontSize: 12,
                                fontWeight: 700,
                                ...consentStyle,
                              }}
                            >
                              {consentLabel}
                            </span>
                          ) : (
                            <span style={{ color: '#9AA3AF', fontSize: 13 }}>—</span>
                          )}
                        </td>
                        <td
                          style={{
                            padding: '14px 16px',
                            fontWeight: 600,
                            color:
                              msg.status === 'sent'
                                ? '#1E5645'
                                : msg.status === 'failed'
                                ? '#8A3A1C'
                                : msg.status === 'deferred'
                                ? '#5A4A12'
                                : '#5A6270',
                          }}
                        >
                          {msg.status === 'sent'
                            ? '전달'
                            : msg.status === 'failed'
                            ? '문자 대체'
                            : msg.status === 'deferred'
                            ? '예약 대기'
                            : '처리 중'}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right: consent status */}
          <div
            style={{
              width: 360,
              padding: 24,
              background: '#FFFFFF',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              alignSelf: 'flex-start',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700 }}>수신 동의 현황</div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '1px solid #EEEAE2',
              }}
            >
              <span>모집 안내 수신 동의</span>
              <b>{marketingCount}명</b>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '1px solid #EEEAE2',
              }}
            >
              <span>야간 수신 동의</span>
              <b>{nightCount}명</b>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '1px solid #EEEAE2',
              }}
            >
              <span>수신 거부</span>
              <b>{revokedCount}명</b>
            </div>
            <div
              style={{
                padding: 14,
                borderRadius: 10,
                background: '#FBF1CF',
                fontSize: 13,
                lineHeight: 1.7,
                color: '#3E3510',
              }}
            >
              광고성 수신 동의는 2년마다 재확인해야 합니다. 만료 30일 전 확인 메시지가 자동
              발송됩니다.
            </div>
            <a
              href={`/api/${slug}/admin/kakao/consent-export`}
              download
              style={{
                height: 44,
                padding: '0 16px',
                border: '1px solid #D5D0C6',
                borderRadius: 8,
                background: '#FFFFFF',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: '#1B2430',
              }}
            >
              동의 이력 내려받기 (CSV)
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
