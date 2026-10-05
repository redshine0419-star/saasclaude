'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Props {
  slug: string;
  tenantName: string;
  marketingCount: number;
  newLeadsCount: number;
}

const CATEGORIES = [
  { key: 'notice', label: '공지' },
  { key: 'recruit', label: '특강 모집' },
  { key: 'exam', label: '시험 대비' },
];

export function MobileWriteClient({ slug, tenantName, marketingCount, newLeadsCount }: Props) {
  const [category, setCategory] = useState('notice');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [sendKakao, setSendKakao] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!title.trim() || !body.trim()) { setError('제목과 내용을 입력해주세요.'); return; }
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('body', body.trim());
      fd.append('category', category);
      fd.append('sendKakao', String(sendKakao));
      if (imageFile) fd.append('image', imageFile);

      const res = await fetch(`/${slug}/api/posts`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? '오류가 발생했습니다.'); return; }
      setDone(true);
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const navItems = [
    { href: `/${slug}/admin`, label: '홈' },
    { href: `/${slug}/admin/leads`, label: `상담 ${newLeadsCount > 0 ? newLeadsCount : ''}`.trim() },
    { href: `/${slug}/admin/mobile`, label: '글쓰기', active: true },
    { href: `/${slug}/admin/kakao`, label: '카톡' },
  ];

  if (done) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 20, fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif" }}>
        <div style={{ paddingTop: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: '#D8E8E0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1E5645" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>올렸습니다!</div>
          {sendKakao && <div style={{ fontSize: 15, color: '#5A6270' }}>카카오톡 발송도 예약됐습니다.</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => { setDone(false); setTitle(''); setBody(''); setImageFile(null); setImagePreview(''); setSendKakao(false); }}
              style={{ height: 44, padding: '0 20px', borderRadius: 10, border: '1px solid #D5D0C6', background: '#FFFFFF', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer' }}>
              새 글 올리기
            </button>
            <Link href={`/${slug}/admin/news`}
              style={{ height: 44, padding: '0 20px', borderRadius: 10, background: '#1E5645', color: '#FFFFFF', textDecoration: 'none', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              소식 목록 보기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif", background: '#F4F2EE', minHeight: '100vh', position: 'relative', paddingBottom: 140 }}>
      {/* Header */}
      <header style={{ height: 60, boxSizing: 'border-box', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', borderBottom: '1px solid #E2DDD2', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 17, fontWeight: 700 }}>새 글 올리기</div>
        <button type="button" style={{ height: 36, padding: '0 12px', border: 'none', background: 'transparent', color: '#5A6270', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer' }}>임시저장</button>
      </header>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Category tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${CATEGORIES.length}, 1fr)`, gap: 4, padding: 4, background: '#E6E2D9', borderRadius: 10 }}>
          {CATEGORIES.map((c) => (
            <button key={c.key} type="button" onClick={() => setCategory(c.key)}
              style={{ height: 40, border: 'none', borderRadius: 8, background: category === c.key ? '#FFFFFF' : 'transparent', fontFamily: 'inherit', fontSize: 14, fontWeight: category === c.key ? 700 : 400, color: category === c.key ? '#1B2430' : '#3E4652', cursor: 'pointer' }}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Title */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>제목</span>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            style={{ height: 48, padding: '0 14px', border: '1px solid #D5D0C6', borderRadius: 10, fontFamily: 'inherit', fontSize: 16, background: '#FFFFFF' }} />
        </label>

        {/* Image */}
        <div>
          {imagePreview ? (
            <div style={{ position: 'relative' }}>
              <img src={imagePreview} alt="" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12 }} />
              <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); }}
                style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, background: 'rgba(27,36,48,0.7)', border: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
          ) : (
            <label style={{ cursor: 'pointer' }}>
              <div style={{ height: 96, border: '1px dashed #B7B0A2', borderRadius: 12, background: '#FFFFFF', color: '#3E4652', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                사진 추가 (안내문 사진도 가능)
              </div>
              <input type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
            </label>
          )}
        </div>

        {/* Body */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>내용</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)}
            placeholder="내용을 입력하세요"
            style={{ height: 140, padding: '12px 14px', border: '1px solid #D5D0C6', borderRadius: 10, fontFamily: 'inherit', fontSize: 15, background: '#FFFFFF', resize: 'vertical' }} />
        </label>

        {/* Kakao toggle */}
        <div style={{ padding: 16, background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>학부모에게 카톡으로도 보내기</div>
              <div style={{ fontSize: 13, color: '#5A6270' }}>수신 동의 {marketingCount}명 · &quot;(광고)&quot; 자동 표기</div>
            </div>
            <button
              type="button"
              onClick={() => setSendKakao(!sendKakao)}
              aria-label={sendKakao ? '카톡 발송 켜짐' : '카톡 발송 꺼짐'}
              aria-pressed={sendKakao}
              style={{ width: 52, height: 30, flexShrink: 0, border: 'none', borderRadius: 15, background: sendKakao ? '#1E5645' : '#C9C2B4', padding: 3, display: 'flex', justifyContent: sendKakao ? 'flex-end' : 'flex-start', cursor: 'pointer', transition: 'background 0.2s' }}
            >
              <span style={{ width: 24, height: 24, borderRadius: 12, background: '#FFFFFF', display: 'block' }} />
            </button>
          </div>
          {sendKakao && (
            <div style={{ fontSize: 13, color: '#3E4652' }}>야간(21시~익일 08시) 발송은 자동으로 다음날 오전 8시로 조정됩니다.</div>
          )}
        </div>

        {error && <p style={{ margin: 0, color: '#8A3A1C', fontSize: 14 }}>{error}</p>}
      </div>

      {/* Sticky bottom */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, maxWidth: 480, margin: '0 auto', background: '#FFFFFF', borderTop: '1px solid #E2DDD2' }}>
        <div style={{ padding: '12px 20px' }}>
          <button type="button" onClick={handleSubmit} disabled={loading}
            style={{ width: '100%', height: 52, border: 'none', borderRadius: 12, background: '#1E5645', color: '#FFFFFF', fontFamily: 'inherit', fontSize: 16, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? '올리는 중...' : '홈페이지에 올리기'}
          </button>
        </div>
        {/* Bottom nav */}
        <nav style={{ height: 64, paddingBottom: 12, display: 'grid', gridTemplateColumns: `repeat(${navItems.length}, 1fr)`, fontSize: 12, textAlign: 'center' }}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.active ? '#1E5645' : '#5A6270', fontWeight: item.active ? 700 : 400, textDecoration: 'none' }}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
