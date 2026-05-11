'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Search, LayoutDashboard, FileText, Zap, Tag, ArrowLeftRight,
  PenLine, Bot, BarChart3, Megaphone, Command,
} from 'lucide-react';

const COMMANDS = [
  { id: 'diagnosis',  label: 'Engine Diagnosis',     desc: 'SEO·GEO·성능 종합 진단', icon: <Search size={16} /> },
  { id: 'competitor', label: 'Competitor Analysis',  desc: '경쟁사 URL 비교 분석',   icon: <ArrowLeftRight size={16} /> },
  { id: 'content',    label: 'Content Orchestrator', desc: '블로그·SNS 콘텐츠 생성', icon: <FileText size={16} /> },
  { id: 'rewriter',   label: 'Content Rewriter',     desc: 'SEO/GEO 목표별 리라이팅', icon: <PenLine size={16} /> },
  { id: 'keyword',    label: 'Keyword Analysis',     desc: '키워드 의도·경쟁도 분석', icon: <Tag size={16} /> },
  { id: 'llmstxt',    label: 'llms.txt 생성기',       desc: 'AI 크롤러 최적화 파일 생성', icon: <Bot size={16} /> },
  { id: 'ga4',        label: 'GA4 Analytics',        desc: 'Google Analytics 데이터 분석', icon: <BarChart3 size={16} /> },
  { id: 'sov',        label: 'AI Share of Voice',    desc: 'AI 모델 내 브랜드 언급율 측정', icon: <Megaphone size={16} /> },
  { id: 'dashboard',  label: 'Ops Dashboard',        desc: '진단 이력·점수 추이 대시보드', icon: <LayoutDashboard size={16} /> },
];

interface Props {
  onNavigate: (tab: string) => void;
}

export default function CommandPalette({ onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = COMMANDS.filter((c) =>
    !query || c.label.toLowerCase().includes(query.toLowerCase()) || c.desc.includes(query)
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
        setQuery('');
        setCursor(0);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => { setCursor(0); }, [query]);

  const select = (id: string) => {
    onNavigate(id);
    setOpen(false);
    setQuery('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    if (e.key === 'Enter' && filtered[cursor]) select(filtered[cursor].id);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] bg-black/60"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#161b22] rounded-lg shadow-2xl border border-[#eaeef2] dark:border-[#30363d] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#eaeef2] dark:border-[#30363d]">
          <Search size={16} className="text-[#57606a] dark:text-[#8b949e] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="탭 이동 또는 기능 검색..."
            className="flex-1 bg-transparent text-sm text-[#24292f] dark:text-[#e6edf3] placeholder:text-[#57606a] dark:placeholder:text-[#8b949e] outline-none"
          />
          <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 bg-[#f6f8fa] dark:bg-[#21262d] border border-[#eaeef2] dark:border-[#30363d] rounded text-[10px] text-[#57606a] dark:text-[#8b949e] font-mono">
            <Command size={9} />K
          </kbd>
        </div>

        {/* Results */}
        <ul className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-[#57606a] dark:text-[#8b949e]">일치하는 항목 없음</li>
          )}
          {filtered.map((cmd, i) => (
            <li key={cmd.id}>
              <button
                onMouseEnter={() => setCursor(i)}
                onClick={() => select(cmd.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  cursor === i
                    ? 'bg-[#0969da] text-white'
                    : 'text-[#24292f] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'
                }`}
              >
                <span className={`shrink-0 ${cursor === i ? 'text-white' : 'text-[#57606a] dark:text-[#8b949e]'}`}>{cmd.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{cmd.label}</p>
                  <p className={`text-[11px] truncate ${cursor === i ? 'text-blue-100' : 'text-[#57606a] dark:text-[#8b949e]'}`}>{cmd.desc}</p>
                </div>
                {cursor === i && (
                  <kbd className="ml-auto shrink-0 px-1.5 py-0.5 bg-white/20 rounded text-[10px] text-white font-mono">
                    Enter
                  </kbd>
                )}
              </button>
            </li>
          ))}
        </ul>

        {/* Footer hints */}
        <div className="px-4 py-2 border-t border-[#eaeef2] dark:border-[#30363d] flex items-center gap-4 text-[10px] text-[#57606a] dark:text-[#8b949e]">
          <span className="flex items-center gap-1 font-mono"><kbd>↑↓</kbd> 이동</span>
          <span className="flex items-center gap-1 font-mono"><kbd>Enter</kbd> 선택</span>
          <span className="flex items-center gap-1 font-mono"><kbd>Esc</kbd> 닫기</span>
        </div>
      </div>
    </div>
  );
}
