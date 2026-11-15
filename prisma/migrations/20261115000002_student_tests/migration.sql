-- 재원생에게 시험 보내기: 응시↔학생, 자동 성적↔응시, 보낼 문자↔학생·응시. 여러 번 실행해도 안전하다.
ALTER TABLE "test_attempts" ADD COLUMN IF NOT EXISTS "studentId" TEXT;
ALTER TABLE "student_scores" ADD COLUMN IF NOT EXISTS "attemptId" TEXT;
ALTER TABLE "sms_tasks" ADD COLUMN IF NOT EXISTS "attemptId" TEXT;
ALTER TABLE "sms_tasks" ADD COLUMN IF NOT EXISTS "studentId" TEXT;
ALTER TABLE "sms_tasks" ALTER COLUMN "leadId" DROP NOT NULL;
CREATE INDEX IF NOT EXISTS "test_attempts_studentId_idx" ON "test_attempts"("studentId");
CREATE UNIQUE INDEX IF NOT EXISTS "student_scores_attemptId_key" ON "student_scores"("attemptId");
DO $$ BEGIN
  ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "sms_tasks" ADD CONSTRAINT "sms_tasks_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "sms_tasks" ADD CONSTRAINT "sms_tasks_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "test_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
