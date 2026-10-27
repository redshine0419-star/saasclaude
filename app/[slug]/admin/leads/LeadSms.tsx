'use client';

import { useMemo, useState } from 'react';
import { smsHref, smsTemplates } from '@/lib/messaging/sms-link';

type Props = { slug: string; leadId: string; phone: string; academyName: string; parentName: string; grade: string | null; testAt: string | null };

const CHIP: React.CSSProperties = { height: 30, padding: '0 10px', borderRadius: 15, border: '1px solid #D5D0C6', font: 'inherit', fontSize: 12, cursor: 'pointer', minHeight: 0 };

/**
 * 원장 휴대폰 문자 앱을 번호·내용이 채워진 채로 연다 (선생님이 직접 보내는 문자).
 * 실제 발송은 휴대폰에서 원장이 누른다 — 진행 기록에는 '문자 보내기'를 연 기록만 남긴다(본문은 저장하지 않음).
 */
export function LeadSms({ slug, leadId, phone, academyName, parentName, grade, testAt }: Props) {
  const templates = useMemo(() => smsTemplates({ academyName, parentName, grade, testAt }), [academyName, parentName, grade, testAt]);
  const [key, setKey] = useState(templates[0].key);
  const [body, setBody] = useState(templates[0].body);
  const [copied, setCopied] = useState(false);

  function choose(k: string) {
    const t = templates.find((x) => x.key === k);
    if (!t) return;
    setKey(k);
    setBody(t.body);
    setCopied(false);
  }

  function logOpened() {
    // 기록 실패는 문자 보내기를 막지 않는다
    fetch(`/api/${slug}/admin/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smsOpened: key }),
      keepalive: true, // 문자 앱으로 넘어가도 기록 요청이 끊기지 않게
    }).catch(() => {});
  }

  return (
    <div style={{ padding: 14, borderRadius: 10, background: '#F4F2EE', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {templates.map((t) => (
          <button key={t.key} type="button" onClick={() => choose(t.key)} style={{ ...CHIP, background: key === t.key ? '#1B2430' : '#FFFFFF', color: key === t.key ? '#FFFFFF' : '#3E4652' }}>
            {t.label}
          </button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={(e) => { setBody(e.target.value); setCopied(false); }}
        rows={5}
        maxLength={1000}
        aria-label="문자 내용"
        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14, lineHeight: 1.6, resize: 'vertical', background: '#FFFFFF' }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <a
          href={smsHref(phone, body)}
          onClick={logOpened}
          style={{ flex: 2, height: 42, borderRadius: 8, background: '#1E5645', color: '#FFFFFF', textDecoration: 'none', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          문자 앱 열기
        </a>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(body);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
          style={{ flex: 1, height: 42, borderRadius: 8, border: '1px solid #D5D0C6', background: '#FFFFFF', font: 'inherit', fontSize: 13, cursor: 'pointer' }}
        >
          {copied ? '복사했습니다' : '문구 복사'}
        </button>
      </div>
      <div style={{ fontSize: 12, color: '#5A6270', lineHeight: 1.6 }}>
        휴대폰에서 누르면 문자 앱이 받는 사람·내용이 채워진 채로 열립니다. PC에서는 &ldquo;문구 복사&rdquo;를 써 주세요.
        할인·모집 홍보 같은 광고성 문자는 (광고) 표기와 수신 동의가 필요합니다.
      </div>
    </div>
  );
}
