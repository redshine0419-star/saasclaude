'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

export type Academy = { slug: string; name: string; role: 'owner' | 'staff'; live: boolean };
export type Me = { loggedIn: false } | { loggedIn: true; name: string | null; email: string; academies: Academy[]; isPlatformAdmin: boolean };

/** 서비스 사이트 머리말의 로그인 상태 — 한 번만 불러와 데스크톱·모바일 메뉴가 같이 쓴다 */
export function useMe(): Me | null {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    let alive = true;
    fetch('/api/account/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: Me) => alive && setMe(d))
      .catch(() => alive && setMe({ loggedIn: false }));
    return () => { alive = false; };
  }, []);
  return me;
}

const dark: React.CSSProperties = { height: 44, padding: '0 16px', borderRadius: 10, background: '#14213D', color: '#FFFFFF', textDecoration: 'none', fontSize: 15, fontWeight: 600, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', flexShrink: 0 };
const outline: React.CSSProperties = { ...dark, background: '#FFFFFF', color: '#14213D', border: '1px solid #CDD3DD' };
const menuItem: React.CSSProperties = { display: 'block', padding: '10px 14px', fontSize: 14, color: '#14213D', textDecoration: 'none', borderRadius: 8, whiteSpace: 'nowrap' };

/** 데스크톱 머리말 오른쪽 */
export function FdAccountDesktop({ me }: { me: Me | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  if (!me) return <span style={{ width: 72 }} aria-hidden="true" />;
  if (!me.loggedIn) {
    return (
      <>
        <a href="/auth/signin?callbackUrl=%2F" className="fd-acct" style={{ ...outline, height: 44 }}>로그인</a>
        <Link href="/consult" className="fd-cta" style={dark}>무료 진단 받기</Link>
      </>
    );
  }
  const first = me.academies[0];
  return (
    <div ref={ref} style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
      {me.academies.length === 1 && first ? (
        <>
          <a href={`/${first.slug}`} target="_blank" rel="noopener noreferrer" className="fd-acct" style={outline}>홈페이지 ↗</a>
          <a href={`/${first.slug}/admin`} className="fd-cta" style={dark}>학원 관리</a>
        </>
      ) : me.academies.length > 1 ? (
        <button type="button" className="fd-cta" onClick={() => setOpen((v) => !v)} aria-expanded={open} style={{ ...dark, border: 'none', cursor: 'pointer', font: 'inherit', fontSize: 15, fontWeight: 600 }}>
          내 학원 {me.academies.length} ▾
        </button>
      ) : (
        <Link href="/start" className="fd-cta" style={dark}>학원 만들기</Link>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="내 계정 메뉴"
        aria-expanded={open}
        className="fd-acct"
        style={{ width: 44, height: 44, borderRadius: 22, border: '1px solid #CDD3DD', background: '#F3F5F8', color: '#14213D', fontWeight: 700, fontSize: 16, cursor: 'pointer', flexShrink: 0 }}
      >
        {(me.name || me.email).slice(0, 1)}
      </button>
      {open && (
        <div role="menu" style={{ position: 'absolute', right: 0, top: 52, minWidth: 240, background: '#FFFFFF', border: '1px solid #E3E7EE', borderRadius: 12, boxShadow: '0 12px 32px rgba(20,33,61,.12)', padding: 6, zIndex: 60 }}>
          <div style={{ padding: '8px 14px', fontSize: 12, color: '#4A5568', overflowWrap: 'anywhere' }}>{me.email}</div>
          {me.academies.map((a) => (
            <div key={a.slug} style={{ borderTop: '1px solid #F0F1F3', padding: '6px 0' }}>
              <div style={{ padding: '4px 14px', fontSize: 13, fontWeight: 700 }}>{a.name}{a.role === 'staff' ? ' (직원)' : ''}{!a.live ? ' · 비공개' : ''}</div>
              <a role="menuitem" href={`/${a.slug}/admin`} style={menuItem}>학원 관리</a>
              <a role="menuitem" href={`/${a.slug}`} target="_blank" rel="noopener noreferrer" style={menuItem}>홈페이지 ↗</a>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #F0F1F3', paddingTop: 6 }}>
            {me.isPlatformAdmin && <a role="menuitem" href="/platform" style={menuItem}>플랫폼 관리</a>}
            <a role="menuitem" href="/account" style={menuItem}>내 계정</a>
            <button role="menuitem" type="button" onClick={() => signOut({ callbackUrl: '/' })} style={{ ...menuItem, width: '100%', textAlign: 'left', border: 'none', background: 'none', font: 'inherit', fontSize: 14, cursor: 'pointer' }}>로그아웃</button>
          </div>
        </div>
      )}
    </div>
  );
}

/** 모바일 서랍 메뉴 아래쪽 */
export function FdAccountMobile({ me, onNavigate }: { me: Me | null; onNavigate: () => void }) {
  const box: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 };
  const big: React.CSSProperties = { height: 52, borderRadius: 12, textDecoration: 'none', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  if (!me) return null;
  if (!me.loggedIn) {
    return (
      <div style={box}>
        <a href="/auth/signin?callbackUrl=%2F" onClick={onNavigate} style={{ ...big, border: '1px solid #CDD3DD', color: '#14213D' }}>로그인</a>
        <Link href="/consult" onClick={onNavigate} style={{ ...big, background: '#14213D', color: '#FFFFFF' }}>무료 진단 받기</Link>
      </div>
    );
  }
  return (
    <div style={box}>
      <div style={{ fontSize: 12, color: '#4A5568', overflowWrap: 'anywhere' }}>{me.email}</div>
      {me.academies.length === 0 && <Link href="/start" onClick={onNavigate} style={{ ...big, background: '#14213D', color: '#FFFFFF' }}>학원 만들기</Link>}
      {me.academies.map((a) => (
        <div key={a.slug} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 10, borderRadius: 12, background: '#F3F5F8' }}>
          <b style={{ fontSize: 14 }}>{a.name}{a.role === 'staff' ? ' (직원)' : ''}{!a.live ? ' · 비공개' : ''}</b>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <a href={`/${a.slug}/admin`} onClick={onNavigate} style={{ ...big, height: 46, background: '#14213D', color: '#FFFFFF', fontSize: 15 }}>학원 관리</a>
            <a href={`/${a.slug}`} target="_blank" rel="noopener noreferrer" onClick={onNavigate} style={{ ...big, height: 46, border: '1px solid #CDD3DD', color: '#14213D', background: '#FFFFFF', fontSize: 15 }}>홈페이지 ↗</a>
          </div>
        </div>
      ))}
      {me.isPlatformAdmin && <a href="/platform" onClick={onNavigate} style={{ fontSize: 15, color: '#14213D', padding: '10px 4px' }}>플랫폼 관리</a>}
      <a href="/account" onClick={onNavigate} style={{ fontSize: 15, color: '#14213D', padding: '10px 4px' }}>내 계정</a>
      <button type="button" onClick={() => signOut({ callbackUrl: '/' })} style={{ textAlign: 'left', border: 'none', background: 'none', font: 'inherit', fontSize: 15, color: '#4A5568', padding: '10px 4px', cursor: 'pointer' }}>로그아웃</button>
    </div>
  );
}

/** 모바일 머리말 오른쪽 작은 버튼 하나 */
export function FdAccountCompact({ me }: { me: Me | null }) {
  const s: React.CSSProperties = { height: 40, padding: '0 14px', borderRadius: 10, background: '#14213D', color: '#FFFFFF', textDecoration: 'none', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' };
  if (!me || !me.loggedIn) return <a href="/auth/signin?callbackUrl=%2F" style={{ ...s, background: '#FFFFFF', color: '#14213D', border: '1px solid #CDD3DD' }}>로그인</a>;
  const first = me.academies[0];
  if (first) return <a href={`/${first.slug}/admin`} style={s}>학원 관리</a>;
  return <Link href="/start" style={s}>학원 만들기</Link>;
}
