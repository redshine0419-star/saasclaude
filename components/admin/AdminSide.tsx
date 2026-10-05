import Link from 'next/link';

type ActiveKey =
  | 'dashboard'
  | 'leads'
  | 'kakao'
  | 'kakaolog'
  | 'news'
  | 'reviews'
  | 'classes'
  | 'info'
  | 'report'
  | 'settings';

interface AdminSideProps {
  slug: string;
  tenantName: string;
  active: ActiveKey;
}

interface NavItemProps {
  href: string;
  label: string;
  active: boolean;
  badge?: number;
}

function NavItem({ href, label, active, badge }: NavItemProps) {
  return (
    <Link
      href={href}
      style={{
        padding: '11px 12px',
        borderRadius: 8,
        background: active ? '#2C3747' : 'transparent',
        color: active ? '#FFFFFF' : '#C8CDD5',
        fontWeight: active ? 600 : 400,
        textDecoration: 'none',
        fontSize: 15,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      {label}
      {badge != null && badge > 0 && (
        <span
          style={{
            minWidth: 22,
            padding: '0 6px',
            borderRadius: 11,
            background: '#F2C94C',
            color: '#1B2430',
            fontSize: 12,
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: '22px',
          }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '18px 12px 6px',
        fontSize: 12,
        color: '#8E97A4',
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

export function AdminSide({ slug, tenantName, active }: AdminSideProps) {
  const base = `/${slug}/admin`;

  return (
    <aside
      style={{
        width: 240,
        minHeight: '100vh',
        boxSizing: 'border-box',
        padding: '28px 16px',
        background: '#1B2430',
        color: '#C8CDD5',
        fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif",
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        flexShrink: 0,
      }}
    >
      <div style={{ padding: '0 12px 20px', fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>
        {tenantName}{' '}
        <span style={{ fontSize: 13, fontWeight: 500, color: '#9AA3AF' }}>관리자</span>
      </div>

      <NavItem href={`${base}`} label="대시보드" active={active === 'dashboard'} />
      <NavItem href={`${base}/leads`} label="상담 관리" active={active === 'leads'} />

      <SectionLabel>카톡</SectionLabel>
      <NavItem href={`${base}/kakao`} label="자동 발송" active={active === 'kakao'} />
      <NavItem
        href={`${base}/kakao/log`}
        label="발송 내역·수신 동의"
        active={active === 'kakaolog'}
      />

      <SectionLabel>홈페이지 콘텐츠</SectionLabel>
      <NavItem href={`${base}/mobile`} label="📱 모바일 글쓰기" active={false} />
      <NavItem href={`${base}/news`} label="소식" active={active === 'news'} />
      <NavItem href={`${base}/reviews`} label="후기·성과" active={active === 'reviews'} />
      <NavItem href={`${base}/classes`} label="수업·시간표" active={active === 'classes'} />
      <NavItem href={`${base}/info`} label="학원 정보·교습비" active={active === 'info'} />

      <SectionLabel>운영</SectionLabel>
      <NavItem href={`${base}/report`} label="월간 리포트" active={active === 'report'} />
      <NavItem href={`${base}/settings`} label="설정" active={active === 'settings'} />

      <div style={{ marginTop: 'auto' }}>
        <Link
          href="/auth/signin"
          style={{ padding: 12, fontSize: 13, color: '#9AA3AF', textDecoration: 'none' }}
        >
          로그아웃
        </Link>
      </div>
    </aside>
  );
}
