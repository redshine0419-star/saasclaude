# 업무 관리 시스템 — 독립 프로젝트 개발 문서

> 작성일: 2026-05-28  
> 원본 프로젝트: MarketerOps.ai (growweb.me)

---

## 1. 프로젝트 개요

### 제품 설명
팀 기반 프로젝트·태스크 관리 SaaS. 칸반 보드, 간트 차트, 운영 현황 테이블, AI PM 분석, Excel 임포트/익스포트를 포함한 통합 업무 관리 플랫폼.

### 핵심 기능 목록

| 기능 | 설명 |
|------|------|
| 프로젝트 관리 | 생성/수정/삭제, 색상 코딩, 기간 설정, 상시 운영 여부 |
| 태스크 관리 | 4단계 파이프라인(기획→디자인→퍼블→개발), 우선순위, 담당자 |
| 칸반 보드 | 드래그앤드롭, 커스텀 스테이지, 진행률 표시 |
| 간트 차트 | 60일 롤링 타임라인, 주요 업무 마커, 오늘 기준선 |
| 운영 현황 | 스프레드시트형 테이블, 24+ 컬럼, 인라인 상태 수정 |
| 서브태스크 | 태스크 하위 세분화, 담당자 배정, 상태 추적 |
| 팀 관리 | 멤버 초대, 역할(owner/admin/member), 프로필 관리 |
| AI PM 분석 | 팀원별 업무 부하 분석, 인사이트 생성, 알림 발송 |
| Excel 연동 | 템플릿 다운로드, 일괄 임포트, 전체 익스포트 |
| 알림 | 인앱 알림, AI PM 리포트 수신 |

---

## 2. 기술 스택

### 필수 스택

| 분류 | 기술 | 버전 | 비고 |
|------|------|------|------|
| Framework | Next.js | 16.x | App Router |
| Language | TypeScript | 5.x | strict 모드 |
| Styling | Tailwind CSS | 4.x | PostCSS 플러그인 방식 |
| ORM | Prisma | 7.x | |
| Database | PostgreSQL | — | Neon 서버리스 권장 |
| Auth | NextAuth | v5 beta | Google OAuth |
| Icons | lucide-react | 1.x | |
| Charts | recharts | 3.x | 간트 차트용 |
| Excel | xlsx | 0.18.x | 임포트/익스포트 |
| AI | @google/generative-ai | — | Gemini (AI PM용) |
| AI Fallback | @anthropic-ai/sdk | — | Claude (폴백) |

### 환경변수

```env
# 필수
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=랜덤32자
ADMIN_EMAILS=admin@example.com,admin2@example.com

# AI PM 기능용 (선택)
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...
```

---

## 3. 데이터베이스 스키마

### 모델 관계도

```
WorkUser ──┬── ProjectMember ──── Project ──── Task ──┬── SubTask
           ├── Task (assignee)                         ├── Comment
           ├── Task (creator)                          ├── TaskLabel ── Label
           ├── Comment                                 └── SubTask
           └── Notification
```

### 전체 Prisma 스키마

```prisma
model WorkUser {
  id               String          @id @default(cuid())
  email            String          @unique
  name             String?
  avatarUrl        String?
  jobTitle         String?
  responsibilities String?
  workStyle        String?
  projectMembers   ProjectMember[]
  assignedTasks    Task[]          @relation("TaskAssignee")
  createdTasks     Task[]          @relation("TaskCreator")
  comments         Comment[]
  assignedSubTasks SubTask[]
  notifications    Notification[]
}

model Project {
  id          String          @id @default(cuid())
  name        String
  description String?
  color       String          @default("#6366f1")
  status      String          @default("active")
  startDate   DateTime?
  dueDate     DateTime?
  isOngoing   Boolean         @default(false)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  members     ProjectMember[]
  tasks       Task[]
}

model ProjectMember {
  id        String   @id @default(cuid())
  role      String   @default("member") // owner | admin | member
  userId    String
  projectId String
  user      WorkUser @relation(fields: [userId], references: [id])
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  @@unique([userId, projectId])
}

model Task {
  id           String      @id @default(cuid())
  title        String
  description  String?
  status       String      @default("기획")
  priority     String      @default("보통")  // 낮음 | 보통 | 높음 | 긴급
  startDate    DateTime?
  dueDate      DateTime?
  position     Float       @default(0)
  isKeyTask    Boolean     @default(false)
  category     String?
  taskType     String?
  requester    String?
  externalLink String?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  // 4단계 파이프라인 상태
  planningStatus    String?
  planningStartDate DateTime?
  planningDueDate   DateTime?
  designStatus      String?
  designStartDate   DateTime?
  designDueDate     DateTime?
  publishStatus     String?
  publishStartDate  DateTime?
  publishDueDate    DateTime?
  devStatus         String?
  devStartDate      DateTime?
  devDueDate        DateTime?

  projectId  String
  assigneeId String?
  creatorId  String?

  project  Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignee WorkUser? @relation("TaskAssignee", fields: [assigneeId], references: [id])
  creator  WorkUser? @relation("TaskCreator", fields: [creatorId], references: [id])
  labels   TaskLabel[]
  comments Comment[]
  subTasks SubTask[]
}

model SubTask {
  id         String    @id @default(cuid())
  title      String
  startDate  DateTime?
  dueDate    DateTime?
  status     String    @default("미시작")
  createdAt  DateTime  @default(now())
  taskId     String
  assigneeId String?
  task       Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
  assignee   WorkUser? @relation(fields: [assigneeId], references: [id])
}

model Label {
  id    String      @id @default(cuid())
  name  String
  color String
  tasks TaskLabel[]
}

model TaskLabel {
  taskId  String
  labelId String
  task    Task  @relation(fields: [taskId], references: [id], onDelete: Cascade)
  label   Label @relation(fields: [labelId], references: [id])
  @@id([taskId, labelId])
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  createdAt DateTime @default(now())
  taskId    String
  userId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user      WorkUser @relation(fields: [userId], references: [id])
}

model Notification {
  id        String   @id @default(cuid())
  title     String
  body      String
  type      String   @default("ai-pm")
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
  userId    String
  user      WorkUser @relation(fields: [userId], references: [id])
}
```

---

## 4. API 엔드포인트 명세

### 4-1. 프로젝트 `/api/work/projects`

#### GET — 프로젝트 목록
```
Response: Project[]
각 항목에 role(owner/admin/member), _count(tasks, members) 포함
정렬: createdAt DESC
```

#### POST — 프로젝트 생성
```json
Request: {
  "name": "string (필수)",
  "description": "string?",
  "color": "#6366f1",
  "startDate": "2026-01-01",
  "dueDate": "2026-12-31",
  "isOngoing": false
}
Response: Project (생성된 프로젝트, 생성자가 자동으로 owner로 등록됨)
```

#### PATCH — 프로젝트 수정
```json
Request: { "id": "cuid", ...수정할 필드 }
```

#### DELETE — 프로젝트 삭제
```
Query: ?id={projectId}
태스크/멤버 Cascade 삭제
```

---

### 4-2. 태스크 `/api/work/tasks`

#### GET — 태스크 목록
```
Query params:
  projectId=xxx         → 특정 프로젝트 태스크
  assignedToMe=true     → 내가 담당한 태스크
  memberId=xxx          → 특정 멤버 담당 태스크

Response: Task[] (assignee, labels, subTasks, _count.comments 포함)
정렬: dueDate asc → position asc → createdAt asc
```

#### POST — 태스크 생성
```json
Request: {
  "projectId": "cuid (필수)",
  "title": "string (필수)",
  "description": "string?",
  "status": "기획",
  "priority": "보통",
  "startDate": "2026-01-01",
  "dueDate": "2026-01-31",
  "assigneeId": "cuid?",
  "isKeyTask": false,
  "category": "string?",
  "taskType": "string?",
  "requester": "string?",
  "externalLink": "string?",
  "planningStatus": "미시작",
  "planningStartDate": "2026-01-01",
  "planningDueDate": "2026-01-07",
  "designStatus": "미시작",
  "designStartDate": "2026-01-08",
  "designDueDate": "2026-01-14",
  "publishStatus": "미시작",
  "publishStartDate": "2026-01-15",
  "publishDueDate": "2026-01-20",
  "devStatus": "미시작",
  "devStartDate": "2026-01-21",
  "devDueDate": "2026-01-31"
}
```

#### PATCH — 태스크 수정
```json
Request: { "id": "cuid (필수)", ...수정할 필드 }
position 수정으로 드래그앤드롭 순서 저장
```

#### DELETE
```
Query: ?id={taskId}
```

---

### 4-3. 서브태스크 `/api/work/subtasks`

#### GET
```
Query: taskId=xxx | assignedToMe=true | memberId=xxx
Response: SubTask[] (assignee, 부모 task 정보 포함)
```

#### POST
```json
Request: {
  "taskId": "cuid (필수)",
  "title": "string (필수)",
  "startDate": "string?",
  "dueDate": "string?",
  "status": "미시작",
  "assigneeId": "cuid?"
}
```

#### PATCH
```json
Request: { "id": "cuid (필수)", ...수정할 필드 }
```

#### DELETE
```
Query: ?id={subtaskId}
```

---

### 4-4. 멤버 `/api/work/members`

#### GET
```
Query: projectId=xxx (필수)
Response: ProjectMember[] (user 정보 포함: jobTitle, responsibilities, workStyle)
정렬: role asc (owner → admin → member)
```

#### POST — 멤버 추가
```json
Request: {
  "projectId": "cuid",
  "email": "user@example.com",
  "role": "member"
}
주의: WorkUser에 존재하는 이메일만 추가 가능 (1회 이상 로그인 필요)
```

#### PATCH — 프로필 수정
```json
Request: {
  "userId": "cuid",
  "jobTitle": "string?",
  "responsibilities": "string?",
  "workStyle": "string?"
}
```

#### DELETE
```
Query: ?projectId=xxx&userId=xxx
```

---

### 4-5. AI PM 분석 `POST /api/work/ai-pm`

```
인증: admin 권한 또는 x-cron-source: internal 헤더

동작:
1. 활성 프로젝트 + 멤버 + 태스크 통계 수집
2. 멤버별 집계: 전체/진행중/완료/기한초과/긴급 태스크 수
3. AI에게 팀 현황 분석 요청
4. 결과를 Notification으로 생성 (관리자: 전체 리포트 / 멤버: 개인 인사이트)

AI 응답 구조:
{
  "teamSummary": "전체 팀 요약",
  "members": [
    { "name": "홍길동", "status": "과부하|적정|여유", "insight": "상세 분석" }
  ],
  "recommendations": ["권고사항1", "권고사항2"]
}

Response: { "ok": true, "notificationsCreated": 5 }
```

---

### 4-6. Excel 연동

#### GET `/api/work/excel?type=template` — 빈 템플릿 다운로드
#### GET `/api/work/excel?type=tasks&projectId=xxx` — 태스크 전체 익스포트
#### POST `/api/work/excel` — Excel 파일 임포트
```
Content-Type: multipart/form-data
Body: file (xlsx 파일)

처리 시트:
- "프로젝트" 시트 → Project 생성
- "업무" 시트 → Task 생성

컬럼 매핑:
프로젝트명, 업무제목, 설명, 단계, 중요도, 시작일, 목표일,
담당자이메일, 요청자, 구분, 작업종류, 링크, 주요업무(Y/N),
기획상태, 디자인상태, 퍼블상태, 개발상태

Response: { "projectsCreated": 2, "tasksCreated": 15, "errors": [] }
```

---

## 5. 컴포넌트 구조

### 5-1. 페이지 구성 (탭 네비게이션)

```
/app (또는 /work)
 ├── [프로젝트 탭]  → WorkProjectsTab
 ├── [칸반 탭]     → WorkKanbanTab
 ├── [내 업무 탭]  → WorkMyTasksTab
 ├── [운영 탭]     → WorkOpsTab
 └── [팀 탭]      → WorkTeamTab
```

### 5-2. WorkProjectsTab

**역할:** 프로젝트 카드 목록 + 간트 차트

**주요 상태:**
```typescript
projects: Project[]
view: 'card' | 'gantt'
showForm: boolean          // 프로젝트 생성/수정 모달
editTarget: Project | null
```

**Project 타입:**
```typescript
interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  status: string;
  startDate: string | null;
  dueDate: string | null;
  isOngoing: boolean;
  createdAt: string;
  role: string;             // owner | admin | member
  _count: { tasks: number; members: number };
}
```

**간트 차트 구현 포인트:**
- 6개월 롤링 윈도우 (이전/다음 이동 버튼)
- 주요 업무(isKeyTask)는 다이아몬드(◆) 마커로 표시
- 오늘 날짜 빨간 세로선
- 프로젝트 바: 색상은 project.color 사용

---

### 5-3. WorkKanbanTab (핵심 컴포넌트)

**3가지 뷰 포함:**

#### CardView (칸반)
```
- 스테이지별 컬럼 (기획/디자인/퍼블/개발/완료)
- 태스크 카드: 우선순위 뱃지, 담당자 아바타, 기한
- 드래그앤드롭: onDragStart/onDrop → PATCH position & status
- 상단 "+" 버튼으로 태스크 추가
```

**드래그앤드롭 position 계산 로직:**
```typescript
// 앞뒤 태스크 position 평균값으로 새 position 계산
const prevPos = tasksInColumn[insertIndex - 1]?.position ?? 0;
const nextPos = tasksInColumn[insertIndex]?.position ?? prevPos + 2;
const newPosition = (prevPos + nextPos) / 2;
```

#### GanttView (간트)
```
- 60일 타임라인 (오늘 기준 -14일 ~ +46일)
- 태스크 바 색상: 스테이지별 색상 매핑
- 오늘 기준선 빨간 세로선 표시
```

#### OpsView (운영 현황)
```
- 스프레드시트 형태 테이블
- 컬럼 24개+ (토글로 가시성 제어, localStorage 저장)
- 인라인 상태 변경 (셀 클릭 → 드롭다운)
- 상단 퀵 추가 행
- 검색 + 상태/우선순위 필터
```

**SettingsModal (커스터마이징):**
```
- 스테이지 추가/수정/삭제/순서변경 + 색상 지정
- 카테고리 관리 (추가/삭제)
- 작업종류 관리 (추가/삭제)
→ 모두 localStorage에 저장
```

**TaskModal (태스크 상세/수정):**
```
Fields:
  기본: 제목, 설명, 담당자, 상태, 우선순위, 시작일/목표일
  분류: 카테고리, 작업종류, 요청자, 외부링크, 주요업무 여부
  파이프라인: 기획/디자인/퍼블/개발 각각 → 상태 + 시작일 + 목표일
  서브태스크: 인라인 추가/수정/삭제/완료 체크
```

---

### 5-4. WorkMyTasksTab

**역할:** 로그인 사용자의 담당 태스크 + 서브태스크 조회

**스마트 버킷 분류:**
```
기한초과 → 오늘 → 이번주 → 나중에 → 기한없음
```

**멤버 셀렉터:** 프로젝트 오너는 팀원 선택 후 해당 멤버 태스크 조회 가능

---

### 5-5. WorkTeamTab

**역할:** 프로젝트별 팀원 관리 + AI PM 실행

**주요 기능:**
- 이메일로 멤버 초대 (WorkUser에 존재해야 함)
- 인라인 프로필 편집 (직함, 담당업무, 업무스타일)
- AI PM 분석 버튼 → `/api/work/ai-pm` POST 호출
- 멤버 제거

---

## 6. 비즈니스 로직 핵심 규칙

### 태스크 상태값 (기본값, 커스터마이징 가능)
```
스테이지:        기획 | 디자인 | 퍼블 | 개발 | 완료
파이프라인 상태: 미시작 | 진행중 | 검토요청 | 피드백 | 보류 | 완료 | N/A
우선순위:        낮음 | 보통 | 높음 | 긴급
```

### 드래그앤드롭 순서 저장
```
태스크 이동 시:
1. status → 드롭된 컬럼의 스테이지명으로 변경
2. position → 앞뒤 태스크 position 평균값으로 계산
```

### 멤버 초대 제약
```
초대 이메일이 WorkUser 테이블에 없으면 거부
→ 초대받을 사람이 먼저 Google 로그인 1회 필요
```

### NextAuth signIn 콜백 — WorkUser 자동 생성
```typescript
// auth.ts signIn 콜백에 반드시 추가
async signIn({ user }) {
  await prisma.workUser.upsert({
    where: { email: user.email },
    update: { name: user.name, avatarUrl: user.image },
    create: { email: user.email, name: user.name, avatarUrl: user.image },
  });
  return true;
}
```

### 알림 생성 (AI PM)
```
관리자: "팀 전체 리포트" 알림 1개
각 멤버: 개인 인사이트 알림 1개
type: "ai-pm"
read: false (미읽음)
```

---

## 7. localStorage 키 목록

| 키 | 내용 | 기본값 |
|----|------|--------|
| `work-stages-{projectId}` | 커스텀 스테이지 배열 | 기획/디자인/퍼블/개발/완료 |
| `work-categories` | 카테고리 목록 | 기타 |
| `work-tasktypes` | 작업종류 목록 | 기타 유지보수 |
| `work-ops-cols` | 운영 탭 컬럼 가시성 | 전체 표시 |

---

## 8. 개발 우선순위 (추천 순서)

| 순서 | 작업 | 예상 소요 |
|------|------|-----------|
| 1 | DB 스키마 + Prisma 세팅 | 0.5일 |
| 2 | NextAuth Google OAuth + WorkUser 자동생성 | 0.5일 |
| 3 | 프로젝트 CRUD API + 카드 UI | 1일 |
| 4 | 태스크 CRUD API | 1일 |
| 5 | 칸반 카드뷰 (드래그앤드롭 포함) | 2일 |
| 6 | 태스크 상세 모달 (4단계 파이프라인) | 1.5일 |
| 7 | 서브태스크 기능 | 0.5일 |
| 8 | 내 업무 탭 (버킷 분류) | 0.5일 |
| 9 | 팀 관리 탭 | 1일 |
| 10 | 간트 차트 (프로젝트 + 태스크) | 1.5일 |
| 11 | 운영 현황 OpsView | 1.5일 |
| 12 | Excel 임포트/익스포트 | 1일 |
| 13 | AI PM 분석 + 알림 | 1일 |
| **합계** | | **~13일** |

---

## 9. 주의사항 & 알려진 이슈

1. **Prisma + Neon 연결:** `@prisma/adapter-neon` 사용 필요, Edge 런타임 미사용
2. **Next.js 16 App Router:** 모든 인터랙티브 컴포넌트에 `'use client'` 지시어 필수
3. **xlsx 패키지:** Edge 런타임 미지원 → API Route에 `export const runtime = 'nodejs'` 명시
4. **WorkUser 자동 생성:** NextAuth `signIn` 콜백에서 Google 로그인 시 WorkUser upsert 구현 필수 (위 6번 참고)
5. **ADMIN_EMAILS:** 쉼표 구분, 공백 없이 입력 (`admin@a.com,admin@b.com`)
6. **role 확인 패턴:**
   ```typescript
   const session = await auth();
   const role = (session?.user as { role?: string })?.role;
   if (role !== 'admin') return NextResponse.json({}, { status: 403 });
   ```

---

## 10. 파일 목록 (원본 프로젝트 기준)

### 컴포넌트
```
components/work/
├── WorkProjectsTab.tsx    # 프로젝트 목록 + 간트
├── WorkKanbanTab.tsx      # 칸반/간트/운영 뷰 (핵심)
├── WorkMyTasksTab.tsx     # 내 업무
├── WorkOpsTab.tsx         # 운영 현황 (독립형)
└── WorkTeamTab.tsx        # 팀 관리 + AI PM
```

### API Routes
```
app/api/work/
├── projects/route.ts      # 프로젝트 CRUD
├── tasks/route.ts         # 태스크 CRUD
├── subtasks/route.ts      # 서브태스크 CRUD
├── members/route.ts       # 멤버 관리
├── ai-pm/route.ts         # AI PM 분석
├── excel/route.ts         # Excel 임포트/익스포트
└── import-ops/route.ts    # 운영 데이터 마이그레이션 (1회성)
```

### DB
```
prisma/schema.prisma       # WorkUser, Project, ProjectMember, Task, SubTask,
                           # Label, TaskLabel, Comment, Notification 모델 포함
```
