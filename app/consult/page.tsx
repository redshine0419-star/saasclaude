'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FdHeader } from '@/components/fd/FdHeader';
import { FdFooter } from '@/components/fd/FdFooter';

export default function ConsultPage() {
  const [form, setForm] = useState({
    academyName: '',
    area: '',
    subject: '',
    phone: '',
    currentUrl: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const canSubmit = form.academyName && form.area && form.subject && form.phone && agreed;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, agreed }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? '오류가 발생했습니다.'); return; }
      window.location.href = '/consult/done';
    } catch {
      setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  const subjects = ['수학', '영어', '국어', '과학', '논술·글쓰기', '음악', '미술', '기타'];

  return (
    <div data-theme="fd" style={{ fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif", background: '#FFFFFF', color: '#14213D' }}>
      <FdHeader active="consult" />

      <section style={{ padding: 'clamp(56px, 7vw, 96px) clamp(20px, 4vw, 56px)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#8A6400', marginBottom: 8 }}>무료 진단</div>
            <h1 style={{ margin: 0, fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 700, letterSpacing: '-1px', lineHeight: 1.3 }}>우리 학원에 맞는 방향을<br />무료로 확인하세요</h1>
            <p style={{ margin: '16px 0 0', fontSize: 16, lineHeight: 1.75, color: '#4A5568' }}>
              담당자가 현재 상황을 파악하고 적합한 구성을 직접 제안드립니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 32, borderRadius: 20, background: '#F3F5F8' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>학원(교습소) 이름 <span style={{ color: '#8A3A1C' }}>*</span></span>
                <input
                  type="text" required value={form.academyName}
                  onChange={(e) => set('academyName', e.target.value)}
                  placeholder="OO수학학원"
                  style={{ height: 48, padding: '0 14px', borderRadius: 10, border: '1px solid #CDD3DD', fontSize: 15, outline: 'none', fontFamily: 'inherit', background: '#FFFFFF' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>지역 <span style={{ color: '#8A3A1C' }}>*</span></span>
                <input
                  type="text" required value={form.area}
                  onChange={(e) => set('area', e.target.value)}
                  placeholder="서울 강남구"
                  style={{ height: 48, padding: '0 14px', borderRadius: 10, border: '1px solid #CDD3DD', fontSize: 15, outline: 'none', fontFamily: 'inherit', background: '#FFFFFF' }}
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>주요 과목 <span style={{ color: '#8A3A1C' }}>*</span></span>
                <select
                  required value={form.subject}
                  onChange={(e) => set('subject', e.target.value)}
                  style={{ height: 48, padding: '0 14px', borderRadius: 10, border: '1px solid #CDD3DD', fontSize: 15, outline: 'none', fontFamily: 'inherit', background: '#FFFFFF' }}
                >
                  <option value="">선택하세요</option>
                  {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>연락처 <span style={{ color: '#8A3A1C' }}>*</span></span>
                <input
                  type="tel" required value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="010-0000-0000"
                  style={{ height: 48, padding: '0 14px', borderRadius: 10, border: '1px solid #CDD3DD', fontSize: 15, outline: 'none', fontFamily: 'inherit', background: '#FFFFFF' }}
                />
              </label>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>현재 홈페이지 <span style={{ fontSize: 13, color: '#8A93A8', fontWeight: 400 }}>(있으면)</span></span>
              <input
                type="url" value={form.currentUrl}
                onChange={(e) => set('currentUrl', e.target.value)}
                placeholder="https://..."
                style={{ height: 48, padding: '0 14px', borderRadius: 10, border: '1px solid #CDD3DD', fontSize: 15, outline: 'none', fontFamily: 'inherit', background: '#FFFFFF' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                style={{ marginTop: 3, width: 16, height: 16, accentColor: '#14213D', flexShrink: 0 }}
              />
              <span style={{ fontSize: 14, lineHeight: 1.6, color: '#3C4659' }}>
                [필수] 개인정보 수집·이용에 동의합니다. 수집 정보(학원명, 연락처)는 진단 상담 목적으로만 사용하며 1년 후 파기합니다.
              </span>
            </label>

            {error && <p style={{ margin: 0, color: '#8A3A1C', fontSize: 14 }}>{error}</p>}

            <button
              type="submit"
              disabled={!canSubmit || loading}
              style={{ height: 52, borderRadius: 12, border: 'none', background: canSubmit ? '#14213D' : '#C9CFDA', color: '#FFFFFF', fontSize: 16, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
            >
              {loading ? '신청 중...' : '무료 진단 신청'}
            </button>
          </form>
        </div>
      </section>

      <FdFooter />
    </div>
  );
}
