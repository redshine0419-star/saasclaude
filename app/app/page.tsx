'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Search, FileText, Zap, Bell, User, CheckCircle2,
  Tag, ArrowLeftRight, PenLine, Bot, BarChart3, Megaphone, Sun, Moon, Command, Rss,
} from 'lucide-react';
import { useDarkMode } from '@/components/DarkModeProvider';
import OnboardingModal from '@/components/OnboardingModal';
import CommandPalette from '@/components/CommandPalette';
import DiagnosisModule from '@/components/DiagnosisModule';
import ContentHubModule from '@/components/ContentHubModule';
import DashboardModule from '@/components/DashboardModule';
import KeywordModule from '@/components/KeywordModule';
import CompetitorModule from '@/components/CompetitorModule';
import RewriterModule from '@/components/RewriterModule';
import LlmsTxtModule from '@/components/LlmsTxtModule';
import GA4Module from '@/components/GA4Module';
import SovModule from '@/components/SovModule';
import BlogAdminModule from '@/components/BlogAdminModule';

const TABS = {
  DIAGNOSIS: 'diagnosis',
  COMPETITOR: 'competitor',
  CONTENT: 'content',
  REWRITER: 'rewriter',
  KEYWORD: 'keyword',
  LLMSTXT: 'llmstxt',
  GA4: 'ga4',
  SOV: 'sov',
  BLOG: 'blog',
  DASHBOARD: 'dashboard',
} as const;
type Tab = typeof TABS[keyof typeof TABS];

const TAB_ORDER = Object.values(TABS) as Tab[];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>(TABS.DIAGNOSIS);
  const [toast, setToast] = useState<string | null>(null);
  const { dark, toggle } = useDarkMode();
  const touchStartX = useRef(0);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < 60) return;
    const idx = TAB_ORDER.indexOf(activeTab);
    if (dx < 0 && idx < TAB_ORDER.length - 1) setActiveTab(TAB_ORDER[idx + 1]);
    if (dx > 0 && idx > 0) setActiveTab(TAB_ORDER[idx - 1]);
  };

  const menuItems = [
    { id: TABS.DIAGNOSIS, icon: <Search size={16} />, label: 'Engine Diagnosis', mobileLabel: '진단' },
    { id: TABS.COMPETITOR, icon: <ArrowLeftRight size={16} />, label: 'Competitor Analysis', mobileLabel: '경쟁사' },
    { id: TABS.CONTENT, icon: <FileText size={16} />, label: 'Content Orchestrator', mobileLabel: '콘텐츠' },
    { id: TABS.REWRITER, icon: <PenLine size={16} />, label: 'Content Rewriter', mobileLabel: '리라이터' },
    { id: TABS.KEYWORD, icon: <Tag size={16} />, label: 'Keyword Analysis', mobileLabel: '키워드' },
    { id: TABS.LLMSTXT, icon: <Bot size={16} />, label: 'llms.txt', mobileLabel: 'LLMs' },
    { id: TABS.GA4, icon: <BarChart3 size={16} />, label: 'GA4 Analytics', mobileLabel: 'GA4' },
    { id: TABS.SOV, icon: <Megaphone size={16} />, label: 'AI Share of Voice', mobileLabel: 'SOV' },
    { id: TABS.BLOG, icon: <Rss size={16} />, label: 'Blog 관리', mobileLabel: '블로그' },
    { id: TABS.DASHBOARD, icon: <LayoutDashboard size={16} />, label: 'Ops Dashboard', mobileLabel: '대시보드' },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#f6f8fa] dark:bg-[#0d1117] font-sans text-[#24292f] dark:text-[#e6edf3] overflow-hidden select-none">
      <OnboardingModal />
      <CommandPalette onNavigate={(tab) => setActiveTab(tab as Tab)} />

      {/* Top Header */}
      <header className="shrink-0 bg-[#000000] dark:bg-[#000000] border-b border-[#333333] z-20">
        {/* Brand bar */}
        <div className="flex items-center justify-between px-4 md:px-6 h-14">
          {/* Logo */}
          <div className="flex items-center gap-2 text-white font-black text-lg tracking-tight">
            <Zap size={20} fill="currentColor" strokeWidth={0} />
            <span className="font-bold">MarketerOps<span className="text-[#888888] font-normal">.ai</span></span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1">
            {/* Cmd+K */}
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#444444] text-[#888888] hover:text-white hover:border-[#666666] text-xs font-mono transition-colors"
            >
              <Command size={12} />
              <span>K</span>
            </button>

            {/* Dark mode */}
            <button
              onClick={toggle}
              className="p-2 text-[#888888] hover:text-white hover:bg-white/10 rounded-md transition-colors"
              title={dark ? 'Light mode' : 'Dark mode'}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notifications */}
            <button className="relative p-2 text-[#888888] hover:text-white hover:bg-white/10 rounded-md transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-white border border-[#000000] rounded-full" />
            </button>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-[#444444] border border-[#555555] flex items-center justify-center cursor-pointer hover:border-[#888888] transition-colors ml-1">
              <User size={16} className="text-[#cccccc]" strokeWidth={2} />
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex items-end overflow-x-auto scrollbar-hide px-4 md:px-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors shrink-0 ${
                activeTab === item.id
                  ? 'border-white text-white'
                  : 'border-transparent text-[#888888] hover:text-[#cccccc] hover:border-[#555555]'
              }`}
            >
              <span>{item.icon}</span>
              <span className="hidden md:inline">{item.label}</span>
              <span className="md:hidden">{item.mobileLabel}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main
        className="flex-1 overflow-y-auto scroll-smooth"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="p-4 md:p-8 pb-8">
          {activeTab === TABS.DIAGNOSIS && <DiagnosisModule onToast={showToast} />}
          {activeTab === TABS.COMPETITOR && <CompetitorModule onToast={showToast} />}
          {activeTab === TABS.CONTENT && <ContentHubModule onToast={showToast} />}
          {activeTab === TABS.REWRITER && <RewriterModule onToast={showToast} />}
          {activeTab === TABS.KEYWORD && <KeywordModule onToast={showToast} />}
          {activeTab === TABS.LLMSTXT && <LlmsTxtModule onToast={showToast} />}
          {activeTab === TABS.GA4 && <GA4Module onToast={showToast} />}
          {activeTab === TABS.SOV && <SovModule onToast={showToast} />}
          {activeTab === TABS.BLOG && <BlogAdminModule onToast={showToast} />}
          {activeTab === TABS.DASHBOARD && <DashboardModule />}
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-[#eaeef2] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] px-6 py-3 flex items-center gap-4">
        <Link href="/privacy" className="text-[11px] text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3] transition-colors">
          Privacy Policy
        </Link>
        <span className="text-[11px] text-[#57606a] dark:text-[#8b949e]">·</span>
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
          className="text-[11px] text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3] transition-colors flex items-center gap-1"
        >
          Command Palette
          <kbd className="ml-1 px-1 py-0.5 bg-white dark:bg-[#161b22] border border-[#eaeef2] dark:border-[#30363d] rounded text-[9px] font-mono">⌘K</kbd>
        </button>
      </footer>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-[#000000] text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 border border-[#333333]">
            <CheckCircle2 size={16} className="text-white shrink-0" />
            <span className="text-sm font-medium">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
