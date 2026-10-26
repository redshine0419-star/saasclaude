import type { AcademyTenant, AcademyResultStat, LevelTestSlot } from '@/lib/academy-data';
import { heroDefaults, titleLines } from '@/lib/hero';

type Props = {
  tenant: AcademyTenant;
  resultStat: AcademyResultStat | null;
  levelTestSlots: LevelTestSlot[];
};

export default function HeroSectionResult({ tenant, resultStat }: Props) {
  const accent = tenant.accentColor ?? '#1D3FA8';
  const def = heroDefaults('result', tenant.subjects);
  const lines = titleLines(tenant.heroTitle || def.title);
  const photo = tenant.heroPhotos[0] ?? null;

  return (
    <section className="px-5 md:px-20 pt-14 md:pt-20 pb-16 md:pb-20 bg-dark text-on-dark">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row gap-10 md:gap-16 items-start md:items-center">
        {/* 텍스트 */}
        <div className="flex-1 flex flex-col gap-6 md:gap-7">
          {(tenant.heroBadge || tenant.targetGrades) && (
            <div className="text-[15px] font-semibold text-on-dark-muted">{tenant.heroBadge || `${tenant.targetGrades} 내신 전문`}</div>
          )}
          <h1 className="m-0 font-grotesk text-[34px] md:text-[50px] leading-[1.24] font-extrabold tracking-tight">
            {lines.map((l, i) => (
              <span key={i}>{i > 0 && <br />}{l}</span>
            ))}
          </h1>
          <p className="m-0 text-[16px] md:text-[18px] leading-[1.75] text-on-dark-muted max-w-[560px]">
            {tenant.heroSubtitle || def.subtitle}
          </p>
          <div className="flex gap-3 flex-wrap">
            <a href="#apply" style={{ background: accent }}
              className="flex items-center h-14 px-7 rounded-[6px] text-white text-[17px] font-bold no-underline hover:opacity-90">
              레벨테스트 신청
            </a>
            <a href="#results"
              className="flex items-center h-14 px-6 rounded-[6px] border border-[#5B6B85] text-on-dark text-[17px] font-semibold no-underline hover:bg-dark-surface transition-colors">
              학교별 결과 보기
            </a>
          </div>
        </div>

        {/* 성적표가 없으면 대표 사진 */}
        {!resultStat && photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={`${tenant.name} 수업`} className="w-full md:w-[520px] h-[240px] md:h-[360px] rounded-xl object-cover" />
        )}

        {/* 성적표 패널 */}
        {resultStat && (
          <div className="w-full md:w-[520px] p-6 md:p-8 rounded-xl bg-dark-surface flex flex-col gap-4">
            <div className="flex justify-between items-baseline">
              <div className="text-[17px] font-bold">학교별 평균 점수 변화</div>
              <div className="text-[13px] text-on-dark-muted">{resultStat.termLabel}</div>
            </div>
            <table className="w-full border-collapse text-[15px] md:text-[16px]">
              <thead>
                <tr className="text-on-dark-muted text-[13px] text-left">
                  <th className="py-2 font-medium">지표</th>
                  <th className="py-2 font-medium text-right">결과</th>
                </tr>
              </thead>
              <tbody>
                {resultStat.metrics.map((m, i) => (
                  <tr key={i} className="border-t border-[#2A3B5A]">
                    <td className="py-3">{m.label}</td>
                    <td className="py-3 text-right font-bold" style={{ color: accent }}>{m.value}{m.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-[13px] leading-relaxed text-on-dark-muted">{resultStat.basisText}</div>
          </div>
        )}
      </div>
    </section>
  );
}
