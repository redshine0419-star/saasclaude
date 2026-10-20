'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const GRADES = ['초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3'];
const input: React.CSSProperties = { height: 40, padding: '0 10px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14, background: '#FFFFFF' };

export function NewTestForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState('');
  const [minutes, setMinutes] = useState('30');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function create() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/${slug}/admin/tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, grade, timeLimitMin: minutes ? Number(minutes) : null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? '만들지 못했습니다.'); return; }
      router.push(`/${slug}/admin/tests/${data.id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 16, background: '#FFFFFF', borderRadius: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="새 시험지 이름 (예: 중2 수학 레벨테스트)" style={{ ...input, flex: 1, minWidth: 220 }} />
      <select value={grade} onChange={(e) => setGrade(e.target.value)} style={input} aria-label="학년">
        <option value="">학년</option>
        {GRADES.map((g) => <option key={g}>{g}</option>)}
      </select>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
        <input type="number" min={0} max={240} value={minutes} onChange={(e) => setMinutes(e.target.value)} style={{ ...input, width: 72 }} aria-label="제한 시간(분)" />분
      </label>
      <button type="button" disabled={busy || !title.trim()} onClick={create} style={{ height: 40, padding: '0 16px', border: 'none', borderRadius: 8, background: title.trim() ? '#1E5645' : '#9FBFB2', color: '#FFFFFF', font: 'inherit', fontWeight: 700, cursor: 'pointer' }}>
        {busy ? '만드는 중…' : '시험지 만들기'}
      </button>
      {error && <span role="alert" style={{ fontSize: 13, color: '#B42318' }}>{error}</span>}
    </div>
  );
}
