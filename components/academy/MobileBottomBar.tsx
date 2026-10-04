import type { AcademyTenant } from '@/lib/academy-data';

type Props = { tenant: AcademyTenant };

export default function MobileBottomBar({ tenant }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-bg border-t border-line md:hidden">
      <div className="flex h-16 items-center gap-2 px-4">
        {/* 전화 */}
        {tenant.phone && (
          <a
            href={`tel:${tenant.phone.replace(/[^0-9]/g, '')}`}
            className="flex-shrink-0 w-12 h-12 flex flex-col items-center justify-center gap-0.5 rounded-xl border border-line bg-surface"
            aria-label="전화 문의"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.68 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.59 1.19l3-.02a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.88a16 16 0 0 0 8.22 8.21l1.04-1.04a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <span className="text-[10px] text-muted">전화</span>
          </a>
        )}

        {/* 카카오 */}
        {tenant.kakaoChannelUrl && (
          <a
            href={tenant.kakaoChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 w-12 h-12 flex flex-col items-center justify-center gap-0.5 rounded-xl border border-line bg-surface"
            aria-label="카카오톡 문의"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#3A1D1D]" aria-hidden="true">
              <path d="M12 3C6.48 3 2 6.72 2 11.28c0 2.88 1.67 5.42 4.22 6.96l-1.07 3.97 4.62-3.04c.72.1 1.46.16 2.23.16 5.52 0 10-3.72 10-8.28C22 6.72 17.52 3 12 3z"/>
            </svg>
            <span className="text-[10px] text-muted">카카오</span>
          </a>
        )}

        {/* CTA */}
        <a
          href="#consult"
          className="flex-1 h-12 flex items-center justify-center rounded-xl bg-accent text-on-accent font-bold text-[15px]"
        >
          무료 레벨테스트 신청
        </a>
      </div>
    </div>
  );
}
