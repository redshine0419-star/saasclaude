import type { AcademyTenant, AcademyResultStat, LevelTestSlot } from '@/lib/academy-data';
import { heroDefaults, titleLines } from '@/lib/hero';

type Props = {
  tenant: AcademyTenant;
  resultStat: AcademyResultStat | null;
  levelTestSlots: LevelTestSlot[];
};

export default function HeroSectionResult({ tenant, resultStat }: Props) {
  const def = heroDefaults('result', tenant.subjects);
  const lines = titleLines(tenant.heroTitle || def.title);
  const photo = tenant.heroPhotos[0] ?? null;
  const metrics = resultStat?.metrics.slice(0, 3) ?? [];
  const headline = resultStat?.metrics[0];

  return (
    <>
      <section className="relative overflow-hidden bg-dark text-on-dark pt-[55px] pb-[55px] md:pt-[82px] md:pb-[78px]">
        {/* 장식 원 */}
        <div
          aria-hidden="true"
          className="absolute w-[560px] h-[560px] rounded-full -right-[120px] -top-[180px] border border-white/[0.07]"
          style={{ boxShadow: '0 0 0 70px rgba(255,255,255,.03), 0 0 0 140px rgba(255,255,255,.02)' }}
        />
        <div className="acad-wrap relative z-[1] grid grid-cols-1 md:grid-cols-[1.02fr_0.98fr] gap-10 md:gap-[55px] items-center">
          <div className="min-w-0">
            {(tenant.heroBadge || tenant.targetGrades) && (
              <div className="text-[12px] font-extrabold tracking-[0.16em] text-on-dark-muted uppercase">
                {tenant.heroBadge || `${tenant.targetGrades} 내신 전문`}
              </div>
            )}
            <h1 className="mt-5 mb-[22px] font-grotesk font-black text-[39px] md:text-[clamp(38px,5vw,60px)] leading-[1.22] tracking-[-0.045em] break-keep">
              {lines.map((l, i) => (
                <span key={i} className={i === lines.length - 1 && lines.length > 1 ? 'text-highlight' : undefined}>
                  {i > 0 && <br />}
                  {l}
                </span>
              ))}
            </h1>
            <p className="m-0 text-[14px] md:text-[16px] leading-[1.9] text-on-dark-muted max-w-[500px] break-keep">
              {tenant.heroSubtitle || def.subtitle}
            </p>
            <div className="flex gap-[11px] flex-wrap mt-8">
              <a href="#consult" className="acad-btn h-[52px] px-[22px] text-[15px]">무료 레벨테스트 신청</a>
              {resultStat && (
                <a href="#results" className="inline-flex items-center h-[52px] px-[22px] rounded-[7px] border border-white/30 text-on-dark text-[15px] font-extrabold no-underline hover:bg-white/5">
                  학교별 결과 보기
                </a>
              )}
            </div>
          </div>

          {photo ? (
            <div className="relative h-[260px] sm:h-[330px] md:h-[430px] rounded-[18px] overflow-hidden" style={{ boxShadow: '0 25px 60px rgba(0,0,0,.33)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt={`${tenant.name} 수업`} className="w-full h-full object-cover" style={{ filter: 'saturate(.82)' }} />
              {resultStat && headline && (
                <div className="absolute left-5 bottom-5 bg-surface text-ink px-[17px] py-[14px] rounded-[10px] text-[12px] font-bold" style={{ boxShadow: '0 8px 25px rgba(0,0,0,.13)' }}>
                  {resultStat.termLabel}
                  <b className="block text-[19px] text-accent mt-[3px]">{headline.label} {headline.value}{headline.unit}</b>
                </div>
              )}
            </div>
          ) : resultStat ? (
            <div className="p-6 md:p-8 rounded-[18px] bg-dark-surface flex flex-col gap-4">
              <div className="flex justify-between items-baseline gap-3">
                <div className="text-[17px] font-bold">성적 결과</div>
                <div className="text-[13px] text-on-dark-muted">{resultStat.termLabel}</div>
              </div>
              <table className="w-full border-collapse text-[15px]">
                <tbody>
                  {resultStat.metrics.map((m, i) => (
                    <tr key={i} className="border-t border-white/10">
                      <td className="py-3">{m.label}</td>
                      <td className="py-3 text-right font-bold text-highlight">{m.value}{m.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>

      {/* 숫자 띠 — 첫 화면 아래에 겹쳐 놓는다 */}
      {metrics.length > 0 && (
        <div className="bg-surface">
          <div className="acad-wrap">
            <div
              className={`grid grid-cols-1 ${metrics.length >= 3 ? 'sm:grid-cols-3' : metrics.length === 2 ? 'sm:grid-cols-2' : ''} border border-line rounded-[14px] bg-surface -translate-y-[14px] sm:-translate-y-[25px]`}
              style={{ boxShadow: 'var(--section-shadow)' }}
            >
              {metrics.map((m, i) => (
                <div key={i} className={`px-[15px] py-[15px] sm:px-[30px] sm:py-[25px] text-center ${i < metrics.length - 1 ? 'border-b sm:border-b-0 sm:border-r border-line' : ''}`}>
                  <span className="block text-[13px] text-muted">{m.label}</span>
                  <strong className="block mt-1 text-[28px] sm:text-[36px] tracking-[-1px] text-accent font-black font-grotesk">
                    {m.value}<small className="text-[16px]">{m.unit}</small>
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
