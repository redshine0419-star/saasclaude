'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatKstDate } from '@/lib/format-date';
import { EVENTS, isEventKind } from '@/lib/events';

export type FreePeriodInfo = {
  tenantId: string;
  planStatus: string;
  betaEndsAt: string | null;
  nextBillingAt: string | null;
  history: { id: string; kind: string; months: number; content: string | null; reviewedAt: string | null; reviewedBy: string | null; freeUntil: string | null; appliedTo: string | null }[];
};

const MONTHS = [1, 2, 3, 6, 12];
const label = (k: string) => (k === 'manual' ? '운영자 추가' : isEventKind(k) ? EVENTS[k].title : k);

/** 플랫폼 관리자 › 학원 상세 — 무료 기간 직접 추가 */
export function FreePeriodCard({ info }: { info: FreePeriodInfo }) {
  const router = useRouter();
  const [months, setMonths] = useState(1);
  const [reason, setReason] = useState('');
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const paying = info.planStatus === 'paid' && info.nextBillingAt;

  async function grant() {
    if (!reason.trim()) return setMsg({ ok: false, text: '사유를 적어 주세요.' });
    if (!confirm(`${months}개월 무료를 추가할까요?`)) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/platform/academies/${info.tenantId}/free-period`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ months, reason, notify }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return setMsg({ ok: false, text: d.error ?? '추가하지 못했습니다.' });
      setMsg({ ok: true, text: d.target === 'subscription' ? `다음 결제일을 ${formatKstDate(d.until)}로 늦췄습니다.` : `무료 기간을 ${formatKstDate(d.until)}까지 늘렸습니다.` });
      setReason('');
      router.refresh();
    } catch {
      setMsg({ ok: false, text: '추가하지 못했습니다.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 20, borderRadius: 14, background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 700 }}>무료 기간 추가</div>
      <div style={{ fontSize: 13, color: '#5A6270', lineHeight: 1.6 }}>
        {paying
          ? <>유료 결제 중 · 다음 결제일 <b style={{ color: '#1B2430' }}>{formatKstDate(info.nextBillingAt!)}</b> — 추가하면 다음 결제일이 늦춰집니다.</>
          : info.betaEndsAt
            ? <>무료 종료일 <b style={{ color: '#1B2430' }}>{formatKstDate(info.betaEndsAt)}</b>{new Date(info.betaEndsAt) < new Date() ? ' (지남 — 오늘부터 셉니다)' : ''}</>
            : '무료 종료일 없음 — 오늘부터 셉니다.'}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {MONTHS.map((m) => (
          <button key={m} type="button" onClick={() => setMonths(m)} style={{ height: 34, padding: '0 12px', borderRadius: 8, border: months === m ? '2px solid #1E5645' : '1px solid #D5D0C6', background: months === m ? '#E4EEE9' : '#FFFFFF', color: '#1B2430', font: 'inherit', fontSize: 13, fontWeight: months === m ? 700 : 500, cursor: 'pointer' }}>
            {m}개월
          </button>
        ))}
      </div>
      <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="사유 (예: 설명회 참석, 장애 보상) — 운영 기록용" style={{ height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid #D5D0C6', font: 'inherit', fontSize: 13 }} />
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
        원장에게 알림 보내기 (알림함·앱 알림·메일)
      </label>
      {msg && <div style={{ fontSize: 13, color: msg.ok ? '#1E5645' : '#B42318' }}>{msg.text}</div>}
      <button type="button" disabled={busy} onClick={grant} style={{ height: 40, border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 14, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1 }}>
        {busy ? '추가하는 중…' : `${months}개월 추가`}
      </button>

      {info.history.length > 0 && (
        <div style={{ borderTop: '1px solid #EEEAE2', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#5A6270' }}>추가 기록</div>
          {info.history.map((h) => (
            <div key={h.id} style={{ fontSize: 12, color: '#3E4652', lineHeight: 1.6 }}>
              {h.reviewedAt ? formatKstDate(h.reviewedAt) : ''} · <b>{label(h.kind)}</b> +{h.months}개월
              {h.freeUntil && <> → {h.appliedTo === 'subscription' ? '결제일' : '무료'} {formatKstDate(h.freeUntil)}</>}
              {h.kind === 'manual' && h.content && <div style={{ color: '#8A93A8' }}>{h.content}{h.reviewedBy ? ` (${h.reviewedBy})` : ''}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
