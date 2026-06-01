import Navigation from '@/components/Navigation';
import QuizEngine from '@/components/QuizEngine';

export default function ExamPage() {
  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>
      <Navigation />

      <main className="pt-20 pb-24 md:pb-8 max-w-2xl mx-auto px-4">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--gold-dark)' }}>
            🏆 퀴즈 도전
          </div>
          <h1 className="text-2xl md:text-3xl font-black mb-3" style={{ color: 'var(--cream)', fontFamily: 'Georgia, serif' }}>
            듀얼 테스트 엔진
          </h1>
          <p className="text-sm" style={{ color: 'var(--cream-muted)' }}>
            수험생이라면 세능검 기출, 교양 탐방이라면 조선직업 테스트
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { label: '오늘 응시자', value: '483명' },
              { label: '평균 점수', value: '3.2 / 5' },
              { label: '합격률', value: '64%' },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="text-lg font-black" style={{ color: 'var(--gold)' }}>{s.value}</p>
                <p className="text-[11px]" style={{ color: 'var(--cream-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <QuizEngine />
      </main>
    </div>
  );
}
