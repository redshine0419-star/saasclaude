'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export type StudentAttemptRow = { id: string; title: string; url: string; createdAt: string; state: string; submitted: boolean; needsGrading: boolean };

const BTN: React.CSSProperties = { height: 34, padding: '0 12px', borderRadius: 8, border: '1px solid #D5D0C6', background: '#FFFFFF', font: 'inherit', fontSize: 13, cursor: 'pointer', color: '#1B2430', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' };
const fmt = (iso: string) => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' }).format(new Date(iso));

/** 학생 상세 › 시험 보내기 — 응시 링크를 만들면 '보낼 문자'에 학생 번호로 시험 링크 문자가 올라간다 */
export function StudentTestsPanel({ slug, studentId, studentName, tests, attempts }: { slug: string; studentId: string; studentName: string; tests: { id: string; title: string }[]; attempts: StudentAttemptRow[] }) {
  const router = useRouter();
  const [testId, setTestId] = useState(tests[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function issue() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/${slug}/admin/students/${studentId}/tests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ testId }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ ok: false, text: d.error ?? '만들지 못했습니다.' }); return; }
      setMsg({ ok: true, text: d.reused ? '아직 풀지 않은 같은 시험 링크가 있어 그 링크로 문자를 준비했습니다.' : '시험 링크를 만들고 보낼 문자를 준비했습니다.' });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ marginTop: 16, background: '#FFFFFF', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>시험 보내기</div>
        <div style={{ fontSize: 13, color: '#5A6270', marginTop: 4, lineHeight: 1.6 }}>
          {studentName} 학생에게 온라인 시험 링크를 보냅니다. 문자는 학생 번호로(없으면 학부모 번호로) &ldquo;✉️ 보낼 문자&rdquo;에 준비됩니다. 제출하면 자동 채점되어 아래 성적(학원 테스트)에 들어갑니다.
        </div>
      </div>
      {tests.length === 0 ? (
        <div style={{ fontSize: 14, color: '#5A6270' }}>보낼 시험지가 없습니다. <Link href={`/${slug}/admin/tests`} style={{ color: '#1E5645' }}>시험지 만들기 →</Link></div>
      ) : (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={testId} onChange={(e) => setTestId(e.target.value)} aria-label="시험지" style={{ ...BTN, height: 38, flex: '1 1 220px', minWidth: 0 }}>
            {tests.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          <button type="button" disabled={busy || !testId} onClick={issue} style={{ ...BTN, height: 38, border: 'none', background: '#1E5645', color: '#FFFFFF', fontWeight: 700, opacity: busy ? 0.6 : 1 }}>
            {busy ? '만드는 중…' : '시험 링크 문자 준비'}
          </button>
        </div>
      )}
      {msg && (
        <div role="status" style={{ padding: '10px 14px', borderRadius: 8, fontSize: 14, background: msg.ok ? '#E3F1EA' : '#FDECEC', color: msg.ok ? '#1E5645' : '#B91C1C' }}>
          {msg.text} {msg.ok && <Link href={`/${slug}/admin/sms`} style={{ color: '#1E5645', fontWeight: 700 }}>보낼 문자로 가기 →</Link>}
        </div>
      )}
      {attempts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {attempts.map((a) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '10px 12px', borderRadius: 8, background: '#FAF9F6', fontSize: 14 }}>
              <b style={{ flex: '1 1 160px', minWidth: 0 }}>{a.title}</b>
              <span style={{ fontSize: 12, color: '#8A93A0' }}>{fmt(a.createdAt)} 보냄</span>
              <span style={{ fontWeight: 600, color: a.submitted ? '#1E5645' : '#8A5A00' }}>{a.state}</span>
              {a.submitted ? (
                <>
                  {a.needsGrading && <Link href={`/${slug}/admin/grading/${a.id}`} style={{ ...BTN, borderColor: '#B7791F', color: '#7A4B00' }}>채점하기</Link>}
                  <a href={`${a.url}/result`} target="_blank" rel="noopener noreferrer" style={BTN}>결과지</a>
                </>
              ) : (
                <button type="button" style={BTN} onClick={async () => { await navigator.clipboard?.writeText(a.url).catch(() => undefined); setCopied(a.id); window.setTimeout(() => setCopied(null), 2000); }}>
                  {copied === a.id ? '복사됨 ✓' : '링크 복사'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
