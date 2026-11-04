-- 학부모용 학생 등록 링크와 등록 대기 건. 모든 문장은 여러 번 실행해도 안전하다.
-- scripts/migrate-baseline.mjs 가 이 파일을 빈 줄 단위로 나눠 실행하므로, 문장 안에 빈 줄을 넣지 않는다.

ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "studentRegToken" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "tenants_studentRegToken_key" ON "tenants"("studentRegToken");

CREATE TABLE IF NOT EXISTS "student_registrations" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "grade" TEXT,
    "school" TEXT,
    "studentPhone" TEXT,
    "parentName" TEXT NOT NULL,
    "parentPhone" TEXT NOT NULL,
    "memo" TEXT,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "consentVersion" TEXT NOT NULL,
    CONSTRAINT "student_registrations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "student_registrations_tenantId_createdAt_idx" ON "student_registrations"("tenantId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "student_registrations" ADD CONSTRAINT "student_registrations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
