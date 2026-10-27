'use client';

import { useState } from 'react';
import { smsHref as buildSmsHref } from '@/lib/messaging/sms-link';

export type LeadAttempt = { id: string; testTitle: string; status: 'issued' | 'in_progress' | 'submitted'; needsGrading: boolean; score: number | null; maxScore: number | null; url: string; createdAt: string };
export type TestOption = { id: string; title: string; grade: string | null };

const STATUS_LABEL = { issued: '응시 전', in_progress: '응시 중', submitted: '제출 완료' } as const;

export function LeadLevelTest({ slug, leadId, phone, academyName, tests, attempts: initial }: {
  slug: string; leadId: string; phone: string; academyName: string; tests: TestOption[]; attempts: LeadAttempt[];
}) {
  const [attempts, setAttempts] = useState(initial);
  const [testId, setTestId] = useState(tests[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  async function issue() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/${slug}/admin/leads/${leadId}/level-test`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ testId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? '링크를 만들지 못했습니다.'); return; }
      const t = tests.find((x) => x.id === testId);
      setAttempts((a) => [{ id: data.attemptId, testTitle: t?.title ?? '', status: 'issued', needsGrading: false, score: null, maxScore: null, url: data.url, createdAt: new Date().toISOString() }, ...a]);
    } finally {
      setBusy(false);
    }
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt('아래 링크를 복사해 주세요', url);
    }
  }

  // TODO(확인 필요): 응시 링크 알림톡 템플릿 등록 후 카톡 자동 발송으로 바꾼다. 지금은 원장 휴대폰 문자앱으로 보낸다.
  const smsHref = (url: string) =>
    buildSmsHref(phone, `[${academyName}] 레벨테스트 링크입니다. 학생이 직접 풀어 주세요.\n${url}`);

  const btn: React.CSSProperties = { height: 32, padding: '0 10px', borderRadius: 6, border: '1px solid #D5D0C6', background: '#FFFFFF', color: '#1B2430', font: 'inherit', fontSize: 13, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>레벨테스트</div>
      {tests.length === 0 ? (
        <div style={{ fontSize: 13, color: '#9AA3AF' }}>
          시험지가 없습니다. <a href={`/${slug}/admin/tests`} style={{ color: '#1E5645' }}>시험지 만들기 →</a>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 6 }}>
          <select value={testId} onChange={(e) => setTestId(e.target.value)} aria-label="보낼 시험지" style={{ flex: 1, minWidth: 0, height: 36, border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14, padding: '0 8px' }}>
            {tests.map((t) => <option key={t.id} value={t.id}>{t.title}{t.grade ? ` (${t.grade})` : ''}</option>)}
          </select>
          <button type="button" disabled={busy || !testId} onClick={issue} style={{ ...btn, height: 36, background: '#1E5645', color: '#FFFFFF', border: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {busy ? '만드는 중…' : '응시 링크 만들기'}
          </button>
        </div>
      )}
      {error && <div role="alert" style={{ fontSize: 13, color: '#B42318' }}>{error}</div>}
      {attempts.map((a) => (
        <div key={a.id} style={{ padding: 10, borderRadius: 8, background: '#FAF9F6', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <b>{a.testTitle}</b>
            <span style={{ color: a.status === 'submitted' ? '#1E5645' : '#7A4B00' }}>
              {a.status === 'submitted' && a.needsGrading ? '서술형 채점 대기' : a.status === 'submitted' && a.maxScore ? `${a.score}/${a.maxScore}점 (${Math.round(((a.score ?? 0) / a.maxScore) * 100)}%)` : STATUS_LABEL[a.status]}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {a.status === 'submitted' ? (
              <>
                {a.needsGrading && <a href={`/${slug}/admin/grading/${a.id}`} style={{ ...btn, borderColor: '#B7791F', color: '#7A4B00' }}>채점하기</a>}
                <a href={`${a.url}/result`} target="_blank" rel="noopener noreferrer" style={btn}>결과지 보기</a>
              </>
            ) : (
              <>
                <button type="button" onClick={() => copy(a.url)} style={btn}>{copied === a.url ? '복사됨 ✓' : '링크 복사'}</button>
                <a href={smsHref(a.url)} style={btn}>문자로 보내기</a>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
