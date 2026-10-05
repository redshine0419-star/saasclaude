import type { AcademyTenant, AcademyClass, LevelTestSlot } from '@/lib/academy-data';

type Props = {
  tenant: AcademyTenant;
  classes: AcademyClass[];
  levelTestSlots: LevelTestSlot[];
};

const PASTEL_CHIPS = [
  { bg: '#FFF3C4', label: '7세' },
  { bg: '#DDF1FF', label: '초1 ~ 초3' },
  { bg: '#FFE3EC', label: '초4 ~ 초6' },
];

export default function HeroSectionBright({ tenant, classes }: Props) {
  const gradeBands = [...new Set(classes.map((c) => c.gradeBand).filter(Boolean))] as string[];
  const chips = gradeBands.length > 0
    ? gradeBands.map((g, i) => ({ bg: PASTEL_CHIPS[i % PASTEL_CHIPS.length].bg, label: g }))
    : PASTEL_CHIPS;

  return (
    <section className="px-5 md:px-16 pt-10 md:pt-10 pb-10 flex flex-col md:flex-row gap-10 md:gap-14 items-center">
      <div className="flex-1 flex flex-col gap-6">
        {/* Age chips */}
        <div className="flex gap-2 flex-wrap">
          {chips.map((c) => (
            <span key={c.label} className="px-3 py-[6px] rounded-full text-[14px] font-semibold text-ink" style={{ background: c.bg }}>
              {c.label}
            </span>
          ))}
        </div>

        <h1 className="m-0 font-round text-[40px] md:text-[64px] leading-[1.25] text-ink">
          {tenant.subjects ? `${tenant.subjects}가` : '공부가'} 재밌어지는<br />우리 동네 첫 학원
        </h1>

        <p className="m-0 text-[17px] md:text-[19px] leading-[1.75] text-body max-w-[520px]">
          한 반 최대 6명, 말하기로 시작하는 수업.
          아이가 먼저 &ldquo;오늘 학원 가?&rdquo; 하고 묻는 곳이 되고 싶습니다.
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

      {/* Photo collage */}
      <div className="w-full md:w-[620px] h-[340px] md:h-[520px] grid grid-cols-2 grid-rows-2 gap-3 md:gap-4">
        <div className="row-span-2 rounded-[24px] md:rounded-[32px] bg-pastel-sky flex items-center justify-center text-body text-sm text-center p-4">
          수업 중 아이들<br/>사진
        </div>
        <div className="rounded-[24px] md:rounded-[32px] bg-highlight-soft flex items-center justify-center text-body text-sm">교실 사진</div>
        <div className="rounded-[24px] md:rounded-[32px] bg-pastel-pink flex items-center justify-center text-body text-sm">발표·활동</div>
      </div>
    </section>
  );
}
