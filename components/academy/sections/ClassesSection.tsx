'use client';

import { useState } from 'react';
import type { AcademyClass } from '@/lib/academy-data';

type Props = { classes: AcademyClass[] };

function SeatBadge({ seatsLeft, waitlistCount }: { seatsLeft: number | null; waitlistCount: number }) {
  if (seatsLeft === 0) {
    return (
      <span className="px-2.5 py-1 rounded-md bg-warn-bg text-warn-ink text-[13px] font-semibold">
        마감 · 대기 접수
      </span>
    );
  }
  if (seatsLeft !== null && seatsLeft <= 3) {
    return (
      <span className="px-2.5 py-1 rounded-md bg-accent-soft text-accent-ink text-[13px] font-semibold">
        잔여 {seatsLeft}석
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 rounded-md bg-accent-soft text-accent-ink text-[13px] font-semibold">
      모집 중
    </span>
  );
}

function ClassCard({ cls }: { cls: AcademyClass }) {
  return (
    <div className="p-6 md:p-8 bg-surface rounded-2xl flex flex-col gap-4 md:gap-[18px]">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[18px] md:text-[22px] font-bold text-ink">{cls.name}</div>
        <SeatBadge seatsLeft={cls.seatsLeft} waitlistCount={cls.waitlistCount} />
      </div>
      <div className="flex flex-col gap-2 md:gap-2.5 text-[14px] md:text-[15px]">
        {cls.days.length > 0 && (
          <div className="flex gap-3">
            <span className="w-14 text-muted flex-shrink-0">요일</span>
            <span className="text-ink">{cls.days.join(' · ')}</span>
          </div>
        )}
        {cls.startTime && (
          <div className="flex gap-3">
            <span className="w-14 text-muted flex-shrink-0">시간</span>
            <span className="text-ink">{cls.startTime} – {cls.endTime}</span>
          </div>
        )}
        {cls.textbook && (
          <div className="flex gap-3">
            <span className="w-14 text-muted flex-shrink-0">교재</span>
            <span className="text-ink">{cls.textbook}</span>
          </div>
        )}
      </div>
      {cls.description && (
        <p className="m-0 text-[14px] md:text-[15px] leading-[1.7] text-body">{cls.description}</p>
      )}
    </div>
  );
}

export default function ClassesSection({ classes }: Props) {
  const tabs = Array.from(new Set(classes.map((c) => c.gradeBand).filter(Boolean))) as string[];
  const [activeTab, setActiveTab] = useState(tabs[0] ?? '');

  const filtered = activeTab
    ? classes.filter((c) => c.gradeBand === activeTab)
    : classes;

  if (classes.length === 0) return null;

  return (
    <section id="classes" className="px-5 md:px-20 pt-16 md:pt-[120px]">
      <div className="flex flex-col gap-6 md:gap-8">
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex flex-col gap-2.5 md:gap-3">
            <div className="text-[14px] md:text-[15px] font-bold text-label">수업 안내</div>
            <h2 className="m-0 font-serif text-[28px] md:text-[40px] font-bold text-ink">학년별 반 구성</h2>
          </div>

          {/* 탭 */}
          {tabs.length > 1 && (
            <div className="flex gap-1 p-1 bg-subtle rounded-xl self-start">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`h-11 px-5 md:px-6 rounded-[10px] text-[14px] md:text-[15px] font-semibold transition-colors cursor-pointer border-none ${
                    activeTab === tab
                      ? 'bg-surface text-ink shadow-sm'
                      : 'bg-transparent text-body hover:text-ink'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filtered.map((cls) => (
            <ClassCard key={cls.id} cls={cls} />
          ))}
        </div>
      </div>
    </section>
  );
}
