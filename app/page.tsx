'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Search, FileText, Zap, ChevronRight, Bell, User, CheckCircle2,
  Tag, ArrowLeftRight, PenLine, Bot, BarChart3, Megaphone, Sun, Moon,
} from 'lucide-react';
import { useDarkMode } from '@/components/DarkModeProvider';
import OnboardingModal from '@/components/OnboardingModal';
import DiagnosisModule from '@/components/DiagnosisModule';
import ContentHubModule from '@/components/ContentHubModule';
import DashboardModule from '@/components/DashboardModule';
import KeywordModule from '@/components/KeywordModule';
import CompetitorModule from '@/components/CompetitorModule';
import RewriterModule from '@/components/RewriterModule';
import LlmsTxtModule from '@/components/LlmsTxtModule';
import GA4Module from '@/components/GA4Module';
import SovModule from '@/components/SovModule';

const TABS = {
  DIAGNOSIS: 'diagnosis',
  COMPETITOR: 'competitor',
  CONTENT: 'content',
  REWRITER: 'rewriter',
  KEYWORD: 'keyword',
  LLMSTXT: 'llmstxt',
  GA4: 'ga4',
  SOV: 'sov',
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
    { id: TABS.DIAGNOSIS, icon: <Search size={20} />, label: 'Engine Diagnosis', mobileLabel: '진단' },
    { id: TABS.COMPETITOR, icon: <ArrowLeftRight size={20} />, label: 'Competitor Analysis', mobileLabel: '경쟁사' },
    { id: TABS.CONTENT, icon: <FileText size={20} />, label: 'Content Orchestrator', mobileLabel: '콘텐츠' },
    { id: TABS.REWRITER, icon: <PenLine size={20} />, label: 'Content Rewriter', mobileLabel: '리라이터' },
    { id: TABS.KEYWORD, icon: <Tag size={20} />, label: 'Keyword Analysis', mobileLabel: '키워드' },
    { id: TABS.LLMSTXT, icon: <Bot size={20} />, label: 'llms.txt 생성기', mobileLabel: 'LLMs' },
    { id: TABS.GA4, icon: <BarChart3 size={20} />, label: 'GA4 Analytics', mobileLabel: 'GA4' },
    { id: TABS.SOV, icon: <Megaphone size={20} />, label: 'AI Share of Voice', mobileLabel: 'SOV' },
    { id: TABS.DASHBOARD, icon: <LayoutDashboard size={20} />, label: 'Ops Dashboard', mobileLabel: '대시보드' },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden select-none">
      <OnboardingModal />

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex-col z-20">
        <div className="p-8 pb-4">
          <div className="flex items-center gap-2.5 text-indigo-600 font-black text-2xl tracking-tighter">
            <Zap size={32} fill="currentColor" strokeWidth={2.5} />
            <span>MarketerOps<span className="text-slate-400 dark:text-slate-500 font-light">.ai</span></span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-200 group ${
                activeTab === item.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 translate-x-1'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span className={activeTab === item.id ? 'text-white' : 'group-hover:text-indigo-500'}>{item.icon}</span>
              <span className="font-bold text-sm">{item.label}</span>
              {activeTab === item.id && <ChevronRight className="ml-auto opacity-50" size={16} />}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto shrink-0">
          <div className="p-5 bg-gradient-to-br from-slate-900 to-indigo-900 text-white rounded-2xl relative overflow-hidden mb-4">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[2px]">Enterprise Tier</span>
              </div>
              <p className="text-sm font-bold mb-1">Senior Marketer Mode</p>
              <p className="text-[10px] text-slate-300">10년차 이상의 직관을 AI가 보조합니다.</p>
            </div>
            <Zap className="absolute -right-4 -bottom-4 text-white/5 w-24 h-24 rotate-12" />
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            className="w-full flex items-center justify-center gap-2 py-2.5 mb-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
          >
            {dark ? <Sun size={14} /> : <Moon size={14} />}
            {dark ? '라이트 모드' : '다크 모드'}
          </button>

          <div className="text-center">
            <Link href="/privacy" className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 md:px-10 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="md:hidden p-2 bg-indigo-600 text-white rounded-xl">
              <Zap size={20} fill="currentColor" />
            </div>
            <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              {menuItems.find((m) => m.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={toggle}
              className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title={dark ? '라이트 모드' : '다크 모드'}
            >
              {dark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="relative p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
              <Bell size={22} />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full" />
            </button>
            <div className="h-10 w-10 md:h-11 md:w-11 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
              <User size={22} strokeWidth={2.5} />
            </div>
          </div>
        </header>

        {/* Content with swipe gesture */}
        <div
          className="flex-1 overflow-y-auto p-4 md:p-10 pb-24 md:pb-10 scroll-smooth"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {activeTab === TABS.DIAGNOSIS && <DiagnosisModule onToast={showToast} />}
          {activeTab === TABS.COMPETITOR && <CompetitorModule onToast={showToast} />}
          {activeTab === TABS.CONTENT && <ContentHubModule onToast={showToast} />}
          {activeTab === TABS.REWRITER && <RewriterModule onToast={showToast} />}
          {activeTab === TABS.KEYWORD && <KeywordModule onToast={showToast} />}
          {activeTab === TABS.LLMSTXT && <LlmsTxtModule onToast={showToast} />}
          {activeTab === TABS.GA4 && <GA4Module onToast={showToast} />}
          {activeTab === TABS.SOV && <SovModule onToast={showToast} />}
          {activeTab === TABS.DASHBOARD && <DashboardModule />}
        </div>

        {/* Bottom Nav (Mobile) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-700 flex items-center px-2 gap-1 overflow-x-auto z-30 scrollbar-hide">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={'flex flex-col items-center gap-1 transition-all duration-300 px-2 shrink-0 ' + (
                activeTab === item.id
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 dark:text-slate-500'
              )}
            >
              <div className={'p-1.5 rounded-xl transition-colors ' + (activeTab === item.id ? 'bg-indigo-50 dark:bg-indigo-900/30' : '')}>
                {item.icon}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">{item.mobileLabel}</span>
            </button>
          ))}
        </nav>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-slate-900 dark:bg-slate-800 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span className="text-sm font-bold tracking-tight">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
