# MarketerOps.ai — 세션 인계 문서

> 최종 업데이트: 2026-06-06  
> 작성 목적: 새 세션이 컨텍스트 없이도 이 서비스를 완전히 관리할 수 있도록

---

## 목차

1. [서비스 개요](#1-서비스-개요)
2. [기술 스택 핵심 정리](#2-기술-스택-핵심-정리)
3. [저장소 & 브랜치 전략](#3-저장소--브랜치-전략)
4. [디렉토리 구조 & 핵심 파일](#4-디렉토리-구조--핵심-파일)
5. [주요 모듈별 파일 매핑](#5-주요-모듈별-파일-매핑)
6. [API 라우트 전체 목록](#6-api-라우트-전체-목록)
7. [환경변수 전체 목록](#7-환경변수-전체-목록)
8. [코딩 패턴 & 규칙](#8-코딩-패턴--규칙)
9. [배포 프로세스](#9-배포-프로세스)
10. [인증 구조](#10-인증-구조)
11. [AI 처리 구조](#11-ai-처리-구조)
12. [블로그 시스템 구조](#12-블로그-시스템-구조)
13. [GA4 / GSC 연동 구조](#13-ga4--gsc-연동-구조)
14. [업무 관리 시스템](#14-업무-관리-시스템)
15. [Cron 자동화](#15-cron-자동화)
16. [알려진 제약 & 의도적 설계 결정](#16-알려진-제약--의도적-설계-결정)
17. [최근 변경사항 (이 세션)](#17-최근-변경사항-이-세션)
18. [자주 발생하는 문제 & 해결법](#18-자주-발생하는-문제--해결법)

---

## 1. 서비스 개요

- **서비스명**: MarketerOps.ai (도메인: GrowWeb.me)
- **슬로건**: "10년차 시니어 마케터의 직관을 누구나 쓸 수 있게."
- **타깃**: 스타트업 마케터, 인하우스 1인 마케터, SEO 에이전시 주니어
- **수익 모델**: Google AdSense (무료 사용자 전원 대상)
- **주요 언어**: 한국어(기본), 영어, 일본어 지원
- **관리자 이메일**: `redshine0419@gmail.com` (ADMIN_EMAILS 환경변수로 관리)

### 핵심 기능 목록

| 탭/모듈 | 설명 | 파일 |
|---------|------|------|
| Engine Diagnosis | PageSpeed + HTML 파싱, Performance/SEO/Accessibility/GEO 점수 | `DiagnosisModule.tsx` |
| AI Advisor | AI 기반 즉시/중기/GEO 전략 리포트 | `MarketingInsightModule.tsx` |
| Content Orchestrator | 블로그·SNS·뉴스레터·광고카피 일괄 생성 | `UnifiedContentModule.tsx` |
| Keyword Analysis | 검색 의도·경쟁도·월 검색량·SEO 제목 | `KeywordModule.tsx` |
| GA4 Integration | OAuth 연동 + AI 트렌드 분석 | `GA4Module.tsx` |
| GSC Integration | Google Search Console OAuth 연동 | `GSCModule.tsx` |
| Work Management | 프로젝트·태스크·칸반보드 (DB 연동) | `components/work/` |
| Blog CMS | AI 블로그 생성·편집·Vercel Blob 게시 | `BlogAdminModule.tsx` |
| Site Editor | HTML/CSS 파일 직접 편집 + GitHub 커밋 | `SiteEditorModule.tsx` |
| Share of Voice | AI 검색 점유율 분석 | `SovModule.tsx` |

---

## 2. 기술 스택 핵심 정리

```
Next.js    16.2.6   — App Router (v14/15와 API 다름! node_modules/next/dist/docs/ 반드시 확인)
React      19.2.4   — Server Components + Client Components
TypeScript 5.x      — Strict 모드
Tailwind   4.x      — PostCSS 플러그인 방식 (@tailwindcss/postcss)
Prisma     7.8.0    — ORM, Neon 어댑터 (@prisma/adapter-neon)
Neon       1.1.0    — PostgreSQL 서버리스 드라이버
Vercel Blob 2.3.x  — 파일·토큰 스토리지
next-auth  5.0.0-beta.31 — Google OAuth, JWT 세션
Recharts   3.8.x   — 차트 컴포넌트
lucide-react 1.14.x — 아이콘
@anthropic-ai/sdk 0.95.x — Claude API
@google/generative-ai 0.24.x — Gemini API
@google-analytics/data 5.2.x — GA4 Data API
```

**중요 결정사항:**
- Edge 함수 미사용 (`cheerio`가 Edge 런타임 비호환) → 전체 API Routes를 Node.js (Fluid Compute)로 운영
- Gemini 2.5 Flash 우선 + Claude Sonnet 4.6 폴백 (비용 절감)
- Prisma singleton: `lib/prisma.ts`의 `globalThis` 패턴 (핫리로드 연결 폭발 방지)

---

## 3. 저장소 & 브랜치 전략

```
GitHub 저장소: redshine0419-star/saasclaude
현재 작업 브랜치: claude/explain-repository-CD82c
프로덕션 브랜치: main (Vercel 자동 배포)
```

### 브랜치 규칙

- **절대로 main에 직접 push하지 말 것** — Vercel 프로덕션 자동 배포 트리거
- 모든 작업은 `claude/explain-repository-CD82c` 브랜치에서
- PR 생성 시 Vercel Preview URL 자동 생성

### Git push 명령

```bash
git push -u origin claude/explain-repository-CD82c
```

---

## 4. 디렉토리 구조 & 핵심 파일

```
saasclaude/
├── app/
│   ├── page.tsx                    # 랜딩 페이지 (비로그인, 한국어)
│   ├── layout.tsx                  # 루트 레이아웃 (AdSense 스크립트 포함)
│   ├── app/page.tsx                # 메인 대시보드 (마케팅 도구, 로그인 필수)
│   ├── work/page.tsx               # 업무 관리 (로그인 필수, /app으로 redirect)
│   ├── auth/signin/page.tsx        # 로그인 페이지
│   ├── blog/
│   │   ├── [lang]/page.tsx         # 블로그 목록 (ko/en/ja)
│   │   └── [lang]/[slug]/page.tsx  # 블로그 개별 글
│   ├── en/page.tsx, ja/page.tsx    # 영어·일본어 랜딩 페이지
│   ├── privacy/page.tsx            # 개인정보처리방침
│   ├── api/                        # API 라우트 (아래 섹션 참조)
│   ├── icon.svg                    # 파비콘 (검정 배경 + 흰색 번개)
│   └── sitemap.xml/route.ts        # 동적 사이트맵
│
├── components/
│   ├── [기능]Module.tsx             # 각 기능 모듈 (대형 단일 파일 패턴)
│   ├── blog/BlogTagFilter.tsx       # 블로그 태그 필터 (Client Component)
│   ├── work/                        # 업무 관리 탭들
│   └── ...
│
├── lib/
│   ├── ai.ts                       # ★ AI 이중 프로바이더 (반드시 이것만 사용)
│   ├── prisma.ts                   # ★ Prisma 싱글턴 (반드시 이것만 사용)
│   ├── blog-utils.ts               # ★ 블로그 공유 유틸리티 (BlogPost/PostIndex 타입 포함)
│   ├── ga4-tokens.ts               # GA4 OAuth 토큰 관리
│   ├── gsc-tokens.ts               # GSC OAuth 토큰 관리
│   ├── storage.ts                  # localStorage 헬퍼
│   └── diff.ts                     # LCS diff 알고리즘
│
├── prisma/schema.prisma            # DB 스키마 전체
├── auth.ts                         # NextAuth 설정
├── middleware.ts                   # 국가별 리다이렉트 (JP→/ja, 비KR→/en)
├── next.config.ts                  # Next.js 설정 (Unsplash 이미지 도메인 포함)
├── vercel.json                     # Cron 스케줄 설정
├── docs/
│   ├── PROJECT_OVERVIEW.md         # 전체 프로젝트 문서 (상세)
│   ├── work-management-spec.md     # 업무 관리 시스템 상세 명세
│   └── session-handoff.md          # 이 파일
└── master_plan.md                  # 제품 로드맵
```

---

## 5. 주요 모듈별 파일 매핑

| 기능 | 프론트엔드 컴포넌트 | 백엔드 API 라우트 |
|------|-------------------|-----------------|
| 사이트 진단 | `DiagnosisModule.tsx` | `/api/analyze`, `/api/advice`, `/api/geo` |
| AI 마케팅 인사이트 (GA4+GSC 통합) | `MarketingInsightModule.tsx` | `/api/ga4/analyze` |
| 콘텐츠 생성 | `UnifiedContentModule.tsx` | `/api/content` |
| 키워드 분석 | `KeywordModule.tsx` | `/api/keyword`, `/api/keyword/cluster` |
| GA4 연동 | `GA4Module.tsx` | `/api/ga4/*` |
| GSC 연동 | `GSCModule.tsx` | `/api/gsc/*` |
| 블로그 CMS | `BlogAdminModule.tsx` | `/api/blog/*` |
| 사이트 에디터 | `SiteEditorModule.tsx` | `/api/editor/*` |
| SOV 분석 | `SovModule.tsx` | `/api/sov`, `/api/sov/prompts` |
| 업무 관리 | `components/work/*.tsx` | `/api/work/*` |
| 콘텐츠 허브 | `ContentHubModule.tsx` | (복합 — content/keyword/rewrite 조합) |
| 리라이터 | `RewriterModule.tsx` | `/api/rewrite`, `/api/compare` |
| 알림 패널 | `NotificationPanel.tsx` | `/api/notifications` |
| 채팅 위젯 | `ChatWidget.tsx` | `/api/chat` |
| LLMs.txt 관리 | `LlmsTxtModule.tsx` | `/api/llmstxt` |
| 진단 이력 | `DashboardModule.tsx` | (localStorage 기반) |

---

## 6. API 라우트 전체 목록

### 인증 (auth 불필요 — NextAuth 내부 처리)
```
/api/auth/[...nextauth]    ALL    NextAuth 핸들러
```

### 공개 API (auth 불필요 — 무료 SaaS 기능)
```
/api/analyze       POST   PageSpeed + HTML 파싱 진단
/api/advice        POST   AI 전략 어드바이스
/api/geo           POST   GEO 점수 분석
/api/content       POST   멀티채널 콘텐츠 생성
/api/rewrite       POST   콘텐츠 리라이팅
/api/compare       POST   콘텐츠 비교
/api/keyword       POST   키워드 분석
/api/keyword/cluster POST  키워드 클러스터링
/api/chat          POST   채팅 위젯 응답
/api/sov           POST   SOV 분석
/api/sov/prompts   GET/POST/DELETE  SOV 커스텀 프롬프트
/api/og            GET    OG 이미지 생성
```

### 블로그 (공개 읽기 / 관리는 세션 필요)
```
/api/blog/posts            GET/POST       블로그 글 목록/생성
/api/blog/posts/[slug]     GET/PUT/DELETE 개별 글 CRUD
/api/blog/generate         POST           AI 블로그 글 생성 (관리자용)
/api/blog/schedule         POST           예약 발행 등록
/api/blog/cron             GET            cron 실행 (CRON_SECRET 헤더 필요)
```

### GA4 (세션 필요)
```
/api/ga4/connect    GET   OAuth 시작
/api/ga4/callback   GET   OAuth 콜백
/api/ga4/status     GET   연결 상태 확인
/api/ga4/disconnect POST  연결 해제
/api/ga4/data       POST  분석 데이터 조회
/api/ga4/pages      POST  상위 페이지 조회
/api/ga4/analyze    POST  AI 트렌드 분석 (condition 파라미터 지원)
/api/ga4/compare    POST  기간 비교
```

### GSC (세션 필요)
```
/api/gsc/connect    GET   OAuth 시작
/api/gsc/callback   GET   OAuth 콜백
/api/gsc/status     GET   연결 상태 확인
/api/gsc/disconnect POST  연결 해제
/api/gsc/data       POST  검색 데이터 조회
```

### 업무 관리 (세션 필요)
```
/api/work/projects  GET/POST/PUT/DELETE  프로젝트 CRUD
/api/work/tasks     GET/POST/PUT/DELETE  태스크 CRUD
/api/work/subtasks  GET/POST/PUT/DELETE  서브태스크 CRUD
/api/work/members   GET/POST/PUT/DELETE  팀원 관리
/api/work/labels    GET/POST/DELETE      레이블 관리
/api/work/ai-pm     POST                 AI PM 분석 (x-internal-cron 헤더 또는 세션)
/api/work/excel     GET                  Excel 내보내기
/api/work/import-ops POST               운영 데이터 임포트 (OPS_IMPORT_SECRET 필요)
```

### 사이트 에디터 (세션 필요)
```
/api/editor/files     GET       파일 목록 (GitHub API)
/api/editor/file      GET/PUT   파일 읽기/수정
/api/editor/generate  POST      AI 코드 생성
/api/editor/commit    POST      GitHub 커밋
```

### 기타
```
/api/notifications  GET/PUT  알림 목록/읽음 처리
/api/slack/notify   POST     Slack 메시지 전송
/api/llmstxt        GET/POST LLMs.txt 관리
/api/admin/*        (관리자 전용)
```

### Cron 작업 (CRON_SECRET 헤더 필요)
```
/api/cron/weekly-diagnosis   매주 월 09:00 UTC   사이트 자동 진단
/api/blog/cron               매일 00:00 UTC      예약 블로그 발행
/api/cron/ai-pm              매주 월 00:00 UTC   AI PM 주간 보고 → Slack
```

---

## 7. 환경변수 전체 목록

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `DATABASE_URL` | ✅ | Neon 연결 풀링 URL (prisma datasource env("DATABASE_URL")) |
| `DIRECT_URL` | ✅ | Neon 직접 연결 URL (마이그레이션용) |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth 클라이언트 ID (로그인 + GA4 + GSC 공용) |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth 클라이언트 시크릿 |
| `NEXTAUTH_SECRET` | ✅ | JWT 서명 시크릿 (랜덤 32자) — GA4/GSC 토큰 HMAC에도 사용 |
| `ADMIN_EMAILS` | ✅ | 관리자 이메일 (쉼표 구분, e.g. `a@x.com,b@x.com`) |
| `GEMINI_API_KEY` | ✅ | Google Gemini 2.5 Flash API 키 (주 AI 프로바이더) |
| `ANTHROPIC_API_KEY` | ✅ | Claude API 키 (폴백 — 없으면 Gemini 실패 시 에러) |
| `PAGESPEED_API_KEY` | 선택 | PageSpeed Insights API 키 (없으면 비인증, 낮은 할당량) |
| `CRON_SECRET` | ✅ | Cron 작업 인증 키 (`Authorization: Bearer ${CRON_SECRET}`) |
| `CRON_WATCH_URLS` | 선택 | 자동 진단 대상 URL 목록 (쉼표 구분) |
| `SLACK_WEBHOOK_URL` | 선택 | Slack 알림 웹훅 URL |
| `GITHUB_TOKEN` | 선택 | GitHub API 토큰 (Site Editor용) |
| `GITHUB_OWNER` | 선택 | GitHub 소유자명 |
| `GITHUB_REPO` | 선택 | GitHub 저장소명 |
| `GITHUB_BRANCH` | 선택 | 기본 브랜치명 |
| `NEXT_PUBLIC_APP_URL` | 선택 | 앱 퍼블릭 URL (e.g. `https://growweb.me`) |
| `FORCE_CLAUDE` | 선택 | `true` 설정 시 Gemini 건너뛰고 Claude 강제 사용 (테스트용) |
| `OPS_IMPORT_XLSX_PATH` | 선택 | 운영 데이터 임포트용 XLSX 경로 |
| `OPS_IMPORT_SECRET` | 선택 | 운영 임포트 API 시크릿 |

### Vercel Blob 저장 구조

```
ga4-tokens/{HMAC-SHA256(email)}.json   — GA4 OAuth 토큰
gsc-tokens/{HMAC-SHA256(email)}.json   — GSC OAuth 토큰
posts/{lang}/{slug}.json               — 블로그 게시글 (BlogPost 전체)
posts-index-{lang}.json               — 블로그 목록 인덱스 (PostIndex[])
```

---

## 8. 코딩 패턴 & 규칙

### AI 호출 — 반드시 `lib/ai.ts`만 사용

```typescript
import { generateText } from '@/lib/ai';

const { text, usage } = await generateText(prompt);
// usage.provider === 'gemini' | 'claude'
// usage.fallback === true 이면 Claude가 사용됨
```

절대 `@google/generative-ai` 또는 `@anthropic-ai/sdk`를 직접 import하지 말 것.

### DB 접근 — 반드시 `lib/prisma.ts`만 사용

```typescript
import { prisma } from '@/lib/prisma';

const tasks = await prisma.task.findMany({ where: { projectId } });
```

### 세션 인증 패턴 (서버 컴포넌트 / API Route)

```typescript
import { auth } from '@/auth';

// API Route에서
const session = await auth();
if (!session?.user?.email) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
const userEmail = session.user.email;
const isAdmin = (session.user as { role?: string }).role === 'admin';
```

### 블로그 유틸리티 — 반드시 `lib/blog-utils.ts`만 사용

```typescript
import { BlogPost, PostIndex, sanitizeSlug, extractJson, getIndex, saveIndex, fetchUnsplashImage } from '@/lib/blog-utils';
```

`app/api/blog/generate/route.ts`에서는 하위 호환을 위해 타입 re-export도 있음:
```typescript
export type { BlogPost, PostIndex } from '@/lib/blog-utils';
```

### 경로 alias

`@/` = 프로젝트 루트 (`tsconfig.json`에서 설정)

### 컴포넌트 패턴

- 대형 기능 모듈: `components/[Name]Module.tsx` (단일 파일, 수천 줄도 허용)
- Client Component: 파일 상단에 `'use client';`
- Server Component: 기본값 (no directive)

### Tailwind 4 주의사항

- `@tailwind` 지시자 사용 안 함 → `@import "tailwindcss"` 또는 PostCSS 설정
- `tailwind.config.js` 대신 CSS 파일에서 직접 설정
- `dark:` 접두사로 다크모드 지원 (DarkModeProvider 사용)

---

## 9. 배포 프로세스

### 빌드 명령 (Vercel 자동 실행)

```bash
prisma db push && next build
```

- `prisma db push`: 스키마 변경 사항을 DB에 즉시 반영
- **주의**: `db push`는 데이터 손실 위험 있음. 컬럼 삭제 시 `--accept-data-loss` 필요

### 배포 흐름

```
claude/explain-repository-CD82c에 push
    → Vercel Preview 자동 배포 (Preview URL 생성)
    → PR merge → main
    → Vercel Production 자동 배포
```

### 로컬 개발

```bash
npm install          # postinstall에서 prisma generate 자동 실행
npm run dev          # http://localhost:3000
```

### TypeScript 타입 체크 (빌드 전 확인)

```bash
npx tsc --noEmit
```

---

## 10. 인증 구조

### 흐름

```
사용자 → /auth/signin → Google OAuth → NextAuth JWT → 세션 쿠키
```

### 보호 경로

- `/app/*` — 로그인 필수 (마케팅 도구)
- `/work/*` — 로그인 필수 (업무 관리, 실제로는 `/app`으로 redirect)
- 공개: `/`, `/blog/*`, `/en`, `/ja`, `/privacy`

### 역할 구분

```typescript
// auth.ts
const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean);
// jwt callback에서 token.role = 'admin' | 'user' 설정
```

### Cron 인증

```
Authorization: Bearer ${CRON_SECRET}   ← Vercel cron이 자동 전송
```

### AI PM 내부 호출 인증

```
x-internal-cron: ${CRON_SECRET}   ← /api/cron/ai-pm → /api/work/ai-pm 내부 호출 시
```

---

## 11. AI 처리 구조

### 이중 프로바이더 (`lib/ai.ts`)

```
generateText(prompt) 호출
    → FORCE_CLAUDE=true? → Claude 직접
    → Gemini 2.5 Flash 시도
        → 성공: 응답 반환 (fallback: false)
        → 실패: Claude Sonnet 4.6 폴백
            → 성공: 응답 반환 (fallback: true)
            → 실패: 에러 throw
```

### generateChat 패턴

멀티턴 대화는 `generateChat(systemPrompt, messages)`를 사용.
내부적으로 히스토리를 단일 프롬프트 문자열로 합쳐 `generateText`에 전달.

### GA4 AI 분석 조건 (`/api/ga4/analyze`)

`condition` 파라미터를 받아 프롬프트 최상단에 삽입:
```typescript
const conditionBlock = condition
  ? `\n[분석 조건 — 반드시 이 조건을 최우선으로 반영하세요]\n${condition}\n`
  : '';
```

---

## 12. 블로그 시스템 구조

### 저장소: Vercel Blob

- 글 본문: `posts/{lang}/{slug}.json` (`BlogPost` 타입)
- 인덱스: `posts-index-{lang}.json` (`PostIndex[]` 타입)
- 언어: `ko` / `en` / `ja`

### BlogPost 타입 (`lib/blog-utils.ts`)

```typescript
interface BlogPost {
  slug: string;
  lang: 'ko' | 'en' | 'ja';
  title: string;
  metaDescription: string;
  tags: string[];
  faq: { q: string; a: string }[];
  content: string;       // Markdown
  createdAt: string;     // ISO 날짜 문자열
  keyword: string;
  heroImage?: string;    // Unsplash 이미지 URL (stable CDN URL)
}
```

### Unsplash 히어로 이미지

- `fetchUnsplashImage(keyword)` — `source.unsplash.com` redirect 따라가서 stable CDN URL 반환
- 블로그 글 생성(`/api/blog/generate`) 및 Cron 발행(`/api/blog/cron`) 시 자동으로 가져와 `heroImage`에 저장
- 블로그 글 상세 페이지에서 헤더 아래 표시 + "Photo: Unsplash" 크레딧 링크

### 태그 필터

`components/blog/BlogTagFilter.tsx` (Client Component):
- 기본 숨김, 버튼 클릭으로 펼침
- 선택된 태그가 있으면 접힌 상태에서도 선택 태그 + ✕ 표시
- ko/en/ja 다국어 지원

### 블로그 URL 구조

```
/blog/ko          — 한국어 목록
/blog/en          — 영어 목록
/blog/ja          — 일본어 목록
/blog/ko/{slug}   — 개별 글
```

### next.config.ts 이미지 도메인

```typescript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'images.unsplash.com' },
    { protocol: 'https', hostname: 'source.unsplash.com' },
  ],
}
```

---

## 13. GA4 / GSC 연동 구조

### OAuth 토큰 저장

- `lib/ga4-tokens.ts` / `lib/gsc-tokens.ts`
- Vercel Blob에 `{HMAC-SHA256(email)}.json`으로 저장
- HMAC 키: `process.env.NEXTAUTH_SECRET!` (하드코딩 기본값 없음)
- 만료 5분 전 자동 갱신

### GA4 Analyze 요청 body

```typescript
{
  data: {          // GA4Module에서 수집한 전체 데이터
    totals, prevTotals, channels, sourceMediums, prevSourceMediums,
    topPages, landingPages, devices, trend
  },
  siteUrl: string,
  gscData?: object,  // GSC 데이터 (있으면 함께 분석)
  condition?: string  // 분석 조건 (선택) — "오가닉 위주", "모바일 집중" 등
}
```

---

## 14. 업무 관리 시스템

상세 내용: `docs/work-management-spec.md` 참조

### DB 모델 요약

- `WorkUser` — 팀 멤버 (Google OAuth 이메일 기반)
- `Project` — 프로젝트 (color, status, dates)
- `ProjectMember` — 프로젝트-팀원 M:N 조인 테이블
- `Task` — 태스크 (4단계 파이프라인: 기획→디자인→발행→개발)
- `SubTask` — 서브태스크
- `Label` / `TaskLabel` — 태그/레이블
- `Comment` — 태스크 댓글
- `Notification` — 알림

### Task 상태 목록

`기획` / `디자인` / `발행` / `개발` / `완료`

### Task 우선순위

`낮음` / `보통` / `높음` / `긴급`

### 4단계 파이프라인 필드

각 단계별 `{stage}Status`, `{stage}StartDate`, `{stage}DueDate` (planning/design/publish/dev)

---

## 15. Cron 자동화

`vercel.json`에 정의:

```json
{
  "crons": [
    { "path": "/api/cron/weekly-diagnosis", "schedule": "0 9 * * 1" },
    { "path": "/api/blog/cron", "schedule": "0 0 * * *" },
    { "path": "/api/cron/ai-pm", "schedule": "0 0 * * 1" }
  ]
}
```

- Vercel이 자동으로 `Authorization: Bearer ${CRON_SECRET}` 헤더 추가
- 각 API Route에서 헤더 검증:
  ```typescript
  const cronSecret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  ```

---

## 16. 알려진 제약 & 의도적 설계 결정

1. **공개 API 인증 없음**: `/api/analyze`, `/api/content`, `/api/keyword` 등은 의도적으로 인증 불필요 — 무료 SaaS 모델
2. **대형 단일 파일 컴포넌트**: `GA4Module.tsx` (57KB), `MarketingInsightModule.tsx` (76KB), `WorkKanbanTab.tsx` (82KB) — 리팩토링 안 함
3. **Edge 런타임 미사용**: `cheerio` 의존성으로 전체 Node.js 런타임 사용
4. **`prisma db push` 빌드 포함**: 스키마 변경 즉시 반영, 마이그레이션 파일 없음 (프로덕션 주의)
5. **Unsplash Source API**: `source.unsplash.com`은 deprecated될 수 있음 — 대안으로 Unsplash API 키 발급 고려
6. **블로그는 서버리스 (Vercel Blob)**: DB 없이 JSON 파일로 관리 — 수천 개 이상 글 시 인덱스 파일 크기 문제 가능
7. **NextAuth v5 beta**: `next-auth@5.0.0-beta.31` — 정식 출시 전이므로 API 변경 가능성 있음

---

## 17. 최근 변경사항 (이 세션)

최근 커밋 순서 (최신 → 오래된 순):

| 커밋 | 내용 |
|------|------|
| `c80678e` | 블로그 태그 숨김/펼침 + AI 분석 조건 입력 |
| `3adfb33` | 블로그 자동 생성 시 Unsplash 히어로 이미지 자동 삽입 |
| `7847a1e` | generate/route에서 BlogPost 타입 import 누락 수정 |
| `b23e0c5` | Prisma driverAdapters deprecated preview feature 제거 |
| `a4b47bc` | 코드 검수 전체 수정 반영 |
| `aa52196` | 검정 배경 흰색 번개 파비콘 추가 |
| `76fb4a9` | 업무관리 시스템 구현 명세서 추가 |
| `b2a055b` | 트래픽 3종 개선 — 사이트맵·색인핑·블로그 딥링크 |

### 이 세션에서 신규/변경된 주요 파일

- `app/icon.svg` — 파비콘 (신규)
- `lib/blog-utils.ts` — 블로그 공유 유틸리티 (신규)
- `components/blog/BlogTagFilter.tsx` — 태그 필터 토글 (신규)
- `components/UnifiedContentModule.tsx` — 채널 버튼 통일, API 경로 수정
- `components/MarketingInsightModule.tsx` — AI 분석 조건 입력 UI 추가
- `app/api/ga4/analyze/route.ts` — condition 파라미터 처리
- `app/api/blog/generate/route.ts` — blog-utils 사용, Unsplash 이미지 추가
- `app/api/blog/cron/route.ts` — blog-utils 사용, Unsplash 이미지 추가
- `app/api/blog/posts/route.ts` — blog-utils 사용
- `app/blog/[lang]/page.tsx` — BlogTagFilter 사용
- `app/blog/[lang]/[slug]/page.tsx` — heroImage 표시
- `app/sitemap.xml/route.ts` — PostIndex import 경로 수정
- `lib/ga4-tokens.ts` / `lib/gsc-tokens.ts` — 하드코딩 기본값 제거
- `app/api/work/import-ops/route.ts` — 하드코딩 경로/시크릿 제거
- `app/api/cron/ai-pm/route.ts` / `app/api/work/ai-pm/route.ts` — 내부 인증 강화
- `prisma/schema.prisma` — driverAdapters preview feature 제거
- `next.config.ts` — Unsplash 이미지 도메인 추가
- `docs/work-management-spec.md` — 업무 관리 상세 명세 (신규)

---

## 18. 자주 발생하는 문제 & 해결법

| 증상 | 원인 | 해결 |
|------|------|------|
| AI 응답 없음 | Gemini + Claude 동시 실패 | 각 API 키 확인, 할당량 확인 |
| DB 연결 오류 | Neon 슬립 모드 (무료 플랜, 5분 비활성 후 슬립) | Neon 대시보드에서 인스턴스 깨우기 |
| GA4/GSC 연동 실패 | OAuth 토큰 만료/오염 | Vercel Blob에서 해당 토큰 파일 삭제 후 재연결 |
| Cron 미실행 | CRON_SECRET 불일치 | Vercel 환경변수 확인 |
| AdSense 광고 미표시 | ads.txt 미설정 또는 승인 대기 | `public/ads.txt` 확인, AdSense 대시보드 확인 |
| 빌드 에러 `Cannot find name 'X'` | 타입 re-export와 import 혼동 | `export type`만으로는 파일 내 사용 불가, `import type`도 함께 작성 |
| Prisma 빌드 에러 | 스키마 변경 후 client 미생성 | `npx prisma generate` 실행 |
| `prisma db push` 실패 | 데이터 손실 위험 컬럼 변경 | `--accept-data-loss` 플래그 추가 (데이터 삭제 주의) |
| 블로그 글 Unsplash 이미지 없음 | `source.unsplash.com` 타임아웃 (8초) | 재생성하거나 무시 (heroImage는 optional) |
| 국가 리다이렉트 루프 | middleware 조건 누락 | `middleware.ts`의 리다이렉트 조건에 현재 경로 체크 있는지 확인 |

---

*이 문서는 `/home/user/saasclaude/docs/session-handoff.md`에 저장되어 있습니다.*
