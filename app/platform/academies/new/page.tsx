'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlatformSide } from '@/components/platform/PlatformSide';

export default function NewAcademyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    slug: '',
    theme: 'warm',
    subjects: '',
    address: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function autoSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 30);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.slug) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/platform/academies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? '오류가 발생했습니다.'); return; }
      router.push(`/platform/academies/${data.id}`);
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const themes = [
    { value: 'warm', label: '테마 A — 원장 직강형', color: '#1E5645', desc: '종이색 바탕, 칠판 녹색 강조, 명조 제목' },
    { value: 'result', label: '테마 B — 성과 중심형', color: '#1D3FA8', desc: '남색·흰색, 진한 파랑 강조, 굵은 고딕' },
    { value: 'bright', label: '테마 C — 밝은 친근형', color: '#0F766E', desc: '흰 바탕 + 파스텔 카드, 청록 강조, 둥근 제목' },
  ];

  return (
    <div style={{ display: 'flex', flex: 1 }}>
      <PlatformSide active="academies" />
      <main style={{ flex: 1, padding: '32px 40px', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif", background: '#F4F2EE', minHeight: '100vh' }}>
        <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/platform/academies" style={{ color: '#5A6270', textDecoration: 'none', fontSize: 14 }}>← 학원 목록</Link>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>새 학원 추가</h1>
            <div style={{ fontSize: 14, color: '#5A6270', marginTop: 4 }}>기본 정보와 테마를 설정하면 즉시 홈페이지가 열립니다.</div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 28, borderRadius: 14, background: '#FFFFFF' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>학원 이름 *</span>
                <input
                  type="text" required value={form.name}
                  onChange={(e) => {
                    set('name', e.target.value);
                    if (!form.slug || form.slug === autoSlug(form.name)) {
                      set('slug', autoSlug(e.target.value));
                    }
                  }}
                  placeholder="OO수학학원"
                  style={{ height: 44, padding: '0 12px', borderRadius: 8, border: '1px solid #D5D0C6', fontSize: 14, fontFamily: 'inherit' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>슬러그 (URL) *</span>
                <input
                  type="text" required value={form.slug}
                  onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="oo-math"
                  style={{ height: 44, padding: '0 12px', borderRadius: 8, border: '1px solid #D5D0C6', fontSize: 14, fontFamily: 'monospace' }}
                />
                {form.slug && <div style={{ fontSize: 12, color: '#5A6270' }}>growweb.me/{form.slug}</div>}
              </label>
            </div>

            {/* Theme picker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>테마</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {themes.map((t) => (
                  <label key={t.value} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 10, border: `2px solid ${form.theme === t.value ? t.color : '#E2DDD2'}`, cursor: 'pointer', background: form.theme === t.value ? '#FAFAF9' : '#FFFFFF' }}>
                    <input
                      type="radio" name="theme" value={t.value} checked={form.theme === t.value}
                      onChange={() => set('theme', t.value)}
                      style={{ accentColor: t.color, width: 16, height: 16 }}
                    />
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: t.color }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{t.label}</div>
                      <div style={{ fontSize: 12, color: '#5A6270' }}>{t.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>과목</span>
                <input
                  type="text" value={form.subjects}
                  onChange={(e) => set('subjects', e.target.value)}
                  placeholder="수학, 영어"
                  style={{ height: 44, padding: '0 12px', borderRadius: 8, border: '1px solid #D5D0C6', fontSize: 14, fontFamily: 'inherit' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>전화번호</span>
                <input
                  type="tel" value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="02-0000-0000"
                  style={{ height: 44, padding: '0 12px', borderRadius: 8, border: '1px solid #D5D0C6', fontSize: 14, fontFamily: 'inherit' }}
                />
              </label>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>주소</span>
              <input
                type="text" value={form.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="서울시 강남구 대치동 000"
                style={{ height: 44, padding: '0 12px', borderRadius: 8, border: '1px solid #D5D0C6', fontSize: 14, fontFamily: 'inherit' }}
              />
            </label>

            {error && <p style={{ margin: 0, color: '#8A3A1C', fontSize: 14 }}>{error}</p>}

            <button
              type="submit"
              disabled={!form.name || !form.slug || loading}
              style={{ height: 48, borderRadius: 10, border: 'none', background: '#1E5645', color: '#FFFFFF', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: (!form.name || !form.slug) ? 0.5 : 1 }}
            >
              {loading ? '생성 중...' : '학원 생성'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
