'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
  Zap, Sun, Moon, Bell, User, LogIn, LogOut,
  LayoutDashboard, ChevronLeft, ChevronRight, Menu, X,
} from 'lucide-react';
import { useDarkMode } from '@/components/DarkModeProvider';
import ProductSwitcher from '@/components/ProductSwitcher';

interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  adminOnly?: boolean;
}

interface SidebarLayoutProps {
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
  product: 'marketing' | 'work';
}

export default function SidebarLayout({
  navItems, activeTab, onTabChange, children, product,
}: SidebarLayoutProps) {
  const { dark, toggle } = useDarkMode();
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'admin';
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  // Close mobile sidebar on tab change
  useEffect(() => { setMobileOpen(false); }, [activeTab]);

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={`
      flex flex-col h-full bg-[#0d1117] border-r border-[#21262d] transition-all duration-200
      ${mobile ? 'w-64' : collapsed ? 'w-[60px]' : 'w-56'}
    `}>
      {/* Logo */}
      <div className={`flex items-center h-14 border-b border-[#21262d] shrink-0 ${collapsed && !mobile ? 'justify-center px-2' : 'px-4 gap-2'}`}>
        <Link href="/" className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
          <Zap size={18} fill="currentColor" strokeWidth={0} className="shrink-0" />
          {(!collapsed || mobile) && (
            <span className="font-bold text-sm tracking-tight">
              MarketerOps<span className="text-[#555]  font-normal">.ai</span>
            </span>
          )}
        </Link>
        {!mobile && (
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="ml-auto text-[#555] hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        )}
      </div>

      {/* Product switcher */}
      {(!collapsed || mobile) && (
        <div className="px-3 py-3 border-b border-[#21262d] shrink-0">
          <ProductSwitcher />
        </div>
      )}
      {collapsed && !mobile && (
        <div className="py-3 border-b border-[#21262d] flex justify-center shrink-0">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: product === 'marketing' ? '#6366f1' : '#22c55e' }} />
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
        {visibleItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              title={collapsed && !mobile ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-white/10 text-white'
                  : 'text-[#8b949e] hover:text-white hover:bg-white/5'
              } ${collapsed && !mobile ? 'justify-center' : ''}`}
            >
              <span className="shrink-0">{item.icon}</span>
              {(!collapsed || mobile) && <span className="truncate">{item.label}</span>}
              {active && (!collapsed || mobile) && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white shrink-0" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User section */}
      <div className={`shrink-0 border-t border-[#21262d] py-3 px-2 space-y-1`}>
        {/* Dark mode */}
        <button
          onClick={toggle}
          className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-[#8b949e] hover:text-white hover:bg-white/5 transition-colors text-sm ${collapsed && !mobile ? 'justify-center' : ''}`}
          title={dark ? 'Light mode' : 'Dark mode'}
        >
          {dark ? <Sun size={16} className="shrink-0" /> : <Moon size={16} className="shrink-0" />}
          {(!collapsed || mobile) && <span>{dark ? '라이트 모드' : '다크 모드'}</span>}
        </button>

        {/* Auth */}
        {session?.user ? (
          <div className={`flex items-center gap-2 px-2.5 py-2 ${collapsed && !mobile ? 'justify-center' : ''}`}>
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="avatar" width={28} height={28} className="w-7 h-7 rounded-full border border-[#30363d] shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center shrink-0">
                <User size={14} className="text-[#8b949e]" />
              </div>
            )}
            {(!collapsed || mobile) && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{session.user.name ?? session.user.email}</p>
                  <p className="text-[10px] text-[#8b949e] truncate">{session.user.email}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: product === 'work' ? '/work' : '/app' })}
                  className="text-[#8b949e] hover:text-white transition-colors"
                  title="로그아웃"
                >
                  <LogOut size={14} />
                </button>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={() => signIn('google', { callbackUrl: product === 'work' ? '/work' : '/app' })}
            className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-[#8b949e] hover:text-white hover:bg-white/5 transition-colors text-sm ${collapsed && !mobile ? 'justify-center' : ''}`}
          >
            <LogIn size={16} className="shrink-0" />
            {(!collapsed || mobile) && <span>로그인</span>}
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-[#f6f8fa] dark:bg-[#010409] font-sans text-[#24292f] dark:text-[#e6edf3] overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full z-50">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile only) */}
        <header className="md:hidden flex items-center justify-between px-4 h-12 bg-[#0d1117] border-b border-[#21262d] shrink-0">
          <button onClick={() => setMobileOpen(true)} className="text-[#8b949e] hover:text-white">
            <Menu size={20} />
          </button>
          <Link href="/" className="flex items-center gap-2 text-white font-bold text-sm">
            <Zap size={16} fill="currentColor" strokeWidth={0} />
            MarketerOps.ai
          </Link>
          <button className="relative text-[#8b949e] hover:text-white">
            <Bell size={18} />
          </button>
        </header>

        {/* Page title bar */}
        <div className="hidden md:flex items-center justify-between px-6 h-12 bg-white dark:bg-[#0d1117] border-b border-[#eaeef2] dark:border-[#21262d] shrink-0">
          <h1 className="text-sm font-semibold text-[#24292f] dark:text-[#e6edf3]">
            {visibleItems.find((i) => i.id === activeTab)?.label ?? ''}
          </h1>
          <div className="flex items-center gap-2">
            <button className="relative p-1.5 text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-white rounded-md transition-colors">
              <Bell size={16} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#0969da] rounded-full" />
            </button>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 pb-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
