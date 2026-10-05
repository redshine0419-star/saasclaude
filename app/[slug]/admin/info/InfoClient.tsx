'use client';

import { useState } from 'react';

interface TenantInfo {
  name: string;
  regNo: string | null;
  phone: string | null;
  hours: string | null;
  address: string | null;
}

interface DirectorInfo {
  headline: string | null;
  career: string | null;
}

interface FeeRow {
  id: string;
  label: string;
  amount: number;
}

interface Props {
  slug: string;
  tenant: TenantInfo;
  director: DirectorInfo | null;
  fees: FeeRow[];
}

export function InfoClient({ slug, tenant: initialTenant, director: initialDirector, fees: initialFees }: Props) {
  const [info, setInfo] = useState(initialTenant);
  const [director, setDirector] = useState<DirectorInfo>(initialDirector ?? { headline: null, career: null });
  const [fees, setFees] = useState(initialFees);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showFeeConfirm, setShowFeeConfirm] = useState(false);
  const [pendingFees, setPendingFees] = useState<FeeRow[] | null>(null);

  const feeChanged = fees.some((f) => {
    const orig = initialFees.find((o) => o.id === f.id);
    return orig && orig.amount !== f.amount;
  });

  async function save(confirmed = false) {
    if (feeChanged && !confirmed) {
      setPendingFees(fees);
      setShowFeeConfirm(true);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/${slug}/admin/info`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ info, director, fees: fees.map((f) => ({ id: f.id, amount: f.amount })) }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
      setShowFeeConfirm(false);
    }
  }

  return (
    <>
      {/* Fee change confirm modal */}
      {showFeeConfirm && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 32, maxWidth: 400, width: '90%', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>교습비 변경 확인</div>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: '#3E4652' }}>
              교습비를 변경하셨습니다. 교육지원청에 신고한 금액과 같은지 확인해 주세요.
              변경 신고가 필요하다면 먼저 신고 후 저장하세요.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setShowFeeConfirm(false)} style={{ flex: 1, height: 48, border: '1px solid #D5D0C6', borderRadius: 10, background: '#FFFFFF', font: 'inherit', fontSize: 14, cursor: 'pointer' }}>
                취소 (다시 확인)
              </button>
              <button type="button" onClick={() => save(true)} style={{ flex: 1, height: 48, border: 'none', borderRadius: 10, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                신고 완료, 저장
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 20, flex: 1 }}>
        {/* Left: basic info + director */}
        <div style={{ flex: 1, padding: 24, background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>기본 정보</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {([
              ['학원명', 'name', 'text', '[학원명]'],
              ['학원등록번호', 'regNo', 'text', '제0000호'],
              ['대표 전화', 'phone', 'tel', '000-0000-0000'],
              ['운영 시간', 'hours', 'text', '평일 14:00–22:00'],
            ] as const).map(([label, key, type, placeholder]) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>{label}</label>
                <input
                  type={type}
                  value={(info[key as keyof TenantInfo] as string) ?? ''}
                  onChange={(e) => setInfo((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{ height: 44, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>주소</label>
            <input
              type="text"
              value={info.address ?? ''}
              onChange={(e) => setInfo((p) => ({ ...p, address: e.target.value }))}
              placeholder="도로명 주소"
              style={{ height: 44, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}
            />
          </div>

          <div style={{ fontSize: 16, fontWeight: 700, paddingTop: 10 }}>원장 소개</div>
          <div style={{ display: 'flex', gap: 14 }}>
            <button type="button" style={{ width: 110, height: 140, flexShrink: 0, border: '1px dashed #B7B0A2', borderRadius: 10, background: '#FAF9F6', font: 'inherit', fontSize: 13, color: '#3E4652', cursor: 'pointer' }}>
              사진 변경
            </button>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>한 줄 소개</label>
              <input
                type="text"
                value={director.headline ?? ''}
                onChange={(e) => setDirector((p) => ({ ...p, headline: e.target.value }))}
                placeholder="아이가 왜 틀렸는지 알 때까지 같이 봅니다"
                style={{ height: 44, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}
              />
              <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270', marginTop: 4 }}>경력</label>
              <input
                type="text"
                value={director.career ?? ''}
                onChange={(e) => setDirector((p) => ({ ...p, career: e.target.value }))}
                placeholder="OO대 수학교육과 · 운영 N년"
                style={{ height: 44, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}
              />
            </div>
          </div>
        </div>

        {/* Right: fees */}
        <div style={{ width: 460, padding: 24, boxSizing: 'border-box', background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>교습비</div>
            <button
              type="button"
              onClick={() => setFees((p) => [...p, { id: `new-${Date.now()}`, label: '새 과정', amount: 0 }])}
              style={{ height: 36, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, background: '#FFFFFF', font: 'inherit', fontSize: 13, cursor: 'pointer' }}
            >
              행 추가
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#5A6270' }}>
                <th style={{ padding: '8px 0', fontWeight: 500 }}>과정</th>
                <th style={{ padding: '8px 0', fontWeight: 500 }}>월 교습비</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((fee, i) => (
                <tr key={fee.id} style={{ borderTop: '1px solid #EEEAE2' }}>
                  <td style={{ padding: '12px 0' }}>
                    <input
                      type="text"
                      value={fee.label}
                      onChange={(e) =>
                        setFees((p) => p.map((f, j) => j === i ? { ...f, label: e.target.value } : f))
                      }
                      style={{ width: '100%', height: 38, padding: '0 10px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}
                    />
                  </td>
                  <td style={{ padding: '8px 0' }}>
                    <input
                      type="text"
                      value={fee.amount > 0 ? fee.amount.toLocaleString() : ''}
                      onChange={(e) => {
                        const n = Number(e.target.value.replace(/,/g, ''));
                        if (!isNaN(n)) setFees((p) => p.map((f, j) => j === i ? { ...f, amount: n } : f));
                      }}
                      placeholder="000,000원"
                      aria-label={`${fee.label} 교습비`}
                      style={{ width: 140, height: 38, padding: '0 10px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}
                    />
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
            {saved ? '저장 완료' : saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </>
  );
}
