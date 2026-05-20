'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  LayoutDashboard, Globe, FileText, Tag,
  Bot, BarChart3, Megaphone, CheckCircle2,
  FolderKanban, LayoutGrid, CheckSquare, Users, Rss, Code2, FileSearch, Swords, MailOpen,
} from 'lucide-react';
import SidebarLayout from '@/components/SidebarLayout';
import OnboardingModal from '@/components/OnboardingModal';
import CommandPalette from '@/components/CommandPalette';
import { useAppLang } from '@/components/AppLangContext';
import { t } from '@/lib/app-i18n';
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
import BulkGeoModule from '@/components/BulkGeoModule';
import AiSearchQualityModule from '@/components/AiSearchQualityModule';
import CompetitorGapModule from '@/components/CompetitorGapModule';
import NewsletterStatsModule from '@/components/NewsletterStatsModule';

const TABS = {
  DASHBOARD: 'dashboard',
  WEB:       'web',
  BULK_GEO:  'bulk-geo',
  AI_SEARCH: 'ai-search',
  COMP_GAP:  'comp-gap',
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
  NEWSLETTER_STATS: 'newsletter-stats',
} as const;
type Tab = typeof TABS[keyof typeof TABS];

function buildNavItems(lang: Parameters<typeof t>[2]) {
  return [
    { id: TABS.DASHBOARD, icon: <LayoutDashboard size={16} />, label: t('nav', 'dashboard', lang) },
    { id: TABS.WEB,       icon: <Globe size={16} />,           label: t('nav', 'web', lang),       sectionLabel: t('nav', 'sectionWeb', lang) },
    { id: TABS.BULK_GEO,  icon: <FileSearch size={16} />,      label: '일괄 GEO 진단' },
    { id: TABS.AI_SEARCH, icon: <Bot size={16} />,             label: 'AI 검색 품질' },
    { id: TABS.COMP_GAP,  icon: <Swords size={16} />,          label: '경쟁사 콘텐츠 갭' },
    { id: TABS.INSIGHT,   icon: <BarChart3 size={16} />,       label: t('nav', 'insight', lang),   restrictedToMembers: true },
    { id: TABS.LLMSTXT,   icon: <Bot size={16} />,             label: 'llms.txt' },
    { id: TABS.CONTENT,   icon: <FileText size={16} />,        label: t('nav', 'content', lang),   sectionLabel: t('nav', 'sectionContent', lang) },
    { id: TABS.KEYWORD,   icon: <Tag size={16} />,             label: t('nav', 'keyword', lang) },
    { id: TABS.SOV,       icon: <Megaphone size={16} />,       label: 'AI Share of Voice' },
    { id: TABS.PROJECTS,  icon: <FolderKanban size={16} />,    label: t('nav', 'projects', lang),  sectionLabel: t('nav', 'sectionWork', lang), restrictedToMembers: true },
    { id: TABS.KANBAN,    icon: <LayoutGrid size={16} />,      label: t('nav', 'kanban', lang),    restrictedToMembers: true },
    { id: TABS.MY_TASKS,  icon: <CheckSquare size={16} />,     label: t('nav', 'myTasks', lang),   restrictedToMembers: true },
    { id: TABS.TEAM,      icon: <Users size={16} />,           label: t('nav', 'team', lang),      restrictedToMembers: true },
    { id: TABS.BLOG,             icon: <Rss size={16} />,      label: t('nav', 'blog', lang),      adminOnly: true },
    { id: TABS.EDITOR,           icon: <Code2 size={16} />,    label: t('nav', 'editor', lang),    adminOnly: true },
    { id: TABS.NEWSLETTER_STATS, icon: <MailOpen size={16} />, label: '수집 이메일 확인',           adminOnly: true },
  ];
}

export default function App() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab | null) ?? TABS.DASHBOARD;
  const [activeTab, setActiveTab] = useState<Tab>(
    Object.values(TABS).includes(initialTab as Tab) ? initialTab : TABS.DASHBOARD
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const { lang } = useAppLang();
  const NAV_ITEMS = buildNavItems(lang);

  useEffect(() => {
    fetch('/api/auth/access')
      .then((r) => r.json())
      .then((d) => setIsMember(d.isAdmin || d.isInvited))
      .catch(() => {});
  }, []);

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
        isMember={isMember}
      >
        {activeTab === TABS.DASHBOARD && <DashboardModule />}
        {activeTab === TABS.WEB       && <WebModule onToast={showToast} />}
        {activeTab === TABS.BULK_GEO  && <BulkGeoModule onToast={showToast} />}
        {activeTab === TABS.AI_SEARCH && <AiSearchQualityModule onToast={showToast} />}
        {activeTab === TABS.COMP_GAP  && <CompetitorGapModule onToast={showToast} />}
        {activeTab === TABS.INSIGHT   && <MarketingInsightModule onToast={showToast} />}
        {activeTab === TABS.LLMSTXT   && <LlmsTxtModule onToast={showToast} />}
        {activeTab === TABS.CONTENT   && <UnifiedContentModule onToast={showToast} />}
        {activeTab === TABS.KEYWORD   && <KeywordModule onToast={showToast} />}
        {activeTab === TABS.SOV       && <SovModule onToast={showToast} />}
        {activeTab === TABS.PROJECTS  && <WorkProjectsTab onSelectProject={handleSelectProject} />}
        {activeTab === TABS.KANBAN    && <WorkKanbanTab projectId={selectedProjectId} onChangeProject={setSelectedProjectId} />}
        {activeTab === TABS.MY_TASKS  && <WorkMyTasksTab />}
        {activeTab === TABS.TEAM      && <WorkTeamTab />}
        {activeTab === TABS.BLOG             && <BlogAdminModule onToast={showToast} />}
        {activeTab === TABS.EDITOR           && <SiteEditorModule />}
        {activeTab === TABS.NEWSLETTER_STATS && <NewsletterStatsModule />}
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
