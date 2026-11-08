'use client';

import { trackEvent } from '@/lib/analytics';
import { useState } from 'react';
import { ConsentList } from '@/components/legal/ConsentList';
import { consultConsents, requiredAgreed } from '@/lib/legal/consents';
import { useRouter, useSearchParams } from 'next/navigation';
import type { LevelTestSlot } from '@/lib/academy-data';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const CONSULT_TYPES = ['레벨테스트 예약', '전화 상담', '방문 상담'];
const GRADES = ['중1', '중2', '중3', '고1', '고2'];

function slotLabel(s: LevelTestSlot) {
  const wd = s.weekday !== null ? WEEKDAY_LABELS[s.weekday] ?? '' : '';
  return `${wd} ${s.time ?? ''}`.trim();
}

export default function ConsultForm({ slug, slots, academyName = '학원' }: { slug: string; slots: LevelTestSlot[]; academyName?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const utm = {
    source: searchParams.get('utm_source'),
    medium: searchParams.get('utm_medium'),
    campaign: searchParams.get('utm_campaign'),
    content: searchParams.get('utm_content'),
    term: searchParams.get('utm_term'),
  };
  const waitlistClass = searchParams.get('class');
  const isWaitlist = searchParams.get('waitlist') === '1';
  const defaultMessage = waitlistClass && isWaitlist
    ? `대기 신청합니다 — ${waitlistClass}`
    : '';

  const typeParam = searchParams.get('type');
  const [consultType, setConsultType] = useState(
    typeParam && CONSULT_TYPES.includes(typeParam) ? typeParam : CONSULT_TYPES[0]
  );
  const [selectedSlot, setSelectedSlot] = useState<string | null>(slots[0]?.id ?? null);
  const [customTime, setCustomTime] = useState(false);
  const [grade, setGrade] = useState('');
  const [message, setMessage] = useState(defaultMessage);
  const consentItems = consultConsents(academyName);
  const [consents, setConsents] = useState<Record<string, boolean>>({ guardian: false, privacy: false, ad: false, night: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!requiredAgreed(consentItems, consents)) {
      setError('필수 동의 항목(학부모 확인, 개인정보 수집·이용)에 동의해 주세요.');
      return;
    }
    setSubmitting(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get('name') as string,
      tel: fd.get('tel') as string,
      grade: fd.get('grade') as string,
      school: fd.get('school') as string,
      consultType,
      slotId: customTime ? 'custom' : selectedSlot,
      message: message || (fd.get('message') as string),
      guardianConfirmed: consents.guardian,
      agreePrivacy: consents.privacy,
      agreeMarketing: consents.ad,
      agreeNight: consents.ad && consents.night,
      utm: Object.values(utm).some(Boolean) ? utm : undefined,
      _hp: fd.get('_hp') as string, // honeypot: 봇이 채우면 서버에서 무시
    };

    try {
      const res = await fetch(`/api/${slug}/consult`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('서버 오류가 발생했습니다.');
      const data = await res.json();
      trackEvent('generate_lead', { lead_type: 'academy_consult', consult_type: consultType });
      const slotLabelStr = customTime ? '다른 시간' : (slots.find((s) => s.id === selectedSlot) ? slotLabel(slots.find((s) => s.id === selectedSlot)!) : '');
      const params = new URLSearchParams({ type: consultType, time: slotLabelStr, grade: body.grade });
      if (data.leadId) params.set('ref', (data.leadId as string).slice(-8).toUpperCase());
      router.push(`/${slug}/consult/done?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 md:p-[44px] bg-white rounded-[24px] flex flex-col gap-5"
    >
      {/* 허니팟: 사람은 안 보이고 봇만 채운다 */}
      <input name="_hp" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />
      {/* 이름 + 연락처 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="c-name" className="text-[14px] font-semibold">학부모 성함</label>
          <input
            id="c-name"
            name="name"
            type="text"
            placeholder="홍길동"
            required
            className="h-[52px] px-4 rounded-[10px] border border-input-line text-[16px] bg-bg focus:outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="c-tel" className="text-[14px] font-semibold">연락처</label>
          <input
            id="c-tel"
            name="tel"
            type="tel"
            placeholder="010-0000-0000"
            required
            className="h-[52px] px-4 rounded-[10px] border border-input-line text-[16px] bg-bg focus:outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="c-grade" className="text-[14px] font-semibold">학생 학년</label>
          <select
            id="c-grade"
            name="grade"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            required
            className="h-[52px] px-3 rounded-[10px] border border-input-line text-[16px] bg-bg focus:outline-none focus:border-accent"
          >
            <option value="">학년 선택</option>
            {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="c-school" className="text-[14px] font-semibold">학교 <span className="font-normal text-body">(선택)</span></label>
          <input
            id="c-school"
            name="school"
            type="text"
            placeholder="OO중학교"
            className="h-[52px] px-4 rounded-[10px] border border-input-line text-[16px] bg-bg focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* 상담 유형 */}
      <div className="flex flex-col gap-2">
        <div className="text-[14px] font-semibold">원하시는 상담</div>
        <div className="grid grid-cols-3 gap-2">
          {CONSULT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={consultType === t}
              onClick={() => setConsultType(t)}
              className={[
                'h-[52px] rounded-[10px] text-[14px] font-medium transition-colors',
                consultType === t
                  ? 'border-2 border-accent bg-[#E4EEE9] text-accent font-bold'
                  : 'border border-input-line bg-white text-ink',
              ].join(' ')}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 희망 시간 (레벨테스트 예약 시만) */}
      {consultType === '레벨테스트 예약' && slots.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-[14px] font-semibold">희망 테스트 시간</div>
          <div className="flex gap-2 flex-wrap">
            {slots.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => { setSelectedSlot(s.id); setCustomTime(false); }}
                className={[
                  'h-12 px-[18px] rounded-[10px] text-[14px] transition-colors',
                  !customTime && selectedSlot === s.id
                    ? 'border-2 border-accent bg-[#E4EEE9] text-accent font-bold'
                    : 'border border-input-line bg-white text-ink',
                ].join(' ')}
              >
                {slotLabel(s)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => { setCustomTime(true); setSelectedSlot(null); }}
              className={[
                'h-12 px-[18px] rounded-[10px] text-[14px] transition-colors',
                customTime
                  ? 'border-2 border-accent bg-[#E4EEE9] text-accent font-bold'
                  : 'border border-input-line bg-white text-ink',
              ].join(' ')}
            >
              다른 시간 원해요
            </button>
          </div>
        </div>
      )}

      {/* 메시지 */}
      <div className="flex flex-col gap-2">
        <label htmlFor="c-msg" className="text-[14px] font-semibold">궁금한 점 <span className="font-normal text-body">(선택)</span></label>
        <textarea
          id="c-msg"
          name="message"
          placeholder="아이의 현재 상황이나 궁금한 점을 적어주세요"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="h-24 px-4 py-3 rounded-[10px] border border-input-line text-[16px] bg-bg resize-none focus:outline-none focus:border-accent"
        />
      </div>

      {/* 동의 — 학원이 개인정보처리자 (lib/legal/consents.ts consultConsents) */}
      <ConsentList items={consentItems} values={consents} onChange={setConsents} idPrefix="consult" />
      <a href={`/${slug}/privacy`} target="_blank" rel="noopener noreferrer" className="self-start text-[13px] text-body underline">개인정보처리방침 전문 보기</a>

      {error && <p className="text-red-600 text-[14px]">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="h-[60px] rounded-[12px] bg-accent text-on-accent text-[18px] font-bold disabled:opacity-60 hover:opacity-90 transition-opacity"
      >
        {submitting ? '제출 중...' : '상담 신청하기'}
      </button>
    </form>
  );
}
