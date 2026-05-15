'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Loader2, AlertCircle, ChevronDown, Flag, Calendar, User2,
  GripVertical, X, Pencil, LayoutGrid, Table2, GanttChartSquare,
  Settings2, Trash2, Check,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface WorkUser { id: string; name: string | null; email: string; avatarUrl: string | null }
interface Task {
  id: string; title: string; description: string | null;
  status: string; priority: string; dueDate: string | null;
  position: number; createdAt: string;
  assignee: WorkUser | null; _count: { comments: number };
}
interface Project { id: string; name: string; color: string }
interface Member { id: string; role: string; user: WorkUser }
interface Stage { id: string; label: string; color: string }

type ViewMode = 'card' | 'table' | 'gantt';

// ── Constants ─────────────────────────────────────────────────────────────────
const DEFAULT_STAGES: Stage[] = [
  { id: '기획', label: '기획', color: '#8b5cf6' },
  { id: '디자인', label: '디자인', color: '#0969da' },
  { id: '퍼블', label: '퍼블', color: '#f97316' },
  { id: '개발', label: '개발', color: '#14b8a6' },
  { id: '완료', label: '완료', color: '#1a7f37' },
];

const STAGE_COLOR_OPTIONS = [
  '#8c959f', '#0969da', '#bf8700', '#1a7f37', '#ef4444',
  '#f97316', '#8b5cf6', '#ec4899', '#14b8a6',
];

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#ef4444', high: '#f97316', medium: '#eab308', low: '#94a3b8',
  긴급: '#ef4444', 높음: '#f97316', 보통: '#eab308', 낮음: '#94a3b8',
};
const PRIORITY_LABELS: Record<string, string> = {
  urgent: '긴급', high: '높음', medium: '보통', low: '낮음',
  긴급: '긴급', 높음: '높음', 보통: '보통', 낮음: '낮음',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getStages(projectId: string): Stage[] {
  try {
    const raw = localStorage.getItem(`work-stages-${projectId}`);
    return raw ? JSON.parse(raw) : DEFAULT_STAGES;
  } catch { return DEFAULT_STAGES; }
}
function saveStages(projectId: string, stages: Stage[]) {
  localStorage.setItem(`work-stages-${projectId}`, JSON.stringify(stages));
}
function genId() { return Math.random().toString(36).slice(2, 9); }

// ── Task Edit Modal ───────────────────────────────────────────────────────────
function TaskModal({ task, members, stages, onClose, onSave }: {
  task: Task; members: WorkUser[]; stages: Stage[];
  onClose: () => void;
  onSave: (updates: Record<string, unknown>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    title: task.title, description: task.description ?? '',
    status: task.status, priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
    assigneeId: task.assignee?.id ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ ...form, description: form.description || null, dueDate: form.dueDate || null, assigneeId: form.assigneeId || null });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-2xl w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#d0d7de] dark:border-[#30363d]">
          <h2 className="font-semibold text-[#24292f] dark:text-[#e6edf3]">태스크 편집</h2>
          <button onClick={onClose}><X size={18} className="text-[#57606a]" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#57606a] uppercase tracking-wider mb-1.5">제목 *</label>
            <input autoFocus value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#0969da]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#57606a] uppercase tracking-wider mb-1.5">설명</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3} placeholder="태스크 설명..."
              className="w-full px-3 py-2 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] placeholder-[#8c959f] focus:outline-none focus:ring-2 focus:ring-[#0969da] resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#57606a] uppercase tracking-wider mb-1.5">상태</label>
              <div className="relative">
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full appearance-none px-3 py-2 pr-8 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#0969da] cursor-pointer">
                  {stages.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#57606a] pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#57606a] uppercase tracking-wider mb-1.5">우선순위</label>
              <div className="relative">
                <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  className="w-full appearance-none px-3 py-2 pr-8 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#0969da] cursor-pointer">
                  <option value="low">낮음</option><option value="medium">보통</option>
                  <option value="high">높음</option><option value="urgent">긴급</option>
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#57606a] pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#57606a] uppercase tracking-wider mb-1.5">마감일</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#0969da]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#57606a] uppercase tracking-wider mb-1.5">담당자</label>
              <div className="relative">
                <select value={form.assigneeId} onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))}
                  className="w-full appearance-none px-3 py-2 pr-8 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#0969da] cursor-pointer">
                  <option value="">배정 안 함</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.name ?? m.email.split('@')[0]}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#57606a] pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#57606a]">취소</button>
          <button onClick={handleSave} disabled={saving || !form.title.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-[#0969da] text-white text-sm font-medium rounded-lg disabled:opacity-50">
            {saving && <Loader2 size={14} className="animate-spin" />}저장
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stage Manager Modal ───────────────────────────────────────────────────────
function StageManagerModal({ stages, onClose, onSave }: {
  stages: Stage[]; onClose: () => void; onSave: (stages: Stage[]) => void;
}) {
  const [list, setList] = useState<Stage[]>(stages);
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');

  const addStage = () => {
    if (!newLabel.trim()) return;
    setList((l) => [...l, { id: genId(), label: newLabel.trim(), color: newColor }]);
    setNewLabel('');
  };

  const removeStage = (id: string) => setList((l) => l.filter((s) => s.id !== id));

  const updateLabel = (id: string, label: string) =>
    setList((l) => l.map((s) => s.id === id ? { ...s, label } : s));

  const updateColor = (id: string, color: string) =>
    setList((l) => l.map((s) => s.id === id ? { ...s, color } : s));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-2xl w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#d0d7de] dark:border-[#30363d]">
          <h2 className="font-semibold text-[#24292f] dark:text-[#e6edf3]">단계 관리</h2>
          <button onClick={onClose}><X size={18} className="text-[#57606a]" /></button>
        </div>
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {list.map((stage, idx) => (
            <div key={stage.id} className="flex items-center gap-2">
              <span className="text-xs text-[#8c959f] w-4">{idx + 1}</span>
              {/* Color picker */}
              <div className="relative group/color">
                <div className="w-6 h-6 rounded-full cursor-pointer border-2 border-white shadow-sm" style={{ backgroundColor: stage.color }} />
                <div className="absolute left-0 top-8 z-10 hidden group-hover/color:flex flex-wrap gap-1 bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] p-2 rounded-lg shadow-lg w-36">
                  {STAGE_COLOR_OPTIONS.map((c) => (
                    <button key={c} onClick={() => updateColor(stage.id, c)}
                      className={`w-6 h-6 rounded-full border-2 ${stage.color === c ? 'border-[#0969da]' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <input value={stage.label} onChange={(e) => updateLabel(stage.id, e.target.value)}
                className="flex-1 px-2 py-1.5 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:ring-1 focus:ring-[#0969da]" />
              <button onClick={() => removeStage(stage.id)} disabled={list.length <= 1}
                className="text-[#8c959f] hover:text-red-500 disabled:opacity-30 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {/* Add new stage */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#d0d7de] dark:border-[#30363d]">
            <span className="text-xs text-[#8c959f] w-4" />
            <div className="relative group/newcolor">
              <div className="w-6 h-6 rounded-full cursor-pointer border-2 border-white shadow-sm" style={{ backgroundColor: newColor }} />
              <div className="absolute left-0 top-8 z-10 hidden group-hover/newcolor:flex flex-wrap gap-1 bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] p-2 rounded-lg shadow-lg w-36">
                {STAGE_COLOR_OPTIONS.map((c) => (
                  <button key={c} onClick={() => setNewColor(c)}
                    className={`w-6 h-6 rounded-full border-2 ${newColor === c ? 'border-[#0969da]' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addStage()}
              placeholder="새 단계 이름..."
              className="flex-1 px-2 py-1.5 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] placeholder-[#8c959f] focus:outline-none focus:ring-1 focus:ring-[#0969da]" />
            <button onClick={addStage} disabled={!newLabel.trim()}
              className="text-[#0969da] hover:text-[#0860ca] disabled:opacity-30 transition-colors">
              <Plus size={16} />
            </button>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#57606a]">취소</button>
          <button onClick={() => { onSave(list); onClose(); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#0969da] text-white text-sm font-medium rounded-lg">
            <Check size={14} />적용
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Card View ─────────────────────────────────────────────────────────────────
function CardView({ tasks, stages, members, onEdit, onDelete, onStatusChange, onAddTask }: {
  tasks: Task[]; stages: Stage[]; members: WorkUser[];
  onEdit: (t: Task) => void; onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onAddTask: (status: string, title: string, assigneeId: string) => Promise<void>;
}) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState<string | null>(null);
  const [addTitle, setAddTitle] = useState('');
  const [addAssigneeId, setAddAssigneeId] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async (status: string) => {
    if (!addTitle.trim()) return;
    setAdding(true);
    await onAddTask(status, addTitle, addAssigneeId);
    setAddTitle(''); setAddAssigneeId(''); setShowAdd(null);
    setAdding(false);
  };

  return (
    <div className="grid gap-4 pb-4" style={{ gridTemplateColumns: `repeat(${Math.min(stages.length, 4)}, minmax(0, 1fr))` }}>
      {stages.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id).sort((a, b) => a.position - b.position);
        return (
          <div key={col.id}
            className={`flex flex-col min-h-[400px] rounded-xl border transition-colors ${dragOver === col.id ? 'border-[#0969da] bg-[#0969da]/5' : 'border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22]'}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(col.id); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => { e.preventDefault(); setDragOver(null); if (dragging) onStatusChange(dragging, col.id); setDragging(null); }}>
            {/* Column header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-[#d0d7de] dark:border-[#30363d]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                <span className="text-xs font-semibold text-[#24292f] dark:text-[#e6edf3]">{col.label}</span>
                <span className="text-xs text-[#57606a] bg-[#eaeef2] dark:bg-[#30363d] px-1.5 py-0.5 rounded-full">{colTasks.length}</span>
              </div>
              <button onClick={() => { setShowAdd(col.id); setAddTitle(''); setAddAssigneeId(''); }}
                className="text-[#57606a] hover:text-[#24292f] dark:hover:text-[#e6edf3] transition-colors">
                <Plus size={14} />
              </button>
            </div>

            <div className="flex-1 p-2 space-y-2">
              {colTasks.map((task) => (
                <div key={task.id} draggable
                  onDragStart={() => setDragging(task.id)} onDragEnd={() => setDragging(null)}
                  className={`group bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md hover:border-[#0969da] dark:hover:border-[#388bfd] transition-all ${dragging === task.id ? 'opacity-40' : ''}`}>
                  <div className="flex items-start gap-2">
                    <GripVertical size={14} className="text-[#8c959f] mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#24292f] dark:text-[#e6edf3] font-medium leading-snug">{task.title}</p>
                      {task.description && <p className="text-xs text-[#57606a] mt-1 line-clamp-2">{task.description}</p>}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: PRIORITY_COLORS[task.priority] + '22', color: PRIORITY_COLORS[task.priority] }}>
                          <Flag size={9} />{PRIORITY_LABELS[task.priority]}
                        </span>
                        {task.dueDate && (
                          <span className="flex items-center gap-1 text-[10px] text-[#57606a]">
                            <Calendar size={9} />
                            {new Date(task.dueDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {task.assignee && (
                          <span className="flex items-center gap-1 text-[10px] text-[#57606a] ml-auto">
                            <User2 size={9} />{task.assignee.name ?? task.assignee.email.split('@')[0]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => onEdit(task)} className="text-[#57606a] hover:text-[#0969da] transition-colors" title="편집"><Pencil size={12} /></button>
                      <button onClick={() => onDelete(task.id)} className="text-[#8c959f] hover:text-red-500 transition-colors" title="삭제"><X size={12} /></button>
                    </div>
                  </div>
                </div>
              ))}

              {showAdd === col.id && (
                <div className="bg-white dark:bg-[#0d1117] border border-[#0969da] rounded-lg p-3 space-y-2">
                  <textarea autoFocus value={addTitle} onChange={(e) => setAddTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd(col.id); } if (e.key === 'Escape') setShowAdd(null); }}
                    placeholder="태스크 제목..." rows={2}
                    className="w-full text-sm bg-transparent text-[#24292f] dark:text-[#e6edf3] placeholder-[#8c959f] focus:outline-none resize-none" />
                  {members.length > 0 && (
                    <div className="relative">
                      <select value={addAssigneeId} onChange={(e) => setAddAssigneeId(e.target.value)}
                        className="w-full appearance-none pl-2 pr-6 py-1 text-xs bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded text-[#57606a] focus:outline-none cursor-pointer">
                        <option value="">담당자 없음</option>
                        {members.map((m) => <option key={m.id} value={m.id}>{m.name ?? m.email.split('@')[0]}</option>)}
                      </select>
                      <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#57606a] pointer-events-none" />
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowAdd(null)} className="text-xs text-[#57606a]">취소</button>
                    <button onClick={() => handleAdd(col.id)} disabled={adding || !addTitle.trim()}
                      className="flex items-center gap-1 text-xs px-2 py-1 bg-[#0969da] text-white rounded disabled:opacity-50">
                      {adding && <Loader2 size={10} className="animate-spin" />}추가
                    </button>
                  </div>
                </div>
              )}
            </div>

            {showAdd !== col.id && (
              <button onClick={() => { setShowAdd(col.id); setAddTitle(''); setAddAssigneeId(''); }}
                className="flex items-center gap-2 mx-2 mb-2 px-3 py-2 text-xs text-[#57606a] hover:text-[#24292f] dark:hover:text-[#e6edf3] hover:bg-white dark:hover:bg-[#0d1117] rounded-lg transition-colors border border-dashed border-transparent hover:border-[#d0d7de]">
                <Plus size={13} />태스크 추가
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Table View ────────────────────────────────────────────────────────────────
function TableView({ tasks, stages, members, onEdit, onDelete }: {
  tasks: Task[]; stages: Stage[]; members: WorkUser[];
  onEdit: (t: Task) => void; onDelete: (id: string) => void;
}) {
  const [sortKey, setSortKey] = useState<'title' | 'status' | 'priority' | 'dueDate' | 'assignee'>('status');
  const [sortAsc, setSortAsc] = useState(true);

  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

  const sorted = [...tasks].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'title') cmp = a.title.localeCompare(b.title);
    else if (sortKey === 'status') {
      const ai = stages.findIndex((s) => s.id === a.status);
      const bi = stages.findIndex((s) => s.id === b.status);
      cmp = ai - bi;
    }
    else if (sortKey === 'priority') cmp = (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
    else if (sortKey === 'dueDate') cmp = (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999');
    else if (sortKey === 'assignee') cmp = (a.assignee?.name ?? '').localeCompare(b.assignee?.name ?? '');
    return sortAsc ? cmp : -cmp;
  });

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortTh = ({ k, label }: { k: typeof sortKey; label: string }) => (
    <th className="px-4 py-3 text-left">
      <button onClick={() => toggleSort(k)} className="flex items-center gap-1 text-xs font-semibold text-[#57606a] uppercase tracking-wider hover:text-[#24292f] dark:hover:text-[#e6edf3]">
        {label}
        <span className="text-[10px]">{sortKey === k ? (sortAsc ? '↑' : '↓') : ''}</span>
      </button>
    </th>
  );

  return (
    <div className="bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-xl overflow-hidden">
      <table className="w-full">
        <thead className="border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117]">
          <tr>
            <SortTh k="title" label="제목" />
            <SortTh k="status" label="상태" />
            <SortTh k="priority" label="우선순위" />
            <SortTh k="assignee" label="담당자" />
            <SortTh k="dueDate" label="마감일" />
            <th className="px-4 py-3 w-16" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[#d0d7de] dark:divide-[#30363d]">
          {sorted.length === 0 ? (
            <tr><td colSpan={6} className="text-center py-12 text-sm text-[#57606a]">태스크가 없어요</td></tr>
          ) : sorted.map((task) => {
            const stage = stages.find((s) => s.id === task.status);
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== stages[stages.length - 1]?.id;
            return (
              <tr key={task.id} className="hover:bg-[#f6f8fa] dark:hover:bg-[#0d1117] group transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-[#24292f] dark:text-[#e6edf3]">{task.title}</p>
                    {task.description && <p className="text-xs text-[#57606a] truncate max-w-xs">{task.description}</p>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: (stage?.color ?? '#8c959f') + '22', color: stage?.color ?? '#8c959f' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stage?.color ?? '#8c959f' }} />
                    {stage?.label ?? task.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded"
                    style={{ backgroundColor: PRIORITY_COLORS[task.priority] + '22', color: PRIORITY_COLORS[task.priority] }}>
                    <Flag size={9} />{PRIORITY_LABELS[task.priority]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      {task.assignee.avatarUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={task.assignee.avatarUrl} alt="" width={20} height={20} className="w-5 h-5 rounded-full" />
                        : <div className="w-5 h-5 rounded-full bg-[#eaeef2] dark:bg-[#30363d] flex items-center justify-center"><User2 size={11} /></div>
                      }
                      <span className="text-sm text-[#24292f] dark:text-[#e6edf3]">{task.assignee.name ?? task.assignee.email.split('@')[0]}</span>
                    </div>
                  ) : <span className="text-xs text-[#8c959f]">—</span>}
                </td>
                <td className="px-4 py-3">
                  {task.dueDate
                    ? <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-[#57606a] dark:text-[#8b949e]'}`}>
                        {new Date(task.dueDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        {isOverdue && ' ⚠'}
                      </span>
                    : <span className="text-xs text-[#8c959f]">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(task)} className="p-1.5 text-[#57606a] hover:text-[#0969da] hover:bg-[#f0f6ff] rounded transition-colors"><Pencil size={13} /></button>
                    <button onClick={() => onDelete(task.id)} className="p-1.5 text-[#57606a] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Gantt View ────────────────────────────────────────────────────────────────
function GanttView({ tasks, stages }: { tasks: Task[]; stages: Stage[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Show 60-day window: 14 days before today ~ 46 days after
  const start = new Date(today);
  start.setDate(start.getDate() - 14);
  const totalDays = 60;

  const days = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });

  const todayOffset = Math.floor((today.getTime() - start.getTime()) / 86400000);

  const getBar = (task: Task) => {
    const created = new Date(task.createdAt);
    created.setHours(0, 0, 0, 0);
    const due = task.dueDate ? new Date(task.dueDate) : null;
    if (due) due.setHours(0, 0, 0, 0);

    const barStart = Math.max(0, Math.floor((created.getTime() - start.getTime()) / 86400000));
    const barEnd = due
      ? Math.min(totalDays - 1, Math.floor((due.getTime() - start.getTime()) / 86400000))
      : Math.min(totalDays - 1, barStart + 1);
    const width = Math.max(1, barEnd - barStart + 1);
    return { barStart, width, isOverdue: due ? due < today : false };
  };

  const stage = (task: Task) => stages.find((s) => s.id === task.status);

  const CELL_W = 32;

  return (
    <div className="bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ minWidth: 280 + totalDays * CELL_W }}>
          {/* Header */}
          <div className="flex border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] sticky top-0 z-10">
            <div className="w-64 shrink-0 px-4 py-2 text-xs font-semibold text-[#57606a] uppercase tracking-wider border-r border-[#d0d7de] dark:border-[#30363d]">태스크</div>
            <div className="flex">
              {days.map((d, i) => {
                const isToday = i === todayOffset;
                const isMon = d.getDay() === 1;
                return (
                  <div key={i} style={{ width: CELL_W }}
                    className={`shrink-0 text-center py-2 border-r border-[#eaeef2] dark:border-[#21262d] ${isToday ? 'bg-[#ddf4ff] dark:bg-[#1c2a3a]' : ''}`}>
                    {(isMon || i === 0) && (
                      <div className="text-[9px] text-[#57606a] leading-none">
                        {d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </div>
                    )}
                    {isToday && <div className="text-[9px] font-bold text-[#0969da]">오늘</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rows */}
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-[#57606a]">태스크가 없어요</div>
          ) : tasks.map((task) => {
            const { barStart, width, isOverdue } = getBar(task);
            const s = stage(task);
            const barColor = isOverdue ? '#ef4444' : (s?.color ?? '#6366f1');
            return (
              <div key={task.id} className="flex border-b border-[#eaeef2] dark:border-[#21262d] hover:bg-[#f6f8fa] dark:hover:bg-[#0d1117] transition-colors">
                <div className="w-64 shrink-0 px-4 py-2.5 border-r border-[#d0d7de] dark:border-[#30363d]">
                  <p className="text-sm text-[#24292f] dark:text-[#e6edf3] truncate font-medium">{task.title}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: s?.color ?? '#8c959f' }}>{s?.label ?? task.status}</p>
                </div>
                <div className="flex relative" style={{ width: totalDays * CELL_W }}>
                  {/* Today line */}
                  <div className="absolute top-0 bottom-0 w-px bg-[#0969da]/30 z-10" style={{ left: todayOffset * CELL_W + CELL_W / 2 }} />
                  {/* Gantt bar */}
                  <div className="absolute top-1/2 -translate-y-1/2 h-6 rounded-full flex items-center px-2"
                    style={{ left: barStart * CELL_W + 2, width: Math.max(width * CELL_W - 4, 8), backgroundColor: barColor + '33', border: `1.5px solid ${barColor}` }}>
                    {width * CELL_W > 40 && (
                      <span className="text-[10px] font-medium truncate" style={{ color: barColor }}>
                        {task.assignee ? (task.assignee.name ?? task.assignee.email.split('@')[0]) : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function WorkKanbanTab({ projectId, onChangeProject }: {
  projectId: string | null; onChangeProject: (id: string) => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<WorkUser[]>([]);
  const [stages, setStages] = useState<Stage[]>(DEFAULT_STAGES);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showStageManager, setShowStageManager] = useState(false);

  useEffect(() => {
    fetch('/api/work/projects').then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setProjects(data);
    });
  }, []);

  useEffect(() => {
    if (projectId) setStages(getStages(projectId));
  }, [projectId]);

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
        const data: Member[] = await membersRes.json();
        setMembers(data.map((m) => m.user));
      }
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleAddTask = async (status: string, title: string, assigneeId: string) => {
    if (!title.trim() || !projectId) return;
    const res = await fetch('/api/work/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, title: title.trim(), status, assigneeId: assigneeId || null }),
    });
    if (res.ok) { const task = await res.json(); setTasks((t) => [...t, task]); }
  };

  const handleSaveTask = async (id: string, updates: Record<string, unknown>) => {
    const res = await fetch('/api/work/tasks', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) { const updated = await res.json(); setTasks((prev) => prev.map((t) => t.id === id ? updated : t)); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
    await fetch('/api/work/tasks', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/work/tasks?id=${id}`, { method: 'DELETE' });
  };

  const handleSaveStages = (newStages: Stage[]) => {
    if (!projectId) return;
    setStages(newStages);
    saveStages(projectId, newStages);
  };

  const activeProject = projects.find((p) => p.id === projectId);

  if (!projectId || projects.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="text-center py-20 border-2 border-dashed border-[#d0d7de] dark:border-[#30363d] rounded-xl">
          <AlertCircle size={40} className="mx-auto text-[#8c959f] mb-3" />
          <p className="text-[#57606a] dark:text-[#8b949e] font-medium">프로젝트를 먼저 선택해주세요</p>
          <p className="text-sm text-[#8c959f] mt-1">프로젝트 탭에서 프로젝트를 선택하면 칸반 보드가 열려요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeProject?.color ?? '#6366f1' }} />
          <h1 className="text-xl font-bold text-[#24292f] dark:text-[#e6edf3]">{activeProject?.name ?? '칸반 보드'}</h1>
          {projects.length > 1 && (
            <div className="relative">
              <select value={projectId} onChange={(e) => onChangeProject(e.target.value)}
                className="appearance-none pl-3 pr-7 py-1 text-xs bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-[#57606a] focus:outline-none cursor-pointer">
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#57606a] pointer-events-none" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Stage manager */}
          <button onClick={() => setShowStageManager(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3] border border-[#d0d7de] dark:border-[#30363d] rounded-lg hover:bg-white dark:hover:bg-[#161b22] transition-colors">
            <Settings2 size={13} />단계 관리
          </button>

          {/* View switcher */}
          <div className="flex bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-lg p-0.5">
            {([['card', <LayoutGrid key="c" size={14} />, '카드'], ['table', <Table2 key="t" size={14} />, '표'], ['gantt', <GanttChartSquare key="g" size={14} />, '간트']] as const).map(([mode, icon, label]) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-all ${viewMode === mode ? 'bg-white dark:bg-[#0d1117] text-[#24292f] dark:text-[#e6edf3] shadow-sm' : 'text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3]'}`}>
                {icon}{label}
              </button>
            ))}
          </div>

          <span className="text-sm text-[#57606a] dark:text-[#8b949e]">{tasks.length}개</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 size={24} className="animate-spin text-[#57606a]" /></div>
      ) : (
        <>
          {viewMode === 'card' && (
            <CardView tasks={tasks} stages={stages} members={members}
              onEdit={setEditingTask} onDelete={handleDeleteTask}
              onStatusChange={handleStatusChange} onAddTask={handleAddTask} />
          )}
          {viewMode === 'table' && (
            <TableView tasks={tasks} stages={stages} members={members}
              onEdit={setEditingTask} onDelete={handleDeleteTask} />
          )}
          {viewMode === 'gantt' && <GanttView tasks={tasks} stages={stages} />}
        </>
      )}

      {editingTask && (
        <TaskModal task={editingTask} members={members} stages={stages}
          onClose={() => setEditingTask(null)}
          onSave={(updates) => handleSaveTask(editingTask.id, updates)} />
      )}
      {showStageManager && (
        <StageManagerModal stages={stages} onClose={() => setShowStageManager(false)} onSave={handleSaveStages} />
      )}
    </div>
  );
}
