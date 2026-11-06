'use client';

import { useState } from 'react';
import type { AcademyClass } from '@/lib/academy-data';
import { TitleLines } from '@/components/academy/TitleLines';
import { SECTION_COPY_SPEC } from '@/lib/section-copy';

type Props = {
  classes: AcademyClass[];
  title?: string;
  eyebrow?: string;
  slug?: string;
  /** photo: 사진 카드 4열(테마 A) · detail: 요일·시간·교재가 보이는 카드 3열(테마 C) */
  look?: 'photo' | 'detail';
};

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

function DetailCard({ cls, featured }: { cls: AcademyClass; featured: boolean }) {
  const rows = [
    ['요일', cls.days.join(' · ')],
    ['시간', cls.startTime ? `${cls.startTime}${cls.endTime ? ` – ${cls.endTime}` : ''}` : ''],
    ['교재', cls.textbook ?? ''],
  ].filter(([, v]) => v);
  const seat = cls.seatsLeft === 0 ? '마감 · 대기 접수' : cls.seatsLeft !== null && cls.seatsLeft <= 3 ? `잔여 ${cls.seatsLeft}석` : null;
  return (
    <article
      className="p-[23px] md:p-[27px] border flex flex-col min-w-0"
      style={{
        borderRadius: 'var(--card-radius)',
        background: featured ? 'var(--pastel-cream, var(--surface))' : 'var(--surface)',
        borderColor: featured ? '#f5df9a' : 'var(--line)',
        boxShadow: '0 8px 28px rgba(31,42,55,.04)',
      }}
    >
      <div className="flex justify-between items-center gap-2 mb-5">
        <h3 className="m-0 text-[21px] font-bold text-ink break-keep" style={{ fontFamily: 'var(--font-heading)' }}>{cls.name}</h3>
        {seat && <span className="text-[12px] font-extrabold px-2.5 py-1.5 rounded-full whitespace-nowrap" style={{ background: 'var(--highlight-soft)', color: cls.seatsLeft === 0 ? 'var(--warn-ink)' : '#8a6200' }}>{seat}</span>}
      </div>
      {rows.length > 0 && (
        <div className="grid gap-[9px] text-[14px] mb-[17px]">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[48px_1fr]"><span className="text-muted">{k}</span><b className="text-ink font-semibold">{v}</b></div>
          ))}
        </div>
      )}
      {cls.description && <p className="m-0 text-[14px] leading-[1.8] text-body break-keep">{cls.description}</p>}
    </article>
  );
}

const TAB_ALL = '전체';

export default function ClassesSection({ classes, slug, eyebrow = '수업 안내', look = 'photo', title = SECTION_COPY_SPEC.classes.title }: Props) {
  // 반이 많을 때만 학년 탭을 보여 준다 (처음은 전체)
  const bands = Array.from(new Set(classes.map((c) => c.gradeBand).filter(Boolean))) as string[];
  const showTabs = classes.length > 8 && bands.length > 1;
  const [activeTab, setActiveTab] = useState(TAB_ALL);
  const filtered = showTabs && activeTab !== TAB_ALL ? classes.filter((c) => c.gradeBand === activeTab) : classes;

  if (classes.length === 0) return null;

  return (
    <section id="classes" className={look === 'photo' ? 'pt-14 md:pt-[76px] pb-8 md:pb-10' : 'acad-section'}>
      <div className="acad-wrap">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 md:mb-8">
          <div className="min-w-0">
            <p className="acad-eyebrow">{eyebrow}</p>
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

        {look === 'photo' ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3.5">
            {filtered.map((cls) => <ClassCard key={cls.id} cls={cls} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
            {filtered.map((cls, i) => <DetailCard key={cls.id} cls={cls} featured={i === 0} />)}
          </div>
        )}
      </div>
    </section>
  );
}
