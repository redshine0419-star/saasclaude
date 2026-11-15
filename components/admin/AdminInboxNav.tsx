'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Counts = { unread: number; smsDue: number };

/** 관리자 화면 공통: 화면을 열 때와 1분마다 알림함·보낼 문자 수를 가져온다 */
export function useInboxCounts(slug: string): Counts {
  const [c, setC] = useState<Counts>({ unread: 0, smsDue: 0 });
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch(`/api/${slug}/admin/inbox`, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => alive && d && setC({ unread: d.unread ?? 0, smsDue: d.smsDue ?? 0 }))
        .catch(() => undefined);
    load();
    const t = window.setInterval(load, 60_000);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => { alive = false; window.clearInterval(t); window.removeEventListener('focus', onFocus); };
  }, [slug]);
  return c;
}

const badge = (n: number, color = '#F2C94C') =>
  n > 0 ? (
    <span style={{ minWidth: 22, padding: '0 6px', borderRadius: 11, background: color, color: '#1B2430', fontSize: 12, fontWeight: 700, textAlign: 'center', lineHeight: '22px' }}>
      {n > 99 ? '99+' : n}
    </span>
  ) : null;

function Item({ href, label, active, n }: { href: string; label: string; active: boolean; n: number }) {
  return (
    <Link
      href={href}
      style={{
        padding: '11px 12px', borderRadius: 8, background: active ? '#2C3747' : 'transparent', color: active ? '#FFFFFF' : '#C8CDD5',
        fontWeight: active ? 600 : 400, textDecoration: 'none', fontSize: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}
    >
      {label}
      {badge(n)}
    </Link>
  );
}

/** 사이드 메뉴: 🔔 알림함 · ✉️ 보낼 문자 (배지) */
export function AdminInboxNav({ slug, active }: { slug: string; active: string }) {
  const c = useInboxCounts(slug);
  return (
    <>
      <Item href={`/${slug}/admin/notifications`} label="🔔 알림함" active={active === 'notifications'} n={c.unread} />
      <Item href={`/${slug}/admin/sms`} label="✉️ 보낼 문자" active={active === 'sms'} n={c.smsDue} />
    </>
  );
}

/** 모바일 상단 바 오른쪽 종 아이콘 */
export function AdminBell({ slug }: { slug: string }) {
  const c = useInboxCounts(slug);
  const total = c.unread + c.smsDue;
  return (
    <Link href={c.smsDue > 0 && c.unread === 0 ? `/${slug}/admin/sms` : `/${slug}/admin/notifications`} aria-label={`알림 ${total}건`} style={{ position: 'relative', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', flexShrink: 0 }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
      {total > 0 && (
        <span style={{ position: 'absolute', top: 4, right: 2, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 9, background: '#F2C94C', color: '#1B2430', fontSize: 11, fontWeight: 700, lineHeight: '18px', textAlign: 'center' }}>{total > 99 ? '99+' : total}</span>
      )}
    </Link>
  );
}
