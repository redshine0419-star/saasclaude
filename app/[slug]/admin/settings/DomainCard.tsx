'use client';

import { useState } from 'react';
import type { DnsRecord } from '@/lib/domains/validate';

type Props = {
  slug: string;
  available: boolean;
  domain: string | null;
  status: string | null;
  records: DnsRecord[];
};

const box: React.CSSProperties = { padding: 24, background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 14 };

export function DomainCard({ slug, available, domain: initDomain, status: initStatus, records: initRecords }: Props) {
  const [domain, setDomain] = useState(initDomain);
  const [status, setStatus] = useState(initStatus);
  const [records, setRecords] = useState(initRecords);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function call(action: 'connect' | 'check' | 'disconnect') {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/${slug}/admin/domain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, domain: input }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ text: data.error ?? '처리하지 못했습니다.', ok: false }); return; }
      if (action === 'disconnect') {
        setDomain(null); setStatus(null); setRecords([]);
        setMsg({ text: '연결을 해제했습니다.', ok: true });
        return;
      }
      setDomain(data.domain); setStatus(data.status); setRecords(data.records ?? []);
      if (action === 'check') {
        setMsg(data.status === 'verified'
          ? { text: '연결되었습니다. 이제 이 주소로 홈페이지가 열립니다.', ok: true }
          : { text: '아직 연결되지 않았습니다. DNS 변경은 반영까지 최대 몇 시간 걸릴 수 있습니다.', ok: false });
      }
    } finally {
      setBusy(false);
    }
  }

  const btn = (primary: boolean): React.CSSProperties => ({
    height: 40, padding: '0 16px', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: busy ? 'wait' : 'pointer',
    border: primary ? 'none' : '1px solid #D5D0C6', background: primary ? '#1E5645' : '#FFFFFF', color: primary ? '#FFFFFF' : '#1B2430',
  });

  return (
    <div style={{ ...box, gridColumn: '1 / -1' }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>내 도메인 연결</div>
        <div style={{ fontSize: 13, color: '#5A6270', marginTop: 4 }}>
          학원 소유의 도메인(예: hanul-math.com)으로 홈페이지를 열 수 있습니다. growweb.me/{slug} 주소도 계속 작동합니다.
        </div>
      </div>

      {!available ? (
        <div style={{ fontSize: 14, color: '#5A6270' }}>도메인 연결 기능을 준비 중입니다.</div>
      ) : !domain ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="hanul-math.com"
            autoCapitalize="none"
            spellCheck={false}
            style={{ height: 40, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, fontSize: 14, minWidth: 220, flex: 1, maxWidth: 360 }}
          />
          <button type="button" disabled={busy || !input.trim()} onClick={() => call('connect')} style={btn(true)}>
            {busy ? '처리 중…' : '연결 시작'}
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'monospace' }}>{domain}</span>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: status === 'verified' ? '#D8E8E0' : '#FBF1CF', color: status === 'verified' ? '#1E5645' : '#5A4A12' }}>
              {status === 'verified' ? '연결됨' : 'DNS 설정 대기'}
            </span>
            {status === 'verified' && (
              <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#1E5645', fontWeight: 600 }}>열어보기 →</a>
            )}
          </div>

          {status !== 'verified' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 14 }}>도메인을 산 곳(가비아, 후이즈, 카페24 등)의 <b>DNS 관리</b>에서 아래 레코드를 추가한 뒤 &lsquo;연결 확인&rsquo;을 눌러 주세요.</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 13, minWidth: 420 }}>
                  <thead>
                    <tr style={{ background: '#F4F2EE' }}>
                      {['타입', '호스트(이름)', '값'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '8px 12px' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={`${r.type}-${r.name}-${r.value}`} style={{ borderBottom: '1px solid #EEEAE2' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 700 }}>{r.type}</td>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{r.name}</td>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{r.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {status !== 'verified' && (
              <button type="button" disabled={busy} onClick={() => call('check')} style={btn(true)}>{busy ? '확인 중…' : '연결 확인'}</button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => { if (confirm(`${domain} 연결을 해제할까요?`)) call('disconnect'); }}
              style={btn(false)}
            >
              연결 해제
            </button>
          </div>
        </>
      )}

      {msg && <div role="status" style={{ fontSize: 13, fontWeight: 600, color: msg.ok ? '#1E5645' : '#8A3A1C' }}>{msg.text}</div>}
    </div>
  );
}
