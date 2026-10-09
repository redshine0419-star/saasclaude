'use client';

import { useState } from 'react';

interface Lead {
  id: string;
  createdAt: string;
  parentName: string;
  phone: string;       // masked (010-****-1234)
  phoneFull: string;   // full number, shown only in detail view
  studentGrade: string | null;
  consultType: string;
  source: string | null;
  status: string;
  statusChangedAt: string;
  message: string | null;
  marketingConsent: boolean;
  events: {
    id: string;
    type: string;
    createdAt: string;
    payload: unknown;
  }[];
  messages: {
    id: string;
    scenario: string;
    status: string;
    sentAt: string | null;
    createdAt: string;
  }[];
}

interface Props {
  slug: string;
  leads: Lead[];
  totalByStatus: Record<string, number>;
}

const STATUS_OPTIONS = [
  { value: 'new', label: '신규' },
  { value: 'contacted', label: '연락 완료' },
  { value: 'test_booked', label: '테스트 예약' },
  { value: 'enrolled', label: '등록' },
  { value: 'not_enrolled', label: '미등록' },
];

const STATUS_FILTER_LABELS: Record<string, string> = {
  all: '전체',
  new: '신규',
  contacted: '연락 완료',
  test_booked: '테스트 예약',
  enrolled: '등록',
  not_enrolled: '미등록',
};

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  new: { bg: '#FBF1CF', color: '#5A4A12' },
  contacted: { bg: '#E6E9EE', color: '#2C3747' },
  test_booked: { bg: '#D8E8E0', color: '#1E5645' },
  enrolled: { bg: '#1E5645', color: '#FFFFFF' },
  not_enrolled: { bg: '#F3E3DC', color: '#8A3A1C' },
};

const CONSULT_LABEL: Record<string, string> = {
  level_test: '레벨테스트',
  phone: '전화 상담',
  visit: '방문 상담',
};

const EVENT_LABEL: Record<string, string> = {
  created: '홈페이지 상담 신청',
  status_changed: '상태 변경',
  note: '원장 메모',
  message_sent: '알림톡 발송',
  call: '원장 통화',
};

function maskPhone(phone: string) {
  const d = phone.replace(/\D/g, '');
  if (d.length === 11) return `${d.slice(0, 3)}-****-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-***-${d.slice(6)}`;
  return phone;
}

function maskName(name: string) {
  if (name.length <= 1) return name + '○○';
  return name[0] + '○○';
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const kst = new Date(d.getTime() + 9 * 3600 * 1000);
  const mm = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(kst.getUTCDate()).padStart(2, '0');
  const hh = String(kst.getUTCHours()).padStart(2, '0');
  const min = String(kst.getUTCMinutes()).padStart(2, '0');
  return `${mm}.${dd} ${hh}:${min}`;
}

export function LeadsClient({ slug, leads: initialLeads, totalByStatus }: Props) {
  const [leads, setLeads] = useState(initialLeads);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(
    initialLeads[0]?.id ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [memoValue, setMemoValue] = useState<Record<string, string>>({});
  const [statusValue, setStatusValue] = useState<Record<string, string>>({});
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const qs = filter !== 'all' ? `?status=${filter}` : '';
      const res = await fetch(`/api/${slug}/admin/leads/export${qs}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] ?? 'leads.csv';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const filtered = leads.filter((l) => {
    if (filter !== 'all' && l.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!l.parentName.includes(s) && !l.phoneFull.includes(s)) return false;
    }
    return true;
  });

  const selected = leads.find((l) => l.id === selectedId) ?? null;
  const selectedStatus = statusValue[selectedId ?? ''] ?? selected?.status ?? '';
  const selectedMemo = memoValue[selectedId ?? ''] ?? selected?.message ?? '';

  async function saveStatus(leadId: string, status: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/${slug}/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? { ...l, status, statusChangedAt: new Date().toISOString() }
              : l,
          ),
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function saveMemo(leadId: string, message: string) {
    setSaving(true);
    try {
      await fetch(`/api/${slug}/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
    } finally {
      setSaving(false);
    }
  }

  const totalAll = Object.values(totalByStatus).reduce((a, b) => a + b, 0);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        gap: 24,
        minHeight: 0,
      }}
    >
      {/* Left: list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>상담 관리</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="search"
              aria-label="학부모 이름·연락처 검색"
              placeholder="이름·연락처 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: 200,
                height: 44,
                padding: '0 14px',
                border: '1px solid #D5D0C6',
                borderRadius: 8,
                font: 'inherit',
                fontSize: 14,
                background: '#FFFFFF',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              title="현재 필터 기준으로 CSV 내보내기"
              style={{
                height: 44,
                padding: '0 14px',
                border: '1px solid #D5D0C6',
                borderRadius: 8,
                background: '#FFFFFF',
                fontSize: 13,
                fontWeight: 600,
                cursor: exporting ? 'wait' : 'pointer',
                color: '#1B2430',
                whiteSpace: 'nowrap',
              }}
            >
              {exporting ? '내보내는 중…' : 'CSV 내보내기'}
            </button>
          </div>
        </div>

        {/* Status filter tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['all', 'new', 'contacted', 'test_booked', 'enrolled', 'not_enrolled'].map((s) => {
            const count = s === 'all' ? totalAll : (totalByStatus[s] ?? 0);
            const active = filter === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                style={{
                  height: 40,
                  padding: '0 14px',
                  border: active ? 'none' : '1px solid #D5D0C6',
                  borderRadius: 20,
                  background: active ? '#1B2430' : '#FFFFFF',
                  color: active ? '#FFFFFF' : '#1B2430',
                  font: 'inherit',
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                {STATUS_FILTER_LABELS[s]} {count}
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div style={{ background: '#FFFFFF', borderRadius: 12, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#9AA3AF', fontSize: 14 }}>
              해당 상태의 상담이 없습니다.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#5A6270', background: '#FAF9F6' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>신청일</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>학부모 · 학년</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>연락처</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>희망</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>유입</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>상태</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>모집 안내 동의</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => {
                  const badge = STATUS_BADGE[lead.status] ?? { bg: '#E6E9EE', color: '#2C3747' };
                  const isSelected = lead.id === selectedId;
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedId(lead.id)}
                      style={{
                        borderTop: '1px solid #EEEAE2',
                        background: isSelected ? '#EEF5F1' : 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <td style={{ padding: '14px 16px' }}>{formatDate(lead.createdAt)}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                        {maskName(lead.parentName)}
                        {lead.studentGrade ? ` · ${lead.studentGrade}` : ''}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#5A6270', fontVariantNumeric: 'tabular-nums' }}>
                        {maskPhone(lead.phone)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {CONSULT_LABEL[lead.consultType] ?? lead.consultType}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#5A6270' }}>
                        {lead.source ?? '직접'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 5,
                            background: badge.bg,
                            color: badge.color,
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        >
                          {STATUS_OPTIONS.find((o) => o.value === lead.status)?.label ?? lead.status}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          color: lead.marketingConsent ? '#1B2430' : '#9AA3AF',
                        }}
                      >
                        {lead.marketingConsent ? '동의' : '미동의'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right: detail panel */}
      {selected && (
        <aside
          style={{
            width: 420,
            boxSizing: 'border-box',
            padding: 28,
            background: '#FFFFFF',
            borderLeft: '1px solid #E2DDD2',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{maskName(selected.parentName)} 학부모</div>
            <div style={{ fontSize: 14, color: '#5A6270' }}>
              {selected.studentGrade ?? '학년 미기재'} · {selected.phoneFull}
              {selected.source ? ` · ${selected.source}` : ''}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={`tel:${selected.phoneFull}`}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 8,
                background: '#1E5645',
                color: '#FFFFFF',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              전화
            </a>
            <button
              type="button"
              style={{
                flex: 1,
                height: 44,
                border: '1px solid #D5D0C6',
                borderRadius: 8,
                background: '#FFFFFF',
                font: 'inherit',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              알림톡 보내기
            </button>
          </div>

          {/* Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>상태</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                const next = e.target.value;
                setStatusValue((prev) => ({ ...prev, [selected.id]: next }));
                saveStatus(selected.id, next);
              }}
              disabled={saving}
              style={{
                height: 44,
                padding: '0 10px',
                border: '1px solid #D5D0C6',
                borderRadius: 8,
                font: 'inherit',
                fontSize: 14,
              }}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Memo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>원장 메모</label>
            <textarea
              value={selectedMemo}
              onChange={(e) =>
                setMemoValue((prev) => ({ ...prev, [selected.id]: e.target.value }))
              }
              onBlur={() => saveMemo(selected.id, selectedMemo)}
              rows={3}
              style={{
                padding: '10px 12px',
                border: '1px solid #D5D0C6',
                borderRadius: 8,
                font: 'inherit',
                fontSize: 14,
                resize: 'none',
              }}
            />
          </div>

          {/* Kakao message log */}
          {selected.messages.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>카카오 발송 내역</div>
              {selected.messages.map((msg) => (
                <div key={msg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F4F2EE', borderRadius: 8, fontSize: 13 }}>
                  <span>{EVENT_LABEL['message_sent']} · {msg.scenario}</span>
                  <span style={{ color: msg.status === 'sent' ? '#1E5645' : msg.status === 'failed' ? '#8A3A1C' : '#5A6270', fontWeight: 600 }}>
                    {msg.status === 'sent' ? '전달' : msg.status === 'failed' ? '실패' : '대기'}
                    {' · '}{formatDate(msg.sentAt ?? msg.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Event timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#5A6270', marginBottom: 12 }}>
              진행 기록
            </div>
            {selected.events.map((ev, i) => {
              const isLast = i === selected.events.length - 1;
              const payload = ev.payload as Record<string, string> | null;
              return (
                <div
                  key={ev.id}
                  style={{ display: 'flex', gap: 12, paddingBottom: isLast ? 0 : 16 }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      marginTop: 5,
                      borderRadius: 5,
                      background: '#1B2430',
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {EVENT_LABEL[ev.type] ?? ev.type}
                      {payload?.note ? ` · ${payload.note}` : ''}
                    </div>
                    <div style={{ fontSize: 13, color: '#5A6270' }}>{formatDate(ev.createdAt)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      )}
    </div>
  );
}
