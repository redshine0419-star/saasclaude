'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FdHeader } from '@/components/fd/FdHeader';
import { FdFooter } from '@/components/fd/FdFooter';

export default function ApplyPage() {
  const [form, setForm] = useState({
    academyName: '',
    area: '',
    subject: '',
    directorName: '',
    phone: '',
    currentUrl: '',
    consentTerms: false,
    consentPrivacy: false,
    consentBeta: false,
    consentCase: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string, value: string | boolean) => setForm((f) => ({ ...f, [field]: value }));

  const canSubmit = form.academyName && form.area && form.subject && form.directorName && form.phone
    && form.consentTerms && form.consentPrivacy && form.consentBeta;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? '오류가 발생했습니다.'); return; }
      window.location.href = '/apply/done';
    } catch {
      setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  const subjects = ['수학', '영어', '국어', '과학', '사회', '논술·글쓰기', '음악', '미술', '체육', '기타'];

  return (
    <div data-theme="fd" style={{ fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif", background: '#FFFFFF', color: '#14213D' }}>
      <FdHeader active="apply" />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(48px, 6vw, 80px) clamp(20px, 4vw, 56px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, alignItems: 'start' }}>
        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#8A6400', marginBottom: 8 }}>베타 신청</div>
            <h1 style={{ margin: 0, fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 700, letterSpacing: '-1px', lineHeight: 1.3 }}>지금 신청하면<br />순서대로 제작합니다</h1>
            <p style={{ margin: '16px 0 0', fontSize: 16, lineHeight: 1.75, color: '#4A5568' }}>신청 후 영업일 기준 2일 이내 담당자가 연락드립니다.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>학원(교습소) 이름 <span style={{ color: '#8A3A1C' }}>*</span></span>
                <input
                  type="text" required value={form.academyName}
                  onChange={(e) => set('academyName', e.target.value)}
                  placeholder="OO수학학원"
                  style={{ height: 48, padding: '0 14px', borderRadius: 10, border: '1px solid #CDD3DD', fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>지역 <span style={{ color: '#8A3A1C' }}>*</span></span>
                <input
                  type="text" required value={form.area}
                  onChange={(e) => set('area', e.target.value)}
                  placeholder="서울 강남구 대치동"
                  style={{ height: 48, padding: '0 14px', borderRadius: 10, border: '1px solid #CDD3DD', fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
                />
              </label>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>과목 <span style={{ color: '#8A3A1C' }}>*</span></span>
              <select
                required value={form.subject}
                onChange={(e) => set('subject', e.target.value)}
                style={{ height: 48, padding: '0 14px', borderRadius: 10, border: '1px solid #CDD3DD', fontSize: 15, outline: 'none', fontFamily: 'inherit', background: '#FFFFFF' }}
              >
                <option value="">선택하세요</option>
                {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>원장님 성함 <span style={{ color: '#8A3A1C' }}>*</span></span>
                <input
                  type="text" required value={form.directorName}
                  onChange={(e) => set('directorName', e.target.value)}
                  placeholder="홍길동"
                  style={{ height: 48, padding: '0 14px', borderRadius: 10, border: '1px solid #CDD3DD', fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>연락처 <span style={{ color: '#8A3A1C' }}>*</span></span>
                <input
                  type="tel" required value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="010-0000-0000"
                  style={{ height: 48, padding: '0 14px', borderRadius: 10, border: '1px solid #CDD3DD', fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
                />
              </label>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>현재 홈페이지 주소 <span style={{ fontSize: 13, color: '#8A93A8', fontWeight: 400 }}>(있으면)</span></span>
              <input
                type="url" value={form.currentUrl}
                onChange={(e) => set('currentUrl', e.target.value)}
                placeholder="https://..."
                style={{ height: 48, padding: '0 14px', borderRadius: 10, border: '1px solid #CDD3DD', fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
              />
            </label>

            {/* Consents */}
            <div style={{ padding: 20, borderRadius: 12, background: '#F3F5F8', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>동의 항목</div>
              {[
                { key: 'consentTerms', label: '[필수] 서비스 이용약관에 동의합니다.' },
                { key: 'consentPrivacy', label: '[필수] 개인정보 수집·이용에 동의합니다. (목적: 서비스 신청 처리, 보유: 3년)' },
                { key: 'consentBeta', label: '[필수] 베타 참여 조건을 확인했습니다. (3개월 무료 후 유료 전환 또는 종료 선택)' },
                { key: 'consentCase', label: '[선택] 익명 성공 사례로 활용하는 데 동의합니다.' },
              ].map(({ key, label }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form[key as keyof typeof form] as boolean}
                    onChange={(e) => set(key, e.target.checked)}
                    style={{ marginTop: 3, flexShrink: 0, width: 16, height: 16, accentColor: '#14213D' }}
                  />
                  <span style={{ fontSize: 14, lineHeight: 1.6, color: '#3C4659' }}>{label}</span>
                </label>
              ))}
            </div>

            {error && <p style={{ margin: 0, color: '#8A3A1C', fontSize: 14 }}>{error}</p>}

            <button
              type="submit"
              disabled={!canSubmit || loading}
              style={{ height: 56, borderRadius: 12, border: 'none', background: canSubmit ? '#14213D' : '#C9CFDA', color: '#FFFFFF', fontSize: 17, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
            >
              {loading ? '신청 중...' : '베타 신청하기'}
            </button>
          </form>
        </div>

        {/* Sidebar */}
        <div style={{ padding: 32, borderRadius: 20, background: '#14213D', color: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>베타 혜택 안내</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: '✓', title: '3개월 완전 무료', desc: '오픈일 기준 3개월 동안 모든 기능을 무료로 이용합니다.' },
              { icon: '✓', title: '전담 제작팀 지원', desc: '학원 정보를 전달하면 제작팀이 직접 셋업해드립니다.' },
              { icon: '✓', title: '카카오톡 자동화 포함', desc: '상담 접수부터 등록 후속 안내까지 자동 발송됩니다.' },
              { icon: '✓', title: '월간 리포트 제공', desc: '매달 방문·신청·등록 수치와 운영 제안을 드립니다.' },
            ].map((item) => (
              <div key={item.title} style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: 12, background: '#F5B700', color: '#14213D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{item.title}</div>
                  <div style={{ fontSize: 14, color: '#B8C0CF', marginTop: 4, lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #2A3B5A', paddingTop: 20, fontSize: 13, color: '#8A93A8', lineHeight: 1.75 }}>
            <strong style={{ color: '#B8C0CF' }}>베타 종료 후 선택:</strong><br />
            · 유료 전환 (월 구독)<br />
            · 서비스 종료 (데이터 30일 유지 후 삭제)
          </div>
        </div>
      </div>

      <FdFooter />
    </div>
  );
}
