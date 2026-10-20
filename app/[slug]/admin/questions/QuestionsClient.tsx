'use client';

import { useMemo, useState } from 'react';
import { MathText } from '@/components/level-test/MathText';

export type QuestionRow = {
  id: string;
  type: QType;
  subject: string;
  grade: string | null;
  unit: string | null;
  difficulty: number;
  body: string;
  imageUrl: string | null;
  choices: string[] | null;
  answers: string[];
  explanation: string | null;
  points: number;
  archived: boolean;
  usedInTests: number;
  responses: number;
};

type Draft = {
  id: string | null;
  type: QType;
  subject: string;
  grade: string;
  unit: string;
  difficulty: number;
  body: string;
  imageUrl: string;
  choices: string[];
  choiceAnswer: string;
  shortAnswers: string;
  explanation: string;
  points: number;
};

type QType = 'choice' | 'short' | 'essay';
const TYPE_LABEL: Record<QType, string> = { choice: '객관식', short: '단답형', essay: '서술형' };
const TYPE_BG: Record<QType, string> = { choice: '#E6EBF8', short: '#FBF1CF', essay: '#F3E8FF' };

const card: React.CSSProperties = { background: '#FFFFFF', borderRadius: 12, padding: 20 };
const input: React.CSSProperties = { height: 40, padding: '0 10px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14, width: '100%', boxSizing: 'border-box', background: '#FFFFFF' };
const label: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#5A6270' };
const GRADES = ['초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3'];

function emptyDraft(subject: string): Draft {
  return { id: null, type: 'choice', subject, grade: '', unit: '', difficulty: 3, body: '', imageUrl: '', choices: ['', '', '', '', ''], choiceAnswer: '', shortAnswers: '', explanation: '', points: 1 };
}

function toDraft(q: QuestionRow): Draft {
  return {
    id: q.id, type: q.type, subject: q.subject, grade: q.grade ?? '', unit: q.unit ?? '', difficulty: q.difficulty,
    body: q.body, imageUrl: q.imageUrl ?? '', choices: q.choices ?? ['', '', '', '', ''],
    choiceAnswer: q.type === 'choice' ? q.answers[0] ?? '' : '', shortAnswers: q.type === 'short' ? q.answers.join('\n') : '',
    explanation: q.explanation ?? '', points: q.points,
  };
}

function Difficulty({ value }: { value: number }) {
  return <span aria-label={`난이도 ${value}`} style={{ letterSpacing: 1, color: '#B7791F' }}>{'●'.repeat(value)}<span style={{ color: '#E2DDD2' }}>{'●'.repeat(5 - value)}</span></span>;
}

export function QuestionsClient({ slug, initial, defaultSubject }: { slug: string; initial: QuestionRow[]; defaultSubject: string }) {
  const [rows, setRows] = useState(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [q, setQ] = useState('');
  const [grade, setGrade] = useState('');
  const [unit, setUnit] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [uploading, setUploading] = useState(false);

  const units = useMemo(() => [...new Set(rows.map((r) => r.unit).filter(Boolean) as string[])].sort(), [rows]);
  const filtered = rows.filter((r) =>
    (showArchived || !r.archived) &&
    (!grade || r.grade === grade) &&
    (!unit || r.unit === unit) &&
    (!q || r.body.includes(q) || (r.unit ?? '').includes(q)),
  );

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  async function save() {
    if (!draft) return;
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        type: draft.type, subject: draft.subject, grade: draft.grade, unit: draft.unit, difficulty: draft.difficulty,
        body: draft.body, imageUrl: draft.imageUrl, choices: draft.type === 'choice' ? draft.choices : null,
        answers: draft.type === 'choice' ? [draft.choiceAnswer] : draft.type === 'short' ? draft.shortAnswers : [], explanation: draft.explanation, points: draft.points,
      };
      const res = await fetch(draft.id ? `/api/${slug}/admin/questions/${draft.id}` : `/api/${slug}/admin/questions`, {
        method: draft.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ text: data.error ?? '저장하지 못했습니다.', ok: false }); return; }
      const saved = data.question;
      const row: QuestionRow = {
        ...saved,
        choices: Array.isArray(saved.choices) ? saved.choices : null,
        usedInTests: rows.find((r) => r.id === saved.id)?.usedInTests ?? 0,
        responses: rows.find((r) => r.id === saved.id)?.responses ?? 0,
      };
      setRows((prev) => (draft.id ? prev.map((r) => (r.id === saved.id ? row : r)) : [row, ...prev]));
      setDraft(toDraft(row));
      setMsg({ text: data.warning ?? '저장했습니다.', ok: !data.warning });
    } finally {
      setSaving(false);
    }
  }

  async function toggleArchive(r: QuestionRow) {
    const res = await fetch(`/api/${slug}/admin/questions/${r.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ archived: !r.archived }),
    });
    if (res.ok) setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, archived: !r.archived } : x)));
  }

  async function upload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/${slug}/admin/upload`, { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) set('imageUrl', data.url);
      else setMsg({ text: data.error ?? '그림을 올리지 못했습니다.', ok: false });
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      {/* 목록 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>문제은행</h1>
            <div style={{ fontSize: 14, color: '#5A6270', marginTop: 4 }}>레벨테스트에 쓸 문항을 모아 둡니다. 수식은 $x^2$ 처럼 $로 감싸 입력하세요.</div>
          </div>
          <button type="button" onClick={() => { setDraft(emptyDraft(defaultSubject)); setMsg(null); }} style={{ height: 40, padding: '0 16px', border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            + 새 문항
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="본문·단원 검색" style={{ ...input, width: 200 }} />
          <select value={grade} onChange={(e) => setGrade(e.target.value)} style={{ ...input, width: 110 }}>
            <option value="">전체 학년</option>
            {GRADES.map((g) => <option key={g}>{g}</option>)}
          </select>
          <select value={unit} onChange={(e) => setUnit(e.target.value)} style={{ ...input, width: 160 }}>
            <option value="">전체 단원</option>
            {units.map((u) => <option key={u}>{u}</option>)}
          </select>
          <label style={{ fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> 보관한 문항 보기
          </label>
          <span style={{ fontSize: 13, color: '#5A6270' }}>{filtered.length}문항</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', color: '#9AA3AF', padding: 40 }}>
            {rows.length === 0 ? '아직 문항이 없습니다. "+ 새 문항"으로 첫 문항을 만들어 보세요.' : '조건에 맞는 문항이 없습니다.'}
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => { setDraft(toDraft(r)); setMsg(null); }}
                  style={{ ...card, width: '100%', textAlign: 'left', border: draft?.id === r.id ? '2px solid #1E5645' : '1px solid #E2DDD2', cursor: 'pointer', font: 'inherit', color: 'inherit', opacity: r.archived ? 0.55 : 1, display: 'flex', flexDirection: 'column', gap: 8, padding: 16 }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#5A6270', flexWrap: 'wrap' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 6, background: TYPE_BG[r.type], color: '#1B2430', fontWeight: 600 }}>{TYPE_LABEL[r.type]}</span>
                    <span>{[r.subject, r.grade, r.unit].filter(Boolean).join(' · ')}</span>
                    <Difficulty value={r.difficulty} />
                    <span>{r.points}점</span>
                    {r.usedInTests > 0 && <span>시험지 {r.usedInTests}개</span>}
                    {r.archived && <span>보관됨</span>}
                  </div>
                  <MathText text={r.body.length > 160 ? `${r.body.slice(0, 160)}…` : r.body} style={{ fontSize: 14, lineHeight: 1.6 }} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 편집 */}
      {draft && (
        <section className="adm-sheet" style={{ ...card, width: 440, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{draft.id ? '문항 수정' : '새 문항'}</div>
            <button type="button" className="adm-sheet-close" onClick={() => setDraft(null)} aria-label="닫기" style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#9AA3AF' }}>×</button>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {(['choice', 'short', 'essay'] as const).map((t) => (
              <button key={t} type="button" aria-pressed={draft.type === t} onClick={() => set('type', t)} style={{ flex: 1, height: 38, borderRadius: 8, border: draft.type === t ? '2px solid #1E5645' : '1px solid #D5D0C6', background: draft.type === t ? '#E4EEE9' : '#FFFFFF', font: 'inherit', fontWeight: 600, cursor: 'pointer' }}>
                {TYPE_LABEL[t]}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={label}>과목</span><input value={draft.subject} onChange={(e) => set('subject', e.target.value)} style={input} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={label}>학년</span>
              <select value={draft.grade} onChange={(e) => set('grade', e.target.value)} style={input}><option value="">선택</option>{GRADES.map((g) => <option key={g}>{g}</option>)}</select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={label}>배점</span><input type="number" min={1} max={100} value={draft.points} onChange={(e) => set('points', Number(e.target.value))} style={input} /></label>
          </div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={label}>단원</span>
            <input value={draft.unit} onChange={(e) => set('unit', e.target.value)} list="unit-options" placeholder="예: 일차방정식" style={input} />
            <datalist id="unit-options">{units.map((u) => <option key={u} value={u} />)}</datalist>
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={label}>난이도</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 2, 3, 4, 5].map((d) => (
                <button key={d} type="button" aria-pressed={draft.difficulty === d} onClick={() => set('difficulty', d)} style={{ flex: 1, height: 34, borderRadius: 8, border: draft.difficulty === d ? '2px solid #B7791F' : '1px solid #D5D0C6', background: draft.difficulty === d ? '#FBF1CF' : '#FFFFFF', font: 'inherit', cursor: 'pointer' }}>{d}</button>
              ))}
            </div>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={label}>문제 본문</span>
            <textarea rows={4} value={draft.body} onChange={(e) => set('body', e.target.value)} placeholder="예: 일차방정식 $2x + 3 = 11$ 의 해는?" style={{ ...input, height: 'auto', padding: 10, resize: 'vertical' }} />
          </label>
          {draft.body && (
            <div style={{ padding: 12, borderRadius: 8, background: '#FAF9F6', fontSize: 14, lineHeight: 1.7 }}>
              <div style={{ fontSize: 11, color: '#9AA3AF', marginBottom: 4 }}>미리보기</div>
              <MathText text={draft.body} />
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ height: 34, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', cursor: uploading ? 'wait' : 'pointer' }}>
              {uploading ? '올리는 중…' : draft.imageUrl ? '그림 바꾸기' : '그림 추가'}
              <input type="file" accept="image/*" hidden disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
            </label>
            {draft.imageUrl && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={draft.imageUrl} alt="문항 그림" style={{ height: 48, borderRadius: 6 }} />
                <button type="button" onClick={() => set('imageUrl', '')} style={{ border: 'none', background: 'none', color: '#8A3A1C', fontSize: 13, cursor: 'pointer' }}>삭제</button>
              </>
            )}
          </div>

          {draft.type === 'essay' ? (
            <div style={{ padding: 10, borderRadius: 8, background: '#F3E8FF', fontSize: 13, lineHeight: 1.6 }}>
              서술형은 학생이 글이나 풀이 사진으로 답하고, <b>채점함</b>에서 선생님이 부분 점수와 첨삭을 남깁니다. 모범답안·채점 기준은 아래 칸에 적어 두세요.
            </div>
          ) : draft.type === 'choice' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={label}>보기 (정답에 체크)</span>
              {draft.choices.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="radio" name="answer" aria-label={`${i + 1}번이 정답`} checked={draft.choiceAnswer === String(i + 1)} onChange={() => set('choiceAnswer', String(i + 1))} style={{ width: 18, height: 18 }} />
                  <span style={{ width: 18, fontSize: 13, color: '#5A6270' }}>{i + 1}</span>
                  <input value={c} onChange={(e) => set('choices', draft.choices.map((x, j) => (j === i ? e.target.value : x)))} style={input} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8 }}>
                {draft.choices.length < 8 && <button type="button" onClick={() => set('choices', [...draft.choices, ''])} style={{ border: 'none', background: 'none', color: '#1E5645', fontSize: 13, cursor: 'pointer' }}>+ 보기 추가</button>}
                {draft.choices.length > 2 && <button type="button" onClick={() => set('choices', draft.choices.slice(0, -1))} style={{ border: 'none', background: 'none', color: '#8A3A1C', fontSize: 13, cursor: 'pointer' }}>마지막 보기 삭제</button>}
              </div>
            </div>
          ) : (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={label}>정답 (한 줄에 하나, 모두 정답 처리)</span>
              <textarea rows={3} value={draft.shortAnswers} onChange={(e) => set('shortAnswers', e.target.value)} placeholder={'1/2\n0.5'} style={{ ...input, height: 'auto', padding: 10 }} />
              <span style={{ fontSize: 12, color: '#9AA3AF' }}>숫자는 1/2 = 0.5 = 2/4처럼 같은 값이면 정답으로 봅니다. 띄어쓰기·대소문자는 무시합니다.</span>
            </label>
          )}

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={label}>{draft.type === 'essay' ? '모범답안·채점 기준 (선생님만 봄)' : '해설 (선생님만 봄)'}</span>
            <textarea rows={draft.type === 'essay' ? 4 : 2} value={draft.explanation} onChange={(e) => set('explanation', e.target.value)} style={{ ...input, height: 'auto', padding: 10 }} />
          </label>

          {msg && <div role="status" style={{ fontSize: 13, fontWeight: 600, color: msg.ok ? '#1E5645' : '#8A3A1C' }}>{msg.text}</div>}

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={save} disabled={saving} style={{ flex: 1, height: 44, border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 15, fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}>
              {saving ? '저장 중…' : '저장'}
            </button>
            {draft.id && (() => {
              const row = rows.find((r) => r.id === draft.id);
              return row ? (
                <button type="button" onClick={() => toggleArchive(row)} style={{ height: 44, padding: '0 14px', border: '1px solid #D5D0C6', borderRadius: 8, background: '#FFFFFF', font: 'inherit', fontSize: 14, cursor: 'pointer' }}>
                  {row.archived ? '복원' : '보관'}
                </button>
              ) : null;
            })()}
          </div>
          {draft.id && (rows.find((r) => r.id === draft.id)?.responses ?? 0) > 0 && (
            <div style={{ fontSize: 12, color: '#9AA3AF' }}>응시 기록이 있는 문항은 삭제 대신 보관합니다. 보관하면 새 시험지에 넣을 수 없습니다.</div>
          )}
        </section>
      )}
    </>
  );
}
