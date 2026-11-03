'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatKstDate } from '@/lib/format-date';

type Tier = { key: string; label: string; range: string; price: number };
type Sub = { status: 'active' | 'past_due' | 'canceled'; cardLabel: string; nextBillingAt: string; failCount: number; canceledAt: string | null };
type Pay = { id: string; createdAt: string; tierKey: string; activeStudents: number; amount: number; status: 'paid' | 'failed'; failReason: string | null; periodStart: string; periodEnd: string };
type Props = { slug: string; isMock: boolean; isOwner: boolean; planStatus: string; betaEndsAt: string | null; activeStudents: number; tier: Tier; tiers: Tier[]; subscription: Sub | null; payments: Pay[] };

const card: React.CSSProperties = { background: '#FFFFFF', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 };
const BTN: React.CSSProperties = { height: 42, padding: '0 18px', border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' };
const BTN_GHOST: React.CSSProperties = { ...BTN, background: '#FFFFFF', color: '#1B2430', border: '1px solid #D5D0C6', fontWeight: 500 };
const won = (n: number) => (n === 0 ? '0원' : `${n.toLocaleString('ko-KR')}원`);
const STATUS: Record<Sub['status'], [string, string, string]> = {
  active: ['정상', '#E4EEE9', '#1E5645'],
  past_due: ['결제 실패', '#FDECEA', '#B42318'],
  canceled: ['해지됨', '#EEEAE2', '#5A6270'],
};

export function BillingClient({ slug, isMock, isOwner, planStatus, betaEndsAt, activeStudents, tier, tiers, subscription: sub, payments }: Props) {
  const router = useRouter();
  const [consent, setConsent] = useState(false);
  const [testFail, setTestFail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const inBeta = planStatus === 'beta' && betaEndsAt && new Date(betaEndsAt) > new Date();
  const needsCard = !sub || sub.status !== 'active';

  async function register() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/${slug}/admin/billing/card`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ consent: true, testFail }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setMsg({ ok: false, text: data.error ?? '카드를 등록하지 못했습니다.' });
      const c = data.charged as { status: string; amount: number; reason?: string } | null;
      setMsg({
        ok: !c || c.status !== 'failed',
        text: !c
          ? `카드를 등록했습니다. 첫 결제일은 ${formatKstDate(data.nextBillingAt)}입니다.`
          : c.status === 'paid'
            ? `카드를 등록하고 ${won(c.amount)}을 결제했습니다.`
            : c.status === 'skipped'
              ? '카드를 등록했습니다. 이번 달은 무료 구간이라 결제하지 않았습니다.'
              : `카드는 등록했지만 결제에 실패했습니다 (${c.reason}). 내일 다시 시도합니다.`,
      });
      setConsent(false);
      router.refresh();
    } catch {
      setMsg({ ok: false, text: '카드를 등록하지 못했습니다.' });
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!confirm('정기결제를 해지할까요? 다음 결제일부터 청구되지 않습니다.')) return;
    setBusy(true);
    const res = await fetch(`/api/${slug}/admin/billing/cancel`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    setMsg(res.ok ? { ok: true, text: '정기결제를 해지했습니다.' } : { ok: false, text: data.error ?? '해지하지 못했습니다.' });
    router.refresh();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {isMock && (
        <div role="note" style={{ padding: '10px 14px', borderRadius: 10, background: '#FFF7E6', fontSize: 13, lineHeight: 1.6 }}>
          <b>모의 결제 중</b> — 결제 대행사 연동 전이라 실제로 청구되지 않습니다. 카드 번호도 받지 않고 테스트 카드로 흐름만 확인합니다.
        </div>
      )}

      <section style={card}>
        <div style={{ fontSize: 13, color: '#5A6270' }}>이번 달 요금</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 30, fontWeight: 800 }}>{tier.price === 0 ? '무료' : `월 ${won(tier.price)}`}</span>
          <span style={{ fontSize: 14, color: '#5A6270' }}>{tier.label} · 재원생 {activeStudents}명 ({tier.range})</span>
        </div>
        {inBeta && <div style={{ fontSize: 13, color: '#1E5645' }}>베타 기간({formatKstDate(betaEndsAt!)}까지)에는 결제하지 않습니다.</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
          {tiers.map((t) => (
            <div key={t.key} style={{ padding: '10px 12px', borderRadius: 8, background: t.key === tier.key ? '#E4EEE9' : '#F4F2EE', fontSize: 13, lineHeight: 1.5 }}>
              <b>{t.label}</b> {t.price === 0 ? '무료' : won(t.price)}
              <div style={{ color: '#5A6270' }}>{t.range}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#9AA3AF' }}>재원생 수가 바뀌면 다음 결제부터 바로 해당 구간 금액이 청구됩니다.</div>
      </section>

      <section style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>정기결제 카드</h2>
          {sub && <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: STATUS[sub.status][1], color: STATUS[sub.status][2] }}>{STATUS[sub.status][0]}</span>}
        </div>
        {sub ? (
          <div style={{ fontSize: 14, lineHeight: 1.8 }}>
            <div>{sub.cardLabel}</div>
            {sub.status === 'canceled' ? (
              <div style={{ color: '#5A6270' }}>{sub.canceledAt ? `${formatKstDate(sub.canceledAt)} 해지` : '해지됨'} — 다시 이용하려면 카드를 등록해 주세요.</div>
            ) : (
              <div style={{ color: '#5A6270' }}>
                다음 결제일 {formatKstDate(sub.nextBillingAt)}
                {sub.status === 'past_due' && ` · 결제 실패 ${sub.failCount}회 — 카드를 바꾸면 바로 다시 결제합니다`}
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 14, color: '#5A6270' }}>등록된 카드가 없습니다.</div>
        )}

        {isOwner ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8, borderTop: '1px solid #EEEAE2' }}>
            {isMock && (
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#5A6270', cursor: 'pointer' }}>
                <input type="checkbox" checked={testFail} onChange={(e) => setTestFail(e.target.checked)} />
                결제 실패 테스트 카드로 등록 (모의)
              </label>
            )}
            <label style={{ display: 'flex', flexWrap: 'nowrap', gap: 8, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.6, cursor: 'pointer' }}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ width: 18, height: 18, margin: '2px 0 0', flexShrink: 0 }} />
              {`${inBeta ? `베타 종료일(${formatKstDate(betaEndsAt!)})부터` : '오늘부터'} 매월 같은 날 재원생 수에 따른 이용료가 이 카드로 자동 결제되는 것에 동의합니다. 언제든 해지할 수 있습니다.`}
            </label>
            {/* TODO(확인 필요): 정기결제 이용약관·자동 갱신 사전 고지·무료→유료 전환 고지(전자상거래법) 문구 확정 */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={register} disabled={busy || !consent} style={{ ...BTN, opacity: consent ? 1 : 0.5 }}>
                {busy ? '처리 중…' : needsCard ? (isMock ? '테스트 카드 등록' : '카드 등록') : '카드 바꾸기'}
              </button>
              {sub && sub.status !== 'canceled' && <button type="button" onClick={cancel} disabled={busy} style={{ ...BTN_GHOST, color: '#B42318' }}>정기결제 해지</button>}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#9AA3AF' }}>결제는 원장만 관리할 수 있습니다.</div>
        )}
        {msg && <div role={msg.ok ? 'status' : 'alert'} style={{ fontSize: 14, color: msg.ok ? '#1E5645' : '#B42318' }}>{msg.text}</div>}
      </section>

      <section style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <h2 style={{ margin: 0, fontSize: 16, padding: '16px 20px 8px' }}>결제 내역</h2>
        {payments.length === 0 ? (
          <div style={{ padding: '8px 20px 20px', fontSize: 14, color: '#9AA3AF' }}>아직 결제 내역이 없습니다.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#5A6270', background: '#FAF9F6' }}>
                  {['결제일', '이용 기간', '구간', '금액', '결과'].map((h) => <th key={h} style={{ padding: '10px 16px', fontWeight: 600 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} style={{ borderTop: '1px solid #EEEAE2' }}>
                    <td style={{ padding: '10px 16px' }}>{formatKstDate(p.createdAt)}</td>
                    <td style={{ padding: '10px 16px' }}>{formatKstDate(p.periodStart)} ~ {formatKstDate(p.periodEnd)}</td>
                    <td style={{ padding: '10px 16px' }}>{tiers.find((t) => t.key === p.tierKey)?.label ?? p.tierKey} · {p.activeStudents}명</td>
                    <td style={{ padding: '10px 16px' }}>{won(p.amount)}</td>
                    <td style={{ padding: '10px 16px', color: p.status === 'paid' ? '#1E5645' : '#B42318', fontWeight: 600 }}>{p.status === 'paid' ? '완료' : `실패${p.failReason ? ` (${p.failReason})` : ''}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
