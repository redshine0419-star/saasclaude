'use client';

import { useState, useEffect } from 'react';
import { Users, Loader2, FolderKanban, User2, Crown, ShieldCheck, UserPlus, X, Trash2 } from 'lucide-react';

interface Member {
  id: string;
  role: string;
  user: { id: string; name: string | null; email: string; avatarUrl: string | null };
}
interface Project { id: string; name: string; color: string; members: Member[] }

const ROLE_ICONS: Record<string, React.ReactNode> = {
  owner: <Crown size={12} className="text-yellow-500" />,
  admin: <ShieldCheck size={12} className="text-blue-500" />,
  member: <User2 size={12} className="text-[#57606a]" />,
};
const ROLE_LABELS: Record<string, string> = { owner: '소유자', admin: '관리자', member: '멤버' };

export default function WorkTeamTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data: { id: string; name: string; color: string }[] = await fetch('/api/work/projects').then((r) => r.json());
      if (!Array.isArray(data)) return;
      const detailed = await Promise.all(
        data.map(async (p) => {
          const res = await fetch(`/api/work/members?projectId=${p.id}`);
          const members = res.ok ? await res.json() : [];
          return { ...p, members };
        })
      );
      setProjects(detailed);
      if (detailed.length > 0 && !selectedProject) setSelectedProject(detailed[0].id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !selectedProject) return;
    setInviting(true);
    setInviteError('');
    setInviteSuccess('');
    try {
      const res = await fetch('/api/work/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProject, email: inviteEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setInviteError(data.error ?? '추가 실패'); return; }
      setInviteSuccess(`${data.user.name ?? data.user.email} 님이 추가됐습니다.`);
      setInviteEmail('');
      await fetchProjects();
      setTimeout(() => setInviteSuccess(''), 3000);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedProject) return;
    if (!confirm('이 멤버를 프로젝트에서 제거할까요?')) return;
    await fetch(`/api/work/members?projectId=${selectedProject}&userId=${userId}`, { method: 'DELETE' });
    await fetchProjects();
  };

  const project = projects.find((p) => p.id === selectedProject);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#24292f] dark:text-[#e6edf3]">팀 관리</h1>
          <p className="text-sm text-[#57606a] dark:text-[#8b949e] mt-0.5">프로젝트 멤버를 관리하세요</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={24} className="animate-spin text-[#57606a] dark:text-[#8b949e]" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[#d0d7de] dark:border-[#30363d] rounded-xl">
          <Users size={40} className="mx-auto text-[#8c959f] dark:text-[#484f58] mb-3" />
          <p className="text-[#57606a] dark:text-[#8b949e] font-medium">프로젝트가 없어요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Project list */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider px-2 mb-3">프로젝트</p>
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  selectedProject === p.id
                    ? 'bg-[#f0f6ff] dark:bg-[#1c2a3a] text-[#0969da] dark:text-[#388bfd]'
                    : 'text-[#24292f] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#161b22]'
                }`}
              >
                <FolderKanban size={15} style={{ color: p.color }} />
                <span className="text-sm font-medium truncate">{p.name}</span>
                <span className="ml-auto text-xs text-[#57606a] dark:text-[#8b949e]">{p.members.length}</span>
              </button>
            ))}
          </div>

          {/* Member list + invite */}
          <div className="md:col-span-2 space-y-4">
            {/* Invite form */}
            {project && (
              <div className="bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-xl p-4">
                <p className="text-sm font-semibold text-[#24292f] dark:text-[#e6edf3] mb-3 flex items-center gap-2">
                  <UserPlus size={15} />
                  멤버 추가
                </p>
                <form onSubmit={handleInvite} className="flex gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="이메일 입력 (서비스에 로그인한 사용자)"
                    className="flex-1 px-3 py-2 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] placeholder-[#8c959f] focus:outline-none focus:ring-2 focus:ring-[#0969da]"
                  />
                  <button
                    type="submit"
                    disabled={inviting || !inviteEmail.trim()}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#0969da] hover:bg-[#0860ca] text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {inviting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                    추가
                  </button>
                </form>
                {inviteError && <p className="text-xs text-red-500 mt-2">{inviteError}</p>}
                {inviteSuccess && <p className="text-xs text-green-600 dark:text-green-400 mt-2">{inviteSuccess}</p>}
                <p className="text-xs text-[#8c959f] dark:text-[#484f58] mt-2">
                  ※ 한 번이라도 서비스에 로그인한 사용자만 추가할 수 있어요
                </p>
              </div>
            )}

            {/* Member list */}
            {project ? (
              <div className="bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[#d0d7de] dark:border-[#30363d] flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-[#24292f] dark:text-[#e6edf3]">{project.name} 멤버</h3>
                  <span className="text-xs text-[#57606a] dark:text-[#8b949e]">{project.members.length}명</span>
                </div>
                <div className="divide-y divide-[#d0d7de] dark:divide-[#30363d]">
                  {project.members.length === 0 ? (
                    <div className="py-12 text-center text-sm text-[#57606a] dark:text-[#8b949e]">멤버 없음</div>
                  ) : (
                    project.members.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 px-4 py-3 group">
                        {m.user.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.user.avatarUrl} alt={m.user.name ?? ''} width={36} height={36} className="w-9 h-9 rounded-full border border-[#d0d7de] dark:border-[#30363d]" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#eaeef2] dark:bg-[#30363d] flex items-center justify-center">
                            <User2 size={16} className="text-[#57606a] dark:text-[#8b949e]" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#24292f] dark:text-[#e6edf3] truncate">
                            {m.user.name ?? m.user.email}
                          </p>
                          <p className="text-xs text-[#57606a] dark:text-[#8b949e] truncate">{m.user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-full">
                            {ROLE_ICONS[m.role]}
                            <span className="text-[11px] text-[#57606a] dark:text-[#8b949e]">{ROLE_LABELS[m.role] ?? m.role}</span>
                          </div>
                          {m.role !== 'owner' && (
                            <button
                              onClick={() => handleRemoveMember(m.user.id)}
                              className="text-[#8c959f] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                              title="멤버 제거"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-[#57606a] dark:text-[#8b949e] text-sm">
                프로젝트를 선택하세요
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
