import Link from 'next/link';
import Navigation from '@/components/Navigation';
import DdayCounter from '@/components/DdayCounter';

const rankingData = [
  { rank: 1, title: '마리 앙투아네트의 억울한 진실', views: '12.4K', emoji: '👑', hot: true },
  { rank: 2, title: '나폴레옹의 키는 정말 작았을까?', views: '9.8K', emoji: '⚔️', hot: true },
  { rank: 3, title: '바스티유엔 죄수가 7명뿐이었다', views: '7.2K', emoji: '🔥', hot: false },
  { rank: 4, title: '루이 16세가 처형날 한 마지막 말', views: '5.9K', emoji: '📜', hot: false },
  { rank: 5, title: '공포정치 로베스피에르의 최후', views: '4.3K', emoji: '⚗️', hot: false },
];

const sections = [
  {
    href: '/story',
    emoji: '📖',
    title: '역사 이야기',
    desc: '교과서에 없는 비하인드 세계사',
    color: '#d4a843',
    badge: '마리 앙투아네트 편',
  },
  {
    href: '/exam',
    emoji: '🏆',
    title: '퀴즈 도전',
    desc: '세능검 기출 & 조선직업 심리테스트',
    color: '#5b8dd9',
    badge: '오늘 응시자 483명',
  },
  {
    href: '/media',
    emoji: '🎬',
    title: '역사 미디어',
    desc: '역사 영화 큐레이션 & 예고편',
    color: '#8b4a8b',
    badge: '레미제라블 추가',
  },
];

export default function Home() {
  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>
      <Navigation />

      <main className="pt-16 pb-24 md:pb-8">
        {/* Hero */}
        <section
          className="relative px-4 py-16 text-center overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #2d1f0e 0%, var(--bg) 100%)' }}
        >
          {/* Decorative */}
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #d4a843 0%, transparent 60%)' }} />
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6 border"
              style={{ backgroundColor: 'rgba(212,168,67,0.1)', borderColor: 'rgba(212,168,67,0.3)', color: 'var(--gold)' }}>
              ⚗️ 역사를 실험하다
            </div>
            <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
              <span className="text-gold-gradient">이야기로 시작해</span>
              <br />
              <span style={{ color: 'var(--cream)' }}>스펙으로 완성하다</span>
            </h1>
            <p className="text-sm md:text-base mb-8" style={{ color: 'var(--cream-muted)' }}>
              스낵형 역사 비하인드 × 세능검 기출 퀴즈 하이브리드 플랫폼
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/story"
                className="px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--gold)', color: '#1a1208' }}
              >
                📖 오늘의 역사 읽기
              </Link>
              <Link
                href="/exam"
                className="px-6 py-3 rounded-xl font-bold text-sm border transition-all hover:opacity-80"
                style={{ borderColor: 'var(--border)', color: 'var(--cream)' }}
              >
                🏆 기출 퀴즈 도전
              </Link>
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 space-y-10">
          {/* D-Day counter */}
          <DdayCounter />

          {/* 섹션 카드 */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--gold-dark)' }}>
              콘텐츠 탐색
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {sections.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="p-5 rounded-2xl border transition-all hover:scale-[1.02] block"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <div className="text-3xl mb-3">{s.emoji}</div>
                  <h3 className="font-bold text-base mb-1" style={{ color: 'var(--cream)' }}>{s.title}</h3>
                  <p className="text-xs mb-3" style={{ color: 'var(--cream-muted)' }}>{s.desc}</p>
                  <span className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ backgroundColor: `${s.color}22`, color: s.color }}>
                    {s.badge}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* 실시간 인기 랭킹 */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--gold-dark)' }}>
                🔥 실시간 인기 이야기
              </h2>
              <span className="text-xs" style={{ color: 'var(--cream-muted)' }}>오늘 기준</span>
            </div>
            <div className="space-y-2">
              {rankingData.map((item) => (
                <Link
                  key={item.rank}
                  href="/story"
                  className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:opacity-80"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <span
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-black flex-shrink-0"
                    style={{
                      backgroundColor: item.rank <= 3 ? 'rgba(212,168,67,0.2)' : 'var(--surface-2)',
                      color: item.rank <= 3 ? 'var(--gold)' : 'var(--cream-muted)',
                    }}
                  >
                    {item.rank}
                  </span>
                  <span className="text-lg">{item.emoji}</span>
                  <span className="flex-1 text-sm font-medium" style={{ color: 'var(--cream)' }}>{item.title}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.hot && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(192,57,43,0.2)', color: '#e57565' }}>HOT</span>
                    )}
                    <span className="text-xs" style={{ color: 'var(--cream-muted)' }}>{item.views}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
