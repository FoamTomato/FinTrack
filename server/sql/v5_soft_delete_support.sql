-- ==========================================
-- V5 版本功能支持脚本：分类逻辑删除支持
-- ==========================================

SET @dbname = DATABASE();
SET @tablename = "categories";
SET @columnname = "is_deleted";

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE categories ADD COLUMN is_deleted TINYINT DEFAULT 0 COMMENT '是否逻辑删除(1是,0否)' AFTER is_default;"
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 为逻辑删除增加索引，避免全表扫描
SET @indexname = "idx_is_deleted";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (index_name = @indexname)
  ) > 0,
  "SELECT 1",
  "CREATE INDEX idx_is_deleted ON categories(is_deleted);"
));

PREPARE alterIndexIfNotExists FROM @preparedStatement;
EXECUTE alterIndexIfNotExists;
DEALLOCATE PREPARE alterIndexIfNotExists;
