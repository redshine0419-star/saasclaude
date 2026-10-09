-- Migration: spec improvements from 랠리즈 비교 점검 1009
-- 1. leads: add test_at, post_id, not_enrolled_reason, retain_until
-- 2. level_test_slots: add capacity
-- 3. enum ConsultType: add waitlist
-- 4. enum LeadStatus: add test_done, no_show
-- 5. enum MessageScenario: add owner_reminder

-- 1. leads new columns
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS test_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS post_id           TEXT REFERENCES posts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS not_enrolled_reason TEXT,
  ADD COLUMN IF NOT EXISTS retain_until      TIMESTAMPTZ;

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
