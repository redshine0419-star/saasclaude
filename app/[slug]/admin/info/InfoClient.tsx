'use client';

import { useState } from 'react';

interface TenantInfo {
  name: string;
  regNo: string | null;
  phone: string | null;
  hours: string | null;
  address: string | null;
  subjects: string | null;
  targetGrades: string | null;
  kakaoChannelUrl: string | null;
  naverPlaceUrl: string | null;
  naverMapEmbedUrl: string | null;
  locationHeadline: string | null;
  transitInfo: string | null;
  parkingInfo: string | null;
  ga4MeasurementId: string | null;
  naverSiteVerification: string | null;
}

interface DirectorInfo {
  headline: string | null;
  career: string | null;
  philosophy: string | null;
  education: string | null;
}

interface FeeRow {
  id: string;
  label: string;
  amount: number;
}

interface FeeChangeLog {
  id: string;
  createdAt: string;
  actorEmail: string;
}

interface PrincipleRow {
  id: string;
  number: string;
  title: string;
  description: string | null;
  sortOrder: number;
}

interface FacilityRow {
  id: string;
  label: string;
  photo: string | null;
  sortOrder: number;
}

interface Props {
  slug: string;
  tenant: TenantInfo;
  director: DirectorInfo | null;
  fees: FeeRow[];
  feeChangeLogs: FeeChangeLog[];
  principles: PrincipleRow[];
  facilities: FacilityRow[];
  refundPolicyText: string | null;
}

const INPUT = {
  height: 44, padding: '0 12px', border: '1px solid #D5D0C6',
  borderRadius: 8, font: 'inherit', fontSize: 14, width: '100%', boxSizing: 'border-box' as const,
};
const TEXTAREA = {
  padding: '10px 12px', border: '1px solid #D5D0C6',
  borderRadius: 8, font: 'inherit', fontSize: 14, width: '100%', boxSizing: 'border-box' as const,
  resize: 'vertical' as const,
};
const LABEL = { fontSize: 13, fontWeight: 600, color: '#5A6270' };

export function InfoClient({ slug, tenant: initialTenant, director: initialDirector, fees: initialFees, feeChangeLogs, principles: initialPrinciples, facilities: initialFacilities, refundPolicyText: initialRefundPolicyText }: Props) {
  const [info, setInfo] = useState(initialTenant);
  const [director, setDirector] = useState<DirectorInfo>(
    initialDirector ?? { headline: null, career: null, philosophy: null, education: null }
  );
  const [fees, setFees] = useState(initialFees);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showFeeConfirm, setShowFeeConfirm] = useState(false);

  // Principles state
  const [principles, setPrinciples] = useState(initialPrinciples);
  const [principleForm, setPrincipleForm] = useState<{ number: string; title: string; description: string }>({ number: '', title: '', description: '' });
  const [showAddPrinciple, setShowAddPrinciple] = useState(false);
  const [principleEditId, setPrincipleEditId] = useState<string | null>(null);
  const [principleEditForm, setPrincipleEditForm] = useState<{ number: string; title: string; description: string }>({ number: '', title: '', description: '' });
  const [principleSaving, setPrincipleSaving] = useState(false);

  // Facilities state
  const [facilities, setFacilities] = useState(initialFacilities);
  const [facilityForm, setFacilityForm] = useState<{ label: string; photo: string }>({ label: '', photo: '' });
  const [showAddFacility, setShowAddFacility] = useState(false);
  const [facilityEditId, setFacilityEditId] = useState<string | null>(null);
  const [facilityEditForm, setFacilityEditForm] = useState<{ label: string; photo: string }>({ label: '', photo: '' });
  const [facilitySaving, setFacilitySaving] = useState(false);

  // Refund policy state
  const [refundPolicyText, setRefundPolicyText] = useState(initialRefundPolicyText ?? '');
  const [refundSaving, setRefundSaving] = useState(false);
  const [refundSaved, setRefundSaved] = useState(false);

  const feeChanged = fees.some((f) => {
    const orig = initialFees.find((o) => o.id === f.id);
    return orig && orig.amount !== f.amount;
  });

  function setI(key: keyof TenantInfo, value: string) {
    setInfo((p) => ({ ...p, [key]: value || null }));
  }
  function setD(key: keyof DirectorInfo, value: string) {
    setDirector((p) => ({ ...p, [key]: value || null }));
  }

  async function save(confirmed = false) {
    if (feeChanged && !confirmed) { setShowFeeConfirm(true); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/${slug}/admin/info`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ info, director, fees: fees.map((f) => ({ id: f.id, amount: f.amount, label: f.label })) }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    } finally {
      setSaving(false);
      setShowFeeConfirm(false);
    }
  }

  async function addPrinciple() {
    setPrincipleSaving(true);
    try {
      const res = await fetch(`/api/${slug}/admin/principles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(principleForm),
      });
      if (res.ok) {
        const data = await res.json();
        setPrinciples((p) => [...p, data.principle]);
        setShowAddPrinciple(false);
        setPrincipleForm({ number: '', title: '', description: '' });
      }
    } finally {
      setPrincipleSaving(false);
    }
  }

  async function savePrinciple(id: string) {
    setPrincipleSaving(true);
    try {
      const res = await fetch(`/api/${slug}/admin/principles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(principleEditForm),
      });
      if (res.ok) {
        const data = await res.json();
        setPrinciples((p) => p.map((x) => x.id === id ? { ...x, ...data.principle } : x));
        setPrincipleEditId(null);
      }
    } finally {
      setPrincipleSaving(false);
    }
  }

  async function deletePrinciple(id: string) {
    await fetch(`/api/${slug}/admin/principles/${id}`, { method: 'DELETE' });
    setPrinciples((p) => p.filter((x) => x.id !== id));
    if (principleEditId === id) setPrincipleEditId(null);
  }

  async function addFacility() {
    setFacilitySaving(true);
    try {
      const res = await fetch(`/api/${slug}/admin/facilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facilityForm),
      });
      if (res.ok) {
        const data = await res.json();
        setFacilities((p) => [...p, data.facility]);
        setShowAddFacility(false);
        setFacilityForm({ label: '', photo: '' });
      }
    } finally {
      setFacilitySaving(false);
    }
  }

  async function saveFacility(id: string) {
    setFacilitySaving(true);
    try {
      const res = await fetch(`/api/${slug}/admin/facilities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facilityEditForm),
      });
      if (res.ok) {
        const data = await res.json();
        setFacilities((p) => p.map((x) => x.id === id ? { ...x, ...data.facility } : x));
        setFacilityEditId(null);
      }
    } finally {
      setFacilitySaving(false);
    }
  }

  async function deleteFacility(id: string) {
    await fetch(`/api/${slug}/admin/facilities/${id}`, { method: 'DELETE' });
    setFacilities((p) => p.filter((x) => x.id !== id));
    if (facilityEditId === id) setFacilityEditId(null);
  }

  async function saveRefundPolicy() {
    setRefundSaving(true);
    try {
      const res = await fetch(`/api/${slug}/admin/info`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refundPolicyText }),
      });
      if (res.ok) { setRefundSaved(true); setTimeout(() => setRefundSaved(false), 2500); }
    } finally {
      setRefundSaving(false);
    }
  }

  return (
    <>
      {showFeeConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 32, maxWidth: 400, width: '90%', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>교습비 변경 확인</div>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: '#3E4652' }}>
              교습비를 변경하셨습니다. 교육지원청에 신고한 금액과 같은지 확인해 주세요.
              변경 신고가 필요하다면 먼저 신고 후 저장하세요.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setShowFeeConfirm(false)} style={{ flex: 1, height: 48, border: '1px solid #D5D0C6', borderRadius: 10, background: '#FFFFFF', font: 'inherit', fontSize: 14, cursor: 'pointer' }}>취소 (다시 확인)</button>
              <button type="button" onClick={() => save(true)} style={{ flex: 1, height: 48, border: 'none', borderRadius: 10, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>신고 완료, 저장</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 20, flex: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Left column */}
        <div style={{ flex: 1, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Basic info */}
          <div style={{ padding: 24, background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>기본 정보</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {([
                ['학원명', 'name', '학원명'],
                ['학원등록번호', 'regNo', '제0000호'],
                ['대표 전화', 'phone', '000-0000-0000'],
                ['운영 시간', 'hours', '평일 14:00–22:00'],
                ['교습 과목', 'subjects', '수학, 영어'],
                ['대상 학년', 'targetGrades', '초등~고등'],
              ] as [string, keyof TenantInfo, string][]).map(([label, key, placeholder]) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={LABEL}>{label}</label>
                  <input
                    type="text"
                    value={(info[key] as string) ?? ''}
                    onChange={(e) => setI(key, e.target.value)}
                    placeholder={placeholder}
                    style={INPUT}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={LABEL}>주소</label>
              <input type="text" value={info.address ?? ''} onChange={(e) => setI('address', e.target.value)} placeholder="도로명 주소" style={INPUT} />
            </div>
          </div>

          {/* Location */}
          <div style={{ padding: 24, background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>오시는 길</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={LABEL}>위치 한 줄 소개</label>
              <input type="text" value={info.locationHeadline ?? ''} onChange={(e) => setI('locationHeadline', e.target.value)} placeholder="역삼역 1번 출구 도보 3분" style={INPUT} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={LABEL}>대중교통 안내</label>
              <textarea rows={3} value={info.transitInfo ?? ''} onChange={(e) => setI('transitInfo', e.target.value)} placeholder="지하철 2호선 역삼역 1번 출구 도보 3분&#10;버스 146, 341번 역삼역 하차" style={TEXTAREA} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={LABEL}>주차 안내</label>
              <input type="text" value={info.parkingInfo ?? ''} onChange={(e) => setI('parkingInfo', e.target.value)} placeholder="건물 지하 1~2층, 1시간 무료" style={INPUT} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={LABEL}>네이버 지도 장소 URL</label>
              <input type="url" value={info.naverPlaceUrl ?? ''} onChange={(e) => setI('naverPlaceUrl', e.target.value)} placeholder="https://naver.me/xxxxx" style={INPUT} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={LABEL}>네이버 지도 임베드 URL</label>
              <input type="url" value={info.naverMapEmbedUrl ?? ''} onChange={(e) => setI('naverMapEmbedUrl', e.target.value)} placeholder="https://map.naver.com/p/entry/place/..." style={INPUT} />
              <div style={{ fontSize: 12, color: '#9AA3AF' }}>홈페이지 오시는 길 페이지에 지도로 표시됩니다.</div>
            </div>
          </div>

          {/* Connection info */}
          <div style={{ padding: 24, background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>연결 설정</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={LABEL}>카카오 채널 URL</label>
              <input type="url" value={info.kakaoChannelUrl ?? ''} onChange={(e) => setI('kakaoChannelUrl', e.target.value)} placeholder="https://pf.kakao.com/_xxxxx" style={INPUT} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={LABEL}>GA4 측정 ID</label>
              <input type="text" value={info.ga4MeasurementId ?? ''} onChange={(e) => setI('ga4MeasurementId', e.target.value)} placeholder="G-XXXXXXXXXX" style={INPUT} />
              <div style={{ fontSize: 12, color: '#9AA3AF' }}>Google Analytics 4 측정 ID. 학원 홈페이지 방문자 분석에 사용됩니다.</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={LABEL}>네이버 서치어드바이저 인증 코드</label>
              <input type="text" value={info.naverSiteVerification ?? ''} onChange={(e) => setI('naverSiteVerification', e.target.value)} placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" style={INPUT} />
              <div style={{ fontSize: 12, color: '#9AA3AF' }}>네이버 서치어드바이저 &gt; 사이트 관리 &gt; 소유 확인에서 발급받은 코드를 입력하세요.</div>
            </div>
          </div>

          {/* Director */}
          <div style={{ padding: 24, background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>원장 소개</div>
            <div style={{ display: 'flex', gap: 14 }}>
              <button type="button" style={{ width: 100, height: 130, flexShrink: 0, border: '1px dashed #B7B0A2', borderRadius: 10, background: '#FAF9F6', font: 'inherit', fontSize: 13, color: '#3E4652', cursor: 'pointer' }}>
                사진<br />변경
              </button>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={LABEL}>한 줄 소개</label>
                  <input type="text" value={director.headline ?? ''} onChange={(e) => setD('headline', e.target.value)} placeholder="아이가 왜 틀렸는지 알 때까지 같이 봅니다" style={INPUT} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={LABEL}>학력</label>
                  <input type="text" value={director.education ?? ''} onChange={(e) => setD('education', e.target.value)} placeholder="OO대학교 수학교육과" style={INPUT} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={LABEL}>경력</label>
                  <input type="text" value={director.career ?? ''} onChange={(e) => setD('career', e.target.value)} placeholder="수학 전문 강사 15년" style={INPUT} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={LABEL}>교육 철학</label>
              <textarea rows={3} value={director.philosophy ?? ''} onChange={(e) => setD('philosophy', e.target.value)} placeholder="틀린 문제를 분석하는 것이 실력의 시작입니다." style={TEXTAREA} />
            </div>
          </div>
        </div>

        {/* Right column: fees */}
        <div style={{ width: 440, minWidth: 300, padding: 24, boxSizing: 'border-box', background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>교습비</div>
            <button type="button" onClick={() => setFees((p) => [...p, { id: `new-${Date.now()}`, label: '새 과정', amount: 0 }])} style={{ height: 36, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, background: '#FFFFFF', font: 'inherit', fontSize: 13, cursor: 'pointer' }}>
              행 추가
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#5A6270' }}>
                <th style={{ padding: '8px 0', fontWeight: 500 }}>과정</th>
                <th style={{ padding: '8px 8px', fontWeight: 500 }}>월 교습비</th>
                <th style={{ width: 32 }}></th>
              </tr>
            </thead>
            <tbody>
              {fees.map((fee, i) => (
                <tr key={fee.id} style={{ borderTop: '1px solid #EEEAE2' }}>
                  <td style={{ padding: '10px 0' }}>
                    <input type="text" value={fee.label} onChange={(e) => setFees((p) => p.map((f, j) => j === i ? { ...f, label: e.target.value } : f))} style={{ width: '100%', height: 36, padding: '0 8px', border: '1px solid #D5D0C6', borderRadius: 6, font: 'inherit', fontSize: 14 }} />
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <input
                      type="text"
                      value={fee.amount > 0 ? fee.amount.toLocaleString() : ''}
                      onChange={(e) => { const n = Number(e.target.value.replace(/,/g, '')); if (!isNaN(n)) setFees((p) => p.map((f, j) => j === i ? { ...f, amount: n } : f)); }}
                      placeholder="000,000원"
                      aria-label={`${fee.label} 교습비`}
                      style={{ width: 130, height: 36, padding: '0 8px', border: '1px solid #D5D0C6', borderRadius: 6, font: 'inherit', fontSize: 14 }}
                    />
                  </td>
                  <td>
                    <button type="button" onClick={() => setFees((p) => p.filter((_, j) => j !== i))} style={{ width: 28, height: 28, border: 'none', borderRadius: 6, background: '#F3E3DC', color: '#8A3A1C', font: 'inherit', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ padding: 14, borderRadius: 10, background: '#FBF1CF', fontSize: 13, lineHeight: 1.7, color: '#3E3510' }}>
            교육지원청에 신고한 금액과 같아야 합니다. 금액을 바꾸면 변경 신고 여부를 한 번 더 확인하는 창이 뜹니다.
          </div>

          <button
            type="button"
            onClick={() => save()}
            disabled={saving}
            style={{ marginTop: 'auto', height: 48, border: 'none', borderRadius: 10, background: saved ? '#2F6E5A' : '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 15, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', transition: 'background 0.3s' }}
          >
            {saved ? '저장 완료 ✓' : saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
      {/* 수업 원칙 */}
      <div style={{ padding: 24, background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>수업 원칙</div>
          <button type="button" onClick={() => { setShowAddPrinciple(true); setPrincipleEditId(null); }} style={{ height: 36, padding: '0 14px', border: '1px solid #D5D0C6', borderRadius: 8, background: '#FFFFFF', font: 'inherit', fontSize: 13, cursor: 'pointer' }}>+ 추가</button>
        </div>
        <div style={{ fontSize: 13, color: '#9AA3AF' }}>홈페이지 소개 페이지에 표시됩니다. 번호·제목·설명 순서로 입력하세요.</div>

        {showAddPrinciple && (
          <div style={{ padding: 16, background: '#F4F2EE', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={LABEL}>번호</label>
                <input type="text" value={principleForm.number} onChange={(e) => setPrincipleForm((p) => ({ ...p, number: e.target.value }))} placeholder="01" style={INPUT} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={LABEL}>제목</label>
                <input type="text" value={principleForm.title} onChange={(e) => setPrincipleForm((p) => ({ ...p, title: e.target.value }))} placeholder="틀린 문제 반드시 재풀이" style={INPUT} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={LABEL}>설명 (선택)</label>
              <textarea rows={2} value={principleForm.description} onChange={(e) => setPrincipleForm((p) => ({ ...p, description: e.target.value }))} placeholder="오답 노트를 만들어 다음 수업 전에 반드시 복습합니다." style={TEXTAREA} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setShowAddPrinciple(false)} style={{ flex: 1, height: 40, border: '1px solid #D5D0C6', borderRadius: 8, background: '#FFFFFF', font: 'inherit', fontSize: 14, cursor: 'pointer' }}>취소</button>
              <button type="button" onClick={addPrinciple} disabled={principleSaving || !principleForm.title.trim()} style={{ flex: 2, height: 40, border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 14, fontWeight: 700, cursor: principleSaving ? 'wait' : 'pointer' }}>저장</button>
            </div>
          </div>
        )}

        {principles.length === 0 && !showAddPrinciple && (
          <div style={{ padding: 24, textAlign: 'center', color: '#9AA3AF', fontSize: 14 }}>등록된 수업 원칙이 없습니다.</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {principles.map((p) => (
            <div key={p.id}>
              {principleEditId === p.id ? (
                <div style={{ padding: 16, background: '#F4F2EE', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={LABEL}>번호</label>
                      <input type="text" value={principleEditForm.number} onChange={(e) => setPrincipleEditForm((x) => ({ ...x, number: e.target.value }))} style={INPUT} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={LABEL}>제목</label>
                      <input type="text" value={principleEditForm.title} onChange={(e) => setPrincipleEditForm((x) => ({ ...x, title: e.target.value }))} style={INPUT} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={LABEL}>설명 (선택)</label>
                    <textarea rows={2} value={principleEditForm.description} onChange={(e) => setPrincipleEditForm((x) => ({ ...x, description: e.target.value }))} style={TEXTAREA} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => deletePrinciple(p.id)} style={{ height: 40, padding: '0 14px', border: '1px solid #D5D0C6', borderRadius: 8, background: '#FFFFFF', color: '#8A3A1C', font: 'inherit', fontSize: 14, cursor: 'pointer' }}>삭제</button>
                    <button type="button" onClick={() => setPrincipleEditId(null)} style={{ flex: 1, height: 40, border: '1px solid #D5D0C6', borderRadius: 8, background: '#FFFFFF', font: 'inherit', fontSize: 14, cursor: 'pointer' }}>취소</button>
                    <button type="button" onClick={() => savePrinciple(p.id)} disabled={principleSaving} style={{ flex: 2, height: 40, border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 14, fontWeight: 700, cursor: principleSaving ? 'wait' : 'pointer' }}>저장</button>
                  </div>
                </div>
              ) : (
                <div onClick={() => { setPrincipleEditId(p.id); setPrincipleEditForm({ number: p.number, title: p.title, description: p.description ?? '' }); }} style={{ padding: '12px 16px', border: '1px solid #E8E4DB', borderRadius: 10, cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1E5645', minWidth: 28 }}>{p.number}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</div>
                    {p.description && <div style={{ fontSize: 13, color: '#5A6270', marginTop: 2 }}>{p.description}</div>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 교실·시설 */}
      <div style={{ padding: 24, background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>교실·시설</div>
          <button type="button" onClick={() => { setShowAddFacility(true); setFacilityEditId(null); }} style={{ height: 36, padding: '0 14px', border: '1px solid #D5D0C6', borderRadius: 8, background: '#FFFFFF', font: 'inherit', fontSize: 13, cursor: 'pointer' }}>+ 추가</button>
        </div>
        <div style={{ fontSize: 13, color: '#9AA3AF' }}>홈페이지 소개 페이지에 표시됩니다. 사진 URL을 입력하거나 레이블만 입력해도 됩니다.</div>

        {showAddFacility && (
          <div style={{ padding: 16, background: '#F4F2EE', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={LABEL}>공간 이름</label>
              <input type="text" value={facilityForm.label} onChange={(e) => setFacilityForm((p) => ({ ...p, label: e.target.value }))} placeholder="자기주도학습실, 수업 교실, 도서관 등" style={INPUT} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={LABEL}>사진 URL (선택)</label>
              <input type="url" value={facilityForm.photo} onChange={(e) => setFacilityForm((p) => ({ ...p, photo: e.target.value }))} placeholder="https://..." style={INPUT} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setShowAddFacility(false)} style={{ flex: 1, height: 40, border: '1px solid #D5D0C6', borderRadius: 8, background: '#FFFFFF', font: 'inherit', fontSize: 14, cursor: 'pointer' }}>취소</button>
              <button type="button" onClick={addFacility} disabled={facilitySaving || !facilityForm.label.trim()} style={{ flex: 2, height: 40, border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 14, fontWeight: 700, cursor: facilitySaving ? 'wait' : 'pointer' }}>저장</button>
            </div>
          </div>
        )}

        {facilities.length === 0 && !showAddFacility && (
          <div style={{ padding: 24, textAlign: 'center', color: '#9AA3AF', fontSize: 14 }}>등록된 시설이 없습니다.</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {facilities.map((f) => (
            <div key={f.id}>
              {facilityEditId === f.id ? (
                <div style={{ padding: 14, background: '#F4F2EE', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input type="text" value={facilityEditForm.label} onChange={(e) => setFacilityEditForm((x) => ({ ...x, label: e.target.value }))} placeholder="공간 이름" style={INPUT} />
                  <input type="url" value={facilityEditForm.photo} onChange={(e) => setFacilityEditForm((x) => ({ ...x, photo: e.target.value }))} placeholder="사진 URL (선택)" style={INPUT} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" onClick={() => deleteFacility(f.id)} style={{ height: 36, padding: '0 10px', border: '1px solid #D5D0C6', borderRadius: 8, background: '#FFFFFF', color: '#8A3A1C', font: 'inherit', fontSize: 13, cursor: 'pointer' }}>삭제</button>
                    <button type="button" onClick={() => setFacilityEditId(null)} style={{ flex: 1, height: 36, border: '1px solid #D5D0C6', borderRadius: 8, background: '#FFFFFF', font: 'inherit', fontSize: 13, cursor: 'pointer' }}>취소</button>
                    <button type="button" onClick={() => saveFacility(f.id)} disabled={facilitySaving} style={{ flex: 2, height: 36, border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 13, fontWeight: 700, cursor: facilitySaving ? 'wait' : 'pointer' }}>저장</button>
                  </div>
                </div>
              ) : (
                <div onClick={() => { setFacilityEditId(f.id); setFacilityEditForm({ label: f.label, photo: f.photo ?? '' }); }} style={{ borderRadius: 10, border: '1px solid #E8E4DB', overflow: 'hidden', cursor: 'pointer' }}>
                  {f.photo ? (
                    <div style={{ height: 100, background: `#E8E4DB url(${f.photo}) center/cover no-repeat` }} />
                  ) : (
                    <div style={{ height: 100, background: '#F4F2EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#9AA3AF' }}>사진 없음</div>
                  )}
                  <div style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600 }}>{f.label}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 환불 정책 */}
      <div style={{ padding: 24, background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>환불 정책</div>
        <div style={{ padding: '14px 16px', background: '#FBF1CF', borderRadius: 10, fontSize: 13, lineHeight: 1.7, color: '#3E3510' }}>
          학원법 시행령 제18조에 따른 기준을 참고하여 작성하세요. 홈페이지 수강료 안내 페이지에 표시됩니다.
        </div>
        <textarea
          rows={6}
          value={refundPolicyText}
          onChange={(e) => setRefundPolicyText(e.target.value)}
          placeholder={'수업 시작 전: 이미 낸 교습비 전액\n총 교습시간 1/3 지나기 전: 2/3 환불\n총 교습시간 1/2 지나기 전: 1/2 환불\n총 교습시간 1/2 지난 후: 환불 없음'}
          style={TEXTAREA}
        />
        <button
          type="button"
          onClick={saveRefundPolicy}
          disabled={refundSaving}
          style={{ height: 44, border: 'none', borderRadius: 10, background: refundSaved ? '#2F6E5A' : '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 14, fontWeight: 700, cursor: refundSaving ? 'wait' : 'pointer', transition: 'background 0.3s' }}
        >
          {refundSaved ? '저장 완료 ✓' : refundSaving ? '저장 중…' : '환불 정책 저장'}
        </button>
      </div>

      {/* 교습비 변경 이력 */}
      {feeChangeLogs.length > 0 && (
        <div style={{ padding: 24, background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>교습비 변경 이력</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #EEEAE2' }}>
                <th style={{ padding: '8px 0', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>변경 시각</th>
                <th style={{ padding: '8px 0', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>변경자</th>
              </tr>
            </thead>
            <tbody>
              {feeChangeLogs.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #F5F3EF' }}>
                  <td style={{ padding: '8px 0', color: '#8A93A8' }}>
                    {new Date(l.createdAt).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td style={{ padding: '8px 0', color: '#5A6270' }}>{l.actorEmail}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 12, color: '#9AA3AF' }}>최근 10건. 변경 전 금액 전체는 DB에 보관됩니다.</div>
        </div>
      )}
    </>
  );
}
