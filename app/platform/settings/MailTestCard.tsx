'use client';

import { useState } from 'react';

type Result = { ok: boolean; reason?: string; checks?: { apiKey: boolean; recipients: number; from: string }; error?: string };

/** 운영자 알림 메일(무료 진단·제작 대행·셀프 개설) 설정 점검 */
export function MailTestCard() {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function send() {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/platform/mail-test', { method: 'POST' });
      setResult(await res.json().catch(() => ({ ok: false, reason: `응답 오류 (${res.status})` })));
    } catch {
      setResult({ ok: false, reason: '요청을 보내지 못했습니다.' });
    } finally {
      setSending(false);
    }
  }

  return (
    <section style={{ background: '#FFFFFF', borderRadius: 12, padding: 24, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 16, fontWeight: 700 }}>알림 메일</div>
      <div style={{ fontSize: 13, color: '#5A6270', lineHeight: 1.6 }}>
        무료 진단·제작 대행 신청·셀프 개설이 들어오면 OPERATOR_NOTIFY_EMAIL로 메일을 보냅니다. 아래 버튼으로 설정을 확인하세요.
      </div>
      <button
        type="button"
        onClick={send}
        disabled={sending}
        style={{ alignSelf: 'flex-start', height: 40, padding: '0 16px', border: 'none', borderRadius: 8, background: '#1B2430', color: '#FFFFFF', font: 'inherit', fontSize: 14, fontWeight: 600, cursor: sending ? 'wait' : 'pointer' }}
      >
        {sending ? '보내는 중…' : '테스트 메일 보내기'}
      </button>
      {result && (
        <div style={{ padding: '12px 14px', borderRadius: 8, background: result.ok ? '#E4EEE9' : '#FDECEA', fontSize: 14, lineHeight: 1.7, wordBreak: 'break-word' }}>
          <b style={{ color: result.ok ? '#1E5645' : '#B42318' }}>
            {result.ok ? '발송 성공 — 메일함(스팸함 포함)을 확인하세요.' : '발송 실패'}
          </b>
          {!result.ok && (result.reason || result.error) && <div>{result.reason || result.error}</div>}
          {result.checks && (
            <div style={{ fontSize: 13, color: '#5A6270', marginTop: 4 }}>
              API 키 {result.checks.apiKey ? '있음' : '없음'} · 받는 주소 {result.checks.recipients}개 · 보내는 주소 {result.checks.from}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
