'use client';

import { useState, useEffect } from 'react';
import { Plus, FolderKanban, Users, CheckSquare, Loader2, X } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  status: string;
  createdAt: string;
  role: string;
  _count: { tasks: number; members: number };
}

const COLOR_OPTIONS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6',
];

export default function WorkProjectsTab({ onSelectProject }: { onSelectProject: (id: string) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' });
  const [error, setError] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/work/projects');
      if (res.ok) setProjects(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('프로젝트 이름을 입력하세요.'); return; }
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/work/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? '생성 실패'); return; }
      setShowCreate(false);
      setForm({ name: '', description: '', color: '#6366f1' });
      await fetchProjects();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#24292f] dark:text-[#e6edf3]">프로젝트</h1>
          <p className="text-sm text-[#57606a] dark:text-[#8b949e] mt-0.5">팀의 프로젝트를 관리하세요</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1f2328] dark:bg-[#f0f6fc] text-white dark:text-[#1f2328] text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          새 프로젝트
        </button>
      </div>

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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className="text-left p-5 bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-xl hover:border-[#0969da] dark:hover:border-[#388bfd] hover:shadow-sm transition-all group"
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: project.color + '22', border: `2px solid ${project.color}33` }}
                >
                  <FolderKanban size={18} style={{ color: project.color }} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-[#24292f] dark:text-[#e6edf3] truncate group-hover:text-[#0969da] dark:group-hover:text-[#388bfd] transition-colors">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-0.5 line-clamp-2">{project.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-[#57606a] dark:text-[#8b949e]">
                <span className="flex items-center gap-1">
                  <CheckSquare size={12} />
                  {project._count.tasks}개 태스크
                </span>
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {project._count.members}명
                </span>
                <span
                  className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{ backgroundColor: project.color + '22', color: project.color }}
                >
                  {project.role}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Create project modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#d0d7de] dark:border-[#30363d]">
              <h2 className="font-semibold text-[#24292f] dark:text-[#e6edf3]">새 프로젝트</h2>
              <button onClick={() => setShowCreate(false)} className="text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3]">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#24292f] dark:text-[#e6edf3] mb-1.5">프로젝트 이름 *</label>
                <input
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="예: 마케팅 Q2 캠페인"
                  className="w-full px-3 py-2 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] placeholder-[#8c959f] dark:placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#0969da] dark:focus:ring-[#388bfd]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#24292f] dark:text-[#e6edf3] mb-1.5">설명 (선택)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="프로젝트의 목표와 범위를 입력하세요"
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] placeholder-[#8c959f] dark:placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#0969da] dark:focus:ring-[#388bfd] resize-none"
                />
              </div>
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
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3]">취소</button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1f2328] dark:bg-[#f0f6fc] text-white dark:text-[#1f2328] text-sm font-medium rounded-lg disabled:opacity-50"
                >
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  만들기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
