import { prisma } from '@/lib/prisma';
import { PlatformSide } from '@/components/platform/PlatformSide';
import { DiagnosisClient } from './DiagnosisClient';

export default async function PlatformDiagnosisPage() {
  const rows = await prisma.diagnosticRequest.findMany({ orderBy: { createdAt: 'desc' } });

  const requests = rows.map((r) => ({
    id: r.id,
    academyName: r.academyName,
    area: r.area,
    subject: r.subject,
    phone: r.phone,
    currentUrl: r.currentUrl,
    status: r.status,
    resultNote: r.resultNote,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scores: (r.scores as any) ?? null,
    createdAt: r.createdAt.toISOString(),
  }));

  const pendingCount = rows.filter((r) => r.status === 'pending').length;

  return (
    <div style={{ display: 'flex', flex: 1 }}>
      <PlatformSide active="diagnosis" />
      <main
        style={{
          flex: 1,
          padding: '32px 40px',
          color: '#1B2430',
          fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif",
          background: '#F4F2EE',
          minHeight: '100vh',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>무료 진단</h1>
            <div style={{ fontSize: 14, color: '#5A6270', marginTop: 4 }}>
              서비스 사이트에서 접수된 무료 진단 신청입니다.
              {pendingCount > 0 && (
                <span style={{ marginLeft: 8, background: '#C8433A', color: '#FFFFFF', borderRadius: 10, fontSize: 12, fontWeight: 700, padding: '2px 7px' }}>
                  대기 {pendingCount}건
                </span>
              )}
            </div>
          </div>

          <DiagnosisClient requests={requests} />
        </div>
      </main>
    </div>
  );
}
