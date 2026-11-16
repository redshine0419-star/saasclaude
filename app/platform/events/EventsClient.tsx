'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatKstDate } from '@/lib/format-date';
import { EVENTS, isEventKind } from '@/lib/events';

type Claim = {
  id: string; kind: string; status: string; months: number; content: string | null; url: string | null;
  createdAt: string; reviewedAt: string | null; rejectReason: string | null; freeUntil: string | null; appliedTo: string | null;
  tenant: { name: string; slug: string; planStatus: string; betaEndsAt: string | null };
};

const BTN: React.CSSProperties = { height: 38, padding: '0 16px', border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' };
const STATUS: Record<string, [string, string, string]> = {
  pending: ['확인 중', '#FBF1CF', '#5A4A12'],
  approved: ['승인', '#E4EEE9', '#1E5645'],
  rejected: ['반려', '#FDECEA', '#B42318'],
};

function Row({ c }: { c: Claim }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const [st, bg, fg] = STATUS[c.status] ?? [c.status, '#EEE', '#333'];
  const title = c.kind === 'manual' ? '운영자 추가' : isEventKind(c.kind) ? EVENTS[c.kind].title : c.kind;

  async function act(body: object) {
    setBusy(true);
    setErr('');
    try {
      const res = await fetch(`/api/platform/events/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return setErr(d.error ?? '처리하지 못했습니다.');
      router.refresh();
    } catch {
      setErr('처리하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: bg, color: fg }}>{st}</span>
        <b style={{ fontSize: 15 }}>{c.tenant.name}</b>
        <a href={`/${c.tenant.slug}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#1D3FA8' }}>growweb.me/{c.tenant.slug}</a>
        <span style={{ fontSize: 13, color: '#5A6270' }}>· {title} ({c.months}개월) · {formatKstDate(c.createdAt)} 신청</span>
      </div>
      <div style={{ fontSize: 13, color: '#5A6270' }}>
        현재: {c.tenant.planStatus === 'paid' ? '유료 결제 중' : c.tenant.betaEndsAt ? `무료 ${formatKstDate(c.tenant.betaEndsAt)}까지` : '무료 종료일 없음'}
      </div>
      {c.content && <div style={{ padding: 12, borderRadius: 8, background: '#FAF9F6', fontSize: 14, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{c.content}</div>}
      {c.url && (
        <div style={{ fontSize: 14 }}>
          <a href={c.url} target="_blank" rel="noopener noreferrer nofollow" style={{ color: '#1D3FA8', wordBreak: 'break-all' }}>{c.url}</a>
          {c.status === 'pending' && <div style={{ marginTop: 6, fontSize: 13, color: '#5A6270', lineHeight: 1.7 }}>확인할 것: 전체 공개인지 · 더클 소개 내용인지 · <b>무료 혜택을 받았다는 문구</b>가 있는지 · 학생 개인정보가 없는지</div>}
        </div>
      )}
      {c.status === 'approved' && c.freeUntil && <div style={{ fontSize: 13, color: '#1E5645' }}>적용: {c.appliedTo === 'subscription' ? '다음 결제일' : '무료 종료일'} → {formatKstDate(c.freeUntil)}</div>}
      {c.status === 'rejected' && <div style={{ fontSize: 13, color: '#B42318' }}>반려 사유: {c.rejectReason}</div>}
      {err && <div style={{ fontSize: 13, color: '#B42318' }}>{err}</div>}
      {c.status === 'pending' && !rejecting && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" style={{ ...BTN, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={() => { if (confirm(`${c.tenant.name}에 ${c.months}개월 무료를 적용할까요?`)) act({ action: 'approve' }); }}>승인 ({c.months}개월 적용)</button>
          <button type="button" style={{ ...BTN, background: '#FFFFFF', color: '#B42318', border: '1px solid #E8C4BE' }} disabled={busy} onClick={() => setRejecting(true)}>반려</button>
        </div>
      )}
      {c.status === 'pending' && rejecting && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="반려 사유 (원장에게 보입니다)" style={{ flex: 1, minWidth: 220, height: 38, padding: '0 10px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }} />
          <button type="button" style={{ ...BTN, background: '#B42318', opacity: reason.trim() && !busy ? 1 : 0.5 }} disabled={!reason.trim() || busy} onClick={() => act({ action: 'reject', reason })}>반려하기</button>
          <button type="button" style={{ ...BTN, background: '#FFFFFF', color: '#1B2430', border: '1px solid #D5D0C6', fontWeight: 500 }} onClick={() => setRejecting(false)}>취소</button>
        </div>
      )}
    </div>
  );
}

export function EventsClient({ claims }: { claims: Claim[] }) {
  if (claims.length === 0) return <div style={{ padding: 40, borderRadius: 12, background: '#FFFFFF', textAlign: 'center', color: '#9AA3AF' }}>아직 이벤트 신청이 없습니다.</div>;
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{claims.map((c) => <Row key={c.id} c={c} />)}</div>;
}
