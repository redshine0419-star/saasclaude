'use client';

import { useState } from 'react';

type Props = {
  name: string;
  phone: string | null;
  kakaoChannelUrl: string | null;
};

export default function SiteHeader({ name, phone, kakaoChannelUrl }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-bg border-b border-line">
      <div className="max-w-[1440px] mx-auto px-5 md:px-20 h-[60px] md:h-[84px] flex items-center justify-between">
        {/* 로고 */}
        <a href="#top" className="font-serif text-xl md:text-2xl font-bold text-ink no-underline">
          {name}
        </a>

        {/* 데스크톱 내비 */}
        <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-body">
          <a href="#about" className="hover:text-accent transition-colors">원장 소개</a>
          <a href="#classes" className="hover:text-accent transition-colors">수업 안내</a>
          <a href="#fee" className="hover:text-accent transition-colors">교습비</a>
          <a href="#news" className="hover:text-accent transition-colors">소식</a>
        </nav>

        {/* 데스크톱 CTA */}
        <div className="hidden md:flex items-center gap-3">
          {phone && (
            <a
              href={`tel:${phone.replace(/-/g, '')}`}
              className="flex items-center gap-2 h-11 px-5 rounded-[10px] border border-input-line text-ink text-[15px] font-medium hover:bg-subtle transition-colors no-underline"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>
              {phone}
            </a>
          )}
          <a
            href="#consult"
            className="flex items-center h-11 px-5 rounded-[10px] bg-accent text-on-accent text-[15px] font-bold hover:opacity-90 transition-opacity no-underline"
          >
            무료 레벨테스트 신청
          </a>
        </div>

        {/* 모바일 햄버거 */}
        <button
          type="button"
          className="md:hidden w-11 h-11 flex items-center justify-center text-ink"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="메뉴 열기"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {menuOpen
              ? <><path d="M18 6L6 18"/><path d="M6 6l12 12"/></>
              : <><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></>
            }
          </svg>
        </button>
      </div>

      {/* 모바일 메뉴 드로어 */}
      {menuOpen && (
        <div className="md:hidden bg-surface border-b border-line px-5 py-4 flex flex-col gap-5 text-[16px] font-medium text-body">
          <a href="#about" className="hover:text-accent" onClick={() => setMenuOpen(false)}>원장 소개</a>
          <a href="#classes" className="hover:text-accent" onClick={() => setMenuOpen(false)}>수업 안내</a>
          <a href="#fee" className="hover:text-accent" onClick={() => setMenuOpen(false)}>교습비</a>
          <a href="#news" className="hover:text-accent" onClick={() => setMenuOpen(false)}>소식</a>
          <a href="#consult" className="hover:text-accent" onClick={() => setMenuOpen(false)}>상담 신청</a>
        </div>
      )}
    </header>
  );
}
