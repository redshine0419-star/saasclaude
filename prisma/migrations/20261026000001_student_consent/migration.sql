-- 학생부: 학부모 동의 기록, 퇴원생 즉시 파기 (SPEC 14장). 모든 문장은 여러 번 실행해도 안전하다.
-- scripts/migrate-baseline.mjs 가 이 파일을 빈 줄 단위로 나눠 실행하므로, 문장 안에 빈 줄을 넣지 않는다.

ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "consentAt" DATE;

ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "consentMethod" TEXT;

-- 퇴원 상태로 남아 있던 학생부는 파기한다 (메모·성적·출결은 FK CASCADE로 함께 삭제)
DELETE FROM "students" WHERE "status" = 'left';
