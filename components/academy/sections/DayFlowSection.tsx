import type { AcademyTenant } from '@/lib/academy-data';

type Props = {
  tenant: AcademyTenant;
};

const STEP_COLORS = ['#FFF3C4', '#DDF1FF', '#FFE3EC', '#E0F5EF', 'accent'];

const STEPS = [
  { num: '1', title: '도착 알림', body: '학원에 들어오면 부모님 휴대폰으로 바로 알려드려요' },
  { num: '2', title: '놀이로 시작', body: '짧은 게임으로 아이의 입을 먼저 엽니다' },
  { num: '3', title: '본 수업', body: '읽기·말하기·쓰기를 한 수업 안에서' },
  { num: '4', title: '오늘의 칭찬', body: '잘한 점 한 가지를 꼭 찾아 말해줍니다' },
  { num: '5', title: '하원 알림', body: '셔틀 출발과 함께 오늘 배운 내용을 보내드려요' },
];

export default function DayFlowSection({ tenant }: Props) {
  const accent = tenant.accentColor ?? '#0F766E';

  return (
    <section id="day" className="mx-5 md:mx-16 mt-24 md:mt-28 p-10 md:p-14 rounded-[32px] md:rounded-[40px] bg-subtle flex flex-col gap-8">
      <h2 className="m-0 font-round text-[32px] md:text-[42px] text-ink">우리 아이의 학원 하루</h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        {STEPS.map((step, i) => {
          const isLast = i === STEPS.length - 1;
          const bg = isLast ? accent : STEP_COLORS[i];
          const textColor = isLast ? '#FFFFFF' : '#1F2A37';
          const numBg = isLast ? '#FFFFFF' : bg;
          const numColor = isLast ? '#1F2A37' : '#1F2A37';

          return (
            <div key={step.num} className="p-5 md:p-6 rounded-[20px] md:rounded-[24px] flex flex-col gap-3"
              style={{ background: bg, color: textColor }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-round text-[22px]"
                style={{ background: numBg, color: numColor }}>
                {step.num}
              </div>
              <div className="text-[16px] md:text-[17px] font-bold">{step.title}</div>
              <div className="text-[13px] md:text-[14px] leading-[1.65]" style={{ color: isLast ? 'rgba(255,255,255,0.85)' : '#3A4656' }}>
                {step.body}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
