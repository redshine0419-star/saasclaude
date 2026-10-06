'use client';

import { useRef, useState } from 'react';

const MAX_TEMPLATE_BODY = 1000;

interface Template {
  scenario: string;
  kind: string;
  body: string | null;
  approvedBody: string | null;
  reviewStatus: string;
}

interface AutomationSetting {
  scenario: string;
  enabled: boolean;
  delayRule: unknown;
}

interface Props {
  slug: string;
  settings: AutomationSetting[];
  templates: Template[];
  marketingConsentCount: number;
}

const SCENARIO_META: Record<
  string,
  { label: string; subtitle: string; isAd: boolean; order: number }
> = {
  receipt: {
    label: '① 상담 접수 확인',
    subtitle: '상담 신청 직후',
    isAd: false,
    order: 1,
  },
  reminder: {
    label: '② 레벨테스트 전날 리마인드',
    subtitle: '테스트 전날 18:00',
    isAd: false,
    order: 2,
  },
  followup: {
    label: '③ 미등록 후속 안내',
    subtitle: "상태가 '미등록'이 된 지 3일 후 · 체험수업 안내",
    isAd: true,
    order: 3,
  },
  campaign: {
    label: '④ 시즌 모집 공지',
    subtitle: '수동 발송',
    isAd: true,
    order: 4,
  },
};

const VARIABLE_CHIPS: Record<string, string[]> = {
  receipt: ['#{학부모명}', '#{학원명}', '#{학생학년}', '#{상담유형}'],
  reminder: ['#{학부모명}', '#{학원명}', '#{테스트일시}'],
  followup: ['#{학부모명}', '#{학원명}', '#{학생학년}'],
  campaign: ['#{학부모명}', '#{학원명}'],
  owner_alert: ['#{학부모명}', '#{학생학년}', '#{상담유형}'],
  reconfirm: ['#{학부모명}', '#{학원명}'],
};

const REVIEW_STATUS_LABEL: Record<string, string> = {
  approved: '카카오 검수 승인',
  pending: '검수 요청 중',
  rejected: '검수 반려',
  draft: '초안 저장됨',
};

const REVIEW_STATUS_STYLE: Record<string, React.CSSProperties> = {
  approved: { background: '#D8E8E0', color: '#1E5645' },
  pending: { background: '#FBF1CF', color: '#5A4A12' },
  rejected: { background: '#FCE4DC', color: '#8A3A1C' },
  draft: { background: '#E6E9EE', color: '#2C3747' },
};

function renderBody(body: string) {
  const parts = body.split(/(#\{[^}]+\})/g);
  return parts.map((part, i) =>
    part.startsWith('#{') ? (
      <span
        key={i}
        style={{
          background: '#E4EEE9',
          color: '#1E5645',
          padding: '0 4px',
          borderRadius: 4,
        }}
      >
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function KakaoAutomationClient({
  slug,
  settings,
  templates,
  marketingConsentCount,
}: Props) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(settings.map((s) => [s.scenario, s.enabled])),
  );
  const [selectedScenario, setSelectedScenario] = useState<string>('receipt');
  const [loading, setLoading] = useState<string | null>(null);
  const [editBodies, setEditBodies] = useState<Record<string, string>>(
    Object.fromEntries(templates.map((t) => [t.scenario, t.body ?? '']))
  );
  const [templateSaving, setTemplateSaving] = useState(false);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  function insertVariable(variable: string) {
    const ta = bodyTextareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const current = editBodies[selectedScenario] ?? '';
    const next = current.slice(0, start) + variable + current.slice(end);
    setEditBodies((p) => ({ ...p, [selectedScenario]: next }));
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + variable.length, start + variable.length);
    });
  }
  const [templateReviewStatus, setTemplateReviewStatus] = useState<Record<string, string>>(
    Object.fromEntries(templates.map((t) => [t.scenario, t.reviewStatus]))
  );

  const scenarios = ['receipt', 'reminder', 'followup', 'campaign'];
  const templateMap = Object.fromEntries(templates.map((t) => [t.scenario, t]));

  async function toggleScenario(scenario: string) {
    const next = !enabled[scenario];
    setLoading(scenario);
    try {
      const res = await fetch(`/api/${slug}/admin/automation/${scenario}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      });
      if (res.ok) {
        setEnabled((prev) => ({ ...prev, [scenario]: next }));
      }
    } finally {
      setLoading(null);
    }
  }

  async function submitTemplateBody() {
    setTemplateSaving(true);
    try {
      const res = await fetch(`/api/${slug}/admin/automation/${selectedScenario}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateBody: editBodies[selectedScenario] ?? '' }),
      });
      if (res.ok) {
        const data = await res.json();
        setTemplateReviewStatus((p) => ({ ...p, [selectedScenario]: data.reviewStatus }));
      }
    } finally {
      setTemplateSaving(false);
    }
  }

  const selectedTemplate = templateMap[selectedScenario];
  const selectedMeta = SCENARIO_META[selectedScenario];
  const previewBody = selectedTemplate?.approvedBody ?? selectedTemplate?.body ?? '';
  const currentReviewStatus = templateReviewStatus[selectedScenario] ?? selectedTemplate?.reviewStatus ?? 'draft';

  return (
    <div style={{ display: 'flex', gap: 20, flex: 1, minHeight: 0 }}>
      {/* Left: scenario list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {scenarios.map((sc) => {
          const meta = SCENARIO_META[sc];
          const tmpl = templateMap[sc];
          const isOn = enabled[sc] ?? false;
          const isCampaign = sc === 'campaign';

          return (
            <div
              key={sc}
              onClick={() => setSelectedScenario(sc)}
              style={{
                padding: 20,
                background: '#FFFFFF',
                border: selectedScenario === sc ? '2px solid #1E5645' : '1px solid #E2DDD2',
                borderRadius: 12,
                display: 'flex',
                gap: 16,
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>{meta.label}</span>
                  {meta.isAd ? (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 5,
                        background: '#FBF1CF',
                        color: '#5A4A12',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      광고성 · 동의자{isCampaign ? ` ${marketingConsentCount}명` : '만'}
                    </span>
                  ) : (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 5,
                        background: '#E6E9EE',
                        color: '#2C3747',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      알림톡 · 정보성
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 14, color: '#5A6270' }}>
                  {meta.subtitle}
                  {tmpl?.reviewStatus === 'approved' && ' · 검수 승인됨'}
                  {tmpl?.reviewStatus === 'pending' && ' · 검수 요청 중'}
                  {tmpl?.reviewStatus === 'rejected' && ' · 검수 반려됨'}
                  {tmpl?.reviewStatus === 'draft' && ' · 초안 저장됨'}
                </div>
              </div>

              {isCampaign ? (
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    height: 40,
                    padding: '0 14px',
                    border: '1px solid #D5D0C6',
                    borderRadius: 8,
                    background: '#FFFFFF',
                    font: 'inherit',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  발송 예약
                </button>
              ) : (
                <button
                  type="button"
                  aria-label={`자동 발송 ${isOn ? '켜짐' : '꺼짐'}`}
                  aria-pressed={isOn}
                  disabled={loading === sc}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleScenario(sc);
                  }}
                  style={{
                    width: 52,
                    height: 30,
                    border: 'none',
                    borderRadius: 15,
                    background: isOn ? '#1E5645' : '#C8CDD5',
                    padding: 3,
                    display: 'flex',
                    justifyContent: isOn ? 'flex-end' : 'flex-start',
                    cursor: loading === sc ? 'wait' : 'pointer',
                    transition: 'background 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      background: '#FFFFFF',
                      display: 'block',
                    }}
                  />
                </button>
              )}
            </div>
          );
        })}

        {/* Protection info box */}
        <div
          style={{
            marginTop: 4,
            padding: 20,
            background: '#FFFFFF',
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700 }}>광고성 메시지 자동 보호</div>
          <div style={{ fontSize: 14, color: '#3E4652', lineHeight: 1.8 }}>
            수신 동의자에게만 발송 · 메시지 앞 "(광고)" 자동 표기 · 21시~08시는 야간 동의자만 ·
            수신거부 방법 자동 포함
          </div>
        </div>
      </div>

      {/* Right: template preview */}
      <div
        style={{
          width: 440,
          padding: 24,
          background: '#FFFFFF',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedMeta?.label}</div>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 5,
              fontSize: 12,
              fontWeight: 700,
              ...(REVIEW_STATUS_STYLE[currentReviewStatus] ?? {}),
            }}
          >
            {REVIEW_STATUS_LABEL[currentReviewStatus] ?? currentReviewStatus}
          </span>
        </div>

        {/* Editable template body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>문구 편집</div>
          <textarea
            ref={bodyTextareaRef}
            value={editBodies[selectedScenario] ?? ''}
            onChange={(e) => {
              if (e.target.value.length <= MAX_TEMPLATE_BODY)
                setEditBodies((p) => ({ ...p, [selectedScenario]: e.target.value }));
            }}
            rows={6}
            placeholder={`안녕하세요, #{학부모명}님. ${selectedMeta?.label ?? ''}…`}
            style={{
              padding: '10px 12px',
              border: '1px solid #D5D0C6',
              borderRadius: 8,
              font: 'inherit',
              fontSize: 14,
              lineHeight: 1.7,
              resize: 'vertical',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ fontSize: 12, color: (editBodies[selectedScenario] ?? '').length > MAX_TEMPLATE_BODY * 0.9 ? '#B91C1C' : '#9AA3AF', textAlign: 'right' }}>
            {(editBodies[selectedScenario] ?? '').length} / {MAX_TEMPLATE_BODY}자
          </div>
        </div>

        {/* Kakao-style approved body preview */}
        {previewBody && (
          <div
            style={{
              padding: 20,
              background: '#E8E4DB',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 12, color: '#3E4652' }}>승인된 문구 미리보기</div>
            <div
              style={{
                padding: 16,
                background: '#FFFFFF',
                borderRadius: 12,
                fontSize: 14,
                lineHeight: 1.75,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ whiteSpace: 'pre-wrap' }}>{renderBody(previewBody)}</div>
              <div
                style={{
                  height: 40,
                  border: '1px solid #D5D0C6',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                학원 소개 보기
              </div>
            </div>
          </div>
        )}

        {/* Variable chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>사용 가능한 변수</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(VARIABLE_CHIPS[selectedScenario] ?? []).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => insertVariable(v)}
                title="클릭하면 커서 위치에 삽입됩니다"
                style={{
                  height: 32,
                  padding: '0 10px',
                  border: '1px solid #D5D0C6',
                  borderRadius: 6,
                  background: '#FFFFFF',
                  font: 'inherit',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Alimtalk notice */}
        <div
          style={{
            padding: 14,
            borderRadius: 10,
            background: '#FBF1CF',
            fontSize: 13,
            lineHeight: 1.7,
            color: '#3E3510',
          }}
        >
          알림톡은 정보성 문구만 가능합니다. 문구를 수정하면 카카오 재검수가 필요하며, 승인 전까지는
          기존 문구로 발송됩니다.
        </div>

        <button
          type="button"
          disabled={templateSaving}
          onClick={submitTemplateBody}
          style={{
            marginTop: 'auto',
            height: 48,
            border: 'none',
            borderRadius: 10,
            background: '#1E5645',
            color: '#FFFFFF',
            font: 'inherit',
            fontSize: 15,
            fontWeight: 700,
            cursor: templateSaving ? 'wait' : 'pointer',
            opacity: templateSaving ? 0.6 : 1,
          }}
        >
          {templateSaving ? '저장 중…' : '수정 후 재검수 요청'}
        </button>
      </div>
    </div>
  );
}
