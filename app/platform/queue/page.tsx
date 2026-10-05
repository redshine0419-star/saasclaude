import { prisma } from '@/lib/prisma';
import { PlatformSide } from '@/components/platform/PlatformSide';

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  applied: { label: '접수', bg: '#FBF1CF', color: '#5A4A12' },
  waiting_docs: { label: '자료 대기', bg: '#E6E9EE', color: '#2C3747' },
  in_progress: { label: '제작 중', bg: '#D8E8E0', color: '#1E5645' },
  review: { label: '시안 확인', bg: '#E6EBF8', color: '#1D3FA8' },
  ready: { label: '오픈 준비', bg: '#1E5645', color: '#FFFFFF' },
};

export default async function PlatformQueuePage() {
  const applications = await prisma.application.findMany({ orderBy: [{ status: 'asc' }, { queueOrder: 'asc' }] });

  const pending = applications.filter((a) => a.status !== 'ready');
  const ready = applications.filter((a) => a.status === 'ready');

  return (
    <div style={{ display: 'flex', flex: 1 }}>
      <PlatformSide active="queue" />
      <main style={{ flex: 1, padding: '32px 40px', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif", background: '#F4F2EE', minHeight: '100vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>베타 대기열</h1>
              <div style={{ fontSize: 14, color: '#5A6270', marginTop: 4 }}>신청 순서대로 제작을 진행합니다. 총 {applications.length}건</div>
            </div>
          </div>

          <div style={{ borderRadius: 12, background: '#FFFFFF', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2DDD2', background: '#F9F8F5' }}>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>#</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>학원명</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>원장</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>과목·지역</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>상태</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>신청일</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => {
                  const st = STATUS_MAP[a.status] ?? { label: a.status, bg: '#F0F1F3', color: '#3C4659' };
                  return (
                    <tr key={a.id} style={{ borderBottom: '1px solid #F0EDE7', opacity: a.status === 'ready' ? 0.6 : 1 }}>
                      <td style={{ padding: '14px 20px', color: '#8A93A8', fontWeight: 600 }}>{a.queueOrder ?? '—'}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>{a.academyName}</td>
                      <td style={{ padding: '14px 16px', color: '#5A6270' }}>{a.directorName}</td>
                      <td style={{ padding: '14px 16px', color: '#5A6270' }}>{a.subject} · {a.area}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#8A93A8', fontSize: 13 }}>{new Date(a.createdAt).toLocaleDateString('ko-KR')}</td>
                    </tr>
                  );
                })}
                {applications.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: '#9AA3AF' }}>접수된 신청이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
