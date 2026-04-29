-- ==========================================
-- V7: 分类启用/禁用支持
-- categories 表新增 is_enabled —— 控制是否在记一笔/编辑时的 picker 中可见
-- 1=启用(默认), 0=禁用(管理页仍可见，但 picker 中过滤)
-- ==========================================

SET @dbname = DATABASE();
SET @tablename = "categories";

SET @columnname = "is_enabled";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE categories ADD COLUMN is_enabled TINYINT DEFAULT 1 COMMENT '是否在 picker 中启用(1是,0否)' AFTER is_deleted;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @indexname = "idx_is_enabled";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (index_name = @indexname)
  ) > 0,
  "SELECT 1",
  "CREATE INDEX idx_is_enabled ON categories(is_enabled);"
));
PREPARE alterIndexIfNotExists FROM @preparedStatement;
EXECUTE alterIndexIfNotExists;
DEALLOCATE PREPARE alterIndexIfNotExists;
