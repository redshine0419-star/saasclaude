'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DEFAULT_ERROR_TYPES, MAX_ERROR_TYPES, MAX_ERROR_TYPE_LEN, type ErrorSubject, type ErrorTypeConfig } from '@/lib/level-test/error-types';

type Props = { slug: string; subjects: ErrorSubject[]; initial: ErrorTypeConfig; canEdit: boolean; open: boolean };

const CHIP: React.CSSProperties = { height: 32, padding: '0 6px 0 12px', borderRadius: 16, border: '1px solid #D5D0C6', background: '#FFFFFF', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13 };

/** 과목별 오답 유형 — 기본 목록에서 시작해 학원에 맞게 추가·삭제·순서 변경 */
export function ErrorTypesEditor({ slug, subjects, initial, canEdit, open: openInit }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(openInit);
  const [subject, setSubject] = useState<ErrorSubject>(subjects[0]);
  const [lists, setLists] = useState<Record<string, string[]>>(() => Object.fromEntries(subjects.map((s) => [s, initial[s] ?? DEFAULT_ERROR_TYPES[s]])));
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const list = lists[subject] ?? [];
  const dirty = subjects.some((s) => (lists[s] ?? []).join('|') !== (initial[s] ?? DEFAULT_ERROR_TYPES[s]).join('|'));

  function setList(next: string[]) {
    setLists((p) => ({ ...p, [subject]: next }));
    setMsg(null);
  }
  function add() {
    const v = input.trim().slice(0, MAX_ERROR_TYPE_LEN);
    if (!v || list.includes(v) || list.length >= MAX_ERROR_TYPES) return;
    setList([...list, v]);
    setInput('');
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/${slug}/admin/error-types`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ errorTypes: lists }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setMsg({ ok: false, text: data.error ?? '저장하지 못했습니다.' });
      setMsg({ ok: true, text: '저장했습니다. 다음 채점부터 바뀐 유형이 보입니다.' });
      router.refresh();
    } catch {
      setMsg({ ok: false, text: '저장하지 못했습니다.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="error-types" style={{ background: '#FFFFFF', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: 'none', background: 'none', padding: 0, font: 'inherit', cursor: 'pointer', textAlign: 'left' }}>
        <span>
          <span style={{ fontWeight: 700 }}>오답 유형 설정</span>
          <span style={{ display: 'block', fontSize: 13, color: '#5A6270', marginTop: 2 }}>서술형 채점 때 고르는 오답 유형을 과목별로 학원에 맞게 바꿉니다.</span>
        </span>
        <span style={{ fontSize: 13, color: '#5A6270' }}>{open ? '접기 ▲' : '열기 ▼'}</span>
      </button>

      {open && (
        <>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {subjects.map((s) => (
              <button key={s} type="button" onClick={() => { setSubject(s); setInput(''); }} style={{ height: 32, padding: '0 14px', borderRadius: 16, border: '1px solid #D5D0C6', background: subject === s ? '#1B2430' : '#FFFFFF', color: subject === s ? '#FFFFFF' : '#3E4652', font: 'inherit', fontSize: 13, cursor: 'pointer', minHeight: 0 }}>
                {s}{initial[s] ? ' · 편집함' : ''}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {list.map((t, i) => (
              <span key={t} style={CHIP}>
                {t}
                {canEdit && i > 0 && (
                  <button type="button" aria-label={`${t} 앞으로`} onClick={() => setList(list.map((x, j) => (j === i - 1 ? t : j === i ? list[i - 1] : x)))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9AA3AF', fontSize: 12, padding: '0 2px', minHeight: 0 }}>←</button>
                )}
                {canEdit && (
                  <button type="button" aria-label={`${t} 빼기`} onClick={() => setList(list.filter((x) => x !== t))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#B42318', fontSize: 14, padding: '0 4px', minHeight: 0 }}>×</button>
                )}
              </span>
            ))}
            {list.length === 0 && <span style={{ fontSize: 13, color: '#9AA3AF' }}>비워 두고 저장하면 기본 목록을 씁니다.</span>}
          </div>
          {canEdit && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input value={input} maxLength={MAX_ERROR_TYPE_LEN} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder={`새 유형 (예: ${subject === '영어' ? '관사' : subject === '수학' ? '부호 실수' : '서술 부족'})`} style={{ flex: '1 1 180px', minWidth: 0, height: 38, padding: '0 10px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }} />
              <button type="button" onClick={add} disabled={!input.trim() || list.length >= MAX_ERROR_TYPES} style={{ height: 38, padding: '0 14px', borderRadius: 8, border: '1px solid #D5D0C6', background: '#FFFFFF', font: 'inherit', fontSize: 14, cursor: 'pointer' }}>추가</button>
              <button type="button" onClick={() => setList([...DEFAULT_ERROR_TYPES[subject]])} style={{ height: 38, padding: '0 10px', border: 'none', background: 'none', font: 'inherit', fontSize: 13, color: '#5A6270', cursor: 'pointer' }}>기본 목록으로</button>
            </div>
          )}
          <div style={{ fontSize: 12, color: '#9AA3AF', lineHeight: 1.6 }}>
            문항의 과목에 맞는 목록이 채점 화면에 나옵니다. 유형을 바꿔도 이미 채점한 결과지의 유형은 그대로 남습니다. (과목마다 최대 {MAX_ERROR_TYPES}개, {MAX_ERROR_TYPE_LEN}자)
          </div>
          {msg && <div role={msg.ok ? 'status' : 'alert'} style={{ fontSize: 13, color: msg.ok ? '#1E5645' : '#B42318' }}>{msg.text}</div>}
          {canEdit ? (
            <button type="button" onClick={save} disabled={saving || !dirty} style={{ alignSelf: 'flex-start', height: 40, padding: '0 18px', border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: dirty ? 1 : 0.5 }}>
              {saving ? '저장 중…' : '오답 유형 저장'}
            </button>
          ) : (
            <div style={{ fontSize: 13, color: '#9AA3AF' }}>오답 유형은 원장만 바꿀 수 있습니다.</div>
          )}
        </>
      )}
    </section>
  );
}
