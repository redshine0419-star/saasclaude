'use client';

import { useState } from 'react';
import { STATUTORY_REFUND_LINES } from '@/lib/refund';

/**
 * 학원 정보 › 환불 정책 — 예시 문구를 복사하거나 입력칸에 바로 넣는다.
 * 예시는 모두 법정 반환 기준(lib/refund.ts) 그대로이거나, 학습자에게 불리하지 않은 안내만 더한 것이다.
 */
const EXAMPLES: { key: string; title: string; desc: string; text: string }[] = [
  {
    key: 'statutory',
    title: '법정 기준 그대로',
    desc: '학원법 시행령의 교습비 반환 기준입니다. 따로 정한 규정이 없다면 이대로 쓰면 됩니다.',
    text: STATUTORY_REFUND_LINES.join('\n'),
  },
  {
    key: 'with-steps',
    title: '법정 기준 + 반환 절차 안내',
    desc: '법정 기준에 신청 방법과 돌려드리는 방법을 덧붙인 예시입니다. 학원에 맞게 고쳐 쓰세요.',
    text: [
      ...STATUTORY_REFUND_LINES,
      '반환 신청: 학원 대표 전화나 문자로 수강을 그만둔다고 알려 주세요. 알려 주신 날을 반환 사유가 생긴 날로 봅니다.',
      '반환 방법: 납부하신 방법으로 돌려드립니다(카드 결제는 결제 취소, 그 밖에는 보호자 계좌로 이체).',
    ].join('\n'),
  },
];

const BTN: React.CSSProperties = { height: 34, padding: '0 12px', borderRadius: 8, border: '1px solid #D5D0C6', background: '#FFFFFF', color: '#1B2430', font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' };

export function RefundExamples({ current, onApply }: { current: string; onApply: (text: string) => void }) {
  const [open, setOpen] = useState(!current.trim());
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 클립보드를 쓸 수 없는 브라우저 — 숨은 입력칸으로 복사
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(key);
    window.setTimeout(() => setCopied((k) => (k === key ? null : k)), 2000);
  }

  function apply(text: string) {
    if (current.trim() && current.trim() !== text && !window.confirm('지금 입력칸의 내용을 예시로 바꿀까요?')) return;
    onApply(text);
  }

  return (
    <div style={{ border: '1px solid #E2DDD2', borderRadius: 10, overflow: 'hidden' }}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', border: 'none', background: '#FAF9F6', font: 'inherit', fontSize: 14, fontWeight: 700, color: '#1B2430', cursor: 'pointer', textAlign: 'left' }}>
        <span>예시 문구 보기 · 복사</span>
        <span aria-hidden="true" style={{ color: '#8A93A0' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {EXAMPLES.map((ex) => (
            <div key={ex.key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{ex.title}</div>
              <div style={{ fontSize: 12.5, color: '#5A6270', lineHeight: 1.6 }}>{ex.desc}</div>
              <pre style={{ margin: 0, padding: '10px 12px', borderRadius: 8, background: '#F4F2EE', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'keep-all', fontFamily: 'inherit', color: '#3E4652' }}>{ex.text}</pre>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" style={BTN} onClick={() => copy(ex.key, ex.text)}>{copied === ex.key ? '복사했습니다 ✓' : '복사'}</button>
                <button type="button" style={{ ...BTN, border: 'none', background: '#1E5645', color: '#FFFFFF' }} onClick={() => apply(ex.text)}>입력칸에 넣기</button>
              </div>
            </div>
          ))}
          <div style={{ fontSize: 12.5, color: '#8A3A1C', lineHeight: 1.6 }}>
            학원 규정은 법정 기준보다 학습자에게 불리하게 정할 수 없습니다. &lsquo;환불 불가&rsquo;, &lsquo;중도 환불 없음&rsquo; 같은 문구는 쓰지 마세요.
          </div>
        </div>
      )}
    </div>
  );
}
