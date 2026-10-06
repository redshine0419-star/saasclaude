'use client';

import { useState } from 'react';
import Link from 'next/link';

// WCAG 2.1 relative luminance + contrast ratio
function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(hex: string, bgHex: string): number {
  const l1 = relativeLuminance(hex);
  const l2 = relativeLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

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

interface ContactLog {
  id: string;
  createdAt: string;
  authorEmail: string;
  channel: string;
  note: string;
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
  hours: string;
  kakaoChannelUrl: string;
  status: string;
  betaEndsAt: string | null;
  sections: SectionState[];
  allSections: SectionDef[];
  overlaps: OverlapAcademy[];
  contactLogs: ContactLog[];
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
  const [phone, setPhone] = useState(props.phone);
  const [address, setAddress] = useState(props.address);
  const [hours, setHours] = useState(props.hours);
  const [kakaoChannelUrl, setKakaoChannelUrl] = useState(props.kakaoChannelUrl);
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

  const [logs, setLogs] = useState<ContactLog[]>(props.contactLogs);
  const [logChannel, setLogChannel] = useState('phone');
  const [logNote, setLogNote] = useState('');
  const [addingLog, setAddingLog] = useState(false);

  const currentTheme = THEMES.find((t) => t.value === theme) ?? THEMES[0];
  const themeSections = props.allSections.filter((s) => s.themes.includes(theme));

  async function addContactLog() {
    if (!logNote.trim()) return;
    setAddingLog(true);
    try {
      const res = await fetch(`/api/platform/academies/${props.id}/contact-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: logChannel, note: logNote }),
      });
      if (res.ok) {
        const data = await res.json();
        setLogs((prev) => [data.log, ...prev]);
        setLogNote('');
      }
    } finally {
      setAddingLog(false);
    }
  }

  function toggleSection(key: string) {
    setSections((prev) => prev.map((s) => s.key === key ? { ...s, enabled: !s.enabled } : s));
  }

  function moveSection(key: string, dir: -1 | 1) {
    setSections((prev) => {
      const themeKeys = props.allSections.filter((d) => d.themes.includes(theme)).map((d) => d.key);
      const ordered = [...prev].sort((a, b) => a.sortOrder - b.sortOrder).filter((s) => themeKeys.includes(s.key));
      const idx = ordered.findIndex((s) => s.key === key);
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= ordered.length) return prev;
      const newOrder = [...ordered];
      [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
      const updatedKeys = new Map(newOrder.map((s, i) => [s.key, i]));
      return prev.map((s) => updatedKeys.has(s.key) ? { ...s, sortOrder: updatedKeys.get(s.key)! } : s);
    });
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/platform/academies/${props.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, accentColor, status, sections, phone, address, hours, kakaoChannelUrl }),
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
              {/* WCAG contrast check */}
              {(() => {
                const hex = accentColor || currentTheme.color;
                if (!isValidHex(hex)) return null;
                const onWhite = contrastRatio(hex, '#FFFFFF');
                const onBg = contrastRatio(hex, '#F4F2EE');
                const aaWhite = onWhite >= 4.5;
                const aaBg = onBg >= 4.5;
                const badge = (pass: boolean, ratio: number, label: string) => (
                  <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: pass ? '#D8E8E0' : '#FDE8E8', color: pass ? '#1E5645' : '#B91C1C', fontSize: 12, fontWeight: 600 }}>
                    {pass ? '✓' : '✗'} {label} {ratio.toFixed(1)}:1
                  </span>
                );
                return (
                  <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#5A6270' }}>WCAG AA (4.5:1):</span>
                    {badge(aaWhite, onWhite, '흰 배경')}
                    {badge(aaBg, onBg, '종이 배경')}
                  </div>
                );
              })()}
            </div>

            {/* Sections */}
            <div style={{ padding: 24, borderRadius: 14, background: '#FFFFFF' }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>섹션 구성</div>
              <div style={{ fontSize: 13, color: '#5A6270', marginBottom: 16 }}>현재 테마({currentTheme.label})에서 사용 가능한 섹션입니다. ↑↓ 버튼으로 순서를 변경하세요.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {(() => {
                  const ordered = [...sections]
                    .filter((s) => themeSections.some((d) => d.key === s.key))
                    .sort((a, b) => a.sortOrder - b.sortOrder);
                  return ordered.map((state, i) => {
                    const def = themeSections.find((d) => d.key === state.key);
                    if (!def) return null;
                    return (
                      <div key={state.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #F0EDE7' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => moveSection(state.key, -1)}
                            disabled={i === 0}
                            style={{ width: 22, height: 20, border: '1px solid #E2DDD2', borderRadius: 4, background: '#FAFAF8', fontSize: 11, cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.3 : 1, lineHeight: 1 }}
                          >▲</button>
                          <button
                            type="button"
                            onClick={() => moveSection(state.key, 1)}
                            disabled={i === ordered.length - 1}
                            style={{ width: 22, height: 20, border: '1px solid #E2DDD2', borderRadius: 4, background: '#FAFAF8', fontSize: 11, cursor: i === ordered.length - 1 ? 'default' : 'pointer', opacity: i === ordered.length - 1 ? 0.3 : 1, lineHeight: 1 }}
                          >▼</button>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={state.enabled}
                            onChange={() => toggleSection(state.key)}
                            style={{ width: 16, height: 16, accentColor: currentTheme.color, flexShrink: 0 }}
                          />
                          <span style={{ fontSize: 14, fontWeight: state.enabled ? 600 : 400, color: state.enabled ? '#1B2430' : '#8A93A8' }}>{def.label}</span>
                          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#C9CFDA', fontFamily: 'monospace' }}>{def.key}</span>
                        </label>
                      </div>
                    );
                  });
                })()}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: '전화번호', value: phone, setter: setPhone, placeholder: '02-1234-5678' },
                  { label: '주소', value: address, setter: setAddress, placeholder: '서울시 강남구...' },
                  { label: '운영 시간', value: hours, setter: setHours, placeholder: '평일 14:00~22:00' },
                  { label: '카카오 채널 URL', value: kakaoChannelUrl, setter: setKakaoChannelUrl, placeholder: 'https://pf.kakao.com/...' },
                ].map(({ label, value, setter, placeholder }) => (
                  <label key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#5A6270' }}>{label}</span>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      placeholder={placeholder}
                      style={{ height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #D5D0C6', fontSize: 13, fontFamily: 'inherit' }}
                    />
                  </label>
                ))}
                {props.subjects && (
                  <div style={{ fontSize: 12, color: '#5A6270', paddingTop: 4 }}>과목: {props.subjects}</div>
                )}
              </div>
              <Link href={`/${props.slug}/admin`} style={{ marginTop: 14, display: 'block', fontSize: 13, color: '#1E5645', fontWeight: 600, textDecoration: 'none' }}>학원 관리자 →</Link>
            </div>
          </div>
        </div>
        {/* 원장 연락 기록 */}
        <div style={{ padding: 24, borderRadius: 14, background: '#FFFFFF' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>원장 연락 기록</div>

          {/* Add entry */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'flex-start' }}>
            <select
              value={logChannel}
              onChange={(e) => setLogChannel(e.target.value)}
              style={{ height: 40, padding: '0 10px', borderRadius: 8, border: '1px solid #D5D0C6', fontSize: 13, fontFamily: 'inherit', flexShrink: 0 }}
            >
              <option value="phone">전화</option>
              <option value="kakao">카카오</option>
              <option value="email">이메일</option>
              <option value="visit">방문</option>
              <option value="other">기타</option>
            </select>
            <textarea
              value={logNote}
              onChange={(e) => setLogNote(e.target.value)}
              placeholder="연락 내용 메모..."
              rows={2}
              style={{ flex: 1, padding: '9px 12px', border: '1px solid #D5D0C6', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
            />
            <button
              onClick={addContactLog}
              disabled={addingLog || !logNote.trim()}
              style={{ height: 40, padding: '0 16px', borderRadius: 8, border: 'none', background: '#1D3FA8', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: (addingLog || !logNote.trim()) ? 'not-allowed' : 'pointer', opacity: (addingLog || !logNote.trim()) ? 0.5 : 1, flexShrink: 0 }}
            >
              기록
            </button>
          </div>

          {logs.length === 0 ? (
            <div style={{ fontSize: 14, color: '#9AA3AF' }}>연락 기록이 없습니다.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {logs.map((l) => (
                <div key={l.id} style={{ padding: '12px 0', borderBottom: '1px solid #F0EDE7', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0, width: 50, fontSize: 12, fontWeight: 700, color: '#5A6270', paddingTop: 2 }}>
                    {{ phone: '전화', kakao: '카카오', email: '이메일', visit: '방문', other: '기타' }[l.channel] ?? l.channel}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, lineHeight: 1.6 }}>{l.note}</div>
                    <div style={{ fontSize: 12, color: '#9AA3AF', marginTop: 2 }}>
                      {new Date(l.createdAt).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })} · {l.authorEmail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
