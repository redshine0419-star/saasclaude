'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, FolderKanban, Users, CheckSquare, Loader2, X, MoreVertical, Pencil, Trash2 } from 'lucide-react';

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

function ProjectFormModal({
  title,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  initial?: { name: string; description: string; color: string };
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; color: string }) => Promise<void>;
}) {
  const [form, setForm] = useState(initial ?? { name: '', description: '', color: '#6366f1' });
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

  return (
    <div className="relative bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-xl hover:border-[#0969da] dark:hover:border-[#388bfd] hover:shadow-sm transition-all group">
      {/* Clickable area */}
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

export default function WorkProjectsTab({ onSelectProject }: { onSelectProject: (id: string) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleCreate = async (form: { name: string; description: string; color: string }) => {
    const res = await fetch('/api/work/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? '생성 실패'); }
    setShowCreate(false);
    await fetchProjects();
  };

  const handleEdit = async (form: { name: string; description: string; color: string }) => {
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
      )}

      {showCreate && (
        <ProjectFormModal title="새 프로젝트" onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
      )}
      {editingProject && (
        <ProjectFormModal
          title="프로젝트 편집"
          initial={{ name: editingProject.name, description: editingProject.description ?? '', color: editingProject.color }}
          onClose={() => setEditingProject(null)}
          onSubmit={handleEdit}
        />
      )}
    </div>
  );
}
