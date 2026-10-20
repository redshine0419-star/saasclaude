import { notFound, redirect } from 'next/navigation';
import { findAttemptByToken, isPastDeadline, submitAttempt } from '@/lib/level-test/attempt';
import { ERROR_TYPES, unitRates, weakUnits, type ErrorType } from '@/lib/level-test/grading';
import { parseMarks } from '@/lib/level-test/marks';
import { MarkedPhoto } from '@/components/level-test/MarkedPhoto';
import { MathText } from '@/components/level-test/MathText';

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

  // 제출·채점 당시 저장된 정오를 기준으로 한다 (문항 정답이 나중에 바뀌어도 결과지는 그대로)
  const pending = attempt.needsGrading;
  const byQ = new Map(attempt.responses.map((r) => [r.questionId, r]));
  // 서술형은 선생님 채점 전에는 정오를 모른다(null)
  const correctOf = (qid: string, isEssay: boolean) => {
    const r = byQ.get(qid);
    if (isEssay && (pending || r?.points == null)) return null;
    return !!r?.correct;
  };
  const units = unitRates(attempt.test.items.map((i) => ({ unit: i.question.unit?.trim() || null, correct: correctOf(i.questionId, i.question.type === 'essay') })));
  const essays = attempt.test.items.map((i, idx) => ({ i, idx })).filter(({ i }) => i.question.type === 'essay');
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

        {pending ? (
          <section style={{ background: '#1B2430', color: '#FFFFFF', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 20, fontWeight: 700 }}>서술형 문항을 선생님이 채점하고 있습니다</span>
            <span style={{ fontSize: 15, color: '#C8CDD5' }}>객관식·단답형 {score}점까지 채점됐습니다. 채점이 끝나면 이 페이지에서 최종 점수와 첨삭을 볼 수 있어요.</span>
          </section>
        ) : (
          <section style={{ background: '#1B2430', color: '#FFFFFF', borderRadius: 16, padding: 24, display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 44, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{score}</span>
            <span style={{ fontSize: 18, color: '#C8CDD5' }}>/ {max}점</span>
            <span style={{ marginLeft: 'auto', fontSize: 20, fontWeight: 700, color: '#F2C94C' }}>{pct}%</span>
          </section>
        )}

        {!pending && essays.length > 0 && (
          <section style={{ background: '#FFFFFF', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ margin: 0, fontSize: 17 }}>서술형 첨삭</h2>
            {essays.map(({ i, idx }) => {
              const r = byQ.get(i.questionId);
              return (
                <div key={i.questionId} style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12, borderTop: '1px solid #EEEAE2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontWeight: 700 }}>
                    <span>{idx + 1}번</span>
                    <span>{r?.points ?? 0} / {i.points}점</span>
                  </div>
                  <MathText text={i.question.body} style={{ fontSize: 14, lineHeight: 1.7, color: '#3E4652' }} />
                  {r?.errorType && r.errorType in ERROR_TYPES && (
                    <span style={{ alignSelf: 'flex-start', fontSize: 12, padding: '3px 8px', borderRadius: 999, background: '#FBF1CF' }}>{ERROR_TYPES[r.errorType as ErrorType]}</span>
                  )}
                  {r?.feedback && (
                    <div style={{ padding: '10px 12px', borderRadius: 10, background: '#E4EEE9', fontSize: 15, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      <b style={{ color: '#1E5645' }}>선생님 첨삭</b>
                      <div>{r.feedback}</div>
                    </div>
                  )}
                  {r?.photos.length ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                      {r.photos.map((src, pi) => (
                        <MarkedPhoto key={src} src={src} strokes={parseMarks(r.marks[pi])} alt={`${idx + 1}번 풀이 사진 ${pi + 1}`} style={{ width: '100%' }} />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </section>
        )}

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
              const ok = correctOf(i.questionId, i.question.type === 'essay');
              const essayPartial = i.question.type === 'essay' && ok === false && (byQ.get(i.questionId)?.points ?? 0) > 0;
              const [bg, fg, mark, word] = ok === null
                ? ['#EEEAE2', '#5A6270', '…', '채점 중']
                : ok ? ['#E4EEE9', '#1E5645', 'O', '정답'] : essayPartial ? ['#FBF1CF', '#7A4B00', '△', '부분 점수'] : ['#FDECEA', '#B42318', 'X', '오답'];
              return (
                <div key={i.questionId} aria-label={`${idx + 1}번 ${word}`} style={{ height: 52, borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: bg, color: fg, fontWeight: 700 }}>
                  <span style={{ fontSize: 12, color: '#5A6270', fontWeight: 500 }}>{idx + 1}</span>
                  <span aria-hidden="true">{mark}</span>
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
