/**
 * 휴대폰 문자 앱을 받는 사람·내용이 채워진 채로 여는 링크 (원장이 직접 보내는 문자).
 * `?&body=`는 iOS(&body)와 안드로이드(?body) 모두에서 동작하는 형식이다.
 * PC에는 문자 앱이 없으므로 화면에서 '문구 복사'를 함께 제공한다.
 */
export function smsHref(phone: string, body: string): string {
  return `sms:${phone.replace(/[^0-9+]/g, '')}?&body=${encodeURIComponent(body)}`;
}

export type SmsTemplate = { key: string; label: string; body: string };

type Ctx = { academyName: string; parentName: string; grade: string | null; testAt: string | null };

const KST = 9 * 3600 * 1000;
function kstWhen(iso: string): string {
  const d = new Date(new Date(iso).getTime() + KST);
  const w = ['일', '월', '화', '수', '목', '금', '토'][d.getUTCDay()];
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일(${w}) ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

/**
 * 상담 응대용 문구 (정보성). 광고성 내용(할인·모집 홍보)은 넣지 않는다 —
 * 광고성 문자는 (광고) 표기·수신 동의·야간 금지 규정이 따로 있다(SPEC 8장).
 */
export function smsTemplates({ academyName, parentName, grade, testAt }: Ctx): SmsTemplate[] {
  const who = `${parentName} 학부모님`;
  const child = grade ? `${grade} 자녀` : '자녀';
  return [
    { key: 'receipt', label: '접수 확인', body: `[${academyName}] 안녕하세요, ${who}. 상담 신청 잘 받았습니다. ${child}의 학습 상황을 여쭤보고 맞는 수업을 안내드리려고 합니다. 통화 편한 시간을 알려 주세요.` },
    { key: 'missed', label: '부재 시', body: `[${academyName}] ${who}, 상담 신청 건으로 전화드렸는데 연결이 되지 않았습니다. 편하신 시간에 이 번호로 전화나 문자 주시면 바로 연락드리겠습니다.` },
    { key: 'test', label: '레벨테스트 일정', body: `[${academyName}] ${who}, ${testAt ? `레벨테스트는 ${kstWhen(testAt)}입니다.` : '레벨테스트 일정을 잡으려고 합니다. 가능한 요일과 시간을 알려 주세요.'} 30~40분 정도 걸리고, 끝나면 결과를 바로 설명드립니다.` },
    { key: 'result', label: '테스트 결과', body: `[${academyName}] ${who}, 레벨테스트 결과를 정리했습니다. 단원별 결과와 맞는 반을 안내드리려고 하니 통화 가능한 시간을 알려 주세요.` },
    { key: 'enroll', label: '등록 안내', body: `[${academyName}] ${who}, 등록해 주셔서 감사합니다. 첫 수업 일정과 준비물을 안내드리겠습니다. 궁금하신 점은 언제든 이 번호로 연락 주세요.` },
  ];
}
