import type { AcademyPrinciple } from '@/lib/academy-data';

type Props = {
  principles: AcademyPrinciple[];
  slug: string;
};

export default function PrinciplesSection({ principles, slug }: Props) {
  if (principles.length === 0) return null;

  return (
    <section className="px-5 md:px-20 py-16 md:py-20 bg-white">
      <div className="max-w-[1200px] mx-auto">
        <p className="text-[15px] font-bold text-accent mb-3">수업 원칙</p>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <h2 className="font-serif text-[28px] md:text-[38px] leading-snug m-0">
            흔들리지 않는 수업의 기준
          </h2>
          <a
            href={`/${slug}/about`}
            className="text-[14px] text-body hover:text-ink transition-colors no-underline flex-shrink-0"
          >
            학원 소개 전체 보기 →
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {principles.map((p) => (
            <div
              key={p.id}
              className="p-7 md:p-8 bg-bg rounded-[16px] flex flex-col gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-accent text-on-accent flex items-center justify-center font-bold text-[15px] flex-shrink-0">
                {p.number}
              </div>
              <div>
                <h3 className="text-[17px] font-bold m-0 mb-2">{p.title}</h3>
                {p.description && (
                  <p className="text-[14px] text-body leading-relaxed m-0">{p.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
