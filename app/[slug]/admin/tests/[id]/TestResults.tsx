import { prisma } from '@/lib/prisma';
import { isPastDeadline, submitAttempt } from '@/lib/level-test/attempt';
import { unitRates } from '@/lib/level-test/grading';
import { FLAG_LABEL, itemStats, MIN_N_FOR_DISCRIMINATION } from '@/lib/level-test/stats';
import { formatKstDateTime } from '@/lib/format-date';
import { MathText } from '@/components/level-test/MathText';

const card: React.CSSProperties = { background: '#FFFFFF', borderRadius: 12, padding: 20 };
const th: React.CSSProperties = { padding: '10px 12px', fontWeight: 600, textAlign: 'left', color: '#5A6270', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '10px 12px', borderTop: '1px solid #EEEAE2', verticalAlign: 'top' };

function maskName(name: string) {
  return name ? `${name[0]}${'○'.repeat(Math.max(1, name.length - 1))}` : '';
}

function pct(n: number | null) {
  return n === null ? '–' : `${Math.round(n * 100)}%`;
}

export async function TestResults({ tenantId, testId, slug }: { tenantId: string; testId: string; slug: string }) {
  // 시간이 지났는데 제출 안 된 응시는 저장된 답으로 마감한다
  const open = await prisma.testAttempt.findMany({
    where: { tenantId, testId, status: 'in_progress' },
    select: { id: true, startedAt: true, test: { select: { timeLimitMin: true } } },
  });
  const now = new Date();
  for (const a of open) {
    if (isPastDeadline(a.startedAt, a.test.timeLimitMin, now)) await submitAttempt(a.id, now);
  }

  const [test, attempts] = await Promise.all([
    prisma.test.findFirst({
      where: { id: testId, tenantId },
      include: { items: { orderBy: { sortOrder: 'asc' }, include: { question: true } } },
    }),
    prisma.testAttempt.findMany({
      where: { tenantId, testId },
      orderBy: { createdAt: 'desc' },
      include: { responses: true, lead: { select: { parentName: true, studentGrade: true } } },
    }),
  ]);
  if (!test) return null;

  // 통계는 채점이 끝난 응시만 (서술형 채점 대기는 점수가 확정되지 않음)
  const done = attempts.filter((a) => a.status === 'submitted' && a.maxScore && !a.needsGrading);
  const awaiting = attempts.filter((a) => a.status === 'submitted' && a.needsGrading).length;
  if (attempts.length === 0) {
    return <div style={{ ...card, textAlign: 'center', color: '#9AA3AF', padding: 40 }}>아직 발급한 응시 링크가 없습니다. 상담 관리에서 상담을 열고 &ldquo;응시 링크 만들기&rdquo;를 눌러 주세요.</div>;
  }

  const rates = done.map((a) => (a.score ?? 0) / (a.maxScore ?? 1));
  const avg = rates.length ? rates.reduce((s, r) => s + r, 0) / rates.length : null;
  const buckets = [0, 0, 0, 0, 0];
  for (const r of rates) buckets[Math.min(4, Math.floor(r * 5))]++;
  const maxBucket = Math.max(1, ...buckets);

  const statsInput = done.map((a) => ({ score: a.score ?? 0, responses: a.responses.map((r) => ({ questionId: r.questionId, answer: r.answer, correct: r.correct })) }));
  const stats = itemStats(test.items.map((i) => ({ id: i.questionId, difficulty: i.question.difficulty })), statsInput);
  const units = unitRates(
    done.flatMap((a) => test.items.map((i) => ({ unit: i.question.unit?.trim() || null, correct: !!a.responses.find((r) => r.questionId === i.questionId)?.correct }))),
  ).sort((a, b) => a.rate - b.rate);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        {[
          ['응시 링크', `${attempts.length}건`],
          ['제출', awaiting ? `${done.length + awaiting}건 (채점 대기 ${awaiting})` : `${done.length}건`],
          ['평균', avg === null ? '–' : `${Math.round(avg * 100)}%`],
          ['최고 / 최저', rates.length ? `${Math.round(Math.max(...rates) * 100)}% / ${Math.round(Math.min(...rates) * 100)}%` : '–'],
        ].map(([k, v]) => (
          <div key={k} style={{ ...card, padding: 16 }}>
            <div style={{ fontSize: 13, color: '#5A6270' }}>{k}</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{v}</div>
          </div>
        ))}
      </div>

      {done.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
          <section style={card}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>점수 분포</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 120 }}>
              {buckets.map((n, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 12 }}>{n}</span>
                  <div style={{ width: '100%', height: `${(n / maxBucket) * 80}px`, minHeight: n ? 4 : 0, background: '#5E9480', borderRadius: 4 }} />
                  <span style={{ fontSize: 11, color: '#5A6270' }}>{i * 20}~{i === 4 ? 100 : i * 20 + 19}</span>
                </div>
              ))}
            </div>
          </section>
          <section style={card}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>단원별 정답률 (낮은 순)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {units.map((u) => (
                <div key={u.unit} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span style={{ width: 96, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.unit}</span>
                  <div style={{ flex: 1, height: 8, background: '#EEEAE2', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${u.rate * 100}%`, height: '100%', background: u.rate >= 0.7 ? '#1E5645' : u.rate >= 0.4 ? '#B7791F' : '#B42318' }} />
                  </div>
                  <span style={{ width: 40, textAlign: 'right' }}>{pct(u.rate)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      <section style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 8px', fontWeight: 700 }}>응시자</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead><tr>{['학부모·학년', '상태', '제출', '점수', ''].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {attempts.map((a) => (
              <tr key={a.id}>
                <td style={td}>{a.lead ? `${maskName(a.lead.parentName)} · ${a.lead.studentGrade ?? '학년 미기재'}` : '–'}</td>
                <td style={td}>{a.status === 'submitted' ? (a.needsGrading ? <a href={`/${slug}/admin/grading/${a.id}`} style={{ color: '#7A4B00', fontWeight: 600 }}>채점 대기 →</a> : '제출 완료') : a.status === 'in_progress' ? '응시 중' : '응시 전'}</td>
                <td style={td}>{a.submittedAt ? formatKstDateTime(a.submittedAt) : '–'}</td>
                <td style={td}>{a.maxScore && !a.needsGrading ? `${a.score}/${a.maxScore} (${Math.round(((a.score ?? 0) / a.maxScore) * 100)}%)` : a.needsGrading ? `자동 채점 ${a.score}점` : '–'}</td>
                <td style={td}>{a.status === 'submitted' && <a href={`/${slug}/test/${a.token}/result`} target="_blank" rel="noopener noreferrer" style={{ color: '#1E5645' }}>결과지</a>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 4px', fontWeight: 700 }}>문항 통계</div>
        <div style={{ padding: '0 20px 8px', fontSize: 12, color: '#5A6270' }}>
          변별도는 상위 27% 정답률 − 하위 27% 정답률입니다 (제출 {MIN_N_FOR_DISCRIMINATION}건부터 계산). 0.3 이상이면 실력을 잘 가르는 문항입니다.
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead><tr>{['#', '문항', '단원·난이도', '정답률', '많이 고른 오답', '변별도', '확인 필요'].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {test.items.map((it, idx) => {
              const s = stats.find((x) => x.questionId === it.questionId)!;
              const correctKey = it.question.type === 'choice' ? it.question.answers[0] : null;
              // 객관식에서 가장 많이 고른 오답 보기 (매력적 오답)
              const topWrong = correctKey
                ? Object.entries(s.choiceCounts).filter(([k]) => k !== correctKey).sort((a, b) => b[1] - a[1])[0]
                : null;
              return (
                <tr key={it.questionId}>
                  <td style={td}>{idx + 1}</td>
                  <td style={{ ...td, minWidth: 220, maxWidth: 360, whiteSpace: 'normal' }}>
                    <MathText text={it.question.body.length > 80 ? `${it.question.body.slice(0, 80)}…` : it.question.body} style={{ fontSize: 13, lineHeight: 1.5 }} />
                  </td>
                  <td style={td}>{[it.question.unit, `난이도 ${it.question.difficulty}`].filter(Boolean).join(' · ')}</td>
                  <td style={td}>{pct(s.correctRate)}</td>
                  <td style={td}>{topWrong && s.n ? `${topWrong[0]}번 (${Math.round((topWrong[1] / s.n) * 100)}%)` : '–'}</td>
                  <td style={td}>{s.discrimination === null ? '–' : s.discrimination.toFixed(2)}</td>
                  <td style={{ ...td, color: '#8A3A1C', whiteSpace: 'normal', minWidth: 160 }}>{s.flags.map((f) => FLAG_LABEL[f]).join(', ')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
