-- ==========================================
-- V14: 识图精确切图留存
-- transactions 新增 crop_url(该笔在截图中裁出的小图) 与 source_image(来源整张截图)。
-- 识别阶段按模型给的 bbox 逐笔裁图存 uploads/scan-crops/，导入时写入对应交易。
-- 裁图满 1 年由 cleanupService 清理（前端对 404 容错）。
-- ==========================================

SET @dbname = DATABASE();
SET @tablename = "transactions";

-- 1) crop_url
SET @columnname = "crop_url";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE transactions ADD COLUMN crop_url VARCHAR(512) NULL DEFAULT NULL COMMENT '该笔在截图中裁出的小图相对路径';"
));
PREPARE alterCropUrl FROM @preparedStatement;
EXECUTE alterCropUrl;
DEALLOCATE PREPARE alterCropUrl;

-- 2) source_image
SET @columnname = "source_image";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE transactions ADD COLUMN source_image VARCHAR(512) NULL DEFAULT NULL COMMENT '来源整张截图相对路径';"
));
PREPARE alterSrcImg FROM @preparedStatement;
EXECUTE alterSrcImg;
DEALLOCATE PREPARE alterSrcImg;
