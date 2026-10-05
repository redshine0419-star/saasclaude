'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

// 관리 가능한 플랫폼 설정 키 목록
const SETTING_DEFS = [
  {
    section: '베타 운영',
    items: [
      { key: 'beta_duration_months', label: '베타 기간 (개월)', type: 'number', hint: '오픈일 기준 무료 기간. 현재 3개월.' },
      { key: 'beta_warning_days', label: '만료 알림 기준 (일)', type: 'number', hint: '종료 N일 전 운영자에게 알림. 현재 14일.' },
      { key: 'beta_grace_days', label: '유예 기간 (일)', type: 'number', hint: '종료 후 비공개 전환까지 유예. 현재 30일.' },
      { key: 'kakao_monthly_limit', label: '카톡 월 발송 한도 (건)', type: 'number', hint: '베타 기간 중 테넌트당 월 최대 발송 수. 현재 300건.' },
    ],
  },
  {
    section: '정식 요금',
    items: [
      { key: 'price_basic', label: '기본 플랜 월 요금 (원)', type: 'number', hint: '미확정. 베타 참여자에게는 할인 적용.' },
      { key: 'price_growth', label: '성장 플랜 월 요금 (원)', type: 'number', hint: '미확정.' },
      { key: 'beta_discount_pct', label: '베타 참여자 할인율 (%)', type: 'number', hint: '정식 전환 시 적용. 미확정.' },
    ],
  },
  {
    section: '발송 대행사',
    items: [
      { key: 'kakao_provider', label: '카카오 발송 대행사', type: 'text', hint: '예: bizm, aligo, coolsms. 현재 목(mock) 어댑터.' },
      { key: 'kakao_sender_key', label: '발신 채널 키', type: 'text', hint: '카카오 알림톡 발신 채널 인증 키.' },
    ],
  },
];

interface ProxyLog {
  id: string;
  accessedAt: string;
  adminEmail: string;
  tenantName: string;
  tenantSlug: string;
}

export function SettingsClient({ initialSettings, proxyLogs = [] }: { initialSettings: Record<string, string>; proxyLogs?: ProxyLog[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function onChange(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/platform/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? '저장 실패');
      }
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류 발생');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #D8D3CA',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'inherit',
    background: '#FFFFFF',
    color: '#1B2430',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {SETTING_DEFS.map((section) => (
        <div
          key={section.section}
          style={{ padding: 24, borderRadius: 14, background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 18 }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, borderBottom: '1px solid #EEEAE2', paddingBottom: 12 }}>
            {section.section}
          </div>
          {section.items.map((item) => (
            <div key={item.key}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#3E4652' }}>
                {item.label}
              </label>
              <input
                type={item.type}
                value={values[item.key] ?? ''}
                onChange={(e) => onChange(item.key, e.target.value)}
                style={inputStyle}
                min={item.type === 'number' ? 0 : undefined}
              />
              <div style={{ fontSize: 12, color: '#9AA3AF', marginTop: 3 }}>{item.hint}</div>
            </div>
          ))}
        </div>
      ))}

      <div style={{ padding: '16px 24px', borderRadius: 14, background: '#FFFFFF' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>예약 슬러그 (학원 사용 불가)</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['platform', 'admin', 'service', 'pricing', 'apply', 'demo', 'consult', 'api', '_next', 'static', 'auth', 'privacy', 'terms'].map((s) => (
            <span key={s} style={{ padding: '4px 10px', borderRadius: 6, background: '#F3F5F8', fontSize: 13, fontFamily: 'monospace', color: '#4A5568' }}>{s}</span>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 8, background: '#FDE8E8', color: '#B91C1C', fontSize: 14 }}>
          {error}
        </div>
      )}
      {saved && (
        <div style={{ padding: '12px 16px', borderRadius: 8, background: '#D8E8E0', color: '#1E5645', fontSize: 14 }}>
          저장됐습니다.
        </div>
      )}

      <div>
        <button
          onClick={save}
          disabled={saving}
          style={{
            height: 44,
            padding: '0 28px',
            borderRadius: 8,
            background: '#1E5645',
            color: '#FFFFFF',
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? '저장 중…' : '설정 저장'}
        </button>
      </div>

      {/* 대행 접속 기록 */}
      <div style={{ padding: 24, borderRadius: 14, background: '#FFFFFF' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>대행 접속 기록 (최근 50건)</div>
        {proxyLogs.length === 0 ? (
          <div style={{ fontSize: 14, color: '#9AA3AF' }}>대행 접속 기록이 없습니다.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #EEEAE2' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>시각</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>운영자</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>학원</th>
              </tr>
            </thead>
            <tbody>
              {proxyLogs.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #F5F3EF' }}>
                  <td style={{ padding: '8px 12px', color: '#8A93A8' }}>
                    {new Date(l.accessedAt).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#5A6270' }}>{l.adminEmail}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <a href={`/platform/academies/${l.tenantSlug}`} style={{ color: '#1D3FA8', textDecoration: 'none', fontWeight: 600 }}>
                      {l.tenantName}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
