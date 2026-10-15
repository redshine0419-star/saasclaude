'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/** 768px 이하에서만 보이는 상단 바 + 슬라이드 메뉴. 메뉴 내용은 데스크톱 사이드바와 같은 것을 children으로 받는다. */
export function AdminMobileBar({ tenantName, current, children }: { tenantName: string; current: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // 메뉴에서 다른 화면으로 이동하면 닫는다
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="adm-mobilebar">
      <div className="adm-mobilebar-row">
        <button type="button" className="adm-menu-btn" aria-label="메뉴 열기" aria-expanded={open} onClick={() => setOpen(true)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <div className="adm-mobilebar-title">
          <span className="adm-mobilebar-current">{current}</span>
          <span className="adm-mobilebar-tenant">{tenantName}</span>
        </div>
      </div>
      {open && (
        <div className="adm-drawer-backdrop" onClick={() => setOpen(false)}>
          <nav className="adm-drawer" aria-label="관리자 메뉴" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="adm-drawer-close" aria-label="메뉴 닫기" onClick={() => setOpen(false)}>✕</button>
            {children}
          </nav>
        </div>
      )}
    </div>
  );
}
