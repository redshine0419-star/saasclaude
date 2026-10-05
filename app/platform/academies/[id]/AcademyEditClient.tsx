'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SectionDef {
  key: string;
  label: string;
  themes: string[];
}

interface SectionState {
  key: string;
  enabled: boolean;
  sortOrder: number;
}

interface OverlapAcademy {
  id: string;
  name: string;
  slug: string;
  address: string | null;
}

interface Props {
  id: string;
  name: string;
  slug: string;
  theme: string;
  accentColor: string;
  subjects: string;
  address: string;
  phone: string;
  status: string;
  betaEndsAt: string | null;
  sections: SectionState[];
  allSections: SectionDef[];
  overlaps: OverlapAcademy[];
}

const THEMES = [
  { value: 'warm', label: '테마 A', sub: '원장 직강형', color: '#1E5645', bg: '#E4EEE9' },
  { value: 'result', label: '테마 B', sub: '성과 중심형', color: '#1D3FA8', bg: '#E6EBF8' },
  { value: 'bright', label: '테마 C', sub: '밝은 친근형', color: '#0F766E', bg: '#DCFCE7' },
];

export function AcademyEditClient(props: Props) {
  const [theme, setTheme] = useState(props.theme);
  const [accentColor, setAccentColor] = useState(props.accentColor);
  const [status, setStatus] = useState(props.status);
  const [sections, setSections] = useState<SectionState[]>(() => {
    const existingMap = new Map(props.sections.map((s) => [s.key, s]));
    return props.allSections.map((def, i) => ({
      key: def.key,
      enabled: existingMap.get(def.key)?.enabled ?? def.themes.includes(props.theme),
      sortOrder: existingMap.get(def.key)?.sortOrder ?? i,
    }));
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const currentTheme = THEMES.find((t) => t.value === theme) ?? THEMES[0];
  const themeSections = props.allSections.filter((s) => s.themes.includes(theme));

  function toggleSection(key: string) {
    setSections((prev) => prev.map((s) => s.key === key ? { ...s, enabled: !s.enabled } : s));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/platform/academies/${props.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, accentColor, status, sections }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ flex: 1, padding: '32px 40px', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif", background: '#F4F2EE', minHeight: '100vh' }}>
      <div style={{ maxWidth: 960, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#5A6270' }}>
          <Link href="/platform/academies" style={{ color: '#5A6270', textDecoration: 'none' }}>학원 목록</Link>
          <span>/</span>
          <span style={{ color: '#1B2430', fontWeight: 600 }}>{props.name}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{props.name}</h1>
            <div style={{ fontSize: 14, color: '#5A6270', marginTop: 4 }}>
              growweb.me/{props.slug} ·{' '}
              <Link href={`/${props.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1E5645' }}>홈페이지 보기 →</Link>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {saved && <span style={{ fontSize: 14, color: '#1E5645', fontWeight: 600, alignSelf: 'center' }}>저장됨 ✓</span>}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{ height: 44, padding: '0 20px', borderRadius: 10, border: 'none', background: '#1E5645', color: '#FFFFFF', fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>

        {/* Overlap warning */}
        {props.overlaps.length > 0 && (
          <div style={{ padding: '14px 20px', background: '#FEF9C3', border: '1px solid #EAB308', borderRadius: 10, fontSize: 14, color: '#713F12' }}>
            <b>⚠ 같은 지역·과목 학원이 있습니다:</b>{' '}
            {props.overlaps.map((o, i) => (
              <span key={o.id}>
                {i > 0 && ', '}
                <Link href={`/platform/academies/${o.id}`} style={{ color: '#713F12', fontWeight: 600 }}>
                  {o.name}
                </Link>
                {o.address && <span style={{ fontWeight: 400 }}> ({o.address})</span>}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
          {/* Main panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Theme picker */}
            <div style={{ padding: 24, borderRadius: 14, background: '#FFFFFF' }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>테마</div>
              <div style={{ display: 'flex', gap: 12 }}>
                {THEMES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTheme(t.value)}
                    style={{
                      flex: 1,
                      padding: '16px 12px',
                      borderRadius: 12,
                      border: `2px solid ${theme === t.value ? t.color : '#E2DDD2'}`,
                      background: theme === t.value ? t.bg : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: t.color }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: theme === t.value ? t.color : '#1B2430' }}>{t.label}</div>
                    <div style={{ fontSize: 12, color: '#5A6270' }}>{t.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Accent color */}
            <div style={{ padding: 24, borderRadius: 14, background: '#FFFFFF' }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>강조색 (선택)</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input
                  type="color"
                  value={accentColor || currentTheme.color}
                  onChange={(e) => setAccentColor(e.target.value)}
                  style={{ width: 48, height: 48, borderRadius: 8, border: '1px solid #E2DDD2', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    placeholder={currentTheme.color}
                    style={{ height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #E2DDD2', fontSize: 14, fontFamily: 'monospace', width: 120 }}
                  />
                  <div style={{ fontSize: 12, color: '#5A6270' }}>HEX (비워두면 테마 기본값 사용)</div>
                </div>
                {accentColor && (
                  <button
                    type="button"
                    onClick={() => setAccentColor('')}
                    style={{ fontSize: 13, color: '#8A3A1C', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    초기화
                  </button>
                )}
              </div>
            </div>

            {/* Sections */}
            <div style={{ padding: 24, borderRadius: 14, background: '#FFFFFF' }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>섹션 구성</div>
              <div style={{ fontSize: 13, color: '#5A6270', marginBottom: 16 }}>현재 테마({currentTheme.label})에서 사용 가능한 섹션입니다.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {themeSections.map((def) => {
                  const state = sections.find((s) => s.key === def.key);
                  const enabled = state?.enabled ?? false;
                  return (
                    <label key={def.key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid #F0EDE7', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => toggleSection(def.key)}
                        style={{ width: 16, height: 16, accentColor: currentTheme.color, flexShrink: 0 }}
                      />
                      <span style={{ fontSize: 14, fontWeight: enabled ? 600 : 400, color: enabled ? '#1B2430' : '#8A93A8' }}>{def.label}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 12, color: '#C9CFDA', fontFamily: 'monospace' }}>{def.key}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: 20, borderRadius: 14, background: '#FFFFFF' }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>학원 상태</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#5A6270' }}>공개 상태</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{ height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid #D5D0C6', fontSize: 13, fontFamily: 'inherit' }}
                  >
                    <option value="active">운영 중 (공개)</option>
                    <option value="inactive">비공개</option>
                  </select>
                </label>
                {props.betaEndsAt && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#5A6270', marginBottom: 4 }}>베타 종료일</div>
                    <div style={{ fontSize: 13 }}>{new Date(props.betaEndsAt).toLocaleDateString('ko-KR')}</div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: 20, borderRadius: 14, background: '#FFFFFF' }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>학원 정보</div>
              <div style={{ fontSize: 13, color: '#5A6270', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {props.subjects && <div><b>과목:</b> {props.subjects}</div>}
                {props.phone && <div><b>전화:</b> {props.phone}</div>}
                {props.address && <div><b>주소:</b> {props.address}</div>}
              </div>
              <Link href={`/${props.slug}/admin`} style={{ marginTop: 14, display: 'block', fontSize: 13, color: '#1E5645', fontWeight: 600, textDecoration: 'none' }}>학원 관리자 →</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
