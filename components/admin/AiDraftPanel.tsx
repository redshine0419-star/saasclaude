'use client';

import { useState } from 'react';

type Draft = Record<string, string | string[]> & { omitted: string[] };

type Props = {
  slug: string;
  kind: 'director' | 'class' | 'post';
  /** 버튼에 보일 문구 */
  label: string;
  intro: string;
  placeholder: string;
  fields: { key: string; label: string }[];
  context?: Record<string, string | null | undefined>;
  onApply: (draft: Record<string, string>) => void;
};

export function AiDraftPanel({ slug, kind, label, intro, placeholder, fields, context, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);

  async function generate() {
    setBusy(true);
    setError('');
    setDraft(null);
    try {
      const res = await fetch(`/api/${slug}/admin/ai-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, source, context }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? '초안을 만들지 못했습니다.'); return; }
      setDraft(data.draft);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ alignSelf: 'flex-start', height: 36, padding: '0 14px', border: '1px solid #1E5645', borderRadius: 8, background: '#FFFFFF', color: '#1E5645', font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
      >
        {label}
      </button>
    );
  }

  const ready = source.trim().length >= 20;

  return (
    <div style={{ padding: 16, border: '1px solid #D5D0C6', borderRadius: 10, background: '#FAF9F6', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 14, fontWeight: 700 }}>AI 초안</div>
      <div style={{ fontSize: 12, color: '#5A6270', lineHeight: 1.6 }}>
        {intro} 입력한 내용에 있는 사실만 사용하고, 과장 표현과 근거 없는 실적은 빼고 알려드립니다.
        초안은 칸에 채워지기만 하고, 확인 후 <b>저장</b>을 눌러야 반영됩니다.
      </div>
      <textarea
        rows={5}
        value={source}
        onChange={(e) => setSource(e.target.value)}
        maxLength={4000}
        placeholder={placeholder}
        style={{ padding: 10, border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14, resize: 'vertical' }}
      />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          disabled={busy || !ready}
          onClick={generate}
          style={{ height: 36, padding: '0 14px', border: 'none', borderRadius: 8, background: busy || !ready ? '#9FBFB2' : '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 13, fontWeight: 600, cursor: busy ? 'wait' : 'pointer' }}
        >
          {busy ? '초안 만드는 중… (10~20초)' : '초안 만들기'}
        </button>
        <button type="button" onClick={() => { setOpen(false); setDraft(null); setError(''); }} style={{ height: 36, padding: '0 12px', border: 'none', background: 'transparent', color: '#5A6270', font: 'inherit', fontSize: 13, cursor: 'pointer' }}>
          닫기
        </button>
        <span style={{ fontSize: 12, color: '#9AA3AF' }}>{source.length.toLocaleString()} / 4,000자</span>
      </div>
      {error && <div role="alert" style={{ fontSize: 13, color: '#B42318' }}>{error}</div>}
      {draft && (
        <div style={{ padding: 12, background: '#FFFFFF', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {fields.map((f) => {
            const v = String(draft[f.key] ?? '');
            return (
              <div key={f.key} style={{ display: 'flex', gap: 8, fontSize: 13, lineHeight: 1.6 }}>
                <span style={{ width: 64, flexShrink: 0, color: '#5A6270' }}>{f.label}</span>
                <span style={{ color: v ? '#1B2430' : '#9AA3AF', whiteSpace: 'pre-wrap' }}>{v || '(원문에 없음)'}</span>
              </div>
            );
          })}
          {draft.omitted.length > 0 && (
            <div style={{ marginTop: 4, padding: '8px 10px', borderRadius: 6, background: '#FFF7E6', fontSize: 12, color: '#7A4B00', lineHeight: 1.6 }}>
              <b>뺀 표현</b> (과장·근거 없는 주장으로 보여 제외했습니다)
              <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{draft.omitted.map((o) => <li key={o}>{o}</li>)}</ul>
            </div>
          )}
          <button
            type="button"
            onClick={() => onApply(Object.fromEntries(fields.map((f) => [f.key, String(draft[f.key] ?? '')])))}
            style={{ alignSelf: 'flex-start', marginTop: 4, height: 34, padding: '0 14px', border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            칸에 채우기
          </button>
        </div>
      )}
    </div>
  );
}
