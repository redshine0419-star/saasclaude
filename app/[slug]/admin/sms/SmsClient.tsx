'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { smsHref } from '@/lib/messaging/sms-link';
import { SMS_VARS, type SmsKind, type TemplatedSmsKind } from '@/lib/sms/constants';

export type SmsRow = {
  id: string; kind: SmsKind; kindLabel: string; name: string; grade: string | null; href: string; hrefLabel: string;
  phone: string; phoneMasked: string; body: string; status: 'todo' | 'sent' | 'skipped'; doneAt: string | null; bySystem: boolean; createdAt: string;
};

const BTN: React.CSSProperties = { height: 42, padding: '0 14px', borderRadius: 8, border: '1px solid #D5D0C6', background: '#FFFFFF', font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#1B2430' };
const KIND_COLOR: Record<SmsKind, string> = { receipt: '#1E5645', reminder: '#1D4ED8', followup: '#8A5A00', test_link: '#6D28D9' };
const KIND_LABEL: Record<TemplatedSmsKind, string> = { receipt: '접수 확인', reminder: '레벨테스트 전날 안내', followup: '상담 후 안내' };
const fmt = (iso: string) => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));

function TodoCard({ slug, row, onDone }: { slug: string; row: SmsRow; onDone: (id: string) => void }) {
  const [body, setBody] = useState(row.body);
  const [copied, setCopied] = useState(false);
  const mark = (action: 'sent' | 'skip') =>
    fetch(`/api/${slug}/admin/sms/${row.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }), keepalive: true }).catch(() => undefined);

  return (
    <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ padding: '2px 8px', borderRadius: 6, background: KIND_COLOR[row.kind], color: '#FFFFFF', fontSize: 12, fontWeight: 700 }}>{row.kindLabel}</span>
        <b style={{ fontSize: 15 }}>{row.name}</b>
        {row.grade && <span style={{ fontSize: 13, color: '#5A6270' }}>{row.grade}</span>}
        <span style={{ fontSize: 13, color: '#8A93A0' }}>{row.phoneMasked}</span>
        <Link href={row.href} style={{ marginLeft: 'auto', fontSize: 13, color: '#5A6270' }}>{row.hrefLabel}</Link>
      </div>
      <textarea
        value={body}
        onChange={(e) => { setBody(e.target.value); setCopied(false); }}
        rows={4}
        maxLength={1000}
        aria-label="문자 내용"
        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14, lineHeight: 1.6, resize: 'vertical' }}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a
          href={row.phone ? smsHref(row.phone, body) : undefined}
          aria-disabled={!row.phone}
          onClick={() => { mark('sent'); window.setTimeout(() => onDone(row.id), 300); }}
          style={{ ...BTN, flex: '2 1 160px', border: 'none', background: '#1E5645', color: '#FFFFFF', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          문자 보내기
        </a>
        <button type="button" style={{ ...BTN, flex: '1 1 100px' }} onClick={async () => { await navigator.clipboard?.writeText(body).catch(() => undefined); setCopied(true); }}>
          {copied ? '복사됨 ✓' : '문구 복사'}
        </button>
        <button type="button" style={{ ...BTN, flex: '1 1 100px', color: '#5A6270' }} onClick={async () => { await mark('skip'); onDone(row.id); }}>건너뛰기</button>
      </div>
      <div style={{ fontSize: 12, color: '#8A93A0' }}>PC에서는 &ldquo;문구 복사&rdquo; 후 휴대폰에서 보내고, 보낸 뒤 &ldquo;문자 보내기&rdquo;를 눌러 완료로 표시하세요.</div>
    </div>
  );
}

export function SmsClient({ slug, todo, done, templates, defaults, isOwner }: {
  slug: string; todo: SmsRow[]; done: SmsRow[]; templates: Record<TemplatedSmsKind, string>; defaults: Record<TemplatedSmsKind, string>; isOwner: boolean;
}) {
  const router = useRouter();
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [tpl, setTpl] = useState(templates);
  const [saved, setSaved] = useState<TemplatedSmsKind | null>(null);
  const list = todo.filter((r) => !hidden.has(r.id));

  async function reopen(id: string) {
    await fetch(`/api/${slug}/admin/sms/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reopen' }) });
    router.refresh();
  }
  async function saveTpl(kind: TemplatedSmsKind) {
    const r = await fetch(`/api/${slug}/admin/sms/templates`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, body: tpl[kind] }) });
    if (r.ok) { setSaved(kind); window.setTimeout(() => setSaved(null), 2000); router.refresh(); }
  }

  return (
    <>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>지금 보낼 문자 {list.length > 0 && <span style={{ color: '#1E5645' }}>{list.length}건</span>}</div>
        {list.length === 0 ? (
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 28, textAlign: 'center', color: '#5A6270', fontSize: 14 }}>
            보낼 문자가 없습니다. 새 상담이 들어오거나 레벨테스트 전날·상담 후 2일이 지나면, 또는 학생에게 시험을 보내면 여기에 준비됩니다.
          </div>
        ) : (
          list.map((r) => <TodoCard key={r.id} slug={slug} row={r} onDone={(id) => { setHidden((s) => new Set(s).add(id)); router.refresh(); }} />)
        )}
      </section>

      {done.length > 0 && (
        <section style={{ background: '#FFFFFF', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', fontSize: 15, fontWeight: 700, borderBottom: '1px solid #EEEAE2' }}>최근 30일 처리한 문자</div>
          {done.map((r, i) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderTop: i ? '1px solid #F2EFE9' : 'none', fontSize: 14, flexWrap: 'wrap' }}>
              <span style={{ color: r.status === 'sent' ? '#1E5645' : '#8A93A0', fontWeight: 700, width: 54 }}>{r.status === 'sent' ? '보냄' : '건너뜀'}</span>
              <span style={{ flex: 1, minWidth: 0 }}>{r.name} · {r.kindLabel}{r.bySystem ? ' (자동 정리)' : ''}</span>
              <span style={{ fontSize: 12, color: '#8A93A0' }}>{r.doneAt ? fmt(r.doneAt) : ''}</span>
              <button type="button" onClick={() => reopen(r.id)} style={{ ...BTN, height: 32, fontSize: 12, padding: '0 10px' }}>되돌리기</button>
            </div>
          ))}
        </section>
      )}

      <section style={{ background: '#FFFFFF', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>문자 기본 문구</div>
          <div style={{ fontSize: 13, color: '#5A6270', marginTop: 4, lineHeight: 1.6 }}>
            쓸 수 있는 칸: {SMS_VARS.join(' ')} · 이 문구는 안내(정보성)용입니다. 특강·할인·모집 홍보를 넣으면 광고 문자가 되어 수신 동의·(광고) 표기·야간 금지 규정을 지켜야 합니다.
          </div>
        </div>
        {(Object.keys(KIND_LABEL) as TemplatedSmsKind[]).map((k) => (
          <label key={k} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{KIND_LABEL[k]}</span>
            <textarea
              value={tpl[k]}
              disabled={!isOwner}
              onChange={(e) => setTpl((p) => ({ ...p, [k]: e.target.value }))}
              rows={3}
              maxLength={1000}
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14, lineHeight: 1.6, resize: 'vertical', background: isOwner ? '#FFFFFF' : '#F4F2EE' }}
            />
            {isOwner && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button type="button" style={{ ...BTN, height: 34, fontSize: 13 }} onClick={() => saveTpl(k)}>저장</button>
                <button type="button" style={{ ...BTN, height: 34, fontSize: 13, color: '#5A6270' }} onClick={() => setTpl((p) => ({ ...p, [k]: defaults[k] }))}>기본 문구로</button>
                {saved === k && <span style={{ fontSize: 13, color: '#1E5645', fontWeight: 600 }}>저장됨 ✓</span>}
              </div>
            )}
          </label>
        ))}
        {!isOwner && <div style={{ fontSize: 12, color: '#8A93A0' }}>문구는 원장님만 바꿀 수 있습니다.</div>}
      </section>
    </>
  );
}
