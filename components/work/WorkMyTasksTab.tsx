'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, CheckSquare, Flag, Calendar, Circle, CheckCircle2, Star, ChevronDown } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  startDate: string | null;
  dueDate: string | null;
  isKeyTask: boolean;
  project: { id: string; name: string; color: string };
}

interface SubTask {
  id: string;
  title: string;
  startDate: string | null;
  dueDate: string | null;
  status: string;
  assignee: { id: string; name: string | null; email: string } | null;
  task: {
    id: string;
    title: string;
    project: { id: string; name: string; color: string };
  };
}

interface Project {
  id: string;
  name: string;
  color: string;
  role: string;
}

interface Member {
  userId: string;
  role: string;
  user: { id: string; name: string | null; email: string; avatarUrl: string | null };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#94a3b8',
};
const PRIORITY_LABELS: Record<string, string> = {
  urgent: '긴급',
  high: '높음',
  medium: '보통',
  low: '낮음',
};

// ─── Date bucket helpers ──────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfWeek(d: Date): Date {
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diff = 6 - day;   // days until Saturday
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
  end.setHours(23, 59, 59, 999);
  return end;
}

type Bucket = 'overdue' | 'today' | 'this-week' | 'later' | 'no-date';

function getBucket(dueDate: string | null, isDone: boolean): Bucket {
  if (!dueDate) return 'no-date';
  const due = startOfDay(new Date(dueDate));
  const today = startOfDay(new Date());
  if (due < today && !isDone) return 'overdue';
  if (due.getTime() === today.getTime()) return 'today';
  const weekEnd = endOfWeek(today);
  if (due <= weekEnd) return 'this-week';
  return 'later';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TaskRow({ task, onToggle }: { task: Task; onToggle: (t: Task) => void }) {
  const isDone = task.status === '완료';
  const isOverdue = task.dueDate && getBucket(task.dueDate, isDone) === 'overdue';

  return (
    <div
      className={`flex items-start gap-3 p-4 bg-white dark:bg-[#161b22] border rounded-xl transition-all ${
        isDone
          ? 'border-[#d0d7de] dark:border-[#30363d] opacity-60'
          : 'border-[#d0d7de] dark:border-[#30363d] hover:border-[#0969da] dark:hover:border-[#388bfd]'
      }`}
    >
      <button
        onClick={() => onToggle(task)}
        className="mt-0.5 shrink-0 text-[#57606a] dark:text-[#8b949e] hover:text-[#0969da] dark:hover:text-[#388bfd] transition-colors"
        aria-label={isDone ? '완료 취소' : '완료 처리'}
      >
        {isDone ? (
          <CheckCircle2 size={18} className="text-[#1a7f37] dark:text-[#3fb950]" />
        ) : (
          <Circle size={18} />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {task.isKeyTask && (
            <Star size={12} className="shrink-0 text-yellow-500 fill-yellow-500" />
          )}
          <p
            className={`text-sm font-medium truncate ${
              isDone ? 'line-through text-[#8c959f]' : 'text-[#24292f] dark:text-[#e6edf3]'
            }`}
          >
            {task.title}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {task.priority && PRIORITY_COLORS[task.priority] && (
            <span
              className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: PRIORITY_COLORS[task.priority] + '22',
                color: PRIORITY_COLORS[task.priority],
              }}
            >
              <Flag size={9} />
              {PRIORITY_LABELS[task.priority] ?? task.priority}
            </span>
          )}
          {task.project && (
            <span className="flex items-center gap-1 text-[10px] text-[#57606a] dark:text-[#8b949e]">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: task.project.color }}
              />
              {task.project.name}
            </span>
          )}
          {task.dueDate && (
            <span
              className={`flex items-center gap-1 text-[10px] ${
                isOverdue ? 'text-red-500 font-medium' : 'text-[#57606a] dark:text-[#8b949e]'
              }`}
            >
              <Calendar size={9} />
              {formatDate(task.dueDate)}
              {isOverdue && ' · 기한 초과'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SubTaskRow({
  subTask,
  onToggle,
}: {
  subTask: SubTask;
  onToggle: (s: SubTask) => void;
}) {
  const isDone = subTask.status === '완료';
  const isOverdue =
    subTask.dueDate && getBucket(subTask.dueDate, isDone) === 'overdue';

  return (
    <div
      className={`flex items-start gap-3 p-3.5 bg-white dark:bg-[#161b22] border rounded-xl transition-all ${
        isDone
          ? 'border-[#d0d7de] dark:border-[#30363d] opacity-60'
          : 'border-[#d0d7de] dark:border-[#30363d] hover:border-[#0969da] dark:hover:border-[#388bfd]'
      }`}
    >
      <button
        onClick={() => onToggle(subTask)}
        className="mt-0.5 shrink-0 text-[#57606a] dark:text-[#8b949e] hover:text-[#0969da] dark:hover:text-[#388bfd] transition-colors"
        aria-label={isDone ? '완료 취소' : '완료 처리'}
      >
        {isDone ? (
          <CheckCircle2 size={16} className="text-[#1a7f37] dark:text-[#3fb950]" />
        ) : (
          <Circle size={16} />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            isDone ? 'line-through text-[#8c959f]' : 'text-[#24292f] dark:text-[#e6edf3]'
          }`}
        >
          {subTask.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="flex items-center gap-1 text-[10px] text-[#57606a] dark:text-[#8b949e]">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: subTask.task.project.color }}
            />
            {subTask.task.project.name}
          </span>
          <span className="text-[10px] text-[#57606a] dark:text-[#8b949e] truncate max-w-[140px]">
            ↳ {subTask.task.title}
          </span>
          {subTask.dueDate && (
            <span
              className={`flex items-center gap-1 text-[10px] ${
                isOverdue ? 'text-red-500 font-medium' : 'text-[#57606a] dark:text-[#8b949e]'
              }`}
            >
              <Calendar size={9} />
              {formatDate(subTask.dueDate)}
              {isOverdue && ' · 기한 초과'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ label, count, color }: { label: string; count: number; color?: string }) {
  return (
    <h2
      className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
        color ?? 'text-[#57606a] dark:text-[#8b949e]'
      }`}
    >
      {label} ({count})
    </h2>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type FilterTab = 'all' | 'active' | 'done';

export default function WorkMyTasksTab() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [loading, setLoading] = useState(true);

  // member selector
  const [ownedProjects, setOwnedProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<{ userId: string; name: string | null; email: string }[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null); // null = own tasks
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [filter, setFilter] = useState<FilterTab>('all');

  // ── Close dropdown on outside click ──
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Load projects to find owned ones & build member list ──
  useEffect(() => {
    fetch('/api/work/projects')
      .then((r) => r.json())
      .then(async (data: Project[]) => {
        if (!Array.isArray(data)) return;
        const owned = data.filter((p) => p.role === 'owner');
        setOwnedProjects(owned);

        if (owned.length === 0) return;

        const memberMap = new Map<string, { userId: string; name: string | null; email: string }>();

        await Promise.all(
          owned.map(async (project) => {
            const res = await fetch(`/api/work/members?projectId=${project.id}`);
            const mems: Member[] = await res.json();
            if (!Array.isArray(mems)) return;
            for (const m of mems) {
              if (!memberMap.has(m.user.id)) {
                memberMap.set(m.user.id, {
                  userId: m.user.id,
                  name: m.user.name,
                  email: m.user.email,
                });
              }
            }
          })
        );

        setMembers(Array.from(memberMap.values()));
      })
      .catch(() => {/* ignore */});
  }, []);

  // ── Fetch tasks & subtasks when selection changes ──
  useEffect(() => {
    setLoading(true);

    const taskUrl = selectedMemberId
      ? `/api/work/tasks?memberId=${selectedMemberId}`
      : '/api/work/tasks?assignedToMe=true';

    const subUrl = selectedMemberId
      ? `/api/work/subtasks?memberId=${selectedMemberId}`
      : '/api/work/subtasks?assignedToMe=true';

    Promise.all([
      fetch(taskUrl).then((r) => r.json()),
      fetch(subUrl).then((r) => r.json()),
    ])
      .then(([taskData, subData]) => {
        if (Array.isArray(taskData)) setTasks(taskData);
        if (Array.isArray(subData)) setSubTasks(subData);
      })
      .finally(() => setLoading(false));
  }, [selectedMemberId]);

  // ── Handlers ──

  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === '완료' ? '기획' : '완료';
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );
    await fetch('/api/work/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, status: newStatus }),
    });
  };

  const handleToggleSubTask = async (subTask: SubTask) => {
    const newStatus = subTask.status === '완료' ? '미시작' : '완료';
    setSubTasks((prev) =>
      prev.map((s) => (s.id === subTask.id ? { ...s, status: newStatus } : s))
    );
    await fetch('/api/work/subtasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: subTask.id, status: newStatus }),
    });
  };

  // ── Filter tasks ──
  const filteredTasks = tasks.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'active') return t.status !== '완료';
    if (filter === 'done') return t.status === '완료';
    return true;
  });

  const filteredSubTasks = subTasks.filter((s) => {
    if (filter === 'all') return true;
    if (filter === 'active') return s.status !== '완료';
    if (filter === 'done') return s.status === '완료';
    return true;
  });

  // ── Bucket tasks ──
  const buckets: Record<Bucket, Task[]> = {
    overdue: [],
    today: [],
    'this-week': [],
    later: [],
    'no-date': [],
  };
  for (const t of filteredTasks) {
    buckets[getBucket(t.dueDate, t.status === '완료')].push(t);
  }

  const hasTasks = filteredTasks.length > 0;
  const hasSubTasks = filteredSubTasks.length > 0;
  const isEmpty = !hasTasks && !hasSubTasks;

  // ── Selected member label ──
  const selectedMember = members.find((m) => m.userId === selectedMemberId);
  const selectorLabel = selectedMember
    ? (selectedMember.name ?? selectedMember.email)
    : '내 할일';

  const isOwner = ownedProjects.length > 0;

  // ── Render ──
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#24292f] dark:text-[#e6edf3]">내 할일</h1>

        <div className="flex items-center gap-3">
          {/* Member selector (only for owners) */}
          {isOwner && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-[#24292f] dark:text-[#e6edf3] hover:border-[#0969da] dark:hover:border-[#388bfd] transition-colors"
              >
                {selectorLabel}
                <ChevronDown size={13} className="text-[#57606a] dark:text-[#8b949e]" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-lg z-50 overflow-hidden">
                  <button
                    onClick={() => { setSelectedMemberId(null); setDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      selectedMemberId === null
                        ? 'bg-[#f6f8fa] dark:bg-[#0d1117] text-[#0969da] dark:text-[#388bfd] font-medium'
                        : 'text-[#24292f] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#0d1117]'
                    }`}
                  >
                    내 할일
                  </button>
                  {members.map((m) => (
                    <button
                      key={m.userId}
                      onClick={() => { setSelectedMemberId(m.userId); setDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        selectedMemberId === m.userId
                          ? 'bg-[#f6f8fa] dark:bg-[#0d1117] text-[#0969da] dark:text-[#388bfd] font-medium'
                          : 'text-[#24292f] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#0d1117]'
                      }`}
                    >
                      {m.name ?? m.email}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex gap-1 bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-lg p-1">
            {(['all', 'active', 'done'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  filter === f
                    ? 'bg-white dark:bg-[#0d1117] text-[#24292f] dark:text-[#e6edf3] shadow-sm'
                    : 'text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3]'
                }`}
              >
                {{ all: '전체', active: '진행중', done: '완료' }[f]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={24} className="animate-spin text-[#57606a] dark:text-[#8b949e]" />
        </div>
      ) : isEmpty ? (
        <div className="text-center py-20 border-2 border-dashed border-[#d0d7de] dark:border-[#30363d] rounded-xl">
          <CheckSquare size={40} className="mx-auto text-[#8c959f] dark:text-[#484f58] mb-3" />
          <p className="text-[#57606a] dark:text-[#8b949e] font-medium">배정된 태스크가 없어요</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overdue */}
          {buckets.overdue.length > 0 && (
            <section>
              <SectionHeader label="기한 초과" count={buckets.overdue.length} color="text-red-500" />
              <div className="space-y-2">
                {buckets.overdue.map((t) => (
                  <TaskRow key={t.id} task={t} onToggle={handleToggleTask} />
                ))}
              </div>
            </section>
          )}

          {/* Today */}
          {buckets.today.length > 0 && (
            <section>
              <SectionHeader label="오늘 마감" count={buckets.today.length} color="text-orange-500" />
              <div className="space-y-2">
                {buckets.today.map((t) => (
                  <TaskRow key={t.id} task={t} onToggle={handleToggleTask} />
                ))}
              </div>
            </section>
          )}

          {/* This week */}
          {buckets['this-week'].length > 0 && (
            <section>
              <SectionHeader label="이번 주" count={buckets['this-week'].length} />
              <div className="space-y-2">
                {buckets['this-week'].map((t) => (
                  <TaskRow key={t.id} task={t} onToggle={handleToggleTask} />
                ))}
              </div>
            </section>
          )}

          {/* Later */}
          {buckets.later.length > 0 && (
            <section>
              <SectionHeader label="이후" count={buckets.later.length} />
              <div className="space-y-2">
                {buckets.later.map((t) => (
                  <TaskRow key={t.id} task={t} onToggle={handleToggleTask} />
                ))}
              </div>
            </section>
          )}

          {/* No date */}
          {buckets['no-date'].length > 0 && (
            <section>
              <SectionHeader label="날짜 없음" count={buckets['no-date'].length} />
              <div className="space-y-2">
                {buckets['no-date'].map((t) => (
                  <TaskRow key={t.id} task={t} onToggle={handleToggleTask} />
                ))}
              </div>
            </section>
          )}

          {/* Sub-tasks */}
          {hasSubTasks && (
            <section>
              <SectionHeader label="하위 업무" count={filteredSubTasks.length} />
              <div className="space-y-2">
                {filteredSubTasks.map((s) => (
                  <SubTaskRow key={s.id} subTask={s} onToggle={handleToggleSubTask} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
