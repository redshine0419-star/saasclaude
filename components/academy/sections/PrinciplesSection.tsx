import type { AcademyPrinciple } from '@/lib/academy-data';
import { TitleLines } from '@/components/academy/TitleLines';
import { SECTION_COPY_SPEC } from '@/lib/section-copy';

type Props = {
  title?: string;
  principles: AcademyPrinciple[];
  slug: string;
  /** 옆에 둘 사진 (교실·시설 사진). 없으면 글만 */
  photo?: string | null;
};

export default function PrinciplesSection({ principles, slug, photo = null, title = SECTION_COPY_SPEC.principles.title }: Props) {
  if (principles.length === 0) return null;

  return (
    <section id="principles" className="acad-section bg-surface">
      <div className={`acad-wrap grid grid-cols-1 gap-8 md:gap-11 items-center ${photo ? 'md:grid-cols-[0.8fr_1.2fr]' : ''}`}>
        <div className="min-w-0">
          <p className="acad-eyebrow">수업 원칙</p>
          <h2 className="acad-h2"><TitleLines text={title} /></h2>
          <a href={`/${slug}/about`} className="acad-more inline-block mt-4">학원 소개 전체 보기 →</a>

          <div className={`grid grid-cols-1 gap-3.5 mt-[30px] ${photo ? 'sm:grid-cols-3' : 'md:grid-cols-3'}`}>
            {principles.map((p, i) => (
              <div key={p.id} className="px-4 py-[18px] bg-bg rounded-[14px] min-w-0">
                <span className="text-[13px] font-extrabold text-label">{String(p.number ?? i + 1).padStart(2, '0')}</span>
                <b className="block my-[7px] text-[15px] text-ink">{p.title}</b>
                {p.description && <span className="block text-[13px] leading-relaxed text-body">{p.description}</span>}
              </div>
            ))}
          </div>
        </div>

        {photo && (
          <div className="h-[230px] md:h-[350px] rounded-[20px] overflow-hidden bg-subtle">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="수업이 진행되는 교실" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </section>
  );
}
