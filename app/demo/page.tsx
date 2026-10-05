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
    label: '테마 A',
    sub: '원장 직강형',
    name: '하늘수학학원',
    desc: '원장 직강 · 소수 정예 · 신뢰감 있는 디자인',
    color: '#1E5645',
    bg: '#E4EEE9',
    fontLabel: 'Gowun Batang (명조)',
    target: '중소형 학원 · 원장 브랜딩',
    sections: ['원장 소개', '수업 원칙', '시간표', '교습비', '후기', '오시는 길'],
  },
  {
    slug: 'demo-result',
    theme: 'result',
    label: '테마 B',
    sub: '성과 중심형',
    name: '최상위수학학원',
    desc: '입시·성적 결과 강조 · 남색 다크 히어로 · 성과 수치 중심',
    color: '#1D3FA8',
    bg: '#E6EBF8',
    fontLabel: 'Gothic A1 (굵은 고딕)',
    target: '입시 전문관 · 상위권 중심',
    sections: ['성과 통계', '시험 체계', '커리큘럼', '성적 사례', '강사진', '교습비'],
  },
  {
    slug: 'demo-bright',
    theme: 'bright',
    label: '테마 C',
    sub: '밝은 친근형',
    name: '해피영어학원',
    desc: '유아·초등 대상 · 파스텔 색상 · 둥근 폰트',
    color: '#0F766E',
    bg: '#DCFCE7',
    fontLabel: 'Jua (둥근 제목)',
    target: '유아·초등 학원 · 친근함 강조',
    sections: ['하루 일과', '수업 소개', '갤러리', '안전 시설', '후기', '상담 신청'],
  },
];

const COMPARISON_ROWS = [
  { label: '주요 대상', key: 'target' as const },
  { label: '제목 폰트', key: 'fontLabel' as const },
  { label: '대표 섹션', key: 'sections' as const },
];

export default function DemoPage() {
  return (
    <div data-theme="fd" style={{ fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif", background: '#FFFFFF', color: '#14213D' }}>
      <FdHeader active="demo" />

      {/* Hero */}
      <section style={{ padding: 'clamp(56px, 7vw, 96px) clamp(20px, 4vw, 56px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 48 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
            <h1 style={{ margin: 0, fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 700, letterSpacing: '-1px', lineHeight: 1.25 }}>
              3가지 테마로<br />우리 학원에 맞게
            </h1>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.75, color: '#4A5568' }}>
              각 테마는 학원의 특성에 맞게 설계되었습니다.<br />
              내용은 같고, 분위기가 다릅니다.
            </p>
          </div>

          {/* Theme cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {demos.map((d) => (
              <div key={d.slug} style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid #E3E7EE', display: 'flex', flexDirection: 'column' }}>
                {/* Color swatch */}
                <div style={{ height: 140, background: d.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                  <div style={{ width: 72, height: 72, borderRadius: 16, background: d.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" aria-hidden="true">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: d.color, letterSpacing: 1, textTransform: 'uppercase' }}>{d.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#14213D' }}>{d.sub}</div>
                    <div style={{ fontSize: 12, color: '#4A5568', marginTop: 2 }}>{d.fontLabel}</div>
                  </div>
                </div>
                <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{d.name}</div>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#4A5568' }}>{d.desc}</p>
                  <div style={{ fontSize: 13, color: '#4A5568' }}>
                    <b style={{ color: '#14213D' }}>대상:</b> {d.target}
                  </div>
                  <Link
                    href={`/${d.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginTop: 8, height: 48, borderRadius: 10, background: d.color, color: '#FFFFFF', textDecoration: 'none', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    데모 보기 →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Side-by-side comparison table */}
      <section style={{ padding: 'clamp(40px, 5vw, 72px) clamp(20px, 4vw, 56px)', background: '#F8F9FB' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700 }}>테마 비교</h2>
            <p style={{ margin: 0, fontSize: 16, color: '#4A5568' }}>어떤 테마가 우리 학원에 맞는지 한눈에 확인하세요.</p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead>
                <tr>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#4A5568', borderBottom: '2px solid #E3E7EE', width: '20%' }}>항목</th>
                  {demos.map((d) => (
                    <th key={d.slug} style={{ padding: '14px 20px', textAlign: 'left', borderBottom: `2px solid ${d.color}`, width: '26.6%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{d.label} {d.sub}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, ri) => (
                  <tr key={row.key} style={{ background: ri % 2 === 0 ? '#FFFFFF' : '#F8F9FB' }}>
                    <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600, color: '#4A5568', borderBottom: '1px solid #EEF0F3', verticalAlign: 'top' }}>
                      {row.label}
                    </td>
                    {demos.map((d) => (
                      <td key={d.slug} style={{ padding: '14px 20px', fontSize: 14, borderBottom: '1px solid #EEF0F3', verticalAlign: 'top' }}>
                        {row.key === 'sections' ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {(d[row.key] as string[]).map((s) => (
                              <span key={s} style={{ padding: '3px 8px', borderRadius: 5, background: d.bg, color: d.color, fontSize: 12, fontWeight: 600 }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span>{d[row.key] as string}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* 상담 신청 row */}
                <tr>
                  <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600, color: '#4A5568', borderBottom: '1px solid #EEF0F3' }}>상담 신청 폼</td>
                  {demos.map((d) => (
                    <td key={d.slug} style={{ padding: '14px 20px', fontSize: 14, color: '#1E5645', fontWeight: 600, borderBottom: '1px solid #EEF0F3' }}>
                      ✓ 공통 제공
                    </td>
                  ))}
                </tr>
                <tr style={{ background: '#FFFFFF' }}>
                  <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600, color: '#4A5568', borderBottom: '1px solid #EEF0F3' }}>카카오톡 자동화</td>
                  {demos.map((d) => (
                    <td key={d.slug} style={{ padding: '14px 20px', fontSize: 14, color: '#1E5645', fontWeight: 600, borderBottom: '1px solid #EEF0F3' }}>
                      ✓ 공통 제공
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600, color: '#4A5568' }}>직접 보기</td>
                  {demos.map((d) => (
                    <td key={d.slug} style={{ padding: '14px 20px' }}>
                      <Link
                        href={`/${d.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', height: 36, padding: '0 14px', borderRadius: 8, background: d.color, color: '#FFFFFF', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
                      >
                        데모 보기 →
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: 'clamp(40px, 5vw, 64px) clamp(20px, 4vw, 56px)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>마음에 드는 테마가 있으신가요?</h2>
          <p style={{ margin: 0, fontSize: 16, color: '#4A5568' }}>베타 신청 후 원하는 테마를 선택하시면 3개월 무료로 운영해드립니다.</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/apply" style={{ height: 52, padding: '0 28px', borderRadius: 12, background: '#14213D', color: '#FFFFFF', textDecoration: 'none', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
              베타 신청하기
            </Link>
            <Link href="/consult" style={{ height: 52, padding: '0 28px', borderRadius: 12, border: '1px solid #D1D5DB', color: '#14213D', textDecoration: 'none', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              무료 진단 받기
            </Link>
          </div>
        </div>
      </section>

      <FdFooter />
    </div>
  );
}
