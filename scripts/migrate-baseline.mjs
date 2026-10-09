#!/usr/bin/env node
/**
 * Ensures _prisma_migrations exists and, if the DB already has tables,
 * baselines all pre-existing migrations by inserting records directly via SQL.
 *
 * This avoids relying on `prisma migrate resolve` (which needs a separate
 * DB connection via the schema datasource url) and instead uses the same
 * Neon HTTP connection that the build already has.
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

// All migrations that predate the 2026-10-09 spec improvements.
// These should already exist in the DB; we mark them as applied without re-running SQL.
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

async function main() {
  const migrationsTableExists = await tableExists('_prisma_migrations');

  if (migrationsTableExists) {
    const rows = await sql`SELECT COUNT(*)::int AS n FROM "_prisma_migrations"`;
    const count = rows[0].n;
    if (count > 0) {
      console.log(`_prisma_migrations exists with ${count} row(s) — nothing to do.`);
      return;
    }
    console.log('_prisma_migrations exists but is empty — will baseline if DB has data.');
  } else {
    console.log('Creating _prisma_migrations table...');
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

  // Only baseline if DB already has tables (i.e. not a fresh DB)
  const dbHasData = await tableExists('tenants');
  if (!dbHasData) {
    console.log('Fresh DB — all migrations will be applied from scratch.');
    return;
  }

  console.log('Existing DB detected — baselining pre-existing migrations via SQL...');
  for (const name of PRE_EXISTING_MIGRATIONS) {
    const already = await sql`
      SELECT 1 FROM "_prisma_migrations" WHERE migration_name = ${name} LIMIT 1
    `;
    if (already.length > 0) {
      console.log(`  Already recorded: ${name}`);
      continue;
    }

    const sqlFile = join(MIGRATIONS_DIR, name, 'migration.sql');
    if (!existsSync(sqlFile)) {
      console.warn(`  Migration file not found, skipping: ${name}`);
      continue;
    }

    const content = readFileSync(sqlFile, 'utf8');
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
    console.log(`  Baselined: ${name}`);
  }

  console.log('Baseline complete. prisma migrate deploy will run only new migrations.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
