'use client';

import { useState } from 'react';

interface Review {
  id: string;
  kind: string;
  body: string | null;
  authorLabel: string | null;
  source: string | null;
  consentConfirmed: boolean;
  consentFile: string | null;
  beforeValue: string | null;
  afterValue: string | null;
  periodLabel: string | null;
  comment: string | null;
  showOnHome: boolean;
  visible: boolean;
}

interface Props {
  slug: string;
  reviews: Review[];
}

const VISIBLE_BADGE = {
  home: { label: '홈에 노출', bg: '#D8E8E0', color: '#1E5645' },
  page: { label: '후기 페이지만', bg: '#E6E9EE', color: '#2C3747' },
  hidden: { label: '비공개', bg: '#F3E3DC', color: '#8A3A1C' },
};

function getBadge(r: Review) {
  if (!r.consentConfirmed) return VISIBLE_BADGE.hidden;
  if (r.showOnHome) return VISIBLE_BADGE.home;
  return VISIBLE_BADGE.page;
}

const SOURCE_OPTIONS = ['네이버 플레이스', '카카오톡 채널', '직접 전달', '기타'];

export function ReviewsClient({ slug, reviews: initialReviews }: Props) {
  const [reviews, setReviews] = useState(initialReviews);
  const [tab, setTab] = useState<'review' | 'score_case'>('review');
  const [selectedId, setSelectedId] = useState<string | null>(
    initialReviews.find((r) => r.kind === 'review')?.id ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, Partial<Review>>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newForm, setNewForm] = useState({
    body: '',
    authorLabel: '',
    source: SOURCE_OPTIONS[0],
    consentConfirmed: false,
    consentFile: '',
    beforeValue: '',
    afterValue: '',
    periodLabel: '',
    comment: '',
    showOnHome: false,
  });
  const [addSaving, setAddSaving] = useState(false);

  const filtered = reviews.filter((r) => r.kind === tab);
  const selected = reviews.find((r) => r.id === selectedId) ?? null;
  const editForm = (selectedId && form[selectedId]) ?? {};

  function fieldVal<K extends keyof Review>(key: K): Review[K] {
    return ((editForm as Partial<Review>)[key] as Review[K]) ?? (selected?.[key] as Review[K]);
  }

  async function save() {
    if (!selectedId) return;
    setSaving(true);
    try {
      const payload: Partial<Review> & { kind?: string } = {
        body: fieldVal('body'),
        authorLabel: fieldVal('authorLabel'),
        source: fieldVal('source'),
        consentConfirmed: fieldVal('consentConfirmed'),
        consentFile: fieldVal('consentFile'),
        comment: fieldVal('comment'),
        showOnHome: fieldVal('showOnHome'),
        ...(selected?.kind === 'score_case' && {
          beforeValue: fieldVal('beforeValue'),
          afterValue: fieldVal('afterValue'),
          periodLabel: fieldVal('periodLabel'),
        }),
      };
      const res = await fetch(`/api/${slug}/admin/reviews/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setReviews((prev) =>
          prev.map((r) => (r.id === selectedId ? { ...r, ...data.review } : r)),
        );
        setForm((prev) => ({ ...prev, [selectedId]: {} }));
      }
    } finally {
      setSaving(false);
    }
  }

  async function addReview() {
    setAddSaving(true);
    try {
      const res = await fetch(`/api/${slug}/admin/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newForm, kind: tab }),
      });
      if (res.ok) {
        const data = await res.json();
        setReviews((prev) => [data.review, ...prev]);
        setSelectedId(data.review.id);
        setShowAdd(false);
        setNewForm({ body: '', authorLabel: '', source: SOURCE_OPTIONS[0], consentConfirmed: false, consentFile: '', beforeValue: '', afterValue: '', periodLabel: '', comment: '', showOnHome: false });
      }
    } finally {
      setAddSaving(false);
    }
  }

  const tabCounts = {
    review: reviews.filter((r) => r.kind === 'review').length,
    score_case: reviews.filter((r) => r.kind === 'score_case').length,
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['review', 'score_case'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setSelectedId(reviews.find((r) => r.kind === t)?.id ?? null);
              }}
              style={{
                height: 44,
                padding: '0 18px',
                border: tab === t ? 'none' : '1px solid #D5D0C6',
                borderRadius: 22,
                background: tab === t ? '#1B2430' : '#FFFFFF',
                color: tab === t ? '#FFFFFF' : '#1B2430',
                font: 'inherit',
                fontWeight: tab === t ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {t === 'review' ? '학부모 후기' : '성적 변화 사례'} {tabCounts[t]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          style={{
            height: 44,
            padding: '0 18px',
            border: 'none',
            borderRadius: 8,
            background: '#1E5645',
            color: '#FFFFFF',
            font: 'inherit',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          후기 추가
        </button>
      </div>

      <div style={{ display: 'flex', gap: 20, flex: 1 }}>
        {/* Left: list */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 && (
            <div
              style={{
                padding: 48,
                background: '#FFFFFF',
                borderRadius: 12,
                textAlign: 'center',
                color: '#9AA3AF',
                fontSize: 14,
              }}
            >
              아직 등록된 후기가 없습니다.
            </div>
          )}
          {filtered.map((r) => {
            const badge = getBadge(r);
            const isSelected = r.id === selectedId;
            return (
              <div
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                style={{
                  padding: 20,
                  background: '#FFFFFF',
                  border: isSelected ? '2px solid #1E5645' : '1px solid #E2DDD2',
                  borderRadius: 12,
                  display: 'flex',
                  gap: 16,
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>
                    {r.kind === 'score_case' && (r.beforeValue || r.afterValue)
                      ? `${r.beforeValue ?? '?'} → ${r.afterValue ?? '?'}${r.periodLabel ? ` (${r.periodLabel})` : ''}`
                      : `"${r.body ? r.body.slice(0, 40) + (r.body.length > 40 ? '…' : '') : '(내용 없음)'}"`}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: r.consentConfirmed ? '#5A6270' : '#8A3A1C',
                      marginTop: 4,
                    }}
                  >
                    {r.authorLabel ?? '작성자 미기재'} ·{' '}
                    {r.consentConfirmed ? '동의 확인됨' : '동의 미확인'}
                    {r.kind === 'score_case' && !r.consentFile && (
                      <span style={{ color: '#8A3A1C', marginLeft: 6 }}>동의서 없음</span>
                    )}
                  </div>
                </div>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: 5,
                    background: badge.bg,
                    color: badge.color,
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right: edit panel */}
        <div
          style={{
            width: 440,
            padding: 24,
            background: '#FFFFFF',
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            alignSelf: 'flex-start',
          }}
        >
          {showAdd ? (
            <>
              <div style={{ fontSize: 16, fontWeight: 700 }}>후기 추가</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>후기 원문</label>
                <textarea
                  value={newForm.body}
                  onChange={(e) => setNewForm((p) => ({ ...p, body: e.target.value }))}
                  rows={5}
                  placeholder="원문 그대로 붙여넣기. 맞춤법 외 수정 금지"
                  style={{ padding: '12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14, resize: 'none' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>작성자 표기</label>
                  <input
                    type="text"
                    value={newForm.authorLabel}
                    onChange={(e) => setNewForm((p) => ({ ...p, authorLabel: e.target.value }))}
                    placeholder="중2 학부모"
                    style={{ height: 44, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>출처</label>
                  <select
                    value={newForm.source}
                    onChange={(e) => setNewForm((p) => ({ ...p, source: e.target.value }))}
                    style={{ height: 44, padding: '0 10px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}
                  >
                    {SOURCE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              {tab === 'score_case' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>변화 전</label>
                      <input type="text" value={newForm.beforeValue} onChange={(e) => setNewForm((p) => ({ ...p, beforeValue: e.target.value }))} placeholder="예: 45점" style={{ height: 44, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>변화 후</label>
                      <input type="text" value={newForm.afterValue} onChange={(e) => setNewForm((p) => ({ ...p, afterValue: e.target.value }))} placeholder="예: 88점" style={{ height: 44, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>기간</label>
                      <input type="text" value={newForm.periodLabel} onChange={(e) => setNewForm((p) => ({ ...p, periodLabel: e.target.value }))} placeholder="예: 3개월" style={{ height: 44, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>동의서 파일 URL <span style={{ color: '#8A3A1C' }}>*필수 (없으면 비공개)</span></label>
                    <input type="text" value={newForm.consentFile} onChange={(e) => setNewForm((p) => ({ ...p, consentFile: e.target.value }))} placeholder="Blob URL 또는 파일 경로" style={{ height: 44, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }} />
                  </div>
                </>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16, background: '#F4F2EE', borderRadius: 10 }}>
                <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14 }}>
                  <input type="checkbox" checked={newForm.consentConfirmed} onChange={(e) => setNewForm((p) => ({ ...p, consentConfirmed: e.target.checked }))} style={{ width: 20, height: 20 }} />
                  작성자에게 게재 동의를 받았습니다
                </label>
                <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14 }}>
                  <input type="checkbox" checked={newForm.showOnHome} disabled={!newForm.consentConfirmed} onChange={(e) => setNewForm((p) => ({ ...p, showOnHome: e.target.checked }))} style={{ width: 20, height: 20 }} />
                  홈 화면에도 노출
                </label>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: '#5A6270' }}>
                {tab === 'score_case'
                  ? '동의 확인 + 동의서 파일이 모두 있어야 공개됩니다.'
                  : '동의가 체크되지 않은 후기는 게시되지 않습니다.'}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, height: 48, border: '1px solid #D5D0C6', borderRadius: 10, background: '#FFFFFF', font: 'inherit', fontSize: 14, cursor: 'pointer' }}>취소</button>
                <button type="button" onClick={addReview} disabled={addSaving} style={{ flex: 2, height: 48, border: 'none', borderRadius: 10, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 15, fontWeight: 700, cursor: addSaving ? 'wait' : 'pointer' }}>저장</button>
              </div>
            </>
          ) : selected ? (
            <>
              <div style={{ fontSize: 16, fontWeight: 700 }}>후기 편집</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>후기 원문</label>
                <textarea
                  value={(fieldVal('body') as string) ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      [selected.id]: { ...(p[selected.id] ?? {}), body: e.target.value },
                    }))
                  }
                  rows={5}
                  placeholder="원문 그대로 붙여넣기. 맞춤법 외 수정 금지"
                  style={{ padding: 12, border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14, resize: 'none' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>작성자 표기</label>
                  <input
                    type="text"
                    value={(fieldVal('authorLabel') as string) ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        [selected.id]: { ...(p[selected.id] ?? {}), authorLabel: e.target.value },
                      }))
                    }
                    placeholder="중2 학부모"
                    style={{ height: 44, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>출처</label>
                  <select
                    value={(fieldVal('source') as string) ?? SOURCE_OPTIONS[0]}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        [selected.id]: { ...(p[selected.id] ?? {}), source: e.target.value },
                      }))
                    }
                    style={{ height: 44, padding: '0 10px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}
                  >
                    {SOURCE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              {selected.kind === 'score_case' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>변화 전</label>
                      <input
                        type="text"
                        value={(fieldVal('beforeValue') as string) ?? ''}
                        onChange={(e) => setForm((p) => ({ ...p, [selected.id]: { ...(p[selected.id] ?? {}), beforeValue: e.target.value } }))}
                        placeholder="예: 45점"
                        style={{ height: 44, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>변화 후</label>
                      <input
                        type="text"
                        value={(fieldVal('afterValue') as string) ?? ''}
                        onChange={(e) => setForm((p) => ({ ...p, [selected.id]: { ...(p[selected.id] ?? {}), afterValue: e.target.value } }))}
                        placeholder="예: 88점"
                        style={{ height: 44, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>기간</label>
                      <input
                        type="text"
                        value={(fieldVal('periodLabel') as string) ?? ''}
                        onChange={(e) => setForm((p) => ({ ...p, [selected.id]: { ...(p[selected.id] ?? {}), periodLabel: e.target.value } }))}
                        placeholder="예: 3개월"
                        style={{ height: 44, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>동의서 파일 URL <span style={{ color: '#8A3A1C' }}>*필수 (없으면 비공개)</span></label>
                    <input
                      type="text"
                      value={(fieldVal('consentFile') as string) ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, [selected.id]: { ...(p[selected.id] ?? {}), consentFile: e.target.value } }))}
                      placeholder="Blob URL 또는 파일 경로"
                      style={{ height: 44, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}
                    />
                  </div>
                </>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16, background: '#F4F2EE', borderRadius: 10 }}>
                <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={(fieldVal('consentConfirmed') as boolean) ?? false}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        [selected.id]: {
                          ...(p[selected.id] ?? {}),
                          consentConfirmed: e.target.checked,
                          showOnHome: e.target.checked ? (fieldVal('showOnHome') as boolean) : false,
                        },
                      }))
                    }
                    style={{ width: 20, height: 20 }}
                  />
                  작성자에게 게재 동의를 받았습니다
                </label>
                <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={(fieldVal('showOnHome') as boolean) ?? false}
                    disabled={!(fieldVal('consentConfirmed') as boolean)}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        [selected.id]: { ...(p[selected.id] ?? {}), showOnHome: e.target.checked },
                      }))
                    }
                    style={{ width: 20, height: 20 }}
                  />
                  홈 화면에도 노출
                </label>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: '#5A6270' }}>
                {selected.kind === 'score_case'
                  ? '동의 확인 + 동의서 파일이 모두 있어야 공개됩니다.'
                  : '동의가 체크되지 않은 후기는 게시되지 않습니다.'}
              </div>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                style={{ marginTop: 'auto', height: 48, border: 'none', borderRadius: 10, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 15, fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}
              >
                저장
              </button>
            </>
          ) : (
            <div style={{ color: '#9AA3AF', fontSize: 14, padding: 24, textAlign: 'center' }}>
              왼쪽 목록에서 편집할 후기를 선택하세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
