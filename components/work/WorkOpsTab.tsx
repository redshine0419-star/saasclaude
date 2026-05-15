'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, X, ChevronDown, ExternalLink, Filter, Search } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface WorkUser { id: string; name: string | null; email: string; avatarUrl: string | null }
interface Task {
  id: string; title: string; description: string | null;
  status: string; priority: string; dueDate: string | null;
  category: string; taskType: string; requester: string; externalLink: string;
  planningStatus: string; designStatus: string; publishStatus: string; devStatus: string;
  createdAt: string; assignee: WorkUser | null;
}
interface Project { id: string; name: string; color: string }
interface Member { id: string; role: string; user: WorkUser }

// ── Constants ─────────────────────────────────────────────────────────────────
const STAGE_STATUS = ['미시작', '진행중', '검토요청', '피드백', '보류', '완료', 'N/A'];
const PRIORITY_OPTIONS = ['긴급', '필수', '중요', '보통', '후순위'];
const CATEGORY_OPTIONS = ['어학연수', '해외대학', '조기유학/캠프', '아트포폴', '견적시스템', '기타'];
const TASK_TYPE_OPTIONS = ['기능개선', '프로그램_신규', '프로그램_수정', '오류', '기타 유지보수', '검토요청', '프로젝트'];

const STATUS_COLORS: Record<string, string> = {
  '미시작': '#8c959f',
  '진행중': '#0969da',
  '검토요청': '#bf8700',
  '피드백': '#f97316',
  '보류': '#6b7280',
  '완료': '#1a7f37',
  'N/A': '#d0d7de',
};

const PRIORITY_COLORS: Record<string, string> = {
  '긴급': '#ef4444', '필수': '#f97316', '중요': '#eab308', '보통': '#8c959f', '후순위': '#d0d7de',
};

function StatusBadge({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const color = STATUS_COLORS[value] ?? '#8c959f';
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap"
        style={{ backgroundColor: color + '22', color }}
      >
        {value}
        <ChevronDown size={9} />
      </button>
      {open && (
        <div className="absolute top-6 left-0 z-30 bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-lg shadow-xl overflow-hidden min-w-[100px]">
          {STAGE_STATUS.map((s) => (
            <button key={s} onClick={() => { onChange(s); setOpen(false); }}
              className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] ${value === s ? 'font-semibold' : ''}`}
              style={{ color: STATUS_COLORS[s] }}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Add Task Modal ─────────────────────────────────────────────────────────────
function AddTaskModal({ projectId, members, onClose, onAdd }: {
  projectId: string; members: WorkUser[];
  onClose: () => void; onAdd: (task: Task) => void;
}) {
  const [form, setForm] = useState({
    title: '', description: '', category: '', taskType: '', requester: '',
    externalLink: '', priority: '보통', dueDate: '', assigneeId: '',
    planningStatus: '미시작', designStatus: '미시작', publishStatus: '미시작', devStatus: '미시작',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('업무 내용을 입력하세요.'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/work/tasks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, status: '기획', ...form, assigneeId: form.assigneeId || null }),
      });
      if (!res.ok) { setError((await res.json()).error ?? '실패'); return; }
      onAdd(await res.json());
      onClose();
    } finally { setSaving(false); }
  };

  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider mb-1">{label}</label>
      {children}
    </div>
  );

  const inputCls = "w-full px-3 py-2 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#0969da] placeholder-[#8c959f]";
  const selectCls = `${inputCls} appearance-none cursor-pointer`;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#d0d7de] dark:border-[#30363d] sticky top-0 bg-white dark:bg-[#161b22] z-10">
          <h2 className="font-semibold text-[#24292f] dark:text-[#e6edf3]">업무 추가</h2>
          <button onClick={onClose}><X size={18} className="text-[#57606a]" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <F label="상세 업무 내용 *">
            <textarea value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              rows={2} placeholder="업무 내용을 입력하세요" autoFocus className={inputCls + ' resize-none'} />
          </F>
          <F label="설명">
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2} placeholder="추가 설명" className={inputCls + ' resize-none'} />
          </F>

          <div className="grid grid-cols-2 gap-4">
            <F label="구분">
              <div className="relative">
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className={selectCls}>
                  <option value="">선택</option>
                  {CATEGORY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#57606a] pointer-events-none" />
              </div>
            </F>
            <F label="작업 종류">
              <div className="relative">
                <select value={form.taskType} onChange={(e) => setForm((f) => ({ ...f, taskType: e.target.value }))} className={selectCls}>
                  <option value="">선택</option>
                  {TASK_TYPE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#57606a] pointer-events-none" />
              </div>
            </F>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <F label="담당자">
              <div className="relative">
                <select value={form.assigneeId} onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))} className={selectCls}>
                  <option value="">없음</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.name ?? m.email.split('@')[0]}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#57606a] pointer-events-none" />
              </div>
            </F>
            <F label="요청자">
              <input value={form.requester} onChange={(e) => setForm((f) => ({ ...f, requester: e.target.value }))} placeholder="요청자 이름" className={inputCls} />
            </F>
            <F label="중요도">
              <div className="relative">
                <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} className={selectCls}>
                  {PRIORITY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#57606a] pointer-events-none" />
              </div>
            </F>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <F label="목표일">
              <input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} className={inputCls} />
            </F>
            <F label="링크">
              <input value={form.externalLink} onChange={(e) => setForm((f) => ({ ...f, externalLink: e.target.value }))} placeholder="https://..." className={inputCls} />
            </F>
          </div>

          {/* Stage statuses */}
          <div className="border border-[#d0d7de] dark:border-[#30363d] rounded-xl overflow-hidden">
            <div className="bg-[#f6f8fa] dark:bg-[#0d1117] px-4 py-2 text-xs font-semibold text-[#57606a] uppercase tracking-wider border-b border-[#d0d7de] dark:border-[#30363d]">
              단계별 상태
            </div>
            <div className="grid grid-cols-4 divide-x divide-[#d0d7de] dark:divide-[#30363d]">
              {([
                ['기획', 'planningStatus'],
                ['디자인', 'designStatus'],
                ['퍼블', 'publishStatus'],
                ['개발', 'devStatus'],
              ] as const).map(([label, key]) => (
                <div key={key} className="p-3">
                  <p className="text-[10px] font-semibold text-[#57606a] uppercase mb-2">{label}</p>
                  <div className="relative">
                    <select value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full appearance-none px-2 py-1 text-xs border border-[#d0d7de] dark:border-[#30363d] rounded bg-white dark:bg-[#0d1117] text-[#24292f] dark:text-[#e6edf3] focus:outline-none cursor-pointer"
                      style={{ color: STATUS_COLORS[form[key]] }}>
                      {STAGE_STATUS.map((s) => <option key={s} value={s} style={{ color: STATUS_COLORS[s] }}>{s}</option>)}
                    </select>
                    <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#57606a] pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[#57606a]">취소</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#0969da] text-white text-sm font-medium rounded-lg disabled:opacity-50">
              {saving && <Loader2 size={14} className="animate-spin" />}추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function WorkOpsTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<WorkUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  useEffect(() => {
    fetch('/api/work/projects').then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) { setProjects(data); if (data.length > 0) setSelectedProject(data[0].id); }
    });
  }, []);

  const fetchData = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      const [tr, mr] = await Promise.all([
        fetch(`/api/work/tasks?projectId=${selectedProject}`),
        fetch(`/api/work/members?projectId=${selectedProject}`),
      ]);
      if (tr.ok) setTasks(await tr.json());
      if (mr.ok) { const d: Member[] = await mr.json(); setMembers(d.map((m) => m.user)); }
    } finally { setLoading(false); }
  }, [selectedProject]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStageUpdate = async (taskId: string, field: string, value: string) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, [field]: value } : t));
    await fetch('/api/work/tasks', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, [field]: value }),
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 업무를 삭제할까요?')) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/work/tasks?id=${id}`, { method: 'DELETE' });
  };

  // Filters
  const filtered = tasks.filter((t) => {
    const q = search.toLowerCase();
    if (q && !t.title.toLowerCase().includes(q) && !t.requester.toLowerCase().includes(q) && !(t.assignee?.name ?? '').toLowerCase().includes(q)) return false;
    if (filterStatus) {
      const allStatuses = [t.planningStatus, t.designStatus, t.publishStatus, t.devStatus];
      if (!allStatuses.includes(filterStatus)) return false;
    }
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  const activeProject = projects.find((p) => p.id === selectedProject);

  const completedCount = tasks.filter((t) =>
    t.planningStatus === '완료' && t.designStatus === '완료' && t.publishStatus === '완료' && t.devStatus === '완료'
  ).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[#24292f] dark:text-[#e6edf3]">운영 현황</h1>
          {/* Project selector */}
          {projects.length > 0 && (
            <div className="relative">
              <select value={selectedProject ?? ''} onChange={(e) => setSelectedProject(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-sm bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-[#24292f] dark:text-[#e6edf3] focus:outline-none cursor-pointer">
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#57606a] pointer-events-none" />
            </div>
          )}
          {tasks.length > 0 && (
            <span className="text-xs text-[#57606a] dark:text-[#8b949e]">
              완료 {completedCount}/{tasks.length}
              {' '}({Math.round(completedCount / tasks.length * 100)}%)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8c959f]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="검색..."
              className="pl-8 pr-3 py-1.5 text-sm bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#0969da] w-40" />
          </div>
          {/* Filter status */}
          <div className="relative">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 text-sm bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-[#57606a] dark:text-[#8b949e] focus:outline-none cursor-pointer">
              <option value="">전체 상태</option>
              {STAGE_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#57606a] pointer-events-none" />
          </div>
          {/* Filter priority */}
          <div className="relative">
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 text-sm bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-[#57606a] dark:text-[#8b949e] focus:outline-none cursor-pointer">
              <option value="">전체 중요도</option>
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#57606a] pointer-events-none" />
          </div>
          <button onClick={() => setShowAdd(true)} disabled={!selectedProject}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0969da] hover:bg-[#0860ca] text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors">
            <Plus size={15} />업무 추가
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 size={24} className="animate-spin text-[#57606a]" /></div>
      ) : (
        <div className="bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 1100 }}>
              <thead>
                <tr className="bg-[#f6f8fa] dark:bg-[#0d1117] border-b border-[#d0d7de] dark:border-[#30363d]">
                  {[
                    { label: '담당', w: 90 },
                    { label: '목표일', w: 90 },
                    { label: '구분', w: 80 },
                    { label: '상세 업무 내용', w: 260 },
                    { label: '중요도', w: 70 },
                    { label: '기획', w: 90 },
                    { label: '디자인', w: 90 },
                    { label: '퍼블', w: 90 },
                    { label: '개발', w: 90 },
                    { label: '요청자', w: 80 },
                    { label: '링크', w: 50 },
                    { label: '', w: 36 },
                  ].map((col) => (
                    <th key={col.label} style={{ width: col.w, minWidth: col.w }}
                      className="px-3 py-2.5 text-left text-[10px] font-semibold text-[#57606a] uppercase tracking-wider">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeef2] dark:divide-[#21262d]">
                {filtered.length === 0 ? (
                  <tr><td colSpan={12} className="text-center py-16 text-sm text-[#57606a]">
                    {tasks.length === 0 ? '업무를 추가해보세요' : '검색 결과가 없어요'}
                  </td></tr>
                ) : filtered.map((task) => {
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                  const prColor = PRIORITY_COLORS[task.priority] ?? '#8c959f';
                  return (
                    <tr key={task.id} className="hover:bg-[#f6f8fa] dark:hover:bg-[#0d1117] group transition-colors">
                      {/* 담당 */}
                      <td className="px-3 py-2">
                        {task.assignee ? (
                          <div className="flex items-center gap-1.5">
                            {task.assignee.avatarUrl
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={task.assignee.avatarUrl} alt="" width={20} height={20} className="w-5 h-5 rounded-full shrink-0" />
                              : <div className="w-5 h-5 rounded-full bg-[#eaeef2] dark:bg-[#30363d] shrink-0" />
                            }
                            <span className="text-xs text-[#24292f] dark:text-[#e6edf3] truncate max-w-[60px]">
                              {task.assignee.name ?? task.assignee.email.split('@')[0]}
                            </span>
                          </div>
                        ) : <span className="text-xs text-[#8c959f]">—</span>}
                      </td>
                      {/* 목표일 */}
                      <td className="px-3 py-2">
                        <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-[#57606a] dark:text-[#8b949e]'}`}>
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
                            : '—'}
                        </span>
                      </td>
                      {/* 구분 */}
                      <td className="px-3 py-2">
                        <span className="text-xs text-[#57606a] dark:text-[#8b949e] truncate block max-w-[72px]">
                          {task.category || '—'}
                        </span>
                      </td>
                      {/* 상세 업무 내용 */}
                      <td className="px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-[#24292f] dark:text-[#e6edf3] line-clamp-2 leading-snug">{task.title}</p>
                          {task.taskType && (
                            <span className="text-[10px] text-[#8c959f] bg-[#f6f8fa] dark:bg-[#21262d] px-1.5 py-0.5 rounded mt-0.5 inline-block">
                              {task.taskType}
                            </span>
                          )}
                        </div>
                      </td>
                      {/* 중요도 */}
                      <td className="px-3 py-2">
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: prColor + '22', color: prColor }}>
                          {task.priority}
                        </span>
                      </td>
                      {/* 기획/디자인/퍼블/개발 */}
                      {(['planningStatus', 'designStatus', 'publishStatus', 'devStatus'] as const).map((field) => (
                        <td key={field} className="px-3 py-2">
                          <StatusBadge value={task[field]} onChange={(v) => handleStageUpdate(task.id, field, v)} />
                        </td>
                      ))}
                      {/* 요청자 */}
                      <td className="px-3 py-2">
                        <span className="text-xs text-[#57606a] dark:text-[#8b949e]">{task.requester || '—'}</span>
                      </td>
                      {/* 링크 */}
                      <td className="px-3 py-2">
                        {task.externalLink ? (
                          <a href={task.externalLink} target="_blank" rel="noopener noreferrer"
                            className="text-[#0969da] hover:text-[#0860ca] transition-colors">
                            <ExternalLink size={14} />
                          </a>
                        ) : <span className="text-[#d0d7de]">—</span>}
                      </td>
                      {/* Delete */}
                      <td className="px-2 py-2">
                        <button onClick={() => handleDelete(task.id)}
                          className="text-[#8c959f] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1">
                          <X size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAdd && selectedProject && (
        <AddTaskModal
          projectId={selectedProject}
          members={members}
          onClose={() => setShowAdd(false)}
          onAdd={(task) => setTasks((prev) => [task, ...prev])}
        />
      )}
    </div>
  );
}
