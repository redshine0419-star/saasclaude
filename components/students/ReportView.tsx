'use client';

import { useMemo } from 'react';
import type { ReportSnapshot } from '@/lib/students/report';
import { ATTENDANCE_LABEL, SCORE_KIND_LABEL } from '@/lib/students/labels';
import { ScoreChart, subjectColors } from './ScoreChart';

const font = "'IBM Plex Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif";
const card: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 };
const ATT_COLOR = { present: '#1E5645', late: '#B7791F', absent: '#B42318', excused: '#9AA3AF' } as const;
const dot = (d: string) => d.replace(/-/g, '.');

/** 학부모 공유 리포트 화면 — 관리자 미리보기와 공개 링크가 같은 컴포넌트를 쓴다 */
export function ReportView({ snapshot: r, preview = false }: { snapshot: ReportSnapshot; preview?: boolean }) {
  const scores = useMemo(() => r.scores ?? [], [r.scores]);
  const colors = useMemo(() => subjectColors(scores.map((s) => s.subject)), [scores]);
  const chartScores = scores.map((s, i) => ({ id: String(i), examDate: s.examDate, label: s.label, subject: s.subject, score: s.score, maxScore: s.maxScore }));
  const pct = (s: { score: number; maxScore: number }) => Math.round((s.score / s.maxScore) * 100);

  return (
    <div style={{ minHeight: preview ? undefined : '100vh', background: '#F6F5F2', color: '#1B2430', fontFamily: font }}>
      <style>{`@media print { .rp-noprint { display: none !important; } body { background: #FFFFFF; } .rp-wrap { padding: 0 !important; } }`}</style>
      <div className="rp-wrap" style={{ maxWidth: 680, margin: '0 auto', padding: preview ? 0 : '32px 16px 48px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 14, color: '#5A6270', fontWeight: 600 }}>{r.academy.name} · 학습 리포트</div>
          <h1 style={{ margin: '4px 0 0', fontSize: 24 }}>{r.student.name} 학생</h1>
          <div style={{ fontSize: 14, color: '#5A6270', marginTop: 4 }}>
            {[r.student.grade, r.student.className].filter(Boolean).join(' · ')}{r.student.grade || r.student.className ? ' · ' : ''}{dot(r.period.start)} ~ {dot(r.period.end)}
          </div>
        </div>

        <section style={{ ...card, background: '#1B2430', color: '#FFFFFF' }}>
          <h2 style={{ margin: 0, fontSize: 16, color: '#F2C94C' }}>선생님 코멘트</h2>
          <div style={{ fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{r.comment}</div>
        </section>

        {r.attendance && (
          <section style={card}>
            <h2 style={{ margin: 0, fontSize: 17 }}>출결</h2>
            {r.attendance.total === 0 ? (
              <div style={{ fontSize: 14, color: '#9AA3AF' }}>이 기간의 출결 기록이 없습니다.</div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 32, fontWeight: 800 }}>{r.attendance.rate}%</span>
                  <span style={{ fontSize: 14, color: '#5A6270' }}>출석률 (지각 포함, 수업 {r.attendance.total}회)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                  {(Object.keys(ATTENDANCE_LABEL) as (keyof typeof ATTENDANCE_LABEL)[]).map((k) => (
                    <div key={k} style={{ padding: '10px 8px', borderRadius: 10, background: '#F4F2EE', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#3E4652', whiteSpace: 'nowrap' }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: ATT_COLOR[k] }} />{ATTENDANCE_LABEL[k]}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{r.attendance!.counts[k]}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {r.scores && (
          <section style={card}>
            <h2 style={{ margin: 0, fontSize: 17 }}>성적</h2>
            {scores.length === 0 ? (
              <div style={{ fontSize: 14, color: '#9AA3AF' }}>이 기간의 성적 기록이 없습니다.</div>
            ) : (
              <>
                {scores.length > 1 && <ScoreChart scores={chartScores} colors={colors} />}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ color: '#5A6270', textAlign: 'left' }}>
                        {['날짜', '시험', '과목', '점수'].map((h) => <th key={h} style={{ padding: '8px 6px', fontWeight: 600, borderBottom: '1px solid #EEEAE2' }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {[...scores].reverse().map((s, i) => (
                        <tr key={i}>
                          <td style={{ padding: '8px 6px', borderBottom: '1px solid #F4F2EE', whiteSpace: 'nowrap' }}>{dot(s.examDate.slice(2))}</td>
                          <td style={{ padding: '8px 6px', borderBottom: '1px solid #F4F2EE' }}>{s.label}<div style={{ fontSize: 12, color: '#5A6270' }}>{SCORE_KIND_LABEL[s.kind]}</div></td>
                          <td style={{ padding: '8px 6px', borderBottom: '1px solid #F4F2EE', whiteSpace: 'nowrap' }}>
                            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: colors.get(s.subject), marginRight: 6 }} />{s.subject}
                          </td>
                          <td style={{ padding: '8px 6px', borderBottom: '1px solid #F4F2EE', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                            {s.score}/{s.maxScore}
                            <div style={{ fontSize: 12, color: '#5A6270' }}>{pct(s)}%{s.rankGrade ? ` · ${s.rankGrade}등급` : ''}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        )}

        <section className="rp-noprint" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {r.academy.phone && (
            <a href={`tel:${r.academy.phone}`} style={{ flex: 1, minWidth: 140, height: 52, borderRadius: 12, background: '#1E5645', color: '#FFFFFF', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>학원에 전화하기</a>
          )}
          {r.academy.kakaoChannelUrl && (
            <a href={r.academy.kakaoChannelUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 140, height: 52, borderRadius: 12, background: '#FEE500', color: '#1B2430', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>카카오톡 상담</a>
          )}
          {!preview && (
            <button type="button" onClick={() => window.print()} style={{ flex: 1, minWidth: 140, height: 52, borderRadius: 12, border: '1px solid #D5D0C6', background: '#FFFFFF', color: '#1B2430', font: 'inherit', fontWeight: 600, cursor: 'pointer' }}>인쇄·PDF 저장</button>
          )}
        </section>
        <div style={{ fontSize: 12, color: '#9AA3AF', lineHeight: 1.6 }}>이 리포트는 {r.academy.name}에서 보호자께만 보내 드린 링크입니다. 다른 사람에게 전달하지 말아 주세요.</div>
      </div>
    </div>
  );
}
