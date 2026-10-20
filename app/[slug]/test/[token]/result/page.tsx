import { notFound, redirect } from 'next/navigation';
import { findAttemptByToken, isPastDeadline, submitAttempt } from '@/lib/level-test/attempt';
import { unitRates, weakUnits } from '@/lib/level-test/grading';

export const metadata = { title: '레벨테스트 결과', robots: { index: false, follow: false } };

type Props = { params: Promise<{ slug: string; token: string }> };

const font = "'IBM Plex Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif";

export default async function TestResultPage({ params }: Props) {
  const { slug, token } = await params;
  let attempt = await findAttemptByToken(slug, token);
  if (!attempt) notFound();

  if (attempt.status === 'in_progress' && isPastDeadline(attempt.startedAt, attempt.test.timeLimitMin, new Date())) {
    await submitAttempt(attempt.id);
    attempt = await findAttemptByToken(slug, token);
    if (!attempt) notFound();
  }
  if (attempt.status !== 'submitted') redirect(`/${slug}/test/${token}`);

  // 제출 당시 저장된 정오를 기준으로 한다 (문항 정답이 나중에 바뀌어도 결과지는 그대로)
  const correctById = new Map(attempt.responses.map((r) => [r.questionId, !!r.correct]));
  const units = unitRates(attempt.test.items.map((i) => ({ unit: i.question.unit?.trim() || null, correct: !!correctById.get(i.questionId) })));
  const weak = weakUnits(units);
  const score = attempt.score ?? 0;
  const max = attempt.maxScore ?? 0;
  const pct = max ? Math.round((score / max) * 100) : 0;
  const t = attempt.tenant;

  return (
    <div style={{ minHeight: '100vh', background: '#F6F5F2', color: '#1B2430', fontFamily: font }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px 48px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 14, color: '#5A6270', fontWeight: 600 }}>{t.name} · 레벨테스트 결과</div>
          <h1 style={{ margin: '4px 0 0', fontSize: 24 }}>{attempt.test.title}</h1>
        </div>

        <section style={{ background: '#1B2430', color: '#FFFFFF', borderRadius: 16, padding: 24, display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 44, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{score}</span>
          <span style={{ fontSize: 18, color: '#C8CDD5' }}>/ {max}점</span>
          <span style={{ marginLeft: 'auto', fontSize: 20, fontWeight: 700, color: '#F2C94C' }}>{pct}%</span>
        </section>

        <section style={{ background: '#FFFFFF', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 17 }}>단원별 정답률</h2>
          {units.map((u) => (
            <div key={u.unit} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span>{u.unit}</span>
                <span style={{ color: '#5A6270' }}>{u.correct}/{u.total} ({Math.round(u.rate * 100)}%)</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: '#EEEAE2', overflow: 'hidden' }}>
                <div style={{ width: `${Math.round(u.rate * 100)}%`, height: '100%', background: u.rate >= 0.7 ? '#1E5645' : u.rate >= 0.4 ? '#B7791F' : '#B42318' }} />
              </div>
            </div>
          ))}
          {weak.length > 0 && (
            <div style={{ marginTop: 4, padding: '12px 14px', borderRadius: 10, background: '#FFF7E6', fontSize: 14, lineHeight: 1.7 }}>
              <b>보완이 필요한 단원</b>: {weak.map((w) => w.unit).join(', ')}
            </div>
          )}
        </section>

        <section style={{ background: '#FFFFFF', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 17 }}>문항별 결과</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))', gap: 8 }}>
            {attempt.test.items.map((i, idx) => {
              const ok = correctById.get(i.questionId);
              return (
                <div key={i.questionId} aria-label={`${idx + 1}번 ${ok ? '정답' : '오답'}`} style={{ height: 52, borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: ok ? '#E4EEE9' : '#FDECEA', color: ok ? '#1E5645' : '#B42318', fontWeight: 700 }}>
                  <span style={{ fontSize: 12, color: '#5A6270', fontWeight: 500 }}>{idx + 1}</span>
                  <span aria-hidden="true">{ok ? 'O' : 'X'}</span>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 13, color: '#5A6270' }}>정답과 풀이, 맞는 반 추천은 상담 때 자세히 안내해 드립니다.</div>
        </section>

        <section style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {t.phone && (
            <a href={`tel:${t.phone}`} style={{ flex: 1, minWidth: 140, height: 52, borderRadius: 12, background: '#1E5645', color: '#FFFFFF', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>학원에 전화하기</a>
          )}
          {t.kakaoChannelUrl && (
            <a href={t.kakaoChannelUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 140, height: 52, borderRadius: 12, background: '#FEE500', color: '#1B2430', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>카카오톡 상담</a>
          )}
          <a href={`/${slug}`} style={{ flex: 1, minWidth: 140, height: 52, borderRadius: 12, border: '1px solid #D5D0C6', background: '#FFFFFF', color: '#1B2430', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>학원 홈페이지</a>
        </section>
      </div>
    </div>
  );
}
