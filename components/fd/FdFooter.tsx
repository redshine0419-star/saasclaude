import Link from 'next/link';

export function FdFooter() {
  return (
    <footer
      style={{
        width: '100%',
        boxSizing: 'border-box',
        padding: 'clamp(40px, 5vw, 64px) clamp(20px, 4vw, 56px)',
        background: '#0E1730',
        color: '#B8C0CF',
        fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif",
        fontSize: 14,
        lineHeight: 1.9,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: 32,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <svg width="20" height="20" viewBox="0 0 22 22" aria-hidden="true">
              <circle cx="11" cy="11" r="9" fill="#F5B700" />
              <circle cx="11" cy="11" r="3.5" fill="#0E1730" />
            </svg>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF' }}>첫등원</span>
          </div>
          <div>동네 학원·교습소 전용 홈페이지와 상담 관리</div>
          <div style={{ marginTop: 8, color: '#8A93A8', fontSize: 13 }}>
            © {new Date().getFullYear()} 첫등원. All rights reserved.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <Link href="/privacy" style={{ color: '#FFFFFF', textDecoration: 'none' }}>개인정보처리방침</Link>
          <Link href="/terms" style={{ color: '#B8C0CF', textDecoration: 'none' }}>이용약관</Link>
        </div>
      </div>
    </footer>
  );
}
