import type { AcademyFee, AcademyTenant } from '@/lib/academy-data';
import { TitleLines } from '@/components/academy/TitleLines';
import { SECTION_COPY_SPEC } from '@/lib/section-copy';
import { RefundNotice } from '@/components/academy/RefundNotice';

type Props = {
  title?: string;
  eyebrow?: string;
  tenant: AcademyTenant;
  fees: AcademyFee[];
  extraCosts: { id: string; label: string; amount: number; note: string | null }[];
  /** 학원이 쓴 반환 규정 — 없으면 법정 기준을 보여 준다 */
  refundPolicyText?: string | null;
};

function formatAmount(n: number) {
  return n.toLocaleString('ko-KR') + '원';
}

export default function FeesSection({ fees, extraCosts, refundPolicyText = null, eyebrow = '교습비', title = SECTION_COPY_SPEC.fees.title }: Props) {
  if (fees.length === 0) return null;

  return (
    <section id="fee" className="acad-section acad-fees">
      <div className="acad-wrap grid grid-cols-1 md:grid-cols-[0.7fr_1.3fr] gap-6 md:gap-[45px] items-start">
        {/* 설명 */}
        <div className="min-w-0">
          <p className="acad-eyebrow">{eyebrow}</p>
          <h2 className="acad-h2 mb-[15px]"><TitleLines text={title} /></h2>
          <p className="m-0 text-[14px] md:text-[15px] leading-[1.7] text-body">
            관할 교육지원청에 신고한 교습비입니다. 교재비 등 기타 경비는 별도로 표기했습니다.
          </p>
        </div>

        {/* 표 + 반환 기준 */}
        <div className="flex flex-col gap-4 min-w-0">
        <div className="acad-card overflow-x-auto min-w-0">
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr className="bg-subtle text-left">
                <th className="px-4 md:px-5 py-4 font-semibold text-ink">과정</th>
                <th className="px-4 md:px-5 py-4 font-semibold text-ink hidden md:table-cell">월 수업 시간</th>
                <th className="px-4 md:px-5 py-4 font-semibold text-ink">교습비(월)</th>
                <th className="px-4 md:px-5 py-4 font-semibold text-ink hidden lg:table-cell">비고</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((fee) => (
                <tr key={fee.id} className="border-t border-line">
                  <td className="px-4 md:px-5 py-4 text-ink">
                    {fee.label}
                    {(fee.sessionsPerWeek || fee.monthlyHours) && (
                      <span className="block md:hidden text-[12px] text-muted mt-0.5">
                        {[fee.sessionsPerWeek && `주 ${fee.sessionsPerWeek}회`, fee.monthlyHours && `월 ${fee.monthlyHours}시간`].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 md:px-5 py-4 text-body hidden md:table-cell">
                    {[fee.sessionsPerWeek && `주 ${fee.sessionsPerWeek}회`, fee.monthlyHours && `월 ${fee.monthlyHours}시간`].filter(Boolean).join(' · ') || '—'}
                  </td>
                  <td className="px-4 md:px-5 py-4 text-ink"><strong className="acad-fee-amount text-[15px] md:text-[16px]">{formatAmount(fee.amount)}</strong></td>
                  <td className="px-4 md:px-5 py-4 text-muted hidden lg:table-cell">{fee.note ?? '—'}</td>
                </tr>
              ))}
              {extraCosts.map((ec) => (
                <tr key={ec.id} className="border-t border-line">
                  <td className="px-4 md:px-5 py-3.5 text-body">
                    {ec.label}
                    {ec.note && <span className="block md:hidden text-[12px] text-muted mt-0.5">{ec.note}</span>}
                  </td>
                  <td className="px-4 md:px-5 py-3.5 text-muted hidden md:table-cell">{ec.note ?? ''}</td>
                  <td className="px-4 md:px-5 py-3.5 text-body">{formatAmount(ec.amount)}</td>
                  <td className="px-4 md:px-5 py-3.5 hidden lg:table-cell" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <RefundNotice text={refundPolicyText} />
        </div>
      </div>
    </section>
  );
}
