'use client';

import { useState } from 'react';

export type DirectorDraft = { headline: string; philosophy: string; career: string; education: string; omitted: string[] };

export function DirectorDraftPanel({ slug, onApply }: { slug: string; onApply: (d: DirectorDraft) => void }) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<DirectorDraft | null>(null);

  async function generate() {
    setBusy(true);
    setError('');
    setDraft(null);
    try {
      const res = await fetch(`/api/${slug}/admin/ai-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
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
        기존 소개글로 AI 초안 만들기
      </button>
    );
  }

  const row = (label: string, value: string) => (
    <div style={{ display: 'flex', gap: 8, fontSize: 13, lineHeight: 1.6 }}>
      <span style={{ width: 64, flexShrink: 0, color: '#5A6270' }}>{label}</span>
      <span style={{ color: value ? '#1B2430' : '#9AA3AF' }}>{value || '(원문에 없음)'}</span>
    </div>
  );

  return (
    <div style={{ padding: 16, border: '1px solid #D5D0C6', borderRadius: 10, background: '#FAF9F6', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 14, fontWeight: 700 }}>AI 초안</div>
      <div style={{ fontSize: 12, color: '#5A6270', lineHeight: 1.6 }}>
        블로그·전단지·기존 홈페이지의 원장 소개글을 붙여넣으세요. 글에 있는 사실만 사용하고, 과장 표현과 근거 없는 실적은 빼고 알려드립니다.
        초안은 아래 칸에 채워지기만 하고, 확인 후 <b>저장</b>을 눌러야 반영됩니다.
      </div>
      <textarea
        rows={5}
        value={source}
        onChange={(e) => setSource(e.target.value)}
        maxLength={4000}
        placeholder="예) 안녕하세요, 하늘수학 원장 김OO입니다. 중고등 수학을 12년째 가르치고 있습니다…"
        style={{ padding: 10, border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14, resize: 'vertical' }}
      />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          disabled={busy || source.trim().length < 20}
          onClick={generate}
          style={{ height: 36, padding: '0 14px', border: 'none', borderRadius: 8, background: busy || source.trim().length < 20 ? '#9FBFB2' : '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 13, fontWeight: 600, cursor: busy ? 'wait' : 'pointer' }}
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
          {row('한 줄 소개', draft.headline)}
          {row('교육 철학', draft.philosophy)}
          {row('경력', draft.career)}
          {row('학력', draft.education)}
          {draft.omitted.length > 0 && (
            <div style={{ marginTop: 4, padding: '8px 10px', borderRadius: 6, background: '#FFF7E6', fontSize: 12, color: '#7A4B00', lineHeight: 1.6 }}>
              <b>뺀 표현</b> (과장·근거 없는 주장으로 보여 제외했습니다)
              <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{draft.omitted.map((o) => <li key={o}>{o}</li>)}</ul>
            </div>
          )}
          <button
            type="button"
            onClick={() => onApply(draft)}
            style={{ alignSelf: 'flex-start', marginTop: 4, height: 34, padding: '0 14px', border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            칸에 채우기
          </button>
        </div>
      )}
    </div>
  );
}
