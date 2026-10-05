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

interface Props {
  slug: string;
  tenant: TenantInfo;
  director: DirectorInfo | null;
  fees: FeeRow[];
  feeChangeLogs: FeeChangeLog[];
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

export function InfoClient({ slug, tenant: initialTenant, director: initialDirector, fees: initialFees, feeChangeLogs }: Props) {
  const [info, setInfo] = useState(initialTenant);
  const [director, setDirector] = useState<DirectorInfo>(
    initialDirector ?? { headline: null, career: null, philosophy: null, education: null }
  );
  const [fees, setFees] = useState(initialFees);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showFeeConfirm, setShowFeeConfirm] = useState(false);

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
