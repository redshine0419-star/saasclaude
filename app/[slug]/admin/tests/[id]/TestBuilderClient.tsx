'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MathText } from '@/components/level-test/MathText';
import { composeTest } from '@/lib/level-test/compose';

export type BuilderQuestion = {
  id: string;
  type: 'choice' | 'short';
  grade: string | null;
  unit: string | null;
  difficulty: number;
  body: string;
  points: number;
  archived: boolean;
};

type Item = { questionId: string; points: number };
type TestInfo = { id: string; title: string; grade: string | null; description: string | null; timeLimitMin: number | null; archived: boolean };

const GRADES = ['초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3'];
const card: React.CSSProperties = { background: '#FFFFFF', borderRadius: 12, padding: 20 };
const input: React.CSSProperties = { height: 40, padding: '0 10px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14, boxSizing: 'border-box', background: '#FFFFFF' };
const smallBtn: React.CSSProperties = { border: '1px solid #D5D0C6', background: '#FFFFFF', borderRadius: 6, width: 30, height: 30, cursor: 'pointer', font: 'inherit' };

export function TestBuilderClient({ slug, test, items: initialItems, bank, locked }: { slug: string; test: TestInfo; items: Item[]; bank: BuilderQuestion[]; locked: boolean }) {
  const router = useRouter();
  const [info, setInfo] = useState(test);
  const [items, setItems] = useState<Item[]>(initialItems);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [filterGrade, setFilterGrade] = useState(test.grade ?? '');
  const [filterUnit, setFilterUnit] = useState('');
  const [autoCount, setAutoCount] = useState('15');

  const byId = useMemo(() => new Map(bank.map((q) => [q.id, q])), [bank]);
  const inTest = new Set(items.map((i) => i.questionId));
  const units = useMemo(() => [...new Set(bank.map((q) => q.unit).filter(Boolean) as string[])].sort(), [bank]);
  const candidates = bank.filter((q) => !q.archived && !inTest.has(q.id) && (!filterGrade || q.grade === filterGrade) && (!filterUnit || q.unit === filterUnit));
  const total = items.reduce((s, i) => s + i.points, 0);

  const change = (next: Item[]) => { setItems(next); setDirty(true); setMsg(null); };
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    change(next);
  };

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/${slug}/admin/tests/${test.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: info.title, grade: info.grade ?? '', description: info.description ?? '', timeLimitMin: info.timeLimitMin ?? 0,
          ...(locked ? {} : { items }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ text: data.error ?? '저장하지 못했습니다.', ok: false }); return; }
      setDirty(false);
      setMsg({ text: '저장했습니다.', ok: true });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function duplicate() {
    setBusy(true);
    try {
      const res = await fetch(`/api/${slug}/admin/tests/${test.id}/duplicate`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) router.push(`/${slug}/admin/tests/${data.id}`);
      else setMsg({ text: data.error ?? '복사하지 못했습니다.', ok: false });
    } finally {
      setBusy(false);
    }
  }

  async function toggleArchive() {
    const res = await fetch(`/api/${slug}/admin/tests/${test.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ archived: !info.archived }) });
    if (res.ok) { setInfo((x) => ({ ...x, archived: !x.archived })); router.refresh(); }
  }

  function autoCompose() {
    const ids = composeTest(bank, { grade: filterGrade || undefined, units: filterUnit ? [filterUnit] : undefined, count: Math.max(1, Number(autoCount) || 10) });
    if (ids.length === 0) { setMsg({ text: '조건에 맞는 문항이 없습니다. 학년·단원 조건을 바꾸거나 문제은행에 문항을 추가하세요.', ok: false }); return; }
    change(ids.map((id) => ({ questionId: id, points: byId.get(id)?.points ?? 1 })));
    if (ids.length < Number(autoCount)) setMsg({ text: `조건에 맞는 문항이 ${ids.length}개뿐이라 ${ids.length}문항으로 구성했습니다.`, ok: false });
  }

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 설정 */}
        <section style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input value={info.title} onChange={(e) => { setInfo({ ...info, title: e.target.value }); setDirty(true); }} aria-label="시험지 이름" style={{ ...input, flex: 1, minWidth: 200, fontWeight: 700, fontSize: 16 }} />
            <select value={info.grade ?? ''} onChange={(e) => { setInfo({ ...info, grade: e.target.value || null }); setDirty(true); }} aria-label="학년" style={input}>
              <option value="">학년</option>
              {GRADES.map((g) => <option key={g}>{g}</option>)}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
              제한
              <input type="number" min={0} max={240} value={info.timeLimitMin ?? ''} onChange={(e) => { setInfo({ ...info, timeLimitMin: e.target.value ? Number(e.target.value) : null }); setDirty(true); }} aria-label="제한 시간(분)" style={{ ...input, width: 70 }} />분
            </label>
          </div>
          <textarea rows={2} value={info.description ?? ''} onChange={(e) => { setInfo({ ...info, description: e.target.value }); setDirty(true); }} placeholder="응시 전 안내 (예: 계산기 없이 풀어 주세요. 모르는 문제는 비워 두세요.)" style={{ ...input, height: 'auto', padding: 10 }} />
        </section>

        {/* 문항 */}
        <section style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>문항 {items.length}개 · 총 {total}점</div>
            {locked && <span style={{ fontSize: 12, color: '#7A4B00', background: '#FFF7E6', padding: '4px 8px', borderRadius: 6 }}>응시 기록이 있어 문항 변경 불가</span>}
          </div>
          {items.length === 0 && <div style={{ color: '#9AA3AF', fontSize: 14, padding: '12px 0' }}>오른쪽에서 문항을 추가하거나 자동 구성을 눌러 주세요.</div>}
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((it, i) => {
              const q = byId.get(it.questionId);
              return (
                <li key={it.questionId} style={{ display: 'flex', gap: 10, padding: 12, border: '1px solid #EEEAE2', borderRadius: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 700, minWidth: 22 }}>{i + 1}.</span>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 12, color: '#5A6270' }}>{[q?.type === 'choice' ? '객관식' : '단답형', q?.grade, q?.unit, `난이도 ${q?.difficulty}`].filter(Boolean).join(' · ')}</div>
                    <MathText text={q ? (q.body.length > 120 ? `${q.body.slice(0, 120)}…` : q.body) : '(삭제된 문항)'} style={{ fontSize: 14, lineHeight: 1.6 }} />
                  </div>
                  {!locked && (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                      <input type="number" min={1} max={100} value={it.points} aria-label={`${i + 1}번 배점`} onChange={(e) => change(items.map((x, j) => (j === i ? { ...x, points: Number(e.target.value) || 1 } : x)))} style={{ ...input, width: 56, height: 30 }} />
                      <button type="button" aria-label="위로" onClick={() => move(i, -1)} style={smallBtn}>▲</button>
                      <button type="button" aria-label="아래로" onClick={() => move(i, 1)} style={smallBtn}>▼</button>
                      <button type="button" aria-label="빼기" onClick={() => change(items.filter((_, j) => j !== i))} style={{ ...smallBtn, color: '#8A3A1C' }}>×</button>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        {msg && <div role="status" style={{ fontSize: 14, fontWeight: 600, color: msg.ok ? '#1E5645' : '#8A3A1C' }}>{msg.text}</div>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" disabled={busy} onClick={save} style={{ height: 44, padding: '0 20px', border: 'none', borderRadius: 8, background: dirty ? '#1E5645' : '#9FBFB2', color: '#FFFFFF', font: 'inherit', fontWeight: 700, cursor: 'pointer' }}>
            {busy ? '저장 중…' : '저장'}
          </button>
          <button type="button" disabled={busy} onClick={duplicate} style={{ height: 44, padding: '0 16px', border: '1px solid #D5D0C6', borderRadius: 8, background: '#FFFFFF', font: 'inherit', cursor: 'pointer' }}>복사해서 새로 만들기</button>
          <button type="button" onClick={toggleArchive} style={{ height: 44, padding: '0 16px', border: '1px solid #D5D0C6', borderRadius: 8, background: '#FFFFFF', font: 'inherit', cursor: 'pointer' }}>{info.archived ? '보관 해제' : '보관'}</button>
        </div>
      </div>

      {/* 문항 고르기 */}
      {!locked && (
        <section style={{ ...card, width: 420, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>문항 추가</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} aria-label="학년 필터" style={{ ...input, flex: 1 }}>
              <option value="">전체 학년</option>
              {GRADES.map((g) => <option key={g}>{g}</option>)}
            </select>
            <select value={filterUnit} onChange={(e) => setFilterUnit(e.target.value)} aria-label="단원 필터" style={{ ...input, flex: 1 }}>
              <option value="">전체 단원</option>
              {units.map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 10, borderRadius: 8, background: '#FAF9F6', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13 }}>위 조건으로</span>
            <input type="number" min={1} max={50} value={autoCount} onChange={(e) => setAutoCount(e.target.value)} aria-label="자동 구성 문항 수" style={{ ...input, width: 60, height: 32 }} />
            <span style={{ fontSize: 13 }}>문항</span>
            <button type="button" onClick={autoCompose} style={{ height: 32, padding: '0 12px', border: 'none', borderRadius: 6, background: '#1B2430', color: '#FFFFFF', font: 'inherit', fontSize: 13, cursor: 'pointer' }}>자동 구성</button>
            <span style={{ fontSize: 12, color: '#9AA3AF', width: '100%' }}>쉬움·보통·어려움 3:4:3, 단원을 고르게 섞어 현재 문항을 바꿉니다.</span>
          </div>
          <div style={{ fontSize: 13, color: '#5A6270' }}>추가할 수 있는 문항 {candidates.length}개</div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 560, overflowY: 'auto' }}>
            {candidates.map((q) => (
              <li key={q.id} style={{ display: 'flex', gap: 8, padding: 10, border: '1px solid #EEEAE2', borderRadius: 8, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#5A6270' }}>{[q.grade, q.unit, `난이도 ${q.difficulty}`].filter(Boolean).join(' · ')}</div>
                  <MathText text={q.body.length > 90 ? `${q.body.slice(0, 90)}…` : q.body} style={{ fontSize: 13, lineHeight: 1.5 }} />
                </div>
                <button type="button" onClick={() => change([...items, { questionId: q.id, points: q.points }])} style={{ height: 30, padding: '0 10px', border: '1px solid #1E5645', borderRadius: 6, background: '#FFFFFF', color: '#1E5645', font: 'inherit', fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>추가</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
