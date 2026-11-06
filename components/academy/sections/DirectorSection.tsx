import type { AcademyDirector, AcademyTenant } from '@/lib/academy-data';

type Props = {
  tenant: AcademyTenant;
  director: AcademyDirector;
};

export default function DirectorSection({ tenant, director }: Props) {
  if (!director) return null;

  const hasContent = director.headline || director.philosophy || director.education;
  if (!hasContent) return null;

  const lines = [
    { label: '학력', value: director.education },
    { label: '경력', value: director.career },
    { label: '담당', value: director.subjectsTaught },
  ].filter((l) => l.value);

  return (
    <section id="about" className="py-14 md:py-[76px] bg-surface">
      <div className="acad-wrap grid grid-cols-1 md:grid-cols-[0.8fr_1.2fr] md:items-center gap-7 md:gap-[56px]">
        {/* 사진 */}
        <div className="w-full h-[280px] md:h-[460px] rounded-[20px] bg-subtle overflow-hidden flex items-center justify-center text-muted">
          {director.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={director.photo} alt={`${tenant.name} 원장`} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-40">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span className="text-sm">원장 사진</span>
            </div>
          )}
        </div>

        {/* 텍스트 */}
        <div className="flex flex-col gap-5 min-w-0">
          <div>
            <p className="acad-eyebrow">원장 소개</p>
            {director.headline && <h2 className="acad-h2 whitespace-pre-line">{director.headline}</h2>}
          </div>

          {director.philosophy && (
            <p className="m-0 text-[15px] md:text-[17px] leading-[1.8] text-body max-w-[620px]">
              {director.philosophy}
            </p>
          )}

          {lines.length > 0 && (
            <div className="flex flex-col gap-3 pt-2 border-t border-line">
              {lines.map((l) => (
                <div key={l.label} className="flex gap-4 text-[15px] md:text-[16px] pt-3 first:pt-3">
                  <span className="w-12 md:w-20 text-muted flex-shrink-0">{l.label}</span>
                  <span className="text-ink">{l.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
