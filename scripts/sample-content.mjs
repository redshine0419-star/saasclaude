/**
 * 샘플 학원 내용 (scripts/seed-sample.mjs가 쓴다).
 * middleContent: 중등 수학(또는 영어) 학원 — test2, demo-warm, demo-result
 * kidsContent: 7세~초6 영어 학원 — demo-bright
 * 숫자·날짜는 seed-sample.mjs가 실행 날짜 기준으로 만든다. 여기에는 글과 목록만 둔다.
 */

const MATH_QUESTIONS = [
  { type: 'choice', unit: '정수와 유리수', difficulty: 2, body: '$(-3) \\times (+4) - (-6) \\div 2$ 의 값은?', choices: ['$-15$', '$-9$', '$-6$', '$9$', '$15$'], answers: ['2'], explanation: '$-12 - (-3) = -9$' },
  { type: 'choice', unit: '문자와 식', difficulty: 2, body: '$3(x-2) - 2(x+1)$ 을 간단히 하면?', choices: ['$x-8$', '$x-4$', '$x+4$', '$5x-8$', '$5x-4$'], answers: ['1'], explanation: '$3x-6-2x-2 = x-8$' },
  { type: 'short', unit: '일차방정식', difficulty: 3, body: '방정식 $2x + 5 = 3(x - 1)$ 의 해를 구하시오.', answers: ['8', 'x=8'], explanation: '$2x+5 = 3x-3$ 이므로 $x = 8$' },
  { type: 'choice', unit: '좌표평면과 그래프', difficulty: 2, body: '점 $(3, -2)$ 는 제몇 사분면 위의 점인가?', choices: ['제1사분면', '제2사분면', '제3사분면', '제4사분면', '어느 사분면에도 속하지 않는다'], answers: ['4'], explanation: '$x>0, y<0$ 이므로 제4사분면' },
  { type: 'short', unit: '정비례와 반비례', difficulty: 3, body: '$y$가 $x$에 정비례하고 $x=4$일 때 $y=12$이다. $x=-2$일 때 $y$의 값을 구하시오.', answers: ['-6'], explanation: '$y=3x$ 이므로 $-6$' },
  { type: 'choice', unit: '연립방정식', difficulty: 3, body: '연립방정식 $x+y=7$, $x-y=1$ 의 해에서 $xy$의 값은?', choices: ['$6$', '$10$', '$12$', '$14$', '$16$'], answers: ['3'], explanation: '$x=4, y=3$ 이므로 $12$' },
  { type: 'choice', unit: '일차함수', difficulty: 3, body: '일차함수 $y=2x-4$ 의 그래프의 $x$절편은?', choices: ['$-4$', '$-2$', '$2$', '$4$', '$8$'], answers: ['3'], explanation: '$0=2x-4$, $x=2$' },
  { type: 'short', unit: '일차함수', difficulty: 4, body: '두 점 $(1, 3)$, $(3, 7)$ 을 지나는 직선의 기울기를 구하시오.', answers: ['2'], explanation: '$(7-3)/(3-1)=2$' },
  { type: 'choice', unit: '부등식', difficulty: 4, body: '부등식 $3x - 2 > x + 6$ 을 만족하는 가장 작은 정수 $x$는?', choices: ['$3$', '$4$', '$5$', '$6$', '$7$'], answers: ['3'], explanation: '$2x>8$, $x>4$ 이므로 $5$' },
  { type: 'essay', unit: '연립방정식 활용', difficulty: 4, body: '한 개에 500원인 사탕과 한 개에 800원인 초콜릿을 합하여 10개 사고 6,200원을 냈다. 사탕과 초콜릿을 각각 몇 개 샀는지 풀이 과정과 함께 쓰시오.', answers: [], explanation: '모범답안: 사탕 $x$개, 초콜릿 $y$개 → $x+y=10$, $500x+800y=6200$ → $x=6, y=4$. 채점: 식 세우기 2점, 풀이 1점, 답 1점', points: 4 },
    ];

const ENG_QUESTIONS = [
  { type: 'choice', unit: '동사의 시제', difficulty: 2, body: 'Choose the correct word: She ___ to school every day.', choices: ['go', 'goes', 'going', 'gone', 'went to'], answers: ['2'] },
  { type: 'choice', unit: '현재완료', difficulty: 3, body: 'I ___ in Seoul since 2020.', choices: ['live', 'lived', 'have lived', 'am living', 'will live'], answers: ['3'] },
  { type: 'short', unit: '어휘', difficulty: 2, body: "'도서관'을 뜻하는 영어 단어를 쓰시오.", answers: ['library'] },
  { type: 'choice', unit: '비교급', difficulty: 3, body: 'This box is ___ than that one.', choices: ['heavy', 'heavier', 'heaviest', 'more heavy', 'most heavy'], answers: ['2'] },
  { type: 'choice', unit: '관계대명사', difficulty: 4, body: 'The girl ___ is singing is my sister.', choices: ['who', 'which', 'what', 'whose', 'whom'], answers: ['1'] },
  { type: 'short', unit: '어휘', difficulty: 3, body: "'beautiful'의 반대말을 쓰시오.", answers: ['ugly'] },
  { type: 'choice', unit: '수동태', difficulty: 4, body: 'The window ___ by Tom yesterday.', choices: ['breaks', 'broke', 'was broken', 'is broken', 'has broken'], answers: ['3'] },
  { type: 'choice', unit: '독해', difficulty: 3, body: "Tom was tired, so he went to bed early. Why did Tom go to bed early?", choices: ['He was hungry.', 'He was tired.', 'He was sad.', 'He was late.', 'He was sick.'], answers: ['2'] },
  { type: 'short', unit: '문법', difficulty: 3, body: "빈칸에 알맞은 말: There ___ many books on the desk. (are/is)", answers: ['are'] },
  { type: 'essay', unit: '영작', difficulty: 4, body: '주말에 한 일을 영어 두 문장으로 쓰시오.', answers: [], explanation: '과거시제 사용 2점, 문장 구조 2점', points: 4 },
    ];

const MIDDLE_LEADS = [
  // [학부모, 학년, 학교, 상담유형, 상태, 며칠 전, 메모, 마케팅 동의, 유입]
  ['김민지', '중2', '○○중', 'level_test', 'enrolled', 52, '학교 시험 서술형 감점이 많다고 함', true, 'naver'],
  ['이수진', '중1', '○○중', 'level_test', 'enrolled', 45, '첫 학원. 숙제 습관 걱정', true, 'instagram'],
  ['박지영', '중2', '△△중', 'phone', 'enrolled', 38, '형이 다니던 학원이라 문의', false, 'referral'],
  ['최은희', '초6', '○○초', 'level_test', 'enrolled', 19, '예비중 과정 문의', true, 'naver'],
  ['정혜원', '중3', '○○중', 'visit', 'enrolled', 12, '고1 선행 희망', false, 'naver'],
  ['강미영', '중2', '△△중', 'level_test', 'not_enrolled', 22, '시간이 맞지 않음', false, 'naver'],
  ['조현정', '중1', '○○중', 'level_test', 'test_done', 9, '결과 보고 다음 주 결정 예정', true, 'kakao'],
  ['윤서영', '중2', '○○중', 'level_test', 'test_booked', 5, '이번 주 토요일 테스트', false, 'naver'],
  ['장은주', '초6', '□□초', 'phone', 'contacted', 3, '셔틀 노선 문의', false, 'blog'],
  ['임지혜', '중3', '△△중', 'waitlist', 'new', 1, '중2 심화반 대기 신청', false, 'naver'],
  ['한소영', '중1', '○○중', 'level_test', 'new', 0, '', true, 'instagram'],
  ['오정민', '중2', '○○중', 'level_test', 'no_show', 15, '연락 두 번 부재', false, 'naver'],
  ];

const MIDDLE_STUDENTS = [
  // [이름, 학년, 학교, 학부모, 상담건, 실력(0~1), 태그, 요약, 등록 며칠 전]
  ['김도윤', '중2', '○○중', '김민지', '김민지', 0.78, ['꼼꼼함', '질문 많음', '시험 불안'], '개념 이해는 빠르나 시험 때 긴장해서 계산 실수가 잦음. 칭찬하면 집중력이 올라감.', 48],
  ['이서아', '중1', '○○중', '이수진', '이수진', 0.64, ['숙제 성실', '내성적'], '조용하지만 숙제는 빠짐없이 해 옴. 모르는 것을 먼저 말하지 않아 수업 중 확인 필요.', 42],
  ['박시우', '중2', '△△중', '박지영', '박지영', 0.7, ['활발함', '덤벙댐'], '이해가 빠르고 발표를 좋아함. 문제를 끝까지 읽지 않아 조건을 놓치는 경우가 많음.', 35],
  ['최하린', '초6', '○○초', '최은희', '최은희', 0.86, ['끈기 있음', '선행 필요'], '연산이 정확하고 끝까지 푸는 힘이 있음. 중1 과정 선행 가능.', 15],
  ['정민준', '중3', '○○중', '정혜원', '정혜원', 0.74, ['승부욕 강함'], '모의 테스트 순위에 관심이 많음. 서술형 쓰기 연습 중.', 9],
  ['한지호', '중2', '○○중', '한경희', null, 0.6, ['집중 짧음', '칭찬에 반응'], '수업 후반에 집중력이 떨어짐. 짧게 끊어 확인하면 잘 따라옴.', 120],
  ['서윤아', '중2', '△△중', '서미정', null, 0.88, ['꼼꼼함', '숙제 성실'], '반에서 가장 안정적. 심화 문제를 따로 내 주고 있음.', 200],
  ['윤태민', '중1', '○○중', '윤정아', null, 0.55, ['기초 부족', '숙제 미흡'], '초등 분수 계산이 약함. 주 1회 기초 보충 진행 중.', 90],
  ['장예린', '중3', '△△중', '장수경', null, 0.8, ['끈기 있음'], '고1 수학(상) 선행을 무리 없이 따라오는 중.', 260],
  ['임하준', '중1', '○○중', '임소라', null, 0.68, ['활발함'], '친구들과 풀이를 설명하는 시간에 적극적.', 75],
  ['송지안', '중1', '△△중', '송은정', null, 0.73, ['꼼꼼함', '내성적'], '노트 정리가 깔끔함. 질문을 먼저 하도록 기회를 주는 중.', 110],
  ['권도현', '중1', '○○중', '권미숙', null, 0.62, ['덤벙댐', '활발함'], '빨리 풀고 검산을 하지 않음. 검산 체크리스트를 쓰기로 함.', 64],
  ['배수아', '중1', '□□중', '배지현', null, 0.8, ['숙제 성실', '끈기 있음'], '어려운 문제도 끝까지 붙잡는 편. 심화 문제를 조금씩 늘리는 중.', 150],
  ['유건우', '중2', '○○중', '유선희', null, 0.57, ['집중 짧음', '기초 부족'], '중1 일차방정식 개념이 흔들림. 주 1회 보충 진행.', 58],
  ['문채원', '중2', '△△중', '문혜진', null, 0.84, ['승부욕 강함', '질문 많음'], '단원평가 1등을 목표로 함. 질문이 구체적이라 수업 분위기를 이끔.', 230],
  ['신유준', '중3', '○○중', '신은영', null, 0.69, ['시험 불안', '숙제 성실'], '평소 실력보다 시험 점수가 낮게 나옴. 시간 재고 푸는 연습 중.', 140],
  ['홍예서', '중3', '□□중', '홍지은', null, 0.9, ['꼼꼼함', '선행 필요'], '고1 수학(상)까지 무리 없이 따라옴. 고등 내신 서술형 대비 중.', 300],
  ['노시현', '중3', '△△중', '노미란', null, 0.63, ['칭찬에 반응', '숙제 미흡'], '숙제를 자주 빠뜨림. 학부모님과 숙제 확인 루틴을 함께 정함.', 45],
  ['안서진', '초6', '○○초', '안수연', null, 0.76, ['활발함', '질문 많음'], '예비중 과정을 즐겁게 따라옴. 문장제 읽기 연습 필요.', 80],
  ['조이안', '초6', '□□초', '조민정', null, 0.66, ['내성적', '끈기 있음'], '조용히 끝까지 푸는 편. 분수 나눗셈 보충 중.', 33],
    ];

const KIDS_QUESTIONS = [
  { type: 'choice', unit: '파닉스', difficulty: 1, body: "그림 없이 소리만 듣고 고르기: 'cat'의 첫소리와 같은 단어는?", choices: ['dog', 'cup', 'sun', 'pig', 'bed'], answers: ['2'], explanation: 'c /k/ — cup' },
  { type: 'choice', unit: '파닉스', difficulty: 2, body: "'sh' 소리가 들어 있는 단어는?", choices: ['ship', 'sip', 'chip', 'tip', 'zip'], answers: ['1'] },
  { type: 'short', unit: '어휘', difficulty: 1, body: "'사과'를 영어로 쓰시오.", answers: ['apple'] },
  { type: 'choice', unit: '어휘', difficulty: 2, body: "다음 중 색깔이 아닌 것은?", choices: ['red', 'blue', 'green', 'happy', 'yellow'], answers: ['4'] },
  { type: 'choice', unit: '문장', difficulty: 2, body: 'I ___ a student.', choices: ['am', 'is', 'are', 'be', 'was'], answers: ['1'] },
  { type: 'choice', unit: '문장', difficulty: 3, body: 'She ___ two cats.', choices: ['have', 'has', 'having', 'is', 'are'], answers: ['2'] },
  { type: 'short', unit: '어휘', difficulty: 2, body: "'big'의 반대말을 쓰시오.", answers: ['small', 'little'] },
  { type: 'choice', unit: '읽기', difficulty: 3, body: "Tom has a red ball. He plays with his dog. What color is the ball?", choices: ['blue', 'red', 'green', 'black', 'white'], answers: ['2'] },
  { type: 'choice', unit: '읽기', difficulty: 3, body: "It is raining. Mina takes her umbrella. Why does Mina take her umbrella?", choices: ['It is sunny.', 'It is raining.', 'It is hot.', 'She is hungry.', 'She is late.'], answers: ['2'] },
  { type: 'essay', unit: '쓰기', difficulty: 3, body: '내가 좋아하는 동물을 영어 한 문장으로 쓰고, 그 이유를 한 문장 더 쓰시오.', answers: [], explanation: '문장 형태 2점, 이유 1점, 철자 1점', points: 4 },
];

const KIDS_LEADS = [
  ['김지은', '초2', '○○초', 'level_test', 'enrolled', 50, '파닉스는 했는데 읽기가 안 된다고 함', true, 'naver'],
  ['이혜진', '7세', '○○유치원', 'phone', 'enrolled', 44, '영어 처음 시작', true, 'instagram'],
  ['박소연', '초4', '△△초', 'level_test', 'enrolled', 36, '형제 할인 문의', false, 'referral'],
  ['최유리', '초1', '○○초', 'level_test', 'enrolled', 18, '하원 셔틀 필요', true, 'naver'],
  ['정다은', '초5', '○○초', 'visit', 'enrolled', 11, '중학 대비 문법 희망', false, 'naver'],
  ['강수빈', '초3', '△△초', 'level_test', 'not_enrolled', 21, '시간이 맞지 않음', false, 'naver'],
  ['조아라', '초2', '○○초', 'level_test', 'test_done', 8, '결과 보고 결정 예정', true, 'kakao'],
  ['윤미래', '초1', '○○초', 'level_test', 'test_booked', 5, '토요일 체험 수업 희망', false, 'naver'],
  ['장하늘', '7세', '□□유치원', 'phone', 'contacted', 3, '7세 반 정원 문의', false, 'blog'],
  ['임선희', '초3', '△△초', 'waitlist', 'new', 1, '초3~4 리딩반 대기 신청', false, 'naver'],
  ['한나래', '초2', '○○초', 'level_test', 'new', 0, '', true, 'instagram'],
  ['오세희', '초4', '○○초', 'level_test', 'no_show', 14, '연락 두 번 부재', false, 'naver'],
];

const KIDS_STUDENTS = [
  ['김하윤', '초2', '○○초', '김지은', '김지은', 0.7, ['질문 많음', '활발함'], '소리 내어 읽기를 좋아함. 긴 문장에서 끝까지 읽기 연습 중.', 46],
  ['이준서', '7세', '○○유치원', '이혜진', '이혜진', 0.62, ['내성적', '칭찬에 반응'], '처음에는 말이 적었지만 노래 시간에 먼저 따라 부르기 시작함.', 40],
  ['박지호', '초4', '△△초', '박소연', '박소연', 0.76, ['끈기 있음'], '단어 시험 꾸준히 만점. 쓰기에서 시제 실수가 남아 있음.', 33],
  ['최서아', '초1', '○○초', '최유리', '최유리', 0.68, ['활발함', '집중 짧음'], '게임 활동에는 적극적. 앉아서 쓰는 시간을 조금씩 늘리는 중.', 15],
  ['정우진', '초5', '○○초', '정다은', '정다은', 0.8, ['꼼꼼함', '선행 필요'], '문법 이해가 빠름. 중학 대비 독해를 조금 일찍 시작해도 될 듯.', 8],
  ['한예준', '초2', '○○초', '한수정', null, 0.58, ['덤벙댐'], '알파벳 b·d를 자주 헷갈림. 짝 카드로 연습 중.', 120],
  ['서지안', '초3', '△△초', '서은영', null, 0.82, ['숙제 성실', '꼼꼼함'], '원서 읽기 속도가 빠름. 다음 레벨 리더스로 올릴 예정.', 210],
  ['윤시은', '7세', '○○유치원', '윤혜원', null, 0.66, ['칭찬에 반응'], '파닉스 소리를 정확하게 따라 함. 스티커 보상에 반응이 좋음.', 85],
  ['장도윤', '초6', '□□초', '장미경', null, 0.74, ['승부욕 강함'], '퀴즈 순위에 관심이 많음. 말하기 발표를 즐김.', 260],
  ['임채원', '초1', '○○초', '임가영', null, 0.72, ['활발함', '질문 많음'], '모르는 단어를 바로 물어봄. 짧은 문장 만들기 연습 중.', 70],
  ['송유나', '초3', '△△초', '송지혜', null, 0.6, ['내성적', '숙제 미흡'], '숙제를 자주 빠뜨림. 학부모님과 숙제 확인 루틴을 함께 정함.', 105],
  ['권민재', '초4', '○○초', '권은비', null, 0.69, ['덤벙댐', '활발함'], '빨리 풀고 확인을 안 함. 다시 읽기 체크 습관 연습 중.', 60],
  ['배하린', '초5', '□□초', '배선영', null, 0.85, ['끈기 있음', '숙제 성실'], '에세이 쓰기 실력이 좋음. 교내 영어 말하기 대회 준비 중.', 150],
  ['유태오', '초2', '○○초', '유민아', null, 0.55, ['집중 짧음', '기초 부족'], '파닉스 복습이 필요해 주 1회 보충 진행.', 55],
  ['문서윤', '초6', '△△초', '문지현', null, 0.83, ['꼼꼼함'], '문법 정리를 노트에 깔끔하게 함. 중1 교과서 미리 읽는 중.', 230],
  ['신지우', '초3', '○○초', '신은숙', null, 0.71, ['시험 불안'], '월말 평가 때 긴장함. 평소 퀴즈 형식으로 연습하니 나아짐.', 140],
  ['홍시우', '7세', '□□유치원', '홍지수', null, 0.6, ['활발함'], '율동 활동을 좋아함. 단어 카드 놀이로 어휘를 늘리는 중.', 95],
  ['노아인', '초5', '△△초', '노혜림', null, 0.64, ['칭찬에 반응', '숙제 미흡'], '말하기는 자신감 있음. 쓰기 숙제를 미루는 편.', 45],
  ['안다온', '초1', '○○초', '안소희', null, 0.75, ['질문 많음'], '그림책 읽기 시간을 가장 좋아함.', 80],
  ['조은호', '초6', '□□초', '조혜영', null, 0.67, ['내성적', '끈기 있음'], '조용히 끝까지 해내는 편. 발표 기회를 조금씩 늘리는 중.', 33],
];

/** 7세~초6 영어 학원 */
export function kidsContent() {
  return {
    targetGrades: '7세~초6',
    director: {
      headline: '영어를 공부보다 먼저 말로 만나게 합니다',
      philosophy: '아이들이 영어를 과목이 아니라 하고 싶은 말로 먼저 만나야 오래 간다고 믿습니다. 매 수업 소리 내어 읽고, 친구 앞에서 짧게라도 말하는 시간을 꼭 둡니다. 한 반 6명 이하로 운영해 모든 아이가 수업마다 말할 기회를 갖습니다.',
      education: '서울 소재 대학교 영어교육과 졸업\nTESOL 자격 과정 수료',
      career: '어린이 영어 전문 학원 강사 8년\n현 학원 원장 5년 (2021~)\n초등 영어 리딩 교재 공동 집필',
      subjectsTaught: '파닉스, 초등 리딩·라이팅, 초등 문법',
    },
    principles: [
      ['01', '듣고 말하기가 먼저입니다', '모든 수업은 소리 내어 읽기와 짧은 말하기로 시작합니다.'],
      ['02', '읽은 책은 기록으로 남깁니다', '아이가 읽은 원서와 단어를 기록해 성장 과정을 함께 봅니다.'],
      ['03', '학부모님께 매달 리포트를 드립니다', '출결·월말 평가·수업 모습을 정리해 한 달에 한 번 링크로 보내 드립니다.'],
    ],
    facilities: ['소그룹 교실 (6인실) 3개', '영어 원서 코너 (500권)', '발표 무대', '정수기·휴게 공간'],
    staff: [
      { name: 'Emma 김', roleLabel: '7세·초1~2 담당', summary: '유아 영어 지도 경력 6년. 노래와 놀이로 파닉스를 익히는 수업을 합니다.' },
      { name: 'Daniel 박', roleLabel: '초3~6 리딩·라이팅', summary: '원서 리딩 전문. 아이 수준에 맞는 책을 골라 함께 읽고 짧은 글쓰기로 이어 갑니다.' },
      { name: '이하늘', roleLabel: '실장 · 상담', summary: '등록 상담과 학부모 연락, 셔틀·출결 관리를 맡고 있습니다.' },
    ],
    classes: [
      { name: '7세 파닉스', gradeBand: '7세', days: ['화', '목'], startTime: '14:30', endTime: '15:30', capacity: 6, seatsLeft: 2, textbook: 'Smart Phonics 1', description: '노래와 놀이로 알파벳 소리를 익히고, 쉬운 단어를 읽어 봅니다.' },
      { name: '초1~2 리딩 스타트', gradeBand: '초1~2', days: ['월', '수', '금'], startTime: '15:00', endTime: '16:00', capacity: 6, seatsLeft: 1, textbook: 'Oxford Reading Tree 2~4', description: '짧은 그림책을 소리 내어 읽고, 읽은 내용을 한 문장으로 말해 봅니다.' },
      { name: '초3~4 리딩&라이팅', gradeBand: '초3~4', days: ['월', '수', '금'], startTime: '16:10', endTime: '17:30', capacity: 6, seatsLeft: 0, waitlistCount: 2, textbook: 'Reading Explorer Foundations', description: '리더스북을 읽고 짧은 일기·편지 쓰기로 이어 갑니다.' },
      { name: '초5~6 문법·독해', gradeBand: '초5~6', days: ['화', '목', '토'], startTime: '17:00', endTime: '18:30', capacity: 6, seatsLeft: 2, textbook: 'Grammar Inside Starter + 리딩 교재', description: '중학교 영어를 준비하는 반. 문법 정리와 긴 지문 읽기를 함께 합니다.' },
    ],
    feeAmounts: [220000, 250000, 280000, 300000],
    extraCosts: [{ label: '교재비', amount: 18000, note: '권당, 실비' }, { label: '원서 대여', amount: 0, note: '무료 (분실 시 실비)' }],
    shuttle: [['○○초등학교 정문', '14:10', '16:10'], ['○○아파트 102동 앞', '14:20', '17:40'], ['□□유치원 앞', '14:00', '15:40']],
    faq: [
      ['영어를 처음 시작해도 되나요?', '네. 7세·초1 반은 처음 시작하는 아이를 기준으로 수업합니다. 체험 수업에서 아이 반응을 먼저 보고 반을 정합니다.'],
      ['한 반 인원은 몇 명인가요?', '한 반 최대 6명입니다. 모든 아이가 수업마다 말할 기회를 갖도록 인원을 제한합니다.'],
      ['원서는 어떻게 읽나요?', '학원 원서 코너에서 아이 수준에 맞는 책을 빌려 갑니다. 읽은 책은 기록장에 남깁니다.'],
      ['결석하면 보강이 되나요?', '미리 연락 주시면 같은 주 다른 반 수업에서 보강합니다.'],
      ['학부모 상담은 어떻게 하나요?', '매달 학습 리포트를 링크로 보내 드리고, 학기마다 한 번 대면 또는 전화 상담을 합니다.'],
    ],
    posts: (at) => [
      { category: 'recruit', title: '겨울방학 영어 캠프 모집 (7세~초4)', summaryFields: { period: '1/5 ~ 1/30 (4주)', target: '7세~초4', count: '반별 6명', fee: '반별 안내' }, body: '겨울방학 4주 동안 매일 1시간, 영어 그림책 읽기와 역할극을 합니다.\n\n· 주 5회, 1회 60분\n· 마지막 날 가족 초대 발표회\n\n재원생 우선으로 받고, 남는 자리는 신규 학생을 받습니다.', publishedAt: at(4, 10) },
      { category: 'exam', title: '10월 월말 평가 안내', body: '10월 월말 평가가 끝났습니다. 읽기 속도와 단어 테스트를 함께 봤고, 학생별 결과는 이번 주 학습 리포트로 보내 드립니다.', publishedAt: at(8, 18) },
      { category: 'notice', title: '할로윈 파티 안내', body: '10월 마지막 주 수업 시간에 할로윈 파티를 합니다. 간단한 의상을 입고 와도 좋아요. 영어로 인사하고 사탕을 받는 활동을 합니다.', publishedAt: at(12, 11) },
      { category: 'gallery', title: '10월 발표 수업 모습', body: '초3~4 리딩반 친구들이 읽은 책을 친구들 앞에서 소개했어요. 처음보다 목소리가 훨씬 커졌습니다.', publishedAt: at(15, 20) },
      { category: 'notice', title: '[작성 중] 겨울방학 시간표', body: '겨울방학 시간표를 준비 중입니다. (확정 후 공개 예정)', status: 'draft' },
    ],
    reviews: [
      { kind: 'review', body: '영어를 싫어하던 아이가 학원 가는 날을 기다려요. 집에서도 배운 노래를 계속 불러요.', authorLabel: '7세 학부모', gradeBand: '초등', source: '네이버 플레이스', showOnHome: true },
      { kind: 'review', body: '한 반 인원이 적어서 아이가 매번 말할 기회가 있어요. 발표 영상을 보고 깜짝 놀랐습니다.', authorLabel: '초3 학부모', gradeBand: '초등', source: '학원 설문', showOnHome: true },
      { kind: 'review', body: '원서를 빌려 와서 읽는 습관이 생겼어요. 매달 리포트로 읽은 책을 볼 수 있어 좋습니다.', authorLabel: '초4 학부모', gradeBand: '초등', source: '학원 설문', showOnHome: false },
      { kind: 'review', body: '셔틀 시간이 정확하고 선생님이 하원 때 오늘 한 활동을 짧게 알려 주셔서 안심이 돼요.', authorLabel: '초1 학부모', gradeBand: '초등', source: '네이버 플레이스', showOnHome: false },
      { kind: 'score_case', authorLabel: '초3 서○○', gradeBand: '초등', beforeValue: '리딩 레벨 1.5', afterValue: '리딩 레벨 2.8', periodLabel: '3월 → 10월', comment: '매일 15분 원서 읽기를 꾸준히 했습니다.', consentFile: 'seed-sample-consent', showOnHome: true },
    ],
    resultStat: {
      termLabel: '2026년 10월 월말 평가',
      metrics: [{ label: '평균 리딩 레벨 상승', value: '0.6', unit: '단계' }, { label: '단어 테스트 평균', value: '92', unit: '점' }, { label: '응시 재원생', value: '42', unit: '명' }],
      basisText: '2026년 10월 월말 평가 응시 재원생 42명 기준, 3월 대비 (학원 자체 집계)',
    },
    questions: KIDS_QUESTIONS,
    questionGrade: '초2',
    test: { title: '초등 영어 입학 레벨테스트', grade: '초1~4', timeLimitMin: 25, description: '총 10문항, 25분입니다. 모르는 문제는 넘어가도 괜찮아요. 쓰기 문제는 공책에 쓴 사진을 올려도 됩니다.' },
    essay: { answer: 'I like dogs. They are cute.', good: '문장을 정확하게 썼어요. 이유까지 잘 붙였네요!', bad: "좋아하는 동물은 잘 썼어요. 'They is' → 'They are'를 같이 연습해 봐요.", errorType: '문법' },
    leads: KIDS_LEADS,
    attempts: [['김지은', 0.7, 48], ['이혜진', 0.55, 42], ['최유리', 0.72, 16], ['강수빈', 0.6, 19], ['조아라', 0.85, 7]],
    students: KIDS_STUDENTS,
    classFor: (grade) => ({ '7세': '7세', 초1: '초1~2', 초2: '초1~2', 초3: '초3~4', 초4: '초3~4', 초5: '초5~6', 초6: '초5~6' })[grade] ?? null,
    scoreSubjects: ['영어'],
    hasSchoolExams: () => false,
    academyTestLabel: (m) => `${m + 1}차 월말 평가`,
    academyMemo: '철자 실수',
    mockFor: () => null,
    notes: (traits) => [
      ['attitude', '오늘 단어 시험 만점. 소리 내어 읽기를 자신 있게 함.', 2],
      ['personality', traits.includes('내성적') ? '처음엔 말이 적었는데 짝 활동에서는 먼저 말을 꺼냄. 짝 활동을 늘리기로.' : '발표를 좋아함. 친구 발표도 끝까지 듣도록 지도 중.', 11],
      ['consult', '월말 평가 결과 상담. 읽기 속도 올리기를 다음 목표로 정함.', 10],
      ['parent', '어머님과 통화 — 집에서 원서를 혼자 읽기 시작했다고 하심.', 18],
    ],
    lateNotes: ['셔틀 지연', '학교 방과후'],
    reportComment: (given) => `${given}는 이번 달 소리 내어 읽기에 자신감이 많이 붙었어요. 발표 시간에도 먼저 손을 들었습니다.\n다음 달에는 긴 문장을 끝까지 읽는 연습과 짧은 쓰기를 함께 하겠습니다. 집에서도 읽은 책 이야기를 많이 물어봐 주세요.`,
  };
}

/** 중등 학원 (S: 주 과목) */
export function middleContent(S, english) {
  return {
    targetGrades: '초5~고2',
    director: {
      headline: '아이가 왜 틀렸는지 알 때까지 같이 봅니다',
      philosophy: `${S}는 외우는 과목이 아니라 생각하는 힘을 기르는 과목이라고 믿습니다. 정답보다 풀이 과정을 먼저 보고, 틀린 문제는 아이 입으로 다시 설명할 수 있을 때까지 함께 봅니다. 한 반 8명 이하로 운영해 모든 학생의 노트를 매 수업 확인합니다.`,
      education: `서울 소재 대학교 ${S}교육과 졸업\n동 대학원 ${S}교육 석사`,
      career: `대형 학원 중등부 ${S} 강사 7년\n현 학원 원장 6년 (2019~)\n중·고등 내신 대비 교재 공동 집필`,
      subjectsTaught: `중등 ${S} 전 과정, 고1 ${S}`,
    },
    principles: [
      ['01', '풀이 과정을 먼저 봅니다', '답이 맞아도 과정이 틀리면 다시 풉니다. 서술형 감점을 줄이는 가장 확실한 방법입니다.'],
      ['02', '틀린 문제는 3번 만납니다', '수업 당일, 3일 뒤, 2주 뒤에 같은 유형을 다시 풀어 완전히 내 것으로 만듭니다.'],
      ['03', '학부모님께 매달 리포트를 드립니다', '출결·성적·수업 태도를 정리해 한 달에 한 번 링크로 보내 드립니다.'],
    ],
    facilities: ['수업 교실 (8인실) 3개', '자기주도 학습실', '1:1 질문 상담실', '정수기·휴게 공간'],
    staff: [
      { name: '김서연', roleLabel: `중등 ${S} 담당`, summary: `${S}교육과 졸업, 강의 경력 5년. 개념을 그림으로 설명하는 수업으로 중1·중2 반을 맡고 있습니다.` },
      { name: '박준호', roleLabel: `고등 ${S} 담당`, summary: '내신·모의고사 대비 전문. 학교별 기출 분석 자료를 직접 만들어 수업합니다.' },
      { name: '이하늘', roleLabel: '실장 · 상담', summary: '등록 상담과 학부모 연락, 출결 관리를 맡고 있습니다.' },
    ],
    classes: [
      { name: `초6 예비중 ${S}`, gradeBand: '초6', days: ['화', '목'], startTime: '16:00', endTime: '17:40', capacity: 8, seatsLeft: 3, textbook: english ? 'Reading Explorer 1' : '개념원리 중1-1', description: '중학교 첫 시험을 준비하는 반. 연산 정확도와 문장제 읽기를 함께 잡습니다.' },
      { name: `중1 기본 ${S}`, gradeBand: '중1', days: ['월', '수', '금'], startTime: '17:00', endTime: '18:40', capacity: 8, seatsLeft: 1, textbook: english ? '중1 교과서 + Grammar Inside 1' : '개념원리 중1-2 + 쎈', description: '개념 → 유형 → 서술형 순서로 진도를 나가고, 매주 금요일 단원 테스트를 봅니다.' },
      { name: `중2 심화 ${S}`, gradeBand: '중2', days: ['월', '수', '금'], startTime: '19:00', endTime: '20:40', capacity: 8, seatsLeft: 0, waitlistCount: 2, textbook: english ? '중2 교과서 + 수능 기초 독해' : '개념원리 중2-2 + 일품', description: '학교 내신 90점 이상을 목표로 하는 반. 시험 4주 전부터 학교별 기출을 풉니다.' },
      { name: `중3 내신·선행 ${S}`, gradeBand: '중3', days: ['화', '목', '토'], startTime: '18:00', endTime: '20:00', capacity: 8, seatsLeft: 2, textbook: english ? '고1 모의고사 기출' : '개념원리 중3-2 / 수학(상)', description: '중3 내신을 마무리하고 고1 과정을 미리 준비합니다.' },
    ],
    feeAmounts: [280000, 320000, 340000, 380000],
    extraCosts: [{ label: '교재비', amount: 15000, note: '권당, 실비' }, { label: '모의고사 응시료', amount: 5000, note: '희망자만, 회당' }],
    shuttle: [['○○초등학교 정문', '15:40', '17:50'], ['○○아파트 102동 앞', '15:50', '18:00'], ['○○중학교 후문', '16:40', '20:50']],
    faq: [
      ['레벨테스트는 꼭 봐야 하나요?', '네, 반 배정을 위해 30~40분 정도 레벨테스트를 봅니다. 결과는 바로 학부모님께 설명드리고, 휴대폰으로 결과지를 보내 드립니다.'],
      ['한 반 인원은 몇 명인가요?', '한 반 최대 8명입니다. 정원이 차면 대기 신청을 받고 자리가 나면 순서대로 연락드립니다.'],
      ['결석하면 보강이 되나요?', '미리 연락 주시면 같은 주 다른 반 수업이나 질문 시간에 보강합니다. 영상 보강은 하지 않습니다.'],
      ['숙제는 얼마나 나오나요?', '수업 1회당 30~40분 분량입니다. 다음 수업 시작 때 선생님이 노트를 직접 확인합니다.'],
      ['학부모 상담은 어떻게 하나요?', '매달 학습 리포트를 링크로 보내 드리고, 학기마다 한 번 대면 또는 전화 상담을 합니다. 필요하시면 언제든 카톡으로 요청해 주세요.'],
    ],
    posts: (at) => [
      { category: 'recruit', title: '겨울방학 특강 모집 안내 (중1~중3)', summaryFields: { period: '12/29 ~ 2/20 (8주)', target: '중1~중3', count: '반별 8명', fee: '반별 안내' }, body: `겨울방학 8주 동안 다음 학기 ${S}를 미리 준비하는 특강을 엽니다.\n\n· 주 3회, 1회 100분\n· 개념 정리 + 학교별 기출 유형\n· 방학 마지막 주 실전 모의 테스트\n\n자리가 한정되어 있어 재원생 우선으로 받고, 남는 자리는 신규 학생을 받습니다. 레벨테스트 후 반을 배정합니다.`, publishedAt: at(3, 10) },
      { category: 'exam', title: '2학기 중간고사 결과 안내', body: '2학기 중간고사가 끝났습니다. 재원생 평균이 지난 학기보다 6점 올랐습니다.\n\n시험지 분석 결과, 서술형에서 풀이 과정을 끝까지 쓰지 않아 감점된 경우가 가장 많았습니다. 기말고사까지 서술형 쓰기 연습을 매 수업 10분씩 넣겠습니다.\n\n학생별 결과는 이번 주 학습 리포트로 보내 드립니다.', publishedAt: at(9, 18) },
      { category: 'notice', title: '추석 연휴 휴원 안내', body: '추석 연휴 기간에는 휴원합니다. 해당 주 수업은 연휴 다음 주 토요일 보강으로 진행합니다. 보강 시간은 반별로 문자 드리겠습니다.', publishedAt: at(40, 11) },
      { category: 'gallery', title: '10월 수업 모습', body: '중2 심화반 친구들이 서로 풀이를 설명하는 시간입니다. 설명하면서 스스로 부족한 부분을 찾는 연습을 하고 있어요.', publishedAt: at(14, 20) },
      { category: 'notice', title: '[작성 중] 기말고사 대비 일정', body: '기말고사 4주 전부터 토요일 특별 수업을 진행합니다. (일정 확정 후 공개 예정)', status: 'draft' },
    ],
    reviews: [
      { kind: 'review', body: `원장 선생님이 아이가 왜 틀렸는지 끝까지 같이 봐 주셔서, ${S}를 싫어하던 아이가 질문을 하기 시작했어요. 매달 오는 리포트로 아이 상태를 알 수 있어서 좋습니다.`, authorLabel: '중2 학부모', gradeBand: '중등', source: '네이버 플레이스', showOnHome: true },
      { kind: 'review', body: '한 반 인원이 적어서 선생님이 아이 노트를 매번 확인해 주세요. 숙제 습관이 확실히 잡혔습니다.', authorLabel: '중1 학부모', gradeBand: '중등', source: '학원 설문', showOnHome: true },
      { kind: 'review', body: '레벨테스트 결과를 단원별로 자세히 설명해 주셔서 믿음이 갔어요. 약한 단원부터 다시 잡아 주시는 게 보입니다.', authorLabel: '초6 학부모', gradeBand: '초등', source: '학원 설문', showOnHome: false },
      { kind: 'review', body: '시험 4주 전부터 학교 기출을 풀어 주셔서 처음으로 시험 준비가 덜 불안했다고 하네요.', authorLabel: '중3 학부모', gradeBand: '중등', source: '네이버 플레이스', showOnHome: false },
      { kind: 'score_case', authorLabel: '중2 김○○', gradeBand: '중등', beforeValue: '62점', afterValue: '91점', periodLabel: '1학기 중간 → 2학기 중간', comment: '서술형 풀이 쓰기를 6개월 꾸준히 연습했습니다.', consentFile: 'seed-sample-consent', showOnHome: true },
      { kind: 'score_case', authorLabel: '중3 이○○', gradeBand: '중등', beforeValue: '5등급', afterValue: '2등급', periodLabel: '중2 기말 → 중3 기말', comment: '개념 노트를 다시 만들고 틀린 문제를 3번씩 풀었습니다.', consentFile: 'seed-sample-consent', showOnHome: false },
    ],
    resultStat: {
      termLabel: '2026년 2학기 중간고사',
      metrics: [{ label: '재원생 평균 상승', value: '6.2', unit: '점' }, { label: '90점 이상', value: '14', unit: '명' }, { label: '응시 재원생', value: '38', unit: '명' }],
      basisText: '2026년 2학기 중간고사 응시 재원생 38명 기준, 직전 시험 대비 (학원 자체 집계)',
    },
    questions: english ? ENG_QUESTIONS : MATH_QUESTIONS,
    questionGrade: '중2',
    test: { title: `중2 ${S} 입학 레벨테스트`, grade: '중2', timeLimitMin: 40, description: '총 10문항, 40분입니다. 계산은 연습장에 하고, 서술형은 풀이 사진을 올려 주세요.' },
    essay: {
      answer: english ? 'I went to the park. I played soccer.' : '사탕 x개, 초콜릿 y개로 놓으면 x+y=10, 500x+800y=6200 ...',
      good: '식 세우기와 풀이 과정이 깔끔합니다.',
      bad: '식은 잘 세웠는데 계산 과정에서 실수가 있었어요. 마지막 검산을 꼭 해 봅시다.',
      errorType: '계산 실수',
    },
    leads: MIDDLE_LEADS,
    attempts: [['김민지', 0.72, 50], ['이수진', 0.58, 43], ['최은희', 0.83, 17], ['강미영', 0.66, 20], ['조현정', 0.9, 8]],
    students: MIDDLE_STUDENTS,
    classFor: (grade) => grade,
    scoreSubjects: english ? ['영어'] : ['수학', '영어'],
    hasSchoolExams: (grade) => grade.startsWith('중'),
    academyTestLabel: (m) => `${m + 1}차 단원평가`,
    academyMemo: '분수 계산 실수',
    mockFor: (grade) => (grade === '중3' ? '중3 전국연합 학력평가' : null),
    notes: (traits) => [
      ['attitude', `오늘 숙제 모두 해 옴. ${S} 서술형 풀이를 끝까지 쓰려고 노력함.`, 2],
      ['personality', traits.includes('시험 불안') ? '모의 테스트 전에 긴장을 많이 함. 시작 전에 쉬운 문제 하나로 워밍업하면 좋아짐.' : '질문을 받으면 생각을 정리해서 말하는 편. 발표 기회를 더 주기로.', 11],
      ['consult', '2학기 중간고사 결과 상담. 계산 실수 줄이기를 다음 목표로 정함.', 10],
      ['parent', '어머님과 통화 — 집에서도 숙제를 스스로 하기 시작했다고 하심.', 18],
    ],
    lateNotes: ['버스 지연', '학교 행사'],
    reportComment: (given) => `${given}는 이번 달 ${S} 서술형에서 풀이 과정을 끝까지 쓰는 습관이 생겼습니다. 2학기 중간고사에서도 서술형 감점이 크게 줄었어요.\n다음 달에는 시험 때 긴장해서 생기는 계산 실수를 줄이는 데 집중하겠습니다. 집에서도 많이 칭찬해 주세요.`,
  };
}
