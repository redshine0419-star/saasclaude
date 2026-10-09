#!/usr/bin/env node
/**
 * Baselines Prisma migrations when DB has existing tables but no migration history.
 * Uses @neondatabase/serverless (HTTP) so it works in restricted network environments.
 */
import { neon } from '@neondatabase/serverless';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'prisma', 'migrations');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function main() {
  // Check if _prisma_migrations table exists
  const result = await sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = '_prisma_migrations'
    ) AS exists
  `;
  const migrationTableExists = result[0].exists;

  if (migrationTableExists) {
    console.log('Migration table already exists, skipping baseline.');
    return;
  }

  // Check if any user tables exist (non-empty DB check)
  const tableCheck = await sql`
    SELECT COUNT(*) AS count FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name != '_prisma_migrations'
  `;
  const hasExistingTables = parseInt(tableCheck[0].count) > 0;

  if (!hasExistingTables) {
    console.log('Empty database, skipping baseline (migrate deploy will run fresh).');
    return;
  }

  console.log('Existing tables found without migration history. Baselining...');

  // Create _prisma_migrations table
  await sql`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" VARCHAR(36) NOT NULL PRIMARY KEY,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    )
  `;

  // Get all migration directories (exclude migration_lock.toml)
  const entries = await readdir(migrationsDir);
  const migrations = entries
    .filter(e => !e.includes('.') && e.match(/^\d{14}_/))
    .sort();

  const now = new Date().toISOString();

  for (const migration of migrations) {
    const id = crypto.randomUUID();
    await sql`
      INSERT INTO "_prisma_migrations"
        ("id", "checksum", "finished_at", "migration_name", "logs", "started_at", "applied_steps_count")
      VALUES
        (${id}, 'baselined', ${now}, ${migration}, NULL, ${now}, 1)
      ON CONFLICT DO NOTHING
    `;
    console.log(`  Baselined: ${migration}`);
  }

  console.log('Baseline complete.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
