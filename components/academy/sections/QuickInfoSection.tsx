import type { AcademyTenant } from '@/lib/academy-data';

type Props = { tenant: AcademyTenant };

export default function QuickInfoSection({ tenant }: Props) {
  const items = [
    { label: '대상', value: tenant.targetGrades },
    { label: '반 정원', value: '최대 8명' },
    { label: '위치', value: tenant.address?.split(' ').slice(-2).join(' ') ?? tenant.address },
    { label: '운영 시간', value: tenant.hours },
  ].filter((item) => item.value);

  if (items.length === 0) return null;

  return (
    <section className="mx-5 md:mx-20 mt-6">
      <div className="bg-surface rounded-2xl px-6 py-6 md:px-10 md:py-7 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-1.5">
            <div className="text-[12px] md:text-sm text-muted">{item.label}</div>
            <div className="text-[15px] md:text-xl font-bold text-ink leading-tight">{item.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
