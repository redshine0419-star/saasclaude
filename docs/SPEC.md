# 첫등원 기능 명세 (SPEC)

> 기준일 2026-10. 대괄호 `[ ]`와 `TODO(확인 필요)`는 사업자 결정 또는 법령 확인이 필요한 값이다.

## 1. 서비스 개요

- 대상: 동네 학원·교습소 원장 (1인~소규모)
- 판매하는 것: 홈페이지가 아니라 **신규 상담 → 레벨테스트 → 등록** 전환
- 하지 않는 것: 출결·수납·성적 알림 (학원관리 프로그램 영역). 이 기능을 만들지 않는다.

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

### 3-3. 첫등원 서비스 사이트 (원장 대상)

| ID | 화면 | 디자인 파일 |
|---|---|---|
| F-01 | 메인 | `marketing/Main.dc.html` |
| F-02 | 서비스 소개 | `marketing/Service.dc.html` |
| F-03 | 데모 보기 | `marketing/Demo.dc.html` |
| F-04 | 요금 | `marketing/Pricing.dc.html` |
| F-05 | 상담 · 무료 진단 | `marketing/Consult.dc.html` |
| F-05a | 무료 진단 접수 완료 | `marketing/ConsultDone.dc.html` |
| F-06 | 베타 신청 | `marketing/Apply.dc.html` |
| F-06a | 베타 신청 완료 | `marketing/ApplyDone.dc.html` |

### 3-4. 플랫폼 관리자 (첫등원 운영자용)

| ID | 화면 | 주요 내용 | 디자인 파일 |
|---|---|---|---|
| P-01 | 학원 목록 | 운영 요약, 할 일 알림(베타 종료 2주 이내, 자료 2주 미제출, 카톡 한도 90%), 상태 필터, 카톡 사용량, 관리자 대행 접속 | `academy/PlatAcademies.dc.html` |
| P-02 | 학원 상세·설정 | 탭(기본 정보/테마·섹션/플랜·베타/계정·연결), 테마 선택, 강조색 대비 검사, 홈 섹션 켜기·순서, 같은 지역·과목 경고, 원장 연락 기록 | `academy/PlatAcademyEdit.dc.html` |
| P-03 | 무료 진단 | 요청 목록(기한 표시), 4개 항목 판정·메모, 카톡 미리보기·발송 | `academy/PlatDiagnosis.dc.html` |
| P-04 | 베타 신청·제작 | 칸반: 신청 접수 → 자료 대기 → 제작 중 → 시안 확인 → 오픈 준비, 순번·예상 시작일·자료 진행률 | `academy/PlatQueue.dc.html` |
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
- **classes**: tenant_id, name, grade_band, days[], start_time, end_time, capacity, seats_left, waitlist_count, textbook, description, sort_order
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
- **applications** (F-06): plan, academy 정보, uploaded_files[], wants_photo_shoot, pilot_consent, status

## 5. 테마와 섹션

섹션 컴포넌트 목록: `hero`, `quick_info`, `director`, `principles`, `classes`, `timetable`, `fees`, `results_stats`, `exam_system`, `curriculum`, `score_cases`, `teachers`, `day_flow`, `gallery`, `safety`, `reviews`, `news`, `location`, `consult_form`

| 테마 | S-01 홈 기본 순서 | 헤더 CTA |
|---|---|---|
| A 원장 직강형 | hero(원장 직강) → quick_info → director → classes → fees → reviews → news → consult_form+location | 무료 레벨테스트 신청 |
| B 성과 중심형 | hero(학교별 점수표) → results_stats → exam_system → curriculum → score_cases → teachers → fees+consult_form | 레벨테스트 신청 |
| C 밝은 친근형 | hero(사진 콜라주·연령 칩) → day_flow → classes(연령별) → gallery → safety+reviews → consult_form(체험 수업) | 체험 수업 신청 |

- 원장은 강조색 1개만 바꿀 수 있다. 섹션 켜기/끄기는 platform_admin만.
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
| reminder 테스트 전날 | 정보성 알림톡 | 예약 전날 18:00 | 예약자 |
| followup 미등록 후속 | 광고성 | not_enrolled 후 [3]일 | 마케팅 동의자 |
| campaign 모집 공지 | 광고성 | 원장 수동 / 소식 게시 시 | 마케팅 동의자 |
| reconfirm 수신 동의 재확인 | 정보성 | 동의일 기준 2년 도래 [30]일 전 | 마케팅 동의자 |

- 템플릿 변수: `#{학부모명}`, `#{학원명}`, `#{학생학년}`, `#{상담유형}`, `#{테스트일시}`
- 알림톡 템플릿 수정 → `pending`, 승인 전까지 `approved_body`로 발송
- 알림톡 실패 시 문자 대체 발송, messages에 기록
- 카카오 광고성 상품 구성이 바뀌는 중이므로 `TODO(확인 필요)`: 친구톡/브랜드 메시지 중 실제 사용 상품

## 8. 규칙 (서버에서 강제)

- 광고성 발송: `marketing` 동의 + 미철회인 대상만. 본문 앞 `(광고)` 자동 삽입, 수신거부 방법 자동 포함. 21:00~08:00에는 `night` 동의자만, 나머지는 08:00 이후로 미룸. `TODO(확인 필요)`: 정보통신망법 세부 요건
- 수신 동의 2년마다 재확인 `TODO(확인 필요)`
- 후기: `consent_confirmed=false`면 공개 불가
- 성적 사례: `consent_file` 없으면 공개 불가
- result_stats: `basis_text` 비어 있으면 공개 불가
- 교습비 수정 시 "교육청 신고 금액과 같은지" 확인 모달, 변경 이력 저장
- 환불 기준 문구는 플랫폼 기본값 제공, `TODO(확인 필요)`: 학원법 시행령 기준과 대조
- 푸터에 학원등록번호·교습과목 노출. `TODO(확인 필요)`: 학원 광고 표시 의무 항목
- 상담 폼: 개인정보 필수 동의와 마케팅·야간 선택 동의를 분리, 기본값 모두 미체크
- 사진: 얼굴 노출 사진은 보호자 동의 체크 후 업로드 (테마 C 갤러리)
- 관리자 목록 연락처 마스킹 (010-****-1234)

## 9. 검색·분석

- 학원별: title/description, Open Graph, `EducationalOrganization`/`LocalBusiness` JSON-LD (이름, 주소, 전화, 운영 시간), sitemap.xml, robots.txt, 네이버 사이트 인증 메타 입력칸
- 소식 상세는 이미지 속 글자에 의존하지 않도록 요약 필드를 본문 텍스트로 출력
- A-08에 네이버 플레이스 정보 불일치 경고 (1차: 원장이 플레이스 값을 입력해 수동 비교. 자동 수집은 후순위)
- GA4: 학원별 측정 ID, `generate_lead` 이벤트, 상담 신청 버튼 클릭 이벤트
- A-09 AI 검색 점검: 1차는 운영자 수동 입력(질문, 엔진별 언급 여부, 인용 출처)

## 10. 첫등원 서비스 사이트 (F-01~06)

- 무료 진단: 학원명·지역·과목·연락처·현재 URL → diagnostic_requests. 결과는 운영자가 수동 작성 후 카톡 발송
- **베타 운영 (현재 정책)**: 3개월 무료, 모집 인원 제한 없음, 성장 플랜 전체 기능 제공
  - 3개월은 학원 홈페이지 **오픈일**부터 계산한다 (`tenants.beta_started_at`, `beta_ends_at`)
  - 자동 결제 없음, 카드 정보 받지 않음. 종료 [2주] 전 운영자에게 알림 → 원장에게 연락
  - 종료 후 미전환 시 [30]일 유지 후 비공개 전환, 상담 기록·콘텐츠 내보내기 제공, 도메인은 학원 명의
  - 베타 한도: 카톡 월 [300]건, 콘텐츠 대행 월 [1]회. 한도 도달 시 운영자 알림 (발송 차단 여부 `TODO(확인 필요)`)
  - 신청 순서대로 제작: applications에 `queue_order`, `expected_start_date`
- 신청(F-06): 학원 정보, 자료 업로드(신청 후 [2주] 안 제출 가능), 필수 동의 4종(약관, 개인정보, 베타 참여 조건, 익명 사례 공개)
- 정식 요금(기본/성장)과 베타 참여자 할인율은 플랫폼 관리자에서 수정 가능한 값으로
- 데모: 데모 테넌트(가상 학원 3개, 테마별 1개)를 시드 데이터로 만들고 실제 카톡 발송은 막는다

## 11. 미결정 사항

- 정식 요금, 베타 참여자 할인율, 약정·위약 조건
- 같은 동네·같은 과목 학원의 동시 베타 참여 허용 여부
- 무료 진단 시 시안 제공 여부 (운영 부담)
- 카카오 발송 대행사, 광고성 메시지 상품
- 기본 도메인 (`{slug}.[도메인]`)
- 플랫폼 관리자 화면 디자인
