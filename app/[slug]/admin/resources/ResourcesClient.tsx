'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type FileRow = { url: string; name: string; size: number; type: string };
export type ResourceRow = {
  id: string;
  title: string;
  body: string;
  files: FileRow[];
  visibility: 'public' | 'link';
  pinned: boolean;
  createdAt: string;
  shareUrl: string;
};

const MAX_FILES = 5;
const ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.hwp,.hwpx,.docx,.xlsx,.pptx';
const input: React.CSSProperties = { width: '100%', minWidth: 0, boxSizing: 'border-box', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14, padding: '10px 12px', background: '#FFFFFF' };
const btn: React.CSSProperties = { height: 38, padding: '0 14px', borderRadius: 8, border: '1px solid #D5D0C6', background: '#FFFFFF', color: '#1B2430', font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' };
const primary: React.CSSProperties = { ...btn, border: 'none', background: '#1E5645', color: '#FFFFFF' };
const fmtDate = (iso: string) => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
const size = (b: number) => (!b ? '' : b < 1048576 ? `${Math.max(1, Math.round(b / 1024))}KB` : `${(b / 1048576).toFixed(1)}MB`);

type Draft = { id: string | null; title: string; body: string; files: FileRow[]; visibility: 'public' | 'link'; pinned: boolean };
const empty: Draft = { id: null, title: '', body: '', files: [], visibility: 'public', pinned: false };

export function ResourcesClient({ slug, rows }: { slug: string; rows: ResourceRow[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  async function upload(picked: File[]) {
    if (picked.length === 0 || !draft) return;
    setErr('');
    const room = MAX_FILES - draft.files.length;
    const list = picked.slice(0, room);
    if (picked.length > room) setErr(`첨부 파일은 ${MAX_FILES}개까지 올릴 수 있습니다.`);
    setUploading(true);
    const added: FileRow[] = [];
    for (const f of list) {
      const fd = new FormData();
      fd.append('file', f);
      const res = await fetch(`/api/${slug}/admin/resources/upload`, { method: 'POST', body: fd }).catch(() => null);
      const j = await res?.json().catch(() => ({}));
      if (res?.ok && j?.url) added.push(j as FileRow);
      else { setErr(j?.error ?? `${f.name}을(를) 올리지 못했습니다.`); break; }
    }
    setDraft((d) => (d ? { ...d, files: [...d.files, ...added] } : d));
    setUploading(false);
  }

  async function save() {
    if (!draft) return;
    setSaving(true); setErr('');
    const res = await fetch(draft.id ? `/api/${slug}/admin/resources/${draft.id}` : `/api/${slug}/admin/resources`, {
      method: draft.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    }).catch(() => null);
    const j = await res?.json().catch(() => ({}));
    setSaving(false);
    if (!res?.ok) return setErr(j?.error ?? '저장하지 못했습니다.');
    setMsg(draft.id ? '자료를 고쳤습니다.' : '자료를 올렸습니다.');
    setDraft(null);
    router.refresh();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/${slug}/admin/resources/${id}`, { method: 'DELETE' }).catch(() => null);
    setConfirmDel(null);
    if (!res?.ok) return setErr('지우지 못했습니다.');
    setMsg('자료를 지웠습니다.');
    router.refresh();
  }

  async function copy(url: string) {
    try { await navigator.clipboard.writeText(url); setMsg('공유 링크를 복사했습니다. 문자·카톡으로 학부모에게 보내 주세요.'); }
    catch { setErr('복사하지 못했습니다. 링크를 길게 눌러 복사해 주세요.'); }
  }

  return (
    <>
      {msg && <div role="status" style={{ padding: '10px 14px', borderRadius: 10, background: '#E4EEE9', color: '#1E5645', fontSize: 14 }}>{msg}</div>}
      {err && !draft && <div role="alert" style={{ padding: '10px 14px', borderRadius: 10, background: '#FBE9E7', color: '#B42318', fontSize: 14 }}>{err}</div>}

      {draft ? (
        <section style={{ background: '#FFFFFF', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{draft.id ? '자료 고치기' : '새 자료 올리기'}</div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: '#5A6270' }}>
            제목
            <input id="res-title" value={draft.title} maxLength={100} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="예: 11월 가정통신문" style={input} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: '#5A6270' }}>
            설명 <span style={{ fontWeight: 400 }}>(선택)</span>
            <textarea id="res-body" value={draft.body} maxLength={5000} rows={4} onChange={(e) => setDraft({ ...draft, body: e.target.value })} style={{ ...input, resize: 'vertical' }} />
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>첨부 파일 <span style={{ fontWeight: 400 }}>(PDF·사진·한글·워드·엑셀·파워포인트, 파일당 10MB, {MAX_FILES}개까지)</span></span>
            {draft.files.map((f, i) => (
              <div key={f.url} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: '#FAF9F6', fontSize: 14, minWidth: 0 }}>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                <span style={{ fontSize: 12, color: '#9AA3AF' }}>{size(f.size)}</span>
                <button type="button" onClick={() => setDraft({ ...draft, files: draft.files.filter((_, j) => j !== i) })} style={{ ...btn, height: 30, color: '#B42318' }}>빼기</button>
              </div>
            ))}
            {draft.files.length < MAX_FILES && (
              <label style={{ ...btn, display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start', cursor: uploading ? 'wait' : 'pointer' }}>
                {uploading ? '올리는 중…' : '+ 파일 추가'}
                <input type="file" accept={ACCEPT} multiple disabled={uploading} onChange={(e) => { const picked = Array.from(e.target.files ?? []); e.target.value = ''; void upload(picked); }} style={{ display: 'none' }} />
              </label>
            )}
          </div>

          <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <legend style={{ fontSize: 13, fontWeight: 600, color: '#5A6270', marginBottom: 6 }}>공개 범위</legend>
            {([['public', '홈페이지 자료실에 공개', '누구나 홈페이지 자료실에서 보고 내려받습니다.'], ['link', '링크로만 공유', '목록에 보이지 않고, 원장님이 보낸 링크를 아는 사람만 엽니다. 재원생 가정통신문 등에 쓰세요.']] as const).map(([v, label, desc]) => (
              <label key={v} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14, cursor: 'pointer' }}>
                <input type="radio" name="res-vis" checked={draft.visibility === v} onChange={() => setDraft({ ...draft, visibility: v })} style={{ marginTop: 3 }} />
                <span><b>{label}</b><span style={{ display: 'block', fontSize: 12, color: '#5A6270' }}>{desc}</span></span>
              </label>
            ))}
          </fieldset>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={draft.pinned} onChange={(e) => setDraft({ ...draft, pinned: e.target.checked })} /> 목록 맨 위에 고정
          </label>
          <div style={{ fontSize: 12, color: '#8A3A1C', background: '#FFF7E6', padding: '8px 10px', borderRadius: 8 }}>
            학생 이름·연락처·성적이 담긴 파일은 올리지 마세요. 홈페이지 공개 자료는 누구나 볼 수 있습니다.
          </div>
          {err && <div role="alert" style={{ fontSize: 13, color: '#B42318' }}>{err}</div>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={save} disabled={saving || uploading} style={{ ...primary, opacity: saving || uploading ? 0.6 : 1 }}>{saving ? '저장 중…' : draft.id ? '저장' : '올리기'}</button>
            <button type="button" onClick={() => { setDraft(null); setErr(''); }} style={btn}>취소</button>
          </div>
        </section>
      ) : (
        <div><button type="button" onClick={() => { setDraft({ ...empty }); setMsg(''); setErr(''); }} style={primary}>+ 새 자료 올리기</button></div>
      )}

      {rows.length === 0 ? (
        <div style={{ padding: 40, background: '#FFFFFF', borderRadius: 12, textAlign: 'center', color: '#9AA3AF' }}>아직 올린 자료가 없습니다.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((r) => (
            <article key={r.id} style={{ background: '#FFFFFF', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {r.pinned && <span style={{ padding: '2px 8px', borderRadius: 6, background: '#FBF1CF', color: '#7A4B00', fontSize: 12, fontWeight: 700 }}>고정</span>}
                <span style={{ padding: '2px 8px', borderRadius: 6, background: r.visibility === 'public' ? '#E4EEE9' : '#E6E9EE', color: r.visibility === 'public' ? '#1E5645' : '#2C3747', fontSize: 12, fontWeight: 700 }}>{r.visibility === 'public' ? '공개' : '링크 공유'}</span>
                <b style={{ fontSize: 15, flex: '1 1 200px', minWidth: 0 }}>{r.title}</b>
                <span style={{ fontSize: 12, color: '#9AA3AF' }}>{fmtDate(r.createdAt)}</span>
              </div>
              {r.files.length > 0 && <div style={{ fontSize: 13, color: '#5A6270', overflowWrap: 'anywhere' }}>첨부 {r.files.length}개 · {r.files.map((f) => f.name).join(', ')}</div>}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => copy(r.shareUrl)} style={btn}>{r.visibility === 'link' ? '공유 링크 복사' : '링크 복사'}</button>
                <a href={`sms:?&body=${encodeURIComponent(`[자료] ${r.title}\n${r.shareUrl}`)}`} style={{ ...btn, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>문자로 보내기</a>
                <button type="button" onClick={() => { setDraft({ id: r.id, title: r.title, body: r.body, files: r.files, visibility: r.visibility, pinned: r.pinned }); setMsg(''); setErr(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={btn}>고치기</button>
                {confirmDel === r.id ? (
                  <>
                    <button type="button" onClick={() => remove(r.id)} style={{ ...btn, background: '#B42318', color: '#FFFFFF', border: 'none' }}>정말 지우기</button>
                    <button type="button" onClick={() => setConfirmDel(null)} style={btn}>취소</button>
                  </>
                ) : (
                  <button type="button" onClick={() => setConfirmDel(r.id)} style={{ ...btn, color: '#B42318' }}>지우기</button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
