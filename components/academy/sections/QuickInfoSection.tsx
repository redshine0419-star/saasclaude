import type { AcademyClass, AcademyTenant } from '@/lib/academy-data';

type Props = { tenant: AcademyTenant; classes?: AcademyClass[] };

export default function QuickInfoSection({ tenant, classes = [] }: Props) {
  // 반 정원은 등록한 반 중 가장 큰 정원으로 보여 준다 (입력이 없으면 칸을 숨긴다)
  const caps = classes.map((c) => c.capacity).filter((n): n is number => typeof n === 'number' && n > 0);
  const items = [
    { label: '대상', value: tenant.targetGrades },
    { label: '반 정원', value: caps.length ? `최대 ${Math.max(...caps)}명` : null },
    { label: '위치', value: tenant.address?.split(',').pop()?.trim() || tenant.address },
    { label: '운영 시간', value: tenant.hours },
  ].filter((item) => item.value);

  if (items.length === 0) return null;

  return (
    <section className="pb-9 md:pb-[78px]">
      <div className="acad-wrap">
        <div className="bg-surface border border-line rounded-[18px] px-[18px] py-[18px] md:px-[30px] md:py-[25px] grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-[18px]">
          {items.map((item) => (
            <div key={item.label} className="min-w-0">
              <small className="block text-[13px] text-muted mb-1">{item.label}</small>
              <strong className="block text-[15px] md:text-[18px] font-bold text-ink leading-snug">{item.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
