'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { SIGNUP_CONSENTS } from '@/lib/legal/documents';

type Key = (typeof SIGNUP_CONSENTS)[number]['key'];
type Props = { email: string; next: string; renewal: boolean; marketingInitial: boolean };

export function ConsentForm({ email, next, renewal, marketingInitial }: Props) {
  const [checked, setChecked] = useState<Record<Key, boolean>>({ age: false, terms: false, privacy: false, marketing: marketingInitial });
  const [open, setOpen] = useState<Key | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const all = SIGNUP_CONSENTS.every((c) => checked[c.key]);
  const requiredOk = SIGNUP_CONSENTS.filter((c) => c.required).every((c) => checked[c.key]);

  function toggleAll(v: boolean) {
    setChecked({ age: v, terms: v, privacy: v, marketing: v });
  }

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

        <label style={{ display: 'flex', flexWrap: 'nowrap', gap: 10, alignItems: 'center', padding: '14px 16px', borderRadius: 12, background: '#F3F5F8', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
          <input type="checkbox" checked={all} onChange={(e) => toggleAll(e.target.checked)} style={{ width: 20, height: 20, margin: 0, flexShrink: 0 }} />
          전체 동의 (선택 항목 포함)
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {SIGNUP_CONSENTS.map((c) => (
            <div key={c.key} style={{ borderBottom: '1px solid #EEF0F3', padding: '10px 4px' }}>
              <div style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'flex-start', gap: 10 }}>
                <label style={{ display: 'flex', flexWrap: 'nowrap', gap: 10, alignItems: 'flex-start', flex: 1, fontSize: 15, lineHeight: 1.5, cursor: 'pointer' }}>
                  <input type="checkbox" checked={checked[c.key]} onChange={(e) => setChecked((p) => ({ ...p, [c.key]: e.target.checked }))} style={{ width: 18, height: 18, margin: '2px 0 0', flexShrink: 0 }} />
                  {`[${c.required ? '필수' : '선택'}] ${c.label}`}
                </label>
                {'link' in c && c.link ? (
                  <a href={c.link} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, fontSize: 13, color: '#4A5568' }}>전문</a>
                ) : null}
                {'detail' in c && c.detail ? (
                  <button type="button" onClick={() => setOpen(open === c.key ? null : c.key)} aria-expanded={open === c.key} style={{ flexShrink: 0, border: 'none', background: 'none', padding: 0, font: 'inherit', fontSize: 13, color: '#4A5568', cursor: 'pointer' }}>
                    {open === c.key ? '접기' : '자세히'}
                  </button>
                ) : null}
              </div>
              {'detail' in c && c.detail && open === c.key && (
                <table style={{ width: '100%', marginTop: 8, borderCollapse: 'collapse', fontSize: 13, background: '#FAFBFC' }}>
                  <tbody>
                    {c.detail.map(([k, v]) => (
                      <tr key={k}>
                        <th style={{ textAlign: 'left', verticalAlign: 'top', padding: '6px 10px', width: 80, color: '#4A5568', fontWeight: 600, whiteSpace: 'nowrap' }}>{k}</th>
                        <td style={{ padding: '6px 10px', lineHeight: 1.6 }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>

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
