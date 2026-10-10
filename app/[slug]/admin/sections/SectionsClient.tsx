'use client';

import { useState } from 'react';
import { DEFAULT_SECTION_ORDER, LOCKED_SECTIONS, SECTION_LABELS, normalizeSections, type ThemeKey } from '@/lib/sections';

interface SectionState {
  key: string;
  enabled: boolean;
  sortOrder: number;
}

interface Props {
  slug: string;
  theme: ThemeKey;
  sections: SectionState[];
  canEdit: boolean;
}

const THEMES = [
  { value: 'warm', label: '테마 A — 원장 직강형', desc: '종이색 바탕, 명조 제목, 따뜻한 분위기', color: '#1E5645', bg: '#E4EEE9' },
  { value: 'result', label: '테마 B — 성과 중심형', desc: '남색·흰색, 합격 실적 강조', color: '#1D3FA8', bg: '#E6EBF8' },
  { value: 'bright', label: '테마 C — 밝은 친근형', desc: '흰 바탕 파스텔 카드, 아이 친화적', color: '#0F766E', bg: '#DCFCE7' },
];

export function SectionsClient({ slug, theme: initTheme, sections: initSections, canEdit }: Props) {
  const [theme, setTheme] = useState<ThemeKey>(initTheme);
  const [sections, setSections] = useState<SectionState[]>(initSections);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function changeTheme(next: ThemeKey) {
    if (next === theme) return;
    setTheme(next);
    // 새 테마 기본 순서로 다시 구성하되, 두 테마에 공통인 섹션의 켜짐 상태는 유지
    const prev = new Map(sections.map((s) => [s.key, s.enabled]));
    setSections(normalizeSections(next, DEFAULT_SECTION_ORDER[next].map((key) => ({ key, enabled: prev.get(key) ?? true }))));
  }

  function moveUp(i: number) {
    if (i <= 1) return;
    setSections((prev) => {
      const next = [...prev];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next.map((s, idx) => ({ ...s, sortOrder: idx }));
    });
  }

  function moveDown(i: number) {
    setSections((prev) => {
      if (i === 0 || i >= prev.length - 1) return prev;
      const next = [...prev];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      return next.map((s, idx) => ({ ...s, sortOrder: idx }));
    });
  }

  function toggleEnabled(key: string) {
    if (LOCKED_SECTIONS.has(key)) return;
    setSections((prev) => prev.map((s) => s.key === key ? { ...s, enabled: !s.enabled } : s));
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const res = await fetch(`/api/${slug}/admin/sections`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, sections: sections.map(({ key, enabled, sortOrder }) => ({ key, enabled, sortOrder })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSaved(true);
        if (Array.isArray(data.sections)) setSections(data.sections);
      } else {
        setError(data.error ?? '저장하지 못했습니다.');
      }
    } finally {
      setSaving(false);
    }
  }

  const arrow = (enabled: boolean): React.CSSProperties => ({
    background: 'none', border: 'none', fontSize: 12, lineHeight: 1, padding: 2,
    cursor: enabled ? 'pointer' : 'default', color: enabled ? '#1B2430' : '#D5D0C6',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>홈페이지 구성</h1>
        {canEdit && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {saved && <span style={{ fontSize: 13, color: '#1E5645', fontWeight: 600 }}>저장되어 홈페이지에 바로 반영되었습니다</span>}
            {error && <span style={{ fontSize: 13, color: '#B42318', fontWeight: 600 }}>{error}</span>}
            <a href={`/${slug}`} target="_blank" rel="noopener noreferrer" style={{ height: 40, padding: '0 16px', borderRadius: 8, border: '1px solid #D5D0C6', color: '#1B2430', textDecoration: 'none', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              홈페이지 보기
            </a>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              style={{ height: 40, padding: '0 20px', border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1 }}
            >
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
        )}
      </div>

      {!canEdit && (
        <div style={{ padding: '12px 16px', borderRadius: 8, background: '#FFF7E6', color: '#7A4B00', fontSize: 14 }}>
          홈페이지 구성은 원장 계정만 바꿀 수 있습니다.
        </div>
      )}

      <fieldset disabled={!canEdit} style={{ border: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <section style={{ padding: 24, background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>테마 선택</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {THEMES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => changeTheme(t.value as ThemeKey)}
                style={{
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
          <div style={{ fontSize: 12, color: '#5A6270' }}>테마를 바꿔도 입력한 내용은 그대로 남습니다. 테마마다 보이는 섹션만 달라집니다.</div>
        </section>

        <section style={{ padding: 24, background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>섹션 순서 및 표시</div>
          <div style={{ fontSize: 13, color: '#5A6270' }}>
            켜진 섹션만 홈페이지에 나타납니다. 내용이 비어 있는 섹션은 켜 두어도 자동으로 숨겨집니다.
            메인 히어로와 상담 신청 폼은 항상 표시됩니다.
          </div>
          {sections.map((s, i) => {
            const locked = LOCKED_SECTIONS.has(s.key);
            const canUp = i > 1;
            const canDown = i > 0 && i < sections.length - 1;
            return (
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
                  <button type="button" aria-label="위로" onClick={() => moveUp(i)} disabled={!canUp} style={arrow(canUp)}>▲</button>
                  <button type="button" aria-label="아래로" onClick={() => moveDown(i)} disabled={!canDown} style={arrow(canDown)}>▼</button>
                </div>
                <span style={{ fontSize: 13, color: '#9AA3AF', minWidth: 20 }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 15, fontWeight: s.enabled ? 600 : 400, color: s.enabled ? '#1B2430' : '#9AA3AF' }}>
                  {SECTION_LABELS[s.key] ?? s.key}
                </span>
                {locked ? (
                  <span style={{ fontSize: 12, color: '#5A6270', padding: '4px 10px', borderRadius: 999, background: '#F1EFEA' }}>항상 표시</span>
                ) : (
                  <button
                    type="button"
                    aria-pressed={s.enabled}
                    aria-label={`${SECTION_LABELS[s.key] ?? s.key} 표시`}
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
                )}
              </div>
            );
          })}
        </section>
      </fieldset>
    </div>
  );
}
