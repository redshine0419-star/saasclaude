'use client';

import { useState } from 'react';
import Link from 'next/link';

type Active = 'home' | 'service' | 'demo' | 'pricing' | 'consult' | 'apply';

export function FdHeader({ active = 'home' }: { active?: Active }) {
  const [open, setOpen] = useState(false);

  const navLinks: { key: Active; href: string; label: string }[] = [
    { key: 'service', href: '/service', label: '서비스 소개' },
    { key: 'demo', href: '/demo', label: '데모 보기' },
    { key: 'pricing', href: '/pricing', label: '요금' },
    { key: 'consult', href: '/consult', label: '상담' },
    { key: 'apply', href: '/apply', label: '베타 신청' },
  ];

  return (
    <>
      <header
        style={{
          width: '100%',
          height: 76,
          boxSizing: 'border-box',
          padding: '0 clamp(20px, 4vw, 56px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          background: '#FFFFFF',
          borderBottom: '1px solid #E3E7EE',
          color: '#14213D',
          fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif",
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#14213D',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <circle cx="11" cy="11" r="9" fill="#F5B700" />
            <circle cx="11" cy="11" r="3.5" fill="#14213D" />
          </svg>
          <span style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-0.5px' }}>첫등원</span>
        </Link>

        <nav
          aria-label="주 메뉴"
          style={{
            display: 'flex',
            gap: 'clamp(16px, 2.4vw, 36px)',
            fontSize: 15,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
          className="fd-nav"
        >
          {navLinks.map(({ key, href, label }) => (
            <Link
              key={key}
              href={href}
              style={{
                color: key === active ? '#14213D' : '#4A5568',
                fontWeight: key === active ? 700 : 500,
                textDecoration: 'none',
                padding: '26px 0 23px',
                borderBottom: `3px solid ${key === active ? '#F5B700' : 'transparent'}`,
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <Link
            href="/consult"
            className="fd-cta"
            style={{
              flexShrink: 0,
              height: 44,
              padding: '0 18px',
              borderRadius: 10,
              background: '#14213D',
              color: '#FFFFFF',
              textDecoration: 'none',
              fontSize: 15,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            무료 진단 받기
          </Link>
          <button
            type="button"
            aria-label="메뉴 열기"
            onClick={() => setOpen(true)}
            className="fd-hamburger"
            style={{
              width: 44,
              height: 44,
              border: 'none',
              background: 'transparent',
              color: '#14213D',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(14,23,48,0.5)',
          }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 280,
              height: '100%',
              background: '#FFFFFF',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 8 }}
                aria-label="닫기"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            {navLinks.map(({ key, href, label }) => (
              <Link
                key={key}
                href={href}
                style={{
                  color: key === active ? '#14213D' : '#4A5568',
                  fontWeight: key === active ? 700 : 500,
                  textDecoration: 'none',
                  padding: '14px 8px',
                  fontSize: 17,
                  borderBottom: '1px solid #F0F1F3',
                }}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/consult"
              style={{
                marginTop: 20,
                height: 52,
                borderRadius: 12,
                background: '#14213D',
                color: '#FFFFFF',
                textDecoration: 'none',
                fontSize: 16,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => setOpen(false)}
            >
              무료 진단 받기
            </Link>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 760px) {
          .fd-nav { display: none !important; }
          .fd-hamburger { display: flex !important; }
          .fd-cta { height: 40px !important; padding: 0 14px !important; font-size: 14px !important; }
        }
      `}</style>
    </>
  );
}
