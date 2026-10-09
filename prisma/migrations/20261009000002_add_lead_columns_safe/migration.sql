-- Safe re-application of column additions from 20261009000001.
-- Uses IF NOT EXISTS so it's idempotent whether the previous migration
-- partially ran or not.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS test_at              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS not_enrolled_reason  TEXT,
  ADD COLUMN IF NOT EXISTS retain_until         TIMESTAMPTZ;

-- post_id added separately to handle the foreign key gracefully
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS post_id TEXT;

-- Add FK only if column was just added (skip if constraint already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'leads_post_id_fkey'
      AND table_name = 'leads'
  ) THEN
    ALTER TABLE leads
      ADD CONSTRAINT leads_post_id_fkey
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL;
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
