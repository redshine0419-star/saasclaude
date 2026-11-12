import { refundLines, STATUTORY_REFUND_SOURCE } from '@/lib/refund';

/** 교습비 반환 기준 — 교습비 표와 함께 보인다 (법정 표시 사항) */
export function RefundNotice({ text, className = '' }: { text: string | null; className?: string }) {
  const { lines, isStatutory } = refundLines(text);
  return (
    <div className={`acad-card p-5 md:p-6 flex flex-col gap-3 ${className}`}>
      <h3 className="m-0 text-[16px] md:text-[17px] font-bold text-ink">교습비 반환 기준</h3>
      <ul className="m-0 pl-5 list-disc flex flex-col gap-1.5 text-[14px] leading-[1.65] text-body">
        {lines.map((l, i) => <li key={i}>{l}</li>)}
      </ul>
      <p className="m-0 text-[12.5px] text-muted leading-[1.6]">
        {isStatutory ? `${STATUTORY_REFUND_SOURCE}이며, 자세한 내용은 학원에 문의해 주세요.` : '학원법에 따른 반환 기준보다 불리하게 적용하지 않습니다.'}
      </p>
    </div>
  );
}
