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
  | 'grading'
  | 'students'
  | 'attendance'
  | 'billing';

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
  /** 메뉴 이름 아래 한 줄 설명 */
  desc?: string;
}

function NavItem({ href, label, active, badge, desc }: NavItemProps) {
  return (
    <Link
      href={href}
      style={{
        padding: desc ? '8px 12px' : '11px 12px',
        borderRadius: 8,
        background: active ? '#2C3747' : 'transparent',
        color: active ? '#FFFFFF' : '#C8CDD5',
        fontWeight: active ? 600 : 400,
        textDecoration: 'none',
        fontSize: 15,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span>{label}</span>
        {desc && (
          <span style={{ fontSize: 12, fontWeight: 400, lineHeight: 1.45, marginTop: 2, color: active ? '#C8CDD5' : '#8E97A4' }}>{desc}</span>
        )}
      </span>
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
  students: '학생부',
  attendance: '출결',
  billing: '결제',
};

export function AdminSide({ slug, tenantName, active }: AdminSideProps) {
  const base = `/${slug}/admin`;

  const nav = (
    <>
      <NavItem href={`${base}`} label="대시보드" desc="이번 달 현황과 오늘 할 일" active={active === 'dashboard'} />
      <NavItem href={`${base}/leads`} label="상담 관리" desc="상담 신청 확인·연락·등록 처리" active={active === 'leads'} />

      <SectionLabel>원생</SectionLabel>
      <NavItem href={`${base}/students`} label="학생부" desc="학생별 성적·성격·메모·리포트" active={active === 'students'} />
      <NavItem href={`${base}/attendance`} label="출결" desc="하루 단위 출석·지각·결석 체크" active={active === 'attendance'} />

      <SectionLabel>카톡</SectionLabel>
      <NavItem href={`${base}/kakao`} label="자동 발송" desc="카톡 자동 메시지 켜기·문구 수정" active={active === 'kakao'} />
      <NavItem href={`${base}/kakao/log`} label="발송 내역·수신 동의" desc="보낸 메시지와 광고 수신 동의 현황" active={active === 'kakaolog'} />

      <SectionLabel>레벨테스트</SectionLabel>
      <NavItem href={`${base}/tests`} label="시험지·결과" desc="레벨테스트 시험지 만들기·결과 보기" active={active === 'tests'} />
      <NavItem href={`${base}/grading`} label="채점함" desc="서술형 답안 채점·첨삭" active={active === 'grading'} />
      <NavItem href={`${base}/questions`} label="문제은행" desc="레벨테스트 문제 모아 두기" active={active === 'questions'} />

      <SectionLabel>홈페이지 콘텐츠</SectionLabel>
      <NavItem href={`${base}/mobile`} label="📱 모바일 글쓰기" desc="휴대폰으로 소식 빠르게 올리기" active={false} />
      <NavItem href={`${base}/news`} label="소식" desc="홈페이지 공지·모집·갤러리 글" active={active === 'news'} />
      <NavItem href={`${base}/reviews`} label="후기·성과" desc="학부모 후기·성적 사례 (동의 필수)" active={active === 'reviews'} />
      <NavItem href={`${base}/result-stats`} label="입시 실적" desc="합격·등급 실적 숫자 (근거 필수)" active={active === 'result-stats'} />
      <NavItem href={`${base}/classes`} label="수업·시간표" desc="반 정보·잔여석·레벨테스트 시간" active={active === 'classes'} />
      <NavItem href={`${base}/info`} label="학원 정보·교습비" desc="주소·원장 소개·교습비·환불 기준" active={active === 'info'} />
      <NavItem href={`${base}/staff`} label="강사진" desc="홈페이지 강사 프로필" active={active === 'staff'} />
      <NavItem href={`${base}/sections`} label="홈페이지 구성" desc="테마·섹션 순서·메인 사진·문구" active={active === 'sections'} />

      <SectionLabel>운영</SectionLabel>
      <NavItem href={`${base}/report`} label="월간 리포트" desc="한 달 상담·등록 흐름과 유입 경로" active={active === 'report'} />
      <NavItem href={`${base}/billing`} label="결제" desc="요금 구간·정기결제 카드" active={active === 'billing'} />
      <NavItem href={`${base}/settings`} label="설정" desc="알림 번호·직원 초대·연결 상태" active={active === 'settings'} />
      <NavItem href={`/${slug}`} label="내 홈페이지 보기 ↗" desc="학부모가 보는 화면 열기" active={false} />
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
