'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type ThemeKey = 'warm' | 'result' | 'bright';

const THEMES: { value: ThemeKey; label: string; desc: string; color: string; bg: string; demo: string }[] = [
  { value: 'warm', label: '원장 직강형', desc: '원장 얼굴과 철학이 앞에 나오는 차분한 디자인', color: '#1E5645', bg: '#E4EEE9', demo: '/demo-warm' },
  { value: 'result', label: '성과 중심형', desc: '성적 향상·입시 결과를 숫자로 보여주는 디자인', color: '#1D3FA8', bg: '#E6EBF8', demo: '/demo-result' },
  { value: 'bright', label: '밝은 친근형', desc: '유아·초등 대상, 사진과 하루 일과 중심', color: '#0F766E', bg: '#DCFCE7', demo: '/demo-bright' },
];

const CONSENTS = [
  { key: 'consentTerms', label: '[필수] 서비스 이용약관에 동의합니다.', required: true },
  { key: 'consentPrivacy', label: '[필수] 개인정보 수집·이용에 동의합니다. (목적: 서비스 제공, 보유: 이용 종료 후 3년)', required: true },
  { key: 'consentBeta', label: '[필수] 베타 조건을 확인했습니다. (홈페이지 오픈일부터 3개월 무료, 자동 결제 없음)', required: true },
  { key: 'consentCase', label: '[선택] 익명 성공 사례로 활용하는 데 동의합니다.', required: false },
] as const;

type ConsentKey = (typeof CONSENTS)[number]['key'];

const input: React.CSSProperties = {
  height: 48, padding: '0 14px', borderRadius: 10, border: '1px solid #D1D5DB',
  fontSize: 16, fontFamily: 'inherit', color: '#14213D', background: '#FFFFFF', width: '100%', boxSizing: 'border-box',
};

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
      {children}
      {error ? (
        <span style={{ fontSize: 13, color: '#B42318' }}>{error}</span>
      ) : hint ? (
        <span style={{ fontSize: 13, color: '#6B7280' }}>{hint}</span>
      ) : null}
    </label>
  );
}

export function StartClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', slug: '', regNo: '', subjects: '', targetGrades: '', phone: '', address: '',
  });
  const [theme, setTheme] = useState<ThemeKey | null>(null);
  const [consents, setConsents] = useState<Record<ConsentKey, boolean>>({
    consentTerms: false, consentPrivacy: false, consentBeta: false, consentCase: false,
  });
  const [slugState, setSlugState] = useState<{ checking: boolean; available?: boolean; error?: string }>({ checking: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = k === 'slug' ? e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') : e.target.value;
    if (k === 'slug') setSlugState({ checking: !!value });
    setForm((f) => ({ ...f, [k]: value }));
  };

  useEffect(() => {
    if (!form.slug) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/start/slug?s=${encodeURIComponent(form.slug)}`);
        const data = await res.json();
        setSlugState({ checking: false, available: !!data.available, error: data.error });
      } catch {
        setSlugState({ checking: false });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [form.slug]);

  const step1Ok = !!(form.name.trim() && form.regNo.trim() && form.subjects.trim() && form.phone.trim() && form.address.trim() && slugState.available);
  const step3Ok = consents.consentTerms && consents.consentPrivacy && consents.consentBeta;

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, theme, ...consents }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? '홈페이지를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.');
        if (data.field === 'slug' || data.field === 'phone') setStep(1);
        return;
      }
      router.push(`/${data.slug}/admin?welcome=1`);
    } finally {
      setSubmitting(false);
    }
  }

  const primary = (enabled: boolean): React.CSSProperties => ({
    height: 52, padding: '0 28px', border: 'none', borderRadius: 12,
    background: enabled ? '#14213D' : '#C8CDD5', color: '#FFFFFF',
    fontSize: 16, fontWeight: 700, fontFamily: 'inherit', cursor: enabled ? 'pointer' : 'not-allowed',
  });
  const secondary: React.CSSProperties = {
    height: 52, padding: '0 20px', borderRadius: 12, border: '1px solid #D1D5DB', background: '#FFFFFF',
    color: '#14213D', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', gap: 8 }}>
        {['학원 정보', '테마 선택', '동의 후 공개'].map((label, i) => (
          <li key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ height: 4, borderRadius: 2, background: step > i ? '#14213D' : '#E3E7EE' }} />
            <span style={{ fontSize: 13, fontWeight: step === i + 1 ? 700 : 500, color: step === i + 1 ? '#14213D' : '#6B7280' }}>
              {i + 1}. {label}
            </span>
          </li>
        ))}
      </ol>

      {error && (
        <div role="alert" style={{ padding: '12px 16px', borderRadius: 10, background: '#FEF3F2', color: '#B42318', fontSize: 14 }}>{error}</div>
      )}

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Field label="학원 이름 *">
            <input style={input} value={form.name} onChange={set('name')} maxLength={40} placeholder="예: 하늘수학학원" />
          </Field>
          <Field
            label="홈페이지 주소 *"
            error={form.slug && !slugState.checking && slugState.available === false ? slugState.error : undefined}
            hint={slugState.checking ? '확인 중…' : slugState.available ? `growweb.me/${form.slug} 사용할 수 있습니다` : '영문 소문자·숫자·하이픈. 나중에 바꿀 수 없습니다.'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 15, color: '#6B7280', whiteSpace: 'nowrap' }}>growweb.me/</span>
              <input style={input} value={form.slug} onChange={set('slug')} maxLength={40} placeholder="hanul-math" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
            </div>
          </Field>
          <Field label="학원등록번호 *" hint="교육청에 등록된 번호. 홈페이지 맨 아래에 표시됩니다 (법정 표기).">
            <input style={input} value={form.regNo} onChange={set('regNo')} maxLength={40} placeholder="예: 제2024-서울강남-0001호" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18 }}>
            <Field label="교습과목 *">
              <input style={input} value={form.subjects} onChange={set('subjects')} maxLength={40} placeholder="예: 수학" />
            </Field>
            <Field label="대상 학년">
              <input style={input} value={form.targetGrades} onChange={set('targetGrades')} maxLength={40} placeholder="예: 중1~고3" />
            </Field>
          </div>
          <Field label="대표 전화 *" hint="학부모가 홈페이지에서 바로 거는 번호입니다.">
            <input style={input} value={form.phone} onChange={set('phone')} maxLength={20} inputMode="tel" placeholder="02-1234-5678" />
          </Field>
          <Field label="학원 주소 *">
            <input style={input} value={form.address} onChange={set('address')} maxLength={120} placeholder="예: 서울시 강남구 역삼동 123, 3층" />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" disabled={!step1Ok} onClick={() => { setError(''); setStep(2); }} style={primary(step1Ok)}>다음</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 14, color: '#4A5568' }}>테마는 나중에 관리자 화면에서 언제든 바꿀 수 있습니다.</p>
          {THEMES.map((t) => (
            <div
              key={t.value}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, border: `2px solid ${theme === t.value ? t.color : '#E3E7EE'}`, background: theme === t.value ? t.bg : '#FFFFFF' }}
            >
              <button
                type="button"
                onClick={() => setTheme(t.value)}
                aria-pressed={theme === t.value}
                style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit' }}
              >
                <span style={{ width: 44, height: 44, borderRadius: 10, background: t.color, flexShrink: 0 }} />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>{t.label}</span>
                  <span style={{ fontSize: 13, color: '#4A5568' }}>{t.desc}</span>
                </span>
              </button>
              <a href={t.demo} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: t.color, fontWeight: 600, whiteSpace: 'nowrap' }}>예시 보기</a>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <button type="button" onClick={() => setStep(1)} style={secondary}>이전</button>
            <button type="button" disabled={!theme} onClick={() => setStep(3)} style={primary(!!theme)}>다음</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: 16, borderRadius: 12, background: '#F8F9FB', fontSize: 14, lineHeight: 1.8 }}>
            <div><b>{form.name}</b> · {THEMES.find((t) => t.value === theme)?.label}</div>
            <div style={{ color: '#4A5568' }}>growweb.me/{form.slug}</div>
            <div style={{ color: '#4A5568' }}>만들기를 누르면 홈페이지가 <b>바로 공개</b>됩니다. 비어 있는 섹션은 내용을 채울 때까지 자동으로 숨겨집니다.</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 15, fontWeight: 700 }}>
              <input
                type="checkbox"
                style={{ width: 20, height: 20 }}
                checked={CONSENTS.every((c) => consents[c.key])}
                onChange={(e) => setConsents({ consentTerms: e.target.checked, consentPrivacy: e.target.checked, consentBeta: e.target.checked, consentCase: e.target.checked })}
              />
              전체 동의
            </label>
            {CONSENTS.map((c) => (
              <label key={c.key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.6 }}>
                <input
                  type="checkbox"
                  style={{ width: 20, height: 20, marginTop: 1, flexShrink: 0 }}
                  checked={consents[c.key]}
                  onChange={(e) => setConsents((p) => ({ ...p, [c.key]: e.target.checked }))}
                />
                {c.label}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <button type="button" onClick={() => setStep(2)} style={secondary}>이전</button>
            <button type="button" disabled={!step3Ok || submitting} onClick={submit} style={primary(step3Ok && !submitting)}>
              {submitting ? '만드는 중…' : '홈페이지 만들기'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
