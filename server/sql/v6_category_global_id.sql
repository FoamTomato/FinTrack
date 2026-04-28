-- ==========================================
-- V6: 分类全局去重 ID
-- categories 表新增 global_id —— 同名同层级跨用户共享一个全局 ID
-- 用途：小组聚合按 global_id 合并，避免相同分类因为是不同用户实例而分裂
-- ==========================================

SET @dbname = DATABASE();
SET @tablename = "categories";

-- 添加 global_id 字段
SET @columnname = "global_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE categories ADD COLUMN global_id BIGINT DEFAULT NULL COMMENT '全局共享ID, 同名同层级跨用户共享' AFTER id;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 添加 global_id 索引（聚合查询、去重查询都会用到）
SET @indexname = "idx_global_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (index_name = @indexname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE categories ADD INDEX idx_global_id (global_id);"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ==========================================
-- 全局分类映射表：(name, type, parent_global_id) → global_id
-- 用于用户新增分类时按名字复用 global_id
-- 一级分类 parent_global_id = 0
-- ==========================================
CREATE TABLE IF NOT EXISTS `category_global_map` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(32) NOT NULL COMMENT '分类名称',
  `type` TINYINT NOT NULL COMMENT '1:收入, 2:支出',
  `parent_global_id` BIGINT NOT NULL DEFAULT 0 COMMENT '父级 global_id, 0=一级',
  `icon` VARCHAR(255) DEFAULT '' COMMENT '默认图标',
  `is_default` TINYINT DEFAULT 0 COMMENT '是否系统默认',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name_type_parent` (`name`, `type`, `parent_global_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='全局分类映射表（去重纽带）';
