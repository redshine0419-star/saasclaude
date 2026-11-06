'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { SIGNUP_CONSENTS, requiredAgreed } from '@/lib/legal/consents';
import { ConsentList } from '@/components/legal/ConsentList';

type Props = { email: string; next: string; renewal: boolean; marketingInitial: boolean; promoInitial?: boolean };

export function ConsentForm({ email, next, renewal, marketingInitial, promoInitial = marketingInitial }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({ age: false, terms: false, privacy: false, promo: promoInitial, ad: marketingInitial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const requiredOk = requiredAgreed(SIGNUP_CONSENTS, checked);

  async function submit() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/account/consent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(checked) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error ?? '저장하지 못했습니다.');
      window.location.href = next;
    } catch {
      setError('저장하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main data-theme="fd" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#F3F5F8', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif", color: '#14213D' }}>
      <div style={{ width: '100%', maxWidth: 520, background: '#FFFFFF', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#8A6400' }}>첫등원 {renewal ? '약관 변경 안내' : '회원가입'}</div>
          <h1 style={{ margin: '6px 0 0', fontSize: 22 }}>{renewal ? '바뀐 약관에 다시 동의해 주세요' : '약관에 동의해 주세요'}</h1>
          <div style={{ fontSize: 13, color: '#4A5568', marginTop: 6 }}>{email}</div>
        </div>

        <h2 style={{ margin: 0, fontSize: 16 }}>이용약관 및 개인정보 수집 동의</h2>
        <ConsentList items={SIGNUP_CONSENTS} values={checked} onChange={setChecked} allLabel="아래 약관에 모두 동의합니다. (선택 항목 포함)" idPrefix="signup" />
        <p style={{ margin: 0, fontSize: 12, color: '#4A5568' }}>선택 항목은 동의하지 않아도 가입할 수 있으며, 가입 후 &ldquo;내 계정&rdquo;에서 언제든 바꿀 수 있습니다.</p>

        {error && <div role="alert" style={{ fontSize: 14, color: '#B42318' }}>{error}</div>}
        <button type="button" onClick={submit} disabled={!requiredOk || saving} style={{ height: 52, borderRadius: 12, border: 'none', background: '#14213D', color: '#FFFFFF', font: 'inherit', fontSize: 16, fontWeight: 700, cursor: requiredOk ? 'pointer' : 'default', opacity: requiredOk ? 1 : 0.4 }}>
          {saving ? '저장 중…' : '동의하고 시작하기'}
        </button>
        <button type="button" onClick={() => signOut({ callbackUrl: '/' })} style={{ border: 'none', background: 'none', font: 'inherit', fontSize: 13, color: '#4A5568', cursor: 'pointer' }}>
          동의하지 않고 나가기
        </button>
      </div>
    </main>
  );
}
