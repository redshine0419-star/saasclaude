import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AdminSide } from '@/components/admin/AdminSide';
import { InfoClient } from './InfoClient';

export default async function AdminInfoPage({
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

  const [director, fees, feeChangeLogs, principles, facilities, refundPolicyText] = await Promise.all([
    prisma.directorProfile.findUnique({ where: { tenantId: tenant.id } }),
    prisma.fee.findMany({ where: { tenantId: tenant.id }, orderBy: { id: 'asc' } }),
    prisma.feeChangeLog.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.teachingPrinciple.findMany({ where: { tenantId: tenant.id }, orderBy: { sortOrder: 'asc' } }),
    prisma.facility.findMany({ where: { tenantId: tenant.id }, orderBy: { sortOrder: 'asc' } }),
    prisma.refundPolicyText.findUnique({ where: { tenantId: tenant.id } }),
  ]);

  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        minHeight: '100vh',
        background: '#F4F2EE',
        color: '#1B2430',
        fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif",
      }}
    >
      <AdminSide slug={slug} tenantName={tenant.name} active="info" />
      <main
        style={{ flex: 1, padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>학원 정보·교습비</h1>

        {/* Naver Place mismatch warning — placeholder until GA4/Naver API available */}
        <div
          style={{
            padding: '16px 20px',
            background: '#FBF1CF',
            borderRadius: 12,
            display: 'flex',
            gap: 16,
            alignItems: 'center',
          }}
        >
          <div style={{ flex: 1, fontSize: 14, lineHeight: 1.6, color: '#5A4A12' }}>
            네이버 플레이스와 홈페이지 정보가 일치하는지 직접 확인해 주세요. 불일치 시 검색 신뢰도가 떨어질 수 있습니다.
          </div>
          <a
            href={tenant.naverPlaceUrl ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              height: 40,
              padding: '0 14px',
              border: '1px solid #8A6A10',
              borderRadius: 8,
              background: '#FFFFFF',
              color: '#5A4A12',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            플레이스 확인하기
          </a>
        </div>

        <InfoClient
          slug={slug}
          tenant={{
            name: tenant.name,
            regNo: tenant.regNo,
            phone: tenant.phone,
            hours: tenant.hours,
            address: tenant.address,
            subjects: tenant.subjects,
            targetGrades: tenant.targetGrades,
            kakaoChannelUrl: tenant.kakaoChannelUrl,
            naverPlaceUrl: tenant.naverPlaceUrl,
            naverMapEmbedUrl: tenant.naverMapEmbedUrl,
            locationHeadline: tenant.locationHeadline,
            transitInfo: tenant.transitInfo,
            parkingInfo: tenant.parkingInfo,
            ga4MeasurementId: tenant.ga4MeasurementId,
            naverSiteVerification: tenant.naverSiteVerification,
          }}
          director={
            director
              ? { headline: director.headline, career: director.career, philosophy: director.philosophy, education: director.education }
              : null
          }
          fees={fees.map((f) => ({ id: f.id, label: f.label, amount: f.amount }))}
          feeChangeLogs={feeChangeLogs.map((l) => ({ id: l.id, createdAt: l.createdAt.toISOString(), actorEmail: l.actorEmail }))}
          principles={principles.map((p) => ({ id: p.id, number: p.number, title: p.title, description: p.description, sortOrder: p.sortOrder }))}
          facilities={facilities.map((f) => ({ id: f.id, label: f.label, photo: f.photo, sortOrder: f.sortOrder }))}
          refundPolicyText={refundPolicyText?.body ?? null}
        />
      </main>
    </div>
  );
}
