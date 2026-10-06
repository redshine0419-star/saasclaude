import type { AcademyTenant, LevelTestSlot } from '@/lib/academy-data';
import { weekdayLabel } from '@/lib/academy-data';

type Props = {
  tenant: AcademyTenant;
  directorPhoto: string | null;
  levelTestSlots: LevelTestSlot[];
};

export default function HeroSection({ tenant, directorPhoto, levelTestSlots }: Props) {
  const activeSlots = levelTestSlots.slice(0, 3);

  return (
    <section id="top" className="px-5 md:px-20 pt-12 md:pt-[72px] pb-10 md:pb-16">
      <div className="flex flex-col md:flex-row md:items-center md:gap-16">
        {/* ─── 텍스트 ─── */}
        <div className="flex-1 flex flex-col gap-5 md:gap-7">
          {/* 뱃지 */}
          <span className="self-start px-3 py-[5px] rounded-md bg-highlight text-highlight-ink text-[13px] md:text-sm font-semibold">
            {new Date().getFullYear()} 겨울방학 특강 모집 중
          </span>

          {/* 제목 */}
          <h1 className="m-0 font-serif text-[32px] md:text-[60px] leading-[1.3] md:leading-[1.25] font-bold tracking-tight text-ink">
            한 반{' '}
            {tenant.targetGrades ? '' : '8'}
            명,<br />
            원장이 직접 가르칩니다.
          </h1>

          {/* 설명 */}
          <p className="m-0 text-[15px] md:text-[19px] leading-[1.7] text-body max-w-[560px]">
            {tenant.subjects} 내신 대비부터 수능 기초까지.
            레벨테스트로 아이 수준을 먼저 확인하고, 맞는 반을 정해 드립니다.
          </p>

          {/* CTA 버튼 — 데스크톱만 */}
          <div className="hidden md:flex gap-3">
            <a
              href={`/${tenant.slug}/consult`}
              className="flex items-center h-14 px-7 rounded-xl bg-accent text-on-accent font-bold text-[17px] hover:opacity-90 transition-opacity no-underline"
            >
              무료 레벨테스트 신청
            </a>
            {tenant.kakaoChannelUrl && (
              <a
                href={tenant.kakaoChannelUrl}
                className="flex items-center gap-2 h-14 px-6 rounded-xl border border-ink text-ink font-semibold text-[17px] hover:bg-subtle transition-colors no-underline"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.8-.8L3 21l1.9-4.6A8.1 8.1 0 0 1 3 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z"/></svg>
                카카오톡 채널 상담
              </a>
            )}
          </div>
        </div>

        {/* ─── 이미지 + 슬롯 카드 ─── */}
        <div className="relative mt-5 md:mt-0 md:w-[580px] md:h-[440px] md:flex-shrink-0">
          {/* 모바일: 교실 사진 / 데스크톱: 교실 사진 (SPEC: 모바일은 원장 사진) */}
          <div className="w-full h-[200px] md:w-[580px] md:h-[440px] rounded-2xl bg-subtle flex items-center justify-center text-muted text-sm md:text-base overflow-hidden">
            {directorPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={directorPhoto}
                alt={`${tenant.name} 원장`}
                className="w-full h-full object-cover md:hidden"
              />
            ) : null}
            <span className={directorPhoto ? 'md:block hidden' : ''}>
              {/* 이미지 미등록 플레이스홀더 */}
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-30" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
            </span>
          </div>

          {/* 레벨테스트 슬롯 카드 — 데스크톱만 */}
          {activeSlots.length > 0 && (
            <div
              className="hidden md:flex flex-col gap-2.5 absolute -left-10 -bottom-7 w-[300px] bg-surface rounded-2xl p-5"
              style={{ boxShadow: 'var(--shadow-float)' }}
            >
              <div className="text-[13px] font-semibold text-muted">이번 주 레벨테스트 가능 시간</div>
              <div className="flex gap-2 flex-wrap">
                {activeSlots.map((s) => (
                  <span
                    key={s.id}
                    className="px-2.5 py-[6px] rounded-md bg-accent-soft text-accent-ink text-sm font-semibold"
                  >
                    {s.weekday !== null ? weekdayLabel(s.weekday) : ''} {s.time}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
