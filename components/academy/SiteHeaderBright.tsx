'use client';

import { useState } from 'react';

type Props = {
  name: string;
  slug: string;
  phone: string | null;
  kakaoChannelUrl: string | null;
};

const NAV_ITEMS = [
  { key: 'day', label: '수업 하루' },
  { key: 'classes', label: '연령별 반' },
  { key: 'gallery', label: '수업 사진' },
  { key: 'safe', label: '안전·셔틀' },
  { key: 'trial', label: '오시는 길' },
];

export default function SiteHeaderBright({ name, slug, phone, kakaoChannelUrl }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-surface border-b border-line">
        <div className="max-w-[1440px] mx-auto px-5 md:px-16 h-[60px] md:h-[84px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 36 36" aria-hidden="true">
              <circle cx="18" cy="18" r="17" fill="#FFD54F"/>
              <circle cx="13" cy="15" r="2" fill="#1F2A37"/>
              <circle cx="23" cy="15" r="2" fill="#1F2A37"/>
              <path d="M12 22 Q18 27 24 22" stroke="#1F2A37" strokeWidth="2" fill="none" strokeLinecap="round"/>
            </svg>
            <a href={`/${slug}`} className="font-round text-2xl md:text-[28px] text-ink no-underline">
              {name}
            </a>
          </div>

          <nav className="hidden md:flex items-center gap-1 p-[6px] rounded-full bg-subtle text-[15px]">
            {NAV_ITEMS.map(({ key, label }) => (
              <a key={key} href={`#${key}`} className="px-[18px] py-[10px] rounded-full text-body hover:text-ink hover:bg-surface transition-colors no-underline">
                {label}
              </a>
            ))}
          </nav>

          <a href="#trial" className="hidden md:flex items-center h-12 px-[22px] rounded-full bg-accent text-on-accent text-[15px] font-bold no-underline hover:opacity-90">
            체험 수업 신청
          </a>

          <button type="button" className="md:hidden w-11 h-11 flex items-center justify-center text-ink" onClick={() => setMenuOpen(true)} aria-label="메뉴 열기">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>
            </svg>
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-bg flex flex-col">
          <div className="h-[60px] px-5 flex items-center justify-between border-b border-line">
            <span className="font-round text-2xl text-ink">{name}</span>
            <button type="button" onClick={() => setMenuOpen(false)} className="w-11 h-11 flex items-center justify-center text-ink" aria-label="메뉴 닫기">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18"/>
              </svg>
            </button>
          </div>
          <nav className="px-5 flex flex-col">
            {NAV_ITEMS.map(({ key, label }) => (
              <a key={key} href={`#${key}`} onClick={() => setMenuOpen(false)}
                className="flex justify-between items-center h-[60px] border-b border-line text-ink no-underline text-[19px] font-semibold">
                {label}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5A6270" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
              </a>
            ))}
          </nav>
          <div className="mt-auto px-5 pb-9 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              {phone && (
                <a href={`tel:${phone.replace(/-/g, '')}`} className="h-[52px] border border-input-line rounded-full text-ink no-underline font-semibold flex items-center justify-center">전화</a>
              )}
              {kakaoChannelUrl && (
                <a href={kakaoChannelUrl} className="h-[52px] border border-input-line rounded-full text-ink no-underline font-semibold flex items-center justify-center">카톡 상담</a>
              )}
            </div>
            <a href="#trial" onClick={() => setMenuOpen(false)} className="h-[56px] rounded-full bg-accent text-on-accent no-underline text-[17px] font-bold flex items-center justify-center">
              체험 수업 신청
            </a>
          </div>
        </div>
      )}
    </>
  );
}
