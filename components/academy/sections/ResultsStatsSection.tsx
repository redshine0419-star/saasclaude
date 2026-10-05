import type { AcademyResultStat, AcademyTenant } from '@/lib/academy-data';

type Props = {
  tenant: AcademyTenant;
  resultStats: AcademyResultStat[];
};

export default function ResultsStatsSection({ tenant, resultStats }: Props) {
  const stat = resultStats[0];
  if (!stat) return null;

  const accent = tenant.accentColor ?? '#1D3FA8';

  return (
    <section id="results" className="px-5 md:px-20 pt-20 md:pt-24 flex flex-col gap-8">
      <div className="max-w-[1440px] mx-auto w-full flex flex-col gap-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <h2 className="m-0 font-grotesk text-[28px] md:text-[40px] font-extrabold tracking-tight">숫자로 보는 지난 학기</h2>
          <span className="text-[14px] text-body bg-subtle px-3 py-1 rounded-md">{stat.termLabel}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stat.metrics.map((m, i) => {
            const isLast = i === stat.metrics.length - 1;
            return (
              <div key={i}
                style={isLast ? { background: accent } : undefined}
                className={`p-6 md:p-7 rounded-[10px] border ${isLast ? 'border-transparent text-white' : 'border-line'} flex flex-col gap-2`}>
                <div className={`text-[14px] ${isLast ? 'text-white/80' : 'text-body'}`}>{m.label}</div>
                <div className="font-grotesk text-[42px] md:text-[52px] font-extrabold leading-none mt-2">
                  {m.value}<span className="text-[20px] md:text-[22px]">{m.unit}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-[13px] text-body">{stat.basisText}</div>
      </div>
    </section>
  );
}
