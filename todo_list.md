# MarketerOps.ai — Todo List

Last updated: 2026-05-10

---

## 완료된 작업 (Done)

### 인프라 & 기반
- [x] Next.js 16 App Router 프로젝트 초기화
- [x] Tailwind CSS v4 + TypeScript 설정
- [x] Vercel 배포 연결 (GitHub main 자동 배포)
- [x] 환경변수 설정 (`GEMINI_API_KEY`, `PAGESPEED_API_KEY`)
- [x] `lib/storage.ts` — localStorage 기반 진단 이력·통계 유틸리티

### Engine Diagnosis 탭
- [x] `app/api/analyze/route.ts` — PageSpeed Insights API v5 연동 (모바일·데스크탑 병렬 호출)
- [x] `app/api/geo/route.ts` — HTML 파싱 기반 GEO 가시성 분석 (llms.txt, JSON-LD, robots.txt, meta tags, headings, images alt)
- [x] `app/api/advice/route.ts` — Gemini 2.5 Flash 기반 AI 시니어 마케터 종합 진단 리포트
- [x] `components/DiagnosisModule.tsx` — 4개 점수 링, Core Web Vitals, GEO 체크리스트, AI 어드바이저, 즉각 개선 패치 카드
- [x] 진단 완료 시 localStorage에 이력 저장

### Content Orchestrator 탭
- [x] `app/api/content/route.ts` — Gemini 2.5 Flash 기반 콘텐츠 일괄 생성
- [x] `components/ContentHubModule.tsx` — 블로그 제목·개요·SNS 카피·CTA 생성 UI
- [x] 콘텐츠 생성 시 localStorage 카운터 증가

### Keyword Analysis 탭
- [x] `app/api/keyword/route.ts` — Gemini 2.5 Flash 기반 키워드 분석 (의도·경쟁도·검색량·연관KW·롱테일·콘텐츠방향·SEO제목·메타설명)
- [x] `components/KeywordModule.tsx` — 분석 결과 UI (3개 지표 카드, 연관 키워드 칩, 롱테일 리스트, 콘텐츠 방향, SEO 제목)
- [x] 연관·롱테일 키워드 클릭 시 입력창 자동 교체

### Ops Dashboard 탭
- [x] `components/DashboardModule.tsx` — 실제 localStorage 데이터 기반 대시보드
- [x] 4개 통계 카드 (총 진단 횟수, 콘텐츠 생성, 최고 SEO·GEO 점수)
- [x] AreaChart — 최근 7일 Performance·SEO 점수 추이
- [x] RadarChart — 최근 진단 종합 (Performance·SEO·Accessibility·GEO)
- [x] 최근 진단 기록 리스트 (최대 8개, 색상 코딩 점수 뱃지)
- [x] 데이터 없을 때 빈 상태 안내 화면

### 네비게이션
- [x] 사이드바 (데스크탑) + 하단 탭바 (모바일) 반응형 레이아웃
- [x] Toast 알림 시스템 (3초 자동 소멸)
- [x] 4개 탭: Engine Diagnosis / Content Orchestrator / Keyword Analysis / Ops Dashboard

### 버그 수정
- [x] Gemini 모델명 오류 수정 (`gemini-1.5-flash` → `gemini-2.5-flash`)
- [x] 중첩 템플릿 리터럴 제거 (MCP push 시 파일 손상 방지) — 모든 프롬프트 문자열 연결로 변경

---

## 진행 중 (In Progress)

- [ ] 없음

---

## 완료된 작업 — Phase 2 기능 (Done)

---

### 경쟁사 비교 분석 (Competitor Analysis 탭)
- [x] `app/api/compare/route.ts` — Gemini AI 기반 경쟁 격차·기회 분석
- [x] `components/CompetitorModule.tsx` — 내 URL vs 경쟁사 URL 병렬 분석, 점수 비교, GEO 체크리스트 비교, AI 우선순위 액션

### 콘텐츠 리라이터 (Content Rewriter 탭)
- [x] `app/api/rewrite/route.ts` — 목표(SEO/GEO/가독성/간결화)별 Gemini 리라이팅
- [x] `components/RewriterModule.tsx` — 원본·결과 비교 뷰, 변경사항 목록, 복사 기능

### llms.txt 생성기 탭
- [x] `app/api/llmstxt/route.ts` — 회사 정보 입력 → Gemini가 표준 llms.txt 생성
- [x] `components/LlmsTxtModule.tsx` — 폼 입력, 미리보기, 다운로드·복사 기능

### 네비게이션 확장
- [x] `app/page.tsx` — 7탭으로 확장 (경쟁사·리라이터·LLMs 추가)
- [x] 모바일 하단 탭바 가로 스크롤 처리

---

## 예정된 작업 (Backlog)

### Phase 2 — 필수 인프라

- [ ] **사용자 인증** — Clerk 연동 (소셜 로그인, 이메일 회원가입)
- [ ] **클라우드 DB** — Supabase 또는 Neon 연동 (localStorage 대체)
  - 진단 이력 서버 저장
  - 유저별 데이터 분리
- [ ] **프로젝트 관리** — 도메인 단위로 진단 이력 그룹핑

### Phase 2 — 기능 확장

- [ ] **리포트 내보내기** — PDF/Markdown 다운로드 버튼 (jsPDF 또는 서버사이드 렌더링)
- [ ] **경쟁사 벤치마크** — 2개 URL 동시 분석 후 점수 비교 뷰
- [ ] **GEO 개선 가이드** — llms.txt 자동 생성기 (사이트 정보 입력 → 파일 다운로드)
- [ ] **콘텐츠 히스토리** — 생성한 콘텐츠 저장·검색·재편집
- [ ] **키워드 클러스터링** — 여러 키워드 일괄 입력 → 의도별 그룹핑

### Phase 2 — UX 개선

- [ ] **다크 모드** — Tailwind dark: 클래스 적용
- [ ] **온보딩 플로우** — 첫 방문자 대상 3단계 가이드 모달
- [ ] **단축키** — `Cmd+K` 글로벌 검색/진단 실행
- [ ] **모바일 최적화** — 콘텐츠 카드 스와이프 제스처

### Phase 3 — AdSense 수익화

- [ ] **커스텀 도메인 연결** — Vercel에서 도메인 설정 (AdSense 승인 요건)
- [ ] **AdSense 계정 생성 및 신청** — 커스텀 도메인으로 사이트 신청
- [ ] **`public/ads.txt`** — publisher ID 입력 (`google.com, ca-pub-XXXXXX, DIRECT, f08c47fec0942fa0`)
- [ ] **`app/layout.tsx`** — AdSense 스크립트 추가 (`next/script`, strategy="afterInteractive")
- [ ] **`components/AdUnit.tsx`** — 재사용 광고 컴포넌트 (반응형, SSR 안전 처리)
- [ ] **광고 배치 — DiagnosisModule** — AI 어드바이저 섹션 하단
- [ ] **광고 배치 — KeywordModule** — 콘텐츠 방향 카드와 SEO 제목 사이
- [ ] **광고 배치 — ContentHubModule** — 생성된 콘텐츠 하단
- [ ] **`app/privacy/page.tsx`** — Privacy Policy 페이지 추가 (AdSense 정책 필수)
- [ ] **Google Search Console 등록** — 도메인 인증 + 색인 요청
- [ ] **AdSense 승인 확인** — 심사 기간 약 2~4주
- [ ] **성과 모니터링** — 노출수·CTR·RPM 주간 체크

### Phase 3 — 고도화

- [ ] **Vercel AI Gateway 연동** — 모델 fallback (Gemini → Claude), 비용 모니터링
- [ ] **스케줄 진단** — 주 1회 자동 진단 + 이메일 리포트 (Vercel Cron)
- [ ] **Slack 알림** — 점수 급변 시 웹훅 알림
- [ ] **화이트라벨** — 에이전시용 커스텀 도메인·브랜딩 적용
