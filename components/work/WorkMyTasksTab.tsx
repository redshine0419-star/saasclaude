'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckSquare, Flag, Calendar, Circle, CheckCircle2 } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  project: { id: string; name: string; color: string };
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#ef4444', high: '#f97316', medium: '#eab308', low: '#94a3b8',
};
const PRIORITY_LABELS: Record<string, string> = { urgent: '긴급', high: '높음', medium: '보통', low: '낮음' };
const STATUS_LABELS: Record<string, string> = { todo: '할 일', 'in-progress': '진행 중', review: '검토', done: '완료' };

export default function WorkMyTasksTab() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'todo' | 'in-progress' | 'done'>('all');

  useEffect(() => {
    setLoading(true);
    fetch('/api/work/tasks?assignedToMe=true')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTasks(data); })
      .finally(() => setLoading(false));
  }, []);

  const handleToggleDone = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: newStatus } : t));
    await fetch('/api/work/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, status: newStatus }),
    });
  };

  const filtered = tasks.filter((t) => filter === 'all' ? true : t.status === filter);
  const overdue = filtered.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done');
  const upcoming = filtered.filter((t) => !overdue.includes(t));

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#24292f] dark:text-[#e6edf3]">내 할일</h1>
          <p className="text-sm text-[#57606a] dark:text-[#8b949e] mt-0.5">나에게 배정된 태스크 {tasks.length}개</p>
        </div>
        <div className="flex gap-1 bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-lg p-1">
          {(['all', 'todo', 'in-progress', 'done'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                filter === f
                  ? 'bg-white dark:bg-[#0d1117] text-[#24292f] dark:text-[#e6edf3] shadow-sm'
                  : 'text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3]'
              }`}
            >
              {{ all: '전체', todo: '할 일', 'in-progress': '진행 중', done: '완료' }[f]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={24} className="animate-spin text-[#57606a] dark:text-[#8b949e]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[#d0d7de] dark:border-[#30363d] rounded-xl">
          <CheckSquare size={40} className="mx-auto text-[#8c959f] dark:text-[#484f58] mb-3" />
          <p className="text-[#57606a] dark:text-[#8b949e] font-medium">배정된 태스크가 없어요</p>
        </div>
      ) : (
        <div className="space-y-6">
          {overdue.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">기한 초과 ({overdue.length})</h2>
              <div className="space-y-2">
                {overdue.map((task) => <TaskRow key={task.id} task={task} onToggle={handleToggleDone} />)}
              </div>
            </section>
          )}
          {upcoming.length > 0 && (
            <section>
              {overdue.length > 0 && <h2 className="text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider mb-2">태스크</h2>}
              <div className="space-y-2">
                {upcoming.map((task) => <TaskRow key={task.id} task={task} onToggle={handleToggleDone} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: (t: Task) => void }) {
  const isDone = task.status === 'done';
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isDone;

  return (
    <div className={`flex items-start gap-3 p-4 bg-white dark:bg-[#161b22] border rounded-xl transition-all ${isDone ? 'border-[#d0d7de] dark:border-[#30363d] opacity-60' : 'border-[#d0d7de] dark:border-[#30363d] hover:border-[#0969da] dark:hover:border-[#388bfd]'}`}>
      <button onClick={() => onToggle(task)} className="mt-0.5 shrink-0 text-[#57606a] dark:text-[#8b949e] hover:text-[#0969da] dark:hover:text-[#388bfd] transition-colors">
        {isDone ? <CheckCircle2 size={18} className="text-[#1a7f37] dark:text-[#3fb950]" /> : <Circle size={18} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isDone ? 'line-through text-[#8c959f]' : 'text-[#24292f] dark:text-[#e6edf3]'}`}>{task.title}</p>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span
            className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ backgroundColor: PRIORITY_COLORS[task.priority] + '22', color: PRIORITY_COLORS[task.priority] }}
          >
            <Flag size={9} />
            {PRIORITY_LABELS[task.priority]}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded text-[#57606a] dark:text-[#8b949e]">
            {STATUS_LABELS[task.status]}
          </span>
          {task.project && (
            <span className="flex items-center gap-1 text-[10px] text-[#57606a] dark:text-[#8b949e]">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.project.color }} />
              {task.project.name}
            </span>
          )}
          {task.dueDate && (
            <span className={`flex items-center gap-1 text-[10px] ${isOverdue ? 'text-red-500 font-medium' : 'text-[#57606a] dark:text-[#8b949e]'}`}>
              <Calendar size={9} />
              {new Date(task.dueDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
              {isOverdue && ' · 기한 초과'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
