-- 회원가입 동의·동의 이력. 모든 문장은 여러 번 실행해도 안전하다.
-- scripts/migrate-baseline.mjs 가 이 파일을 빈 줄 단위로 나눠 실행하므로, 문장 안에 빈 줄을 넣지 않는다.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ageConfirmedAt" TIMESTAMP(3);

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "consentVersion" TEXT;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "marketingAgreedAt" TIMESTAMP(3);

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "marketingRevokedAt" TIMESTAMP(3);

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "privacyAgreedAt" TIMESTAMP(3);

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "termsAgreedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "user_consent_logs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    CONSTRAINT "user_consent_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "user_consent_logs_userId_createdAt_idx" ON "user_consent_logs"("userId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "user_consent_logs" ADD CONSTRAINT "user_consent_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
