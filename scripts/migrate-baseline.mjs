#!/usr/bin/env node
/**
 * Two jobs:
 *
 * 1. Baseline: ensure _prisma_migrations exists and pre-existing migrations
 *    are recorded so `prisma migrate deploy` only runs the new ones.
 *
 * 2. Column safety: directly apply any missing columns/tables that the
 *    spec-improvement migrations add — idempotent, runs regardless of
 *    whether Prisma migration tracking succeeds.  This guarantees the
 *    production DB has the columns before `next build` generates code
 *    that queries them.
 */
import { neon } from '@neondatabase/serverless';
import { createHash } from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'prisma', 'migrations');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

const PRE_EXISTING_MIGRATIONS = [
  '20261004000000_init',
  '20261005000000_add_scheduled_at',
  '20261005000001_add_location_fields',
  '20261005000002_add_contact_proxy_logs',
  '20261005000003_add_fee_change_log',
  '20261005000004_add_gallery_naver_verify',
  '20261005000005_add_principles_facilities',
  '20261005000006_add_shuttle_stops',
  '20261005000007_add_diagnostic_scores',
  '20261006000001_add_naver_place_mirror',
  '20261006000002_add_member_invites',
  '20261006000003_add_receipt_skipped_event_type',
];

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

async function tableExists(name) {
  const r = await sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${name}
    ) AS exists
  `;
  return r[0].exists;
}

// ─── Job 1: baseline ──────────────────────────────────────────────────────────

async function ensureBaseline() {
  const migrationsTableExists = await tableExists('_prisma_migrations');

  if (migrationsTableExists) {
    const rows = await sql`SELECT COUNT(*)::int AS n FROM "_prisma_migrations"`;
    if (rows[0].n > 0) {
      console.log(`_prisma_migrations: ${rows[0].n} row(s) — baseline already done.`);
      return;
    }
    console.log('_prisma_migrations exists but empty — will baseline.');
  } else {
    console.log('Creating _prisma_migrations table…');
    await sql`
      CREATE TABLE "_prisma_migrations" (
        "id"                   VARCHAR(36)  NOT NULL PRIMARY KEY,
        "checksum"             VARCHAR(64)  NOT NULL,
        "finished_at"          TIMESTAMPTZ,
        "migration_name"       VARCHAR(255) NOT NULL,
        "logs"                 TEXT,
        "rolled_back_at"       TIMESTAMPTZ,
        "started_at"           TIMESTAMPTZ NOT NULL DEFAULT now(),
        "applied_steps_count"  INTEGER      NOT NULL DEFAULT 0
      )
    `;
  }

  const dbHasData = await tableExists('tenants');
  if (!dbHasData) {
    console.log('Fresh DB — all migrations applied from scratch.');
    return;
  }

  console.log('Existing DB — inserting baseline records…');
  for (const name of PRE_EXISTING_MIGRATIONS) {
    const already = await sql`
      SELECT 1 FROM "_prisma_migrations" WHERE migration_name = ${name} LIMIT 1
    `;
    if (already.length > 0) { console.log(`  skip: ${name}`); continue; }

    const sqlFile = join(MIGRATIONS_DIR, name, 'migration.sql');
    const content = existsSync(sqlFile) ? readFileSync(sqlFile, 'utf8') : '';
    const checksum = sha256(content);

    await sql`
      INSERT INTO "_prisma_migrations"
        (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
      VALUES (
        gen_random_uuid()::text,
        ${checksum},
        now(),
        ${name},
        now(),
        1
      )
    `;
    console.log(`  baselined: ${name}`);
  }
  console.log('Baseline complete.');
}

// ─── Job 2: apply missing columns (idempotent) ────────────────────────────────

async function applyMissingColumns() {
  console.log('Applying missing columns (idempotent)…');

  // leads table columns — DB uses camelCase quoted identifiers (matches Prisma schema)
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS "testAt"            TIMESTAMPTZ`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS "notEnrolledReason" TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS "retainUntil"       TIMESTAMPTZ`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS "postId"            TEXT`;

  // FK for postId
  const fkExists = await sql`
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'leads_postId_fkey' AND table_name = 'leads'
    LIMIT 1
  `;
  if (!fkExists.length) {
    await sql`
      ALTER TABLE leads
        ADD CONSTRAINT "leads_postId_fkey"
        FOREIGN KEY ("postId") REFERENCES posts(id) ON DELETE SET NULL
    `;
    console.log('  added leads."postId" FK');
  }

  // level_test_slots capacity
  await sql`ALTER TABLE level_test_slots ADD COLUMN IF NOT EXISTS capacity INT`;

  // faq_items table
  await sql`
    CREATE TABLE IF NOT EXISTS faq_items (
      id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "tenantId"  TEXT        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      question    TEXT        NOT NULL,
      answer      TEXT        NOT NULL,
      "sortOrder" INTEGER     NOT NULL DEFAULT 0
    )
  `;

  console.log('Columns/tables ensured.');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  await ensureBaseline();
  await applyMissingColumns();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
