'use client';

import { useState } from 'react';
import { FolderKanban, LayoutDashboard, CheckSquare, Users, Rss } from 'lucide-react';
import SidebarLayout from '@/components/SidebarLayout';
import WorkProjectsTab from '@/components/work/WorkProjectsTab';
import WorkKanbanTab from '@/components/work/WorkKanbanTab';
import WorkMyTasksTab from '@/components/work/WorkMyTasksTab';
import WorkTeamTab from '@/components/work/WorkTeamTab';
import BlogAdminModule from '@/components/BlogAdminModule';

const TABS = {
  PROJECTS: 'projects',
  KANBAN:   'kanban',
  MY_TASKS: 'my-tasks',
  TEAM:     'team',
  BLOG:     'blog',
} as const;
type Tab = typeof TABS[keyof typeof TABS];

const NAV_ITEMS = [
  { id: TABS.PROJECTS, icon: <FolderKanban size={16} />,   label: '프로젝트' },
  { id: TABS.KANBAN,   icon: <LayoutDashboard size={16} />, label: '칸반 보드' },
  { id: TABS.MY_TASKS, icon: <CheckSquare size={16} />,    label: '내 할일' },
  { id: TABS.TEAM,     icon: <Users size={16} />,           label: '팀 관리' },
  { id: TABS.BLOG,     icon: <Rss size={16} />,             label: '블로그 관리', adminOnly: true },
];

export default function WorkPage() {
  const [activeTab, setActiveTab] = useState<Tab>(TABS.PROJECTS);
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
    <SidebarLayout
      navItems={NAV_ITEMS}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as Tab)}
      product="work"
    >
      {activeTab === TABS.PROJECTS && (
        <WorkProjectsTab onSelectProject={handleSelectProject} />
      )}
      {activeTab === TABS.KANBAN && (
        <WorkKanbanTab
          projectId={selectedProjectId}
          onChangeProject={setSelectedProjectId}
        />
      )}
      {activeTab === TABS.MY_TASKS && <WorkMyTasksTab />}
      {activeTab === TABS.TEAM && <WorkTeamTab />}
      {activeTab === TABS.BLOG && <BlogAdminModule onToast={showToast} />}

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-black text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 border border-[#333]">
            <span className="text-sm font-medium">{toast}</span>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
