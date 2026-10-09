import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';
import { AdminSide } from '@/components/admin/AdminSide';
import { KakaoAutomationClient } from './KakaoAutomationClient';

export default async function AdminKakaoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) redirect('/auth/signin');

  const tenant = await prisma.tenant.findUnique({
    where: { slug, status: 'active' },
  });
  if (!tenant) notFound();

  const membership = await getAdminMembership(tenant.id, session.user.email!);
  if (!membership) redirect('/auth/signin');

  const [settings, templates, marketingCount, thisMonthCount] = await Promise.all([
    prisma.automationSetting.findMany({ where: { tenantId: tenant.id } }),
    prisma.messageTemplate.findMany({ where: { tenantId: tenant.id } }),
    prisma.consent.count({
      where: {
        tenantId: tenant.id,
        type: 'marketing',
        grantedAt: { not: null },
        revokedAt: null,
      },
    }),
    prisma.message.count({
      where: {
        tenantId: tenant.id,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
  ]);

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: '100vh' }}>
      <AdminSide slug={slug} tenantName={tenant.name} active="kakao" />
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>카톡 자동화</h1>
            <div style={{ fontSize: 14, color: '#5A6270' }}>
              상담 신청부터 등록까지, 새는 구간에 메시지를 자동으로 보냅니다
            </div>
          </div>
          <div style={{ fontSize: 14, color: '#5A6270' }}>이번 달 발송 {thisMonthCount}건</div>
        </div>

        <KakaoAutomationClient
          slug={slug}
          settings={settings.map((s) => ({
            scenario: s.scenario,
            enabled: s.enabled,
            delayRule: s.delayRule,
          }))}
          templates={templates.map((t) => ({
            scenario: t.scenario,
            kind: t.kind,
            body: t.body,
            approvedBody: t.approvedBody,
            reviewStatus: t.reviewStatus,
          }))}
          marketingConsentCount={marketingCount}
        />
      </main>
    </div>
  );
}
