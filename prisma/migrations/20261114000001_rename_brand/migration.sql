-- 서비스 이름 변경: 첫등원 → 더클. DB에 저장된 글·문구도 바꾼다. 여러 번 실행해도 안전하다.
-- 블로그 글 (운영자 글 — 이름만 바꾼다. 받침 때문에 '첫등원으로'는 '더클로')
UPDATE "blog_posts" SET
  "title" = replace(replace("title", '첫등원으로', '더클로'), '첫등원', '더클'),
  "summary" = replace(replace("summary", '첫등원으로', '더클로'), '첫등원', '더클'),
  "body" = replace(replace("body", '첫등원으로', '더클로'), '첫등원', '더클'),
  "seoTitle" = replace(replace("seoTitle", '첫등원으로', '더클로'), '첫등원', '더클')
WHERE "title" LIKE '%첫등원%' OR "summary" LIKE '%첫등원%' OR "body" LIKE '%첫등원%' OR "seoTitle" LIKE '%첫등원%';
-- 알림톡 문구 — 아직 승인 전인 문구만 (승인된 문구는 카카오에 등록된 글자와 같아야 하므로 건드리지 않는다)
UPDATE "message_templates" SET "body" = replace("body", '첫등원', '더클')
WHERE "body" LIKE '%첫등원%' AND "approvedBody" IS NULL;
