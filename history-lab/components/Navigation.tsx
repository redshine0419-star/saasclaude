'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Tv, Trophy, Home, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/', label: '홈', icon: Home },
  { href: '/story', label: '역사 이야기', icon: BookOpen },
  { href: '/exam', label: '퀴즈 도전', icon: Trophy },
  { href: '/media', label: '역사 미디어', icon: Tv },
];

export default function Navigation() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b" style={{ backgroundColor: 'rgba(26,18,8,0.95)', borderColor: 'var(--border)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">⚗️</span>
            <span className="text-xl font-bold text-gold-gradient" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.05em' }}>
              HISTORY LAB
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    color: active ? 'var(--gold)' : 'var(--cream-muted)',
                    backgroundColor: active ? 'rgba(212,168,67,0.12)' : 'transparent',
                  }}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg"
            style={{ color: 'var(--cream-muted)' }}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t px-4 py-3 space-y-1" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium w-full"
                  style={{
                    color: active ? 'var(--gold)' : 'var(--cream)',
                    backgroundColor: active ? 'rgba(212,168,67,0.12)' : 'transparent',
                  }}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden z-40 border-t" style={{ backgroundColor: 'rgba(26,18,8,0.97)', borderColor: 'var(--border)' }}>
        <div className="grid grid-cols-4">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center py-3 gap-1 text-xs"
                style={{ color: active ? 'var(--gold)' : 'var(--cream-muted)' }}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
