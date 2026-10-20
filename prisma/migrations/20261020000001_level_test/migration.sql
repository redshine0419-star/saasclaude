-- 온라인 레벨테스트 (SPEC 13장). 모든 문장은 여러 번 실행해도 안전하다.
-- scripts/migrate-baseline.mjs 가 이 파일을 빈 줄 단위로 나눠 실행하므로, 문장 안에 빈 줄을 넣지 않는다.

DO $$ BEGIN
  CREATE TYPE "QuestionType" AS ENUM ('choice', 'short');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AttemptStatus" AS ENUM ('issued', 'in_progress', 'submitted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "questions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "subject" TEXT NOT NULL,
    "grade" TEXT,
    "unit" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "choices" JSONB,
    "answers" TEXT[],
    "explanation" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "tests" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "grade" TEXT,
    "description" TEXT,
    "timeLimitMin" INTEGER,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "test_items" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "test_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "test_attempts" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "leadId" TEXT,
    "token" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'issued',
    "startedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "score" INTEGER,
    "maxScore" INTEGER,
    "issuedBy" TEXT,
    CONSTRAINT "test_attempts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "test_responses" (
    "id" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "correct" BOOLEAN,
    "points" INTEGER,
    CONSTRAINT "test_responses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "questions_tenantId_archived_idx" ON "questions"("tenantId", "archived");

CREATE INDEX IF NOT EXISTS "tests_tenantId_archived_idx" ON "tests"("tenantId", "archived");

CREATE UNIQUE INDEX IF NOT EXISTS "test_items_testId_questionId_key" ON "test_items"("testId", "questionId");

CREATE UNIQUE INDEX IF NOT EXISTS "test_attempts_token_key" ON "test_attempts"("token");

CREATE INDEX IF NOT EXISTS "test_attempts_tenantId_testId_idx" ON "test_attempts"("tenantId", "testId");

CREATE INDEX IF NOT EXISTS "test_attempts_leadId_idx" ON "test_attempts"("leadId");

CREATE UNIQUE INDEX IF NOT EXISTS "test_responses_attemptId_questionId_key" ON "test_responses"("attemptId", "questionId");

DO $$ BEGIN
  ALTER TABLE "questions" ADD CONSTRAINT "questions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "tests" ADD CONSTRAINT "tests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "test_items" ADD CONSTRAINT "test_items_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "test_items" ADD CONSTRAINT "test_items_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "test_responses" ADD CONSTRAINT "test_responses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "test_responses" ADD CONSTRAINT "test_responses_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "test_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "test_responses" ADD CONSTRAINT "test_responses_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
