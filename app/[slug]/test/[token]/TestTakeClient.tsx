'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MathText } from '@/components/level-test/MathText';

export type TakeQuestion = {
  id: string;
  type: 'choice' | 'short';
  body: string;
  imageUrl: string | null;
  choices: string[] | null;
  points: number;
};

type Props = {
  slug: string;
  token: string;
  academyName: string;
  title: string;
  description: string | null;
  timeLimitMin: number | null;
  startedAt: string | null;
  questions: TakeQuestion[];
  saved: Record<string, string>;
};

const font = "'IBM Plex Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif";

function formatLeft(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function TestTakeClient({ slug, token, academyName, title, description, timeLimitMin, startedAt: initialStarted, questions, saved }: Props) {
  const router = useRouter();
  const api = `/api/${slug}/test/${token}`;
  const [startedAt, setStartedAt] = useState<string | null>(initialStarted);
  const [answers, setAnswers] = useState<Record<string, string>>(saved);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [now, setNow] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const submittedRef = useRef(false);

  const deadline = startedAt && timeLimitMin ? new Date(startedAt).getTime() + timeLimitMin * 60_000 : null;
  const answered = questions.filter((q) => answers[q.id]?.trim()).length;

  const submit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    // 대기 중인 자동 저장을 먼저 보낸다
    await Promise.all(Object.entries(timers.current).map(async ([qid, t]) => {
      clearTimeout(t);
      await fetch(`${api}/answer`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId: qid, answer: answers[qid] ?? '' }) }).catch(() => {});
    }));
    const res = await fetch(`${api}/submit`, { method: 'POST' }).catch(() => null);
    if (res?.ok) {
      router.replace(`/${slug}/test/${token}/result`);
    } else {
      submittedRef.current = false;
      setSubmitting(false);
      setError('제출하지 못했습니다. 인터넷 연결을 확인하고 다시 눌러 주세요.');
    }
  }, [answers, api, router, slug, token]);

  useEffect(() => {
    if (!deadline) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [deadline]);

  useEffect(() => {
    if (deadline && now >= deadline && !submittedRef.current) void submit();
  }, [deadline, now, submit]);

  async function start() {
    setError('');
    const res = await fetch(`${api}/start`, { method: 'POST' }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (!res?.ok) { setError(data?.error ?? '시작하지 못했습니다. 다시 눌러 주세요.'); return; }
    setStartedAt(data.startedAt ?? new Date().toISOString());
    setNow(Date.now());
    window.scrollTo({ top: 0 });
  }

  function setAnswer(qid: string, value: string, delayMs: number) {
    setAnswers((a) => ({ ...a, [qid]: value }));
    setSaveState('saving');
    clearTimeout(timers.current[qid]);
    timers.current[qid] = setTimeout(async () => {
      delete timers.current[qid];
      const res = await fetch(`${api}/answer`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId: qid, answer: value }) }).catch(() => null);
      const data = await res?.json().catch(() => ({}));
      if (data?.expired) { void submit(); return; }
      setSaveState(res?.ok ? 'saved' : 'error');
    }, delayMs);
  }

  const page: React.CSSProperties = { minHeight: '100vh', background: '#F6F5F2', color: '#1B2430', fontFamily: font };
  const wrap: React.CSSProperties = { maxWidth: 680, margin: '0 auto', padding: '16px 16px 120px', display: 'flex', flexDirection: 'column', gap: 14 };

  if (!startedAt) {
    return (
      <div style={page}>
        <div style={{ ...wrap, paddingTop: 40 }}>
          <div style={{ fontSize: 14, color: '#5A6270', fontWeight: 600 }}>{academyName}</div>
          <h1 style={{ margin: 0, fontSize: 26, lineHeight: 1.3 }}>{title}</h1>
          <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 15, lineHeight: 1.7 }}>
            <div>문항 <b>{questions.length}개</b>{timeLimitMin ? <> · 제한 시간 <b>{timeLimitMin}분</b></> : ' · 시간 제한 없음'}</div>
            {description && <div style={{ whiteSpace: 'pre-wrap', color: '#3E4652' }}>{description}</div>}
            <ul style={{ margin: 0, paddingLeft: 18, color: '#5A6270', fontSize: 14 }}>
              <li>답은 고르는 즉시 저장됩니다. 화면을 닫았다가 다시 열어도 이어서 풀 수 있습니다.</li>
              {timeLimitMin ? <li>시작하면 시간이 흐르고, 시간이 끝나면 자동으로 제출됩니다.</li> : null}
              <li>모르는 문제는 비워 두셔도 됩니다.</li>
            </ul>
          </div>
          {error && <div role="alert" style={{ color: '#B42318', fontSize: 14 }}>{error}</div>}
          <button type="button" onClick={start} style={{ height: 56, border: 'none', borderRadius: 14, background: '#1E5645', color: '#FFFFFF', fontSize: 18, fontWeight: 700, fontFamily: font, cursor: 'pointer' }}>
            시작하기
          </button>
        </div>
      </div>
    );
  }

  const left = deadline ? deadline - now : null;

  return (
    <div style={page}>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: '#1B2430', color: '#FFFFFF' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: '#9AA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{academyName} · {title}</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{answered} / {questions.length} 문항 답함</div>
          </div>
          <span style={{ fontSize: 12, color: saveState === 'error' ? '#F9A8A8' : '#9AA3AF' }}>
            {saveState === 'saving' ? '저장 중…' : saveState === 'saved' ? '저장됨' : saveState === 'error' ? '저장 실패' : ''}
          </span>
          {left !== null && (
            <span aria-label="남은 시간" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: 18, padding: '4px 10px', borderRadius: 8, background: left < 60_000 ? '#B42318' : '#2C3747' }}>
              {formatLeft(left)}
            </span>
          )}
        </div>
        <div style={{ height: 3, background: '#2C3747' }}>
          <div style={{ height: 3, width: `${(answered / Math.max(1, questions.length)) * 100}%`, background: '#F2C94C' }} />
        </div>
      </header>

      <div style={wrap}>
        {questions.map((q, idx) => (
          <section key={q.id} id={`q${idx + 1}`} style={{ background: '#FFFFFF', borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#5A6270' }}>
              <b style={{ color: '#1B2430', fontSize: 16 }}>{idx + 1}.</b>
              <span>{q.points}점</span>
            </div>
            <MathText text={q.body} style={{ fontSize: 16, lineHeight: 1.75 }} />
            {q.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={q.imageUrl} alt={`${idx + 1}번 문제 그림`} style={{ maxWidth: '100%', borderRadius: 8 }} />
            )}
            {q.type === 'choice' && q.choices ? (
              <div role="radiogroup" aria-label={`${idx + 1}번 보기`} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {q.choices.map((c, ci) => {
                  const v = String(ci + 1);
                  const on = answers[q.id] === v;
                  return (
                    <button
                      key={ci}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setAnswer(q.id, on ? '' : v, 0)}
                      style={{ display: 'flex', gap: 10, alignItems: 'flex-start', textAlign: 'left', minHeight: 48, padding: '12px 14px', borderRadius: 10, border: on ? '2px solid #1E5645' : '1px solid #D5D0C6', background: on ? '#E4EEE9' : '#FFFFFF', fontFamily: font, fontSize: 15, color: '#1B2430', cursor: 'pointer' }}
                    >
                      <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 12, border: on ? 'none' : '1px solid #9AA3AF', background: on ? '#1E5645' : 'transparent', color: on ? '#FFFFFF' : '#5A6270', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{ci + 1}</span>
                      <MathText as="span" text={c} style={{ lineHeight: 1.6 }} />
                    </button>
                  );
                })}
              </div>
            ) : (
              <input
                value={answers[q.id] ?? ''}
                onChange={(e) => setAnswer(q.id, e.target.value, 700)}
                placeholder="답을 입력하세요"
                aria-label={`${idx + 1}번 답`}
                inputMode="text"
                autoComplete="off"
                style={{ height: 50, padding: '0 14px', borderRadius: 10, border: '1px solid #D5D0C6', fontSize: 17, fontFamily: font }}
              />
            )}
          </section>
        ))}
      </div>

      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, background: 'rgba(246,245,242,0.96)', borderTop: '1px solid #E2DDD2', padding: '10px 16px calc(10px + env(safe-area-inset-bottom))' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {error && <div role="alert" style={{ color: '#B42318', fontSize: 13 }}>{error}</div>}
          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              const empty = questions.length - answered;
              if (empty > 0 && !window.confirm(`아직 ${empty}문항에 답하지 않았습니다. 제출할까요?`)) return;
              void submit();
            }}
            style={{ height: 54, border: 'none', borderRadius: 14, background: '#1B2430', color: '#FFFFFF', fontSize: 17, fontWeight: 700, fontFamily: font, cursor: submitting ? 'wait' : 'pointer' }}
          >
            {submitting ? '채점 중…' : '제출하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
