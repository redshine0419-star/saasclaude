import { prisma } from '@/lib/prisma';
import { PlatformSide } from '@/components/platform/PlatformSide';

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: '대기 중', bg: '#FBF1CF', color: '#5A4A12' },
  in_review: { label: '검토 중', bg: '#D8E8E0', color: '#1E5645' },
  done: { label: '완료', bg: '#E6E9EE', color: '#2C3747' },
};

export default async function PlatformDiagnosisPage() {
  const requests = await prisma.diagnosticRequest.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div style={{ display: 'flex', flex: 1 }}>
      <PlatformSide active="diagnosis" />
      <main style={{ flex: 1, padding: '32px 40px', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif", background: '#F4F2EE', minHeight: '100vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>무료 진단 목록</h1>
            <div style={{ fontSize: 14, color: '#5A6270', marginTop: 4 }}>서비스 사이트에서 접수된 무료 진단 신청입니다.</div>
          </div>

          <div style={{ borderRadius: 12, background: '#FFFFFF', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2DDD2', background: '#F9F8F5' }}>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>학원명</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>지역</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>과목</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>연락처</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>상태</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>신청일</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => {
                  const st = STATUS_MAP[r.status] ?? { label: r.status, bg: '#F0F1F3', color: '#3C4659' };
                  const masked = r.phone.replace(/(\d{3})-?\d{4}-?(\d{4})/, '$1-****-$2');
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #F0EDE7' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 600 }}>{r.academyName}</td>
                      <td style={{ padding: '14px 16px', color: '#5A6270' }}>{r.area}</td>
                      <td style={{ padding: '14px 16px', color: '#5A6270' }}>{r.subject}</td>
                      <td style={{ padding: '14px 16px', color: '#5A6270' }}>{masked}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#8A93A8', fontSize: 13 }}>{new Date(r.createdAt).toLocaleDateString('ko-KR')}</td>
                    </tr>
                  );
                })}
                {requests.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: '#9AA3AF' }}>접수된 진단 신청이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
