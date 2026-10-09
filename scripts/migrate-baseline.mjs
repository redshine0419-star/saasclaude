#!/usr/bin/env node
/**
 * Creates _prisma_migrations table if missing so prisma migrate deploy
 * skips the P3005 "schema not empty" check and runs all pending migrations.
 */
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function main() {
  const result = await sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = '_prisma_migrations'
    ) AS exists
  `;

  if (result[0].exists) {
    console.log('_prisma_migrations already exists, nothing to do.');
    return;
  }

  console.log('Creating empty _prisma_migrations table to bypass P3005...');
  await sql`
    CREATE TABLE "_prisma_migrations" (
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
  console.log('Done. prisma migrate deploy will now run all pending migrations.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
