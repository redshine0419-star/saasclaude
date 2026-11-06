'use client';

import { useState } from 'react';
import { ConsentList } from '@/components/legal/ConsentList';
import { joinConsents } from '@/lib/legal/consents';

type Props = { slug: string; token: string; academyName: string };

const input = 'h-[52px] px-4 rounded-[10px] border border-input-line text-[16px] bg-bg focus:outline-none focus:border-accent w-full min-w-0';
const label = 'text-[14px] font-semibold';
const GRADES = ['초1', '초2', '초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3', '기타'];

export default function JoinForm({ slug, token, academyName }: Props) {
  const [f, setF] = useState({ studentName: '', grade: '', school: '', studentPhone: '', parentName: '', parentPhone: '', memo: '', _hp: '' });
  const [guardian, setGuardian] = useState(false);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!guardian || !agree) {
      setError('학부모 확인과 개인정보 수집·이용 동의에 체크해 주세요.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/${slug}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, token, guardianConfirmed: guardian, consentAgreed: agree }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? '제출하지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : '제출하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="p-6 md:p-10 bg-white rounded-[24px] flex flex-col gap-3 text-[16px] leading-relaxed">
        <div className="text-[20px] font-bold">등록 정보를 보냈습니다</div>
        <div>학원에서 확인한 뒤 등록을 마칩니다. 고칠 내용이 있으면 같은 링크로 다시 보내 주시면 최근 내용으로 바뀝니다.</div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="p-6 md:p-[44px] bg-white rounded-[24px] flex flex-col gap-6">
      {/* 허니팟 */}
      <input type="text" name="_hp" value={f._hp} onChange={set('_hp')} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      <fieldset className="flex flex-col gap-4 border-0 p-0 m-0 min-w-0">
        <legend className="text-[17px] font-bold mb-3">학생 정보</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2 min-w-0">
            <label htmlFor="j-sname" className={label}>학생 이름</label>
            <input id="j-sname" required maxLength={40} value={f.studentName} onChange={set('studentName')} className={input} autoComplete="off" />
          </div>
          <div className="flex flex-col gap-2 min-w-0">
            <label htmlFor="j-grade" className={label}>학년</label>
            <select id="j-grade" value={f.grade} onChange={set('grade')} className={input}>
              <option value="">선택</option>
              {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2 min-w-0">
            <label htmlFor="j-school" className={label}>학교 <span className="font-normal text-body">(선택)</span></label>
            <input id="j-school" maxLength={40} value={f.school} onChange={set('school')} className={input} />
          </div>
          <div className="flex flex-col gap-2 min-w-0">
            <label htmlFor="j-sphone" className={label}>학생 연락처 <span className="font-normal text-body">(선택)</span></label>
            <input id="j-sphone" type="tel" inputMode="tel" maxLength={20} value={f.studentPhone} onChange={set('studentPhone')} placeholder="010-0000-0000" className={input} />
          </div>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 border-0 p-0 m-0 min-w-0">
        <legend className="text-[17px] font-bold mb-3">학부모 정보</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2 min-w-0">
            <label htmlFor="j-pname" className={label}>학부모 성함</label>
            <input id="j-pname" required maxLength={40} value={f.parentName} onChange={set('parentName')} className={input} />
          </div>
          <div className="flex flex-col gap-2 min-w-0">
            <label htmlFor="j-pphone" className={label}>학부모 연락처</label>
            <input id="j-pphone" required type="tel" inputMode="tel" maxLength={20} value={f.parentPhone} onChange={set('parentPhone')} placeholder="010-0000-0000" className={input} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="j-memo" className={label}>학원에 전할 말 <span className="font-normal text-body">(선택)</span></label>
          <textarea id="j-memo" maxLength={300} value={f.memo} onChange={set('memo')} placeholder="희망 반, 연락 가능한 시간 등" className="h-24 px-4 py-3 rounded-[10px] border border-input-line text-[16px] bg-bg resize-none focus:outline-none focus:border-accent" />
        </div>
      </fieldset>

      <ConsentList items={joinConsents(academyName)} values={{ guardian, privacy: agree }} onChange={(v) => { setGuardian(!!v.guardian); setAgree(!!v.privacy); }} allLabel="아래 내용에 모두 동의합니다." idPrefix="join" />

      {error && <div role="alert" className="text-[14px] text-[#B42318]">{error}</div>}

      <button type="submit" disabled={busy} className="h-[56px] rounded-[12px] bg-accent text-white text-[17px] font-bold border-0 cursor-pointer disabled:opacity-60">
        {busy ? '보내는 중…' : '등록 정보 보내기'}
      </button>
    </form>
  );
}
