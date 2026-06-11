-- ==========================================
-- V15: 交易来源标记
-- transactions 新增 source(manual|voice|scan) 与 source_task_id(来源任务 id)。
-- 手动记账 source='manual'；语音/识图批量导入写对应 source + 来源 task id。
-- 用于「记一笔」时间线区分三类记账卡片。
-- source 同时区分 task 表：voice→voice_tasks、scan→scan_tasks。
-- 历史数据默认 'manual'（旧导入交易会被当成手动，仅影响时间线回看，不影响金额）。
-- ==========================================

SET @dbname = DATABASE();
SET @tablename = "transactions";

-- 1) source
SET @columnname = "source";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE transactions ADD COLUMN source VARCHAR(16) NOT NULL DEFAULT 'manual' COMMENT '记账来源 manual|voice|scan';"
));
PREPARE alterSource FROM @preparedStatement;
EXECUTE alterSource;
DEALLOCATE PREPARE alterSource;

-- 2) source_task_id
SET @columnname = "source_task_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE transactions ADD COLUMN source_task_id BIGINT NULL DEFAULT NULL COMMENT '来源任务 id (voice_tasks/scan_tasks)';"
));
PREPARE alterSourceTask FROM @preparedStatement;
EXECUTE alterSourceTask;
DEALLOCATE PREPARE alterSourceTask;
