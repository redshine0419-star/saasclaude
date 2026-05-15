'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users, Sun, Moon, Bell, User, LogOut, Zap, Command,
} from 'lucide-react';
import { useDarkMode } from '@/components/DarkModeProvider';
import ProductSwitcher from '@/components/ProductSwitcher';
import WorkProjectsTab from '@/components/work/WorkProjectsTab';
import WorkKanbanTab from '@/components/work/WorkKanbanTab';
import WorkMyTasksTab from '@/components/work/WorkMyTasksTab';
import WorkTeamTab from '@/components/work/WorkTeamTab';

const TABS = {
  PROJECTS: 'projects',
  KANBAN: 'kanban',
  MY_TASKS: 'my-tasks',
  TEAM: 'team',
} as const;
type Tab = typeof TABS[keyof typeof TABS];

const TAB_ORDER = Object.values(TABS) as Tab[];

export default function WorkPage() {
  const [activeTab, setActiveTab] = useState<Tab>(TABS.PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { dark, toggle } = useDarkMode();
  const { data: session } = useSession();
  const touchStartX = useRef(0);

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
    { id: TABS.PROJECTS, icon: <FolderKanban size={16} />, label: '프로젝트', mobileLabel: '프로젝트' },
    { id: TABS.KANBAN, icon: <LayoutDashboard size={16} />, label: '칸반 보드', mobileLabel: '칸반' },
    { id: TABS.MY_TASKS, icon: <CheckSquare size={16} />, label: '내 할일', mobileLabel: '할일' },
    { id: TABS.TEAM, icon: <Users size={16} />, label: '팀 관리', mobileLabel: '팀' },
  ];

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveTab(TABS.KANBAN);
  };

  return (
    <div className="flex flex-col h-screen bg-[#f6f8fa] dark:bg-[#0d1117] font-sans text-[#24292f] dark:text-[#e6edf3] overflow-hidden select-none">
      {/* Top Header */}
      <header className="shrink-0 bg-[#000000] dark:bg-[#000000] border-b border-[#333333] z-20">
        {/* Brand bar */}
        <div className="flex items-center justify-between px-4 md:px-6 h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-white font-black text-lg tracking-tight hover:opacity-80 transition-opacity mr-3">
            <Zap size={20} fill="currentColor" strokeWidth={0} />
            <span className="hidden md:inline font-bold">MarketerOps<span className="text-[#888888] font-normal">.ai</span></span>
          </Link>
          <ProductSwitcher />

          {/* Right controls */}
          <div className="flex items-center gap-1">
            {/* Cmd+K hint */}
            <button
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#444444] text-[#888888] hover:text-white hover:border-[#666666] text-xs font-mono transition-colors"
              disabled
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
            </button>

            {/* User */}
            {session?.user && (
              <div className="flex items-center gap-2 ml-1">
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt="avatar" width={32} height={32} className="w-8 h-8 rounded-full border border-[#555555]" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#444444] border border-[#555555] flex items-center justify-center">
                    <User size={16} className="text-[#cccccc]" strokeWidth={2} />
                  </div>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: '/work' })}
                  className="p-2 text-[#888888] hover:text-white hover:bg-white/10 rounded-md transition-colors"
                  title="로그아웃"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
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
          {activeTab === TABS.PROJECTS && (
            <WorkProjectsTab onSelectProject={handleSelectProject} />
          )}
          {activeTab === TABS.KANBAN && (
            <WorkKanbanTab projectId={selectedProjectId} onChangeProject={setSelectedProjectId} />
          )}
          {activeTab === TABS.MY_TASKS && (
            <WorkMyTasksTab />
          )}
          {activeTab === TABS.TEAM && (
            <WorkTeamTab />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-[#eaeef2] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] px-6 py-3 flex items-center gap-4">
        <Link href="/privacy" className="text-[11px] text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3] transition-colors">
          Privacy Policy
        </Link>
      </footer>
    </div>
  );
}
