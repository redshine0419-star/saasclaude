import type { AcademyTenant } from '@/lib/academy-data';

type Props = {
  tenant: AcademyTenant;
};

const STEPS = [
  { code: 'D-28', title: '범위 확정', body: '학교별 시험 범위와\n교과서·부교재 정리' },
  { code: 'D-21', title: '개념 완성', body: '단원별 확인 테스트,\n오답 재풀이' },
  { code: 'D-14', title: '기출 반복', body: '해당 학교 최근\n기출문제 집중 분석' },
  { code: 'D-7', title: '실전 모의', body: '시간 재고 푸는\n예상 문제 풀이' },
  { code: '시험 후', title: '결과 분석', body: '학부모님께\n개별 분석표 발송' },
];

export default function ExamSystemSection({ tenant }: Props) {
  const accent = tenant.accentColor ?? '#1D3FA8';

  return (
    <section id="system" className="px-5 md:px-20 pt-24 md:pt-[120px] flex flex-col gap-8">
      <div className="max-w-[1440px] mx-auto w-full flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <div className="text-[15px] font-bold" style={{ color: accent }}>시험 대비 시스템</div>
          <h2 className="m-0 font-grotesk text-[28px] md:text-[40px] font-extrabold tracking-tight">시험 4주 전부터 정해진 순서대로</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 border border-line rounded-[10px] overflow-hidden">
          {STEPS.map((step, i) => {
            const isLast = i === STEPS.length - 1;
            return (
              <div key={step.code}
                className={`p-5 md:p-6 flex flex-col gap-2 md:gap-3 ${i < STEPS.length - 1 ? 'border-b md:border-b-0 md:border-r border-line' : ''} ${isLast ? 'bg-subtle' : ''}`}>
                <div className="font-grotesk text-[20px] md:text-[22px] font-extrabold" style={isLast ? { color: accent } : undefined}>
                  {step.code}
                </div>
                <div className="text-[15px] font-bold">{step.title}</div>
                <div className="text-[13px] md:text-[14px] leading-[1.7] text-body whitespace-pre-line">{step.body}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
