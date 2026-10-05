'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Post = {
  id: string;
  title: string;
  body: string;
  category: string;
  status: string;
  sendKakao: boolean;
  kakaoScheduledAt: string | null;
  publishedAt: string | null;
};

const CATEGORY_OPTIONS = [
  { value: 'notice', label: '공지' },
  { value: 'recruit', label: '특강 모집' },
  { value: 'exam', label: '시험 대비' },
];

export function NewsEditClient({ slug, post }: { slug: string; post?: Post }) {
  const router = useRouter();
  const isEdit = !!post;

  const [title, setTitle] = useState(post?.title ?? '');
  const [body, setBody] = useState(post?.body ?? '');
  const [category, setCategory] = useState(post?.category ?? 'notice');
  const [sendKakao, setSendKakao] = useState(post?.sendKakao ?? false);
  const [kakaoScheduledAt, setKakaoScheduledAt] = useState(
    post?.kakaoScheduledAt ? post.kakaoScheduledAt.slice(0, 16) : '',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(status: 'published' | 'draft') {
    if (!title.trim()) { setError('제목을 입력하세요.'); return; }
    if (!body.trim()) { setError('본문을 입력하세요.'); return; }
    setError('');
    setSaving(true);

    const payload: Record<string, unknown> = {
      title: title.trim(),
      body: body.trim(),
      category,
      status,
      sendKakao,
      kakaoScheduledAt: sendKakao && kakaoScheduledAt ? kakaoScheduledAt : null,
    };

    try {
      const url = isEdit
        ? `/api/${slug}/admin/news/${post.id}`
        : `/api/${slug}/admin/news`;
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? '저장 실패');
      }
      router.push(`/${slug}/admin/news`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 중 오류가 발생했습니다.');
      setSaving(false);
    }
  }

  async function deletePost() {
    if (!isEdit) return;
    if (!confirm('이 글을 삭제하시겠습니까?')) return;
    setSaving(true);
    try {
      await fetch(`/api/${slug}/admin/news/${post.id}`, { method: 'DELETE' });
      router.push(`/${slug}/admin/news`);
      router.refresh();
    } catch {
      setError('삭제 중 오류가 발생했습니다.');
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #D8D3CA',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "inherit",
    background: '#FFFFFF',
    color: '#1B2430',
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        maxWidth: 760,
      }}
    >
      {/* Category */}
      <div style={{ display: 'flex', gap: 8 }}>
        {CATEGORY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setCategory(opt.value)}
            style={{
              padding: '8px 16px',
              borderRadius: 20,
              border: '1px solid',
              borderColor: category === opt.value ? '#1E5645' : '#D8D3CA',
              background: category === opt.value ? '#1E5645' : '#FFFFFF',
              color: category === opt.value ? '#FFFFFF' : '#3E4652',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Title */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#3E4652' }}>
          제목 *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 2학기 특강 모집 안내"
          style={inputStyle}
          maxLength={100}
        />
        <div style={{ fontSize: 12, color: '#9AA3AF', marginTop: 4 }}>{title.length}/100</div>
      </div>

      {/* Body */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#3E4652' }}>
          본문 *
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="내용을 입력하세요."
          rows={14}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
        />
        <div style={{ fontSize: 12, color: '#9AA3AF', marginTop: 4 }}>{body.length}자</div>
      </div>

      {/* Kakao toggle */}
      <div
        style={{
          padding: '18px 20px',
          background: '#FFFFFF',
          border: '1px solid #D8D3CA',
          borderRadius: 10,
        }}
      >
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        >
          <input
            type="checkbox"
            checked={sendKakao}
            onChange={(e) => setSendKakao(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: '#1E5645', cursor: 'pointer' }}
          />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1B2430' }}>
            카카오톡 발송 (마케팅 동의자 대상)
          </span>
        </label>

        {sendKakao && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #EEEAE2' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#3E4652' }}>
              예약 발송 시간 <span style={{ fontWeight: 400, color: '#9AA3AF' }}>(비워두면 즉시 발송)</span>
            </label>
            <input
              type="datetime-local"
              value={kakaoScheduledAt}
              onChange={(e) => setKakaoScheduledAt(e.target.value)}
              style={{ ...inputStyle, width: 'auto' }}
              min={new Date().toISOString().slice(0, 16)}
            />
            <div style={{ fontSize: 12, color: '#9AA3AF', marginTop: 6 }}>
              21:00~08:00 예약 시 야간 미동의자는 다음날 08:00 이후로 자동 조정됩니다.
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            background: '#FDE8E8',
            color: '#B91C1C',
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => submit('published')}
            disabled={saving}
            style={{
              height: 44,
              padding: '0 24px',
              borderRadius: 8,
              background: '#1E5645',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? '저장 중…' : '게시하기'}
          </button>
          <button
            onClick={() => submit('draft')}
            disabled={saving}
            style={{
              height: 44,
              padding: '0 20px',
              borderRadius: 8,
              background: '#FFFFFF',
              color: '#3E4652',
              border: '1px solid #D8D3CA',
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            임시저장
          </button>
        </div>

        {isEdit && (
          <button
            onClick={deletePost}
            disabled={saving}
            style={{
              height: 44,
              padding: '0 20px',
              borderRadius: 8,
              background: '#FFFFFF',
              color: '#B91C1C',
              border: '1px solid #FECACA',
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            삭제
          </button>
        )}
      </div>
    </div>
  );
}
