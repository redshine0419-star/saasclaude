-- Migration: spec improvements from 랠리즈 비교 점검 1009
-- 1. leads: add testAt, postId, notEnrolledReason, retainUntil
-- 2. level_test_slots: add capacity
-- 3. enum ConsultType: add waitlist
-- 4. enum LeadStatus: add test_done, no_show
-- 5. enum MessageScenario: add owner_reminder

-- 1. leads new columns (camelCase to match Prisma schema)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS "testAt"            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "notEnrolledReason" TEXT,
  ADD COLUMN IF NOT EXISTS "retainUntil"       TIMESTAMPTZ;

-- postId added separately for the FK
ALTER TABLE leads ADD COLUMN IF NOT EXISTS "postId" TEXT;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'leads_postId_fkey' AND table_name = 'leads'
  ) THEN
    ALTER TABLE leads
      ADD CONSTRAINT "leads_postId_fkey"
      FOREIGN KEY ("postId") REFERENCES posts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. level_test_slots capacity
ALTER TABLE level_test_slots
  ADD COLUMN IF NOT EXISTS capacity INT;

-- 3. ConsultType enum
ALTER TYPE "ConsultType" ADD VALUE IF NOT EXISTS 'waitlist';

-- 4. LeadStatus enum (must add in order)
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'test_done' BEFORE 'enrolled';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'no_show'   BEFORE 'enrolled';

-- 5. MessageScenario enum
ALTER TYPE "MessageScenario" ADD VALUE IF NOT EXISTS 'owner_reminder';

-- 6. FAQ items table
CREATE TABLE IF NOT EXISTS faq_items (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId"  TEXT        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  question    TEXT        NOT NULL,
  answer      TEXT        NOT NULL,
  "sortOrder" INTEGER     NOT NULL DEFAULT 0
);
