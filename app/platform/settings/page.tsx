import { PlatformSide } from '@/components/platform/PlatformSide';

export default function PlatformSettingsPage() {
  return (
    <div style={{ display: 'flex', flex: 1 }}>
      <PlatformSide active="settings" />
      <main style={{ flex: 1, padding: '32px 40px', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif", background: '#F4F2EE', minHeight: '100vh' }}>
        <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>플랫폼 설정</h1>
            <div style={{ fontSize: 14, color: '#5A6270', marginTop: 4 }}>첫등원 서비스 전체 설정을 관리합니다.</div>
          </div>

          <div style={{ padding: 24, borderRadius: 14, background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>운영 정책</div>
            <div style={{ fontSize: 14, lineHeight: 1.8, color: '#3C4659' }}>
              <div>· 베타 기간: 오픈일 기준 3개월 무료</div>
              <div>· 베타 종료 2주 전 운영자에게 알림 발송</div>
              <div>· 베타 종료 후 30일 데이터 유지 → 비공개 전환</div>
            </div>
          </div>

          <div style={{ padding: 24, borderRadius: 14, background: '#FFFFFF' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>예약 슬러그 (학원 사용 불가)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['platform', 'admin', 'service', 'pricing', 'apply', 'demo', 'consult', 'api', '_next', 'static', 'auth', 'privacy', 'terms'].map((s) => (
                <span key={s} style={{ padding: '4px 10px', borderRadius: 6, background: '#F3F5F8', fontSize: 13, fontFamily: 'monospace', color: '#4A5568' }}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
