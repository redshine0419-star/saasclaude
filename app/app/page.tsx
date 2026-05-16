'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  LayoutDashboard, Globe, FileText, Tag,
  Bot, BarChart3, Megaphone, CheckCircle2,
  FolderKanban, LayoutGrid, CheckSquare, Users, Rss, Code2,
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
import WorkProjectsTab from '@/components/work/WorkProjectsTab';
import WorkKanbanTab from '@/components/work/WorkKanbanTab';
import WorkMyTasksTab from '@/components/work/WorkMyTasksTab';
import WorkTeamTab from '@/components/work/WorkTeamTab';
import BlogAdminModule from '@/components/BlogAdminModule';
import SiteEditorModule from '@/components/SiteEditorModule';

const TABS = {
  DASHBOARD: 'dashboard',
  WEB:       'web',
  INSIGHT:   'insight',
  LLMSTXT:   'llmstxt',
  CONTENT:   'content',
  KEYWORD:   'keyword',
  SOV:       'sov',
  PROJECTS:  'projects',
  KANBAN:    'kanban',
  MY_TASKS:  'my-tasks',
  TEAM:      'team',
  BLOG:      'blog',
  EDITOR:    'editor',
} as const;
type Tab = typeof TABS[keyof typeof TABS];

const NAV_ITEMS = [
  { id: TABS.DASHBOARD, icon: <LayoutDashboard size={16} />, label: '대시보드' },
  { id: TABS.WEB,       icon: <Globe size={16} />,           label: '웹 진단 & 분석',        sectionLabel: '웹' },
  { id: TABS.INSIGHT,   icon: <BarChart3 size={16} />,       label: '통합 마케팅 인사이트' },
  { id: TABS.LLMSTXT,   icon: <Bot size={16} />,             label: 'llms.txt' },
  { id: TABS.CONTENT,   icon: <FileText size={16} />,        label: '콘텐츠 생성',           sectionLabel: '콘텐츠' },
  { id: TABS.KEYWORD,   icon: <Tag size={16} />,             label: '키워드 분석' },
  { id: TABS.SOV,       icon: <Megaphone size={16} />,       label: 'AI Share of Voice' },
  { id: TABS.PROJECTS,  icon: <FolderKanban size={16} />,    label: '프로젝트',              sectionLabel: '업무' },
  { id: TABS.KANBAN,    icon: <LayoutGrid size={16} />,      label: '칸반 보드' },
  { id: TABS.MY_TASKS,  icon: <CheckSquare size={16} />,     label: '내 할일' },
  { id: TABS.TEAM,      icon: <Users size={16} />,           label: '팀 관리' },
  { id: TABS.BLOG,      icon: <Rss size={16} />,             label: '블로그 관리', adminOnly: true },
  { id: TABS.EDITOR,    icon: <Code2 size={16} />,           label: '사이트 편집기', adminOnly: true },
];

export default function App() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab | null) ?? TABS.DASHBOARD;
  const [activeTab, setActiveTab] = useState<Tab>(
    Object.values(TABS).includes(initialTab as Tab) ? initialTab : TABS.DASHBOARD
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveTab(TABS.KANBAN);
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
        hideProductSwitcher
      >
        {activeTab === TABS.DASHBOARD && <DashboardModule />}
        {activeTab === TABS.WEB       && <WebModule onToast={showToast} />}
        {activeTab === TABS.INSIGHT   && <MarketingInsightModule onToast={showToast} />}
        {activeTab === TABS.LLMSTXT   && <LlmsTxtModule onToast={showToast} />}
        {activeTab === TABS.CONTENT   && <UnifiedContentModule onToast={showToast} />}
        {activeTab === TABS.KEYWORD   && <KeywordModule onToast={showToast} />}
        {activeTab === TABS.SOV       && <SovModule onToast={showToast} />}
        {activeTab === TABS.PROJECTS  && <WorkProjectsTab onSelectProject={handleSelectProject} />}
        {activeTab === TABS.KANBAN    && <WorkKanbanTab projectId={selectedProjectId} onChangeProject={setSelectedProjectId} />}
        {activeTab === TABS.MY_TASKS  && <WorkMyTasksTab />}
        {activeTab === TABS.TEAM      && <WorkTeamTab />}
        {activeTab === TABS.BLOG      && <BlogAdminModule onToast={showToast} />}
        {activeTab === TABS.EDITOR    && <SiteEditorModule />}
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
