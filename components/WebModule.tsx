'use client';

import { useState } from 'react';
import DiagnosisModule from '@/components/DiagnosisModule';
import CompetitorModule from '@/components/CompetitorModule';

type Tab = 'seo' | 'competitor';

export default function WebModule({ onToast }: { onToast: (msg: string) => void }) {
  const [tab, setTab] = useState<Tab>('seo');

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-[#d0d7de] dark:border-[#30363d]">
        <button
          onClick={() => setTab('seo')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'seo'
              ? 'border-[#0969da] text-[#0969da] dark:border-[#388bfd] dark:text-[#388bfd]'
              : 'border-transparent text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3]'
          }`}
        >
          🔍 GEO &amp; SEO 진단
        </button>
        <button
          onClick={() => setTab('competitor')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'competitor'
              ? 'border-[#0969da] text-[#0969da] dark:border-[#388bfd] dark:text-[#388bfd]'
              : 'border-transparent text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3]'
          }`}
        >
          ⚡ 경쟁사 비교 분석
        </button>
      </div>

      {/* Tab content */}
      {tab === 'seo' && <DiagnosisModule onToast={onToast} />}
      {tab === 'competitor' && <CompetitorModule onToast={onToast} />}
    </div>
  );
}
