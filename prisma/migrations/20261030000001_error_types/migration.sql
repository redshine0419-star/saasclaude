-- 과목별 오답 유형 (학원 편집). 여러 번 실행해도 안전하다.
-- scripts/migrate-baseline.mjs 가 이 파일을 빈 줄 단위로 나눠 실행하므로, 문장 안에 빈 줄을 넣지 않는다.

ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "errorTypes" JSONB;
