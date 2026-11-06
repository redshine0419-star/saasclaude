import type { AcademyTenant, LevelTestSlot } from '@/lib/academy-data';
import { weekdayLabel } from '@/lib/weekday';
import { heroDefaults, titleLines } from '@/lib/hero';

type Props = {
  tenant: AcademyTenant;
  directorPhoto: string | null;
  levelTestSlots: LevelTestSlot[];
};

export default function HeroSection({ tenant, directorPhoto, levelTestSlots }: Props) {
  const activeSlots = levelTestSlots.slice(0, 3);
  const def = heroDefaults('warm', tenant.subjects);
  const lines = titleLines(tenant.heroTitle || def.title);
  const photo = tenant.heroPhotos[0] ?? null;
  const mobileSrc = directorPhoto ?? photo;
  const desktopSrc = photo ?? directorPhoto;

  return (
    <section id="top" className="pt-9 pb-8 md:pt-14 md:pb-12">
      <div className="acad-wrap grid grid-cols-1 md:grid-cols-[0.88fr_1.12fr] items-center gap-8 md:gap-[42px]">
        {/* ─── 텍스트 ─── */}
        <div className="flex flex-col">
          {tenant.heroBadge && <p className="acad-eyebrow">{tenant.heroBadge}</p>}

          <h1 className="m-0 mb-[22px] font-serif font-bold text-ink text-[34px] md:text-[clamp(34px,4vw,54px)] leading-[1.28] tracking-[-0.055em] break-keep">
            {lines.map((l, i) => (
              <span key={i}>{i > 0 && <br />}{l}</span>
            ))}
          </h1>

          <p className="m-0 mb-7 text-[15px] md:text-[18px] leading-[1.8] text-body max-w-[520px]">
            {tenant.heroSubtitle || def.subtitle}
          </p>

          <div className="flex flex-wrap gap-2.5">
            <a
              href={`/${tenant.slug}/consult`}
              className="inline-flex items-center h-12 px-6 rounded-[11px] bg-accent text-on-accent font-bold text-[15px] no-underline transition-transform hover:-translate-y-0.5"
            >
              무료 레벨테스트 신청 →
            </a>
            {tenant.kakaoChannelUrl && (
              <a
                href={tenant.kakaoChannelUrl}
                className="hidden md:inline-flex items-center gap-2 h-12 px-5 rounded-[11px] border border-line bg-surface text-ink font-bold text-[15px] no-underline hover:bg-subtle"
              >
                카카오톡 채널 상담
              </a>
            )}
          </div>
        </div>

        {/* ─── 사진 + 레벨테스트 시간 ─── */}
        <div className="relative">
          {/* 모바일은 원장 사진 우선(SPEC), 데스크톱은 대표 사진 우선. 둘 다 없으면 장식 칸 */}
          <div
            className="w-full h-[245px] sm:h-[350px] md:h-[440px] rounded-[24px] bg-subtle overflow-hidden flex items-center justify-center text-muted"
            style={{ boxShadow: 'var(--section-shadow)' }}
          >
            {mobileSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mobileSrc} alt={directorPhoto ? `${tenant.name} 원장` : `${tenant.name} 교실`} className="w-full h-full object-cover md:hidden" />
            )}
            {desktopSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={desktopSrc} alt={photo ? `${tenant.name} 교실` : `${tenant.name} 원장`} className="w-full h-full object-cover hidden md:block" />
            )}
            {!photo && !directorPhoto && (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-30" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
            )}
          </div>

          {activeSlots.length > 0 && (
            <div
              className="absolute left-3 bottom-3 md:-left-[22px] md:bottom-[22px] bg-surface rounded-2xl px-[15px] py-3 md:px-[22px] md:py-[18px] text-[13px] text-muted max-w-[calc(100%-24px)]"
              style={{ boxShadow: 'var(--section-shadow)' }}
            >
              <strong className="block text-ink text-[14px] md:text-[16px] mb-1">이번 주 레벨테스트 가능 시간</strong>
              {activeSlots.map((s) => `${s.weekday !== null ? weekdayLabel(s.weekday) : ''} ${s.time ?? ''}`.trim()).join('  ·  ')}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
