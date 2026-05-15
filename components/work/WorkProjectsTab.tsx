'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, FolderKanban, Users, CheckSquare, Loader2, X,
  MoreVertical, Pencil, Trash2, LayoutGrid, GanttChartSquare,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  status: string;
  startDate: string | null;
  dueDate: string | null;
  isOngoing: boolean;
  createdAt: string;
  role: string;
  _count: { tasks: number; members: number };
}

interface Task {
  id: string;
  title: string;
  dueDate: string | null;
  isKeyTask: boolean;
}

interface ProjectFormData {
  name: string;
  description: string;
  color: string;
  startDate: string;
  dueDate: string;
  isOngoing: boolean;
}

type ViewMode = 'card' | 'gantt';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_OPTIONS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6',
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateKR(dateStr: string | null): string {
  if (!dateStr) return '';
  return dateStr.replace(/-/g, '.').slice(0, 10);
}

function toDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

function endOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Fraction [0,1] of position within the month window
function dateToFraction(
  date: Date,
  windowStart: Date,
  totalDays: number,
): number {
  const diff = (date.getTime() - windowStart.getTime()) / 86400000;
  return diff / totalDays;
}

// ─── ProjectFormModal ─────────────────────────────────────────────────────────

function ProjectFormModal({
  title,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  initial?: ProjectFormData;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
}) {
  const [form, setForm] = useState<ProjectFormData>(
    initial ?? { name: '', description: '', color: '#6366f1', startDate: '', dueDate: '', isOngoing: false },
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('프로젝트 이름을 입력하세요.'); return; }
    setLoading(true);
    setError('');
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#d0d7de] dark:border-[#30363d]">
          <h2 className="font-semibold text-[#24292f] dark:text-[#e6edf3]">{title}</h2>
          <button onClick={onClose} className="text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3]">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[#24292f] dark:text-[#e6edf3] mb-1.5">프로젝트 이름 *</label>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="예: 마케팅 Q2 캠페인"
              className="w-full px-3 py-2 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] placeholder-[#8c959f] focus:outline-none focus:ring-2 focus:ring-[#0969da]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#24292f] dark:text-[#e6edf3] mb-1.5">설명 (선택)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="프로젝트의 목표와 범위를 입력하세요"
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] placeholder-[#8c959f] focus:outline-none focus:ring-2 focus:ring-[#0969da] resize-none"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-[#24292f] dark:text-[#e6edf3] mb-2">색상</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-[#0969da]' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Ongoing checkbox */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isOngoing}
                onChange={(e) => setForm((f) => ({ ...f, isOngoing: e.target.checked }))}
                className="w-4 h-4 rounded border-[#d0d7de] dark:border-[#30363d] accent-[#0969da]"
              />
              <span className="text-sm font-medium text-[#24292f] dark:text-[#e6edf3]">상시 운영</span>
              <span className="text-xs text-[#57606a] dark:text-[#8b949e]">(기간 없음)</span>
            </label>
          </div>

          {/* Date fields — hidden when isOngoing */}
          {!form.isOngoing && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#24292f] dark:text-[#e6edf3] mb-1.5">시작일</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#0969da]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#24292f] dark:text-[#e6edf3] mb-1.5">목표일</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#0969da]"
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3]">취소</button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#1f2328] dark:bg-[#f0f6fc] text-white dark:text-[#1f2328] text-sm font-medium rounded-lg disabled:opacity-50"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── ProjectCard ──────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  onSelect,
  onEdit,
  onDelete,
}: {
  project: Project;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const dateLabel = project.isOngoing
    ? null
    : project.startDate || project.dueDate
      ? `${formatDateKR(project.startDate)} ~ ${formatDateKR(project.dueDate)}`
      : null;

  return (
    <div className="relative bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-xl hover:border-[#0969da] dark:hover:border-[#388bfd] hover:shadow-sm transition-all group">
      <button onClick={onSelect} className="w-full text-left p-5">
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center"
            style={{ backgroundColor: project.color + '22', border: `2px solid ${project.color}33` }}
          >
            <FolderKanban size={18} style={{ color: project.color }} />
          </div>
          <div className="min-w-0 flex-1 pr-6">
            <h3 className="font-semibold text-[#24292f] dark:text-[#e6edf3] truncate group-hover:text-[#0969da] dark:group-hover:text-[#388bfd] transition-colors">
              {project.name}
            </h3>
            {project.isOngoing && (
              <span className="inline-block mt-0.5 px-1.5 py-0 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                상시
              </span>
            )}
            {!project.isOngoing && dateLabel && (
              <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-0.5">{dateLabel}</p>
            )}
            {project.description && (
              <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-0.5 line-clamp-2">{project.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-[#57606a] dark:text-[#8b949e]">
          <span className="flex items-center gap-1"><CheckSquare size={12} />{project._count.tasks}개 태스크</span>
          <span className="flex items-center gap-1"><Users size={12} />{project._count.members}명</span>
          <span
            className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{ backgroundColor: project.color + '22', color: project.color }}
          >
            {project.role}
          </span>
        </div>
      </button>

      {/* 3-dot menu */}
      <div ref={menuRef} className="absolute top-3 right-3">
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
          className="p-1.5 rounded-md text-[#8c959f] hover:text-[#24292f] dark:hover:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#30363d] opacity-0 group-hover:opacity-100 transition-all"
        >
          <MoreVertical size={15} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-8 w-36 bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-lg shadow-lg z-10 overflow-hidden">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#24292f] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#30363d]"
            >
              <Pencil size={13} /> 편집
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 size={13} /> 삭제
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── GanttChart ───────────────────────────────────────────────────────────────

function GanttChart({
  projects,
  onSelectProject,
}: {
  projects: Project[];
  onSelectProject: (id: string) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Window anchor: index of the leftmost month (months offset from today's month)
  const [offset, setOffset] = useState(-2); // default: show current month - 2 through +3

  const MONTHS_SHOWN = 6;
  const LEFT_COL_WIDTH = 180; // px for project name column
  const ROW_HEIGHT = 44;

  // Key tasks state: map from projectId -> Task[]
  const [keyTasksMap, setKeyTasksMap] = useState<Record<string, Task[]>>({});

  // Fetch key tasks for all projects
  useEffect(() => {
    if (projects.length === 0) return;
    const controller = new AbortController();
    const fetchAll = async () => {
      const entries = await Promise.all(
        projects.map(async (p) => {
          try {
            const res = await fetch(`/api/work/tasks?projectId=${p.id}`, { signal: controller.signal });
            if (!res.ok) return [p.id, []] as [string, Task[]];
            const tasks: Task[] = await res.json();
            return [p.id, tasks.filter((t) => t.isKeyTask)] as [string, Task[]];
          } catch {
            return [p.id, []] as [string, Task[]];
          }
        }),
      );
      setKeyTasksMap(Object.fromEntries(entries));
    };
    fetchAll();
    return () => controller.abort();
  }, [projects]);

  // Build the month columns
  const months: { year: number; month: number }[] = [];
  for (let i = 0; i < MONTHS_SHOWN; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + offset + i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() });
  }

  // Window start/end dates (inclusive)
  const windowStart = startOfMonth(months[0].year, months[0].month);
  const lastM = months[months.length - 1];
  const windowEnd = endOfMonth(lastM.year, lastM.month);
  const totalWindowDays = (windowEnd.getTime() - windowStart.getTime()) / 86400000 + 1;

  // Today line position
  const todayFraction = dateToFraction(today, windowStart, totalWindowDays);
  const todayInWindow = todayFraction >= 0 && todayFraction <= 1;

  return (
    <div className="bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-xl overflow-hidden">
      {/* Navigation header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#d0d7de] dark:border-[#30363d]">
        <span className="text-sm font-semibold text-[#24292f] dark:text-[#e6edf3]">
          {MONTH_NAMES[months[0].month]} {months[0].year} — {MONTH_NAMES[lastM.month]} {lastM.year}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setOffset((o) => o - 1)}
            className="p-1.5 rounded-md text-[#57606a] dark:text-[#8b949e] hover:bg-[#f6f8fa] dark:hover:bg-[#30363d] transition-colors"
            title="이전"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setOffset(-2)}
            className="px-2 py-1 text-xs rounded-md text-[#57606a] dark:text-[#8b949e] hover:bg-[#f6f8fa] dark:hover:bg-[#30363d] transition-colors"
          >
            오늘
          </button>
          <button
            onClick={() => setOffset((o) => o + 1)}
            className="p-1.5 rounded-md text-[#57606a] dark:text-[#8b949e] hover:bg-[#f6f8fa] dark:hover:bg-[#30363d] transition-colors"
            title="다음"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: LEFT_COL_WIDTH + 120 * MONTHS_SHOWN }}>
          {/* Month header row */}
          <div className="flex border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117]">
            <div
              className="shrink-0 px-4 py-2 text-xs font-medium text-[#57606a] dark:text-[#8b949e] border-r border-[#d0d7de] dark:border-[#30363d]"
              style={{ width: LEFT_COL_WIDTH }}
            >
              프로젝트
            </div>
            {months.map(({ year, month }) => (
              <div
                key={`${year}-${month}`}
                className="flex-1 px-2 py-2 text-xs font-medium text-[#57606a] dark:text-[#8b949e] text-center border-r border-[#d0d7de] dark:border-[#30363d] last:border-r-0"
              >
                {MONTH_NAMES[month]} {year}
              </div>
            ))}
          </div>

          {/* Project rows */}
          {projects.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-[#57606a] dark:text-[#8b949e]">
              프로젝트가 없습니다.
            </div>
          ) : (
            projects.map((project) => {
              const keyTasks = keyTasksMap[project.id] ?? [];
              const start = toDate(project.startDate);
              const due = toDate(project.dueDate);

              // Clamp to window
              const barStart = start ? (start < windowStart ? windowStart : start) : null;
              const barEnd = due ? (due > windowEnd ? windowEnd : due) : null;

              let barLeft: number | null = null;
              let barWidth: number | null = null;

              if (!project.isOngoing) {
                if (barStart && barEnd && barStart <= barEnd) {
                  barLeft = dateToFraction(barStart, windowStart, totalWindowDays);
                  const endFrac = dateToFraction(barEnd, windowStart, totalWindowDays) + (1 / totalWindowDays);
                  barWidth = endFrac - barLeft;
                } else if (!start && !due) {
                  // No dates: dashed bar for current month
                  const curMonthStart = startOfMonth(today.getFullYear(), today.getMonth());
                  const curMonthEnd = endOfMonth(today.getFullYear(), today.getMonth());
                  const clampedStart = curMonthStart < windowStart ? windowStart : curMonthStart;
                  const clampedEnd = curMonthEnd > windowEnd ? windowEnd : curMonthEnd;
                  if (clampedStart <= windowEnd && clampedEnd >= windowStart) {
                    barLeft = dateToFraction(clampedStart, windowStart, totalWindowDays);
                    const endFrac = dateToFraction(clampedEnd, windowStart, totalWindowDays) + (1 / totalWindowDays);
                    barWidth = endFrac - barLeft;
                  }
                }
              }

              return (
                <button
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className="flex w-full text-left hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition-colors border-b border-[#d0d7de] dark:border-[#30363d] last:border-b-0"
                  style={{ height: ROW_HEIGHT }}
                >
                  {/* Name cell */}
                  <div
                    className="shrink-0 flex items-center gap-2 px-4 border-r border-[#d0d7de] dark:border-[#30363d] overflow-hidden"
                    style={{ width: LEFT_COL_WIDTH }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="text-sm font-medium text-[#24292f] dark:text-[#e6edf3] truncate">
                      {project.name}
                    </span>
                  </div>

                  {/* Bar area */}
                  <div className="flex-1 relative flex">
                    {/* Month column dividers */}
                    {months.map(({ year, month }, i) => (
                      <div
                        key={`${year}-${month}`}
                        className="flex-1 border-r border-[#d0d7de]/40 dark:border-[#30363d]/40 last:border-r-0"
                      />
                    ))}

                    {/* Today line */}
                    {todayInWindow && (
                      <div
                        className="absolute top-0 bottom-0 w-px bg-red-500/70 z-20 pointer-events-none"
                        style={{ left: `${todayFraction * 100}%` }}
                      />
                    )}

                    {/* Bar or badge */}
                    {project.isOngoing ? (
                      <div className="absolute inset-0 flex items-center px-3 z-10 pointer-events-none">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                          상시
                        </span>
                      </div>
                    ) : barLeft !== null && barWidth !== null ? (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-5 rounded-full z-10 pointer-events-none"
                        style={{
                          left: `${Math.max(0, barLeft) * 100}%`,
                          width: `${Math.min(barWidth, 1 - Math.max(0, barLeft)) * 100}%`,
                          backgroundColor: project.color,
                          opacity: (!start && !due) ? 0 : 0.85,
                          border: (!start && !due) ? `2px dashed ${project.color}` : 'none',
                        }}
                      />
                    ) : null}

                    {/* Dashed bar for no-date projects */}
                    {!project.isOngoing && !start && !due && barLeft !== null && barWidth !== null && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-5 rounded-full z-10 pointer-events-none"
                        style={{
                          left: `${Math.max(0, barLeft) * 100}%`,
                          width: `${Math.min(barWidth, 1 - Math.max(0, barLeft)) * 100}%`,
                          backgroundColor: 'transparent',
                          border: `2px dashed ${project.color}`,
                        }}
                      />
                    )}

                    {/* Key task markers */}
                    {keyTasks.map((task) => {
                      const taskDate = toDate(task.dueDate);
                      if (!taskDate) return null;
                      const frac = dateToFraction(taskDate, windowStart, totalWindowDays);
                      if (frac < 0 || frac > 1) return null;
                      return (
                        <div
                          key={task.id}
                          className="absolute top-1/2 -translate-y-1/2 z-20 group/task"
                          style={{ left: `${frac * 100}%` }}
                        >
                          <span
                            className="block w-3 h-3 rotate-45 -translate-x-1/2"
                            style={{ backgroundColor: project.color, border: '2px solid white' }}
                            title={task.title}
                          />
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/task:block z-30 pointer-events-none">
                            <div className="bg-[#24292f] dark:bg-[#e6edf3] text-white dark:text-[#24292f] text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
                              {task.title}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WorkProjectsTab({ onSelectProject }: { onSelectProject: (id: string) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [showCreate, setShowCreate] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/work/projects');
      if (res.ok) setProjects(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleCreate = async (form: ProjectFormData) => {
    const res = await fetch('/api/work/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? '생성 실패'); }
    setShowCreate(false);
    await fetchProjects();
  };

  const handleEdit = async (form: ProjectFormData) => {
    if (!editingProject) return;
    const res = await fetch('/api/work/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingProject.id, ...form }),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? '수정 실패'); }
    setEditingProject(null);
    await fetchProjects();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('프로젝트를 삭제하면 모든 태스크도 함께 삭제됩니다. 계속할까요?')) return;
    setDeletingId(id);
    try {
      await fetch(`/api/work/projects?id=${id}`, { method: 'DELETE' });
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#24292f] dark:text-[#e6edf3]">프로젝트</h1>
          <p className="text-sm text-[#57606a] dark:text-[#8b949e] mt-0.5">팀의 프로젝트를 관리하세요</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('card')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'card'
                  ? 'bg-white dark:bg-[#30363d] text-[#24292f] dark:text-[#e6edf3] shadow-sm'
                  : 'text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3]'
              }`}
            >
              <LayoutGrid size={13} />
              카드
            </button>
            <button
              onClick={() => setViewMode('gantt')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'gantt'
                  ? 'bg-white dark:bg-[#30363d] text-[#24292f] dark:text-[#e6edf3] shadow-sm'
                  : 'text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3]'
              }`}
            >
              <GanttChartSquare size={13} />
              간트
            </button>
          </div>

          {/* New project button */}
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1f2328] dark:bg-[#f0f6fc] text-white dark:text-[#1f2328] text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            새 프로젝트
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={24} className="animate-spin text-[#57606a] dark:text-[#8b949e]" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[#d0d7de] dark:border-[#30363d] rounded-xl">
          <FolderKanban size={40} className="mx-auto text-[#8c959f] dark:text-[#484f58] mb-3" />
          <p className="text-[#57606a] dark:text-[#8b949e] font-medium">아직 프로젝트가 없어요</p>
          <p className="text-sm text-[#8c959f] dark:text-[#484f58] mt-1">새 프로젝트를 만들어 팀과 협업을 시작하세요</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 px-4 py-2 bg-[#1f2328] dark:bg-[#f0f6fc] text-white dark:text-[#1f2328] text-sm font-medium rounded-lg"
          >
            프로젝트 만들기
          </button>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project.id} className={deletingId === project.id ? 'opacity-50 pointer-events-none' : ''}>
              <ProjectCard
                project={project}
                onSelect={() => onSelectProject(project.id)}
                onEdit={() => setEditingProject(project)}
                onDelete={() => handleDelete(project.id)}
              />
            </div>
          ))}
        </div>
      ) : (
        <GanttChart projects={projects} onSelectProject={onSelectProject} />
      )}

      {/* Modals */}
      {showCreate && (
        <ProjectFormModal title="새 프로젝트" onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
      )}
      {editingProject && (
        <ProjectFormModal
          title="프로젝트 편집"
          initial={{
            name: editingProject.name,
            description: editingProject.description ?? '',
            color: editingProject.color,
            startDate: editingProject.startDate ?? '',
            dueDate: editingProject.dueDate ?? '',
            isOngoing: editingProject.isOngoing,
          }}
          onClose={() => setEditingProject(null)}
          onSubmit={handleEdit}
        />
      )}
    </div>
  );
}
