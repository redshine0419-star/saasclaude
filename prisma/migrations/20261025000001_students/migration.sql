-- 학생부·성적·출결 (SPEC 14장). 모든 문장은 여러 번 실행해도 안전하다.
-- scripts/migrate-baseline.mjs 가 이 파일을 빈 줄 단위로 나눠 실행하므로, 문장 안에 빈 줄을 넣지 않는다.

DO $$ BEGIN
  CREATE TYPE "StudentStatus" AS ENUM ('active', 'paused', 'left');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StudentNoteKind" AS ENUM ('attitude', 'personality', 'consult', 'parent', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ScoreKind" AS ENUM ('school', 'mock', 'academy');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'late', 'absent', 'excused');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "students" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" TEXT,
    "school" TEXT,
    "classId" TEXT,
    "status" "StudentStatus" NOT NULL DEFAULT 'active',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "parentName" TEXT,
    "parentPhone" TEXT,
    "studentPhone" TEXT,
    "traits" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "summary" TEXT,
    "leadId" TEXT,
    "createdBy" TEXT,
    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "student_notes" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "kind" "StudentNoteKind" NOT NULL DEFAULT 'other',
    "body" TEXT NOT NULL,
    "authorEmail" TEXT NOT NULL,
    "authorName" TEXT,
    CONSTRAINT "student_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "student_scores" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "kind" "ScoreKind" NOT NULL,
    "examDate" DATE NOT NULL,
    "label" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "rankGrade" INTEGER,
    "percentile" DOUBLE PRECISION,
    "memo" TEXT,
    "createdBy" TEXT,
    CONSTRAINT "student_scores_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "attendances" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "note" TEXT,
    "checkedBy" TEXT,
    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "students_leadId_key" ON "students"("leadId");

CREATE INDEX IF NOT EXISTS "students_tenantId_status_idx" ON "students"("tenantId", "status");

CREATE INDEX IF NOT EXISTS "students_tenantId_classId_idx" ON "students"("tenantId", "classId");

CREATE INDEX IF NOT EXISTS "student_notes_tenantId_studentId_createdAt_idx" ON "student_notes"("tenantId", "studentId", "createdAt");

CREATE INDEX IF NOT EXISTS "student_scores_tenantId_studentId_examDate_idx" ON "student_scores"("tenantId", "studentId", "examDate");

CREATE INDEX IF NOT EXISTS "attendances_tenantId_date_idx" ON "attendances"("tenantId", "date");

CREATE UNIQUE INDEX IF NOT EXISTS "attendances_studentId_date_key" ON "attendances"("studentId", "date");

DO $$ BEGIN
  ALTER TABLE "students" ADD CONSTRAINT "students_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "students" ADD CONSTRAINT "students_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "students" ADD CONSTRAINT "students_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "student_notes" ADD CONSTRAINT "student_notes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "student_notes" ADD CONSTRAINT "student_notes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "student_scores" ADD CONSTRAINT "student_scores_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "student_scores" ADD CONSTRAINT "student_scores_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "attendances" ADD CONSTRAINT "attendances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "attendances" ADD CONSTRAINT "attendances_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
