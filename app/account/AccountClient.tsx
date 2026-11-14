'use client';

import Link from 'next/link';
import { useState } from 'react';
import { signOut } from 'next-auth/react';

type Props = {
  email: string; name: string | null; joinedAt: string; consentAt: string | null; marketing: boolean; promo: boolean;
  academies: { name: string; slug: string; role: string }[];
  logs: { id: string; at: string; label: string; action: string; version: string }[];
};

const card: React.CSSProperties = { background: '#FFFFFF', borderRadius: 14, padding: 22, display: 'flex', flexDirection: 'column', gap: 10 };

export function AccountClient({ email, name, joinedAt, consentAt, marketing: initial, promo: promoInitial, academies, logs }: Props) {
  const [marketing, setMarketing] = useState(initial);
  const [promo, setPromo] = useState(promoInitial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function toggle(type: 'ad' | 'promo') {
    const cur = type === 'ad' ? marketing : promo;
    const label = type === 'ad' ? '광고성 정보 수신' : '홍보 목적 개인정보 수집·이용';
    setBusy(true);
    setMsg(null);
    const res = await fetch('/api/account/marketing', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, agree: !cur }) });
    setBusy(false);
    if (res.ok) {
      (type === 'ad' ? setMarketing : setPromo)(!cur);
      setMsg({ ok: true, text: !cur ? `${label}에 동의했습니다.` : `${label} 동의를 철회했습니다.` });
    } else setMsg({ ok: false, text: '저장하지 못했습니다.' });
  }

  async function withdraw() {
    if (!confirm('회원 탈퇴할까요? 계정과 동의 이력이 삭제되고 되돌릴 수 없습니다.')) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch('/api/account/delete', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) await signOut({ callbackUrl: '/' });
    else setMsg({ ok: false, text: data.error ?? '탈퇴하지 못했습니다.' });
  }

  return (
    <main data-theme="fd" style={{ minHeight: '100vh', background: '#F3F5F8', padding: '32px 16px', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif", color: '#14213D' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 24 }}>내 계정</h1>
          <Link href="/" style={{ fontSize: 14, color: '#4A5568' }}>더클 홈</Link>
        </div>

        <section style={card}>
          <div style={{ fontSize: 15, lineHeight: 1.8 }}>
            <div><b>{name ?? '이름 없음'}</b> · {email}</div>
            <div style={{ color: '#4A5568', fontSize: 13 }}>가입 {joinedAt}{consentAt ? ` · 약관 동의 ${consentAt}` : ''}</div>
          </div>
          {academies.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {academies.map((a) => (
                <Link key={a.slug} href={`/${a.slug}/admin`} style={{ padding: '4px 10px', borderRadius: 999, background: '#F3F5F8', fontSize: 13, color: '#14213D', textDecoration: 'none' }}>{a.name} ({a.role}) →</Link>
              ))}
            </div>
          )}
        </section>

        <section style={card}>
          <h2 style={{ margin: 0, fontSize: 16 }}>선택 동의</h2>
          <div style={{ fontSize: 14, color: '#4A5568', lineHeight: 1.7 }}>동의하지 않아도 서비스 이용에는 제한이 없고, 언제든 바꿀 수 있습니다.</div>
          {([
            ['promo', '홍보 목적 개인정보 수집·이용', '이름·이메일·휴대폰 번호를 더클 소식·혜택 안내에 씁니다.', promo],
            ['ad', '광고성 정보 수신', '더클 새 기능·이벤트·혜택 안내를 이메일·문자·카카오톡으로 받습니다.', marketing],
          ] as const).map(([type, title, desc, on]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingTop: 10, borderTop: '1px solid #EEF0F3' }}>
              <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
                <div style={{ fontSize: 13, color: '#4A5568' }}>{desc}</div>
              </div>
              <b style={{ color: on ? '#1E5645' : '#4A5568', fontSize: 14 }}>{on ? '동의함' : '동의하지 않음'}</b>
              <button type="button" onClick={() => toggle(type)} disabled={busy} style={{ height: 38, padding: '0 14px', borderRadius: 8, border: '1px solid #D5D9E0', background: '#FFFFFF', font: 'inherit', fontSize: 14, cursor: 'pointer' }}>
                {on ? '동의 철회' : '동의하기'}
              </button>
            </div>
          ))}
        </section>

        <section style={card}>
          <h2 style={{ margin: 0, fontSize: 16 }}>동의 내역</h2>
          <div style={{ fontSize: 13, color: '#4A5568' }}>
            <Link href="/terms" style={{ color: '#14213D' }}>이용약관</Link> · <Link href="/privacy" style={{ color: '#14213D' }}>개인정보처리방침</Link>
          </div>
          {logs.length === 0 ? (
            <div style={{ fontSize: 14, color: '#9AA3AF' }}>기록이 없습니다.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {logs.map((l) => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13, padding: '6px 0', borderBottom: '1px solid #EEF0F3' }}>
                  <span>{l.label} <b style={{ color: l.action === '동의' ? '#1E5645' : '#B42318' }}>{l.action}</b></span>
                  <span style={{ color: '#4A5568', whiteSpace: 'nowrap' }}>{l.at}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={card}>
          <h2 style={{ margin: 0, fontSize: 16 }}>로그아웃·탈퇴</h2>
          <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.7 }}>
            탈퇴하면 계정과 동의 이력이 바로 삭제됩니다. 혼자 원장인 학원이 있으면 먼저 학원 데이터를 내보내고 운영자에게 해지·원장 변경을 요청해 주세요.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => signOut({ callbackUrl: '/' })} style={{ height: 40, padding: '0 16px', borderRadius: 8, border: '1px solid #D5D9E0', background: '#FFFFFF', font: 'inherit', fontSize: 14, cursor: 'pointer' }}>로그아웃</button>
            <button type="button" onClick={withdraw} disabled={busy} style={{ height: 40, padding: '0 16px', borderRadius: 8, border: '1px solid #F3C3BC', background: '#FFFFFF', color: '#B42318', font: 'inherit', fontSize: 14, cursor: 'pointer' }}>회원 탈퇴</button>
          </div>
        </section>
        {msg && <div role={msg.ok ? 'status' : 'alert'} style={{ fontSize: 14, color: msg.ok ? '#1E5645' : '#B42318' }}>{msg.text}</div>}
      </div>
    </main>
  );
}
