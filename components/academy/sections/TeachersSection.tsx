import type { AcademyStaff, AcademyTenant } from '@/lib/academy-data';

type Props = {
  tenant: AcademyTenant;
  staff: AcademyStaff[];
};

export default function TeachersSection({ tenant, staff }: Props) {
  if (staff.length === 0) return null;

  const accent = tenant.accentColor ?? '#1D3FA8';

  return (
    <section id="teachers" className="px-5 md:px-20 pt-24 md:pt-[120px] flex flex-col gap-8">
      <div className="max-w-[1440px] mx-auto w-full flex flex-col gap-8">
        <h2 className="m-0 font-grotesk text-[28px] md:text-[40px] font-extrabold tracking-tight">강사진</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {staff.map((s) => (
            <div key={s.id} className="flex gap-5 p-5 md:p-6 border border-line rounded-[10px]">
              {/* Photo placeholder */}
              <div className="w-[88px] h-[108px] flex-shrink-0 rounded-lg bg-subtle flex items-center justify-center text-[12px] text-muted overflow-hidden">
                {s.photo ? (
                  <img src={s.photo} alt={s.name} className="w-full h-full object-cover" />
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="text-muted">
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                )}
              </div>
              <div className="flex flex-col gap-1 justify-center">
                {s.roleLabel && <div className="text-[13px] font-bold" style={{ color: accent }}>{s.roleLabel}</div>}
                <div className="text-[19px] font-bold">{s.name}</div>
                {s.summary && <div className="text-[14px] leading-[1.6] text-body mt-1">{s.summary}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
