'use client';

import { useState } from 'react';
import {
  LayoutDashboard, Search, FileText, Tag, ArrowLeftRight,
  PenLine, Bot, BarChart3, Megaphone, Rss, CheckCircle2,
} from 'lucide-react';
import SidebarLayout from '@/components/SidebarLayout';
import OnboardingModal from '@/components/OnboardingModal';
import CommandPalette from '@/components/CommandPalette';
import DiagnosisModule from '@/components/DiagnosisModule';
import ContentHubModule from '@/components/ContentHubModule';
import DashboardModule from '@/components/DashboardModule';
import KeywordModule from '@/components/KeywordModule';
import CompetitorModule from '@/components/CompetitorModule';
import RewriterModule from '@/components/RewriterModule';
import LlmsTxtModule from '@/components/LlmsTxtModule';
import MarketingInsightModule from '@/components/MarketingInsightModule';
import SovModule from '@/components/SovModule';
import BlogAdminModule from '@/components/BlogAdminModule';

const TABS = {
  DIAGNOSIS:  'diagnosis',
  COMPETITOR: 'competitor',
  CONTENT:    'content',
  REWRITER:   'rewriter',
  KEYWORD:    'keyword',
  LLMSTXT:    'llmstxt',
  INSIGHT:    'insight',
  SOV:        'sov',
  BLOG:       'blog',
  DASHBOARD:  'dashboard',
} as const;
type Tab = typeof TABS[keyof typeof TABS];

const NAV_ITEMS = [
  { id: TABS.DIAGNOSIS,  icon: <Search size={16} />,         label: 'Engine Diagnosis' },
  { id: TABS.COMPETITOR, icon: <ArrowLeftRight size={16} />, label: 'Competitor Analysis' },
  { id: TABS.CONTENT,    icon: <FileText size={16} />,        label: 'Content Orchestrator' },
  { id: TABS.REWRITER,   icon: <PenLine size={16} />,         label: 'Content Rewriter' },
  { id: TABS.KEYWORD,    icon: <Tag size={16} />,             label: 'Keyword Analysis' },
  { id: TABS.LLMSTXT,    icon: <Bot size={16} />,             label: 'llms.txt' },
  { id: TABS.INSIGHT,    icon: <BarChart3 size={16} />,       label: '마케팅 인사이트' },
  { id: TABS.SOV,        icon: <Megaphone size={16} />,       label: 'AI Share of Voice' },
  { id: TABS.BLOG,       icon: <Rss size={16} />,             label: 'Blog 관리', adminOnly: true },
  { id: TABS.DASHBOARD,  icon: <LayoutDashboard size={16} />, label: 'Ops Dashboard' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>(TABS.DIAGNOSIS);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <>
      <OnboardingModal />
      <CommandPalette onNavigate={(tab) => setActiveTab(tab as Tab)} />

      <SidebarLayout
        navItems={NAV_ITEMS}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as Tab)}
        product="marketing"
      >
        {activeTab === TABS.DIAGNOSIS  && <DiagnosisModule onToast={showToast} />}
        {activeTab === TABS.COMPETITOR && <CompetitorModule onToast={showToast} />}
        {activeTab === TABS.CONTENT    && <ContentHubModule onToast={showToast} />}
        {activeTab === TABS.REWRITER   && <RewriterModule onToast={showToast} />}
        {activeTab === TABS.KEYWORD    && <KeywordModule onToast={showToast} />}
        {activeTab === TABS.LLMSTXT    && <LlmsTxtModule onToast={showToast} />}
        {activeTab === TABS.INSIGHT    && <MarketingInsightModule onToast={showToast} />}
        {activeTab === TABS.SOV        && <SovModule onToast={showToast} />}
        {activeTab === TABS.BLOG       && <BlogAdminModule onToast={showToast} />}
        {activeTab === TABS.DASHBOARD  && <DashboardModule />}
      </SidebarLayout>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-black text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 border border-[#333]">
            <CheckCircle2 size={16} className="shrink-0" />
            <span className="text-sm font-medium">{toast}</span>
          </div>
        </div>
      )}
    </>
  );
}
