'use client';

import { useState } from 'react';
import { FolderKanban, LayoutDashboard, CheckSquare, Users } from 'lucide-react';
import SidebarLayout from '@/components/SidebarLayout';
import WorkProjectsTab from '@/components/work/WorkProjectsTab';
import WorkKanbanTab from '@/components/work/WorkKanbanTab';
import WorkMyTasksTab from '@/components/work/WorkMyTasksTab';
import WorkTeamTab from '@/components/work/WorkTeamTab';

const TABS = {
  PROJECTS: 'projects',
  KANBAN:   'kanban',
  MY_TASKS: 'my-tasks',
  TEAM:     'team',
} as const;
type Tab = typeof TABS[keyof typeof TABS];

const NAV_ITEMS = [
  { id: TABS.PROJECTS, icon: <FolderKanban size={16} />,   label: '프로젝트' },
  { id: TABS.KANBAN,   icon: <LayoutDashboard size={16} />, label: '칸반 보드' },
  { id: TABS.MY_TASKS, icon: <CheckSquare size={16} />,    label: '내 할일' },
  { id: TABS.TEAM,     icon: <Users size={16} />,           label: '팀 관리' },
];

export default function WorkPage() {
  const [activeTab, setActiveTab] = useState<Tab>(TABS.PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

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
    </SidebarLayout>
  );
}
