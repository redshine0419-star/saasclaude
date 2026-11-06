'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type HiddenRow = {
  id: string;
  slug: string;
  name: string;
  reason: string;
  hiddenSince: string;
  hiddenDays: number;
  exactSince: boolean;
  deletionRequestedAt: string | null;
  deletionRequestedBy: string | null;
  deletionReason: string | null;
  leads: number;
  students: number;
  canRestore: boolean;
  isDemo: boolean;
};

const th: React.CSSProperties = { padding: '12px 14px', fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '12px 14px', borderTop: '1px solid #EEEAE2', verticalAlign: 'top' };
const btn: React.CSSProperties = { height: 34, padding: '0 12px', borderRadius: 8, border: '1px solid #D5D0C6', background: '#FFFFFF', font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' };
const fmt = (iso: string) => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));

export function HiddenClient({ rows }: { rows: HiddenRow[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'request' | 'long'>('all');
  const [purgeId, setPurgeId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const shown = rows.filter((r) => (filter === 'request' ? !!r.deletionRequestedAt : filter === 'long' ? r.hiddenDays >= 30 : true));

  async function call(id: string, path: string, method: string, body: unknown, done: string) {
    setBusy(id); setErr(''); setMsg('');
    try {
      const res = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? '처리하지 못했습니다.');
      setMsg(done);
      setPurgeId(null); setConfirm('');
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : '처리하지 못했습니다.');
    } finally {
      setBusy('');
    }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {([['all', `전체 ${rows.length}`], ['request', `삭제 요청 ${rows.filter((r) => r.deletionRequestedAt).length}`], ['long', `30일 이상 ${rows.filter((r) => r.hiddenDays >= 30).length}`]] as const).map(([k, label]) => (
          <button key={k} type="button" onClick={() => setFilter(k)} aria-pressed={filter === k} style={{ ...btn, borderRadius: 17, background: filter === k ? '#1B2430' : '#FFFFFF', color: filter === k ? '#FFFFFF' : '#1B2430' }}>{label}</button>
        ))}
      </div>
      {msg && <div role="status" style={{ padding: '10px 14px', borderRadius: 10, background: '#E4EEE9', color: '#1E5645', fontSize: 14 }}>{msg}</div>}
      {err && <div role="alert" style={{ padding: '10px 14px', borderRadius: 10, background: '#FBE9E7', color: '#B42318', fontSize: 14 }}>{err}</div>}

      {shown.length === 0 ? (
        <div style={{ padding: 40, background: '#FFFFFF', borderRadius: 12, textAlign: 'center', color: '#9AA3AF' }}>해당하는 학원이 없습니다.</div>
      ) : (
        <div style={{ background: '#FFFFFF', borderRadius: 12, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 820 }}>
            <thead>
              <tr style={{ color: '#5A6270', background: '#FAF9F6' }}>
                {['학원', '사유', '비공개 시작', '비공개 기간', '데이터', '삭제 요청', ''].map((h) => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id}>
                  <td style={td}>
                    <b>{r.name}</b>
                    <div style={{ fontSize: 12, color: '#5A6270' }}>/{r.slug}</div>
                  </td>
                  <td style={td}>{r.reason}</td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>{fmt(r.hiddenSince)}{!r.exactSince && <div style={{ fontSize: 11, color: '#9AA3AF' }}>기록 전 · 추정</div>}</td>
                  <td style={{ ...td, whiteSpace: 'nowrap', fontWeight: 700, color: r.hiddenDays >= 30 ? '#8A3A1C' : '#1B2430' }}>{r.hiddenDays}일</td>
                  <td style={{ ...td, whiteSpace: 'nowrap', fontSize: 13, color: '#5A6270' }}>상담 {r.leads} · 학생 {r.students}</td>
                  <td style={{ ...td, fontSize: 13 }}>
                    {r.deletionRequestedAt ? (
                      <>
                        <span style={{ padding: '2px 8px', borderRadius: 6, background: '#FBE9E7', color: '#B42318', fontWeight: 700, fontSize: 12 }}>{fmt(r.deletionRequestedAt)} 요청</span>
                        {r.deletionRequestedBy && <div style={{ color: '#5A6270', marginTop: 4 }}>{r.deletionRequestedBy}</div>}
                        {r.deletionReason && <div style={{ marginTop: 2 }}>“{r.deletionReason}”</div>}
                      </>
                    ) : '–'}
                  </td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>
                    {purgeId === r.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
                        <span style={{ fontSize: 12, color: '#B42318', whiteSpace: 'normal' }}>상담·학생부·글·사진이 모두 영구 삭제됩니다. 확인하려면 <b>{r.slug}</b> 입력</span>
                        <input value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-label="학원 주소 확인" autoComplete="off" style={{ height: 32, padding: '0 8px', border: '1px solid #D5D0C6', borderRadius: 6, font: 'inherit', fontSize: 13 }} />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button type="button" disabled={busy === r.id || confirm !== r.slug} style={{ ...btn, background: '#B42318', color: '#FFFFFF', border: 'none', opacity: confirm !== r.slug ? 0.5 : 1 }} onClick={() => call(r.id, `/api/platform/academies/${r.id}/purge`, 'POST', { confirmSlug: confirm }, `${r.name}을(를) 영구 삭제했습니다.`)}>
                            {busy === r.id ? '삭제 중…' : '영구 삭제'}
                          </button>
                          <button type="button" style={btn} onClick={() => { setPurgeId(null); setConfirm(''); }}>취소</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 6 }}>
                        {!r.deletionRequestedAt && (
                          <button type="button" disabled={!!busy} style={btn} onClick={() => call(r.id, `/api/platform/academies/${r.id}`, 'PATCH', { status: 'active', published: true }, `${r.name} 홈페이지를 다시 공개했습니다.`)}>다시 공개</button>
                        )}
                        {!r.isDemo && <button type="button" disabled={!!busy} style={{ ...btn, color: '#B42318' }} onClick={() => { setPurgeId(r.id); setConfirm(''); }}>삭제…</button>}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
