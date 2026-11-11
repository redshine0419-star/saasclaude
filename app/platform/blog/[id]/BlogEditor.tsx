'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BLOG_CATEGORIES, BLOG_SLUG_RE, UNCHECKED_MARK } from '@/lib/blog';
import { parseMarkdown, readingMinutes } from '@/lib/blog/markdown';
import { Markdown } from '@/components/blog/Markdown';

export type EditorPost = {
  id: string; slug: string; title: string; summary: string; body: string; category: string;
  coverImage: string; seoTitle: string; status: 'draft' | 'published'; publishedAt: string | null; pinned: boolean;
};

const LABEL: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#3A4556' };
const INPUT: React.CSSProperties = { height: 42, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box', background: '#FFFFFF', fontFamily: 'inherit' };
const CARD: React.CSSProperties = { background: '#FFFFFF', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 };
const TOOL: React.CSSProperties = { height: 32, padding: '0 10px', border: '1px solid #D5D0C6', borderRadius: 6, background: '#FFFFFF', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' };

/** datetime-local 값 (한국 시간) */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
}
function fromLocalInput(v: string): string | null {
  return v ? new Date(`${v}:00+09:00`).toISOString() : null;
}

const today = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10).replace(/-/g, '');

export function BlogEditor({ post }: { post: EditorPost | null }) {
  const router = useRouter();
  const isNew = !post;
  const [f, setF] = useState<EditorPost>(post ?? { id: '', slug: `post-${today()}`, title: '', summary: '', body: '', category: 'tips', coverImage: '', seoTitle: '', status: 'draft', publishedAt: null, pinned: false });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const set = <K extends keyof EditorPost>(k: K, v: EditorPost[K]) => setF((p) => ({ ...p, [k]: v }));

  const blocks = useMemo(() => parseMarkdown(f.body), [f.body]);
  const minutes = readingMinutes(f.body);
  const slugOk = BLOG_SLUG_RE.test(f.slug);
  const unchecked = (f.title + f.summary + f.body).split(UNCHECKED_MARK).length - 1;
  const scheduled = f.status === 'published' && f.publishedAt && new Date(f.publishedAt) > new Date();

  /** 본문 커서 자리에 넣기 — 줄 단위 꾸밈은 줄 맨 앞에 */
  function insert(before: string, after = '', placeholder = '', block = false) {
    const ta = bodyRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const sel = value.slice(s, e) || placeholder;
    let pre = value.slice(0, s);
    if (block && pre && !pre.endsWith('\n\n')) pre += pre.endsWith('\n') ? '\n' : '\n\n';
    const next = `${pre}${before}${sel}${after}${block ? '\n' : ''}${value.slice(e)}`;
    set('body', next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = pre.length + before.length;
      ta.setSelectionRange(pos, pos + sel.length);
    });
  }

  async function upload(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/platform/blog/upload', { method: 'POST', body: fd });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg({ ok: false, text: d.error ?? '사진을 올리지 못했습니다.' }); return null; }
    return d.url as string;
  }

  async function pickImage(onUrl: (url: string, name: string) => void) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setBusy(true);
      const url = await upload(file).finally(() => setBusy(false));
      if (url) onUrl(url, file.name.replace(/\.[^.]+$/, ''));
    };
    input.click();
  }

  async function save(status: 'draft' | 'published') {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(isNew ? '/api/platform/blog' : `/api/platform/blog/${f.id}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, status }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ ok: false, text: d.error ?? '저장하지 못했습니다.' }); return; }
      setF((p) => ({ ...p, status, publishedAt: p.publishedAt ?? (status === 'published' ? new Date().toISOString() : null) }));
      setMsg({ ok: true, text: status === 'published' ? '공개했습니다.' : '숨김으로 저장했습니다.' });
      if (isNew) router.replace(`/platform/blog/${d.id}`);
      else router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm('이 글을 지울까요? 되돌릴 수 없습니다.')) return;
    setBusy(true);
    const res = await fetch(`/api/platform/blog/${f.id}`, { method: 'DELETE' });
    setBusy(false);
    if (res.ok) router.push('/platform/blog');
    else setMsg({ ok: false, text: '지우지 못했습니다.' });
  }

  return (
    <>
      <style>{`
        .be-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; align-items: start; }
        .be-tabs { display: none; }
        @media (max-width: 1100px) {
          .be-grid { grid-template-columns: minmax(0, 1fr); }
          .be-tabs { display: flex; }
          .be-grid[data-tab="edit"] .be-preview { display: none; }
          .be-grid[data-tab="preview"] .be-edit { display: none; }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link href="/platform/blog" style={{ fontSize: 13, color: '#5A6270', textDecoration: 'none' }}>← 블로그 글 목록</Link>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{isNew ? '새 글' : '글 고치기'}</h1>
          <div style={{ fontSize: 13, color: '#5A6270' }}>
            {f.status === 'published' ? (scheduled ? '예약 공개 — 공개 날짜가 되면 보입니다' : '공개 중') : '숨김 — 저장해도 블로그에 보이지 않습니다'}
            {' · '}읽는 시간 약 {minutes}분
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!isNew && f.status === 'published' && (
            <a href={`/blog/${f.slug}`} target="_blank" rel="noopener noreferrer" style={{ ...TOOL, height: 40, display: 'inline-flex', alignItems: 'center', textDecoration: 'none', color: '#1B2430' }}>글 보기 ↗</a>
          )}
          <button type="button" disabled={busy} onClick={() => save('draft')} style={{ ...TOOL, height: 40, fontWeight: 600 }}>
            {f.status === 'published' ? '숨기기' : '숨김으로 저장'}
          </button>
          <button type="button" disabled={busy || !slugOk || !f.title.trim() || unchecked > 0} onClick={() => save('published')} style={{ ...TOOL, height: 40, border: 'none', background: '#1E5645', color: '#FFFFFF', fontWeight: 700, opacity: busy || !slugOk || !f.title.trim() || unchecked > 0 ? 0.6 : 1 }}>
            {f.status === 'published' ? '고친 내용 공개' : '공개하기'}
          </button>
        </div>
      </div>
      {unchecked > 0 && (
        <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 14, background: '#FFF4D6', color: '#8A5A00' }}>
          확인이 필요한 문장이 {unchecked}곳 있습니다 ({UNCHECKED_MARK}). 내용을 확인하고 표시를 지워야 공개할 수 있습니다.
        </div>
      )}
      {msg && <div role="status" style={{ padding: '10px 14px', borderRadius: 8, fontSize: 14, background: msg.ok ? '#E3F1EA' : '#FDECEC', color: msg.ok ? '#1E5645' : '#B91C1C' }}>{msg.text}</div>}

      <div className="be-tabs" style={{ gap: 6 }}>
        {(['edit', 'preview'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} style={{ ...TOOL, height: 36, flex: 1, background: tab === t ? '#1B2430' : '#FFFFFF', color: tab === t ? '#FFFFFF' : '#1B2430', fontWeight: 600 }}>
            {t === 'edit' ? '쓰기' : '미리보기'}
          </button>
        ))}
      </div>

      <div className="be-grid" data-tab={tab}>
        <div className="be-edit" style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <div style={CARD}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={LABEL}>제목</span>
              <input value={f.title} onChange={(e) => set('title', e.target.value)} maxLength={120} placeholder="예: 학원 교습비 바꿀 때 해야 할 일" style={{ ...INPUT, fontSize: 16, fontWeight: 600 }} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={LABEL}>글 주소</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 13, color: '#8A93A0', whiteSpace: 'nowrap' }}>/blog/</span>
                  <input value={f.slug} onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} maxLength={80} style={{ ...INPUT, fontFamily: 'monospace', borderColor: slugOk ? '#D5D0C6' : '#DC2626' }} />
                </div>
                <span style={{ fontSize: 12, color: slugOk ? '#8A93A0' : '#B91C1C' }}>영문 소문자·숫자·하이픈. 공개 후에는 바꾸지 않는 게 좋습니다(검색·공유 링크가 끊김)</span>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={LABEL}>분류</span>
                <select value={f.category} onChange={(e) => set('category', e.target.value)} style={INPUT}>
                  {BLOG_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </label>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={LABEL}>요약 <span style={{ fontWeight: 400, color: '#8A93A0' }}>— 목록·검색 결과·카톡 공유에 보입니다 ({f.summary.length}/300)</span></span>
              <textarea value={f.summary} onChange={(e) => set('summary', e.target.value)} maxLength={300} rows={2} style={{ ...INPUT, height: 'auto', padding: 10, resize: 'vertical', lineHeight: 1.6 }} />
            </label>
          </div>

          <div style={CARD}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button type="button" style={TOOL} onClick={() => insert('## ', '', '소제목', true)}>소제목</button>
              <button type="button" style={TOOL} onClick={() => insert('### ', '', '작은 소제목', true)}>작은 소제목</button>
              <button type="button" style={{ ...TOOL, fontWeight: 700 }} onClick={() => insert('**', '**', '굵게')}>굵게</button>
              <button type="button" style={TOOL} onClick={() => insert('- ', '', '목록', true)}>목록</button>
              <button type="button" style={TOOL} onClick={() => insert('1. ', '', '순서 목록', true)}>순서</button>
              <button type="button" style={TOOL} onClick={() => insert('> ', '', '강조할 팁', true)}>팁 상자</button>
              <button type="button" style={TOOL} onClick={() => insert('[', '](https://)', '링크 글자')}>링크</button>
              <button type="button" style={TOOL} onClick={() => insert('| 항목 | 내용 |\n| --- | --- |\n| ', ' | |', '가', true)}>표</button>
              <button type="button" style={TOOL} disabled={busy} onClick={() => pickImage((url, name) => insert(`![${name}](${url})`, '', '', true))}>사진</button>
              <button type="button" style={{ ...TOOL, background: '#FFF4D6' }} onClick={() => insert('[[진단]]', '', '', true)}>무료 진단 버튼</button>
            </div>
            <textarea
              ref={bodyRef}
              value={f.body}
              onChange={(e) => set('body', e.target.value)}
              rows={26}
              placeholder={'## 소제목\n\n본문을 씁니다. **굵게**, [링크](https://growweb.me)\n\n- 목록\n\n> 팁 상자\n\n[[진단]] ← 무료 진단 버튼 자리'}
              style={{ ...INPUT, height: 'auto', minHeight: 420, padding: 12, resize: 'vertical', lineHeight: 1.7, fontFamily: "ui-monospace, 'D2Coding', monospace", fontSize: 14 }}
            />
            <div style={{ fontSize: 12, color: '#8A93A0' }}>글 끝에는 무료 진단 버튼이 자동으로 붙습니다. 글 중간에 한 번 더 넣고 싶으면 &ldquo;무료 진단 버튼&rdquo;을 누르세요.</div>
          </div>

          <div style={CARD}>
            <span style={LABEL}>대표 사진 <span style={{ fontWeight: 400, color: '#8A93A0' }}>— 목록과 카톡·카페 공유 미리보기. 가로 1200×630 권장</span></span>
            {f.coverImage ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.coverImage} alt="" style={{ width: 160, height: 84, objectFit: 'cover', borderRadius: 8, border: '1px solid #E3E7EE' }} />
                <button type="button" style={TOOL} onClick={() => pickImage((url) => set('coverImage', url))}>바꾸기</button>
                <button type="button" style={TOOL} onClick={() => set('coverImage', '')}>빼기</button>
              </div>
            ) : (
              <button type="button" style={{ ...TOOL, alignSelf: 'flex-start' }} disabled={busy} onClick={() => pickImage((url) => set('coverImage', url))}>사진 올리기</button>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={LABEL}>검색용 제목 <span style={{ fontWeight: 400, color: '#8A93A0' }}>(비우면 제목)</span></span>
                <input value={f.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} maxLength={120} style={INPUT} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={LABEL}>공개 날짜 <span style={{ fontWeight: 400, color: '#8A93A0' }}>(미래로 정하면 예약 공개)</span></span>
                <input type="datetime-local" value={toLocalInput(f.publishedAt)} onChange={(e) => set('publishedAt', fromLocalInput(e.target.value))} style={INPUT} />
              </label>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <input type="checkbox" checked={f.pinned} onChange={(e) => set('pinned', e.target.checked)} style={{ width: 18, height: 18 }} />
              블로그 목록 맨 위에 고정
            </label>
          </div>

          {!isNew && (
            <button type="button" onClick={remove} disabled={busy} style={{ ...TOOL, alignSelf: 'flex-start', color: '#B91C1C', borderColor: '#F3C4C4' }}>글 지우기</button>
          )}
        </div>

        <div className="be-preview" style={{ ...CARD, padding: '24px 26px', position: 'sticky', top: 16, maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', minWidth: 0 }}>
          <div style={{ fontSize: 12, color: '#8A93A0', fontWeight: 600 }}>미리보기</div>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.35, color: '#14213D', fontWeight: 700, wordBreak: 'keep-all' }}>{f.title || '제목'}</h1>
          {f.summary && <p style={{ margin: 0, fontSize: 16, color: '#4A5568', lineHeight: 1.7 }}>{f.summary}</p>}
          {f.body.trim() ? <Markdown blocks={blocks} /> : <div style={{ color: '#8A93A0', fontSize: 14 }}>본문을 쓰면 여기에 보입니다.</div>}
        </div>
      </div>
    </>
  );
}
