'use client';

import { useState } from 'react';
import type { AcademyClass } from '@/lib/academy-data';
import { TitleLines } from '@/components/academy/TitleLines';
import { SECTION_COPY_SPEC } from '@/lib/section-copy';

type Props = { classes: AcademyClass[]; title?: string; slug?: string };

function SeatBadge({ seatsLeft }: { seatsLeft: number | null }) {
  if (seatsLeft === 0) {
    return <span className="px-2 py-0.5 rounded-md bg-warn-bg text-warn-ink text-[12px] font-semibold whitespace-nowrap">마감 · 대기 접수</span>;
  }
  if (seatsLeft !== null && seatsLeft <= 3) {
    return <span className="px-2 py-0.5 rounded-md bg-accent-soft text-accent-ink text-[12px] font-semibold whitespace-nowrap">잔여 {seatsLeft}석</span>;
  }
  return null;
}

function ClassCard({ cls }: { cls: AcademyClass }) {
  const when = [cls.days.join('·'), cls.startTime ? `${cls.startTime}${cls.endTime ? `–${cls.endTime}` : ''}` : ''].filter(Boolean).join(' ');
  return (
    <article className="bg-surface border border-line rounded-[15px] overflow-hidden transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:[box-shadow:var(--section-shadow)] flex flex-col min-w-0">
      {cls.photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cls.photo} alt={`${cls.name} 수업`} className="block w-full h-[110px] md:h-[145px] object-cover" />
      )}
      <div className="p-3 md:p-[15px] flex flex-col gap-1.5 flex-1">
        <div className="flex flex-col items-start gap-1 sm:flex-row sm:justify-between sm:gap-2 break-keep">
          <b className="text-[15px] text-ink leading-snug">{cls.name}</b>
          <SeatBadge seatsLeft={cls.seatsLeft} />
        </div>
        {cls.description && <p className="m-0 text-[13px] leading-relaxed text-body break-keep">{cls.description}</p>}
        {(when || cls.textbook) && (
          <p className="m-0 mt-auto pt-1 text-[12px] text-muted leading-relaxed">
            {when}
            {when && cls.textbook ? <br /> : null}
            {cls.textbook}
          </p>
        )}
      </div>
    </article>
  );
}

const TAB_ALL = '전체';

export default function ClassesSection({ classes, slug, title = SECTION_COPY_SPEC.classes.title }: Props) {
  // 반이 많을 때만 학년 탭을 보여 준다 (처음은 전체)
  const bands = Array.from(new Set(classes.map((c) => c.gradeBand).filter(Boolean))) as string[];
  const showTabs = classes.length > 8 && bands.length > 1;
  const [activeTab, setActiveTab] = useState(TAB_ALL);
  const filtered = showTabs && activeTab !== TAB_ALL ? classes.filter((c) => c.gradeBand === activeTab) : classes;

  if (classes.length === 0) return null;

  return (
    <section id="classes" className="pt-14 md:pt-[76px] pb-8 md:pb-10">
      <div className="acad-wrap">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 md:mb-8">
          <div className="min-w-0">
            <p className="acad-eyebrow">수업 안내</p>
            <h2 className="acad-h2"><TitleLines text={title} /></h2>
          </div>
          {slug && <a href={`/${slug}/consult`} className="acad-more">수업 상담하기 →</a>}
        </div>

        {showTabs && (
          <div className="flex gap-1 p-1 bg-subtle rounded-xl self-start mb-5 overflow-x-auto">
            {[TAB_ALL, ...bands].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                aria-pressed={activeTab === tab}
                className={`h-10 px-4 rounded-[10px] text-[14px] font-semibold whitespace-nowrap cursor-pointer border-none ${activeTab === tab ? 'bg-surface text-ink shadow-sm' : 'bg-transparent text-body hover:text-ink'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3.5">
          {filtered.map((cls) => <ClassCard key={cls.id} cls={cls} />)}
        </div>
      </div>
    </section>
  );
}
