import type { AcademyTenant, AcademyClass, LevelTestSlot } from '@/lib/academy-data';
import { heroDefaults, titleLines } from '@/lib/hero';

type Props = {
  tenant: AcademyTenant;
  classes: AcademyClass[];
  levelTestSlots: LevelTestSlot[];
};

const PILL_BG = ['var(--highlight-soft)', 'var(--pastel-sky)', 'var(--pastel-pink)', 'var(--highlight-soft)'];

export default function HeroSectionBright({ tenant, classes }: Props) {
  const gradeBands = [...new Set(classes.map((c) => c.gradeBand).filter(Boolean))] as string[];
  // 반이 없으면 대상 학년, 그것도 없으면 칩을 보이지 않는다 (사실이 아닌 학년을 띄우지 않게)
  const labels = gradeBands.length > 0 ? gradeBands : tenant.targetGrades ? [tenant.targetGrades] : [];
  const def = heroDefaults('bright', tenant.subjects);
  const lines = titleLines(tenant.heroTitle || def.title);
  const [main, mini1, mini2] = tenant.heroPhotos;

  return (
    <section className="pt-[42px] pb-[55px] md:pt-[70px] md:pb-[88px] overflow-hidden" style={{ background: 'linear-gradient(135deg,#fffdf6 0%,#f4fbff 58%,#fff5f7 100%)' }}>
      <div className="acad-wrap grid grid-cols-1 md:grid-cols-[0.88fr_1.12fr] gap-[38px] md:gap-[55px] items-center">
        <div className="min-w-0">
          {labels.length > 0 && (
            <div className="flex flex-wrap gap-[9px] mb-[22px]">
              {labels.map((g, i) => (
                <span key={g} className="px-[14px] py-[7px] rounded-full text-[13px] font-extrabold text-ink" style={{ background: PILL_BG[i % PILL_BG.length] }}>{g}</span>
              ))}
            </div>
          )}
          <h1 className="m-0 mb-[22px] font-round text-[43px] md:text-[clamp(42px,5.5vw,66px)] leading-[1.22] tracking-[-0.055em] text-ink break-keep">
            {lines.map((l, i) => (
              <span key={i}>{i > 0 && <br />}{l}</span>
            ))}
          </h1>
          <p className="m-0 mb-7 text-[15px] md:text-[17px] leading-[1.85] text-body max-w-[480px] break-keep">
            {tenant.heroSubtitle || def.subtitle}
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#consult" className="acad-btn h-[54px] px-[25px] text-[16px]">무료 체험 수업 신청 ↗</a>
            {tenant.kakaoChannelUrl && (
              <a href={tenant.kakaoChannelUrl} className="inline-flex items-center h-[54px] px-[25px] rounded-full bg-ink text-white text-[16px] font-extrabold no-underline">카카오톡 상담</a>
            )}
          </div>
        </div>

        {/* 사진 3장 (관리자 > 홈페이지 구성 > 메인 화면). 없으면 파스텔 칸 */}
        <div className="relative h-[350px] md:h-[510px] grid grid-cols-[1.15fr_0.85fr] grid-rows-2 gap-[9px] md:gap-[14px]">
          {[
            { src: main, cls: 'row-span-2 rounded-[24px] md:rounded-[34px]', bg: 'var(--pastel-sky)', alt: '수업 모습' },
            { src: mini1, cls: 'rounded-[20px] md:rounded-[28px]', bg: 'var(--highlight-soft)', alt: '교실' },
            { src: mini2, cls: 'rounded-[20px] md:rounded-[28px]', bg: 'var(--pastel-pink)', alt: '활동' },
          ].map((p, i) => (
            <div key={i} className={`${p.cls} overflow-hidden`} style={{ background: p.bg, boxShadow: 'var(--section-shadow)' }}>
              {p.src && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.src} alt={`${tenant.name} ${p.alt}`} className="w-full h-full object-cover" />
              )}
            </div>
          ))}
          <div aria-hidden="true" className="absolute -top-[23px] right-7 w-12 h-12 md:w-[62px] md:h-[62px] rounded-full grid place-items-center text-[22px] md:text-[28px] rotate-12" style={{ background: 'var(--highlight)' }}>✦</div>
          {tenant.heroBadge && (
            <div className="absolute right-0 md:-right-[15px] bottom-3 md:bottom-[22px] bg-surface rounded-[18px] px-[13px] py-[10px] md:px-[19px] md:py-[15px] text-[13px] font-bold max-w-[70%]" style={{ boxShadow: 'var(--section-shadow)' }}>
              <strong className="block text-[16px] md:text-[18px] text-accent">{tenant.heroBadge}</strong>
              {tenant.subjects && <span className="text-body">{tenant.subjects} · {tenant.targetGrades}</span>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
