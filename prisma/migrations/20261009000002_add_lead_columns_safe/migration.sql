-- Safe re-application of column additions from 20261009000001.
-- Uses IF NOT EXISTS so it is idempotent whether the previous migration
-- partially ran or not.
-- NOTE: columns use camelCase quoted identifiers to match the Prisma schema.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS "testAt"            TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS "notEnrolledReason" TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS "retainUntil"       TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS "postId"            TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'leads_postId_fkey'
      AND table_name = 'leads'
  ) THEN
    ALTER TABLE leads
      ADD CONSTRAINT "leads_postId_fkey"
      FOREIGN KEY ("postId") REFERENCES posts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- level_test_slots capacity
ALTER TABLE level_test_slots
  ADD COLUMN IF NOT EXISTS capacity INT;

-- faq_items table
CREATE TABLE IF NOT EXISTS faq_items (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId"  TEXT        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  question    TEXT        NOT NULL,
  answer      TEXT        NOT NULL,
  "sortOrder" INTEGER     NOT NULL DEFAULT 0
);
