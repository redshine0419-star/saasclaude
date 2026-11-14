# 첫등원 기능 명세 (SPEC)

> 기준일 2026-10. 대괄호 `[ ]`와 `TODO(확인 필요)`는 사업자 결정 또는 법령 확인이 필요한 값이다.

## 1. 서비스 개요

- 대상: 동네 학원·교습소 원장 (1인~소규모)
- 판매하는 것: 홈페이지가 아니라 **신규 상담 → 레벨테스트 → 등록** 전환
- 하지 않는 것: 수납, 출결·성적의 학부모 자동 알림 (학원관리 프로그램 영역). 학생부·성적 기록·출결 기록은 관리자 내부 기록으로만 만든다(14장, 2026-10 결정).

## 2. 사용자와 권한

| 역할 | 접근 | 비고 |
|---|---|---|
| 학부모 (비로그인) | 학원 홈페이지, 상담 신청 | |
| owner (원장) | 자기 학원 관리자 전체 | 학원당 1명 이상 |
| staff (실장 등) | 상담 관리, 콘텐츠 | 설정·요금 정보 제외 |
| platform_admin (첫등원 운영자) | 모든 학원, 플랫폼 관리자 | 학원 대신 콘텐츠 업데이트 대행 |

## 3. 메뉴 구조와 화면 ID

### 3-1. 학원 홈페이지 (학부모용)

| ID | 화면 | 주요 내용 | 디자인 파일 |
|---|---|---|---|
| S-01 | 홈 | 테마별 섹션 조합 (5장 참고) | `academy/Main.dc.html`, `ThemeResult`, `ThemeBright` |
| S-02 | 학원 소개 | 원장 소개, 수업 원칙, 교실·시설 | `academy/About.dc.html` |
| S-03 | 수업 안내 | 중등·고등 반 카드, 주간 시간표, 대기 신청 | `academy/Classes.dc.html` |
| S-04 | 교습비 | 과정별 교습비, 기타 경비, 환불 기준 | `academy/Fee.dc.html` |
| S-05 | 성과·후기 | 후기 필터, 성적 변화 사례 | `academy/Reviews.dc.html` |
| S-06 | 소식 목록 | 구분 필터(모집/공지/시험 대비), 페이지네이션 | `academy/News.dc.html` |
| S-07 | 소식 상세 | 요약 4칸, 본문, 신청 CTA, 이전/다음 | `academy/NewsDetail.dc.html` |
| S-08 | 오시는 길 | 지도, 운영 시간, 교통·주차, 셔틀 노선 | `academy/Location.dc.html` |
| S-09 | 상담 신청 | 진행 4단계 안내 + 신청 폼 | `academy/Consult.dc.html`, `MobileForm.dc.html` |
| S-10 | 접수 완료 | 신청 요약, 준비물 안내 | `academy/ConsultDone.dc.html` |
| S-11 | 온라인 레벨테스트 응시 (`/{slug}/test/{token}`) | 13장 | 시안 없음 |
| S-12 | 레벨테스트 결과지 (`…/result`) | 13장 | 시안 없음 |
| S-13 | 학부모 공유 리포트 (`/r/{token}`) | 시안 없음 — 14장 |
| 공통 | 헤더·푸터·모바일 하단 바 | 푸터에 학원등록번호·교습과목 필수 | `SiteHeader`, `SiteFooter`, `MHeader`, `MBar` |

모바일 시안 (테마 A 기준, 390px): M-01 홈 `MobileHome`, M-NAV 메뉴 열림 `MNav`, M-02 `MAbout`, M-03 `MClasses`, M-04 `MFee`, M-05 `MReviews`, M-06 `MNews`, M-07 `MNewsDetail`, M-08 `MLocation`, M-09 `MobileForm`, M-10 `MConsultDone`.
모바일에서 바뀌는 구조: 표는 카드 목록으로(교습비), 주간 시간표는 요일 선택 + 그날 수업 목록으로, 교실 사진은 가로 스크롤로, 헤더 메뉴는 전체 화면 메뉴(M-NAV)로.

### 3-2. 학원 관리자 (원장용)

| ID | 화면 | 디자인 파일 |
|---|---|---|
| A-00 | 로그인 | `academy/Login.dc.html` |
| A-01 | 대시보드 | `academy/AdminDashboard.dc.html` |
| A-02 | 상담 관리 (목록 + 상세 패널) | `academy/AdminLeads.dc.html` |
| A-03 | 카톡 자동 발송 | `academy/AdminKakao.dc.html` |
| A-04 | 발송 내역·수신 동의 | `academy/KakaoLog.dc.html` |
| A-05 | 소식 관리 | `academy/AdminNews.dc.html` |
| A-06 | 후기·성과 관리 | `academy/AdminReviews.dc.html` |
| A-07 | 수업·시간표·레벨테스트 시간 | `academy/AdminClasses.dc.html` |
| A-08 | 학원 정보·교습비 | `academy/AdminInfo.dc.html` |
| A-09 | 월간 리포트 | `academy/AdminReport.dc.html` |
| A-10 | 설정 | `academy/AdminSettings.dc.html` |
| A-M | 원장 모바일 글쓰기 | `academy/AdminMobile.dc.html` |
| A-11 | 문제은행 | 시안 없음 — 13장 |
| A-12 | 레벨테스트 시험지 (구성 · 결과·문항 통계) | 시안 없음 — 13장 |
| A-13 | 채점함 (서술형 채점·첨삭) | 시안 없음 — 13장 |
| A-14 | 학생부 (목록 · 학생별 한눈에 보기) | 시안 없음 — 14장 |
| A-15 | 출결 체크 | 시안 없음 — 14장 |

### 3-3. 첫등원 서비스 사이트 (원장 대상)

| ID | 화면 | 디자인 파일 |
|---|---|---|
| F-01 | 메인 | `marketing/Main.dc.html` |
| F-02 | 서비스 소개 | `marketing/Service.dc.html` |
| F-03 | 데모 보기 | `marketing/Demo.dc.html` |
| F-04 | 요금 | `marketing/Pricing.dc.html` |
| F-05 | 상담 · 무료 진단 | `marketing/Consult.dc.html` |
| F-05a | 무료 진단 접수 완료 | `marketing/ConsultDone.dc.html` |
| ~~F-06~~ | ~~베타(제작 대행) 신청~~ — **2026-11 삭제**. `/apply`는 `/start`로 보낸다 | `marketing/Apply.dc.html` |
| ~~F-06a~~ | ~~베타 신청 완료~~ — 2026-11 삭제 | `marketing/ApplyDone.dc.html` |
| F-07 | 셀프 개설 (`/start`) | 시안 없음 — 12장 참고 |

### 3-4. 플랫폼 관리자 (첫등원 운영자용)

| ID | 화면 | 주요 내용 | 디자인 파일 |
|---|---|---|---|
| P-01 | 학원 목록 | 운영 요약, 할 일 알림(베타 종료 2주 이내, 카톡 한도 90%), 상태 필터, 카톡 사용량, 관리자 대행 접속 | `academy/PlatAcademies.dc.html` |
| P-02 | 학원 상세·설정 | 탭(기본 정보/테마·섹션/플랜·베타/계정·연결), 테마 선택, 강조색 대비 검사, 홈 섹션 켜기·순서, 같은 지역·과목 경고, 원장 연락 기록 | `academy/PlatAcademyEdit.dc.html` |
| P-03 | 무료 진단 | 요청 목록(기한 표시), 4개 항목 판정·메모, 카톡 미리보기·발송 | `academy/PlatDiagnosis.dc.html` |
| ~~P-04~~ | ~~베타 신청·제작 칸반~~ — 2026-11 삭제 (제작 대행 신청 기능 폐지) | `academy/PlatQueue.dc.html` |
| P-05 | 서비스 설정 | 베타 조건, 정식 요금, 카카오 발송 대행사, 운영자 계정·대행 접속 기록 | `academy/PlatSettings.dc.html` |

- 운영자 로그인은 A-00과 같은 화면, 역할로 분기한다.
- "관리자로 들어가기(대행)"는 접속 기록을 남기고, 원장도 설정(A-10)에서 그 기록을 볼 수 있어야 한다.
- 오픈 준비에서 "오픈" 처리하면 `beta_started_at`이 기록되고 P-01로 옮겨진다.

## 4. 데이터 모델 (초안)

모든 테이블에 `id`, `created_at`, `updated_at`. 학원 소속 데이터는 `tenant_id` 필수.

- **tenants**: plan_status(`beta`|`paid`|`ended`), beta_started_at, beta_ends_at, slug, name, theme(`warm`|`result`|`bright`), accent_color, custom_domain, reg_no(학원등록번호), subjects, target_grades, address, phone, hours, kakao_channel_url, naver_place_url, ga4_measurement_id, plan, status
- **tenant_sections**: tenant_id, section_key, enabled, sort_order — 테마 기본값을 복사해 학원별로 조정
- **memberships**: tenant_id, user_id, role
- **notify_recipients**: tenant_id, name, phone — 새 상담 알림 받을 번호
- **director_profile**: tenant_id, photo, headline, philosophy, education, career, subjects_taught
- **staff_profiles** (테마 B 강사진): tenant_id, name, role_label, photo, summary, sort_order
- **classes**: tenant_id, name, grade_band, days[], start_time, end_time, capacity, seats_left, waitlist_count, textbook, description, photo(반 카드 사진, 2026-11), sort_order
- **level_test_slots**: tenant_id, weekday, time, active, (또는 특정 날짜)
- **fees**: tenant_id, class_id(nullable), label, sessions_per_week, monthly_hours, amount, note
- **extra_costs**, **refund_policy_text**: tenant 단위 텍스트/행
- **leads**: tenant_id, parent_name, phone, student_grade, school, consult_type(`level_test`|`phone`|`visit`), preferred_slot_id, message, source, utm(json), status, status_changed_at
- **lead_events**: lead_id, type(`created`|`status_changed`|`note`|`message_sent`|`call`), payload(json), actor_id
- **consents**: tenant_id, lead_id, type(`privacy`|`marketing`|`night`), granted_at, revoked_at, channel, reconfirm_due_at
- **posts**: tenant_id, category(`notice`|`recruit`|`exam`), title, summary_fields(json: 기간·대상·인원·교습비), body, images[], status(`draft`|`scheduled`|`published`), published_at, send_kakao, kakao_scheduled_at
- **reviews**: tenant_id, kind(`review`|`score_case`), body, author_label, source, consent_confirmed, consent_file, before_value, after_value, period_label, comment, show_on_home, visible
- **result_stats** (테마 B): tenant_id, term_label, metrics(json), basis_text(필수), published
- **message_templates**: tenant_id, scenario(`receipt`|`reminder`|`followup`|`campaign`|`owner_alert`|`reconfirm`), kind(`info`|`ad`), body, provider_template_code, review_status(`draft`|`pending`|`approved`|`rejected`), approved_body
- **automation_settings**: tenant_id, scenario, enabled, delay_rule
- **messages**: tenant_id, lead_id(nullable), scenario, kind, channel(`alimtalk`|`brand`|`sms_fallback`), recipient_hash, status, cost, sent_at, error
- **monthly_reports**: tenant_id, month, snapshot(json), ai_check(json), manager_note
- **diagnostic_requests** (F-05): academy_name, area, subject, phone, current_url, status, result_note
- **applications** (F-06, 기능 삭제): 기존 신청 데이터 보관용으로만 테이블이 남아 있다. 화면·API 없음. 정리 후 마이그레이션으로 삭제 예정

## 5. 테마와 섹션

섹션 컴포넌트 목록: `hero`, `quick_info`, `director`, `principles`, `classes`, `timetable`, `fees`, `results_stats`, `exam_system`, `curriculum`, `score_cases`, `teachers`, `day_flow`, `gallery`, `safety`, `reviews`, `news`, `location`, `consult_form`

| 테마 | S-01 홈 기본 순서 | 헤더 CTA |
|---|---|---|
| A 원장 직강형 | hero(사진+레벨테스트 시간) → quick_info → director → principles → classes → timetable → fees → reviews → news → faq → consult_form → location (2026-11 시안) | 무료 레벨테스트 신청 |
| B 성과 중심형 | hero(사진+성적 태그, 아래 숫자 띠) → results_stats → exam_system → curriculum → score_cases → teachers → fees → faq → consult_form → location (2026-11 시안, 오시는 길 추가) | 레벨테스트 신청 |
| C 밝은 친근형 | hero(사진 콜라주·연령 칩) → day_flow → classes(연령별) → gallery → safety → reviews → faq → consult_form(체험 수업) → location (2026-11 시안, 오시는 길 추가) | 체험 수업 신청 |

- 원장(owner)은 테마 선택, 강조색, 섹션 켜기/끄기·순서를 직접 바꿀 수 있다. staff는 읽기 전용. 저장 즉시 공개 홈페이지에 반영된다.
- 원장이 바꿀 수 없는 것: 폰트·레이아웃·간격, `hero`(항상 맨 위·항상 표시), `consult_form`(항상 표시), 푸터 법정 표기, 동의 체크박스. 규칙은 `lib/sections.ts` 한 곳에서 정의하고 서버에서 강제한다.
- 테마에 없는 섹션 키는 저장·렌더 모두에서 무시한다. 테마를 바꾸면 이전 테마 전용 섹션은 꺼진다(내용은 보존).
- 데이터가 비어 있는 섹션은 자동으로 숨긴다 (예: result_stats 미입력 → B 히어로 점수표 숨김, safety 항목 미입력 → 섹션 숨김).
- 모바일 개선 반영: A 모바일 첫 화면은 교실 사진 대신 원장 사진. C의 연령 칩은 해당 반으로 스크롤 이동.

## 6. 상담(lead) 흐름

상태: `new` → `contacted` → `test_booked` → `enrolled` | `not_enrolled`

1. 학부모가 S-09 또는 홈 폼 제출 → lead 생성, consents 저장, source 판별
2. 즉시: 학부모에게 `receipt` 알림톡, notify_recipients에게 `owner_alert` 알림톡
3. 원장이 A-02에서 상태 변경 → lead_events 기록
4. `test_booked`: 테스트 전날 18:00 `reminder`
5. `not_enrolled`로 바뀐 지 [3]일 후: 마케팅 동의자에게만 `followup` (광고성)
6. 대시보드 "오늘 연락할 상담": `new` 상태 전부 + `not_enrolled` 후 [3]일 지난 건

source 판별 순서: UTM → referrer (naver.com 검색/플레이스, kakao, blog.naver, chatgpt.com·perplexity.ai·gemini.google.com 등 AI 검색) → direct

## 7. 카카오톡 발송

| 시나리오 | 유형 | 트리거 | 대상 |
|---|---|---|---|
| receipt 상담 접수 확인 | 정보성 알림톡 | lead 생성 즉시 | 신청자 |
| owner_alert 새 상담 알림 | 정보성 알림톡 | lead 생성 즉시 | notify_recipients |
| owner_reminder 미응대 상담 아침 알림 | 정보성 알림톡 | 매일 08:00 KST (Hobby 크론은 1시간 안 실행), 최근 30일 `new` 상담이 1건 이상인 학원 | notify_recipients — 학원별 1건, 건수·가장 오래된 신청일·관리자 링크만(이름·연락처 없음). 기본 켜짐, A-03에서 끌 수 있음 |
| reminder 테스트 전날 | 정보성 알림톡 | 예약 전날 18:00 | 예약자 |
| followup 미등록 후속 | 광고성 | not_enrolled 후 [3]일 | 마케팅 동의자 |
| campaign 모집 공지 | 광고성 | 원장 수동 / 소식 게시 시 | 마케팅 동의자 |
| reconfirm 수신 동의 재확인 | 정보성 | 동의일 기준 2년 도래 [30]일 전 | 마케팅 동의자 |

- 템플릿 변수: `#{학부모명}`, `#{학원명}`, `#{학생학년}`, `#{상담유형}`, `#{테스트일시}`
- 알림톡 템플릿 수정 → `pending`, 승인 전까지 `approved_body`로 발송
- 발송 문구 결정 순서: 학원 승인 문구(`approved_body`) → 플랫폼 공용 문구(`lib/messaging/templates.ts`, 정보성만) → 없으면 발송 안 함. 승인 안 된 초안은 어떤 경로로도 발송하지 않는다
- 알림톡 실패 시 문자 대체 발송, messages에 기록
- 카카오 광고성 상품 구성이 바뀌는 중이므로 `TODO(확인 필요)`: 친구톡/브랜드 메시지 중 실제 사용 상품

## 8. 규칙 (서버에서 강제)

- 광고성 발송: `marketing` 동의 + 미철회인 대상만. 본문 앞 `(광고)` 자동 삽입, 수신거부 방법 자동 포함. 21:00~08:00에는 `night` 동의자만, 나머지는 08:00 이후로 미룸. `TODO(확인 필요)`: 정보통신망법 세부 요건
- 수신 동의 2년마다 재확인 `TODO(확인 필요)`
- 후기: `consent_confirmed=false`면 공개 불가
- 성적 사례: `consent_file` 없으면 공개 불가
- result_stats: `basis_text` 비어 있으면 공개 불가
- 교습비 수정 시 "교육청 신고 금액과 같은지" 확인 모달, 변경 이력 저장
- 환불 기준 문구는 플랫폼 기본값 제공(`lib/refund.ts`), `TODO(확인 필요)`: 학원법 시행령 [별표] 원문과 대조
- 학원 홈페이지 = 학습자 모집 인터넷 광고(학원법 제15조 제3항): 푸터에 학원 명칭·등록번호·교습과목, **교습비 섹션은 모든 테마에서 끌 수 없음**(`LOCKED_SECTIONS`, 원장이 꺼 두었으면 상담 신청서 앞에 자동 표시), 교습비 표 아래 **교습비 반환 기준** 항상 표시(학원이 쓴 규정, 없으면 법정 기준)
- 상담 폼: 개인정보 필수 동의와 마케팅·야간 선택 동의를 분리, 기본값 모두 미체크
- 사진: 갤러리 글은 보호자 게시 동의 확인(`facePhotoConsent`)이 없으면 서버가 저장을 막는다 (소식 POST·PATCH)
- 관리자 목록 연락처 마스킹 (010-****-1234)

## 9. 검색·분석

- 학원별: title/description, Open Graph, `EducationalOrganization`/`LocalBusiness` JSON-LD (이름, 주소, 전화, 운영 시간), sitemap.xml, robots.txt, 네이버 사이트 인증 메타 입력칸
- 소식 상세는 이미지 속 글자에 의존하지 않도록 요약 필드를 본문 텍스트로 출력
- A-08에 네이버 플레이스 정보 불일치 경고 (1차: 원장이 플레이스 값을 입력해 수동 비교. 자동 수집은 후순위)
- GA4: **첫등원 측정 ID 하나**(`G-LNFYKK06L6` 코드 기본값, 환경변수 `GA4_MEASUREMENT_ID`가 있으면 우선. 미리보기 배포·localhost 제외)로 서비스 사이트와 모든 학원 홈페이지를 잰다. 학원별 측정 ID 입력은 2026-11 삭제(DB 칸 `ga4_measurement_id`는 쓰지 않음).
  - 페이지 조회는 직접 보낸다: `content_group`(service / academy / demo), `academy_slug`(학원 홈페이지일 때), 주소의 쿼리는 빼고 보낸다
  - 보내지 않는 곳: `/{slug}/admin`, `/platform`, `/auth`, `/account`, `/signup`, 비밀 링크(`/r/…`, `/{slug}/test/…`, `/{slug}/join/…`, `/consult/result/…`, `?k=`) — 이 페이지에선 GA를 끈다(`ga-disable-…`)
  - 전환 이벤트: `generate_lead`(lead_type: academy_consult / free_diagnosis), `sign_up`(셀프 개설)
  - 학원 개인정보처리방침 8-2에 방문 통계(쿠키) 고지
- A-09 AI 검색: 수동 점검(질문·엔진별 언급 여부 입력)은 하지 않는다(2026-11 결정 — 운영 수작업이 늘고 결과가 매번 달라 원장이 할 수 있는 일이 없음). 대신 상담 신청 유입 경로(ai_chatgpt·ai_perplexity·ai_gemini)로 **AI 검색으로 들어온 상담 수**를 리포트에 자동 집계하고, 노출은 구조화 데이터·FAQ로 높인다. monthly_reports.aiCheck 칼럼은 남겨 두되 쓰지 않는다

## 10. 첫등원 서비스 사이트 (F-01~06)

- 무료 진단: 학원명·지역·과목·연락처·현재 URL → diagnostic_requests. 제출 즉시 자동 점검(상담 전환·모바일·검색·학원 정보 4항목)해 `/consult/result/[id]`로 보여준다. 블로그·플레이스·인스타·카톡 채널·밴드 주소는 "홈페이지 없음"으로 판정. 운영자는 P-03에서 필요할 때만 보완
  - 서버가 사용자 URL을 가져오므로 SSRF 방어 필수: http(s) 80/443만, 연결 시점 IP 검사(사설·루프백·링크로컬·메타데이터 차단), 리다이렉트 3회·재검사, 8초·1.5MB 제한
- **베타 운영 (현재 정책)**: 3개월 무료, 모집 인원 제한 없음, 성장 플랜 전체 기능 제공
  - 3개월은 학원 홈페이지 **오픈일**부터 계산한다 (`tenants.beta_started_at`, `beta_ends_at`)
  - 자동 결제 없음, 카드 정보 받지 않음. 원장(새 상담 알림 번호)에게 D-14·D-3·D-0·비공개 7일 전 자동 안내(`tenants.lifecycleNotices`에 기록, 하루 1건), 대시보드 배너에서 "계속 이용 신청"·내보내기. 운영자는 P-01 "계속 이용 신청" 태그를 보고 플랜 전환
  - 종료 후 미전환 시 [30]일 유지 후 비공개 전환, 상담 기록·콘텐츠 내보내기 제공, 도메인은 학원 명의
  - 베타 한도: 카톡 월 [300]건, 콘텐츠 대행 월 [1]회. 한도 도달 시 운영자 알림 (발송 차단 여부 `TODO(확인 필요)`)
- 베타 참여는 셀프 개설(F-07, `/start`)로만 한다. 제작 대행 신청(F-06)은 2026-11 삭제
- **정식 요금 (2026-11 결정): 재원생 수 구간** — 학생부 '재원' 학생 수 기준, 기능은 모든 구간 동일 (`lib/plan-tier.ts`)
  - 무료: 재원생 5명까지 / 스탠다드: 6~50명 / 플러스: 51명 이상
  - 금액: 스탠다드 월 30,000원, 플러스 월 50,000원 (2026-11 결정, `lib/plan-tier.ts` 기본값). 플랫폼 관리자 설정(`price_tier_standard`, `price_tier_plus`)에 값을 넣으면 그 값이 우선. 베타 참여자 할인율은 미정
  - 구간 판정: 현재 재원생 수로 **바로** 적용 (유예·월 최대치 없음)
  - 결제 수단: **카드 정기결제만** (매월). **지금은 모의 결제**(`lib/billing/mock.ts`, 실제 청구 없음) — PG 키가 생기면 어댑터만 바꾼다(`lib/billing/index.ts`)
  - 흐름: A-10 계열 **결제 화면**(`/{slug}/admin/billing`, 원장만)에서 정기결제 동의 + 카드 등록 → 베타 중이면 첫 결제일 = 베타 종료일, 아니면 즉시 결제. 매일 `/api/cron/billing`(KST 10:00)이 결제일 도래 건을 청구 — 그 시점 재원생 수의 구간 금액(0원 구간은 결제 없이 다음 달로). 성공 시 다음 결제일 +1개월·`planStatus=paid`, 실패 시 다음 날 재시도(최대 3회)·원장에게 안내(`billing_failed`), 정상 카드로 다시 등록하면 즉시 결제. 해지하면 이후 청구 안 함
  - 카드 번호는 어떤 경우에도 저장하지 않는다 — PG 빌링키·표시용 카드 이름만(`subscriptions`), 결제 기록 `payments`(구간·재원생 수·금액·결과)
  - 기능 차단은 하지 않는다(결제 실패여도 서비스 유지). P-01 학원 목록에 카드 등록·결제 실패·해지 표시
  - 표시: 요금 페이지 구간표·FAQ, 학원 설정 "이용 중인 플랜"에 재원생 수·구간·금액, P-01 학원 목록에 재원생·구간
  - `TODO(확인 필요)`: 부가세 포함 여부, 정기결제 약관·자동 갱신 사전 고지·해지/환불 규정(전자상거래법), PG사 선정(사업자등록 필요), 결제일·구간이 바뀐 달의 청구 방식
- 데모: 데모 테넌트(가상 학원 3개, 테마별 1개)를 시드 데이터로 만들고 실제 카톡 발송은 막는다

## 10-2. 첫등원 블로그 (F-08, 2026-11)

- 원장님 유입용 블로그. **운영자만 쓴다** (댓글·회원 글쓰기 없음). 학원 데이터가 아니라 `blog_posts`에 tenantId가 없다
- 공개: `/blog` 목록(분류 탭 운영 노하우·법규·행정·홍보·마케팅·첫등원 소식, 고정 글 먼저, 12개씩), `/blog/{slug}` 상세(목차 3개 이상일 때, 읽는 시간, 같은 분류 글 3개), 서비스 사이트 머리말 "블로그"
- 운영: `/platform/blog` 글 목록·쓰기(마크다운 + 미리보기, 사진 올리기, 대표 사진, 검색용 제목, 공개 날짜·예약 공개, 고정). 숨김(draft)/공개(published)
- 본문은 작은 마크다운(`lib/blog/markdown.ts`) — HTML을 넣지 않고 React로 그린다. 링크는 http(s)·사이트 경로·tel·mailto만, 사진은 https·사이트 경로만. `[[진단]]` 줄은 무료 진단 버튼. 글 끝에도 무료 진단 버튼이 붙는다
- 초안의 `【확인 필요】` 표시가 제목·요약·본문에 남아 있으면 **서버가 공개를 막는다**
- 검색: 글마다 canonical·OG(대표 사진)·BlogPosting/BreadcrumbList JSON-LD, 본문에 `### Q. 질문` 소제목이 있으면 그 아래 답까지 FAQPage JSON-LD(`extractFaq`), 사이트맵에 블로그 글, RSS `/blog/rss.xml`(네이버 서치어드바이저 RSS 제출). GA4 content_group `blog`
- 첫 글 초안 5편은 빌드 때 한 번 숨김으로 들어간다(`scripts/seed-blog.mjs`, 내용 `scripts/blog-drafts.mjs`)

## 9-2. 관리자 앱(PWA)·앱 알림 (2026-11)

- 관리자 화면을 홈 화면에 설치하는 설치형 웹앱(PWA): 학원별 설치 정보 `/api/{slug}/manifest`(시작 `/{slug}/admin`), 아이콘 `/api/app-icon`, 서비스 워커 `/sw.js`(푸시 표시·알림 누르면 화면 열기만, 오프라인 캐시 없음)
- 설정 › "앱 설치 · 앱 알림": 홈 화면 설치 안내(아이폰은 홈 화면에 추가해야 푸시 가능, iOS 16.4+), "이 기기에서 알림 받기"(웹 푸시 구독 → `push_devices`), 테스트 알림, 알림 받는 기기 목록·끄기
- **원장·직원 알림만** 앱 푸시로: 새 상담, 아침 미응대 알림, 주간 수업 확인, 월간 요약(자동·수동), 베타 안내, 결제 실패. `lib/push` `notifyStaff` — 푸시를 먼저 보내고, 학원 설정 `pushReplacesKakao`(기본 켜짐)이고 한 대라도 받으면 알림톡을 건너뛴다. 아무 기기도 못 받으면 알림톡으로 보낸다
- 학부모에게 가는 알림(접수 확인·리마인드·광고성)은 알림톡 그대로
- **운영자 앱 알림**: 플랫폼 › 설정 › "운영 앱 알림"에서 운영자 기기를 등록(`operator_push_devices`, 학원과 무관). 새 학원 셀프 개설(`/api/start`), 회원가입 완료(첫 약관 동의, 약관 변경 재동의는 제외), 무료 진단 신청(`/api/consult`, 연락처는 빼고 지역·과목만) 때 `pushToOperators`로 보낸다. 회원 이메일은 가려서 보낸다. 운영자 앱 설치 정보 `/api/platform/manifest`(시작 `/platform`)
- 푸시 내용에는 학부모 이름을 가린다(김○○). 만료된 구독(404·410)은 자동 삭제

## 9-1. 학원 자료실 (2026-11)

- 학원(원장·직원)만 올리고 학부모는 보고 내려받는다. 관리자 › 홈페이지 콘텐츠 › 자료실(`/{slug}/admin/resources`), 학부모 화면 `/{slug}/resources`, 상세 `/{slug}/resources/{id}`
- 자료: 제목·설명·첨부(PDF·사진·한글 hwp/hwpx·워드·엑셀·파워포인트, 파일당 10MB, 5개까지, `{slug}/resources/`에 저장)·상단 고정
- 공개 범위: **홈페이지 공개**(목록에 보임) / **링크로만 공유**(목록에 안 보이고 `?k=공유키`가 맞아야 열림, 검색 제외) — 재원생 가정통신문용
- 공개 자료가 있으면 홈페이지 머리말 메뉴(오시는 길 바로 앞)와 꼬리말에 "자료실" 링크. 데모 학원 3곳에는 샘플 자료 3건씩(`scripts/seed-sample.mjs`, 파일은 `public/demo-files/`). 자료를 지우거나 첨부를 빼면 저장소 파일도 지운다. 비공개(published=false) 학원은 자료실도 닫힌다

## 10-1. 회원가입·개인정보 동의 (2026-11)

- 가입: `/signup` — Google 로그인 → `/signup/consent` 동의 → 원래 가려던 곳. 동의 전에는 학원 관리자·셀프 개설·플랫폼 관리자·직원 초대 수락을 쓸 수 없다(서버에서 동의 화면으로, `/api/start`도 거절). 데모 둘러보기는 예외
- 동의 화면 공통(2026-11): 전체 동의 + 항목별 (필수)/(선택) + "보기"로 펼치는 전문(수집 항목·이용 목적·보유 기간 표, 거부 권리). 정의는 `lib/legal/consents.ts`, 화면은 `components/legal/ConsentList.tsx`. 필수 동의는 서버에서도 검사한다
- 동의 항목
  - 회원가입: [필수] 만 14세 이상 · 서비스 이용약관(전문) · 개인정보 수집 및 이용 / [선택] 홍보 목적 개인정보 수집·이용 · 광고성 정보 수신(채널 선택 없음)
  - 무료 진단: [필수] 개인정보 수집 및 이용 / [선택] 광고성 정보 수신 (`diagnostic_requests.privacyAgreedAt·adAgreedAt`)
  - 셀프 개설: [필수] 베타 이용 조건 / [선택] 익명 성공 사례 — 약관·개인정보는 가입 때 받은 것으로 확인
  - 카드 정기결제: [필수] 정기결제 동의 · **개인정보 제3자 제공(결제대행사)** (`subscriptions.thirdPartyConsentAt`) — 제3자 제공 동의는 실제로 다른 회사가 자기 목적으로 받는 이곳에만 받는다
  - 학원 상담 신청(학원=처리자, 구조 유지): [필수] 학부모(법정대리인) 확인 · 개인정보 수집 및 이용 / [선택] 광고성 정보 수신 · 야간(21~08시) 수신(광고성 동의 시에만)
  - 학부모 등록 링크: [필수] 학부모(법정대리인) 확인 · 개인정보 수집 및 이용
- 기록: users(동의 시각·버전·광고성 수신 marketingAgreedAt/RevokedAt·홍보 목적 promoAgreedAt/RevokedAt), user_consent_logs(동의·철회 이력, type marketing|promo). 기존 마케팅 동의자는 홍보 목적 동의로도 옮김. 약관·처리방침 버전(`lib/legal/documents.ts`)이 바뀌면 다음 접속 때 다시 동의를 받는다
- 내 계정 `/account`: 동의 내역, 홍보 목적 수집·이용과 광고성 정보 수신을 각각 동의·철회, 회원 탈퇴(유일한 원장이면 막고 해지·원장 변경 안내)
- 문서: `/terms` 이용약관, `/privacy` 개인정보처리방침(작성지침 항목: 목적·항목·보유 기간·제3자 제공·위탁·국외 이전·파기·권리 행사·아동·안전성 조치·쿠키·보호책임자·구제), 학원별 `/{slug}/privacy`(학원=처리자, 첫등원=수탁자) — 학원 상담 폼·푸터에 연결
- 운영자 정보(상호·대표자·사업자번호·주소·보호책임자)는 `[ ]`로 비워 둠 — 사업자등록 후 `lib/legal/documents.ts`의 OPERATOR에 채운다
- `TODO(확인 필요)`: 약관·처리방침 법률 검토, 신청 정보 보유 기간, 위탁사 법인명·서버 국가, 환불 기준

## 11. 미결정 사항

- 정식 요금, 베타 참여자 할인율, 약정·위약 조건
- 같은 동네·같은 과목 학원의 동시 베타 참여 허용 여부
- 무료 진단 시 시안 제공 여부 (운영 부담)
- 카카오 발송 대행사, 광고성 메시지 상품
- 기본 도메인 (`{slug}.[도메인]`)
- 플랫폼 관리자 화면 디자인

## 12. 셀프서비스 (고객 접점 최소화)

원장이 운영자 도움 없이 홈페이지를 만들고 고친다. 운영자는 제작자가 아니라 예외 처리자다. 제작 대행 신청(F-06)은 2026-11 삭제했다. 콘텐츠 대행 월 [1]회만 선택지로 유지한다.

- **셀프 개설 F-07** (`/start`): Google 로그인 → 학원 정보(학원명·주소 slug·학원등록번호·교습과목·대상 학년·대표 전화·주소) → 테마 선택 → 필수 동의 3종(+선택 1종) → **즉시 공개** (`noindex` 없음, 운영자 사전 승인 없음)
  - 생성: tenant(`onboardedVia=self_serve`, `signupConsents`에 동의 기록), 기본 섹션, owner 멤버십, 베타 기간(오픈일=개설일부터 3개월)
  - 계정당 셀프 개설 1개. platform_admin은 예외
  - slug: 영문 소문자·숫자·하이픈 3~40자, 예약어·`demo-*` 불가, 개설 후 변경 불가
- **수정 범위**: 5장 규칙. 원장은 테마·강조색·섹션 켜기/순서를 직접 바꾸고, 저장 즉시 반영된다
  - 강조색: 흰색 대비 4.5:1 이상만 저장 (프리셋 8색 제공)
- **변경 이력**: 테마·섹션·강조색 변경마다 `site_versions`에 스냅샷, 최근 20개 보관, 원장이 "이 상태로 되돌리기" 가능. 복원 시 현재 규칙으로 재검증
- **완성도 체크리스트** (A-01): 알림 번호, 레벨테스트 시간, 원장 소개, 수업, 교습비, 환불 기준, 운영 시간, 카카오 채널 (+테마별 항목). 미완료 항목을 해당 화면 링크와 함께 표시
- `TODO(확인 필요)`: 과장광고 금지어 목록(학원법 기준) — 확정 전까지 자동 차단하지 않는다
- 2단계(완료): 자동 무료 진단(10장), 베타 생애주기 자동 안내(10장), 공용 정보성 템플릿(7장)
- **커스텀 도메인** (A-10): 원장이 도메인 입력 → 필요한 DNS 레코드 안내(루트 A `76.76.21.21`, 하위 CNAME `cname.vercel-dns.com`, 필요 시 TXT) → "연결 확인". Vercel 프로젝트에 API로 추가하고, 검증·설정 완료된 도메인만 middleware가 학원으로 라우팅. 관리자·로그인 경로는 growweb.me로 돌려보낸다(세션 쿠키). 연결되면 canonical·OG 주소가 학원 도메인이 된다
- **AI 초안** (A-08 원장 소개·원장만 / A-07 수업 설명·A-05 소식 글·실장 포함): 입력한 글의 사실만 사용, 단정·과장 표현과 근거 없는 수치 주장은 빼고 "뺀 표현"으로 보여준다. 초안은 칸을 채우기만 하고 저장은 원장이 한다. 학원당 24시간 30회, 원문은 저장·로그하지 않는다
- 셀프 결제: 보류 — 11장 미결정 사항(정식 요금, 결제 대행사, 약정·환불) 확정 후

- **메인 화면·섹션 문구 편집 (2026-10)**: 홈페이지 구성(A-10 계열)에서 원장이 메인 히어로(강조 문구·제목·소개·대표 사진 3장)와 섹션 제목·카드 항목(하루 일과·안심 등하원·시험 대비 시스템)을 고친다. 저장 즉시 공개, 원장만. 비우면 테마 기본 문구 — 기본 문구에는 학원마다 다른 사실(인원·특강 모집 등)을 넣지 않는다. **안심 등하원 항목(CCTV·경력 조회·동승 등)은 사실 주장이라 기본값을 공개하지 않고 원장이 입력한 것만 보인다.** `lib/hero.ts`, `lib/section-copy.ts`

- **데모 학원 (demo-warm·demo-result·demo-bright)**: 샘플 데이터(scripts/seed-sample.mjs)가 채워진 DB 학원. 홈페이지는 DB 내용을 보여 주고, 비어 있거나 DB 오류면 코드의 고정 샘플. 관리자는 **누구나 읽기 전용으로 둘러보기**(로그인 불필요, lib/demo-viewer.ts) — 저장·삭제·발송 API는 실제 로그인·소속을 요구하므로 서버에서 거절되고, 화면에서는 "데모에서는 저장되지 않습니다" 안내. 운영자는 실제 편집 가능. 데모 상담 신청 폼은 저장하지 않는다

## 13. 온라인 레벨테스트 (문제은행·채점·통계)

범위 A: **상담 신청한 예비 학생**의 레벨테스트로 등록 전환을 돕는다. 재원생 학습 관리(B)는 1장 "하지 않는 것"과 충돌하므로 별도 결정 전까지 만들지 않는다.

- **문제은행 (A-11)**: 객관식(보기 2~8개, 정답 1개)·단답형(허용 답안 여러 개). 과목·학년·단원·난이도(1~5)·배점·그림·해설. 본문·보기의 `$...$`, `$$...$$`는 KaTeX 수식(그 외 글자는 이스케이프, `trust:false`). 학원별 비공개(`tenantId`). 응답이 있는 문항은 삭제하지 않고 보관. 원장·실장 모두 편집
- **시험지 (A-12)**: 문항 직접 추가·순서·배점, 또는 자동 구성(학년·단원 조건, 쉬움·보통·어려움 3:4:3, 단원 고르게, 쉬운 순). 제한 시간·응시 전 안내. **제출된 응시가 있으면 문항 변경 불가** → "복사해서 새로 만들기"
- **응시 링크**: A-02 상담 상세에서 시험지를 골라 발급(192비트 토큰). 응시 화면에서 학생 개인정보를 새로 받지 않고 상담 건에 연결한다. 링크는 복사하거나 원장 휴대폰 문자앱으로 보낸다. `TODO(확인 필요)`: 응시 링크 알림톡 템플릿 등록 후 자동 발송
- **응시 (S-11)**: 로그인 없음, 모바일 우선. 답은 바뀔 때마다 서버에 자동 저장. 제한 시간 종료 시 자동 제출, 서버는 시작+제한+60초 이후 답을 거부. **정답·해설은 브라우저로 보내지 않는다.** 토큰과 학원 slug가 함께 맞아야 열린다
- **채점**: 객관식은 보기 번호, 단답형은 정규화(NFKC·공백·천 단위 쉼표·유니코드 마이너스·대소문자) 후 비교하고 수는 값으로 비교(1/2 = 0.5 = 2/4). 서버에 저장된 답만으로 채점. 동시 제출은 한 번만 처리. 제출 시 상담에 점수 기록, 상태가 신규·연락 완료·테스트 예약이면 **테스트 완료**로 변경
- **결과지 (S-12)**: 점수·백분율, 단원별 정답률, 보완 단원 Top 3, 문항별 O/X. 정답·풀이는 보여주지 않는다(문제은행 보호, 상담 유도). 전화·카톡 상담 버튼. 검색 제외(noindex)
- **결과·문항 통계 (A-12 탭)**: 발급·제출 수, 평균·최고·최저, 점수 분포, 단원별 정답률, 응시자 목록(학부모 이름 마스킹). 문항별 정답률, 많이 고른 오답 보기, 변별도(상위 27% − 하위 27% 정답률, 제출 10건부터), 경고: 전원 오답·전원 정답·변별도 음수(정답 오류 의심)·설정 난이도와 실제 정답률 불일치
- **서술형·풀이 사진 (2단계)**: 서술형 문항은 자동 채점하지 않는다. 해설 칸에 모범답안·채점 기준(선생님만 봄). 학생은 글(2,000자)·풀이 사진(문항당 3장, 휴대폰에서 긴 변 1600px JPEG로 줄여 업로드)으로 답한다. 사진은 `lib/storage.ts`(Vercel Blob, 개발 환경은 `public/dev-uploads`), 파일명은 무작위. 저장소가 없으면 사진만 막고 글 답안은 받는다
- 제출 시 서술형은 채점 대기(점수 null), 응시는 `needsGrading`. 결과지는 "선생님이 채점하고 있습니다"와 자동 채점분만 보여준다. 상담 기록에 "서술형 n문항 채점 대기"
- **채점함 (A-13)**: 채점 대기·최근 완료 목록. 채점 화면에서 문항별 0~배점 부분 점수, 오답 유형(개념·계산·조건 누락·문제 해석·기타), 첨삭 코멘트, 사진 위 펜 표시(빨강·파랑·초록, 되돌리기). 펜 표시는 0~1 좌표 선 묶음 JSON으로 저장해 SVG로 겹쳐 그린다(서버에서 형식 검증). 모든 서술형에 점수가 있어야 "채점 완료" → 최종 점수 확정, 상담 기록. 완료 후 수정하면 점수 자동 재계산
- 채점 완료 후 결과지에 서술형별 점수·오답 유형·첨삭·펜 표시 사진. 문항 통계·평균은 채점이 끝난 응시만으로 계산. AI 채점·첨삭은 쓰지 않는다(2026-10 결정)
- 다음 단계: 범위 B(재원생) 결정 시. `TODO(확인 필요)`: 학생 직접 가입 시 만 14세 미만 법정대리인 동의, 결과지 채점 완료 카톡 알림 템플릿
- **제외 (2026-10 결정)**: PDF 문제지 분석. 문항은 문제은행 화면에서 직접 입력한다. 다시 검토할 때는 시판 교재 업로드 저작권과 AI 비용 요금제를 먼저 정한다

## 14. 학생부·성적·출결 (A-14, A-15)

2026-10 결정: 상담 관리 다음 단계로 재원생을 관리한다. **관리자 전용 기록**이며 학부모 화면·공개 페이지에 노출하지 않는다 — 유일한 예외는 선생님이 직접 발행한 **학부모 공유 리포트 스냅샷**(아래). 출결·성적을 학부모에게 자동으로 알리는 기능은 만들지 않는다(1장).

- **학생(students)**: 이름(필수), 학년, 학교, 반(ClassItem), 상태(재원/휴원), 등록일, 학부모 동의(날짜·방식), 학부모 이름·연락처, 학생 연락처, 성격·특성 태그(최대 12개), 한 줄 요약. 상담 건(leadId, 1:1)에 연결하면 상담 이력·레벨테스트 결과를 학생부에서 본다
- **만드는 경로**: 상담 상세에서 상태가 "등록"이면 "원생으로 등록" → 학부모 정보·학년·학교를 상담에서 채운 등록 화면. 직접 추가도 가능. 같은 상담으로 두 번 만들 수 없다(409)
- **관찰 메모(student_notes)**: 종류(학습 태도/성격·특성/상담/학부모 소통/기타), 2,000자, 작성자·시각 기록
- **성적(student_scores)**: 종류(내신/모의고사/학원 테스트), 시험 날짜·이름·과목·점수/만점, 등급(1~9)·백분위(선택). 득점률(%) 과목별 추이 그래프 + 표
- **출결(attendances)**: 학생·날짜당 1건(출석/지각/결석/사유 결석 + 사유). 날짜·반별로 일괄 체크, 미래 날짜 불가
- **A-14 학생별 한눈에 보기**: 머리말(상태·반·태그·한 줄 요약) → 요약 4칸(최근 성적 평균, 최근 30일 출석률, 메모 수, 입학 레벨테스트) → 성적 그래프·표 · 관찰 메모 타임라인 · 성격·특성 · 연락처 · 최근 30일 출결 · 입학 전 기록
- **학부모 동의 (서버에서 강제)**: 학생 등록은 "동의 받음" 확인 + 동의 날짜 + 방식(입학 원서 서면/전자/기타)이 없으면 거절. 동의서 원본은 학원이 보관하고 시스템에는 날짜·방식만 남긴다. 동의 기록이 없는 기존 학생은 학생부·목록에 경고를 띄우고 그 자리에서 기록하게 한다. 학생 추가 화면에 동의서 문구 예시(복사 가능, 보유 기간 "퇴원 시 즉시 파기")
- **건강 정보 (민감정보)**: 메모·요약·출결 사유에 진단명·병력 등을 적지 않도록 안내하고, 의심 단어(lib/students/labels.ts)가 있으면 화면에서 경고한다(막지는 않음)
- **학부모 등록 링크 (2026-11 결정)**: 학생부 상단에서 원장이 학원별 고정 링크 `/{slug}/join/{token}`을 만들고(재발급하면 예전 링크 즉시 무효, 끄기 가능), 원장·실장이 복사하거나 문자로 보낸다. 학부모는 로그인 없이 학생·학부모 정보와 전자 동의(법정대리인 확인 + 수집·이용 동의, 서버에서 강제)를 제출한다. 제출 건은 `student_registrations`(등록 대기)에 쌓이고, 원장·실장이 승인하면 재원생(동의 방식 '전자', 동의일 = 제출일)으로 옮기고 대기 건은 지운다. 거절하면 즉시 삭제, 30일 안에 승인하지 않으면 자동 삭제. 같은 학생 이름 + 학부모 번호로 다시 내면 덮어쓴다. 학원당 대기 200건 상한, 허니팟. 대기 목록 연락처는 마스킹. 링크 페이지는 검색 제외(noindex). TODO(확인 필요): 동의 문구 법률 검토
- **홈페이지 비공개와 학원 삭제는 따로 (2026-11 결정)**: 원장은 설정 › "홈페이지 공개 · 학원 삭제"에서 공개/비공개를 바꾸고(`tenants.published`, 관리자 화면은 계속 사용) 학원 삭제를 요청한다(`deletionRequestedAt`, 요청 즉시 비공개·운영자 메일). 운영 중지(`status=inactive`, 베타 만료·운영자)와도 별개. **자동 삭제 없음** — 운영자가 플랫폼 › "비공개·삭제 요청"에서 비공개 기간을 보고 학원 주소를 입력해 수동 삭제(`purgeTenant`). 삭제 시 결제 기록만 `payment_archives`에 5년 보관. 만료된 직원 초대는 매일 크론(`/api/cron/retention`)이 지운다
- **퇴원 = 즉시 파기 (2026-10 결정)**: 퇴원 처리하면 학생부(기본 정보·성격·메모·성적·출결)를 그 자리에서 영구 삭제한다. "퇴원" 상태로 보관하지 않으며 API도 status=left를 받지 않는다. 남아 있던 퇴원 상태 학생은 마이그레이션 `20261026000001_student_consent`가 삭제. 입학 전 상담 기록(Lead)은 상담 관리 소관이라 남고 연결만 끊긴다. 서버 로그에는 학원·학생 id만 남긴다
- **권한 (서버에서 강제)**: 원장·실장 모두 보기, 학생 추가·정보 수정·동의 기록, 메모·성적·출결 기록. 퇴원 처리(파기)·다른 사람이 쓴 메모·성적 삭제는 원장만
- **개인정보**: 목록의 연락처는 마스킹, 상세에서만 전체 표시. 로그에 이름·연락처·메모 원문을 남기지 않는다. 데이터 내보내기(JSON)에 학생부 전체 포함. 모든 쿼리 `tenantId` 조건, 출결 일괄 저장 시 다른 학원 학생 id가 섞이면 전체 거절
- `TODO(확인 필요)`: 동의서 예시 문구의 법률 검토, 학원법상 원생 명부 등 장부를 퇴원 후에도 보관해야 하는지(그렇다면 학원이 별도 보관 — 첫등원은 즉시 파기 유지)
- **학부모 공유 리포트 (S-13, `growweb.me/r/{token}`)**: 학생부 상세에서 기간(이번 달·지난 달·최근 3개월·직접 지정, 최대 1년)을 고르고 선생님 코멘트(필수, 1,500자)를 써서 미리보기 → 발행. 담는 것은 기간 내 성적(추이 그래프·표)·출결 요약(켜고 끌 수 있음)과 코멘트뿐 — 관찰 메모·성격 태그·요약·연락처는 넣지 않는다
  - 발행 시점 **스냅샷**(student_reports.snapshot)으로 고정 — 학생부를 나중에 고쳐도 바뀌지 않음
  - 링크는 추측 불가 토큰(24바이트), **30일 뒤 만료**, "공유 중지"로 즉시 닫힘, 열람 수 기록. noindex·no-referrer, 학원 홈페이지 레이아웃(GA4) 밖에 둔다. 커스텀 도메인의 /r 은 growweb.me로 보낸다
  - 학부모 동의 기록이 없는 학생은 발행 불가(서버). 퇴원(파기) 시 리포트도 함께 삭제
  - 전달은 선생님이 직접(링크 복사·문자 앱 열기). 자동 발송하지 않는다

