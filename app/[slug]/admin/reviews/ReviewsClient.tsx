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
  gradeBand: string | null;
}

interface ResultStat {
  id: string;
  termLabel: string;
  metrics: { label: string; value: string; unit: string }[];
  basisText: string;
  published: boolean;
}

interface Props {
  slug: string;
  reviews: Review[];
  resultStats: ResultStat[];
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

export function ReviewsClient({ slug, reviews: initialReviews, resultStats: initialStats }: Props) {
  const [reviews, setReviews] = useState(initialReviews);
  const [resultStats, setResultStats] = useState(initialStats);
  const [tab, setTab] = useState<'review' | 'score_case' | 'result_stat'>('review');
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
    gradeBand: '',
  });
  const [addSaving, setAddSaving] = useState(false);

  // result_stat state
  const [selectedStatId, setSelectedStatId] = useState<string | null>(initialStats[0]?.id ?? null);
  const [statForm, setStatForm] = useState<Partial<ResultStat> & { metricsRaw?: string }>({});
  const [showAddStat, setShowAddStat] = useState(false);
  const [newStatForm, setNewStatForm] = useState({ termLabel: '', metricsRaw: '', basisText: '', published: false });
  const [statSaving, setStatSaving] = useState(false);
  const [statAddSaving, setStatAddSaving] = useState(false);
  const [statError, setStatError] = useState('');

  const selectedStat = resultStats.find((s) => s.id === selectedStatId) ?? null;

  function statFieldVal<K extends keyof ResultStat>(key: K): ResultStat[K] {
    return ((statForm as Partial<ResultStat>)[key] as ResultStat[K]) ?? (selectedStat?.[key] as ResultStat[K]);
  }

  function metricsToRaw(m: { label: string; value: string; unit: string }[]): string {
    return m.map((r) => `${r.label}|${r.value}|${r.unit}`).join('\n');
  }

  function rawToMetrics(raw: string): { label: string; value: string; unit: string }[] {
    return raw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [label = '', value = '', unit = ''] = l.split('|');
        return { label: label.trim(), value: value.trim(), unit: unit.trim() };
      });
  }

  async function saveStat() {
    if (!selectedStatId) return;
    setStatSaving(true);
    setStatError('');
    try {
      const metricsRaw = statForm.metricsRaw ?? metricsToRaw(selectedStat?.metrics ?? []);
      const res = await fetch(`/api/${slug}/admin/result-stats/${selectedStatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          termLabel: statFieldVal('termLabel'),
          metrics: rawToMetrics(metricsRaw),
          basisText: statFieldVal('basisText'),
          published: statFieldVal('published'),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setStatError(data.error ?? '저장 실패'); return; }
      setResultStats((prev) => prev.map((s) => s.id === selectedStatId ? { ...s, ...data.stat } : s));
      setStatForm({});
    } finally {
      setStatSaving(false);
    }
  }

  async function addStat() {
    setStatAddSaving(true);
    setStatError('');
    try {
      const res = await fetch(`/api/${slug}/admin/result-stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          termLabel: newStatForm.termLabel,
          metrics: rawToMetrics(newStatForm.metricsRaw),
          basisText: newStatForm.basisText,
          published: newStatForm.published,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setStatError(data.error ?? '저장 실패'); return; }
      setResultStats((prev) => [data.stat, ...prev]);
      setSelectedStatId(data.stat.id);
      setShowAddStat(false);
      setNewStatForm({ termLabel: '', metricsRaw: '', basisText: '', published: false });
    } finally {
      setStatAddSaving(false);
    }
  }

  async function deleteStat(id: string) {
    await fetch(`/api/${slug}/admin/result-stats/${id}`, { method: 'DELETE' });
    setResultStats((prev) => prev.filter((s) => s.id !== id));
    if (selectedStatId === id) setSelectedStatId(resultStats.find((s) => s.id !== id)?.id ?? null);
  }

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
        gradeBand: fieldVal('gradeBand') || null,
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
        setNewForm({ body: '', authorLabel: '', source: SOURCE_OPTIONS[0], consentConfirmed: false, consentFile: '', beforeValue: '', afterValue: '', periodLabel: '', comment: '', showOnHome: false, gradeBand: '' });
      }
    } finally {
      setAddSaving(false);
    }
  }

  const tabCounts = {
    review: reviews.filter((r) => r.kind === 'review').length,
    score_case: reviews.filter((r) => r.kind === 'score_case').length,
    result_stat: resultStats.length,
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {([
            { key: 'review', label: '학부모 후기' },
            { key: 'score_case', label: '성적 변화 사례' },
            { key: 'result_stat', label: '성과 통계' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTab(key);
                if (key !== 'result_stat') setSelectedId(reviews.find((r) => r.kind === key)?.id ?? null);
                else setSelectedStatId(resultStats[0]?.id ?? null);
              }}
              style={{
                height: 44,
                padding: '0 18px',
                border: tab === key ? 'none' : '1px solid #D5D0C6',
                borderRadius: 22,
                background: tab === key ? '#1B2430' : '#FFFFFF',
                color: tab === key ? '#FFFFFF' : '#1B2430',
                font: 'inherit',
                fontWeight: tab === key ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {label} {tabCounts[key]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => tab === 'result_stat' ? setShowAddStat(true) : setShowAdd(true)}
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

      {tab === 'result_stat' ? (
        <div style={{ display: 'flex', gap: 20, flex: 1 }}>
          {/* Result stats list */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {resultStats.length === 0 && !showAddStat && (
              <div style={{ padding: 48, background: '#FFFFFF', borderRadius: 12, textAlign: 'center', color: '#9AA3AF', fontSize: 14 }}>
                등록된 성과 통계가 없습니다.
              </div>
            )}
            {resultStats.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedStatId(s.id)}
                style={{ padding: 20, background: '#FFFFFF', border: selectedStatId === s.id ? '2px solid #1E5645' : '1px solid #E2DDD2', borderRadius: 12, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{s.termLabel}</div>
                  <div style={{ fontSize: 13, color: '#5A6270', marginTop: 4 }}>
                    {s.metrics.length}개 지표 · {s.basisText ? '근거 있음' : <span style={{ color: '#8A3A1C' }}>근거 없음 (비공개)</span>}
                  </div>
                </div>
                <span style={{ padding: '3px 8px', borderRadius: 5, background: s.published ? '#D8E8E0' : '#F3E3DC', color: s.published ? '#1E5645' : '#8A3A1C', fontSize: 12, fontWeight: 700 }}>
                  {s.published ? '공개' : '비공개'}
                </span>
              </div>
            ))}
          </div>
          {/* Result stat edit panel */}
          <div style={{ width: 440, padding: 24, background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 16, alignSelf: 'flex-start' }}>
            {showAddStat ? (
              <>
                <div style={{ fontSize: 16, fontWeight: 700 }}>성과 통계 추가</div>
                {statError && <div style={{ fontSize: 13, color: '#8A3A1C', background: '#FDE8E0', padding: '10px 14px', borderRadius: 8 }}>{statError}</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>기간 레이블</label>
                  <input type="text" value={newStatForm.termLabel} onChange={(e) => setNewStatForm((p) => ({ ...p, termLabel: e.target.value }))} placeholder="예: 2024 수능" style={{ height: 44, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>지표 (레이블|값|단위, 한 줄씩)</label>
                  <textarea value={newStatForm.metricsRaw} onChange={(e) => setNewStatForm((p) => ({ ...p, metricsRaw: e.target.value }))} rows={4} placeholder={'수능 1등급|12|명\n최상위권 진학|85|%'} style={{ padding: 12, border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 13, fontFamily: 'monospace', resize: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>근거 출처 <span style={{ color: '#8A3A1C' }}>*필수 (없으면 비공개)</span></label>
                  <input type="text" value={newStatForm.basisText} onChange={(e) => setNewStatForm((p) => ({ ...p, basisText: e.target.value }))} placeholder="예: 2024 수능 성적 통지표 취합" style={{ height: 44, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }} />
                </div>
                <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14 }}>
                  <input type="checkbox" checked={newStatForm.published} onChange={(e) => setNewStatForm((p) => ({ ...p, published: e.target.checked }))} style={{ width: 20, height: 20 }} />
                  홈페이지에 공개
                </label>
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <button type="button" onClick={() => { setShowAddStat(false); setStatError(''); }} style={{ flex: 1, height: 48, border: '1px solid #D5D0C6', borderRadius: 10, background: '#FFFFFF', font: 'inherit', fontSize: 14, cursor: 'pointer' }}>취소</button>
                  <button type="button" onClick={addStat} disabled={statAddSaving} style={{ flex: 2, height: 48, border: 'none', borderRadius: 10, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 15, fontWeight: 700, cursor: statAddSaving ? 'wait' : 'pointer' }}>저장</button>
                </div>
              </>
            ) : selectedStat ? (
              <>
                <div style={{ fontSize: 16, fontWeight: 700 }}>성과 통계 편집</div>
                {statError && <div style={{ fontSize: 13, color: '#8A3A1C', background: '#FDE8E0', padding: '10px 14px', borderRadius: 8 }}>{statError}</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>기간 레이블</label>
                  <input type="text" value={(statFieldVal('termLabel') as string) ?? ''} onChange={(e) => setStatForm((p) => ({ ...p, termLabel: e.target.value }))} placeholder="예: 2024 수능" style={{ height: 44, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>지표 (레이블|값|단위, 한 줄씩)</label>
                  <textarea
                    value={statForm.metricsRaw ?? metricsToRaw(selectedStat.metrics)}
                    onChange={(e) => setStatForm((p) => ({ ...p, metricsRaw: e.target.value }))}
                    rows={4}
                    placeholder={'수능 1등급|12|명\n최상위권 진학|85|%'}
                    style={{ padding: 12, border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 13, fontFamily: 'monospace', resize: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>근거 출처 <span style={{ color: '#8A3A1C' }}>*필수 (없으면 비공개)</span></label>
                  <input type="text" value={(statFieldVal('basisText') as string) ?? ''} onChange={(e) => setStatForm((p) => ({ ...p, basisText: e.target.value }))} placeholder="예: 2024 수능 성적 통지표 취합" style={{ height: 44, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }} />
                </div>
                <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14 }}>
                  <input type="checkbox" checked={(statFieldVal('published') as boolean) ?? false} onChange={(e) => setStatForm((p) => ({ ...p, published: e.target.checked }))} style={{ width: 20, height: 20 }} />
                  홈페이지에 공개
                </label>
                <div style={{ fontSize: 13, color: '#5A6270', lineHeight: 1.6 }}>근거 출처가 없으면 공개로 설정해도 비공개 처리됩니다.</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <button type="button" onClick={() => deleteStat(selectedStat.id)} style={{ height: 48, padding: '0 20px', border: '1px solid #D5D0C6', borderRadius: 10, background: '#FFFFFF', font: 'inherit', fontSize: 14, color: '#8A3A1C', cursor: 'pointer' }}>삭제</button>
                  <button type="button" onClick={saveStat} disabled={statSaving} style={{ flex: 1, height: 48, border: 'none', borderRadius: 10, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 15, fontWeight: 700, cursor: statSaving ? 'wait' : 'pointer' }}>저장</button>
                </div>
              </>
            ) : (
              <div style={{ color: '#9AA3AF', fontSize: 14, padding: 24, textAlign: 'center' }}>왼쪽 목록에서 항목을 선택하거나 새로 추가하세요.</div>
            )}
          </div>
        </div>
      ) : (
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>학년 구분</label>
                <select
                  value={newForm.gradeBand}
                  onChange={(e) => setNewForm((p) => ({ ...p, gradeBand: e.target.value }))}
                  style={{ height: 44, padding: '0 10px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}
                >
                  <option value="">미지정</option>
                  <option value="중등">중등</option>
                  <option value="고등">고등</option>
                </select>
              </div>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>학년 구분</label>
                <select
                  value={(fieldVal('gradeBand') as string) ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, [selected.id]: { ...(p[selected.id] ?? {}), gradeBand: e.target.value || null } }))}
                  style={{ height: 44, padding: '0 10px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}
                >
                  <option value="">미지정</option>
                  <option value="중등">중등</option>
                  <option value="고등">고등</option>
                </select>
              </div>
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
      )}
    </div>
  );
}
