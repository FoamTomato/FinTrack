-- ==========================================
-- V10: scan_tasks 新增 imported 标记（是否已导入账单）
-- 注意：ADD COLUMN IF NOT EXISTS 为 MariaDB 语法，MySQL 8 不支持，
-- 故改用 INFORMATION_SCHEMA 判断 + PREPARE 动态执行，保证幂等。
-- ==========================================

SET @dbname = DATABASE();
SET @tablename = "scan_tasks";
SET @columnname = "imported";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE scan_tasks ADD COLUMN imported TINYINT NOT NULL DEFAULT 0 COMMENT '是否已导入账单' AFTER error_msg;"
));
PREPARE alterImported FROM @preparedStatement;
EXECUTE alterImported;
DEALLOCATE PREPARE alterImported;
