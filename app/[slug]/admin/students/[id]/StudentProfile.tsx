'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { AttendanceStatus, ScoreKind, StudentNoteKind, StudentStatus } from '@prisma/client';
import { ATTENDANCE_LABEL, CONSENT_METHOD_LABEL, NOTE_KIND_LABEL, SCORE_KIND_LABEL, STATUS_LABEL, TRAIT_SUGGESTIONS, findHealthWords, type ConsentMethod } from '@/lib/students/labels';
import { formatKstDate, formatKstDateTime } from '@/lib/format-date';
import { ScoreChart, subjectColors } from '@/components/students/ScoreChart';
import { ReportPanel, type ReportRow } from './ReportPanel';

type Note = { id: string; createdAt: string; kind: StudentNoteKind; body: string; authorEmail: string; authorName: string | null };
type Score = { id: string; kind: ScoreKind; examDate: string; label: string; subject: string; score: number; maxScore: number; rankGrade: number | null; percentile: number | null; memo: string | null; createdBy: string | null };
type StudentData = {
  id: string; name: string; grade: string; school: string; classId: string; className: string | null; classSchedule: string | null;
  status: StudentStatus; enrolledAt: string; consentAt: string | null; consentMethod: string | null; parentName: string; parentPhone: string; studentPhone: string;
  traits: string[]; summary: string; notes: Note[]; scores: Score[];
  attendances: { date: string; status: AttendanceStatus; note: string | null }[];
  lead: {
    createdAt: string; message: string | null;
    events: { id: string; type: string; createdAt: string; note: string | null }[];
    attempts: { id: string; title: string; score: number | null; maxScore: number | null; needsGrading: boolean; submittedAt: string | null; resultUrl: string }[];
  } | null;
};

type Props = { slug: string; student: StudentData; classes: { id: string; name: string }[]; me: string; isOwner: boolean; today: string; reports: ReportRow[] };

const card: React.CSSProperties = { background: '#FFFFFF', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 };
const h2: React.CSSProperties = { margin: 0, fontSize: 16, fontWeight: 700 };
const INPUT: React.CSSProperties = { width: '100%', boxSizing: 'border-box', minWidth: 0, height: 40, padding: '0 10px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14, background: '#FFFFFF' };
const BTN: React.CSSProperties = { height: 38, padding: '0 14px', border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' };
const BTN_GHOST: React.CSSProperties = { ...BTN, background: '#FFFFFF', color: '#1B2430', border: '1px solid #D5D0C6', fontWeight: 500 };
const STATUS_STYLE: Record<StudentStatus, { background: string; color: string }> = {
  active: { background: '#E4EEE9', color: '#1E5645' },
  paused: { background: '#FBF1CF', color: '#7A4B00' },
  left: { background: '#EEEAE2', color: '#5A6270' },
};
// 출결 상태색 — 항상 글자(라벨·개수)와 함께 쓴다
const ATT_COLOR: Record<AttendanceStatus, string> = { present: '#1E5645', late: '#B7791F', absent: '#B42318', excused: '#9AA3AF' };
const EVENT_LABEL: Record<string, string> = { created: '홈페이지 상담 신청', status_changed: '상태 변경', note: '원장 메모', message_sent: '알림톡 발송', sms_manual: '문자 보내기', call: '원장 통화' };

const pctOf = (s: { score: number; maxScore: number }) => Math.round((s.score / s.maxScore) * 100);

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data } as { ok: boolean; data: { error?: string; [k: string]: unknown } };
}

export function StudentProfile({ slug, student: s, classes, me, isOwner, today, reports }: Props) {
  const router = useRouter();
  const api = `/api/${slug}/admin/students/${s.id}`;
  const [error, setError] = useState('');

  // ── 기본 정보 ──
  const [editing, setEditing] = useState(false);
  const [info, setInfo] = useState({ name: s.name, grade: s.grade, school: s.school, classId: s.classId, enrolledAt: s.enrolledAt, parentName: s.parentName, parentPhone: s.parentPhone, studentPhone: s.studentPhone });
  const [busy, setBusy] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError('');
    const r = await send(api, 'PATCH', body);
    setBusy(false);
    if (!r.ok) {
      setError(r.data.error ?? '저장하지 못했습니다.');
      return false;
    }
    router.refresh();
    return true;
  }

  async function withdraw() {
    if (!confirm(`${s.name} 학생을 퇴원 처리할까요?\n\n퇴원하면 학생부(기본 정보·성격·메모·성적·출결)가 즉시 영구 삭제되고 되돌릴 수 없습니다. 필요한 자료는 설정 → 데이터 내보내기로 먼저 받아 두세요.`)) return;
    const r = await send(api, 'DELETE');
    if (r.ok) router.push(`/${slug}/admin/students?withdrawn=1`);
    else setError(r.data.error ?? '퇴원 처리하지 못했습니다.');
  }

  const [consent, setConsent] = useState<{ method: ConsentMethod; at: string }>({ method: 'written', at: today });

  // ── 성격·특성 ──
  const [traits, setTraits] = useState<string[]>(s.traits);
  const [traitInput, setTraitInput] = useState('');
  const [summary, setSummary] = useState(s.summary);
  const traitsDirty = traits.join('|') !== s.traits.join('|') || summary !== s.summary;
  const addTrait = (t: string) => {
    const v = t.trim().slice(0, 20);
    if (v && !traits.includes(v) && traits.length < 12) setTraits([...traits, v]);
    setTraitInput('');
  };

  // ── 성적 ──
  const [kindFilter, setKindFilter] = useState<ScoreKind | 'all'>('all');
  const [showScoreForm, setShowScoreForm] = useState(false);
  const [sf, setSf] = useState({ kind: 'school' as ScoreKind, examDate: today, label: '', subject: '', score: '', maxScore: '100', rankGrade: '', percentile: '', memo: '' });
  const colors = useMemo(() => subjectColors(s.scores.map((x) => x.subject)), [s.scores]);
  const shownScores = s.scores.filter((x) => kindFilter === 'all' || x.kind === kindFilter);
  const subjectsKnown = [...new Set(s.scores.map((x) => x.subject))];

  async function addScore(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const r = await send(`${api}/scores`, 'POST', sf);
    setBusy(false);
    if (!r.ok) return setError(r.data.error ?? '저장하지 못했습니다.');
    setSf((p) => ({ ...p, score: '', rankGrade: '', percentile: '', memo: '' }));
    router.refresh();
  }
  async function deleteScore(id: string) {
    if (!confirm('이 성적을 삭제할까요?')) return;
    const r = await send(`${api}/scores/${id}`, 'DELETE');
    if (!r.ok) return setError(r.data.error ?? '삭제하지 못했습니다.');
    router.refresh();
  }

  // ── 메모 ──
  const [noteKind, setNoteKind] = useState<StudentNoteKind>('attitude');
  const [noteBody, setNoteBody] = useState('');
  const [noteFilter, setNoteFilter] = useState<StudentNoteKind | 'all'>('all');
  async function addNote() {
    if (!noteBody.trim()) return;
    setBusy(true);
    setError('');
    const r = await send(`${api}/notes`, 'POST', { kind: noteKind, body: noteBody });
    setBusy(false);
    if (!r.ok) return setError(r.data.error ?? '저장하지 못했습니다.');
    setNoteBody('');
    router.refresh();
  }
  async function deleteNote(id: string) {
    if (!confirm('이 메모를 삭제할까요?')) return;
    const r = await send(`${api}/notes/${id}`, 'DELETE');
    if (!r.ok) return setError(r.data.error ?? '삭제하지 못했습니다.');
    router.refresh();
  }
  const shownNotes = s.notes.filter((n) => noteFilter === 'all' || n.kind === noteFilter);

  // ── 요약 수치 ──
  const recent = [...s.scores].sort((a, b) => b.examDate.localeCompare(a.examDate)).slice(0, 3);
  const recentAvg = recent.length ? Math.round(recent.reduce((t, x) => t + pctOf(x), 0) / recent.length) : null;
  const since30 = new Date(Date.parse(`${today}T00:00:00Z`) - 29 * 86400000).toISOString().slice(0, 10);
  const att30 = s.attendances.filter((a) => a.date >= since30);
  const attCount = (st: AttendanceStatus) => att30.filter((a) => a.status === st).length;
  const attRate = att30.length ? Math.round(((attCount('present') + attCount('late')) / att30.length) * 100) : null;
  const lastTest = s.lead?.attempts[0];

  const tiles: [string, string, string?][] = [
    ['최근 성적 평균', recentAvg === null ? '–' : `${recentAvg}%`, recent.length ? `최근 ${recent.length}건` : '기록 없음'],
    ['최근 30일 출석률', attRate === null ? '–' : `${attRate}%`, att30.length ? `결석 ${attCount('absent')} · 지각 ${attCount('late')}` : '기록 없음'],
    ['관찰 메모', `${s.notes.length}건`, s.notes[0] ? `최근 ${formatKstDate(s.notes[0].createdAt)}` : '기록 없음'],
    ['입학 레벨테스트', lastTest && lastTest.maxScore && !lastTest.needsGrading ? `${Math.round(((lastTest.score ?? 0) / lastTest.maxScore) * 100)}%` : lastTest?.needsGrading ? '채점 중' : '–', lastTest?.title ?? '응시 기록 없음'],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Link href={`/${slug}/admin/students`} style={{ fontSize: 14, color: '#5A6270', textDecoration: 'none' }}>← 학생부</Link>

      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>{s.name}</h1>
            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 13, fontWeight: 600, ...STATUS_STYLE[s.status] }}>{STATUS_LABEL[s.status]}</span>
          </div>
          <div style={{ fontSize: 14, color: '#5A6270', marginTop: 6 }}>
            {[s.grade, s.school, s.className && `${s.className}${s.classSchedule ? ` (${s.classSchedule})` : ''}`].filter(Boolean).join(' · ') || '학년·반 미기재'}
            {' · '}등록 {s.enrolledAt.replace(/-/g, '.')}
            {s.consentAt && ` · 학부모 동의 ${s.consentAt.replace(/-/g, '.')}${s.consentMethod && s.consentMethod in CONSENT_METHOD_LABEL ? ` (${CONSENT_METHOD_LABEL[s.consentMethod as ConsentMethod]})` : ''}`}
          </div>
          {s.traits.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {s.traits.map((t) => <span key={t} style={{ padding: '3px 10px', borderRadius: 999, background: '#EEF2F7', fontSize: 13 }}>{t}</span>)}
            </div>
          )}
          {s.summary && <div style={{ marginTop: 8, fontSize: 14, color: '#3E4652', lineHeight: 1.6, maxWidth: 640 }}>“{s.summary}”</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select
            value={s.status}
            disabled={busy}
            onChange={(e) => patch({ status: e.target.value })}
            aria-label="재원 상태"
            style={{ ...INPUT, width: 'auto', height: 38 }}
          >
            {(['active', 'paused'] as const).map((st) => <option key={st} value={st}>{STATUS_LABEL[st]}</option>)}
          </select>
          <button type="button" onClick={() => setEditing((v) => !v)} style={BTN_GHOST}>{editing ? '수정 닫기' : '정보 수정'}</button>
          {isOwner && <button type="button" onClick={withdraw} style={{ ...BTN_GHOST, color: '#B42318' }}>퇴원 처리</button>}
        </div>
      </div>

      {error && <div role="alert" style={{ padding: '10px 14px', borderRadius: 8, background: '#FDECEA', color: '#B42318', fontSize: 14 }}>{error}</div>}

      {!s.consentAt && (
        <section style={{ ...card, background: '#FFF7E6', gap: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>학부모 동의 기록이 없습니다</div>
          <div style={{ fontSize: 13, color: '#3E4652', lineHeight: 1.6 }}>성적·출결·학습 태도 기록은 학부모(만 14세 미만은 법정대리인)의 개인정보 수집·이용 동의를 받은 뒤 남겨 주세요. 받았다면 아래에 기록하세요.</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={consent.method} onChange={(e) => setConsent((p) => ({ ...p, method: e.target.value as ConsentMethod }))} aria-label="동의 방식" style={{ ...INPUT, width: 'auto', flex: '1 1 180px' }}>
              {(Object.keys(CONSENT_METHOD_LABEL) as ConsentMethod[]).map((k) => <option key={k} value={k}>{CONSENT_METHOD_LABEL[k]}</option>)}
            </select>
            <input type="date" value={consent.at} max={today} onChange={(e) => setConsent((p) => ({ ...p, at: e.target.value }))} aria-label="동의 받은 날" style={{ ...INPUT, width: 'auto', flex: '1 1 150px' }} />
            <button type="button" disabled={busy} onClick={() => { if (confirm('학부모에게 개인정보 수집·이용 동의를 받으셨나요?')) patch({ consentConfirmed: true, consentAt: consent.at, consentMethod: consent.method }); }} style={BTN}>동의 받음으로 기록</button>
          </div>
        </section>
      )}

      {editing && (
        <section style={card}>
          <h2 style={h2}>기본 정보 수정</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            {([['name', '이름'], ['grade', '학년'], ['school', '학교'], ['parentName', '학부모 이름'], ['parentPhone', '학부모 연락처'], ['studentPhone', '학생 연락처']] as const).map(([k, label]) => (
              <label key={k} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: '#5A6270' }}>
                {label}
                <input value={info[k]} onChange={(e) => setInfo((p) => ({ ...p, [k]: e.target.value }))} type={k.endsWith('Phone') ? 'tel' : 'text'} style={INPUT} />
              </label>
            ))}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: '#5A6270' }}>
              반
              <select value={info.classId} onChange={(e) => setInfo((p) => ({ ...p, classId: e.target.value }))} style={INPUT}>
                <option value="">반 미지정</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: '#5A6270' }}>
              등록일
              <input type="date" value={info.enrolledAt} onChange={(e) => setInfo((p) => ({ ...p, enrolledAt: e.target.value }))} style={INPUT} />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setEditing(false)} style={BTN_GHOST}>취소</button>
            <button type="button" disabled={busy} onClick={async () => { if (await patch(info)) setEditing(false); }} style={BTN}>저장</button>
          </div>
        </section>
      )}

      {/* 요약 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        {tiles.map(([k, v, sub]) => (
          <div key={k} style={{ ...card, padding: 16, gap: 2 }}>
            <div style={{ fontSize: 13, color: '#5A6270' }}>{k}</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{v}</div>
            <div style={{ fontSize: 12, color: '#9AA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
          </div>
        ))}
      </div>

      <div className="stu-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 16, alignItems: 'start' }}>
        {/* 왼쪽: 성적 · 메모 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2 style={h2}>성적</h2>
              <button type="button" onClick={() => setShowScoreForm((v) => !v)} style={BTN_GHOST}>{showScoreForm ? '닫기' : '+ 성적 입력'}</button>
            </div>

            {showScoreForm && (
              <form onSubmit={addScore} style={{ padding: 14, borderRadius: 10, background: '#F4F2EE', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(['school', 'mock', 'academy'] as const).map((k) => (
                    <button key={k} type="button" onClick={() => setSf((p) => ({ ...p, kind: k }))} style={{ ...BTN_GHOST, height: 34, background: sf.kind === k ? '#1B2430' : '#FFFFFF', color: sf.kind === k ? '#FFFFFF' : '#1B2430' }}>{SCORE_KIND_LABEL[k]}</button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                  <input value={sf.label} onChange={(e) => setSf((p) => ({ ...p, label: e.target.value }))} placeholder={sf.kind === 'mock' ? '시험 이름 (예: 6월 모의평가)' : sf.kind === 'school' ? '시험 이름 (예: 2학기 중간고사)' : '시험 이름 (예: 10월 단원평가)'} style={INPUT} />
                  <input type="date" value={sf.examDate} onChange={(e) => setSf((p) => ({ ...p, examDate: e.target.value }))} aria-label="시험 날짜" style={INPUT} />
                  <input value={sf.subject} onChange={(e) => setSf((p) => ({ ...p, subject: e.target.value }))} placeholder="과목 (예: 수학)" list="student-subjects" style={INPUT} />
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input inputMode="decimal" value={sf.score} onChange={(e) => setSf((p) => ({ ...p, score: e.target.value }))} placeholder="점수" style={INPUT} />
                    <span style={{ color: '#5A6270' }}>/</span>
                    <input inputMode="decimal" value={sf.maxScore} onChange={(e) => setSf((p) => ({ ...p, maxScore: e.target.value }))} placeholder="만점" aria-label="만점" style={INPUT} />
                  </div>
                  {sf.kind !== 'academy' && <input inputMode="numeric" value={sf.rankGrade} onChange={(e) => setSf((p) => ({ ...p, rankGrade: e.target.value }))} placeholder="등급 1~9 (선택)" style={INPUT} />}
                  {sf.kind === 'mock' && <input inputMode="decimal" value={sf.percentile} onChange={(e) => setSf((p) => ({ ...p, percentile: e.target.value }))} placeholder="백분위 (선택)" style={INPUT} />}
                  <input value={sf.memo} onChange={(e) => setSf((p) => ({ ...p, memo: e.target.value }))} placeholder="메모 (선택, 예: 서술형 감점)" style={INPUT} />
                </div>
                <datalist id="student-subjects">{subjectsKnown.map((x) => <option key={x} value={x} />)}</datalist>
                <button type="submit" disabled={busy} style={{ ...BTN, alignSelf: 'flex-start' }}>성적 저장</button>
              </form>
            )}

            {s.scores.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#9AA3AF', fontSize: 14 }}>아직 성적 기록이 없습니다. 내신·모의고사·학원 테스트 점수를 입력하면 추이 그래프가 그려집니다.</div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(['all', 'school', 'mock', 'academy'] as const).map((k) => {
                    const n = k === 'all' ? s.scores.length : s.scores.filter((x) => x.kind === k).length;
                    return (
                      <button key={k} type="button" onClick={() => setKindFilter(k)} disabled={n === 0} style={{ height: 30, padding: '0 12px', borderRadius: 15, border: '1px solid #D5D0C6', background: kindFilter === k ? '#1B2430' : '#FFFFFF', color: kindFilter === k ? '#FFFFFF' : n === 0 ? '#C8CDD5' : '#3E4652', font: 'inherit', fontSize: 13, cursor: n ? 'pointer' : 'default', minHeight: 0 }}>
                        {k === 'all' ? '전체' : SCORE_KIND_LABEL[k]} {n}
                      </button>
                    );
                  })}
                </div>
                <ScoreChart scores={shownScores} colors={colors} />
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', minWidth: 520, borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ color: '#5A6270', textAlign: 'left' }}>
                      {['날짜', '구분', '시험', '과목', '점수', '등급·백분위', ''].map((h) => <th key={h} style={{ padding: '8px 6px', fontWeight: 600, borderBottom: '1px solid #EEEAE2' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[...shownScores].reverse().map((x) => (
                      <tr key={x.id}>
                        <td style={{ padding: '8px 6px', borderBottom: '1px solid #F4F2EE', whiteSpace: 'nowrap' }}>{x.examDate.slice(2).replace(/-/g, '.')}</td>
                        <td style={{ padding: '8px 6px', borderBottom: '1px solid #F4F2EE' }}>{SCORE_KIND_LABEL[x.kind]}</td>
                        <td style={{ padding: '8px 6px', borderBottom: '1px solid #F4F2EE' }}>{x.label}{x.memo && <div style={{ fontSize: 12, color: '#5A6270' }}>{x.memo}</div>}</td>
                        <td style={{ padding: '8px 6px', borderBottom: '1px solid #F4F2EE' }}>
                          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: colors.get(x.subject), marginRight: 6 }} />{x.subject}
                        </td>
                        <td style={{ padding: '8px 6px', borderBottom: '1px solid #F4F2EE', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{x.score}/{x.maxScore} <span style={{ color: '#5A6270' }}>({pctOf(x)}%)</span></td>
                        <td style={{ padding: '8px 6px', borderBottom: '1px solid #F4F2EE', whiteSpace: 'nowrap' }}>{[x.rankGrade && `${x.rankGrade}등급`, x.percentile != null && `${x.percentile}%ile`].filter(Boolean).join(' · ') || '–'}</td>
                        <td style={{ padding: '8px 6px', borderBottom: '1px solid #F4F2EE', textAlign: 'right' }}>
                          {(isOwner || x.createdBy === me) && <button type="button" onClick={() => deleteScore(x.id)} aria-label="성적 삭제" style={{ border: 'none', background: 'none', color: '#9AA3AF', cursor: 'pointer', font: 'inherit', fontSize: 13, minHeight: 0 }}>삭제</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </>
            )}
          </section>

          <section style={card}>
            <h2 style={h2}>관찰 메모</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(Object.keys(NOTE_KIND_LABEL) as StudentNoteKind[]).map((k) => (
                  <button key={k} type="button" onClick={() => setNoteKind(k)} style={{ height: 32, padding: '0 12px', borderRadius: 16, border: '1px solid #D5D0C6', background: noteKind === k ? '#1E5645' : '#FFFFFF', color: noteKind === k ? '#FFFFFF' : '#3E4652', font: 'inherit', fontSize: 13, cursor: 'pointer', minHeight: 0 }}>{NOTE_KIND_LABEL[k]}</button>
                ))}
              </div>
              <textarea value={noteBody} onChange={(e) => setNoteBody(e.target.value)} maxLength={2000} rows={3} placeholder="오늘 수업에서 본 모습, 상담 내용, 학부모와 나눈 이야기 등 (진단명·병력 등 건강 정보는 적지 마세요)" style={{ ...INPUT, height: 'auto', padding: '10px 12px', resize: 'vertical', lineHeight: 1.6 }} />
              {findHealthWords(noteBody).length > 0 && (
                <div role="note" style={{ padding: '8px 12px', borderRadius: 8, background: '#FFF7E6', fontSize: 13, lineHeight: 1.6 }}>
                  ⚠️ 건강·질병 정보로 보이는 표현이 있습니다({findHealthWords(noteBody).join(', ')}). 건강 정보는 민감정보라 별도 동의 없이 기록하지 않습니다. 관찰한 행동만 적어 주세요.
                </div>
              )}
              <button type="button" onClick={addNote} disabled={busy || !noteBody.trim()} style={{ ...BTN, alignSelf: 'flex-start', opacity: noteBody.trim() ? 1 : 0.6 }}>메모 남기기</button>
            </div>

            {s.notes.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '1px solid #EEEAE2', paddingTop: 12 }}>
                {(['all', ...Object.keys(NOTE_KIND_LABEL)] as (StudentNoteKind | 'all')[]).map((k) => {
                  const n = k === 'all' ? s.notes.length : s.notes.filter((x) => x.kind === k).length;
                  if (k !== 'all' && n === 0) return null;
                  return (
                    <button key={k} type="button" onClick={() => setNoteFilter(k)} style={{ height: 28, padding: '0 10px', borderRadius: 14, border: 'none', background: noteFilter === k ? '#1B2430' : '#F4F2EE', color: noteFilter === k ? '#FFFFFF' : '#3E4652', font: 'inherit', fontSize: 12, cursor: 'pointer', minHeight: 0 }}>
                      {k === 'all' ? '전체' : NOTE_KIND_LABEL[k]} {n}
                    </button>
                  );
                })}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {shownNotes.map((n) => (
                <div key={n.id} style={{ padding: '12px 0', borderBottom: '1px solid #F4F2EE', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, color: '#5A6270' }}>
                    <span><b style={{ color: '#1E5645' }}>{NOTE_KIND_LABEL[n.kind]}</b> · {formatKstDateTime(n.createdAt)} · {n.authorName || n.authorEmail.split('@')[0]}</span>
                    {(isOwner || n.authorEmail === me) && <button type="button" onClick={() => deleteNote(n.id)} style={{ border: 'none', background: 'none', color: '#9AA3AF', cursor: 'pointer', font: 'inherit', fontSize: 12, padding: 0, minHeight: 0 }}>삭제</button>}
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{n.body}</div>
                </div>
              ))}
              {s.notes.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: '#9AA3AF', fontSize: 14 }}>아직 메모가 없습니다.</div>}
            </div>
          </section>
        </div>

        {/* 오른쪽: 학부모 리포트 · 성격 · 연락처 · 출결 · 입학 전 기록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ReportPanel slug={slug} studentId={s.id} studentName={s.name} reports={reports} today={today} hasConsent={!!s.consentAt} parentPhone={s.parentPhone} />
          <section style={card}>
            <h2 style={h2}>성격·특성</h2>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {traits.map((t) => (
                <button key={t} type="button" onClick={() => setTraits(traits.filter((x) => x !== t))} aria-label={`${t} 태그 빼기`} style={{ height: 30, padding: '0 10px', borderRadius: 15, border: 'none', background: '#1B2430', color: '#FFFFFF', font: 'inherit', fontSize: 13, cursor: 'pointer', minHeight: 0 }}>{t} ×</button>
              ))}
              {traits.length === 0 && <span style={{ fontSize: 13, color: '#9AA3AF' }}>아래에서 고르거나 직접 입력하세요.</span>}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={traitInput} onChange={(e) => setTraitInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTrait(traitInput); } }} placeholder="직접 입력" maxLength={20} style={{ ...INPUT, flex: 1 }} />
              <button type="button" onClick={() => addTrait(traitInput)} style={BTN_GHOST}>추가</button>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {TRAIT_SUGGESTIONS.filter((t) => !traits.includes(t)).map((t) => (
                <button key={t} type="button" onClick={() => addTrait(t)} style={{ height: 26, padding: '0 8px', borderRadius: 13, border: '1px dashed #B7B0A2', background: '#FFFFFF', color: '#5A6270', font: 'inherit', fontSize: 12, cursor: 'pointer', minHeight: 0 }}>+ {t}</button>
              ))}
            </div>
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={300} rows={3} placeholder="한 줄 요약 (예: 개념 이해는 빠르나 계산 실수가 잦음. 칭찬하면 집중력이 올라감) — 건강 정보는 적지 마세요" style={{ ...INPUT, height: 'auto', padding: '10px 12px', resize: 'vertical', lineHeight: 1.6 }} />
            {traitsDirty && <button type="button" disabled={busy} onClick={() => patch({ traits, summary })} style={{ ...BTN, alignSelf: 'flex-start' }}>성격·특성 저장</button>}
          </section>

          <section style={card}>
            <h2 style={h2}>연락처</h2>
            <div style={{ fontSize: 14, lineHeight: 1.9 }}>
              <div><span style={{ color: '#5A6270' }}>학부모</span> {s.parentName || '–'} {s.parentPhone && <a href={`tel:${s.parentPhone}`} style={{ color: '#1E5645', fontWeight: 600 }}>{s.parentPhone}</a>}</div>
              <div><span style={{ color: '#5A6270' }}>학생</span> {s.studentPhone ? <a href={`tel:${s.studentPhone}`} style={{ color: '#1E5645', fontWeight: 600 }}>{s.studentPhone}</a> : '–'}</div>
            </div>
          </section>

          <section style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={h2}>최근 30일 출결</h2>
              <Link href={`/${slug}/admin/attendance${s.classId ? `?classId=${s.classId}` : ''}`} style={{ fontSize: 13, color: '#1E5645', fontWeight: 600 }}>출결 체크 →</Link>
            </div>
            {att30.length === 0 ? (
              <div style={{ fontSize: 13, color: '#9AA3AF' }}>최근 30일 출결 기록이 없습니다.</div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {[...att30].reverse().map((a) => (
                    <span key={a.date} title={`${a.date} ${ATTENDANCE_LABEL[a.status]}${a.note ? ` · ${a.note}` : ''}`} style={{ width: 22, height: 22, borderRadius: 4, background: ATT_COLOR[a.status], color: '#FFFFFF', fontSize: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      {Number(a.date.slice(8))}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12, color: '#3E4652' }}>
                  {(Object.keys(ATTENDANCE_LABEL) as AttendanceStatus[]).map((k) => (
                    <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: ATT_COLOR[k] }} />{ATTENDANCE_LABEL[k]} {attCount(k)}
                    </span>
                  ))}
                </div>
                {att30.filter((a) => a.note).slice(0, 3).map((a) => (
                  <div key={a.date} style={{ fontSize: 12, color: '#5A6270' }}>{a.date.slice(5).replace('-', '/')} {ATTENDANCE_LABEL[a.status]} · {a.note}</div>
                ))}
              </>
            )}
          </section>

          <section style={card}>
            <h2 style={h2}>입학 전 기록</h2>
            {!s.lead ? (
              <div style={{ fontSize: 13, color: '#9AA3AF', lineHeight: 1.6 }}>상담 관리에서 원생으로 등록한 학생은 상담 이력과 레벨테스트 결과가 여기에 보입니다.</div>
            ) : (
              <>
                <div style={{ fontSize: 13 }}><span style={{ color: '#5A6270' }}>{formatKstDate(s.lead.createdAt)}</span> 상담 신청</div>
                {s.lead.attempts.length === 0 && <div style={{ fontSize: 13, color: '#9AA3AF' }}>레벨테스트 응시 기록 없음</div>}
                {s.lead.attempts.map((a) => (
                  <div key={a.id} style={{ padding: '10px 12px', borderRadius: 8, background: '#F4F2EE', fontSize: 14 }}>
                    <div style={{ fontWeight: 600 }}>{a.title}</div>
                    <div style={{ color: '#5A6270', fontSize: 13 }}>
                      {a.needsGrading ? '서술형 채점 중' : a.maxScore ? `${a.score}/${a.maxScore}점 (${Math.round(((a.score ?? 0) / a.maxScore) * 100)}%)` : '–'}
                      {a.submittedAt ? ` · ${formatKstDate(a.submittedAt)}` : ''}
                    </div>
                    <a href={a.resultUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#1E5645', fontWeight: 600 }}>결과지·약한 단원 보기 ↗</a>
                  </div>
                ))}
                {s.lead.message && <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}><span style={{ color: '#5A6270' }}>상담 메모</span><br />{s.lead.message}</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {s.lead.events.filter((e) => e.type !== 'created').map((e) => (
                    <div key={e.id} style={{ fontSize: 13 }}>
                      <span style={{ color: '#5A6270' }}>{formatKstDate(e.createdAt)}</span> {EVENT_LABEL[e.type] ?? e.type}{e.note ? ` · ${e.note}` : ''}
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
