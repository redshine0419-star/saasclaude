'use client';

import { useState } from 'react';

interface Recipient {
  id: string;
  name: string;
  phone: string;
}

interface ProxyLog {
  id: string;
  accessedAt: string;
  adminEmail: string;
}

interface Props {
  slug: string;
  recipients: Recipient[];
  userEmail: string;
  kakaoConnected: boolean;
  ga4Connected: boolean;
  ga4MeasurementId: string;
  naverVerified: boolean;
  plan: string;
  betaEndsAt: string | null;
  accentColor: string;
  proxyLogs: ProxyLog[];
}

function maskPhone(phone: string) {
  const d = phone.replace(/\D/g, '');
  if (d.length === 11) return `${d.slice(0, 3)}-****-${d.slice(7)}`;
  return phone;
}

export function SettingsClient({
  slug,
  recipients: initialRecipients,
  userEmail,
  kakaoConnected,
  ga4Connected: initialGa4Connected,
  ga4MeasurementId: initialGa4MeasurementId,
  naverVerified,
  plan,
  betaEndsAt,
  accentColor: initialAccentColor,
  proxyLogs,
}: Props) {
  const [recipients, setRecipients] = useState(initialRecipients);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [accentColor, setAccentColor] = useState(initialAccentColor);
  const [accentSaving, setAccentSaving] = useState(false);
  const [accentSaved, setAccentSaved] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [ga4Id, setGa4Id] = useState(initialGa4MeasurementId);
  const [ga4Connected, setGa4Connected] = useState(initialGa4Connected);
  const [ga4Saving, setGa4Saving] = useState(false);
  const [ga4Saved, setGa4Saved] = useState(false);
  const [ga4Error, setGa4Error] = useState('');

  async function addRecipient() {
    setAddSaving(true);
    try {
      const res = await fetch(`/api/${slug}/admin/settings/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, phone: newPhone }),
      });
      if (res.ok) {
        const data = await res.json();
        setRecipients((p) => [...p, data.recipient]);
        setShowAdd(false);
        setNewName('');
        setNewPhone('');
      }
    } finally {
      setAddSaving(false);
    }
  }

  async function removeRecipient(id: string) {
    await fetch(`/api/${slug}/admin/settings/notify/${id}`, { method: 'DELETE' });
    setRecipients((p) => p.filter((r) => r.id !== id));
  }

  async function saveGa4() {
    setGa4Saving(true);
    setGa4Saved(false);
    setGa4Error('');
    try {
      const res = await fetch(`/api/${slug}/admin/settings/ga4`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ measurementId: ga4Id }),
      });
      const data = await res.json();
      if (!res.ok) { setGa4Error(data.error ?? '저장 실패'); return; }
      setGa4Connected(data.ga4Connected);
      setGa4Saved(true);
      setTimeout(() => setGa4Saved(false), 3000);
    } finally {
      setGa4Saving(false);
    }
  }

  async function saveAccentColor() {
    setAccentSaving(true);
    setAccentSaved(false);
    try {
      const res = await fetch(`/api/${slug}/admin/settings/accent`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accentColor }),
      });
      if (res.ok) {
        setAccentSaved(true);
        setTimeout(() => setAccentSaved(false), 3000);
      }
    } finally {
      setAccentSaving(false);
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
      {/* Notify recipients */}
      <div
        style={{
          padding: 24,
          background: '#FFFFFF',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700 }}>새 상담 알림 받을 번호</div>
        {recipients.map((r) => (
          <div
            key={r.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid #EEEAE2',
            }}
          >
            <span>
              {r.name} · {maskPhone(r.phone)}
            </span>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#1E5645', fontWeight: 600 }}>카톡 알림</span>
              <button
                type="button"
                onClick={() => removeRecipient(r.id)}
                style={{ fontSize: 13, color: '#8A3A1C', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                삭제
              </button>
            </div>
          </div>
        ))}
        {showAdd ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input
                type="text"
                placeholder="이름"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={{ height: 40, padding: '0 10px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}
              />
              <input
                type="tel"
                placeholder="010-0000-0000"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                style={{ height: 40, padding: '0 10px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, height: 40, border: '1px solid #D5D0C6', borderRadius: 8, background: '#FFFFFF', font: 'inherit', fontSize: 14, cursor: 'pointer' }}>취소</button>
              <button type="button" onClick={addRecipient} disabled={addSaving || !newName || !newPhone} style={{ flex: 1, height: 40, border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 14, fontWeight: 600, cursor: addSaving ? 'wait' : 'pointer' }}>추가</button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            style={{ alignSelf: 'flex-start', height: 40, padding: '0 14px', border: '1px dashed #B7B0A2', borderRadius: 8, background: '#FFFFFF', font: 'inherit', fontSize: 14, cursor: 'pointer' }}
          >
            + 번호 추가
          </button>
        )}
      </div>

      {/* Connection status */}
      <div
        style={{
          padding: 24,
          background: '#FFFFFF',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700 }}>연결 상태</div>
        {[
          { label: '카카오톡 채널', connected: kakaoConnected, connectedText: '연결됨 · 알림톡 사용 가능' },
          { label: 'GA4 방문 분석', connected: ga4Connected, connectedText: `연결됨 · ${ga4Id}` },
          { label: '네이버 서치어드바이저', connected: naverVerified, connectedText: '인증 코드 등록됨' },
        ].map((item) => (
          <div
            key={item.label}
            style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #EEEAE2' }}
          >
            <span>{item.label}</span>
            <span style={{ color: item.connected ? '#1E5645' : '#8A3A1C', fontWeight: 600 }}>
              {item.connected ? item.connectedText : '미연결'}
            </span>
          </div>
        ))}
      </div>

      {/* GA4 측정 ID */}
      <div style={{ padding: 24, background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>GA4 측정 ID</div>
        <div style={{ fontSize: 13, color: '#5A6270' }}>Google Analytics 4 측정 ID를 입력하면 방문자 분석이 연결됩니다. (예: G-XXXXXXXXXX)</div>
        <input
          type="text"
          value={ga4Id}
          onChange={(e) => setGa4Id(e.target.value)}
          placeholder="G-XXXXXXXXXX"
          style={{ height: 44, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, fontSize: 14, fontFamily: 'monospace', width: '100%', boxSizing: 'border-box' }}
        />
        {ga4Error && <div style={{ fontSize: 13, color: '#B91C1C' }}>{ga4Error}</div>}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={saveGa4}
            disabled={ga4Saving}
            style={{ height: 40, padding: '0 20px', borderRadius: 8, border: 'none', background: '#1E5645', color: '#FFFFFF', fontSize: 14, fontWeight: 700, cursor: ga4Saving ? 'not-allowed' : 'pointer', opacity: ga4Saving ? 0.6 : 1 }}
          >
            {ga4Saving ? '저장 중…' : '저장'}
          </button>
          {ga4Saved && <span style={{ fontSize: 13, color: '#1E5645', fontWeight: 600 }}>저장됨 ✓</span>}
        </div>
      </div>

      {/* Account */}
      <div
        style={{
          padding: 24,
          background: '#FFFFFF',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700 }}>계정</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>로그인 이메일</label>
          <div style={{ height: 44, padding: '0 12px', border: '1px solid #EEEAE2', borderRadius: 8, fontSize: 14, display: 'flex', alignItems: 'center', color: '#3E4652', background: '#FAF9F6' }}>
            {userEmail}
          </div>
        </div>
        <div style={{ fontSize: 13, color: '#9AA3AF' }}>Google 소셜 로그인 계정입니다.</div>
      </div>

      {/* Plan */}
      <div
        style={{
          padding: 24,
          background: '#FFFFFF',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700 }}>이용 중인 플랜</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{plan === 'beta' ? '베타 무료' : plan}</div>
        <div style={{ fontSize: 14, lineHeight: 1.8, color: '#3E4652' }}>
          베타 기간 3개월 무료 · 카톡 발송 포함 · 월간 리포트
          {betaEndsAt && (
            <>
              <br />
              베타 종료일: {new Date(betaEndsAt).toLocaleDateString('ko-KR')}
            </>
          )}
        </div>
        <a href={`mailto:contact@growweb.me`} style={{ fontSize: 14, fontWeight: 600, color: '#1E5645', textDecoration: 'none' }}>
          관리 담당자에게 문의
        </a>
      </div>

      {/* 강조색 */}
      <div style={{ padding: 24, background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>강조색</div>
        <div style={{ fontSize: 13, color: '#5A6270' }}>홈페이지 버튼·링크 색상을 변경합니다. 비워두면 테마 기본색이 사용됩니다.</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="color"
            value={accentColor || '#1E5645'}
            onChange={(e) => setAccentColor(e.target.value)}
            style={{ width: 44, height: 44, borderRadius: 8, border: '1px solid #D5D0C6', cursor: 'pointer' }}
          />
          <input
            type="text"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            placeholder="HEX 코드 (예: #2563EB)"
            style={{ height: 44, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, fontSize: 14, fontFamily: 'monospace', width: 160 }}
          />
          {accentColor && (
            <button type="button" onClick={() => setAccentColor('')} style={{ fontSize: 13, border: 'none', background: 'transparent', color: '#8A3A1C', cursor: 'pointer' }}>
              초기화
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={saveAccentColor}
            disabled={accentSaving}
            style={{ height: 40, padding: '0 20px', borderRadius: 8, border: 'none', background: '#1E5645', color: '#FFFFFF', fontSize: 14, fontWeight: 700, cursor: accentSaving ? 'not-allowed' : 'pointer', opacity: accentSaving ? 0.6 : 1 }}
          >
            {accentSaving ? '저장 중…' : '저장'}
          </button>
          {accentSaved && <span style={{ fontSize: 13, color: '#1E5645', fontWeight: 600 }}>저장됨 ✓</span>}
        </div>
      </div>

      {/* 대행 접속 기록 */}
      <div style={{ gridColumn: '1 / -1', padding: 24, background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>대행 접속 기록</div>
          <div style={{ fontSize: 13, color: '#5A6270', marginTop: 4 }}>첫등원 운영자가 이 학원 관리자에 접속한 기록입니다.</div>
        </div>
        {proxyLogs.length === 0 ? (
          <div style={{ fontSize: 14, color: '#9AA3AF' }}>대행 접속 기록이 없습니다.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #EEEAE2' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>접속 시각</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>운영자</th>
              </tr>
            </thead>
            <tbody>
              {proxyLogs.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #F5F3EF' }}>
                  <td style={{ padding: '8px 12px', color: '#8A93A8' }}>
                    {new Date(l.accessedAt).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#5A6270' }}>{l.adminEmail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
