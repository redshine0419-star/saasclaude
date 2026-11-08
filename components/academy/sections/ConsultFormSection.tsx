'use client';

import { trackEvent } from '@/lib/analytics';
import { useState } from 'react';
import { ConsentList } from '@/components/legal/ConsentList';
import { consultConsents, requiredAgreed } from '@/lib/legal/consents';
import { weekdayLabel } from '@/lib/weekday';
import type { AcademyTenant, LevelTestSlot } from '@/lib/academy-data';
import { TitleLines } from '@/components/academy/TitleLines';
import { SECTION_COPY_SPEC } from '@/lib/section-copy';

type Props = {
  title?: string;
  eyebrow?: string;
  tenant: AcademyTenant;
  slots: LevelTestSlot[];
};

export default function ConsultFormSection({ tenant, slots, eyebrow = '무료 레벨 테스트', title = SECTION_COPY_SPEC.consult_form.title }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [grade, setGrade] = useState('');
  const [slotId, setSlotId] = useState('');
  const consentItems = consultConsents(tenant.name);
  const [consents, setConsents] = useState<Record<string, boolean>>({ guardian: false, privacy: false, ad: false, night: false });
  const agreed = requiredAgreed(consentItems, consents);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/${tenant.slug}/consult`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          tel: phone,
          grade,
          consultType: '레벨테스트 예약',
          slotId: slotId || null,
          guardianConfirmed: consents.guardian,
          agreePrivacy: consents.privacy,
          agreeMarketing: consents.ad,
          agreeNight: consents.ad && consents.night,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        trackEvent('generate_lead', { lead_type: 'academy_consult', consult_type: '레벨테스트 예약' });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="consult" className="acad-section acad-consult">
      <div className="acad-wrap grid grid-cols-1 md:grid-cols-[0.7fr_1.3fr] gap-7 md:gap-[50px] items-start">
        {/* 설명 */}
        <div className="min-w-0">
          <p className="acad-eyebrow">{eyebrow}</p>
          <h2 className="acad-h2 mb-3.5"><TitleLines text={title} /></h2>
          <p className="acad-consult-lead m-0 text-[14px] md:text-[15px] leading-[1.8] text-body">
            무료 레벨 테스트와 상담을 통해 우리 아이에게 맞는 반을 찾아드립니다.
          </p>
          {(tenant.address || tenant.phone || tenant.hours) && (
            <p className="acad-consult-lead m-0 mt-4 text-[14px] leading-[1.8] text-body">
              {[tenant.address, tenant.phone, tenant.hours].filter(Boolean).map((t, i) => <span key={i} className="block">{t}</span>)}
            </p>
          )}
        </div>

        {/* 폼 */}
        <div className="min-w-0">
          {submitted ? (
            <div className="acad-form acad-card p-8 flex flex-col items-center gap-4 text-center text-ink">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
              </div>
              <h3 className="m-0 font-serif text-[22px] font-bold text-ink">신청이 완료됐습니다</h3>
              <p className="m-0 text-[15px] text-muted">곧 연락드리겠습니다.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="acad-form acad-card p-[18px] md:p-[30px] grid grid-cols-1 sm:grid-cols-2 gap-[17px] text-ink">
              <div className="contents">
                <label className="flex flex-col gap-[7px] min-w-0">
                  <span className="text-[14px] font-semibold text-ink">학생 이름 <span className="text-warn-ink">*</span></span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동"
                    className="w-full min-w-0 px-3.5 py-[13px] rounded-[10px] border border-line bg-bg text-ink text-[15px] outline-none focus:border-accent transition-colors"
                  />
                </label>
                <label className="flex flex-col gap-[7px] min-w-0">
                  <span className="text-[14px] font-semibold text-ink">연락처 <span className="text-warn-ink">*</span></span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010-0000-0000"
                    className="w-full min-w-0 px-3.5 py-[13px] rounded-[10px] border border-line bg-bg text-ink text-[15px] outline-none focus:border-accent transition-colors"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-[7px] min-w-0">
                <span className="text-[14px] font-semibold text-ink">학년</span>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full min-w-0 px-3.5 py-[13px] rounded-[10px] border border-line bg-bg text-ink text-[15px] outline-none focus:border-accent transition-colors"
                >
                  <option value="">선택 (선택사항)</option>
                  {['중1', '중2', '중3', '고1', '고2', '고3'].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </label>

              {slots.length > 0 && (
                <label className="flex flex-col gap-[7px] min-w-0">
                  <span className="text-[14px] font-semibold text-ink">희망 테스트 일정</span>
                  <select
                    value={slotId}
                    onChange={(e) => setSlotId(e.target.value)}
                    className="w-full min-w-0 px-3.5 py-[13px] rounded-[10px] border border-line bg-bg text-ink text-[15px] outline-none focus:border-accent transition-colors"
                  >
                    <option value="">미정 (원장님과 협의)</option>
                    {slots.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.weekday != null ? `${weekdayLabel(s.weekday)}요일` : ''}{s.time ? ` ${s.time}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {/* 동의 — 학원이 개인정보처리자 (lib/legal/consents.ts consultConsents) */}
              <div className="sm:col-span-2 flex flex-col gap-2">
                <ConsentList items={consentItems} values={consents} onChange={setConsents} idPrefix="home-consult" />
                <a href={`/${tenant.slug}/privacy`} target="_blank" rel="noopener noreferrer" className="self-start text-[13px] text-body underline">개인정보처리방침 전문 보기</a>
              </div>

              <button
                type="submit"
                disabled={!agreed || loading}
                className="acad-btn sm:col-span-2 w-full h-[52px] text-[15px] border-0 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? '신청 중...' : '무료 레벨 테스트 신청'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
