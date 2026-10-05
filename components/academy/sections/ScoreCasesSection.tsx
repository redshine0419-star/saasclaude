import type { AcademyReview, AcademyTenant } from '@/lib/academy-data';

type Props = {
  tenant: AcademyTenant;
  reviews: AcademyReview[];
};

export default function ScoreCasesSection({ tenant, reviews }: Props) {
  const cases = reviews.filter((r) => r.kind === 'score_case');
  if (cases.length === 0) return null;

  const accent = tenant.accentColor ?? '#1D3FA8';

  return (
    <section className="px-5 md:px-20 pt-24 md:pt-[120px] flex flex-col gap-8">
      <div className="max-w-[1440px] mx-auto w-full flex flex-col gap-8">
        <h2 className="m-0 font-grotesk text-[28px] md:text-[40px] font-extrabold tracking-tight">성적 변화 사례</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cases.map((c) => (
            <div key={c.id} className="p-6 md:p-7 border border-line rounded-[10px] flex flex-col gap-4">
              <div className="text-[14px] text-body">
                {c.authorLabel}{c.periodLabel ? ` · ${c.periodLabel}` : ''}
              </div>
              <div className="flex items-baseline gap-3 font-grotesk font-extrabold">
                <span className="text-[36px] md:text-[40px] text-muted">{c.beforeValue}</span>
                <span className="text-[20px]">→</span>
                <span className="text-[36px] md:text-[40px]" style={{ color: accent }}>{c.afterValue}</span>
              </div>
              {c.comment && (
                <p className="m-0 text-[14px] md:text-[15px] leading-[1.7] text-body">{c.comment}</p>
              )}
            </div>
          ))}
        </div>

        <div className="text-[13px] text-body">학생·학부모 서면 동의를 받은 사례만 게재합니다.</div>
      </div>
    </section>
  );
}
