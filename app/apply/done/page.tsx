import Link from 'next/link';
import { FdHeader } from '@/components/fd/FdHeader';
import { FdFooter } from '@/components/fd/FdFooter';

export const metadata = {
  title: '신청 완료 — 첫등원',
};

export default function ApplyDonePage() {
  return (
    <div data-theme="fd" style={{ fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif", background: '#FFFFFF', color: '#14213D' }}>
      <FdHeader />
      <section style={{ padding: 'clamp(80px, 10vw, 140px) clamp(20px, 4vw, 56px)', display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 36, background: '#FFF3CC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5C4300" strokeWidth="2.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 style={{ margin: 0, fontSize: 34, fontWeight: 700, letterSpacing: '-0.5px' }}>신청이 완료됐습니다</h1>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.75, color: '#4A5568' }}>
            영업일 기준 2일 이내 담당자가 직접 연락드리겠습니다.<br />
            신청해 주셔서 감사합니다.
          </p>
          <div style={{ marginTop: 8, padding: '20px 28px', borderRadius: 14, background: '#F3F5F8', textAlign: 'left', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>다음 단계</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 15, lineHeight: 1.6, color: '#3C4659' }}>
              <div>1. 담당자가 연락 후 제작 시작</div>
              <div>2. 학원 정보·사진 전달 (2주 이내)</div>
              <div>3. 시안 확인 후 오픈</div>
            </div>
          </div>
          <Link href="/" style={{ height: 52, padding: '0 28px', borderRadius: 12, background: '#14213D', color: '#FFFFFF', textDecoration: 'none', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center' }}>홈으로 돌아가기</Link>
        </div>
      </section>
      <FdFooter />
    </div>
  );
}
