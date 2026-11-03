import Link from 'next/link';
import { FdHeader } from '@/components/fd/FdHeader';
import { FdFooter } from '@/components/fd/FdFooter';
import { prisma } from '@/lib/prisma';
import { PLAN_TIERS, formatWon, tierPrice } from '@/lib/plan-tier';

export const metadata = {
  title: '요금 — 첫등원',
  description: '첫등원 베타 기간 3개월 무료. 이후 월 구독 요금을 확인하세요.',
};

// 금액은 플랫폼 관리자 설정에서 바뀌므로 요청마다 읽는다
export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const priceRows = await prisma.platformSetting
    .findMany({ where: { key: { in: ['price_tier_standard', 'price_tier_plus'] } } })
    .catch(() => []);
  const priceSettings = Object.fromEntries(priceRows.map((r) => [r.key, r.value]));

  const features = [
    '학원 홈페이지 (3가지 테마 중 선택)',
    '상담 신청 폼 + 레벨테스트 일정',
    '온라인 레벨테스트 (문제은행·자동 채점·서술형 첨삭)',
    '카카오톡 자동 안내 (7종 시나리오)',
    '원장 관리 화면 (상담 관리, 상태 변경)',
    '콘텐츠 관리 (소식, 후기, 성적 사례)',
    '월간 리포트 (방문·신청·등록 수치)',
    '네이버·구글·AI 검색에 잘 읽히는 홈페이지 구조',
    'SSL 보안 인증서 포함',
  ];

  const faq = [
    {
      q: '학생 수는 어떻게 세나요?',
      a: '관리자 학생부에 "재원"으로 등록된 학생 수입니다. 휴원·퇴원 학생과 상담만 한 학부모는 세지 않습니다. 재원생 5명까지는 계속 무료입니다.',
    },
    {
      q: '결제는 어떻게 하나요?',
      a: '베타 기간에는 결제가 없습니다. 베타 이후에는 카드 정기결제(매월)로만 이용할 수 있고, 첫 결제 전에 미리 안내드립니다. 언제든 해지할 수 있습니다.',
    },
    {
      q: '베타 기간 3개월이 지나면 어떻게 되나요?',
      a: '베타 종료 2주 전에 운영자가 직접 연락드립니다. 유료 전환 또는 서비스 종료를 선택하실 수 있습니다. 종료 시 데이터는 30일간 유지된 후 삭제됩니다.',
    },
    {
      q: '중간에 서비스를 해지할 수 있나요?',
      a: '베타 기간 중에는 언제든지 해지할 수 있습니다. 해지 신청 후 30일간 데이터가 유지됩니다.',
    },
    {
      q: '카카오톡 발송 비용이 따로 드나요?',
      a: '베타 기간 중에는 메시지 발송 비용이 포함되어 있습니다. 유료 전환 시 요금 구조에 안내해드립니다.',
    },
    {
      q: '학원 정보 수정은 직접 할 수 있나요?',
      a: '네, 원장님이 관리 화면에서 직접 수정하실 수 있습니다. 소식, 반 정보, 사진 등을 폰으로 바로 올릴 수 있습니다.',
    },
  ];

  return (
    <div data-theme="fd" style={{ fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif", background: '#FFFFFF', color: '#14213D' }}>
      <FdHeader active="pricing" />

      {/* Hero */}
      <section style={{ padding: 'clamp(56px, 7vw, 96px) clamp(20px, 4vw, 56px)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <span style={{ padding: '6px 14px', borderRadius: 6, background: '#FFF3CC', color: '#5C4300', fontSize: 14, fontWeight: 700 }}>베타 기간 운영 중</span>
          <h1 style={{ margin: 0, fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 700, letterSpacing: '-1px', lineHeight: 1.25 }}>지금은 3개월 완전 무료</h1>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.75, color: '#4A5568', maxWidth: 560 }}>
            베타 참여 학원은 모든 기능을 3개월 동안 무료로 이용합니다.<br />인원 제한 없음, 자동 결제 없음.
          </p>
        </div>
      </section>

      {/* Plan card */}
      <section style={{ padding: '0 clamp(20px, 4vw, 56px) clamp(56px, 7vw, 96px)' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 36, borderRadius: 20, border: '2px solid #14213D', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#8A6400', marginBottom: 8 }}>BETA PLAN</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-2px' }}>₩0</span>
              <span style={{ fontSize: 16, color: '#4A5568' }}>/ 3개월</span>
            </div>
            <div style={{ fontSize: 14, color: '#4A5568', marginTop: 4 }}>이후에는 재원생 수에 따른 요금 (아래 참고)</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {features.map((f) => (
              <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 20, height: 20, borderRadius: 10, background: '#14213D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#FFFFFF" strokeWidth="2"><path d="M10 3 5 9 2 6" /></svg>
                </div>
                <span style={{ fontSize: 15, lineHeight: 1.6 }}>{f}</span>
              </div>
            ))}
          </div>

          <Link href="/start" style={{ height: 56, borderRadius: 12, background: '#14213D', color: '#FFFFFF', textDecoration: 'none', fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            무료로 바로 만들기
          </Link>
        </div>
      </section>

      {/* 정식 요금 — 재원생 수 구간 */}
      <section style={{ padding: '0 clamp(20px, 4vw, 56px) clamp(56px, 7vw, 96px)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>베타 이후 요금</h2>
            <p style={{ margin: '8px 0 0', fontSize: 15, color: '#4A5568', lineHeight: 1.7 }}>학생부에 등록된 재원생 수에 따라 정해지고, 학생 수가 바뀌면 그 달부터 바로 해당 구간이 적용됩니다. 모든 구간에서 기능은 같습니다.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {PLAN_TIERS.map((t) => (
              <div key={t.key} style={{ padding: 28, borderRadius: 16, border: t.key === 'standard' ? '2px solid #14213D' : '1px solid #E3E7EE', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#8A6400' }}>{t.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-1px' }}>{tierPrice(t.key, priceSettings) === 0 ? '₩0' : formatWon(tierPrice(t.key, priceSettings))}</div>
                <div style={{ fontSize: 15, color: '#4A5568' }}>{t.range}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, color: '#8A93A8', textAlign: 'center', lineHeight: 1.7 }}>
            부가세 별도 여부 등 세부 조건은 베타 종료 전에 안내드립니다. 결제는 카드 정기결제(매월)이며, 베타 기간에는 결제가 없습니다.
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: 'clamp(56px, 7vw, 96px) clamp(20px, 4vw, 56px)', background: '#F3F5F8' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>자주 묻는 질문</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {faq.map((item, i) => (
              <div key={i} style={{ padding: '24px 0', borderBottom: '1px solid #E3E7EE' }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Q. {item.q}</div>
                <div style={{ fontSize: 15, lineHeight: 1.75, color: '#4A5568' }}>{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FdFooter />
    </div>
  );
}
