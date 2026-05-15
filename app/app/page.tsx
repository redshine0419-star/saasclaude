'use client';

import { useState } from 'react';
import {
  LayoutDashboard, Globe, FileText, Tag,
  Bot, BarChart3, Megaphone, CheckCircle2,
} from 'lucide-react';
import SidebarLayout from '@/components/SidebarLayout';
import OnboardingModal from '@/components/OnboardingModal';
import CommandPalette from '@/components/CommandPalette';
import DashboardModule from '@/components/DashboardModule';
import WebModule from '@/components/WebModule';
import LlmsTxtModule from '@/components/LlmsTxtModule';
import MarketingInsightModule from '@/components/MarketingInsightModule';
import UnifiedContentModule from '@/components/UnifiedContentModule';
import KeywordModule from '@/components/KeywordModule';
import SovModule from '@/components/SovModule';

const TABS = {
  DASHBOARD: 'dashboard',
  WEB:       'web',
  INSIGHT:   'insight',
  LLMSTXT:   'llmstxt',
  CONTENT:   'content',
  KEYWORD:   'keyword',
  SOV:       'sov',
} as const;
type Tab = typeof TABS[keyof typeof TABS];

const NAV_ITEMS = [
  { id: TABS.DASHBOARD, icon: <LayoutDashboard size={16} />, label: '대시보드' },
  { id: TABS.WEB,       icon: <Globe size={16} />,           label: '웹 진단 & 분석',          sectionLabel: '웹' },
  { id: TABS.INSIGHT,   icon: <BarChart3 size={16} />,       label: '통합 마케팅 인사이트' },
  { id: TABS.LLMSTXT,   icon: <Bot size={16} />,             label: 'llms.txt' },
  { id: TABS.CONTENT,   icon: <FileText size={16} />,        label: '콘텐츠 생성 & 리라이터',   sectionLabel: '콘텐츠' },
  { id: TABS.KEYWORD,   icon: <Tag size={16} />,             label: '키워드 분석' },
  { id: TABS.SOV,       icon: <Megaphone size={16} />,       label: 'AI Share of Voice' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>(TABS.DASHBOARD);
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
        {activeTab === TABS.DASHBOARD && <DashboardModule />}
        {activeTab === TABS.WEB       && <WebModule onToast={showToast} />}
        {activeTab === TABS.INSIGHT   && <MarketingInsightModule onToast={showToast} />}
        {activeTab === TABS.LLMSTXT   && <LlmsTxtModule onToast={showToast} />}
        {activeTab === TABS.CONTENT   && <UnifiedContentModule onToast={showToast} />}
        {activeTab === TABS.KEYWORD   && <KeywordModule onToast={showToast} />}
        {activeTab === TABS.SOV       && <SovModule onToast={showToast} />}
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
