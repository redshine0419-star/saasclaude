'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type PendingItem = {
  id: string;
  createdAt: string;
  studentName: string;
  grade: string | null;
  school: string | null;
  parentName: string;
  parentPhoneMasked: string;
  memo: string | null;
};
type Props = {
  slug: string;
  linkUrl: string | null;
  isOwner: boolean;
  pending: PendingItem[];
  classes: { id: string; name: string }[];
};

const btn: React.CSSProperties = { height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid #D5D0C6', background: '#FFFFFF', color: '#1B2430', font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' };
const primary: React.CSSProperties = { ...btn, border: 'none', background: '#1E5645', color: '#FFFFFF' };

export default function JoinPanel({ slug, linkUrl, isOwner, pending, classes }: Props) {
  const router = useRouter();
  const [url, setUrl] = useState(linkUrl);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');
  const [classOf, setClassOf] = useState<Record<string, string>>({});

  async function call(key: string, path: string, method: string, body?: unknown) {
    setBusy(key);
    setMsg('');
    try {
      const res = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? '처리하지 못했습니다.');
      return j;
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '처리하지 못했습니다.');
      return null;
    } finally {
      setBusy('');
    }
  }

  async function issue() {
    if (url && !confirm('새 링크를 만들면 지금 링크는 바로 쓸 수 없게 됩니다. 계속할까요?')) return;
    const j = await call('issue', `/api/${slug}/admin/students/join-link`, 'POST');
    if (j) { setUrl(j.url); setMsg('새 등록 링크를 만들었습니다.'); }
  }
  async function disable() {
    if (!confirm('등록 링크를 끄면 학부모가 더 이상 제출할 수 없습니다. 끌까요?')) return;
    const j = await call('off', `/api/${slug}/admin/students/join-link`, 'DELETE');
    if (j) { setUrl(null); setMsg('등록 링크를 껐습니다.'); }
  }
  async function copy() {
    if (!url) return;
    try { await navigator.clipboard.writeText(url); setMsg('링크를 복사했습니다. 문자·카톡으로 학부모에게 보내 주세요.'); }
    catch { setMsg('복사하지 못했습니다. 링크를 길게 눌러 복사해 주세요.'); }
  }
  async function approve(id: string) {
    const j = await call(id, `/api/${slug}/admin/students/registrations/${id}`, 'POST', { classId: classOf[id] || null });
    if (j) router.refresh();
  }
  async function reject(id: string, name: string) {
    if (!confirm(`${name} 학생의 등록 요청을 거절하고 바로 삭제할까요?`)) return;
    const j = await call(id, `/api/${slug}/admin/students/registrations/${id}`, 'DELETE');
    if (j) router.refresh();
  }

  const smsHref = url ? `sms:?&body=${encodeURIComponent(`[학생 등록 안내] 아래 링크에서 학생 정보를 입력해 주세요.\n${url}`)}` : '';

  return (
    <section style={{ background: '#FFFFFF', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>학부모 등록 링크</div>
          <div style={{ fontSize: 13, color: '#5A6270', marginTop: 2 }}>링크를 받은 학부모가 학생 정보와 개인정보 동의를 직접 입력합니다. 확인 후 승인하면 학생부에 등록됩니다.</div>
        </div>
      </div>

      {url ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="학부모 등록 링크" style={{ flex: '1 1 260px', minWidth: 0, height: 36, padding: '0 10px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 13, background: '#FAF9F6' }} />
          <button type="button" onClick={copy} style={primary}>링크 복사</button>
          <a href={smsHref} style={{ ...btn, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>문자로 보내기</a>
          {isOwner && <button type="button" onClick={issue} disabled={!!busy} style={btn}>새 링크로 바꾸기</button>}
          {isOwner && <button type="button" onClick={disable} disabled={!!busy} style={{ ...btn, color: '#B42318' }}>끄기</button>}
        </div>
      ) : isOwner ? (
        <div><button type="button" onClick={issue} disabled={!!busy} style={primary}>등록 링크 만들기</button></div>
      ) : (
        <div style={{ fontSize: 13, color: '#5A6270' }}>아직 등록 링크가 없습니다. 원장님이 만들 수 있습니다.</div>
      )}

      {msg && <div role="status" style={{ fontSize: 13, color: '#1E5645' }}>{msg}</div>}

      {pending.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid #EEEAE2', paddingTop: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>등록 대기 {pending.length}명 <span style={{ fontWeight: 400, fontSize: 12, color: '#5A6270' }}>· 승인하지 않으면 30일 뒤 자동 삭제</span></div>
          {pending.map((p) => (
            <div key={p.id} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', padding: '10px 12px', borderRadius: 10, background: '#FAF9F6' }}>
              <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{p.studentName} <span style={{ fontWeight: 400, color: '#5A6270', fontSize: 13 }}>{[p.grade, p.school].filter(Boolean).join(' · ')}</span></div>
                <div style={{ fontSize: 13, color: '#5A6270' }}>학부모 {p.parentName} · {p.parentPhoneMasked} · {p.createdAt} 제출</div>
                {p.memo && <div style={{ fontSize: 13, marginTop: 2, wordBreak: 'break-all' }}>“{p.memo}”</div>}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap', alignItems: 'center' }}>
                {classes.length > 0 && (
                  <select value={classOf[p.id] ?? ''} onChange={(e) => setClassOf({ ...classOf, [p.id]: e.target.value })} aria-label="반 배정" style={{ height: 36, maxWidth: 140, padding: '0 8px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 13, background: '#FFFFFF' }}>
                    <option value="">반 미배정</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
                <button type="button" onClick={() => approve(p.id)} disabled={!!busy} style={primary}>{busy === p.id ? '…' : '승인'}</button>
                <button type="button" onClick={() => reject(p.id, p.studentName)} disabled={!!busy} style={btn}>거절</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
