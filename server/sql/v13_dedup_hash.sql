-- ==========================================
-- V13: 交易去重支持
-- transactions 表新增 dedup_hash —— sha1(openid|date|amount|type|normalizedNote)
-- 由 transactionService.create() 在所有创建路径写入；
-- 识图/语音批量导入前用 (openid, dedup_hash) 命中即跳过，避免重复上传同一截图重复记账。
-- 历史数据不回填(NULL)，仅对新建记录生效。
-- ==========================================

SET @dbname = DATABASE();
SET @tablename = "transactions";

-- 1) 新增 dedup_hash 列（存在则跳过）
SET @columnname = "dedup_hash";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE transactions ADD COLUMN dedup_hash CHAR(40) NULL DEFAULT NULL COMMENT '去重指纹 sha1(openid|date|amount|type|note)' AFTER note;"
));
PREPARE alterDedupCol FROM @preparedStatement;
EXECUTE alterDedupCol;
DEALLOCATE PREPARE alterDedupCol;

-- 2) 新增 (openid, dedup_hash) 联合索引（存在则跳过）
SET @indexname = "idx_openid_dedup";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (index_name = @indexname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE transactions ADD INDEX idx_openid_dedup (openid, dedup_hash);"
));
PREPARE addDedupIdx FROM @preparedStatement;
EXECUTE addDedupIdx;
DEALLOCATE PREPARE addDedupIdx;
