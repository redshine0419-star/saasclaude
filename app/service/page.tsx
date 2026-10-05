import Link from 'next/link';
import { FdHeader } from '@/components/fd/FdHeader';
import { FdFooter } from '@/components/fd/FdFooter';

export const metadata = {
  title: '서비스 소개 — 첫등원',
  description: '첫등원의 홈페이지·상담 관리·카카오톡 자동화 기능을 소개합니다.',
};

export default function ServicePage() {
  const features = [
    {
      icon: '🏫',
      title: '학원 전용 홈페이지',
      body: '3가지 테마 중 학원에 맞는 디자인 선택. 원장 소개, 반 안내, 교습비, 후기, 성적 사례, 갤러리 등 섹션을 조합해서 구성합니다.',
    },
    {
      icon: '📋',
      title: '상담 신청 & 레벨테스트',
      body: '학부모가 1분 만에 상담을 신청하고 레벨테스트 일정을 고릅니다. 새 신청이 오면 원장님 휴대폰으로 즉시 알림이 옵니다.',
    },
    {
      icon: '💬',
      title: '카카오톡 자동 안내',
      body: '접수 확인, 테스트 전날 알림, 상담 후속 안내, 등록 완료 안내까지. 6가지 시나리오가 자동으로 발송됩니다. 광고성 동의·야간 차단 규칙을 서버에서 강제합니다.',
    },
    {
      icon: '📊',
      title: '상담 관리 화면',
      body: '새 상담 → 연락 완료 → 레벨테스트 → 등록까지 단계를 한눈에 봅니다. 메모와 진행 기록이 자동으로 쌓입니다.',
    },
    {
      icon: '📰',
      title: '콘텐츠 관리',
      body: '소식·공지를 폰에서 바로 올립니다. 카카오톡으로 동시 발송도 됩니다. 후기와 성적 사례는 동의를 확인한 것만 홈페이지에 공개됩니다.',
    },
    {
      icon: '📈',
      title: '월간 리포트',
      body: '6개월 방문·신청·등록 추이, 주요 검색어, AI 검색 노출 점검 결과를 매달 정리합니다. PDF로 내려받거나 카카오톡으로 받습니다.',
    },
  ];

  return (
    <div data-theme="fd" style={{ fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif", background: '#FFFFFF', color: '#14213D' }}>
      <FdHeader active="service" />

      <section style={{ padding: 'clamp(56px, 7vw, 96px) clamp(20px, 4vw, 56px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 56 }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#8A6400', marginBottom: 12 }}>서비스 소개</div>
            <h1 style={{ margin: 0, fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 700, letterSpacing: '-1px', lineHeight: 1.25 }}>학원 원장님이 수업에<br />집중할 수 있도록</h1>
            <p style={{ margin: '20px 0 0', fontSize: 17, lineHeight: 1.75, color: '#4A5568' }}>
              홈페이지 관리, 상담 연락, 카카오톡 발송, 리포트 확인. 원장님이 직접 하던 일을 첫등원이 대신합니다.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {features.map((f) => (
              <div key={f.title} style={{ padding: 28, borderRadius: 16, border: '1px solid #E3E7EE', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 32 }}>{f.icon}</div>
                <div style={{ fontSize: 19, fontWeight: 700 }}>{f.title}</div>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.75, color: '#4A5568' }}>{f.body}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>지금 베타로 시작하세요</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/apply" style={{ height: 52, padding: '0 28px', borderRadius: 12, background: '#14213D', color: '#FFFFFF', textDecoration: 'none', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center' }}>베타 신청하기</Link>
              <Link href="/demo" style={{ height: 52, padding: '0 24px', borderRadius: 12, border: '1px solid #14213D', color: '#14213D', textDecoration: 'none', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center' }}>데모 보기</Link>
            </div>
          </div>
        </div>
      </section>

      <FdFooter />
    </div>
  );
}
