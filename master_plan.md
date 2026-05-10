# MarketerOps.ai — Master Plan

## 1. 제품 비전

> **"10년차 시니어 마케터의 직관을 누구나 쓸 수 있게."**

AI 시대에 마케터가 가장 빠르게 경쟁에서 뒤처지는 이유는 도구의 부재가 아니라 **인사이트를 실행으로 전환하는 속도**다.  
MarketerOps.ai는 SEO·GEO·콘텐츠·키워드를 단일 워크플로우로 묶어, 1인 마케터도 대행사급 분석을 즉시 실행할 수 있는 AI 오퍼레이션 플랫폼이다.

---

## 2. 최종 목표

| 지표 | 목표 |
|---|---|
| 핵심 타깃 | 스타트업 마케터, 인하우스 1인 마케터, SEO 에이전시 주니어 |
| 수익 모델 | Google AdSense (디스플레이 광고) — 무료 사용자 전원 대상 |
| 핵심 가치 제안 | 진단 → 전략 → 콘텐츠 → 측정을 하나의 탭 안에서 완결 |
| 차별점 | GEO(AI 검색 최적화) 진단을 제공하는 국내 유일 SaaS |

---

## 3. 핵심 기능 (Feature Map)

### Phase 1 — MVP (완료)

| 탭 | 기능 | 핵심 가치 |
|---|---|---|
| Engine Diagnosis | PageSpeed Insights + HTML 파싱 기반 Performance·SEO·Accessibility·GEO 점수 | 실제 데이터 기반 진단 |
| Engine Diagnosis | Gemini AI 어드바이저 — 즉시/중기/GEO 전략 리포트 자동 생성 | 시니어 마케터 수준의 해석 |
| Content Orchestrator | 타겟 키워드·톤 입력 → 블로그 제목·개요·SNS 카피·CTA 일괄 생성 | 콘텐츠 생산 속도 10x |
| Keyword Analysis | 검색 의도·경쟁도·월 검색량·연관 키워드·콘텐츠 방향·SEO 제목 분석 | 키워드 기획 자동화 |
| Ops Dashboard | localStorage 기반 진단 이력·점수 추이 차트·레이더 차트 | 성과 트래킹 |

### Phase 2 — Growth (예정)

- **사용자 인증 (Auth)**: Clerk 기반 회원가입·로그인, 소셜 로그인
- **클라우드 데이터 저장**: Vercel Postgres 대체 → Supabase 또는 Neon (Vercel Marketplace)
- **리포트 내보내기**: PDF/Markdown 다운로드, 슬랙 공유
- **프로젝트 단위 관리**: 도메인별 진단 이력·비교 뷰
- **경쟁사 벤치마크**: 타 URL 대비 점수 비교

### Phase 3 — Monetization: AdSense (예정)

**수익 모델: Google AdSense (디스플레이 광고)**
결제·인증 없이 트래픽 기반 즉시 수익화. 무료 사용자 전원에게 광고 노출.

- **`public/ads.txt`**: AdSense 필수 인증 파일
- **`components/AdUnit.tsx`**: 재사용 광고 컴포넌트 (반응형, SSR 안전)
- **광고 배치**: 진단 결과 하단 / 키워드 분석 중간 / 콘텐츠 생성 결과 하단 (각 탭 1개)
- **AdSense 승인 전제**: 커스텀 도메인, Privacy Policy 페이지, Search Console 색인

**수익 추정 (보수적)**

| MAU | 세션당 PV | 예상 CPM | 월 수익 추정 |
|---|---|---|---|
| 1,000 | 4 | ₩1,500 | ~₩6,000 |
| 10,000 | 4 | ₩1,500 | ~₩60,000 |
| 100,000 | 4 | ₩2,000 | ~₩800,000 |

---

## 4. 기술 스택

### Frontend
| 항목 | 선택 | 이유 |
|---|---|---|
| Framework | Next.js 16 (App Router) | SSR·API Routes 일체형, Vercel 최적화 |
| UI | React 19 + Tailwind CSS v4 | 최신 스펙, 유틸리티 퍼스트 |
| 아이콘 | lucide-react | 일관된 디자인 시스템 |
| 차트 | Recharts | React 네이티브, 커스터마이징 용이 |
| 언어 | TypeScript 5 | 타입 안전성 |

### Backend (API Routes)
| 항목 | 선택 | 이유 |
|---|---|---|
| Runtime | Node.js (Fluid Compute) | Edge 비호환 라이브러리(cheerio) 사용 |
| AI | Google Gemini 2.5 Flash | 속도·비용 효율, 한국어 품질 |
| HTML 파싱 | cheerio | GEO 분석 서버사이드 처리 |
| 성능 분석 | PageSpeed Insights API v5 | 공식 Lighthouse 데이터 |

### 인프라 & 데이터
| 항목 | 현재 | 예정 |
|---|---|---|
| 배포 | Vercel (Auto-deploy from main) | 동일 |
| 데이터 | localStorage (클라이언트) | Supabase (Vercel Marketplace) |
| 인증 | 없음 | Clerk |
| 환경변수 | Vercel Environment Variables | 동일 |

---

## 5. 배포 환경

```
GitHub (main 브랜치)
    └─ Vercel Auto Deploy
          ├─ Production: https://saasclaude.vercel.app (또는 커스텀 도메인)
          └─ Preview: PR별 자동 Preview URL
```

### 환경변수 (Vercel Dashboard 설정)
| 변수명 | 용도 |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API 인증 |
| `PAGESPEED_API_KEY` | Google PageSpeed Insights API (옵션, 없으면 무인증 사용) |

### 브랜치 전략
- `main`: 프로덕션. 직접 push 금지, MCP `create_or_update_file`로 관리
- `claude/*`: AI 작업 브랜치. 기능 완성 후 main 반영
- 빌드 검증: main 반영 전 로컬 `npm run build` 필수

---

## 6. 디자인 원칙

- **데이터 우선**: 모든 수치는 실제 API 결과. 추정치는 명시
- **액션 가능성**: 분석에서 끝나지 않고 "다음 단계" 제시
- **모바일 퍼스트**: 하단 탭바 + 반응형 그리드
- **색상 시스템**: 점수 80↑ emerald / 50↑ amber / 50↓ rose
- **단순함**: 컴포넌트 추상화는 필요할 때만. 반복 3회 이하면 인라인 유지
