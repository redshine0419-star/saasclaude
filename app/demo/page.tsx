import Link from 'next/link';
import { FdHeader } from '@/components/fd/FdHeader';
import { FdFooter } from '@/components/fd/FdFooter';

export const metadata = {
  title: '데모 보기 — 첫등원',
  description: '3가지 테마의 학원 홈페이지 데모를 직접 확인해보세요.',
};

const demos = [
  {
    slug: 'demo-warm',
    theme: 'warm',
    label: '테마 A — 원장 직강형',
    name: '하늘수학학원',
    desc: '원장 직강 · 소수 정예 · 명조 제목의 신뢰감 있는 디자인',
    color: '#1E5645',
    bg: '#E4EEE9',
  },
  {
    slug: 'demo-result',
    theme: 'result',
    label: '테마 B — 성과 중심형',
    name: '최상위수학학원',
    desc: '입시·성적 결과 강조 · 남색 다크 히어로 · 성과 수치 중심',
    color: '#1D3FA8',
    bg: '#E6EBF8',
  },
  {
    slug: 'demo-bright',
    theme: 'bright',
    label: '테마 C — 밝은 친근형',
    name: '해피영어학원',
    desc: '유아·초등 대상 · 파스텔 색상 · 둥근 Jua 폰트',
    color: '#0F766E',
    bg: '#DCFCE7',
  },
];

export default function DemoPage() {
  return (
    <div data-theme="fd" style={{ fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif", background: '#FFFFFF', color: '#14213D' }}>
      <FdHeader active="demo" />

      <section style={{ padding: 'clamp(56px, 7vw, 96px) clamp(20px, 4vw, 56px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 48 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
            <h1 style={{ margin: 0, fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 700, letterSpacing: '-1px', lineHeight: 1.25 }}>3가지 테마로<br />우리 학원에 맞게</h1>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.75, color: '#4A5568' }}>
              각 테마는 학원의 특성에 맞게 설계되었습니다. 내용은 같고, 분위기가 다릅니다.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {demos.map((d) => (
              <div key={d.slug} style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid #E3E7EE', display: 'flex', flexDirection: 'column' }}>
                {/* Color preview */}
                <div style={{ height: 140, background: d.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 80, height: 80, borderRadius: 16, background: d.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                </div>
                <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: d.color, textTransform: 'uppercase', letterSpacing: 1 }}>{d.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{d.name}</div>
                  <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: '#4A5568' }}>{d.desc}</p>
                  <Link
                    href={`/${d.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginTop: 8, height: 48, borderRadius: 10, background: d.color, color: '#FFFFFF', textDecoration: 'none', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    데모 보기 →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(40px, 5vw, 64px) clamp(20px, 4vw, 56px)', background: '#F3F5F8' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>마음에 드는 테마가 있으신가요?</h2>
          <Link href="/apply" style={{ height: 52, padding: '0 28px', borderRadius: 12, background: '#14213D', color: '#FFFFFF', textDecoration: 'none', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center' }}>베타 신청하기</Link>
        </div>
      </section>

      <FdFooter />
    </div>
  );
}
