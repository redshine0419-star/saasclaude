import Navigation from '@/components/Navigation';
import AdBannerMock from '@/components/AdBannerMock';
import InteractiveTimeline from '@/components/InteractiveTimeline';
import Link from 'next/link';

const paragraphs = [
  {
    text: `1793년 10월 16일, 파리 혁명 광장. 군중의 함성 속에 한 여인이 단두대에 올랐다. 마리 앙투아네트, 향년 37세. 처형 직전, 그녀는 실수로 사형집행인의 발을 밟았다. "미안해요, 일부러 그런 게 아니에요." 유럽을 호령하던 오스트리아 황녀의 마지막 말은 이 사소한 사과였다. 역사는 그녀를 '적자 부인'이라 불렀지만, 진실은 훨씬 복잡하다.`,
  },
  {
    text: `마리 앙투아네트가 프랑스 왕세자와 결혼한 건 14살 때다. 그녀는 프랑스어도 제대로 못 했고, 사교 규범도 몰랐다. 베르사유 궁전의 매일 아침은 고문이었다. 수십 명의 귀족 앞에서 옷을 입혀야 했고, 식사도 구경거리였다. 고독을 달래기 위해 그녀가 선택한 건 패션, 도박, 그리고 작은 궁전 프티 트리아농이었다. 사치는 자기 방어였다.`,
  },
  {
    text: `이른바 '목걸이 사건'이 그녀의 운명을 갈랐다. 1785년, 사기꾼들이 150만 리브르짜리 다이아몬드 목걸이를 왕비 이름으로 구입했다. 왕비는 이 목걸이를 본 적도 없었다. 그러나 재판은 공개로 진행되었고, 프랑스 민중은 '왕비가 사치를 부렸다'는 이야기를 믿었다. 언론이 만들어낸 허상이 실제 왕비보다 강력했다.`,
  },
  {
    text: `혁명이 터지자 루이 16세와 마리 앙투아네트는 탈출을 시도했다. 1791년 바렌 도주 사건. 왕실 가족은 국경 직전까지 갔다가 우체국 직원에게 발각되어 파리로 끌려왔다. 이 실패한 탈출이 결정적이었다. '왕이 도망쳤다'는 사실은 공화파에게 최고의 선전 재료였다. 군주제는 사실상 이날 끝났다.`,
  },
  {
    text: `감옥에 갇힌 마리 앙투아네트에게 가장 가혹한 시련은 아들 루이 샤를의 분리였다. 혁명 정부는 여덟 살 왕세자를 어머니에게서 강제로 떼어내 '공화주의 교육'을 시켰다. 아이는 어머니에게 불리한 증언을 하도록 세뇌됐다. "어머니가 나를 성적으로 학대했다"는 아이의 진술에 재판정의 마리 앙투아네트는 방청객 전체를 향해 말했다. "자연이 어머니들에게 부여한 본능에 호소합니다."`,
  },
  {
    text: `사형 선고 후 마리 앙투아네트에게 주어진 것은 단 하루였다. 그녀는 밤새 마지막 편지를 썼다. 처형은 새벽 4시에 통보되었고, 아침 10시에 집행됐다. 편지는 봉인된 채 수십 년간 발견되지 않았다. 역사가들이 이 편지를 발굴했을 때, 거기엔 음모도 저주도 없었다. 그저 두 딸과 아들을 사랑한다는 말뿐이었다.`,
  },
];

export default function StoryPage() {
  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>
      <Navigation />

      <main className="pt-20 pb-24 md:pb-8 max-w-3xl mx-auto px-4">
        {/* Hero */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--gold-dark)' }}>
            📖 역사 이야기
          </div>
          <h1 className="text-2xl md:text-4xl font-black mb-3 leading-tight" style={{ color: 'var(--cream)', fontFamily: 'Georgia, serif' }}>
            마리 앙투아네트의<br />
            <span className="text-gold-gradient">억울한 비밀 6가지</span>
          </h1>
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--cream-muted)' }}>
            <span>👑 프랑스 혁명</span>
            <span>·</span>
            <span>📅 1789~1793</span>
            <span>·</span>
            <span>⏱ 읽기 약 5분</span>
            <span>·</span>
            <span>👁 12.4K 조회</span>
          </div>
        </div>

        {/* Cover image placeholder */}
        <div
          className="w-full h-48 md:h-64 rounded-2xl mb-8 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #2d1f0e, #1e3a2d)', border: '1px solid var(--border)' }}
        >
          <div className="text-center">
            <div className="text-6xl mb-2">👑</div>
            <p className="text-xs" style={{ color: 'var(--cream-muted)' }}>베르사유 궁전, 1789</p>
          </div>
        </div>

        {/* Article content */}
        <article className="space-y-6">
          {paragraphs.map((p, i) => (
            <div key={i}>
              <p className="text-sm md:text-base leading-8" style={{ color: 'var(--cream)', lineHeight: '2' }}>
                {p.text}
              </p>

              {/* Ad after 3rd paragraph */}
              {i === 2 && (
                <div className="my-6">
                  <AdBannerMock size="rectangle" />
                </div>
              )}

              {/* Ad after 5th paragraph */}
              {i === 4 && (
                <div className="my-6">
                  <AdBannerMock size="square" />
                </div>
              )}
            </div>
          ))}
        </article>

        {/* CTA to quiz */}
        <div
          className="mt-10 p-6 rounded-2xl text-center border"
          style={{ background: 'linear-gradient(135deg, rgba(212,168,67,0.1), rgba(91,141,217,0.1))', borderColor: 'rgba(212,168,67,0.3)' }}
        >
          <p className="font-bold mb-2" style={{ color: 'var(--cream)' }}>이 사건, 실제 기출문제로 나왔습니다</p>
          <p className="text-xs mb-4" style={{ color: 'var(--cream-muted)' }}>세능검 프랑스 혁명 파트 기출 5문항 도전해보세요</p>
          <Link
            href="/exam"
            className="inline-block px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--gold)', color: '#1a1208' }}
          >
            🏆 기출 퀴즈 도전하기
          </Link>
        </div>

        {/* Interactive Timeline */}
        <section className="mt-12">
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--cream)' }}>
            🗺️ 프랑스 혁명 인터랙티브 연표
          </h2>
          <p className="text-xs mb-6" style={{ color: 'var(--cream-muted)' }}>
            각 카드를 눌러 사건의 상세 내용을 확인하세요
          </p>
          <InteractiveTimeline />
        </section>
      </main>
    </div>
  );
}
