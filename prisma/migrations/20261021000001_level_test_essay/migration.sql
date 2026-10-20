-- 레벨테스트 2단계: 서술형·풀이 사진·채점·첨삭 (SPEC 13장). 모든 문장은 여러 번 실행해도 안전하다.
-- scripts/migrate-baseline.mjs 가 이 파일을 빈 줄 단위로 나눠 실행하므로, 문장 안에 빈 줄을 넣지 않는다.

ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'essay';

ALTER TABLE "test_attempts" ADD COLUMN IF NOT EXISTS "gradedAt" TIMESTAMP(3);

ALTER TABLE "test_attempts" ADD COLUMN IF NOT EXISTS "needsGrading" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "test_responses" ADD COLUMN IF NOT EXISTS "errorType" TEXT;

ALTER TABLE "test_responses" ADD COLUMN IF NOT EXISTS "feedback" TEXT;

ALTER TABLE "test_responses" ADD COLUMN IF NOT EXISTS "gradedBy" TEXT;

ALTER TABLE "test_responses" ADD COLUMN IF NOT EXISTS "marks" TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "test_responses" ADD COLUMN IF NOT EXISTS "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS "test_attempts_tenantId_needsGrading_idx" ON "test_attempts"("tenantId", "needsGrading");
