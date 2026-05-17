# MarketerOps.ai — 프로젝트 전체 문서

> 최종 업데이트: 2026-05-16

---

## 목차

1. [제품 개요](#1-제품-개요)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [기술 스택 상세](#3-기술-스택-상세)
4. [기능 목록 & 구조](#4-기능-목록--구조)
5. [데이터베이스 스키마](#5-데이터베이스-스키마)
6. [API 엔드포인트 목록](#6-api-엔드포인트-목록)
7. [외부 서비스 연동 목록](#7-외부-서비스-연동-목록)
8. [인증 & 권한 구조](#8-인증--권한-구조)
9. [AI 처리 구조](#9-ai-처리-구조)
10. [배포 & 인프라](#10-배포--인프라)
11. [운영 관리 가이드](#11-운영-관리-가이드)
12. [비용 구조](#12-비용-구조)
13. [개발 이어받기 가이드 (Next Session)](#13-개발-이어받기-가이드)

---

## 1. 제품 개요

**제품명:** MarketerOps.ai  
**슬로건:** "10년차 시니어 마케터의 직관을 누구나 쓸 수 있게."  
**타깃:** 스타트업 마케터, 인하우스 1인 마케터, SEO 에이전시 주니어  
**수익 모델:** Google AdSense (디스플레이 광고) — 무료 사용자 전원 대상  
**차별점:** GEO(AI 검색 최적화) 진단을 제공하는 국내 최초 SaaS

### 핵심 기능 요약

| 모듈 | 설명 |
|------|------|
| **Engine Diagnosis** | PageSpeed + HTML 파싱 기반 Performance·SEO·Accessibility·GEO 점수 |
| **AI Advisor** | Gemini AI 기반 즉시/중기/GEO 전략 리포트 자동 생성 |
| **Content Orchestrator** | 키워드·톤 입력 → 블로그·SNS·뉴스레터·광고카피 일괄 생성 |
| **Keyword Analysis** | 검색 의도·경쟁도·월 검색량·연관 키워드·SEO 제목 분석 |
| **GA4 Integration** | OAuth 연동 → AI 분석 트렌드·상위 페이지·기간 비교 |
| **GSC Integration** | Google Search Console OAuth 연동 → 검색 성과 조회 |
| **Work Management** | 프로젝트·태스크·칸반보드·팀원 관리 |
| **Blog CMS** | Markdown 블로그 생성·편집·GitHub 자동 게시 |
| **Site Editor** | HTML/CSS 파일 직접 편집 + GitHub 커밋 |
| **Share of Voice** | AI 검색 점유율(SOV) 분석 |
| **AI PM** | 매주 월요일 팀 주간 요약 → Slack/알림 자동 발송 |

---

## 2. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                      사용자 (브라우저)                         │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼───────────────────────────────────┐
│                     Vercel (Edge Network)                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Next.js 16 App Router                   │    │
│  │                                                      │    │
│  │  middleware.ts ──── 국가 기반 리다이렉트 (JP/EN/KR)   │    │
│  │                                                      │    │
│  │  Pages (RSC)          API Routes (Node.js)           │    │
│  │  ├── /                ├── /api/analyze               │    │
│  │  ├── /app (보호)       ├── /api/ga4/*                │    │
│  │  ├── /work (보호)      ├── /api/gsc/*                │    │
│  │  ├── /blog/*          ├── /api/work/*                │    │
│  │  └── /auth/signin     └── /api/cron/*               │    │
│  └─────────────────────────────────────────────────────┘    │
└──────┬──────────────┬────────────────┬────────────────┬─────┘
       │              │                │                │
┌──────▼──────┐ ┌─────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
│   Neon DB   │ │Vercel Blob │ │  Gemini API │ │ Claude API  │
│ PostgreSQL  │ │(토큰·파일)  │ │  (primary)  │ │  (fallback) │
└─────────────┘ └────────────┘ └─────────────┘ └─────────────┘
       │
┌──────▼──────────────────────────────────────────────────────┐
│              외부 서비스                                       │
│  GA4 API · GSC API · PageSpeed API · Slack · GitHub · AdSense │
└─────────────────────────────────────────────────────────────┘
```

### 데이터 흐름 요약

1. 사용자가 `/app` 또는 `/work` 접근 → NextAuth JWT 검증
2. 컴포넌트에서 API Route 호출 (fetch)
3. API Route에서 외부 API 호출 (Gemini, PageSpeed 등) + Prisma로 DB 읽기/쓰기
4. OAuth 토큰(GA4, GSC)은 Vercel Blob에 암호화 저장
5. 응답을 컴포넌트에서 렌더링, 일부 이력은 localStorage에 캐시

---

## 3. 기술 스택 상세

### Frontend
| 항목 | 버전 | 설명 |
|------|------|------|
| Next.js | 16.2.6 | App Router, SSR, API Routes 통합 |
| React | 19.2.4 | Server Components + Client Components |
| TypeScript | 5.x | Strict 모드 |
| Tailwind CSS | 4.x | PostCSS 플러그인 방식 (`@tailwindcss/postcss`) |
| Recharts | 3.8.x | 차트 (레이더·라인·바) |
| lucide-react | 1.14.x | 아이콘 |
| react-markdown | 10.x | 마크다운 렌더링 |

### Backend
| 항목 | 버전 | 설명 |
|------|------|------|
| Prisma | 7.8.0 | ORM, Neon 어댑터 |
| @neondatabase/serverless | 1.1.0 | Neon PostgreSQL 서버리스 드라이버 |
| @vercel/blob | 2.3.x | 파일·토큰 스토리지 |
| next-auth | 5.0.0-beta.31 | Google OAuth 인증 |
| cheerio | 1.2.x | 서버사이드 HTML 파싱 |
| xlsx | 0.18.x | Excel 임포트/익스포트 |
| @anthropic-ai/sdk | 0.95.x | Claude API 클라이언트 |
| @google/generative-ai | 0.24.x | Gemini API 클라이언트 |
| @google-analytics/data | 5.2.x | GA4 Data API |

### 주요 설계 결정
- **Edge 함수 미사용**: `cheerio`가 Edge 런타임 비호환 → 전체 API Routes를 Node.js(Fluid Compute)로 운영
- **Gemini 우선 + Claude 폴백**: 비용 절감을 위해 Gemini 2.5 Flash 우선, 실패 시 Claude 자동 전환
- **Prisma Singleton**: `lib/prisma.ts`에서 `globalThis` 패턴으로 개발 환경 핫리로드 연결 폭발 방지

---

## 4. 기능 목록 & 구조

### 디렉토리 구조

```
saasclaude/
├── app/
│   ├── page.tsx                    # 랜딩 페이지 (비로그인)
│   ├── layout.tsx                  # 루트 레이아웃
│   ├── app/page.tsx                # 메인 대시보드 (마케팅 도구, 보호)
│   ├── work/page.tsx               # 업무 관리 (보호)
│   ├── auth/signin/page.tsx        # 로그인 페이지
│   ├── blog/                       # 블로그 (공개)
│   │   ├── [lang]/[slug]/page.tsx  # 블로그 개별 글
│   │   └── [lang]/page.tsx         # 블로그 목록
│   ├── en/, ja/                    # 영어·일본어 랜딩 페이지
│   └── privacy/                    # 개인정보처리방침
│
├── components/
│   ├── DiagnosisModule.tsx         # 사이트 진단
│   ├── GA4Module.tsx               # GA4 통합 (57KB)
│   ├── GSCModule.tsx               # Search Console 통합
│   ├── MarketingInsightModule.tsx  # AI 인사이트 (76KB)
│   ├── ContentHubModule.tsx        # 콘텐츠 허브
│   ├── UnifiedContentModule.tsx    # 멀티채널 콘텐츠 생성
│   ├── KeywordModule.tsx           # 키워드 분석
│   ├── BlogAdminModule.tsx         # 블로그 CMS
│   ├── SiteEditorModule.tsx        # HTML/CSS 에디터
│   ├── SovModule.tsx               # SOV 분석
│   ├── CompetitorModule.tsx        # 경쟁사 분석
│   ├── RewriterModule.tsx          # 콘텐츠 리라이터
│   ├── DashboardModule.tsx         # 진단 이력 대시보드
│   ├── ChatWidget.tsx              # 채팅 위젯
│   ├── CommandPalette.tsx          # 명령어 팔레트
│   ├── NotificationPanel.tsx       # 알림 패널
│   ├── OnboardingModal.tsx         # 첫 사용자 온보딩
│   ├── ProductSwitcher.tsx         # 마케팅↔업무 전환
│   ├── SidebarLayout.tsx           # 사이드바 레이아웃
│   ├── AdUnit.tsx                  # 광고 컴포넌트
│   ├── AuthProvider.tsx            # 세션 프로바이더
│   ├── DarkModeProvider.tsx        # 다크모드
│   └── work/
│       ├── WorkKanbanTab.tsx       # 칸반 보드 (82KB)
│       ├── WorkProjectsTab.tsx     # 프로젝트 관리
│       ├── WorkMyTasksTab.tsx      # 내 태스크
│       ├── WorkOpsTab.tsx          # 운영 현황
│       └── WorkTeamTab.tsx         # 팀 관리
│
├── lib/
│   ├── ai.ts                       # AI 이중 프로바이더 (Gemini + Claude)
│   ├── prisma.ts                   # Prisma 싱글턴
│   ├── ga4-tokens.ts               # GA4 OAuth 토큰 관리
│   ├── gsc-tokens.ts               # GSC OAuth 토큰 관리
│   ├── storage.ts                  # localStorage 헬퍼
│   └── diff.ts                     # LCS diff 알고리즘
│
├── prisma/
│   └── schema.prisma               # DB 스키마
│
├── auth.ts                         # NextAuth 설정
├── middleware.ts                   # 국가별 리다이렉트
├── vercel.json                     # Cron 스케줄 설정
└── master_plan.md                  # 제품 로드맵
```

---

## 5. 데이터베이스 스키마

**DB:** Neon PostgreSQL (서버리스)  
**ORM:** Prisma 7.8  
**연결:** `@prisma/adapter-neon` (HTTP over WebSocket)

### 모델 관계도

```
WorkUser ─────┬──── ProjectMember ──── Project ──── Task ──── SubTask
              │                                         │
              ├──── Task (assignee)                     ├──── Comment
              ├──── Task (creator)                      ├──── TaskLabel ──── Label
              ├──── Comment                             └──── SubTask
              ├──── SubTask (assignee)
              └──── Notification
```

### 테이블 상세

#### WorkUser
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| email | String (unique) | 이메일 |
| name | String? | 이름 |
| avatarUrl | String? | 프로필 이미지 URL |
| jobTitle | String? | 직함 |
| responsibilities | String? | 담당 업무 |
| workStyle | String? | 업무 스타일 |

#### Project
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| name | String | 프로젝트명 |
| color | String | 색상 (#HEX) |
| status | String | active / archived |
| startDate, dueDate | DateTime? | 기간 |
| isOngoing | Boolean | 상시 운영 여부 |

#### Task (핵심 모델)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| status | String | 기획/디자인/개발/완료 등 |
| priority | String | 낮음/보통/높음/긴급 |
| isKeyTask | Boolean | 핵심 태스크 여부 |
| category | String | 업무 카테고리 |
| taskType | String | 태스크 유형 |
| planningStatus ~ devDueDate | String/DateTime | 4단계별 진행 상태+날짜 |

> **4단계 파이프라인:** planning → design → publish → dev (각 단계별 status + start/due date)

---

## 6. API 엔드포인트 목록

### 인증
| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/auth/[...nextauth]` | ALL | NextAuth 핸들러 |

### 사이트 분석
| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/analyze` | POST | PageSpeed + HTML 파싱 진단 |
| `/api/advice` | POST | AI 전략 어드바이스 생성 |
| `/api/geo` | POST | GEO 점수 분석 |

### 콘텐츠
| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/content` | POST | 멀티채널 콘텐츠 생성 |
| `/api/rewrite` | POST | 콘텐츠 리라이팅 |
| `/api/compare` | POST | 콘텐츠 비교 |

### 키워드
| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/keyword` | POST | 키워드 분석 |
| `/api/keyword/cluster` | POST | 키워드 클러스터링 |

### 블로그
| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/blog/posts` | GET/POST | 블로그 글 목록/생성 |
| `/api/blog/posts/[slug]` | GET/PUT/DELETE | 개별 글 CRUD |
| `/api/blog/generate` | POST | AI 블로그 글 생성 |
| `/api/blog/schedule` | POST | 예약 발행 |

### GA4
| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/ga4/connect` | GET | OAuth 시작 |
| `/api/ga4/callback` | GET | OAuth 콜백 |
| `/api/ga4/status` | GET | 연결 상태 확인 |
| `/api/ga4/disconnect` | POST | 연결 해제 |
| `/api/ga4/data` | POST | 분석 데이터 조회 |
| `/api/ga4/pages` | POST | 상위 페이지 조회 |
| `/api/ga4/analyze` | POST | AI 트렌드 분석 |
| `/api/ga4/compare` | POST | 기간 비교 |

### GSC
| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/gsc/connect` | GET | OAuth 시작 |
| `/api/gsc/callback` | GET | OAuth 콜백 |
| `/api/gsc/status` | GET | 연결 상태 확인 |
| `/api/gsc/disconnect` | POST | 연결 해제 |
| `/api/gsc/data` | POST | 검색 데이터 조회 |

### 업무 관리
| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/work/projects` | GET/POST/PUT/DELETE | 프로젝트 CRUD |
| `/api/work/tasks` | GET/POST/PUT/DELETE | 태스크 CRUD |
| `/api/work/subtasks` | GET/POST/PUT/DELETE | 서브태스크 CRUD |
| `/api/work/members` | GET/POST/PUT/DELETE | 팀원 관리 |
| `/api/work/ai-pm` | POST | AI PM 분석 실행 |
| `/api/work/excel` | GET | Excel 내보내기 |
| `/api/work/import-ops` | POST | 운영 데이터 임포트 |

### 에디터
| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/editor/files` | GET | 파일 목록 (GitHub API) |
| `/api/editor/file` | GET/PUT | 파일 읽기/수정 |
| `/api/editor/generate` | POST | AI 코드 생성 |
| `/api/editor/commit` | POST | GitHub 커밋 |

### 기타
| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/notifications` | GET/PUT | 알림 목록/읽음 처리 |
| `/api/slack/notify` | POST | Slack 메시지 전송 |
| `/api/chat` | POST | 채팅 위젯 응답 |
| `/api/sov` | POST | SOV 분석 |
| `/api/sov/prompts` | GET/POST/DELETE | SOV 커스텀 프롬프트 |
| `/api/llmstxt` | GET/POST | LLMs.txt 관리 |

### Cron 작업
| 엔드포인트 | 스케줄 | 설명 |
|-----------|--------|------|
| `/api/cron/weekly-diagnosis` | 매주 월요일 09:00 UTC | 사이트 자동 진단 |
| `/api/blog/cron` | 매일 00:00 UTC | 예약 블로그 발행 |
| `/api/cron/ai-pm` | 매주 월요일 00:00 UTC | AI PM 주간 보고 |

---

## 7. 외부 서비스 연동 목록

| 서비스 | 연동 방식 | 용도 | 환경변수 |
|--------|-----------|------|----------|
| **Google OAuth** | OAuth 2.0 | 로그인 인증 | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| **Google Gemini 2.5 Flash** | REST API | AI 텍스트 생성 (주) | `GEMINI_API_KEY` |
| **Anthropic Claude** | SDK | AI 텍스트 생성 (폴백) | `ANTHROPIC_API_KEY` |
| **Google Analytics 4** | OAuth 2.0 + Data API | 트래픽 분석 | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| **Google Search Console** | OAuth 2.0 + Search API | 검색 성과 조회 | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| **Google PageSpeed Insights** | REST API | 성능 진단 | `PAGESPEED_API_KEY` (선택) |
| **Neon PostgreSQL** | Serverless HTTP | 데이터 저장 | `DATABASE_URL`, `DIRECT_URL` |
| **Vercel Blob** | SDK | 파일·OAuth 토큰 저장 | Vercel 자동 주입 |
| **Google AdSense** | Script + ads.txt | 광고 수익화 | (코드 하드코딩) |
| **Slack** | Webhook | AI PM 알림 | `SLACK_WEBHOOK_URL` |
| **GitHub** | REST API | 블로그/에디터 파일 커밋 | `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH` |
| **Vercel Cron** | vercel.json | 자동화 스케줄러 | `CRON_SECRET` |

### OAuth 토큰 저장 구조 (Vercel Blob)

```
ga4-tokens/
  └── {HMAC-SHA256(email)}.json    # { access_token, refresh_token, expiry }

gsc-tokens/
  └── {HMAC-SHA256(email)}.json    # { access_token, refresh_token, expiry }
```

- 토큰 만료 5분 전에 자동 갱신 (`lib/ga4-tokens.ts`, `lib/gsc-tokens.ts`)
- 이메일을 HMAC-SHA256으로 해시하여 파일명 사용 (직접 노출 방지)

---

## 8. 인증 & 권한 구조

### 인증 흐름

```
사용자 → /auth/signin → Google OAuth → NextAuth JWT → 세션 쿠키
```

### 역할 구분

| 역할 | 조건 | 권한 |
|------|------|------|
| `admin` | `ADMIN_EMAILS` 환경변수에 포함 | 전체 기능 접근 |
| `user` | 그 외 Google 계정 로그인 | 기본 기능 접근 |

### 보호 경로

- `/app/*` — 로그인 필수 (마케팅 도구)
- `/work/*` — 로그인 필수 (업무 관리)
- `/api/cron/*` — `CRON_SECRET` 헤더 검증
- 나머지(`/`, `/blog/*`, `/en`, `/ja`) — 공개

### 국가별 리다이렉트 (middleware.ts)

```
JP → /ja
그 외 비한국 → /en
KR → 기본 (리다이렉트 없음)
```

---

## 9. AI 처리 구조

### 이중 프로바이더 (`lib/ai.ts`)

```
요청
 └─ Gemini 2.5 Flash (우선)
      ├─ 성공 → 응답 반환
      └─ 실패 → Claude Sonnet 4.6 (폴백)
                  ├─ 성공 → 응답 반환 (fallback: true)
                  └─ 실패 → 에러 throw
```

### 주요 함수

| 함수 | 설명 |
|------|------|
| `generateText(prompt)` | 단일 프롬프트 → 텍스트 |
| `generateChat(messages, systemPrompt)` | 멀티턴 대화 |
| 반환값 | `{ text, usage: { inputTokens, outputTokens, latency, fallback } }` |

### `FORCE_CLAUDE` 환경변수

- `FORCE_CLAUDE=true` 설정 시 Gemini 건너뛰고 Claude 직접 사용 (테스트용)

---

## 10. 배포 & 인프라

### 배포 파이프라인

```
GitHub main 브랜치 push
    └─ Vercel 자동 배포 (build: prisma db push && next build)
          ├─ Production: 커스텀 도메인
          └─ Preview: PR별 자동 Preview URL
```

### 빌드 명령

```bash
prisma db push && next build
```

> `prisma db push`: 스키마 변경 사항을 DB에 적용 (마이그레이션 파일 없이 즉시 반영)  
> 주의: `db push`는 데이터 손실 가능성 있음 → 프로덕션에서는 `prisma migrate deploy` 권장

### Vercel 환경변수 목록 (전체)

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `DATABASE_URL` | ✅ | Neon 연결 풀링 URL |
| `DIRECT_URL` | ✅ | Neon 직접 연결 URL (마이그레이션용) |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth 클라이언트 시크릿 |
| `NEXTAUTH_SECRET` | ✅ | JWT 서명 시크릿 (랜덤 32자) |
| `ADMIN_EMAILS` | ✅ | 관리자 이메일 (쉼표 구분) |
| `GEMINI_API_KEY` | ✅ | Google Gemini API 키 |
| `ANTHROPIC_API_KEY` | ✅ | Claude API 키 (폴백) |
| `PAGESPEED_API_KEY` | 선택 | PageSpeed API 키 (없으면 비인증 요청) |
| `CRON_SECRET` | ✅ | Cron 작업 인증 키 |
| `CRON_WATCH_URLS` | 선택 | 자동 진단 대상 URL 목록 |
| `SLACK_WEBHOOK_URL` | 선택 | Slack 알림 웹훅 |
| `GITHUB_TOKEN` | 선택 | GitHub API 토큰 (Site Editor용) |
| `GITHUB_OWNER` | 선택 | GitHub 소유자명 |
| `GITHUB_REPO` | 선택 | GitHub 저장소명 |
| `GITHUB_BRANCH` | 선택 | 기본 브랜치명 |
| `NEXT_PUBLIC_APP_URL` | 선택 | 앱 퍼블릭 URL |
| `FORCE_CLAUDE` | 선택 | `true` 시 Claude 강제 사용 |

---

## 11. 운영 관리 가이드

### 일상 운영 체크리스트

**매주 월요일 자동 실행:**
- `/api/cron/weekly-diagnosis` — 등록된 URL 자동 진단 (09:00 UTC)
- `/api/cron/ai-pm` — 팀 AI PM 주간 보고 생성 → Slack 전송 (00:00 UTC)
- `/api/blog/cron` — 예약된 블로그 글 발행 (00:00 UTC)

### DB 관리

```bash
# 스키마 변경 후 프로덕션 반영
npx prisma migrate dev --name "변경내용설명"  # 로컬: 마이그레이션 파일 생성
npx prisma migrate deploy                      # 프로덕션 적용

# 즉시 적용 (위험, 데이터 손실 가능)
npx prisma db push

# DB 상태 확인
npx prisma studio  # 로컬 DB GUI 브라우저
```

### Vercel Blob 관리

- Vercel Dashboard → Storage → Blob에서 파일 직접 확인 가능
- `ga4-tokens/`, `gsc-tokens/` 디렉토리에 사용자별 OAuth 토큰 저장
- 토큰 파일명 = HMAC-SHA256(사용자 이메일)

### 로그 확인

```bash
# Vercel 함수 로그 (CLI)
vercel logs --follow

# Vercel Dashboard → Functions 탭에서 실시간 로그 확인
```

### 장애 대응

| 증상 | 원인 | 해결 |
|------|------|------|
| AI 응답 없음 | Gemini + Claude 동시 실패 | API 키 확인, 사용량 한도 확인 |
| DB 연결 오류 | Neon 슬립 모드 (무료 플랜) | Neon 대시보드에서 인스턴스 깨우기 |
| GA4/GSC 연동 실패 | OAuth 토큰 만료/오염 | Vercel Blob에서 해당 토큰 파일 삭제 |
| Cron 미실행 | `CRON_SECRET` 불일치 | Vercel 환경변수 확인 |
| AdSense 광고 미표시 | ads.txt 미설정 또는 승인 대기 | public/ads.txt 확인, AdSense 대시보드 확인 |

---

## 12. 비용 구조

### 주요 서비스 비용

| 서비스 | 플랜 | 월 비용 | 한도/참고 |
|--------|------|---------|-----------|
| **Vercel** | **Pro** (현재) | **$20** | $20 included credit 포함, 초과분 On-Demand |
| **Neon PostgreSQL** | Free (현재) | $0 | 0.5GB, 자동 슬립 (트래픽 증가 시 $19 Launch 고려) |
| **Vercel Blob** | Pro 포함 | (크레딧에 포함) | Blob Operations 사용량 기반, 별도 청구 없음 |
| **Google Gemini** | Pay-as-you-go | ~$1 미만 | 2.5 Flash, 현 트래픽 기준 추정 |
| **Anthropic Claude** | Pay-as-you-go | ~$0 | Sonnet 4.6, 폴백만 사용 시 거의 $0 |
| **Google APIs** | 무료 할당량 | $0 | PageSpeed: 25,000회/일 무료 |
| **GitHub** | Free | $0 | 공개 저장소 무제한 |
| **합계** | | **~$21/월** | Vercel Pro 고정 + AI API 변동 |

### 실제 Vercel Pro 사용 현황 (2026-05 기준)

| 항목 | 월 사용액 |
|------|----------|
| Function Invocations | $0.60 |
| Fluid Provisioned Memory | $0.03 |
| Observability Events | $0.02 |
| Blob Advanced Operations | $0.01 |
| Fluid Active CPU | $0.01 |
| **합계** | **~$0.68 / $20 크레딧** |

> On-Demand Charges: $0 → 현재 트래픽 수준에서 $20 크레딧 내 충분히 여유 있음

### 비용 최적화 포인트

1. **Gemini 우선 사용**: Claude 대비 40배 저렴 (0.075 vs $3/1M 토큰)
2. **PageSpeed API**: 비인증 요청 시 낮은 할당량 → `PAGESPEED_API_KEY` 설정 권장
3. **Neon 슬립 모드**: 무료 플랜은 5분 비활성 후 슬립 → 첫 요청 2-3초 지연 발생
4. **Function Invocations**: 현재 비용의 88%를 차지 → 트래픽 급증 시 가장 먼저 모니터링

### 수익 구조 (AdSense 예측)

| MAU | 세션당 PV | 예상 CPM | 월 수익 |
|-----|-----------|----------|---------|
| 1,000 | 4 | ₩1,500 | ~₩6,000 |
| 10,000 | 4 | ₩1,500 | ~₩60,000 |
| 100,000 | 4 | ₩2,000 | ~₩800,000 |

---

## 13. 개발 이어받기 가이드

### 로컬 개발 환경 세팅

```bash
# 1. 저장소 클론
git clone https://github.com/redshine0419-star/saasclaude
cd saasclaude

# 2. 의존성 설치 (postinstall에서 prisma generate 자동 실행)
npm install

# 3. 환경변수 설정
cp .env.local.example .env.local  # 없으면 직접 생성
# .env에 DATABASE_URL, DIRECT_URL 설정 (Neon 대시보드에서 확인)
# .env.local에 나머지 API 키 설정

# 4. 개발 서버 실행
npm run dev  # http://localhost:3000
```

### 필수 파악 파일 우선순위

1. `prisma/schema.prisma` — 데이터 구조 전체
2. `auth.ts` — 인증 로직
3. `middleware.ts` — 라우팅 규칙
4. `lib/ai.ts` — AI 호출 방식
5. `vercel.json` — Cron 스케줄
6. `app/app/page.tsx` — 메인 앱 진입점
7. `app/work/page.tsx` — 업무 관리 진입점

### 코딩 컨벤션

- **컴포넌트**: `components/` 최상위 — 모듈 단위로 큰 파일 (`*Module.tsx`)
- **API Routes**: `app/api/` — 각 기능별 디렉토리
- **DB 접근**: 항상 `import { prisma } from '@/lib/prisma'` 사용
- **AI 호출**: 항상 `import { generateText } from '@/lib/ai'` 사용 (직접 SDK 호출 금지)
- **타입**: `types/` 디렉토리에 공유 타입 정의
- **경로 alias**: `@/` = 프로젝트 루트

### 브랜치 전략

- `main` — 프로덕션 자동 배포
- `claude/explain-repository-CD82c` — 현재 작업 브랜치
- PR 생성 시 Vercel Preview URL 자동 생성

### 주의사항 (Next.js 16 특이사항)

`AGENTS.md`에 명시된 대로 이 프로젝트는 **Next.js 16** 을 사용하며,
일반적인 Next.js 14/15와 API가 다를 수 있습니다.
코드 작성 전 반드시 `node_modules/next/dist/docs/` 확인 권장.

### 현재 알려진 TODO / 로드맵

`master_plan.md` 참고:
- Phase 2: Clerk 기반 회원가입 (현재 Google OAuth만)
- Phase 2: PDF/Markdown 리포트 내보내기
- Phase 2: 경쟁사 벤치마크 강화
- Phase 3: AdSense 수익 최적화

---

*이 문서는 `/home/user/saasclaude/docs/PROJECT_OVERVIEW.md` 에 저장되어 있습니다.*
