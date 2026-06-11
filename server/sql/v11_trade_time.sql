-- ==========================================
-- V11: 购买时间支持
-- transactions 表新增 trade_time —— 记录「购买商品的时间」(时分秒)
-- NULL = 仅日期(如识图导入未给时间)，非空 = 有时分，前端按「年月日 时分」展示
-- 手动记账由后端在记账瞬间写入 CURTIME()；识图导入保持 NULL
-- ==========================================

SET @dbname = DATABASE();
SET @tablename = "transactions";

SET @columnname = "trade_time";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE transactions ADD COLUMN trade_time TIME NULL DEFAULT NULL COMMENT '购买时间(时分秒)，NULL=仅日期' AFTER date;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 历史数据回填：保留旧记录原有的时间展示(此前展示取自 created_at)。
-- 加 created_at < 截断时间，确保重复执行迁移时，不会把之后新插入的「识图(故意 NULL)」记录误回填。
-- 截断时间 = 本次上线日期，部署时如有需要可调整。
UPDATE transactions
  SET trade_time = TIME(created_at)
  WHERE trade_time IS NULL
    AND created_at < '2026-06-10 00:00:00';
