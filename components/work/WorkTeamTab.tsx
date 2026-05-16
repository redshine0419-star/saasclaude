'use client';

import { useState, useEffect } from 'react';
import { Users, Loader2, FolderKanban, User2, Crown, ShieldCheck, UserPlus, X, Pencil, Check, Bot } from 'lucide-react';

interface Member {
  id: string;
  role: string;
  user: {
    id: string; name: string | null; email: string; avatarUrl: string | null;
    jobTitle: string | null; responsibilities: string | null; workStyle: string | null;
  };
}

interface ProfileEdit {
  jobTitle: string;
  responsibilities: string;
  workStyle: string;
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
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [profileEdit, setProfileEdit] = useState<ProfileEdit>({ jobTitle: '', responsibilities: '', workStyle: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [runningAiPm, setRunningAiPm] = useState(false);

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

  const handleEditProfile = (m: Member) => {
    setEditingUserId(m.user.id);
    setProfileEdit({
      jobTitle: m.user.jobTitle ?? '',
      responsibilities: m.user.responsibilities ?? '',
      workStyle: m.user.workStyle ?? '',
    });
  };

  const handleSaveProfile = async (userId: string) => {
    setSavingProfile(true);
    try {
      const res = await fetch('/api/work/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...profileEdit }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setEditingUserId(null);
      await fetchProjects();
    } catch (e) {
      alert('저장 실패: ' + (e as Error).message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRunAiPm = async () => {
    setRunningAiPm(true);
    try {
      const res = await fetch('/api/work/ai-pm', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`AI PM 분석 완료! 알림 ${data.notificationsCreated}건이 생성되었습니다.`);
    } catch (e) {
      alert('오류: ' + (e as Error).message);
    } finally {
      setRunningAiPm(false);
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
        <button
          onClick={handleRunAiPm}
          disabled={runningAiPm}
          className="flex items-center gap-2 px-3 py-2 bg-[#8250df] hover:bg-[#6e40c9] text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
        >
          {runningAiPm ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
          AI PM 분석 실행
        </button>
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
                      <div key={m.id} className="px-4 py-3 group">
                        <div className="flex items-center gap-3">
                          {m.user.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.user.avatarUrl} alt={m.user.name ?? ''} width={36} height={36} className="w-9 h-9 rounded-full border border-[#d0d7de] dark:border-[#30363d] shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#eaeef2] dark:bg-[#30363d] flex items-center justify-center shrink-0">
                              <User2 size={16} className="text-[#57606a] dark:text-[#8b949e]" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#24292f] dark:text-[#e6edf3] truncate">
                              {m.user.name ?? m.user.email}
                            </p>
                            <p className="text-xs text-[#57606a] dark:text-[#8b949e] truncate">{m.user.email}</p>
                            {m.user.jobTitle && (
                              <p className="text-xs text-[#8250df] mt-0.5 truncate">{m.user.jobTitle}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-full">
                              {ROLE_ICONS[m.role]}
                              <span className="text-[11px] text-[#57606a] dark:text-[#8b949e]">{ROLE_LABELS[m.role] ?? m.role}</span>
                            </div>
                            <button
                              onClick={() => editingUserId === m.user.id ? setEditingUserId(null) : handleEditProfile(m)}
                              className="text-[#8c959f] hover:text-[#8250df] transition-colors opacity-0 group-hover:opacity-100 p-1"
                              title="프로필 편집"
                            >
                              <Pencil size={13} />
                            </button>
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

                        {/* Inline profile edit form */}
                        {editingUserId === m.user.id && (
                          <div className="mt-3 ml-12 space-y-2 border-l-2 border-[#8250df]/30 pl-3">
                            <div>
                              <label className="block text-[10px] font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider mb-1">직책</label>
                              <input
                                type="text"
                                value={profileEdit.jobTitle}
                                onChange={(e) => setProfileEdit((p) => ({ ...p, jobTitle: e.target.value }))}
                                placeholder="예: 프론트엔드 개발자, 기획 PM"
                                className="w-full px-2.5 py-1.5 text-xs border border-[#d0d7de] dark:border-[#30363d] rounded-md bg-white dark:bg-[#0d1117] text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:border-[#8250df]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider mb-1">담당 업무</label>
                              <input
                                type="text"
                                value={profileEdit.responsibilities}
                                onChange={(e) => setProfileEdit((p) => ({ ...p, responsibilities: e.target.value }))}
                                placeholder="예: 결제 시스템, UI 컴포넌트 개발"
                                className="w-full px-2.5 py-1.5 text-xs border border-[#d0d7de] dark:border-[#30363d] rounded-md bg-white dark:bg-[#0d1117] text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:border-[#8250df]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider mb-1">업무 성향</label>
                              <input
                                type="text"
                                value={profileEdit.workStyle}
                                onChange={(e) => setProfileEdit((p) => ({ ...p, workStyle: e.target.value }))}
                                placeholder="예: 꼼꼼함, 빠른 실행, 커뮤니케이션 선호"
                                className="w-full px-2.5 py-1.5 text-xs border border-[#d0d7de] dark:border-[#30363d] rounded-md bg-white dark:bg-[#0d1117] text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:border-[#8250df]"
                              />
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => handleSaveProfile(m.user.id)}
                                disabled={savingProfile}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8250df] hover:bg-[#6e40c9] text-white text-xs font-medium rounded-md disabled:opacity-50 transition-colors"
                              >
                                {savingProfile ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                                저장
                              </button>
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="px-3 py-1.5 text-xs text-[#57606a] hover:text-[#24292f] dark:hover:text-[#e6edf3] border border-[#d0d7de] dark:border-[#30363d] rounded-md transition-colors"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        )}
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
