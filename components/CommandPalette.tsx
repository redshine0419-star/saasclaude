'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Search, LayoutDashboard, FileText, Zap, Tag, ArrowLeftRight,
  PenLine, Bot, BarChart3, Megaphone, Command,
} from 'lucide-react';

const COMMANDS = [
  { id: 'diagnosis',  label: 'Engine Diagnosis',     desc: 'SEO·GEO·성능 종합 진단', icon: <Search size={18} /> },
  { id: 'competitor', label: 'Competitor Analysis',  desc: '경쟁사 URL 비교 분석',   icon: <ArrowLeftRight size={18} /> },
  { id: 'content',    label: 'Content Orchestrator', desc: '블로그·SNS 콘텐츠 생성', icon: <FileText size={18} /> },
  { id: 'rewriter',   label: 'Content Rewriter',     desc: 'SEO/GEO 목표별 리라이팅', icon: <PenLine size={18} /> },
  { id: 'keyword',    label: 'Keyword Analysis',     desc: '키워드 의도·경쟁도 분석', icon: <Tag size={18} /> },
  { id: 'llmstxt',    label: 'llms.txt 생성기',       desc: 'AI 크롤러 최적화 파일 생성', icon: <Bot size={18} /> },
  { id: 'ga4',        label: 'GA4 Analytics',        desc: 'Google Analytics 데이터 분석', icon: <BarChart3 size={18} /> },
  { id: 'sov',        label: 'AI Share of Voice',    desc: 'AI 모델 내 브랜드 언급율 측정', icon: <Megaphone size={18} /> },
  { id: 'dashboard',  label: 'Ops Dashboard',        desc: '진단 이력·점수 추이 대시보드', icon: <LayoutDashboard size={18} /> },
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
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <Zap size={20} className="text-indigo-500 shrink-0" fill="currentColor" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="탭 이동 또는 기능 검색..."
            className="flex-1 bg-transparent text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none"
          />
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] text-slate-500 font-mono">
            <Command size={10} />K
          </kbd>
        </div>

        {/* Results */}
        <ul className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-slate-400">일치하는 항목 없음</li>
          )}
          {filtered.map((cmd, i) => (
            <li key={cmd.id}>
              <button
                onMouseEnter={() => setCursor(i)}
                onClick={() => select(cmd.id)}
                className={`w-full flex items-center gap-4 px-5 py-3 text-left transition-colors ${
                  cursor === i
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className={`shrink-0 ${cursor === i ? 'text-indigo-500' : 'text-slate-400'}`}>{cmd.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{cmd.label}</p>
                  <p className="text-[11px] text-slate-400 truncate">{cmd.desc}</p>
                </div>
                {cursor === i && (
                  <kbd className="ml-auto shrink-0 px-2 py-1 bg-indigo-100 dark:bg-indigo-800 rounded text-[10px] text-indigo-600 dark:text-indigo-300 font-mono">
                    Enter
                  </kbd>
                )}
              </button>
            </li>
          ))}
        </ul>

        <div className="px-5 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><kbd className="font-mono">↑↓</kbd> 이동</span>
          <span className="flex items-center gap-1"><kbd className="font-mono">Enter</kbd> 선택</span>
          <span className="flex items-center gap-1"><kbd className="font-mono">Esc</kbd> 닫기</span>
        </div>
      </div>
    </div>
  );
}
