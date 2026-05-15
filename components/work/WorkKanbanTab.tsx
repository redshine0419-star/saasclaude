'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, AlertCircle, ChevronDown, Flag, Calendar, User2, GripVertical, X, Pencil } from 'lucide-react';

interface WorkUser { id: string; name: string | null; email: string; avatarUrl: string | null }
interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  position: number;
  assignee: WorkUser | null;
  _count: { comments: number };
}
interface Project { id: string; name: string; color: string }
interface Member { id: string; role: string; user: WorkUser }

const COLUMNS = [
  { id: 'todo', label: '할 일', color: '#8c959f' },
  { id: 'in-progress', label: '진행 중', color: '#0969da' },
  { id: 'review', label: '검토', color: '#bf8700' },
  { id: 'done', label: '완료', color: '#1a7f37' },
];

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#ef4444', high: '#f97316', medium: '#eab308', low: '#94a3b8',
};
const PRIORITY_LABELS: Record<string, string> = { urgent: '긴급', high: '높음', medium: '보통', low: '낮음' };

// ── Task Edit Modal ────────────────────────────────────────────────────────────
function TaskModal({
  task,
  members,
  onClose,
  onSave,
}: {
  task: Task;
  members: WorkUser[];
  onClose: () => void;
  onSave: (updated: Partial<Task>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description ?? '',
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
    assigneeId: task.assignee?.id ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      title: form.title,
      description: form.description || null,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || null,
      assigneeId: form.assigneeId || null,
    } as Partial<Task> & { assigneeId?: string | null });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-2xl w-full max-w-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#d0d7de] dark:border-[#30363d]">
          <h2 className="font-semibold text-[#24292f] dark:text-[#e6edf3]">태스크 편집</h2>
          <button onClick={onClose} className="text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3]">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider mb-1.5">제목 *</label>
            <input
              autoFocus
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#0969da] dark:focus:ring-[#388bfd]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider mb-1.5">설명</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="태스크 설명을 입력하세요..."
              className="w-full px-3 py-2 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] placeholder-[#8c959f] focus:outline-none focus:ring-2 focus:ring-[#0969da] dark:focus:ring-[#388bfd] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider mb-1.5">상태</label>
              <div className="relative">
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full appearance-none px-3 py-2 pr-8 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#0969da] cursor-pointer"
                >
                  <option value="todo">할 일</option>
                  <option value="in-progress">진행 중</option>
                  <option value="review">검토</option>
                  <option value="done">완료</option>
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#57606a] pointer-events-none" />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider mb-1.5">우선순위</label>
              <div className="relative">
                <select
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  className="w-full appearance-none px-3 py-2 pr-8 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#0969da] cursor-pointer"
                >
                  <option value="low">낮음</option>
                  <option value="medium">보통</option>
                  <option value="high">높음</option>
                  <option value="urgent">긴급</option>
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#57606a] pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Due Date */}
            <div>
              <label className="block text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider mb-1.5">마감일</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#0969da]"
              />
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider mb-1.5">담당자</label>
              <div className="relative">
                <select
                  value={form.assigneeId}
                  onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))}
                  className="w-full appearance-none px-3 py-2 pr-8 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#0969da] cursor-pointer"
                >
                  <option value="">배정 안 함</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name ?? m.email.split('@')[0]}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#57606a] pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 pb-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3]">취소</button>
          <button
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-[#0969da] hover:bg-[#0860ca] text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function WorkKanbanTab({
  projectId,
  onChangeProject,
}: {
  projectId: string | null;
  onChangeProject: (id: string) => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<WorkUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState<string | null>(null);
  const [addTitle, setAddTitle] = useState('');
  const [addAssigneeId, setAddAssigneeId] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/work/projects').then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setProjects(data);
    });
  }, []);

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [tasksRes, membersRes] = await Promise.all([
        fetch(`/api/work/tasks?projectId=${projectId}`),
        fetch(`/api/work/members?projectId=${projectId}`),
      ]);
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (membersRes.ok) {
        const membersData: Member[] = await membersRes.json();
        setMembers(membersData.map((m) => m.user));
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleAddTask = async (status: string) => {
    if (!addTitle.trim() || !projectId) return;
    setAdding(true);
    try {
      const res = await fetch('/api/work/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          title: addTitle.trim(),
          status,
          assigneeId: addAssigneeId || null,
        }),
      });
      if (res.ok) {
        const task = await res.json();
        setTasks((t) => [...t, task]);
        setAddTitle('');
        setAddAssigneeId('');
        setShowAdd(null);
      }
    } finally {
      setAdding(false);
    }
  };

  const handleSaveTask = async (id: string, updates: Partial<Task> & { assigneeId?: string | null }) => {
    const res = await fetch('/api/work/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => t.id === id ? updated : t));
    }
  };

  const handleDrop = async (targetStatus: string, taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: targetStatus } : t));
    await fetch('/api/work/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, status: targetStatus }),
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await fetch(`/api/work/tasks?id=${taskId}`, { method: 'DELETE' });
  };

  const activeProject = projects.find((p) => p.id === projectId);

  if (!projectId || projects.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="text-center py-20 border-2 border-dashed border-[#d0d7de] dark:border-[#30363d] rounded-xl">
          <AlertCircle size={40} className="mx-auto text-[#8c959f] dark:text-[#484f58] mb-3" />
          <p className="text-[#57606a] dark:text-[#8b949e] font-medium">프로젝트를 먼저 선택해주세요</p>
          <p className="text-sm text-[#8c959f] dark:text-[#484f58] mt-1">프로젝트 탭에서 프로젝트를 선택하면 칸반 보드가 열려요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeProject?.color ?? '#6366f1' }} />
          <h1 className="text-xl font-bold text-[#24292f] dark:text-[#e6edf3]">{activeProject?.name ?? '칸반 보드'}</h1>
          {projects.length > 1 && (
            <div className="relative">
              <select
                value={projectId}
                onChange={(e) => onChangeProject(e.target.value)}
                className="appearance-none pl-3 pr-7 py-1 text-xs bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-[#57606a] dark:text-[#8b949e] focus:outline-none cursor-pointer"
              >
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#57606a] pointer-events-none" />
            </div>
          )}
        </div>
        <p className="text-sm text-[#57606a] dark:text-[#8b949e]">{tasks.length}개 태스크</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={24} className="animate-spin text-[#57606a] dark:text-[#8b949e]" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id).sort((a, b) => a.position - b.position);
            return (
              <div
                key={col.id}
                className={`flex flex-col min-h-[400px] rounded-xl border transition-colors ${
                  dragOver === col.id
                    ? 'border-[#0969da] bg-[#0969da]/5'
                    : 'border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22]'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(col.id); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => { e.preventDefault(); setDragOver(null); if (dragging) handleDrop(col.id, dragging); setDragging(null); }}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-3 py-3 border-b border-[#d0d7de] dark:border-[#30363d]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                    <span className="text-xs font-semibold text-[#24292f] dark:text-[#e6edf3]">{col.label}</span>
                    <span className="text-xs text-[#57606a] dark:text-[#8b949e] bg-[#eaeef2] dark:bg-[#30363d] px-1.5 py-0.5 rounded-full">{colTasks.length}</span>
                  </div>
                  <button
                    onClick={() => { setShowAdd(col.id); setAddTitle(''); setAddAssigneeId(''); }}
                    className="text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3] transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Tasks */}
                <div className="flex-1 p-2 space-y-2">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDragging(task.id)}
                      onDragEnd={() => setDragging(null)}
                      className={`group bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md hover:border-[#0969da] dark:hover:border-[#388bfd] transition-all ${dragging === task.id ? 'opacity-40' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical size={14} className="text-[#8c959f] mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#24292f] dark:text-[#e6edf3] font-medium leading-snug">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-1 line-clamp-2">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span
                              className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: PRIORITY_COLORS[task.priority] + '22', color: PRIORITY_COLORS[task.priority] }}
                            >
                              <Flag size={9} />
                              {PRIORITY_LABELS[task.priority]}
                            </span>
                            {task.dueDate && (
                              <span className="flex items-center gap-1 text-[10px] text-[#57606a] dark:text-[#8b949e]">
                                <Calendar size={9} />
                                {new Date(task.dueDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                            {task.assignee && (
                              <span className="flex items-center gap-1 text-[10px] text-[#57606a] dark:text-[#8b949e] ml-auto">
                                <User2 size={9} />
                                {task.assignee.name ?? task.assignee.email.split('@')[0]}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Action buttons */}
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => setEditingTask(task)}
                            className="text-[#57606a] hover:text-[#0969da] transition-colors"
                            title="편집"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-[#8c959f] hover:text-red-500 transition-colors"
                            title="삭제"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add task inline */}
                  {showAdd === col.id && (
                    <div className="bg-white dark:bg-[#0d1117] border border-[#0969da] rounded-lg p-3 space-y-2">
                      <textarea
                        autoFocus
                        value={addTitle}
                        onChange={(e) => setAddTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddTask(col.id); }
                          if (e.key === 'Escape') { setShowAdd(null); setAddTitle(''); setAddAssigneeId(''); }
                        }}
                        placeholder="태스크 제목 입력..."
                        rows={2}
                        className="w-full text-sm bg-transparent text-[#24292f] dark:text-[#e6edf3] placeholder-[#8c959f] focus:outline-none resize-none"
                      />
                      {/* Assignee selector in add form */}
                      {members.length > 0 && (
                        <div className="relative">
                          <select
                            value={addAssigneeId}
                            onChange={(e) => setAddAssigneeId(e.target.value)}
                            className="w-full appearance-none pl-2 pr-6 py-1 text-xs bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded text-[#57606a] dark:text-[#8b949e] focus:outline-none cursor-pointer"
                          >
                            <option value="">담당자 없음</option>
                            {members.map((m) => (
                              <option key={m.id} value={m.id}>{m.name ?? m.email.split('@')[0]}</option>
                            ))}
                          </select>
                          <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#57606a] pointer-events-none" />
                        </div>
                      )}
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setShowAdd(null); setAddTitle(''); setAddAssigneeId(''); }} className="text-xs text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3]">취소</button>
                        <button
                          onClick={() => handleAddTask(col.id)}
                          disabled={adding || !addTitle.trim()}
                          className="flex items-center gap-1 text-xs px-2 py-1 bg-[#0969da] text-white rounded disabled:opacity-50"
                        >
                          {adding && <Loader2 size={10} className="animate-spin" />}
                          추가
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Add button at bottom */}
                {showAdd !== col.id && (
                  <button
                    onClick={() => { setShowAdd(col.id); setAddTitle(''); setAddAssigneeId(''); }}
                    className="flex items-center gap-2 mx-2 mb-2 px-3 py-2 text-xs text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3] hover:bg-white dark:hover:bg-[#0d1117] rounded-lg transition-colors border border-dashed border-transparent hover:border-[#d0d7de] dark:hover:border-[#30363d]"
                  >
                    <Plus size={13} />
                    태스크 추가
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingTask && (
        <TaskModal
          task={editingTask}
          members={members}
          onClose={() => setEditingTask(null)}
          onSave={(updates) => handleSaveTask(editingTask.id, updates as Partial<Task> & { assigneeId?: string | null })}
        />
      )}
    </div>
  );
}
