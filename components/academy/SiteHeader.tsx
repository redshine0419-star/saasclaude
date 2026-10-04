'use client';

import { useState } from 'react';

type Props = {
  name: string;
  slug: string;
  activePage: string;
  phone: string | null;
  kakaoChannelUrl: string | null;
  address: string | null;
  hours: string | null;
};

const NAV_ITEMS = [
  { key: 'about', label: '학원 소개' },
  { key: 'classes', label: '수업 안내' },
  { key: 'fee', label: '교습비' },
  { key: 'reviews', label: '성과·후기' },
  { key: 'news', label: '소식' },
  { key: 'location', label: '오시는 길' },
];

export default function SiteHeader({ name, slug, activePage, phone, kakaoChannelUrl, address, hours }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navHref = (key: string) => `/${slug}/${key}`;
  const homeHref = `/${slug}`;

  return (
    <>
      <header className="sticky top-0 z-50 bg-bg border-b border-line">
        <div className="max-w-[1440px] mx-auto px-5 md:px-20 h-[60px] md:h-[84px] flex items-center justify-between">
          {/* 로고 */}
          <a href={homeHref} className="font-serif text-xl md:text-2xl font-bold text-ink no-underline">
            {name}
          </a>

          {/* 데스크톱 내비 */}
          <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-body">
            {NAV_ITEMS.map(({ key, label }) => (
              <a
                key={key}
                href={navHref(key)}
                className={[
                  'hover:text-accent transition-colors pb-1',
                  activePage === key
                    ? 'text-accent border-b-2 border-accent font-semibold'
                    : '',
                ].join(' ')}
              >
                {label}
              </a>
            ))}
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
              href={`/${slug}/consult`}
              className="flex items-center h-11 px-5 rounded-[10px] bg-accent text-on-accent text-[15px] font-bold hover:opacity-90 transition-opacity no-underline"
            >
              무료 레벨테스트 신청
            </a>
          </div>

          {/* 모바일 햄버거 */}
          <button
            type="button"
            className="md:hidden w-11 h-11 flex items-center justify-center text-ink"
            onClick={() => setMenuOpen(true)}
            aria-label="메뉴 열기"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>
            </svg>
          </button>
        </div>
      </header>

      {/* M-NAV 풀스크린 오버레이 */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-bg flex flex-col" style={{ fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif" }}>
          {/* 상단 바 */}
          <div className="h-[60px] px-5 pr-2 flex items-center justify-between border-b border-line flex-shrink-0">
            <span className="font-serif text-xl font-bold text-ink">{name}</span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="w-11 h-11 flex items-center justify-center text-ink"
              aria-label="메뉴 닫기"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18"/>
              </svg>
            </button>
          </div>

          {/* 내비 아이템 */}
          <nav aria-label="주 메뉴" className="px-5 flex flex-col flex-shrink-0">
            {NAV_ITEMS.map(({ key, label }) => (
              <a
                key={key}
                href={navHref(key)}
                onClick={() => setMenuOpen(false)}
                className="flex justify-between items-center h-[60px] border-b border-line text-ink no-underline text-[19px] font-semibold"
              >
                {label}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5A6270" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
              </a>
            ))}
          </nav>

          {/* 하단 정보 + 버튼 */}
          <div className="mt-auto px-5 pb-9 flex flex-col gap-[10px]">
            {(hours || address) && (
              <div className="p-4 rounded-[14px] bg-white text-[14px] leading-relaxed">
                {hours && <><b>운영 시간</b> {hours}<br /></>}
                {address && <span className="text-body">{address}</span>}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {phone && (
                <a
                  href={`tel:${phone.replace(/-/g, '')}`}
                  className="h-[52px] border border-input-line rounded-[12px] text-ink no-underline font-semibold flex items-center justify-center gap-2"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>
                  전화
                </a>
              )}
              {kakaoChannelUrl && (
                <a
                  href={kakaoChannelUrl}
                  className="h-[52px] border border-input-line rounded-[12px] text-ink no-underline font-semibold flex items-center justify-center gap-2"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.8-.8L3 21l1.9-4.6A8.1 8.1 0 0 1 3 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z"/></svg>
                  카톡 상담
                </a>
              )}
            </div>
            <a
              href={`/${slug}/consult`}
              onClick={() => setMenuOpen(false)}
              className="h-[56px] rounded-[12px] bg-accent text-on-accent no-underline text-[17px] font-bold flex items-center justify-center"
            >
              무료 레벨테스트 신청
            </a>
          </div>
        </div>
      )}
    </>
  );
}
