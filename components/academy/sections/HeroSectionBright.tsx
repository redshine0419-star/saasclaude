import type { AcademyTenant, AcademyClass, LevelTestSlot } from '@/lib/academy-data';
import { heroDefaults, titleLines } from '@/lib/hero';

type Props = {
  tenant: AcademyTenant;
  classes: AcademyClass[];
  levelTestSlots: LevelTestSlot[];
};

const PASTEL = ['#FFF3C4', '#DDF1FF', '#FFE3EC'];
// 사진 칸 — 사진이 없으면 같은 색의 장식 칸만 보인다
const SLOTS = [
  { cls: 'row-span-2 bg-pastel-sky', alt: '수업 모습' },
  { cls: 'bg-highlight-soft', alt: '교실' },
  { cls: 'bg-pastel-pink', alt: '활동' },
];

export default function HeroSectionBright({ tenant, classes }: Props) {
  const gradeBands = [...new Set(classes.map((c) => c.gradeBand).filter(Boolean))] as string[];
  // 반이 없으면 대상 학년, 그것도 없으면 칩을 보이지 않는다 (사실이 아닌 학년을 띄우지 않게)
  const labels = gradeBands.length > 0 ? gradeBands : tenant.targetGrades ? [tenant.targetGrades] : [];
  const chips = labels.map((g, i) => ({ bg: PASTEL[i % PASTEL.length], label: g }));
  const def = heroDefaults('bright', tenant.subjects);
  const lines = titleLines(tenant.heroTitle || def.title);

  return (
    <section className="px-5 md:px-16 pt-10 md:pt-10 pb-10 flex flex-col md:flex-row gap-10 md:gap-14 items-center">
      <div className="flex-1 flex flex-col gap-6">
        {tenant.heroBadge && (
          <span className="self-start px-3 py-[6px] rounded-full text-[14px] font-bold bg-accent text-on-accent">{tenant.heroBadge}</span>
        )}
        {/* Age chips */}
        <div className="flex gap-2 flex-wrap">
          {chips.map((c) => (
            <span key={c.label} className="px-3 py-[6px] rounded-full text-[14px] font-semibold text-ink" style={{ background: c.bg }}>
              {c.label}
            </span>
          ))}
        </div>

        <h1 className="m-0 font-round text-[40px] md:text-[64px] leading-[1.25] text-ink">
          {lines.map((l, i) => (
            <span key={i}>{i > 0 && <br />}{l}</span>
          ))}
        </h1>

        <p className="m-0 text-[17px] md:text-[19px] leading-[1.75] text-body max-w-[520px]">
          {tenant.heroSubtitle || def.subtitle}
        </p>

        <div className="flex gap-3 flex-wrap">
          <a href="#trial" className="flex items-center h-[58px] px-7 rounded-full bg-accent text-on-accent text-[17px] font-bold no-underline hover:opacity-90">
            무료 체험 수업 신청
          </a>
          {tenant.kakaoChannelUrl && (
            <a href={tenant.kakaoChannelUrl} className="flex items-center h-[58px] px-6 rounded-full text-ink text-[17px] font-bold no-underline hover:opacity-90" style={{ background: '#FFD54F' }}>
              카카오톡 상담
            </a>
          )}
        </div>
      </div>

      {/* Photo collage — 대표 사진 3장 (관리자 > 홈페이지 구성) */}
      <div className="w-full md:w-[620px] h-[340px] md:h-[520px] grid grid-cols-2 grid-rows-2 gap-3 md:gap-4">
        {SLOTS.map((slot, i) => (
          <div key={i} className={`${slot.cls} rounded-[24px] md:rounded-[32px] overflow-hidden`}>
            {tenant.heroPhotos[i] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.heroPhotos[i]} alt={`${tenant.name} ${slot.alt}`} className="w-full h-full object-cover" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
