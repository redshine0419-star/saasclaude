import Link from 'next/link';
import type { ChecklistItem } from '@/lib/setup-checklist';

export function SetupChecklist({ items, slug, welcome }: { items: ChecklistItem[]; slug: string; welcome: boolean }) {
  const done = items.filter((i) => i.done).length;
  const todo = items.filter((i) => !i.done);
  if (todo.length === 0 && !welcome) return null;
  const pct = Math.round((done / items.length) * 100);

  return (
    <section style={{ padding: 24, background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {welcome && (
        <div style={{ padding: '14px 16px', borderRadius: 10, background: '#E4EEE9', color: '#1E5645', fontSize: 15, lineHeight: 1.6 }}>
          <b>홈페이지가 공개되었습니다.</b>{' '}
          <Link href={`/${slug}`} target="_blank" style={{ color: '#1E5645', fontWeight: 700 }}>growweb.me/{slug}</Link>
          <br />아래 항목을 채울수록 상담 신청이 늘어납니다. 비어 있는 섹션은 채울 때까지 자동으로 숨겨져 있습니다.
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 17, fontWeight: 700 }}>홈페이지 완성도</div>
        <div style={{ fontSize: 14, color: '#5A6270' }}>{done} / {items.length} 완료</div>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: '#EEEAE2', overflow: 'hidden' }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#1E5645' }} />
      </div>
      {todo.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {todo.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid #E2DDD2', borderRadius: 8, textDecoration: 'none', color: '#1B2430' }}
              >
                <span aria-hidden="true" style={{ width: 18, height: 18, borderRadius: 9, border: '2px solid #C8CDD5', flexShrink: 0 }} />
                <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{item.label}</span>
                  <span style={{ fontSize: 13, color: '#5A6270' }}>{item.why}</span>
                </span>
                <span style={{ fontSize: 13, color: '#1E5645', fontWeight: 600, whiteSpace: 'nowrap' }}>입력하기 →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
