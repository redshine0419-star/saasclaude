import type { AcademyTenant } from '@/lib/academy-data';
import MobileBar from './MobileBar';

type Props = { tenant: AcademyTenant; slug?: string };

export default function SiteFooter({ tenant, slug }: Props) {
  return (
    <>
      <footer className="py-10 md:py-[42px] border-t border-line" style={{ background: 'var(--footer-bg)', color: 'var(--footer-ink)' }}>
        <div className="acad-wrap flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-3">
            <div className="font-serif font-bold text-[20px]">{tenant.name}</div>
            <div className="flex flex-col gap-1.5 text-[13px]" style={{ color: 'var(--footer-muted)' }}>
              {tenant.address && <div>{tenant.address}</div>}
              {tenant.phone && <div>대표 전화: {tenant.phone}</div>}
              {tenant.hours && <div>운영 시간: {tenant.hours}</div>}
              {tenant.regNo && <div>학원등록번호: {tenant.regNo}</div>}
              {tenant.subjects && <div>교습과목: {tenant.subjects}</div>}
            </div>
          </div>

          <div className="flex flex-col gap-2 text-[12px]" style={{ color: 'var(--footer-muted)' }}>
            {tenant.hasResources && <a href={`/${tenant.slug}/resources`} className="font-semibold hover:underline" style={{ color: 'var(--footer-ink)' }}>자료실</a>}
            <a href={`/${tenant.slug}/privacy`} className="font-semibold hover:underline" style={{ color: 'var(--footer-ink)' }}>개인정보처리방침</a>
            <div>© {new Date().getFullYear()} {tenant.name}. All rights reserved.</div>
            <div>
              Powered by{' '}
              <a href="/" className="underline" style={{ color: 'var(--footer-ink)' }}>첫등원</a>
            </div>
          </div>
        </div>
      </footer>
      {/* 하단 고정 바 — 여백(spacer)이 푸터 뒤에 와야 마지막 줄이 바에 가리지 않는다 */}
      {slug && (
        <MobileBar
          slug={slug}
          phone={tenant.phone ?? null}
          kakaoChannelUrl={tenant.kakaoChannelUrl ?? null}
        />
      )}
    </>
  );
}
