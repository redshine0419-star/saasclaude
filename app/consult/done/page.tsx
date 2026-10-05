import Link from 'next/link';
import { FdHeader } from '@/components/fd/FdHeader';
import { FdFooter } from '@/components/fd/FdFooter';

export const metadata = { title: '진단 신청 완료 — 첫등원' };

export default function ConsultDonePage() {
  return (
    <div data-theme="fd" style={{ fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif", background: '#FFFFFF', color: '#14213D' }}>
      <FdHeader />
      <section style={{ padding: 'clamp(80px, 10vw, 140px) clamp(20px, 4vw, 56px)', display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 36, background: '#FFF3CC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5C4300" strokeWidth="2.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>진단 신청이 완료됐습니다</h1>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.75, color: '#4A5568' }}>
            영업일 기준 2일 이내 담당자가 연락드립니다.<br />
            연락처를 확인해 주세요.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/apply" style={{ height: 48, padding: '0 24px', borderRadius: 10, background: '#14213D', color: '#FFFFFF', textDecoration: 'none', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center' }}>베타 신청하기</Link>
            <Link href="/" style={{ height: 48, padding: '0 24px', borderRadius: 10, border: '1px solid #14213D', color: '#14213D', textDecoration: 'none', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center' }}>홈으로</Link>
          </div>
        </div>
      </section>
      <FdFooter />
    </div>
  );
}
