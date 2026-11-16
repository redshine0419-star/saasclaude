-- 무료 진단: 휴대폰 대신 이메일을 받는다 (예전 신청의 휴대폰 번호는 보유 기간까지 그대로 둔다)
ALTER TABLE "diagnostic_requests" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "diagnostic_requests" ALTER COLUMN "phone" DROP NOT NULL;
