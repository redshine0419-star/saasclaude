import type { AcademyStaff, AcademyTenant } from '@/lib/academy-data';
import { TitleLines } from '@/components/academy/TitleLines';
import { SECTION_COPY_SPEC } from '@/lib/section-copy';

type Props = {
  title?: string;
  eyebrow?: string;
  tenant: AcademyTenant;
  staff: AcademyStaff[];
};

export default function TeachersSection({ staff, eyebrow = 'OUR TEACHERS', title = SECTION_COPY_SPEC.teachers.title }: Props) {
  if (staff.length === 0) return null;

  return (
    <section id="teachers" className="acad-section">
      <div className="acad-wrap">
        <div className="mb-8 md:mb-[38px]">
          <p className="acad-eyebrow">{eyebrow}</p>
          <h2 className="acad-h2"><TitleLines text={title} /></h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[13px] md:gap-[18px]">
          {staff.map((s) => (
            <article key={s.id} className="grid grid-cols-[115px_1fr] sm:block bg-surface border border-line rounded-[14px] overflow-hidden">
              <div className="h-full min-h-[170px] sm:h-[210px] bg-subtle flex items-center justify-center text-muted">
                {s.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.photo} alt={s.name} className="w-full h-full object-cover" />
                ) : (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                )}
              </div>
              <div className="p-4 sm:p-[22px] min-w-0">
                {s.roleLabel && <span className="text-[11px] font-black text-accent">{s.roleLabel}</span>}
                <h3 className="my-[7px] text-[19px] font-bold text-ink">{s.name}</h3>
                {s.summary && <p className="m-0 text-[13px] leading-[1.8] text-muted break-keep">{s.summary}</p>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
