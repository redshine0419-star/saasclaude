'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, LayoutDashboard } from 'lucide-react';

export default function ProductSwitcher() {
  const pathname = usePathname();
  const isWork = pathname.startsWith('/work');

  return (
    <div className="flex items-center gap-1 p-1 bg-white/10 rounded-xl">
      <Link
        href="/app"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
          !isWork
            ? 'bg-white text-slate-900'
            : 'text-white/70 hover:text-white hover:bg-white/10'
        }`}
      >
        <Zap size={12} fill="currentColor" strokeWidth={0} />
        마케팅
      </Link>
      <Link
        href="/work"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
          isWork
            ? 'bg-white text-slate-900'
            : 'text-white/70 hover:text-white hover:bg-white/10'
        }`}
      >
        <LayoutDashboard size={12} />
        업무관리
      </Link>
    </div>
  );
}
