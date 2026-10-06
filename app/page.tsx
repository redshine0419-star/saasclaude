import Link from 'next/link';
import { FdHeader } from '@/components/fd/FdHeader';
import { FdFooter } from '@/components/fd/FdFooter';

export const metadata = {
  title: '첫등원 — 동네 학원·교습소 홈페이지와 상담 관리',
  description: '학부모가 찾고, 상담 신청하고, 카카오톡으로 안내받고, 등원까지. 동네 학원을 위한 홈페이지와 상담 관리 솔루션.',
};

export default function MarketingHome() {
  const painPoints = [
    {
      n: '01',
      title: '신규 상담은 맘카페와 입소문에만 기대고 있다',
      body: '학부모가 학원 이름을 검색했을 때 보여줄 곳이 네이버 플레이스 한 칸뿐입니다.',
    },
    {
      n: '02',
      title: '상담하고 연락이 끊긴 학부모가 많다',
      body: '수업하느라 다시 연락할 타이밍을 놓치고, 그 사이 다른 학원으로 갑니다.',
    },
    {
      n: '03',
      title: '홈페이지를 만들어도 몇 달 지나면 방치된다',
      body: '수정하려면 업체에 연락해야 하고, 결국 작년 공지가 그대로 걸려 있습니다.',
    },
  ];

  const steps = [
    {
      n: '1',
      title: '찾고',
      body: '"우리 동네 수학학원" 검색과 AI 검색에 학원이 보이도록 관리합니다.',
      dark: false,
    },
    {
      n: '2',
      title: '신청하고',
      body: '휴대폰에서 1분 만에 끝나는 상담·레벨테스트 신청 화면.',
      dark: false,
    },
    {
      n: '3',
      title: '안내받고',
      body: '접수 확인, 테스트 전날 알림, 미등록 후속 안내가 카카오톡으로 자동 발송됩니다.',
      dark: false,
    },
    {
      n: '4',
      title: '등원합니다',
      body: '원장님은 관리 화면에서 상담부터 등록까지 한눈에 보고, 매달 숫자로 확인합니다.',
      dark: true,
    },
  ];

  const fdDoes = [
    '학원 홈페이지 구축 및 유지',
    '상담 신청 폼·레벨테스트 일정',
    '카카오톡 자동 안내 발송',
    '원장님 관리 화면 제공',
    '월간 방문·신청·등록 리포트',
    'AI 검색 노출 점검',
  ];

  return (
    <div data-theme="fd" style={{ fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif", background: '#FFFFFF', color: '#14213D' }}>
      <FdHeader active="home" />

      {/* Hero */}
      <section style={{ padding: 'clamp(48px, 7vw, 96px) clamp(20px, 4vw, 56px) clamp(56px, 7vw, 104px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'clamp(40px, 5vw, 72px)', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ padding: '6px 12px', borderRadius: 6, background: '#FFF3CC', color: '#5C4300', fontSize: 14, fontWeight: 700 }}>동네 학원·교습소 전용</span>
              <Link href="/pricing" style={{ padding: '6px 12px', borderRadius: 6, background: '#14213D', color: '#FFFFFF', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>지금 베타 · 3개월 무료</Link>
            </div>
            <h1 style={{ margin: 0, fontSize: 'clamp(38px, 5.2vw, 68px)', lineHeight: 1.2, fontWeight: 700, letterSpacing: '-1.5px' }}>
              홈페이지가 아니라<br />
              <span style={{ boxShadow: 'inset 0 -0.32em 0 #F5B700' }}>첫 등원</span>을 만듭니다
            </h1>
            <p style={{ margin: 0, fontSize: 'clamp(17px, 1.5vw, 20px)', lineHeight: 1.75, color: '#3C4659', maxWidth: 540 }}>
              학부모가 찾고, 상담을 신청하고, 등록까지 이어지는 흐름. 홈페이지와 카카오톡 안내, 원장님 관리 화면을 하나로 묶어 드립니다.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <Link href="/consult" style={{ height: 56, padding: '0 26px', borderRadius: 12, background: '#14213D', color: '#FFFFFF', textDecoration: 'none', fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center' }}>우리 학원 무료 진단</Link>
              <Link href="/demo" style={{ height: 56, padding: '0 24px', borderRadius: 12, border: '1px solid #14213D', color: '#14213D', textDecoration: 'none', fontSize: 17, fontWeight: 600, display: 'flex', alignItems: 'center' }}>데모 먼저 보기</Link>
            </div>
          </div>

          {/* Mock UI cards */}
          <div style={{ padding: 'clamp(24px, 3vw, 40px)', borderRadius: 24, background: '#F3F5F8', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 20, borderRadius: 16, background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 12, marginRight: '18%' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#5A6478' }}>학부모가 보는 화면</div>
              <div style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.4 }}>한 반 8명, 원장 직강</div>
              <div style={{ height: 44, borderRadius: 10, background: '#14213D', color: '#FFFFFF', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>무료 레벨테스트 신청</div>
            </div>
            <div style={{ padding: '18px 20px', borderRadius: 16, background: '#FFF3CC', display: 'flex', flexDirection: 'column', gap: 6, marginLeft: '14%', marginRight: '4%' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#5C4300' }}>학부모 카카오톡으로 자동 발송</div>
              <div style={{ fontSize: 15, lineHeight: 1.6 }}>상담 신청이 접수되었습니다. 원장이 내일까지 직접 연락드리겠습니다.</div>
            </div>
            <div style={{ padding: '18px 20px', borderRadius: 16, background: '#14213D', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginLeft: '28%' }}>
              <div>
                <div style={{ fontSize: 12, color: '#B8C0CF', fontWeight: 600 }}>원장님 휴대폰 알림</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>새 상담 · 중2 · 네이버 검색</div>
              </div>
              <div style={{ width: 10, height: 10, borderRadius: 5, background: '#F5B700', flexShrink: 0 }} />
            </div>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section style={{ padding: 'clamp(56px, 7vw, 104px) clamp(20px, 4vw, 56px)', background: '#F3F5F8' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 40 }}>
          <h2 style={{ margin: 0, fontSize: 'clamp(28px, 3.2vw, 42px)', lineHeight: 1.35, letterSpacing: '-0.8px' }}>원장님, 이런 상황 익숙하시죠?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {painPoints.map((p) => (
              <div key={p.n} style={{ padding: 32, borderRadius: 16, background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 40, fontWeight: 700, color: '#C9CFDA' }}>{p.n}</div>
                <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.45 }}>{p.title}</div>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.75, color: '#4A5568' }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4-step flow */}
      <section style={{ padding: 'clamp(56px, 7vw, 104px) clamp(20px, 4vw, 56px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#8A6400' }}>첫등원이 만드는 흐름</div>
            <h2 style={{ margin: 0, fontSize: 'clamp(28px, 3.2vw, 42px)', lineHeight: 1.35, letterSpacing: '-0.8px' }}>찾고, 신청하고, 안내받고, 등원합니다</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
            {steps.map((s) => (
              <div key={s.n} style={{ padding: 28, borderRadius: 16, border: s.dark ? 'none' : '1px solid #E3E7EE', background: s.dark ? '#14213D' : '#FFFFFF', color: s.dark ? '#FFFFFF' : '#14213D', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 18, background: s.dark ? '#FFFFFF' : '#F5B700', color: s.dark ? '#14213D' : '#14213D', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.n}</div>
                <div style={{ fontSize: 19, fontWeight: 700 }}>{s.title}</div>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: s.dark ? '#B8C0CF' : '#4A5568' }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you do vs what we do */}
      <section style={{ padding: '0 clamp(20px, 4vw, 56px) clamp(56px, 7vw, 104px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <div style={{ padding: 'clamp(28px, 3vw, 44px)', borderRadius: 20, background: '#F3F5F8', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>원장님이 하실 일</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 16, lineHeight: 1.6 }}>
              <div>· 처음 한 번, 학원 정보와 사진 전달</div>
              <div>· 상담 알림이 오면 전화하기</div>
              <div>· 생각날 때 폰으로 소식 올리기</div>
            </div>
          </div>
          <div style={{ padding: 'clamp(28px, 3vw, 44px)', borderRadius: 20, background: '#14213D', color: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>첫등원이 하는 일</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, fontSize: 16, lineHeight: 1.6, color: '#E4E8EF' }}>
              {fdDoes.map((item) => (
                <div key={item}>· {item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3-theme preview */}
      <section style={{ padding: 'clamp(56px, 7vw, 104px) clamp(20px, 4vw, 56px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#8A6400' }}>3가지 테마</div>
            <h2 style={{ margin: 0, fontSize: 'clamp(28px, 3.2vw, 42px)', lineHeight: 1.35, letterSpacing: '-0.8px' }}>학원 분위기에 맞게 고릅니다</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {[
              {
                badge: '테마 A',
                name: '원장 직강형',
                desc: '따뜻한 종이색 바탕, 명조 제목. "원장이 직접 가르칩니다"를 강조할 때.',
                accent: '#1E5645',
                bg: '#F9F7F2',
                preview: { heading: '원장이 직접 가르칩니다', btn: '무료 레벨테스트 신청', btnBg: '#1E5645' },
              },
              {
                badge: '테마 B',
                name: '성과 중심형',
                desc: '남색·흰색, 굵은 고딕. 합격 실적과 성적 향상 사례를 앞에 내세울 때.',
                accent: '#1D3FA8',
                bg: '#F0F3FA',
                preview: { heading: '합격 실적으로 증명합니다', btn: '성적 사례 보기', btnBg: '#1D3FA8' },
              },
              {
                badge: '테마 C',
                name: '밝은 친근형',
                desc: '흰 바탕 파스텔 카드, 둥근 제목. 어린 학생·학부모에게 친근한 분위기.',
                accent: '#0F766E',
                bg: '#F0FDF8',
                preview: { heading: '안심하고 보내세요', btn: '상담 신청하기', btnBg: '#0F766E' },
              },
            ].map((t) => (
              <div key={t.badge} style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid #E3E7EE' }}>
                <div style={{ padding: 'clamp(20px, 2.5vw, 32px)', background: t.bg, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 6, background: t.accent, color: '#FFFFFF', fontSize: 12, fontWeight: 700 }}>{t.badge}</span>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{t.name}</span>
                  </div>
                  <div style={{ padding: 20, borderRadius: 14, background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.4 }}>{t.preview.heading}</div>
                    <div style={{ height: 38, borderRadius: 8, background: t.preview.btnBg, color: '#FFFFFF', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.preview.btn}</div>
                  </div>
                </div>
                <div style={{ padding: '16px 24px', background: '#FFFFFF', fontSize: 14, lineHeight: 1.7, color: '#4A5568' }}>{t.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <Link href="/demo" style={{ height: 48, padding: '0 24px', borderRadius: 10, border: '1px solid #14213D', color: '#14213D', textDecoration: 'none', fontSize: 15, fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>3가지 테마 데모 보기</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: 'clamp(56px, 7vw, 104px) clamp(20px, 4vw, 56px)', background: '#F3F5F8' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, textAlign: 'center' }}>
          <span style={{ padding: '6px 14px', borderRadius: 6, background: '#FFF3CC', color: '#5C4300', fontSize: 14, fontWeight: 700 }}>베타 기간 3개월 무료</span>
          <h2 style={{ margin: 0, fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-1px' }}>지금 신청하면<br />제작팀이 직접 연락드립니다</h2>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.75, color: '#4A5568' }}>대기 순서대로 제작을 시작합니다. 신청 후 개강까지 평균 2주 소요됩니다.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            <Link href="/apply" style={{ height: 56, padding: '0 32px', borderRadius: 12, background: '#14213D', color: '#FFFFFF', textDecoration: 'none', fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center' }}>베타 신청하기</Link>
            <Link href="/consult" style={{ height: 56, padding: '0 28px', borderRadius: 12, border: '1px solid #14213D', color: '#14213D', textDecoration: 'none', fontSize: 17, fontWeight: 600, display: 'flex', alignItems: 'center' }}>무료 진단 먼저</Link>
          </div>
        </div>
      </section>

      <FdFooter />
    </div>
  );
}
