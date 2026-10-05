import type { AcademyTenant } from '@/lib/academy-data';
import MobileBar from './MobileBar';

type Props = { tenant: AcademyTenant; slug?: string };

export default function SiteFooter({ tenant, slug }: Props) {
  return (
    <>
      {slug && (
        <MobileBar
          slug={slug}
          phone={tenant.phone ?? null}
          kakaoChannelUrl={tenant.kakaoChannelUrl ?? null}
        />
      )}
      <footer className="px-5 md:px-20 py-10 md:py-14 border-t border-line bg-bg">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-3">
            <div className="font-serif font-bold text-[18px] text-ink">{tenant.name}</div>
            <div className="flex flex-col gap-1.5 text-[13px] text-muted">
              {tenant.address && <div>{tenant.address}</div>}
              {tenant.phone && <div>대표 전화: {tenant.phone}</div>}
              {tenant.hours && <div>운영 시간: {tenant.hours}</div>}
              {tenant.regNo && <div>학원등록번호: {tenant.regNo}</div>}
              {tenant.subjects && <div>교습과목: {tenant.subjects}</div>}
            </div>
          </div>

          <div className="flex flex-col gap-2 text-[12px] text-muted">
            <div>© {new Date().getFullYear()} {tenant.name}. All rights reserved.</div>
            <div>
              Powered by{' '}
              <a href="/" className="text-accent hover:underline">첫등원</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
