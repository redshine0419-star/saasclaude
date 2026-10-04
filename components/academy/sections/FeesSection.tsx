import type { AcademyFee, AcademyTenant } from '@/lib/academy-data';

type Props = {
  tenant: AcademyTenant;
  fees: AcademyFee[];
  extraCosts: { id: string; label: string; amount: number; note: string | null }[];
};

function formatAmount(n: number) {
  return n.toLocaleString('ko-KR') + '원';
}

export default function FeesSection({ tenant, fees, extraCosts }: Props) {
  if (fees.length === 0) return null;

  return (
    <section id="fee" className="px-5 md:px-20 pt-16 md:pt-[120px]">
      <div className="flex flex-col md:flex-row md:gap-16">
        {/* 설명 */}
        <div className="md:w-[360px] md:flex-shrink-0 flex flex-col gap-3 md:gap-4 mb-6 md:mb-0">
          <div className="text-[14px] md:text-[15px] font-bold text-label">교습비</div>
          <h2 className="m-0 font-serif text-[28px] md:text-[40px] font-bold text-ink leading-tight">숨김 없이<br />먼저 알려드립니다</h2>
          <p className="m-0 text-[14px] md:text-[15px] leading-[1.7] text-muted">
            관할 교육지원청에 신고한 교습비입니다. 교재비 등 기타 경비는 별도로 표기했습니다.
          </p>
        </div>

        {/* 테이블 */}
        <div className="flex-1 bg-surface rounded-2xl overflow-x-auto">
          <table className="w-full border-collapse text-[14px] md:text-[16px]">
            <thead>
              <tr className="bg-subtle text-left">
                <th className="px-4 md:px-7 py-4 font-semibold text-ink">과정</th>
                <th className="px-4 md:px-7 py-4 font-semibold text-ink hidden md:table-cell">월 수업 시간</th>
                <th className="px-4 md:px-7 py-4 font-semibold text-ink">교습비(월)</th>
                <th className="px-4 md:px-7 py-4 font-semibold text-ink hidden md:table-cell">기타 경비</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((fee) => (
                <tr key={fee.id} className="border-t border-line">
                  <td className="px-4 md:px-7 py-4 text-ink">{fee.label}</td>
                  <td className="px-4 md:px-7 py-4 text-body hidden md:table-cell">
                    {fee.sessionsPerWeek && `주 ${fee.sessionsPerWeek}회`}
                    {fee.monthlyHours && ` · 월 ${fee.monthlyHours}시간`}
                  </td>
                  <td className="px-4 md:px-7 py-4 font-bold text-ink">{formatAmount(fee.amount)}</td>
                  <td className="px-4 md:px-7 py-4 text-muted hidden md:table-cell">{fee.note ?? '—'}</td>
                </tr>
              ))}
              {extraCosts.map((ec) => (
                <tr key={ec.id} className="border-t border-line bg-subtle/50">
                  <td className="px-4 md:px-7 py-3 text-muted text-[13px] md:text-[15px]" colSpan={2}>{ec.label}</td>
                  <td className="px-4 md:px-7 py-3 text-muted text-[13px] md:text-[15px]">{formatAmount(ec.amount)}</td>
                  <td className="px-4 md:px-7 py-3 text-muted text-[13px] md:text-[15px] hidden md:table-cell">{ec.note ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
