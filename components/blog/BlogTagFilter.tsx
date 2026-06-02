'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  allTags: string[];
  lang: string;
  selectedTag: string | undefined;
  isKo: boolean;
  isJa: boolean;
}

export default function BlogTagFilter({ allTags, lang, selectedTag, isKo, isJa }: Props) {
  const [open, setOpen] = useState(false);

  if (allTags.length === 0) return null;

  return (
    <div className="mb-8">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3] transition-colors mb-3"
      >
        {open
          ? <><ChevronUp size={13} /> {isKo ? '태그 접기' : isJa ? 'タグを閉じる' : 'Hide tags'}</>
          : <><ChevronDown size={13} /> {isKo ? `태그로 필터 (${allTags.length})` : isJa ? `タグでフィルター (${allTags.length})` : `Filter by tag (${allTags.length})`}</>
        }
      </button>

      {open && (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/blog/${lang}`}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              !selectedTag
                ? 'bg-[#000000] text-white border-[#000000]'
                : 'border-[#d0d7de] dark:border-[#30363d] text-[#57606a] dark:text-[#8b949e] hover:border-[#57606a]'
            }`}
          >
            {isKo ? '전체' : isJa ? 'すべて' : 'All'}
          </Link>
          {allTags.map((t) => (
            <Link
              key={t}
              href={`/blog/${lang}?tag=${encodeURIComponent(t)}`}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                selectedTag === t
                  ? 'bg-[#000000] text-white border-[#000000]'
                  : 'border-[#d0d7de] dark:border-[#30363d] text-[#57606a] dark:text-[#8b949e] hover:border-[#57606a]'
              }`}
            >
              {t}
            </Link>
          ))}
        </div>
      )}

      {/* 선택된 태그가 있으면 접힌 상태에서도 표시 */}
      {!open && selectedTag && (
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-[#57606a] dark:text-[#8b949e]">
            {isKo ? '필터:' : isJa ? 'フィルター:' : 'Filter:'}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#000000] text-white border border-[#000000]">
            {selectedTag}
          </span>
          <Link
            href={`/blog/${lang}`}
            className="text-xs text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3] transition-colors"
          >
            ✕
          </Link>
        </div>
      )}
    </div>
  );
}
