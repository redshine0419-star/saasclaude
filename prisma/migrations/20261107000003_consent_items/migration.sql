-- 동의 항목 정리: 홍보 목적 수집·이용(선택)과 광고성 정보 수신(선택) 분리, 무료 진단 동의 기록, 결제대행사 제3자 제공 동의. 여러 번 실행해도 안전하다.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "promoAgreedAt" TIMESTAMP(3);

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "promoRevokedAt" TIMESTAMP(3);

-- 기존 마케팅 수신 동의는 이메일·휴대폰을 마케팅에 쓰는 동의를 포함하므로 홍보 목적 수집·이용 동의로도 옮긴다
UPDATE "users" SET "promoAgreedAt" = "marketingAgreedAt" WHERE "marketingAgreedAt" IS NOT NULL AND "marketingRevokedAt" IS NULL AND "promoAgreedAt" IS NULL;

ALTER TABLE "diagnostic_requests" ADD COLUMN IF NOT EXISTS "privacyAgreedAt" TIMESTAMP(3);

ALTER TABLE "diagnostic_requests" ADD COLUMN IF NOT EXISTS "adAgreedAt" TIMESTAMP(3);

ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "thirdPartyConsentAt" TIMESTAMP(3);
