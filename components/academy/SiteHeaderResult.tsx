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
  { key: 'consult', label: '상담 신청' },
  { key: 'location', label: '오시는 길' },
];

export default function SiteHeaderResult({ name, slug, phone, kakaoChannelUrl }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-dark border-b border-white/10">
        <div className="acad-wrap h-[65px] md:h-[76px] flex items-center justify-between gap-4">
          <a href={`/${slug}`} className="font-grotesk text-[19px] md:text-[22px] font-black text-on-dark no-underline tracking-[-1px] whitespace-nowrap">
            {name}
          </a>

          <nav className="hidden lg:flex items-center gap-[27px] text-[13px]">
            {NAV_ITEMS.map(({ key, label }) => (
              <a key={key} href={`#${key}`} className="text-on-dark-muted hover:text-highlight transition-colors no-underline">
                {label}
              </a>
            ))}
          </nav>

          <a href="#consult" className="acad-btn hidden lg:inline-flex h-11 px-[18px] text-[13px]">
            레벨테스트 신청 ↗
          </a>

          <button
            type="button"
            className="lg:hidden w-11 h-11 flex items-center justify-center text-on-dark"
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
        <div className="lg:hidden fixed inset-0 z-[100] bg-dark flex flex-col">
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
            <a href="#consult" onClick={() => setMenuOpen(false)} className="acad-btn h-[56px] text-[17px]">
              레벨테스트 신청
            </a>
          </div>
        </div>
      )}
    </>
  );
}
