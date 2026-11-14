'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  slug: string;
  tenantName: string;
  isOwner: boolean;
  published: boolean;
  unpublishedAt: string | null;
  deletionRequestedAt: string | null;
};

const card: React.CSSProperties = { background: '#FFFFFF', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 };
const btn: React.CSSProperties = { height: 40, padding: '0 16px', borderRadius: 8, border: '1px solid #D5D0C6', background: '#FFFFFF', color: '#1B2430', font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' };
const fmt = (iso: string) => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso));

export function SiteControlCard({ slug, tenantName, isOwner, published, unpublishedAt, deletionRequestedAt }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [step, setStep] = useState<'idle' | 'confirmHide' | 'delete'>('idle');
  const [confirmName, setConfirmName] = useState('');
  const [reason, setReason] = useState('');

  async function call(path: string, method: string, body?: unknown, done?: string) {
    setBusy(true); setErr(''); setMsg('');
    try {
      const res = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? '처리하지 못했습니다.');
      setMsg(done ?? '');
      setStep('idle');
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : '처리하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={card} aria-labelledby="site-control-title">
      <div>
        <div id="site-control-title" style={{ fontSize: 16, fontWeight: 700 }}>홈페이지 공개 · 학원 삭제</div>
        <div style={{ fontSize: 13, color: '#5A6270', marginTop: 4, lineHeight: 1.6 }}>
          비공개로 두면 학부모 화면만 닫히고 관리자 화면과 데이터는 그대로 남습니다. 학원 삭제는 요청 후 더클 운영자가 확인하고 처리합니다.
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 13, fontWeight: 700, background: published ? '#E4EEE9' : '#FBF1CF', color: published ? '#1E5645' : '#7A4B00' }}>
          {published ? '공개 중' : '비공개'}
        </span>
        {!published && unpublishedAt && <span style={{ fontSize: 13, color: '#5A6270' }}>{fmt(unpublishedAt)}부터 비공개</span>}
        {isOwner && !deletionRequestedAt && (
          published ? (
            step === 'confirmHide' ? (
              <span style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13 }}>학부모가 홈페이지와 상담 신청서를 볼 수 없게 됩니다.</span>
                <button type="button" disabled={busy} style={{ ...btn, background: '#1B2430', color: '#FFFFFF', border: 'none' }} onClick={() => call(`/api/${slug}/admin/visibility`, 'POST', { published: false }, '홈페이지를 비공개로 바꿨습니다.')}>비공개로 바꾸기</button>
                <button type="button" style={btn} onClick={() => setStep('idle')}>취소</button>
              </span>
            ) : (
              <button type="button" style={btn} onClick={() => setStep('confirmHide')}>비공개로 바꾸기</button>
            )
          ) : (
            <button type="button" disabled={busy} style={{ ...btn, background: '#1E5645', color: '#FFFFFF', border: 'none' }} onClick={() => call(`/api/${slug}/admin/visibility`, 'POST', { published: true }, '홈페이지를 다시 공개했습니다.')}>다시 공개하기</button>
          )
        )}
      </div>

      <div style={{ borderTop: '1px solid #EEEAE2', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {deletionRequestedAt ? (
          <>
            <div role="status" style={{ padding: '12px 14px', borderRadius: 10, background: '#FBE9E7', color: '#8A3A1C', fontSize: 14, lineHeight: 1.6 }}>
              {fmt(deletionRequestedAt)}에 학원 삭제를 요청했습니다. 운영자가 확인 후 삭제하면 상담·학생부·글·사진이 모두 지워지고 되돌릴 수 없습니다.
              필요한 자료는 <a href={`/api/${slug}/admin/export`} style={{ color: '#8A3A1C', fontWeight: 700 }}>데이터 내보내기</a>로 받아 두세요.
            </div>
            {isOwner && (
              <div><button type="button" disabled={busy} style={btn} onClick={() => call(`/api/${slug}/admin/deletion-request`, 'DELETE', undefined, '삭제 요청을 취소했습니다. 홈페이지는 비공개 상태이니 필요하면 다시 공개해 주세요.')}>삭제 요청 취소</button></div>
            )}
          </>
        ) : isOwner ? (
          step === 'delete' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 10, background: '#FAF9F6' }}>
              <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                요청하면 홈페이지가 바로 비공개가 되고, 운영자가 확인한 뒤 <b>학원의 모든 데이터(상담·학생부·글·사진·시험 기록)를 영구 삭제</b>합니다. 결제 기록만 법에 따라 5년 보관합니다.
                삭제 전까지는 요청을 취소할 수 있습니다.
              </div>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600, color: '#5A6270' }}>
                삭제하는 이유 (선택)
                <input id="del-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} style={{ height: 40, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14, fontWeight: 400, minWidth: 0 }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600, color: '#5A6270' }}>
                확인을 위해 학원 이름 <b style={{ color: '#1B2430' }}>{tenantName}</b>을(를) 입력해 주세요
                <input id="del-confirm" value={confirmName} onChange={(e) => setConfirmName(e.target.value)} autoComplete="off" style={{ height: 40, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14, fontWeight: 400, minWidth: 0 }} />
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button type="button" disabled={busy || confirmName.trim() !== tenantName} style={{ ...btn, background: '#B42318', color: '#FFFFFF', border: 'none', opacity: confirmName.trim() !== tenantName ? 0.5 : 1 }} onClick={() => call(`/api/${slug}/admin/deletion-request`, 'POST', { confirmName, reason }, '학원 삭제를 요청했습니다.')}>학원 삭제 요청</button>
                <button type="button" style={btn} onClick={() => { setStep('idle'); setConfirmName(''); }}>취소</button>
              </div>
            </div>
          ) : (
            <div><button type="button" style={{ ...btn, color: '#B42318' }} onClick={() => setStep('delete')}>학원 삭제 요청…</button></div>
          )
        ) : (
          <div style={{ fontSize: 13, color: '#5A6270' }}>공개 전환과 학원 삭제 요청은 원장만 할 수 있습니다.</div>
        )}
      </div>

      {msg && <div role="status" style={{ fontSize: 13, color: '#1E5645' }}>{msg}</div>}
      {err && <div role="alert" style={{ fontSize: 13, color: '#B42318' }}>{err}</div>}
    </section>
  );
}
