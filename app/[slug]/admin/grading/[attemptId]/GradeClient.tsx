'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MathText } from '@/components/level-test/MathText';
import { MarkedPhoto } from '@/components/level-test/MarkedPhoto';
import { PhotoAnnotator } from '@/components/level-test/PhotoAnnotator';
import { ERROR_TYPES } from '@/lib/level-test/grading';
import type { Stroke } from '@/lib/level-test/marks';

export type EssayItem = {
  questionId: string;
  no: number;
  body: string;
  imageUrl: string | null;
  modelAnswer: string | null;
  maxPoints: number;
  answer: string;
  photos: string[];
  points: number | null;
  feedback: string;
  errorType: string;
  marks: Stroke[][];
};

export type AutoItem = { no: number; body: string; answer: string; key: string; correct: boolean; points: number; maxPoints: number };

const card: React.CSSProperties = { background: '#FFFFFF', borderRadius: 12, padding: 20 };
const label: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#5A6270' };

export function GradeClient({ slug, attemptId, resultUrl, needsGrading, essays: initial, autos }: {
  slug: string; attemptId: string; resultUrl: string; needsGrading: boolean; essays: EssayItem[]; autos: AutoItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<Record<string, { text: string; ok: boolean }>>({});
  const [annotating, setAnnotating] = useState<{ qid: string; photo: number } | null>(null);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');

  const api = `/api/${slug}/admin/grading/${attemptId}`;
  const update = (qid: string, patch: Partial<EssayItem>) => {
    setItems((list) => list.map((it) => (it.questionId === qid ? { ...it, ...patch } : it)));
    setDirty((d) => new Set(d).add(qid));
    setMsg((m) => ({ ...m, [qid]: { text: '', ok: true } }));
  };

  async function save(it: EssayItem): Promise<boolean> {
    if (it.points === null) {
      setMsg((m) => ({ ...m, [it.questionId]: { text: '점수를 먼저 골라 주세요.', ok: false } }));
      return false;
    }
    setSaving(it.questionId);
    try {
      const res = await fetch(api, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: it.questionId, points: it.points, feedback: it.feedback, errorType: it.errorType || null, marks: it.marks }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg((m) => ({ ...m, [it.questionId]: { text: data.error ?? '저장하지 못했습니다.', ok: false } }));
        return false;
      }
      setDirty((d) => { const n = new Set(d); n.delete(it.questionId); return n; });
      setMsg((m) => ({ ...m, [it.questionId]: { text: '저장했습니다.', ok: true } }));
      return true;
    } finally {
      setSaving(null);
    }
  }

  async function complete() {
    setError('');
    setCompleting(true);
    try {
      for (const it of items) {
        if (dirty.has(it.questionId) && !(await save(it))) { setError(`${it.no}번을 저장하지 못했습니다.`); return; }
      }
      const res = await fetch(`${api}/complete`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? '채점을 완료하지 못했습니다.'); return; }
      router.push(`/${slug}/admin/grading`);
      router.refresh();
    } finally {
      setCompleting(false);
    }
  }

  const ungraded = items.filter((it) => it.points === null).length;
  const current = annotating ? items.find((it) => it.questionId === annotating.qid) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {items.map((it) => (
        <section key={it.questionId} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div style={{ fontWeight: 700 }}>{it.no}번 · 서술형 <span style={{ fontWeight: 400, color: '#5A6270' }}>({it.maxPoints}점)</span></div>
            {it.points !== null && !dirty.has(it.questionId) && <span style={{ fontSize: 12, color: '#1E5645', background: '#E4EEE9', padding: '3px 8px', borderRadius: 6 }}>채점됨 {it.points}/{it.maxPoints}</span>}
          </div>
          <MathText text={it.body} style={{ fontSize: 15, lineHeight: 1.7 }} />
          {it.modelAnswer && (
            <details style={{ background: '#FAF9F6', borderRadius: 8, padding: '8px 12px' }}>
              <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>모범답안·채점 기준</summary>
              <MathText text={it.modelAnswer} style={{ fontSize: 14, lineHeight: 1.7, marginTop: 6 }} />
            </details>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={label}>학생 답안</span>
            {it.answer.trim() ? (
              <div style={{ padding: 12, borderRadius: 8, border: '1px solid #EEEAE2', whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.7 }}>{it.answer}</div>
            ) : !it.photos.length ? (
              <div style={{ color: '#9AA3AF', fontSize: 14 }}>(무응답)</div>
            ) : null}
            {it.photos.length > 0 && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {it.photos.map((src, i) => (
                  <button key={src} type="button" onClick={() => setAnnotating({ qid: it.questionId, photo: i })} aria-label={`${it.no}번 풀이 사진 ${i + 1}에 표시하기`} style={{ border: '1px solid #D5D0C6', borderRadius: 8, padding: 4, background: '#FFFFFF', cursor: 'pointer', width: 220, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <MarkedPhoto src={src} strokes={it.marks[i] ?? []} alt={`${it.no}번 풀이 사진 ${i + 1}`} style={{ width: '100%' }} />
                    <span style={{ fontSize: 12, color: '#1E5645', fontWeight: 600 }}>✏️ 사진에 표시하기</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={label}>점수</span>
            {it.maxPoints <= 10 ? (
              <div role="radiogroup" aria-label={`${it.no}번 점수`} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Array.from({ length: it.maxPoints + 1 }, (_, p) => (
                  <button key={p} type="button" role="radio" aria-checked={it.points === p} onClick={() => update(it.questionId, { points: p })} style={{ minWidth: 44, height: 40, borderRadius: 8, border: it.points === p ? '2px solid #1E5645' : '1px solid #D5D0C6', background: it.points === p ? '#E4EEE9' : '#FFFFFF', font: 'inherit', fontWeight: 600, cursor: 'pointer' }}>{p}</button>
                ))}
              </div>
            ) : (
              <input type="number" min={0} max={it.maxPoints} value={it.points ?? ''} onChange={(e) => update(it.questionId, { points: e.target.value === '' ? null : Number(e.target.value) })} aria-label={`${it.no}번 점수`} style={{ width: 100, height: 40, padding: '0 10px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit' }} />
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={label}>오답 유형 (선택)</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Object.entries(ERROR_TYPES).map(([k, v]) => (
                <button key={k} type="button" aria-pressed={it.errorType === k} onClick={() => update(it.questionId, { errorType: it.errorType === k ? '' : k })} style={{ height: 34, padding: '0 12px', borderRadius: 999, border: it.errorType === k ? '2px solid #B7791F' : '1px solid #D5D0C6', background: it.errorType === k ? '#FBF1CF' : '#FFFFFF', font: 'inherit', fontSize: 13, cursor: 'pointer' }}>{v}</button>
              ))}
            </div>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={label}>첨삭 (결과지에 보입니다)</span>
            <textarea rows={3} maxLength={1000} value={it.feedback} onChange={(e) => update(it.questionId, { feedback: e.target.value })} placeholder="예: 식은 잘 세웠는데 이항할 때 부호가 바뀌었어요. 양변에 같은 수를 더한다는 원리를 다시 확인해 봐요." style={{ padding: 10, border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14, resize: 'vertical' }} />
          </label>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button type="button" disabled={saving === it.questionId} onClick={() => save(it)} style={{ height: 40, padding: '0 18px', border: 'none', borderRadius: 8, background: dirty.has(it.questionId) ? '#1E5645' : '#9FBFB2', color: '#FFFFFF', font: 'inherit', fontWeight: 700, cursor: 'pointer' }}>
              {saving === it.questionId ? '저장 중…' : '이 문항 저장'}
            </button>
            {msg[it.questionId]?.text && <span role="status" style={{ fontSize: 13, color: msg[it.questionId].ok ? '#1E5645' : '#B42318' }}>{msg[it.questionId].text}</span>}
          </div>
        </section>
      ))}

      {autos.length > 0 && (
        <details style={card}>
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>자동 채점 문항 {autos.length}개 · {autos.reduce((s, a) => s + a.points, 0)}/{autos.reduce((s, a) => s + a.maxPoints, 0)}점</summary>
          <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {autos.map((a) => (
              <li key={a.no} style={{ display: 'flex', gap: 10, fontSize: 14, alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 700, color: a.correct ? '#1E5645' : '#B42318', minWidth: 44 }}>{a.no}. {a.correct ? 'O' : 'X'}</span>
                <div style={{ flex: 1 }}>
                  <MathText text={a.body.length > 80 ? `${a.body.slice(0, 80)}…` : a.body} style={{ fontSize: 13, color: '#3E4652' }} />
                  <div style={{ fontSize: 13 }}>학생: <MathText as="span" text={a.answer} /> · 정답: <MathText as="span" text={a.key} /></div>
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div style={{ ...card, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', position: 'sticky', bottom: 12 }}>
        <button type="button" disabled={completing || ungraded > 0} onClick={complete} style={{ height: 46, padding: '0 22px', border: 'none', borderRadius: 10, background: ungraded > 0 ? '#C8CDD5' : '#1B2430', color: '#FFFFFF', font: 'inherit', fontWeight: 700, cursor: ungraded > 0 ? 'not-allowed' : 'pointer' }}>
          {completing ? '처리 중…' : needsGrading ? '채점 완료' : '점수 다시 계산'}
        </button>
        <span style={{ fontSize: 13, color: '#5A6270' }}>{ungraded > 0 ? `점수를 매기지 않은 서술형 ${ungraded}문항` : '완료하면 결과지에 최종 점수와 첨삭이 보입니다.'}</span>
        <a href={resultUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto', fontSize: 13, color: '#1E5645' }}>결과지 미리보기 ↗</a>
        {error && <span role="alert" style={{ width: '100%', fontSize: 13, color: '#B42318' }}>{error}</span>}
      </div>

      {annotating && current && (
        <PhotoAnnotator
          src={current.photos[annotating.photo]}
          initial={current.marks[annotating.photo] ?? []}
          onClose={() => setAnnotating(null)}
          onSave={(strokes) => {
            const marks = current.photos.map((_, i) => (i === annotating.photo ? strokes : current.marks[i] ?? []));
            update(current.questionId, { marks });
            setAnnotating(null);
          }}
        />
      )}
    </div>
  );
}
