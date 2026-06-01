'use client';

import { useEffect, useState } from 'react';

// 다음 세능검 예상 시험일 (2025년 9월 21일 기준)
const EXAM_DATE = new Date('2025-09-21T00:00:00');

export default function DdayCounter() {
  const [dday, setDday] = useState<number | null>(null);

  useEffect(() => {
    const diff = Math.ceil((EXAM_DATE.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    setDday(diff > 0 ? diff : 0);
  }, []);

  return (
    <div
      className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl border"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'rgba(212,168,67,0.3)' }}
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--gold-dark)' }}>
          📅 제 56회 세계사능력검정시험
        </p>
        <p className="text-sm" style={{ color: 'var(--cream-muted)' }}>2025년 9월 21일 (일)</p>
      </div>
      <div className="text-center">
        <p className="text-xs mb-1" style={{ color: 'var(--cream-muted)' }}>시험까지</p>
        <p className="text-4xl font-black" style={{ color: 'var(--gold)', fontFamily: 'Georgia, serif' }}>
          {dday === null ? '...' : `D-${dday}`}
        </p>
      </div>
      <a
        href="/exam"
        className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 flex-shrink-0"
        style={{ backgroundColor: 'rgba(212,168,67,0.15)', color: 'var(--gold)', border: '1px solid rgba(212,168,67,0.3)' }}
      >
        기출 퀴즈 풀기 →
      </a>
    </div>
  );
}
