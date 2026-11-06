import { TERMS } from './documents';

/**
 * 동의 항목 정의 — 화면(components/legal/ConsentList.tsx)과 서버 검사가 같은 목록을 쓴다.
 * 개인정보 수집·이용 동의는 개인정보 보호법 제15조 제2항 고지 사항(항목·목적·보유 기간·거부 권리와 불이익)을 표로 보여 준다.
 * 제3자 제공은 실제로 다른 회사가 자기 목적으로 받는 곳(결제대행사)에만 받는다.
 * TODO(확인 필요): 오픈 전 법률 검토
 */

export type ConsentItem = {
  key: string;
  required: boolean;
  label: string;
  /** 펼치면 보이는 표 */
  table?: { head: [string, string, string]; rows: [string, string, string][] };
  /** 펼치면 보이는 문단 */
  text?: string[];
  /** 펼치면 보이는 약관 전문 */
  sections?: { title: string; body: string[] }[];
  /** 이 항목이 켜져 있을 때만 보인다 */
  dependsOn?: string;
};

const PRIVACY_HEAD: [string, string, string] = ['수집 항목', '이용 목적', '보유 기간'];
const REFUSE_REQUIRED = '동의를 거부할 수 있습니다. 다만 필수 항목이라 거부하면 서비스를 이용할 수 없습니다.';
const REFUSE_OPTIONAL = '동의를 거부할 수 있으며, 동의하지 않아도 서비스 이용에 제한이 없습니다. 언제든 철회할 수 있습니다.';

/** 첫등원 회원가입 */
export const SIGNUP_CONSENTS: ConsentItem[] = [
  { key: 'age', required: true, label: '만 14세 이상입니다.', text: ['첫등원은 만 14세 미만 아동의 회원가입을 받지 않습니다.'] },
  { key: 'terms', required: true, label: '서비스 이용약관', sections: TERMS },
  {
    key: 'privacy',
    required: true,
    label: '개인정보 수집 및 이용',
    table: { head: PRIVACY_HEAD, rows: [['Google 계정의 이름, 이메일, 프로필 사진', '회원 식별·로그인, 학원 관리 서비스 제공, 서비스 관련 고지·문의 응대', '회원 탈퇴 시까지 (법령상 보관 의무가 있는 정보는 그 기간)']] },
    text: [REFUSE_REQUIRED],
  },
  {
    key: 'promo',
    required: false,
    label: '홍보 목적 개인정보 수집·이용',
    table: { head: PRIVACY_HEAD, rows: [['이름, 이메일, 휴대폰 번호(입력한 경우)', '첫등원 새 기능·이벤트·혜택 등 소식 제공', '동의 철회 또는 회원 탈퇴 시까지']] },
    text: [REFUSE_OPTIONAL],
  },
  {
    key: 'ad',
    required: false,
    label: '광고성 정보 수신',
    text: [
      '첫등원은 동의한 개인정보를 이용해 이메일·문자·카카오톡으로 새 기능·이벤트·혜택 안내를 보낼 수 있습니다. 광고성 정보에는 "(광고)" 표시를 하고, 밤 9시~아침 8시에는 따로 동의하지 않으면 보내지 않습니다.',
      '동의를 거부할 수 있으며, 거부하면 이벤트·혜택 안내를 받기 어렵습니다. 언제든 "내 계정"에서 철회할 수 있습니다.',
    ],
  },
];

/** 첫등원 무료 진단 신청 */
export const DIAGNOSIS_CONSENTS: ConsentItem[] = [
  {
    key: 'privacy',
    required: true,
    label: '개인정보 수집 및 이용',
    table: { head: PRIVACY_HEAD, rows: [['학원명, 지역, 과목, 연락처, 현재 홈페이지 주소', '홈페이지 무료 진단과 결과 안내', '신청 처리 완료 후 1년']] },
    text: ['동의를 거부할 수 있습니다. 다만 필수 항목이라 거부하면 무료 진단을 신청할 수 없습니다.'],
  },
  {
    key: 'ad',
    required: false,
    label: '광고성 정보 수신',
    text: ['진단 결과 외에 첫등원 소식·혜택 안내를 문자·카카오톡으로 받습니다. "(광고)"를 표시하고 수신 거부 방법을 함께 안내합니다.', REFUSE_OPTIONAL],
  },
];

/** 첫등원 셀프 개설 — 약관·개인정보는 회원가입 때 받았다 */
export const START_CONSENTS: ConsentItem[] = [
  {
    key: 'beta',
    required: true,
    label: '베타 이용 조건 확인',
    text: ['홈페이지 오픈일부터 3개월 동안 무료입니다. 베타 기간에는 자동 결제가 없고, 끝나기 전에 계속 이용 여부를 안내합니다.', '학원 정보(학원명, 학원등록번호, 대표 전화, 주소 등)는 학원 홈페이지에 공개됩니다.'],
  },
  { key: 'case', required: false, label: '익명 성공 사례 활용', text: ['학원 이름과 개인정보를 빼고, 홈페이지 성과(방문·상담 수 등)를 첫등원 홍보 사례로 쓸 수 있습니다. 언제든 철회할 수 있습니다.'] },
];

/** 카드 정기결제 등록 — 결제대행사가 정해지면 이름을 채운다 */
export const BILLING_PG_NAME = '[결제대행사]';
export function billingConsents(autopayText: string): ConsentItem[] {
  return [
    { key: 'autopay', required: true, label: '정기결제(자동결제) 동의', text: [autopayText] },
    {
      key: 'thirdParty',
      required: true,
      label: '개인정보 제3자 제공',
      table: {
        head: ['제공받는 자', '제공 목적', '제공 항목 · 보유 기간'],
        rows: [[BILLING_PG_NAME, '정기결제 처리, 결제 확인·취소, 부정 결제 방지', '카드 정보(결제대행사 화면에서 직접 입력), 학원명, 원장 이메일, 결제 금액 · 전자상거래법 등 관계 법령에 따른 기간(대금 결제 기록 5년)']],
      },
      text: ['동의를 거부할 수 있습니다. 다만 거부하면 카드 정기결제를 등록할 수 없습니다.'],
    },
  ];
}

/** 학원 홈페이지 상담 신청 — 학원이 개인정보처리자 */
export function consultConsents(academyName: string): ConsentItem[] {
  return [
    { key: 'guardian', required: true, label: '학생의 학부모(법정대리인)입니다.', text: ['만 14세 미만 학생의 정보는 법정대리인의 동의가 있어야 처리할 수 있습니다.'] },
    {
      key: 'privacy',
      required: true,
      label: '개인정보 수집 및 이용',
      table: { head: PRIVACY_HEAD, rows: [['학부모 이름, 연락처, 학생 학년·학교, 문의 내용, 희망 상담 시간', `${academyName}의 상담 연락, 레벨테스트 진행과 결과 안내`, '상담 종료 후 1년']] },
      text: ['동의를 거부할 수 있습니다. 다만 거부하면 온라인 상담 신청을 할 수 없으며, 전화로 문의해 주세요.'],
    },
    {
      key: 'ad',
      required: false,
      label: '특강·모집 안내 등 광고성 정보 수신',
      text: [`${academyName}의 특강·모집 안내를 카카오톡·문자로 받습니다. "(광고)"를 표시하고 수신 거부 방법을 함께 안내하며, 2년마다 동의를 다시 확인합니다.`, '동의하지 않아도 상담 신청에는 영향이 없습니다.'],
    },
    { key: 'night', required: false, label: '밤 9시~아침 8시 수신', dependsOn: 'ad', text: ['동의하면 밤 9시~아침 8시에도 광고성 정보를 받을 수 있습니다. 동의하지 않으면 아침 8시 이후에 보냅니다.'] },
  ];
}

/** 학부모 등록 링크 — 학원이 개인정보처리자 */
export function joinConsents(academyName: string): ConsentItem[] {
  return [
    { key: 'guardian', required: true, label: '학생의 학부모(법정대리인)입니다.', text: ['만 14세 미만 학생의 정보는 법정대리인의 동의가 있어야 처리할 수 있습니다.'] },
    {
      key: 'privacy',
      required: true,
      label: '개인정보 수집 및 이용',
      table: {
        head: PRIVACY_HEAD,
        rows: [['학생 이름·학년·학교·연락처, 학부모 이름·연락처', `${academyName}의 원생 등록, 수업 운영, 학습 지도·상담, 학부모 연락 (등록 후 성적·출결·수업 중 관찰 기록을 학원이 관리)`, '퇴원 시 즉시 파기 · 학원이 등록을 승인하지 않으면 30일 안에 파기']],
      },
      text: ['건강·질병 등 민감정보는 적지 말아 주세요.', '동의를 거부할 수 있으며, 이 경우 온라인 등록 대신 학원에 직접 문의해 주세요.'],
    },
  ];
}

/** 동의 값 검사 — 필수 항목이 모두 true인지 */
export function requiredAgreed(items: ConsentItem[], values: Record<string, unknown>): boolean {
  return items.filter((i) => i.required).every((i) => values[i.key] === true);
}
