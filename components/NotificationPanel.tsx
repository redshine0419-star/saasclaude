'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, Trash2, Bot } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR');
}

export default function NotificationPanel({ iconSize = 16, dark = false }: { iconSize?: number; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ readAll: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = async (id: string, wasUnread: boolean) => {
    await fetch('/api/notifications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleOpen = () => {
    setOpen((v) => !v);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className={`relative p-1.5 rounded-md transition-colors ${
          dark
            ? 'text-[#8b949e] hover:text-white'
            : 'text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-white'
        }`}
      >
        <Bell size={iconSize} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 bg-[#cf222e] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117]">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-[#57606a] dark:text-[#8b949e]" />
              <span className="text-sm font-semibold text-[#24292f] dark:text-[#e6edf3]">알림</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#cf222e] text-white rounded-full">{unreadCount}</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] text-[#0969da] hover:text-[#0550ae] font-medium flex items-center gap-1 transition-colors"
              >
                <CheckCheck size={12} />
                모두 읽음
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-[#d0d7de] dark:divide-[#21262d]">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell size={24} className="mx-auto text-[#d0d7de] dark:text-[#30363d] mb-2" />
                <p className="text-sm text-[#57606a] dark:text-[#8b949e]">알림이 없습니다</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 hover:bg-[#f6f8fa] dark:hover:bg-[#0d1117] transition-colors ${!n.read ? 'bg-[#ddf4ff] dark:bg-[#051d4d]/30' : ''}`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${n.type === 'ai-pm' ? 'bg-[#8250df]/10' : 'bg-[#eaeef2] dark:bg-[#21262d]'}`}>
                      <Bot size={12} className={n.type === 'ai-pm' ? 'text-[#8250df]' : 'text-[#57606a]'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-[#24292f] dark:text-[#e6edf3] truncate">{n.title}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          {!n.read && (
                            <button
                              onClick={() => markRead(n.id)}
                              className="text-[#8b949e] hover:text-[#0969da] transition-colors"
                              title="읽음 처리"
                            >
                              <CheckCheck size={12} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(n.id, !n.read)}
                            className="text-[#8b949e] hover:text-[#cf222e] transition-colors"
                            title="삭제"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#57606a] dark:text-[#8b949e] mt-0.5">{timeAgo(n.createdAt)}</p>
                      {expanded === n.id ? (
                        <p className="text-xs text-[#24292f] dark:text-[#c9d1d9] mt-1.5 leading-relaxed whitespace-pre-wrap">{n.body}</p>
                      ) : (
                        <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-1 line-clamp-2 leading-relaxed">{n.body}</p>
                      )}
                      <button
                        onClick={() => setExpanded(expanded === n.id ? null : n.id)}
                        className="text-[11px] text-[#0969da] hover:text-[#0550ae] mt-1 transition-colors"
                      >
                        {expanded === n.id ? '접기' : '전체 보기'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
