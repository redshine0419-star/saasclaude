'use client';

import { useState } from 'react';

interface SectionState {
  key: string;
  label: string;
  enabled: boolean;
  sortOrder: number;
}

interface Props {
  slug: string;
  theme: string;
  sections: SectionState[];
}

const THEMES = [
  { value: 'warm', label: '테마 A — 원장 직강형', desc: '종이색 바탕, 명조 제목, 따뜻한 분위기', color: '#1E5645', bg: '#E4EEE9' },
  { value: 'result', label: '테마 B — 성과 중심형', desc: '남색·흰색, 합격 실적 강조', color: '#1D3FA8', bg: '#E6EBF8' },
  { value: 'bright', label: '테마 C — 밝은 친근형', desc: '흰 바탕 파스텔 카드, 아이 친화적', color: '#0F766E', bg: '#DCFCE7' },
];

const SECTION_LABELS: Record<string, string> = {
  hero: '메인 히어로',
  quick_info: '학원 한눈에 보기',
  director: '원장 소개',
  principles: '교육 원칙',
  classes: '수업·강좌',
  timetable: '시간표',
  fees: '교습비',
  reviews: '학부모 후기',
  news: '소식',
  consult_form: '상담 신청 폼',
  location: '오시는 길',
  results_stats: '입시 실적',
  exam_system: '시험 체계',
  curriculum: '커리큘럼',
  score_cases: '성적 사례',
  teachers: '강사진',
  day_flow: '하루 일과',
  gallery: '갤러리',
  safety: '안심 등하원',
};

export function SectionsClient({ slug, theme: initTheme, sections: initSections }: Props) {
  const [theme, setTheme] = useState(initTheme);
  const [sections, setSections] = useState<SectionState[]>(initSections);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function moveUp(i: number) {
    if (i === 0) return;
    setSections((prev) => {
      const next = [...prev];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next.map((s, idx) => ({ ...s, sortOrder: idx }));
    });
  }

  function moveDown(i: number) {
    setSections((prev) => {
      if (i >= prev.length - 1) return prev;
      const next = [...prev];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      return next.map((s, idx) => ({ ...s, sortOrder: idx }));
    });
  }

  function toggleEnabled(key: string) {
    setSections((prev) => prev.map((s) => s.key === key ? { ...s, enabled: !s.enabled } : s));
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/${slug}/admin/sections`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, sections: sections.map(({ key, enabled, sortOrder }) => ({ key, enabled, sortOrder })) }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>홈페이지 구성</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {saved && <span style={{ fontSize: 13, color: '#1E5645', fontWeight: 600 }}>저장되었습니다</span>}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            style={{ height: 40, padding: '0 20px', border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>

      {/* Theme selection */}
      <section style={{ padding: 24, background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>테마 선택</div>
        <div style={{ display: 'flex', gap: 12 }}>
          {THEMES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTheme(t.value)}
              style={{
                flex: 1,
                padding: '16px 14px',
                borderRadius: 10,
                border: `2px solid ${theme === t.value ? t.color : '#E2DDD2'}`,
                background: theme === t.value ? t.bg : '#FFFFFF',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: theme === t.value ? t.color : '#1B2430' }}>{t.label}</div>
              <div style={{ fontSize: 12, color: '#5A6270', marginTop: 4 }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Section order/toggle */}
      <section style={{ padding: 24, background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>섹션 순서 및 표시</div>
        <div style={{ fontSize: 13, color: '#5A6270' }}>켜진 섹션만 홈페이지에 나타납니다. ↑↓ 버튼으로 순서를 바꿀 수 있습니다.</div>
        {sections.map((s, i) => (
          <div
            key={s.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              border: '1px solid #E2DDD2',
              borderRadius: 8,
              background: s.enabled ? '#FFFFFF' : '#F8F7F4',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <button type="button" onClick={() => moveUp(i)} disabled={i === 0} style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', color: i === 0 ? '#D5D0C6' : '#1B2430', fontSize: 12, lineHeight: 1, padding: 2 }}>▲</button>
              <button type="button" onClick={() => moveDown(i)} disabled={i === sections.length - 1} style={{ background: 'none', border: 'none', cursor: i === sections.length - 1 ? 'default' : 'pointer', color: i === sections.length - 1 ? '#D5D0C6' : '#1B2430', fontSize: 12, lineHeight: 1, padding: 2 }}>▼</button>
            </div>
            <span style={{ fontSize: 13, color: '#9AA3AF', minWidth: 20 }}>{i + 1}</span>
            <span style={{ flex: 1, fontSize: 15, fontWeight: s.enabled ? 600 : 400, color: s.enabled ? '#1B2430' : '#9AA3AF' }}>
              {SECTION_LABELS[s.key] ?? s.key}
            </span>
            <button
              type="button"
              aria-pressed={s.enabled}
              onClick={() => toggleEnabled(s.key)}
              style={{
                width: 48,
                height: 28,
                border: 'none',
                borderRadius: 14,
                background: s.enabled ? '#1E5645' : '#C8CDD5',
                padding: 3,
                display: 'flex',
                justifyContent: s.enabled ? 'flex-end' : 'flex-start',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              <span style={{ width: 22, height: 22, borderRadius: 11, background: '#FFFFFF', display: 'block' }} />
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
