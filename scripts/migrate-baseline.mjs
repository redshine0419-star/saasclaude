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

  // 20261010000001_self_serve
  await sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "onboardedVia"   TEXT`;
  await sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "signupConsents" JSONB`;
  await sql`
    CREATE TABLE IF NOT EXISTS site_versions (
      "id"         TEXT         NOT NULL,
      "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "tenantId"   TEXT         NOT NULL,
      "actorEmail" TEXT         NOT NULL,
      "reason"     TEXT         NOT NULL,
      "snapshot"   JSONB        NOT NULL,
      CONSTRAINT "site_versions_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "site_versions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES tenants("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS "site_versions_tenantId_createdAt_idx" ON site_versions ("tenantId", "createdAt")`;

  // 20261011000001_lifecycle_notices
  await sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "lifecycleNotices" JSONB`;

  // 20261011000002_custom_domain
  await sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "customDomain" TEXT`;
  await sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "customDomainStatus" TEXT`;
  await sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "customDomainVerifiedAt" TIMESTAMP(3)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "tenants_customDomain_key" ON tenants ("customDomain")`;

  // 20261011000003_ai_draft_logs
  await sql`CREATE TABLE IF NOT EXISTS ai_draft_logs (
  "id"           TEXT         NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tenantId"     TEXT         NOT NULL,
  "kind"         TEXT         NOT NULL,
  "inputTokens"  INTEGER      NOT NULL DEFAULT 0,
  "outputTokens" INTEGER      NOT NULL DEFAULT 0,
  CONSTRAINT "ai_draft_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ai_draft_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES tenants("id") ON DELETE CASCADE ON UPDATE CASCADE
)`;
  await sql`CREATE INDEX IF NOT EXISTS "ai_draft_logs_tenantId_createdAt_idx" ON ai_draft_logs ("tenantId", "createdAt")`;

  // 20261009000001의 enum 값 — 그 마이그레이션이 운영에서 실패했을 수 있어 별도로 보장한다.
  // (Neon HTTP는 문장마다 자동 커밋이라 ALTER TYPE ... ADD VALUE를 안전하게 실행할 수 있다)
  await sql`ALTER TYPE "ConsultType" ADD VALUE IF NOT EXISTS 'waitlist'`;
  await sql`ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'test_done' BEFORE 'enrolled'`;
  await sql`ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'no_show' BEFORE 'enrolled'`;
  await sql`ALTER TYPE "MessageScenario" ADD VALUE IF NOT EXISTS 'owner_reminder'`;

  // 20261015000001_fix_snake_case_columns — 이전 마이그레이션의 snake_case 컬럼을 Prisma가 쓰는 camelCase로 맞춘다
  const FIX_COLUMNS = [
    ['messages', 'scheduled_at', 'scheduledAt', 'TIMESTAMP(3)'],
    ['posts', 'kakao_sent_at', 'kakaoSentAt', 'TIMESTAMP(3)'],
    ['shuttle_stops', 'tenant_id', 'tenantId', 'TEXT'],
    ['shuttle_stops', 'sort_order', 'sortOrder', 'INTEGER NOT NULL DEFAULT 0'],
    ['shuttle_stops', 'created_at', 'createdAt', 'TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP'],
    ['shuttle_stops', 'updated_at', 'updatedAt', 'TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP'],
  ];
  for (const [table, snake, camel, type] of FIX_COLUMNS) {
    const cols = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${table} AND column_name IN (${snake}, ${camel})
    `;
    const names = new Set(cols.map((c) => c.column_name));
    if (names.has(camel)) continue;
    if (names.has(snake)) {
      await sql.query(`ALTER TABLE "${table}" RENAME COLUMN "${snake}" TO "${camel}"`);
      console.log(`  renamed ${table}.${snake} -> ${camel}`);
    } else {
      await sql.query(`ALTER TABLE "${table}" ADD COLUMN "${camel}" ${type}`);
      console.log(`  added ${table}.${camel}`);
    }
  }

  // 20261020000001_level_test, 20261021000001_level_test_essay, 20261025000001_students, 20261026000001_student_consent, 20261027000001_student_reports, 20261028000001_hero_content, 20261029000001_section_copy, 20261030000001_error_types — 파일을 빈 줄 단위로 나눠 실행한다 (모든 문장이 멱등)
  for (const name of ['20261020000001_level_test', '20261021000001_level_test_essay', '20261025000001_students', '20261026000001_student_consent', '20261027000001_student_reports', '20261028000001_hero_content', '20261029000001_section_copy', '20261030000001_error_types']) {
    const fileSql = readFileSync(join(MIGRATIONS_DIR, name, 'migration.sql'), 'utf8');
    for (const stmt of fileSql.split(/\n\s*\n/)) {
      const body = stmt.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n').trim();
      if (body) await sql.query(body);
    }
  }

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
