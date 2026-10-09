#!/usr/bin/env node
/**
 * Baselines Prisma migrations when DB has existing tables but no migration history.
 * If core tables are missing, resets baseline so migrate deploy runs all migrations fresh.
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

async function tableExists(name) {
  const result = await sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${name}
    ) AS exists
  `;
  return result[0].exists;
}

async function main() {
  const migrationTableExists = await tableExists('_prisma_migrations');
  const tenantsExists = await tableExists('tenants');
  const membershipsExists = await tableExists('memberships');

  console.log(`_prisma_migrations: ${migrationTableExists}, tenants: ${tenantsExists}, memberships: ${membershipsExists}`);

  // If core tables are missing, the DB is incomplete — drop migration history so migrate deploy runs fresh
  if (migrationTableExists && (!tenantsExists || !membershipsExists)) {
    console.log('Core tables missing despite migration history. Resetting migration table...');
    await sql`DROP TABLE IF EXISTS "_prisma_migrations"`;
    // Also drop any partial tables/enums to let migrate deploy start clean
    // Drop in reverse dependency order
    const dropTables = [
      'lead_events', 'messages', 'consents', 'leads',
      'posts', 'memberships', 'apply_requests',
      'platform_settings', 'tenants',
    ];
    for (const t of dropTables) {
      await sql`DROP TABLE IF EXISTS ${sql(t)} CASCADE`;
    }
    // Drop enums
    const enums = ['Theme', 'PlanStatus', 'TenantStatus', 'MemberRole', 'ConsultType', 'LeadStatus', 'LeadEventType', 'ConsentType'];
    for (const e of enums) {
      await sql`DROP TYPE IF EXISTS ${sql(e)} CASCADE`;
    }
    console.log('Reset complete. migrate deploy will run all migrations fresh.');
    return;
  }

  // DB has no tables at all — fresh DB, skip baseline
  if (!migrationTableExists && !tenantsExists) {
    console.log('Fresh database. migrate deploy will run all migrations.');
    return;
  }

  // DB has tables AND migration history — nothing to do
  if (migrationTableExists && tenantsExists && membershipsExists) {
    console.log('DB is up to date. Skipping baseline.');
    return;
  }

  // DB has tables but no migration history — baseline all migrations
  if (!migrationTableExists && tenantsExists) {
    console.log('Existing schema without migration history. Baselining...');

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
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
