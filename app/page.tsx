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
type View = 'dashboard' | 'board' | 'timeline' | 'docs' | 'settings';

type Issue = {
  id: number;
  title: string;
  status: Status;
  priority: Priority;
  assignee: string;
  dueDate: string;
};

const STORAGE_KEY = 'project-flow-issues-v1';
const COLUMNS: Status[] = ['To Do', 'In Progress', 'Done'];
const TEAM_MEMBERS = ['나', '김철수', '이영희', '박지민'];

const INITIAL_ISSUES: Issue[] = [
  { id: 1, title: '로그인 API 개발', status: 'To Do', priority: 'High', assignee: '김철수', dueDate: '2026-05-20' },
  { id: 2, title: '메인 대시보드 UI 디자인', status: 'In Progress', priority: 'Medium', assignee: '이영희', dueDate: '2026-05-22' },
  { id: 3, title: '데이터베이스 스키마 설계', status: 'Done', priority: 'High', assignee: '박지민', dueDate: '2026-05-15' },
];

export default function App() {
  const [activeView, setActiveView] = useState<View>('board');
  const [issues, setIssues] = useState<Issue[]>(INITIAL_ISSUES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [myOnly, setMyOnly] = useState(false);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [newTask, setNewTask] = useState<Omit<Issue, 'id'>>({
    title: '', status: 'To Do', priority: 'Medium', assignee: '나', dueDate: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setIssues(JSON.parse(saved));
    } catch {
      setIssues(INITIAL_ISSUES);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
  }, [issues]);

  useEffect(() => {
    const onResize = () => window.innerWidth >= 1024 && setIsSidebarOpen(false);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const filteredIssues = useMemo(() => {
    let data = [...issues];
    if (myOnly) data = data.filter((i) => i.assignee === '나');
    if (urgentOnly) data = data.filter((i) => i.priority === 'High' && i.status !== 'Done');
    return data;
  }, [issues, myOnly, urgentOnly]);

  const kpi = useMemo(() => ({
    todo: issues.filter((i) => i.status !== 'Done').length,
    urgent: issues.filter((i) => i.priority === 'High' && i.status !== 'Done').length,
    mine: issues.filter((i) => i.assignee === '나' && i.status !== 'Done').length,
  }), [issues]);

  const handleAddIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    setIssues((prev) => [...prev, { ...newTask, id: Date.now() }]);
    setNewTask({ title: '', status: 'To Do', priority: 'Medium', assignee: '나', dueDate: new Date().toISOString().slice(0, 10) });
    setIsModalOpen(false);
  };

  const moveIssue = (id: number, newStatus: Status) => {
    setIssues((prev) => prev.map((issue) => (issue.id === id ? { ...issue, status: newStatus } : issue)));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      <Sidebar activeView={activeView} isSidebarOpen={isSidebarOpen} setActiveView={setActiveView} setIsSidebarOpen={setIsSidebarOpen} />
      <Header setIsSidebarOpen={setIsSidebarOpen} setIsModalOpen={setIsModalOpen} />

      <main className="pt-20 lg:pt-24 p-4 lg:p-8 min-h-screen transition-all duration-300 lg:ml-64">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>프로젝트</span><ChevronRight size={14} /><span className="text-indigo-600 font-medium">{activeView}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button onClick={() => setMyOnly((v) => !v)} className={`px-3 py-1 rounded-full border ${myOnly ? 'bg-indigo-600 text-white' : 'bg-white'}`}>내 할 일</button>
              <button onClick={() => setUrgentOnly((v) => !v)} className={`px-3 py-1 rounded-full border ${urgentOnly ? 'bg-rose-600 text-white' : 'bg-white'}`}>긴급만</button>
            </div>
          </div>

          {activeView === 'dashboard' && <DashboardView issues={filteredIssues} kpi={kpi} />}
          {activeView === 'board' && <BoardView issues={filteredIssues} moveIssue={moveIssue} setIsModalOpen={setIsModalOpen} />}
          {activeView === 'timeline' && <TimelineView issues={filteredIssues} />}
          {(activeView === 'docs' || activeView === 'settings') && <Placeholder setActiveView={setActiveView} />}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <form onSubmit={handleAddIssue} className="p-5 space-y-3">
              <div className="flex justify-between items-center"><h3 className="font-bold">신규 이슈 생성</h3><button type="button" onClick={() => setIsModalOpen(false)}><X size={18} /></button></div>
              <input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="제목" className="w-full px-3 py-2 border rounded" />
              <div className="grid grid-cols-2 gap-2">
                <select value={newTask.status} onChange={(e) => setNewTask({ ...newTask, status: e.target.value as Status })} className="px-3 py-2 border rounded">{COLUMNS.map((c) => <option key={c} value={c}>{c}</option>)}</select>
                <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Priority })} className="px-3 py-2 border rounded"><option>Low</option><option>Medium</option><option>High</option></select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={newTask.assignee} onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })} className="px-3 py-2 border rounded">{TEAM_MEMBERS.map((m) => <option key={m}>{m}</option>)}</select>
                <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} className="px-3 py-2 border rounded" />
              </div>
              <button className="w-full bg-indigo-600 text-white py-2 rounded">생성하기</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Sidebar({ activeView, isSidebarOpen, setActiveView, setIsSidebarOpen }: { activeView: View; isSidebarOpen: boolean; setActiveView: (v: View) => void; setIsSidebarOpen: (v: boolean) => void; }) {
  const nav: { id: View; icon: React.ReactNode; label: string }[] = [
    { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: '대시보드' },
    { id: 'board', icon: <Trello size={18} />, label: '칸반' },
    { id: 'timeline', icon: <GanttChartSquare size={18} />, label: '타임라인' },
    { id: 'docs', icon: <FileText size={18} />, label: '문서함' },
    { id: 'settings', icon: <Settings size={18} />, label: '설정' },
  ];
  return <>
    {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
    <div className={`fixed left-0 top-0 h-screen bg-slate-900 text-white z-50 w-64 p-4 transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="text-xl font-bold mb-4">Project Flow</div>
      <nav className="space-y-1">{nav.map((n) => <button key={n.id} onClick={() => { setActiveView(n.id); setIsSidebarOpen(false); }} className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 ${activeView === n.id ? 'bg-indigo-600' : 'text-slate-300 hover:bg-slate-800'}`}>{n.icon}{n.label}</button>)}</nav>
    </div>
  </>;
}

function Header({ setIsSidebarOpen, setIsModalOpen }: { setIsSidebarOpen: (v: boolean) => void; setIsModalOpen: (v: boolean) => void; }) {
  return <header className="h-16 bg-white border-b fixed top-0 right-0 left-0 lg:left-64 z-30 flex items-center justify-between px-4 lg:px-8">
    <div className="flex items-center gap-2"><button onClick={() => setIsSidebarOpen(true)} className="lg:hidden"><Menu size={20} /></button><h2 className="font-bold">협업 프로젝트 관리</h2></div>
    <div className="flex items-center gap-3"><Search size={18} className="text-slate-400" /><Bell size={18} className="text-slate-400" /><button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-3 py-1.5 rounded flex items-center gap-1"><Plus size={16} />신규 이슈</button></div>
  </header>;
}

function DashboardView({ issues, kpi }: { issues: Issue[]; kpi: { todo: number; urgent: number; mine: number } }) {
  return <div className="space-y-4"><div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    <StatCard title="미완료" value={kpi.todo} icon={<Clock size={16} />} />
    <StatCard title="긴급" value={kpi.urgent} icon={<AlertCircle size={16} />} />
    <StatCard title="내 할 일" value={kpi.mine} icon={<User size={16} />} />
    <StatCard title="완료율" value={`${issues.length ? Math.round((issues.filter((i) => i.status === 'Done').length / issues.length) * 100) : 0}%`} icon={<CheckCircle2 size={16} />} />
  </div>
  <div className="bg-white rounded-xl border p-4"><h3 className="font-bold mb-2">오늘 확인할 일</h3>{issues.slice(0, 5).map((i) => <div key={i.id} className="flex justify-between text-sm py-2 border-b last:border-0"><span>{i.title}</span><span>{i.assignee}</span></div>)}</div></div>;
}

function BoardView({ issues, moveIssue, setIsModalOpen }: { issues: Issue[]; moveIssue: (id: number, s: Status) => void; setIsModalOpen: (v: boolean) => void }) {
  return <div className="flex gap-4 overflow-x-auto">{COLUMNS.map((col) => <div key={col} className="min-w-[280px] bg-slate-100 rounded-xl p-3"><div className="flex justify-between mb-3"><h3 className="font-semibold">{col}</h3><MoreVertical size={14} /></div>{issues.filter((i) => i.status === col).map((i) => <div key={i.id} className="bg-white rounded-lg p-3 mb-2 border"><div className="text-sm font-medium">{i.title}</div><div className="text-xs text-slate-500 mt-1">{i.assignee} · {i.dueDate}</div><div className="flex gap-1 mt-2">{COLUMNS.filter((c) => c !== col).map((c) => <button key={c} onClick={() => moveIssue(i.id, c)} className="text-[10px] px-2 py-1 bg-indigo-50 rounded">{c}</button>)}</div></div>)}<button onClick={() => setIsModalOpen(true)} className="w-full border-2 border-dashed rounded py-2 text-sm text-slate-500">+ 추가하기</button></div>)}</div>;
}

function TimelineView({ issues }: { issues: Issue[] }) {
  return <div className="bg-white rounded-xl border overflow-hidden"><div className="p-3 bg-slate-50 border-b flex items-center gap-2 text-sm"><Filter size={14} />마감일 기준</div><table className="w-full text-sm"><thead><tr className="text-left"><th className="p-3">이슈</th><th>담당자</th><th>마감일</th><th>상태</th></tr></thead><tbody>{[...issues].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map((i) => <tr key={i.id} className="border-t"><td className="p-3">{i.title}</td><td>{i.assignee}</td><td>{i.dueDate}</td><td>{i.status}</td></tr>)}</tbody></table></div>;
}

function Placeholder({ setActiveView }: { setActiveView: (v: View) => void }) {
  return <div className="h-[40vh] flex flex-col items-center justify-center text-slate-500"><Clock /><p className="mt-2">준비 중인 기능입니다.</p><button onClick={() => setActiveView('board')} className="mt-2 text-indigo-600">보드로 이동</button></div>;
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return <div className="bg-white rounded-xl border p-4"><div className="flex justify-between"><span className="text-sm text-slate-500">{title}</span>{icon}</div><div className="text-2xl font-bold mt-2">{value}</div></div>;
}
