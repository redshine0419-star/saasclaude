import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AdminSide } from '@/components/admin/AdminSide';

function maskName(name: string) {
  if (name.length <= 1) return name + '○○';
  return name[0] + '○○';
}

function formatRelative(date: Date) {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (hours < 1) return '방금 전';
  if (hours < 24) return `${hours}시간 전`;
  if (days === 1) return '어제';
  return `${days}일 전`;
}

const STATUS_LABEL: Record<string, string> = {
  new: '신규',
  contacted: '연락 완료',
  test_booked: '테스트 예약',
  enrolled: '등록',
  not_enrolled: '미등록',
};

const CONSULT_LABEL: Record<string, string> = {
  level_test: '레벨테스트',
  phone: '전화 상담',
  visit: '방문 상담',
};

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) redirect('/auth/signin');

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) notFound();

  const membership = await prisma.membership.findFirst({
    where: { tenantId: tenant.id, user: { email: session.user.email } },
  });
  if (!membership) redirect('/auth/signin');

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // SPEC 6장: 오늘 연락할 상담 = new 전부 + not_enrolled 후 3일 지난 건
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const [thisMonthLeads, enrolledCount, testBookedCount, newLeads, followupLeads] = await Promise.all([
    prisma.lead.findMany({
      where: { tenantId: tenant.id, createdAt: { gte: monthStart } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.lead.count({ where: { tenantId: tenant.id, createdAt: { gte: monthStart }, status: 'enrolled' } }),
    prisma.lead.count({ where: { tenantId: tenant.id, createdAt: { gte: monthStart }, status: 'test_booked' } }),
    prisma.lead.findMany({
      where: { tenantId: tenant.id, status: 'new', createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
      orderBy: { createdAt: 'desc' },
      include: { consents: { where: { type: 'marketing' } } },
    }),
    prisma.lead.findMany({
      where: {
        tenantId: tenant.id,
        status: 'not_enrolled',
        statusChangedAt: { lte: threeDaysAgo },
      },
      orderBy: { statusChangedAt: 'asc' },
      include: { consents: { where: { type: 'marketing' } } },
    }),
  ]);

  const recentNew = [...newLeads, ...followupLeads];

  const totalLeads = thisMonthLeads.length;
  const conversionRate =
    totalLeads > 0 ? Math.round((enrolledCount / totalLeads) * 100) : 0;

  // Funnel percentages relative to totalLeads (capped at 100%)
  const funnelData = [
    { label: '상담 신청', count: totalLeads, pct: 100 },
    {
      label: '레벨테스트',
      count: testBookedCount + enrolledCount,
      pct: totalLeads > 0 ? Math.round(((testBookedCount + enrolledCount) / totalLeads) * 100) : 0,
    },
    {
      label: '등록',
      count: enrolledCount,
      pct: totalLeads > 0 ? Math.round((enrolledCount / totalLeads) * 100) : 0,
    },
  ];

  const BAR_COLORS = ['#9FBFB2', '#5E9480', '#1E5645'];

  const newCount = thisMonthLeads.filter((l) => l.status === 'new').length;

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: '100vh' }}>
      <AdminSide slug={slug} tenantName={tenant.name} active="dashboard" />
      <main
        style={{
          flex: 1,
          padding: '32px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          background: '#F4F2EE',
          color: '#1B2430',
          fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>이번 달 현황</h1>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link
              href={`/${slug}`}
              target="_blank"
              style={{
                height: 44,
                padding: '0 16px',
                border: '1px solid #D5D0C6',
                borderRadius: 8,
                background: '#FFFFFF',
                color: '#1B2430',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              홈페이지 보기
            </Link>
          </div>
        </div>

        {/* 4-col stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
          <div
            style={{
              padding: 22,
              background: '#FFFFFF',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 14, color: '#5A6270' }}>홈페이지 방문</div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>—</div>
            <div style={{ fontSize: 13, color: '#9AA3AF' }}>GA4 연동 전</div>
          </div>
          <div
            style={{
              padding: 22,
              background: '#FFFFFF',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 14, color: '#5A6270' }}>상담 신청</div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{totalLeads}</div>
            <div style={{ fontSize: 13, color: '#5A6270' }}>신규 미처리 {newCount}건</div>
          </div>
          <div
            style={{
              padding: 22,
              background: '#FFFFFF',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 14, color: '#5A6270' }}>레벨테스트 예약</div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{testBookedCount}</div>
          </div>
          <div
            style={{
              padding: 22,
              background: '#1E5645',
              color: '#FFFFFF',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 14, color: '#CFE3DA' }}>신규 등록</div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{enrolledCount}명</div>
            <div style={{ fontSize: 13, color: '#CFE3DA' }}>
              상담 대비 등록률 {conversionRate}%
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, flex: 1 }}>
          {/* Left: funnel + source */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Funnel */}
            <div
              style={{
                padding: 24,
                background: '#FFFFFF',
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700 }}>신청에서 등록까지</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
                {funnelData.map((row, i) => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 96, color: '#5A6270' }}>{row.label}</span>
                    <div
                      style={{
                        flex: 1,
                        height: 28,
                        background: '#EDEAE3',
                        borderRadius: 6,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${row.pct}%`,
                          height: 28,
                          background: BAR_COLORS[i],
                          borderRadius: 6,
                          transition: 'width 0.3s',
                        }}
                      />
                    </div>
                    <span style={{ width: 40, textAlign: 'right', fontWeight: 600 }}>
                      {row.count}
                    </span>
                  </div>
                ))}
              </div>
              {totalLeads === 0 && (
                <div style={{ fontSize: 13, color: '#9AA3AF' }}>이번 달 상담 신청이 없습니다.</div>
              )}
            </div>

            {/* Source breakdown — uses classifyReferer-classified values */}
            <div
              style={{
                padding: 24,
                background: '#FFFFFF',
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700 }}>상담 신청 유입 경로</div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 10,
                }}
              >
                {([
                  { label: '네이버 검색', keys: ['naver_search', 'naver_blog'] },
                  { label: '네이버 플레이스', keys: ['naver_place'] },
                  { label: '카카오', keys: ['kakao'] },
                  { label: 'AI 검색', keys: ['ai_chatgpt', 'ai_perplexity', 'ai_gemini'] },
                  { label: '구글', keys: ['google'] },
                  { label: '직접 접속', keys: ['direct'] },
                  { label: '기타 유입', keys: ['referral', 'social', 'web'] },
                ]).map(({ label, keys }) => {
                  const count = thisMonthLeads.filter((l) => keys.includes(l.source ?? '')).length;
                  if (count === 0) return null;
                  return (
                    <div key={label} style={{ padding: 14, borderRadius: 10, background: '#F4F2EE' }}>
                      <div style={{ fontSize: 13, color: '#5A6270' }}>{label}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: today's leads */}
          <div
            style={{
              width: 400,
              padding: 24,
              background: '#FFFFFF',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              alignSelf: 'flex-start',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>오늘 연락할 상담</div>
                {recentNew.length > 0 && (
                  <span
                    style={{
                      background: '#C8433A',
                      color: '#FFFFFF',
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '2px 7px',
                    }}
                  >
                    {recentNew.length}
                  </span>
                )}
              </div>
              <Link
                href={`/${slug}/admin/leads`}
                style={{ fontSize: 14, color: '#1E5645', textDecoration: 'none' }}
              >
                전체 보기
              </Link>
            </div>

            {recentNew.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#9AA3AF', fontSize: 14 }}>
                처리 대기 중인 상담이 없습니다
              </div>
            ) : (
              recentNew.slice(0, 3).map((lead) => {
                const isNew = lead.status === 'new';
                const marketing = lead.consents.some((c) => c.grantedAt);
                const tagBg = isNew ? '#FBF1CF' : '#F3E3DC';
                const tagColor = isNew ? '#5A4A12' : '#8A3A1C';
                const tagLabel = isNew
                  ? `신규 · ${formatRelative(lead.createdAt)}`
                  : `미등록 · ${formatRelative(lead.statusChangedAt)}`;

                return (
                  <div
                    key={lead.id}
                    style={{
                      padding: 16,
                      border: '1px solid #E8E4DB',
                      borderRadius: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700 }}>
                        {maskName(lead.parentName)} 학부모
                        {lead.studentGrade ? ` · ${lead.studentGrade}` : ''}
                      </span>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 5,
                          background: tagBg,
                          color: tagColor,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {tagLabel}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, color: '#5A6270' }}>
                      {CONSULT_LABEL[lead.consultType] ?? lead.consultType}
                      {marketing ? '' : ' · 모집 안내 미동의'}
                    </div>
                    <Link
                      href={`/${slug}/admin/leads?id=${lead.id}`}
                      style={{
                        height: 44,
                        borderRadius: 8,
                        background: isNew ? '#1E5645' : '#FFFFFF',
                        border: isNew ? 'none' : '1px solid #D5D0C6',
                        color: isNew ? '#FFFFFF' : '#1B2430',
                        textDecoration: 'none',
                        fontSize: 14,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      상세 보기
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
