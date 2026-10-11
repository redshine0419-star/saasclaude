'use client';

import { useState } from 'react';

type Props = {
  slug: string;
  endsAtLabel: string;
  unpublishAtLabel: string;
  daysLeft: number;
  ended: boolean;
  closed: boolean;
  continueRequested: boolean;
  isOwner: boolean;
};

export function BetaBanner({ slug, endsAtLabel, unpublishAtLabel, daysLeft, ended, closed, continueRequested, isOwner }: Props) {
  const [requested, setRequested] = useState(continueRequested);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function requestContinue() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/${slug}/admin/continue`, { method: 'POST' });
      if (res.ok) setRequested(true);
      else setError((await res.json().catch(() => ({}))).error ?? '신청하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  }

  const title = closed
    ? '홈페이지가 비공개 상태입니다'
    : ended
      ? `무료 기간이 끝났습니다. ${unpublishAtLabel}에 비공개로 전환됩니다`
      : `무료 기간이 ${daysLeft}일 남았습니다 (${endsAtLabel} 종료)`;

  return (
    <section
      role="status"
      style={{ padding: '18px 20px', borderRadius: 12, background: ended || closed ? '#FDECEA' : '#FFF7E6', color: '#1B2430', display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 14, color: '#5A6270', lineHeight: 1.6 }}>
        {closed
          ? '상담 기록과 콘텐츠는 그대로 보관되어 있습니다. 계속 이용을 신청하시면 다시 공개됩니다.'
          : `종료 후 30일 동안은 그대로 공개되고, 그 뒤 비공개로 전환됩니다. 상담 기록은 언제든 내보낼 수 있습니다.`}
      </div>
      {isOwner && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {requested ? (
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1E5645' }}>계속 이용 신청이 접수되었습니다. 요금 안내를 보내드리겠습니다.</span>
          ) : (
            <button
              type="button"
              onClick={requestContinue}
              disabled={busy}
              style={{ height: 40, padding: '0 18px', border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: busy ? 'wait' : 'pointer' }}
            >
              {busy ? '신청 중…' : '계속 이용 신청'}
            </button>
          )}
          <a
            href={`/api/${slug}/admin/export`}
            style={{ height: 40, padding: '0 16px', borderRadius: 8, border: '1px solid #D5D0C6', background: '#FFFFFF', color: '#1B2430', textDecoration: 'none', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center' }}
          >
            데이터 내보내기
          </a>
          {error && <span role="alert" style={{ fontSize: 13, color: '#B42318' }}>{error}</span>}
        </div>
      )}
    </section>
  );
}
