'use client';

import { useState } from 'react';

type Props = {
  name: string;
  slug: string;
  phone: string | null;
  kakaoChannelUrl: string | null;
  accentColor: string | null;
};

const NAV_ITEMS = [
  { key: 'results', label: '성적 결과' },
  { key: 'system', label: '시험 대비' },
  { key: 'curriculum', label: '커리큘럼' },
  { key: 'teachers', label: '강사진' },
  { key: 'fee', label: '교습비' },
  { key: 'apply', label: '오시는 길' },
];

export default function SiteHeaderResult({ name, slug, phone, kakaoChannelUrl, accentColor }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const accent = accentColor ?? '#1D3FA8';

  return (
    <>
      <header className="sticky top-0 z-50 bg-dark border-b border-[#2A3B5A]">
        <div className="max-w-[1440px] mx-auto px-5 md:px-20 h-[60px] md:h-[76px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href={`/${slug}`} className="font-grotesk text-xl md:text-2xl font-extrabold text-on-dark no-underline tracking-tight">
              {name}
            </a>
            <span className="hidden md:inline-block px-2 py-[3px] border border-[#5B6B85] rounded text-[13px] text-on-dark-muted">
              내신·입시 수학
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-[15px]">
            {NAV_ITEMS.map(({ key, label }) => (
              <a key={key} href={`#${key}`} className="text-on-dark-muted hover:text-on-dark transition-colors no-underline">
                {label}
              </a>
            ))}
          </nav>

          <a
            href="#apply"
            style={{ background: accent }}
            className="hidden md:flex items-center h-11 px-5 rounded-[6px] text-white text-[15px] font-bold no-underline hover:opacity-90"
          >
            레벨테스트 신청
          </a>

          <button
            type="button"
            className="md:hidden w-11 h-11 flex items-center justify-center text-on-dark"
            onClick={() => setMenuOpen(true)}
            aria-label="메뉴 열기"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>
            </svg>
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-dark flex flex-col">
          <div className="h-[60px] px-5 flex items-center justify-between border-b border-[#2A3B5A]">
            <span className="font-grotesk text-xl font-extrabold text-on-dark">{name}</span>
            <button type="button" onClick={() => setMenuOpen(false)} className="w-11 h-11 flex items-center justify-center text-on-dark" aria-label="메뉴 닫기">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18"/>
              </svg>
            </button>
          </div>
          <nav className="px-5 flex flex-col">
            {NAV_ITEMS.map(({ key, label }) => (
              <a key={key} href={`#${key}`} onClick={() => setMenuOpen(false)}
                className="flex justify-between items-center h-[60px] border-b border-[#2A3B5A] text-on-dark no-underline text-[19px] font-semibold">
                {label}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9AA8BF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
              </a>
            ))}
          </nav>
          <div className="mt-auto px-5 pb-9 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              {phone && (
                <a href={`tel:${phone.replace(/-/g, '')}`} className="h-[52px] border border-[#3A4A66] rounded-xl text-on-dark no-underline font-semibold flex items-center justify-center gap-2">
                  전화
                </a>
              )}
              {kakaoChannelUrl && (
                <a href={kakaoChannelUrl} className="h-[52px] border border-[#3A4A66] rounded-xl text-on-dark no-underline font-semibold flex items-center justify-center">
                  카톡 상담
                </a>
              )}
            </div>
            <a href="#apply" onClick={() => setMenuOpen(false)} style={{ background: accent }} className="h-[56px] rounded-xl text-white no-underline text-[17px] font-bold flex items-center justify-center">
              레벨테스트 신청
            </a>
          </div>
        </div>
      )}
    </>
  );
}
