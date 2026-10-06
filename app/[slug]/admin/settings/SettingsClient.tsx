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

interface MemberRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface InviteRow {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
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
  isOwner: boolean;
  members: MemberRow[];
  pendingInvites: InviteRow[];
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
  isOwner,
  members: initialMembers,
  pendingInvites: initialInvites,
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
  const [members, setMembers] = useState<MemberRow[]>(initialMembers);
  const [invites, setInvites] = useState<InviteRow[]>(initialInvites);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSaving, setInviteSaving] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteDone, setInviteDone] = useState('');
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/${slug}/admin/export`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] ?? 'export.json';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function sendInvite() {
    if (!inviteEmail.trim()) return;
    setInviteSaving(true);
    setInviteError('');
    setInviteDone('');
    try {
      const res = await fetch(`/api/${slug}/admin/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setInviteError(data.error ?? '초대 실패'); return; }
      if (data.status === 'added') {
        setInviteDone(`${inviteEmail.trim()}을(를) 직원으로 추가했습니다.`);
      } else {
        setInviteDone(`초대 링크를 ${inviteEmail.trim()}으로 발송했습니다.`);
      }
      setInviteEmail('');
      // 목록 새로고침
      const updated = await fetch(`/api/${slug}/admin/members`).then((r) => r.json());
      setMembers(updated.members ?? []);
      setInvites(updated.invites ?? []);
    } finally {
      setInviteSaving(false);
    }
  }

  async function removeMember(memberId: string) {
    await fetch(`/api/${slug}/admin/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    });
    setMembers((p) => p.filter((m) => m.id !== memberId));
  }

  async function cancelInvite(inviteId: string) {
    await fetch(`/api/${slug}/admin/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteId }),
    });
    setInvites((p) => p.filter((i) => i.id !== inviteId));
  }

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

      {/* 직원 관리 — 원장만 */}
      {isOwner && (
        <div style={{ padding: 24, background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>직원 관리</div>
          <div style={{ fontSize: 13, color: '#5A6270' }}>직원 계정은 상담 조회·메모 작성만 가능합니다. 학원 정보·설정 변경은 원장만 가능합니다.</div>

          {/* 현재 멤버 목록 */}
          {members.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {members.map((m) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 8, background: '#FAF9F6', fontSize: 14 }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{m.name ?? m.email}</span>
                    {m.name && <span style={{ color: '#8A93A8', marginLeft: 8, fontSize: 13 }}>{m.email}</span>}
                    <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 5, background: m.role === 'owner' ? '#E8F4EE' : '#F0F4FA', color: m.role === 'owner' ? '#1E5645' : '#3A5A9A', fontSize: 12, fontWeight: 600 }}>
                      {m.role === 'owner' ? '원장' : '직원'}
                    </span>
                  </div>
                  {m.role !== 'owner' && (
                    <button
                      type="button"
                      onClick={() => removeMember(m.id)}
                      style={{ fontSize: 12, color: '#8A3A1C', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      삭제
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 초대 대기 중 */}
          {invites.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#5A6270', marginBottom: 6 }}>초대 대기 중</div>
              {invites.map((inv) => (
                <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderRadius: 8, background: '#FFFBF0', fontSize: 13, marginBottom: 6 }}>
                  <span>{inv.email} <span style={{ color: '#8A93A8' }}>(만료: {new Date(inv.expiresAt).toLocaleDateString('ko-KR')})</span></span>
                  <button type="button" onClick={() => cancelInvite(inv.id)} style={{ fontSize: 12, color: '#8A3A1C', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
                </div>
              ))}
            </div>
          )}

          {/* 초대 입력 */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendInvite(); }}
              placeholder="직원 Google 이메일"
              style={{ flex: 1, height: 44, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}
            />
            <button
              type="button"
              onClick={sendInvite}
              disabled={inviteSaving || !inviteEmail.trim()}
              style={{ height: 44, padding: '0 16px', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: inviteSaving ? 'wait' : 'pointer', opacity: (!inviteEmail.trim() || inviteSaving) ? 0.6 : 1 }}
            >
              {inviteSaving ? '처리 중…' : '초대'}
            </button>
          </div>
          {inviteError && <div style={{ fontSize: 13, color: '#8A3A1C' }}>{inviteError}</div>}
          {inviteDone && <div style={{ fontSize: 13, color: '#1E5645' }}>{inviteDone}</div>}
        </div>
      )}

      {/* 데이터 내보내기 */}
      {isOwner && (
        <div style={{ gridColumn: '1 / -1', padding: 24, borderRadius: 14, background: '#FFFFFF', border: '1px solid #E4DFD6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>데이터 내보내기</div>
            <div style={{ fontSize: 13, color: '#6B6357', lineHeight: 1.6 }}>
              상담 기록, 후기, 소식, 수업, 강사 정보를 JSON 파일로 내려받습니다.
            </div>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            style={{ height: 44, padding: '0 20px', borderRadius: 8, border: '1px solid #D5D0C6', background: '#FFFFFF', fontSize: 14, fontWeight: 600, cursor: exporting ? 'wait' : 'pointer', color: '#1B2430', whiteSpace: 'nowrap' }}
          >
            {exporting ? '내보내는 중…' : '전체 데이터 내보내기'}
          </button>
        </div>
      )}
    </div>
  );
}
