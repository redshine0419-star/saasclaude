'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Filter,
  GanttChartSquare,
  LayoutDashboard,
  Menu,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Trello,
  User,
  X,
} from 'lucide-react';

type Status = 'To Do' | 'In Progress' | 'Done';
type Priority = 'Low' | 'Medium' | 'High';

type Issue = {
  id: number;
  title: string;
  status: Status;
  priority: Priority;
  assignee: string;
  dueDate: string;
};

const COLUMNS: Status[] = ['To Do', 'In Progress', 'Done'];

const INITIAL_ISSUES: Issue[] = [
  { id: 1, title: '로그인 API 개발', status: 'To Do', priority: 'High', assignee: '김철수', dueDate: '2026-05-20' },
  { id: 2, title: '메인 대시보드 UI 디자인', status: 'In Progress', priority: 'Medium', assignee: '이영희', dueDate: '2026-05-22' },
  { id: 3, title: '데이터베이스 스키마 설계', status: 'Done', priority: 'High', assignee: '박지민', dueDate: '2026-05-15' },
  { id: 4, title: '사용자 권한 시스템 구축', status: 'To Do', priority: 'Low', assignee: '최승우', dueDate: '2026-05-25' },
  { id: 5, title: '모바일 반응형 최적화', status: 'In Progress', priority: 'Medium', assignee: '정다은', dueDate: '2026-05-23' },
];

type View = 'dashboard' | 'board' | 'timeline' | 'docs' | 'settings';

export default function App() {
  const [activeView, setActiveView] = useState<View>('board');
  const [issues, setIssues] = useState<Issue[]>(INITIAL_ISSUES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [newTask, setNewTask] = useState<Omit<Issue, 'id' | 'dueDate'>>({
    title: '',
    status: 'To Do',
    priority: 'Medium',
    assignee: '나',
  });

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const kpi = useMemo(() => ({
    todo: issues.filter((i) => i.status !== 'Done').length,
    urgent: issues.filter((i) => i.priority === 'High' && i.status !== 'Done').length,
  }), [issues]);

  const handleAddIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    const task: Issue = {
      ...newTask,
      id: Date.now(),
      dueDate: new Date().toISOString().split('T')[0],
    };
    setIssues((prev) => [...prev, task]);
    setNewTask({ title: '', status: 'To Do', priority: 'Medium', assignee: '나' });
    setIsModalOpen(false);
  };

  const moveIssue = (id: number, newStatus: Status) => {
    setIssues((prev) => prev.map((issue) => (issue.id === id ? { ...issue, status: newStatus } : issue)));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      <Sidebar
        activeView={activeView}
        isSidebarOpen={isSidebarOpen}
        setActiveView={setActiveView}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <Header setIsSidebarOpen={setIsSidebarOpen} setIsModalOpen={setIsModalOpen} />

      <main className="pt-20 lg:pt-24 p-4 lg:p-8 min-h-screen transition-all duration-300 lg:ml-64">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-[11px] lg:text-sm text-slate-400 mb-4 lg:mb-6 overflow-hidden">
            <span className="truncate">프로젝트</span>
            <ChevronRight size={14} className="flex-shrink-0" />
            <span className="text-indigo-600 font-medium truncate">
              {activeView === 'dashboard' ? '대시보드' : activeView === 'board' ? '칸반 보드' : activeView === 'timeline' ? '타임라인' : '준비 중'}
            </span>
          </div>

          {activeView === 'dashboard' && <DashboardView issues={issues} todo={kpi.todo} urgent={kpi.urgent} />}
          {activeView === 'board' && <BoardView issues={issues} moveIssue={moveIssue} setIsModalOpen={setIsModalOpen} setNewTask={setNewTask} newTask={newTask} />}
          {activeView === 'timeline' && <TimelineView issues={issues} />}

          {(activeView === 'docs' || activeView === 'settings') && (
            <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400 px-4 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Clock size={32} /></div>
              <p className="text-base lg:text-lg font-medium">준비 중인 기능입니다.</p>
              <button onClick={() => setActiveView('board')} className="mt-4 text-indigo-600 font-bold">보드로 돌아가기</button>
            </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl lg:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 lg:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg lg:text-xl font-bold">신규 이슈 생성</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddIssue} className="p-5 lg:p-6 space-y-4">
              <input autoFocus type="text" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="무엇을 해야 하나요?" />
              <div className="grid grid-cols-2 gap-4">
                <select value={newTask.status} onChange={(e) => setNewTask({ ...newTask, status: e.target.value as Status })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white">
                  {COLUMNS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Priority })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white">
                  <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl">취소</button>
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl">생성하기</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Sidebar({ activeView, isSidebarOpen, setActiveView, setIsSidebarOpen }: {
  activeView: View; isSidebarOpen: boolean; setActiveView: (view: View) => void; setIsSidebarOpen: (open: boolean) => void;
}) {
  const nav: { id: View; icon: React.ReactNode; label: string }[] = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: '대시보드' },
    { id: 'board', icon: <Trello size={20} />, label: '보드 (칸반)' },
    { id: 'timeline', icon: <GanttChartSquare size={20} />, label: '타임라인' },
    { id: 'docs', icon: <FileText size={20} />, label: '문서함' },
    { id: 'settings', icon: <Settings size={20} />, label: '설정' },
  ];

  return <>
    {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
    <div className={`fixed left-0 top-0 h-screen bg-slate-900 text-white flex flex-col z-50 transition-transform duration-300 w-64 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="p-6 text-xl font-bold flex items-center justify-between border-b border-slate-800"><span>Project Flow</span><button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400"><X size={20} /></button></div>
      <nav className="flex-1 p-4 space-y-1">{nav.map((n) => <button key={n.id} onClick={() => { setActiveView(n.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${activeView === n.id ? 'bg-indigo-600' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>{n.icon}<span>{n.label}</span></button>)}</nav>
    </div>
  </>;
}

function Header({ setIsSidebarOpen, setIsModalOpen }: { setIsSidebarOpen: (open: boolean) => void; setIsModalOpen: (open: boolean) => void; }) {
  return <header className="h-16 bg-white border-b border-slate-200 fixed top-0 right-0 left-0 lg:left-64 z-30 flex items-center justify-between px-4 lg:px-8">
    <div className="flex items-center gap-3"><button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg lg:hidden text-slate-600"><Menu size={20} /></button><h2 className="text-base lg:text-xl font-bold text-slate-800">협업 프로젝트 관리</h2></div>
    <div className="flex items-center gap-2 lg:gap-6"><Search className="hidden xl:block text-slate-400" size={18} /><Bell className="text-slate-400" size={24} /><button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-3 py-2 rounded-lg flex items-center gap-2"><Plus size={18} />신규 이슈</button></div>
  </header>;
}

function DashboardView({ issues, todo, urgent }: { issues: Issue[]; todo: number; urgent: number; }) {
  return <div className="space-y-6"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
    <StatCard title="진행률" value="65%" icon={<CheckCircle2 className="text-emerald-500" />} />
    <StatCard title="미완료 이슈" value={todo} icon={<Clock className="text-indigo-500" />} />
    <StatCard title="긴급" value={String(urgent)} icon={<AlertCircle className="text-red-500" />} />
    <StatCard title="참여 팀원" value="3" icon={<User className="text-slate-500" />} />
  </div>
  <div className="bg-white p-5 rounded-2xl border border-slate-200"><h3 className="font-bold mb-4">나의 할 일</h3>{issues.slice(0, 5).map((issue) => <div key={issue.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl mb-2"><span className="text-sm font-medium">{issue.title}</span><span className="text-xs">{issue.priority}</span></div>)}</div></div>;
}

function BoardView({ issues, moveIssue, setIsModalOpen, setNewTask, newTask }: { issues: Issue[]; moveIssue: (id: number, s: Status) => void; setIsModalOpen: (open: boolean) => void; setNewTask: (task: Omit<Issue, 'id' | 'dueDate'>) => void; newTask: Omit<Issue, 'id' | 'dueDate'>; }) {
  return <div className="flex gap-4 overflow-x-auto pb-4 h-full snap-x">{COLUMNS.map((col) => <div key={col} className="min-w-[300px] bg-slate-100 rounded-2xl p-4"><div className="flex items-center justify-between mb-4"><h3 className="font-bold">{col} <span className="text-xs">{issues.filter((i) => i.status === col).length}</span></h3><MoreVertical size={16} className="text-slate-400" /></div>{issues.filter((i) => i.status === col).map((issue) => <div key={issue.id} className="bg-white p-4 rounded-xl mb-3 border"><h4 className="text-sm font-semibold mb-2">{issue.title}</h4><div className="flex gap-1">{COLUMNS.filter((c) => c !== col).map((c) => <button key={c} onClick={() => moveIssue(issue.id, c)} className="text-xs bg-indigo-50 px-2 py-1 rounded">{c}</button>)}</div><div className="flex items-center justify-between mt-3 text-xs text-slate-500"><span className="flex items-center gap-1"><Calendar size={12} />{issue.dueDate}</span><span>{issue.assignee}</span></div></div>)}<button onClick={() => { setNewTask({ ...newTask, status: col }); setIsModalOpen(true); }} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 text-sm">+ 추가하기</button></div>)}</div>;
}

function TimelineView({ issues }: { issues: Issue[] }) {
  return <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden"><div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50"><div className="flex items-center gap-2 text-sm text-slate-600"><Filter size={16} />필터</div><div className="text-sm font-medium text-slate-600">2026년 5월</div></div><table className="w-full text-left min-w-[700px]"><thead><tr className="text-xs"><th className="px-4 py-3">이슈명</th><th className="px-4 py-3">담당자</th><th className="px-4 py-3">상태</th></tr></thead><tbody>{issues.map((issue) => <tr key={issue.id} className="border-t"><td className="px-4 py-3">{issue.title}</td><td className="px-4 py-3">{issue.assignee}</td><td className="px-4 py-3">{issue.status}</td></tr>)}</tbody></table></div>;
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return <div className="bg-white p-5 rounded-2xl border border-slate-200"><div className="flex items-center justify-between mb-3"><span className="text-sm text-slate-500">{title}</span><div className="p-2 bg-slate-50 rounded-lg">{icon}</div></div><div className="text-2xl font-bold text-slate-800">{value}</div></div>;
}
