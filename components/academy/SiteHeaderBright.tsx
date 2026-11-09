'use client';

import { useState } from 'react';

type Props = {
  name: string;
  slug: string;
  phone: string | null;
  kakaoChannelUrl: string | null;
  hasResources?: boolean;
  activePage?: string;
};

const NAV_ITEMS = [
  { key: 'day', label: '수업 하루' },
  { key: 'classes', label: '연령별 반' },
  { key: 'gallery', label: '수업 사진' },
  { key: 'safe', label: '안전·셔틀' },
  { key: 'consult', label: '상담 신청' },
  { key: 'location', label: '오시는 길' },
];

/** 메뉴 항목 — 오시는 길은 늘 맨 끝, 자료실은 공개 자료가 있을 때만 그 앞에 */
function navItems(hasResources?: boolean) {
  const last = NAV_ITEMS[NAV_ITEMS.length - 1];
  return hasResources ? [...NAV_ITEMS.slice(0, -1), { key: 'resources', label: '자료실' }, last] : NAV_ITEMS;
}

/** 홈 안의 섹션은 홈 주소#섹션 (다른 페이지에서도 동작), 자료실은 페이지 */
const hrefOf = (slug: string, key: string) => (key === 'resources' ? `/${slug}/resources` : `/${slug}#${key}`);

export default function SiteHeaderBright({ name, slug, phone, kakaoChannelUrl, hasResources, activePage }: Props) {
  const items = navItems(hasResources);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line backdrop-blur-md" style={{ background: 'rgba(255,255,255,.92)' }}>
        <div className="acad-wrap h-[68px] md:h-[82px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <svg width="37" height="37" viewBox="0 0 36 36" aria-hidden="true" className="flex-shrink-0">
              <circle cx="18" cy="18" r="17" fill="var(--highlight)"/>
              <circle cx="13" cy="15" r="2" fill="#1F2A37"/>
              <circle cx="23" cy="15" r="2" fill="#1F2A37"/>
              <path d="M12 22 Q18 27 24 22" stroke="#1F2A37" strokeWidth="2" fill="none" strokeLinecap="round"/>
            </svg>
            <a href={`/${slug}`} className="font-round text-[21px] md:text-[25px] font-bold text-ink no-underline whitespace-nowrap truncate">
              {name}
            </a>
          </div>

          <nav className="hidden lg:flex items-center gap-[27px] text-[14px] font-semibold">
            {items.map(({ key, label }) => (
              <a key={key} href={hrefOf(slug, key)} aria-current={activePage === key ? 'page' : undefined} className="text-body hover:text-accent transition-colors no-underline">
                {label}
              </a>
            ))}
          </nav>

          <a href={`/${slug}#consult`} className="acad-btn hidden lg:inline-flex h-12 px-[25px] text-[15px]">
            체험 수업 신청 →
          </a>

          <button type="button" className="lg:hidden w-11 h-11 flex items-center justify-center text-ink" onClick={() => setMenuOpen(true)} aria-label="메뉴 열기">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>
            </svg>
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] bg-bg flex flex-col">
          <div className="h-[60px] px-5 flex items-center justify-between border-b border-line">
            <span className="font-round text-2xl text-ink">{name}</span>
            <button type="button" onClick={() => setMenuOpen(false)} className="w-11 h-11 flex items-center justify-center text-ink" aria-label="메뉴 닫기">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18"/>
              </svg>
            </button>
          </div>
          <nav className="px-5 flex flex-col">
            {items.map(({ key, label }) => (
              <a key={key} href={hrefOf(slug, key)} aria-current={activePage === key ? 'page' : undefined} onClick={() => setMenuOpen(false)}
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
            <a href={`/${slug}#consult`} onClick={() => setMenuOpen(false)} className="h-[56px] rounded-full bg-accent text-on-accent no-underline text-[17px] font-bold flex items-center justify-center">
              체험 수업 신청
            </a>
          </div>
        </div>
      )}
    </>
  );
}
