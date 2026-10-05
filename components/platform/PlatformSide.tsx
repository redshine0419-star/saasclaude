import Link from 'next/link';

type Active = 'academies' | 'diagnosis' | 'queue' | 'settings';

const navItems = [
  {
    key: 'academies' as Active,
    href: '/platform/academies',
    label: '학원 목록',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    key: 'diagnosis' as Active,
    href: '/platform/diagnosis',
    label: '무료 진단',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    key: 'queue' as Active,
    href: '/platform/queue',
    label: '베타 대기열',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    key: 'settings' as Active,
    href: '/platform/settings',
    label: '설정',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export function PlatformSide({ active }: { active: Active }) {
  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      minHeight: '100vh',
      background: '#1B2430',
      color: '#C8CDD5',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif",
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #2C3747' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#FFFFFF' }}>
          <svg width="20" height="20" viewBox="0 0 22 22" aria-hidden="true">
            <circle cx="11" cy="11" r="9" fill="#F5B700" />
            <circle cx="11" cy="11" r="3.5" fill="#1B2430" />
          </svg>
          <span style={{ fontSize: 17, fontWeight: 700 }}>첫등원</span>
        </Link>
        <div style={{ fontSize: 12, color: '#8A93A8', marginTop: 4, marginLeft: 28 }}>플랫폼 관리자</div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {navItems.map(({ key, href, label, icon }) => (
          <Link
            key={key}
            href={href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 8,
              textDecoration: 'none',
              color: key === active ? '#FFFFFF' : '#C8CDD5',
              background: key === active ? '#2C3747' : 'transparent',
              fontSize: 14,
              fontWeight: key === active ? 600 : 400,
              transition: 'background 0.1s',
            }}
          >
            {icon}
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom: link to public site */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #2C3747' }}>
        <Link href="/" style={{ fontSize: 13, color: '#8A93A8', textDecoration: 'none' }}>← 서비스 사이트</Link>
      </div>
    </aside>
  );
}
