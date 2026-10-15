-- 일부 이전 마이그레이션이 snake_case 컬럼을 만들었지만 Prisma 스키마는 camelCase를 조회한다.
-- snake_case 컬럼이 있으면 이름을 바꾸고(데이터 보존), 둘 다 없으면 새로 만든다. 여러 번 실행해도 안전하다.
CREATE OR REPLACE FUNCTION pg_temp.fix_col(tbl text, snake text, camel text, coltype text) RETURNS void AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = camel) THEN
    RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = snake) THEN
    EXECUTE format('ALTER TABLE %I RENAME COLUMN %I TO %I', tbl, snake, camel);
  ELSE
    EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', tbl, camel, coltype);
  END IF;
END;
$$ LANGUAGE plpgsql;

SELECT pg_temp.fix_col('messages', 'scheduled_at', 'scheduledAt', 'TIMESTAMP(3)');
SELECT pg_temp.fix_col('posts', 'kakao_sent_at', 'kakaoSentAt', 'TIMESTAMP(3)');
SELECT pg_temp.fix_col('shuttle_stops', 'tenant_id', 'tenantId', 'TEXT');
SELECT pg_temp.fix_col('shuttle_stops', 'sort_order', 'sortOrder', 'INTEGER NOT NULL DEFAULT 0');
SELECT pg_temp.fix_col('shuttle_stops', 'created_at', 'createdAt', 'TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP');
SELECT pg_temp.fix_col('shuttle_stops', 'updated_at', 'updatedAt', 'TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP');
