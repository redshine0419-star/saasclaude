import Link from 'next/link';
import { AdminMobileBar } from './AdminMobileBar';

type ActiveKey =
  | 'dashboard'
  | 'leads'
  | 'kakao'
  | 'kakaolog'
  | 'news'
  | 'reviews'
  | 'classes'
  | 'info'
  | 'staff'
  | 'result-stats'
  | 'sections'
  | 'report'
  | 'settings'
  | 'questions'
  | 'tests'
  | 'grading';

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

const ACTIVE_LABEL: Record<ActiveKey, string> = {
  dashboard: '대시보드',
  leads: '상담 관리',
  kakao: '카톡 자동 발송',
  kakaolog: '발송 내역·수신 동의',
  news: '소식',
  reviews: '후기·성과',
  classes: '수업·시간표',
  info: '학원 정보·교습비',
  staff: '강사진',
  'result-stats': '입시 실적',
  sections: '홈페이지 구성',
  report: '월간 리포트',
  settings: '설정',
  questions: '문제은행',
  tests: '레벨테스트 시험지',
  grading: '채점함',
};

export function AdminSide({ slug, tenantName, active }: AdminSideProps) {
  const base = `/${slug}/admin`;

  const nav = (
    <>
      <NavItem href={`${base}`} label="대시보드" active={active === 'dashboard'} />
      <NavItem href={`${base}/leads`} label="상담 관리" active={active === 'leads'} />

      <SectionLabel>카톡</SectionLabel>
      <NavItem href={`${base}/kakao`} label="자동 발송" active={active === 'kakao'} />
      <NavItem href={`${base}/kakao/log`} label="발송 내역·수신 동의" active={active === 'kakaolog'} />

      <SectionLabel>레벨테스트</SectionLabel>
      <NavItem href={`${base}/tests`} label="시험지·결과" active={active === 'tests'} />
      <NavItem href={`${base}/grading`} label="채점함" active={active === 'grading'} />
      <NavItem href={`${base}/questions`} label="문제은행" active={active === 'questions'} />

      <SectionLabel>홈페이지 콘텐츠</SectionLabel>
      <NavItem href={`${base}/mobile`} label="📱 모바일 글쓰기" active={false} />
      <NavItem href={`${base}/news`} label="소식" active={active === 'news'} />
      <NavItem href={`${base}/reviews`} label="후기·성과" active={active === 'reviews'} />
      <NavItem href={`${base}/result-stats`} label="입시 실적" active={active === 'result-stats'} />
      <NavItem href={`${base}/classes`} label="수업·시간표" active={active === 'classes'} />
      <NavItem href={`${base}/info`} label="학원 정보·교습비" active={active === 'info'} />
      <NavItem href={`${base}/staff`} label="강사진" active={active === 'staff'} />
      <NavItem href={`${base}/sections`} label="홈페이지 구성" active={active === 'sections'} />

      <SectionLabel>운영</SectionLabel>
      <NavItem href={`${base}/report`} label="월간 리포트" active={active === 'report'} />
      <NavItem href={`${base}/settings`} label="설정" active={active === 'settings'} />
      <NavItem href={`/${slug}`} label="내 홈페이지 보기 ↗" active={false} />
    </>
  );

  return (
    <>
      <AdminMobileBar tenantName={tenantName} current={ACTIVE_LABEL[active]}>
        {nav}
      </AdminMobileBar>
      <aside
        className="adm-side"
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
        {nav}
        <div style={{ marginTop: 'auto' }}>
          <Link
            href="/auth/signin"
            style={{ padding: 12, fontSize: 13, color: '#9AA3AF', textDecoration: 'none' }}
          >
            로그아웃
          </Link>
        </div>
      </aside>
    </>
  );
}
