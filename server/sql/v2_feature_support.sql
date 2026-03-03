-- ==========================================
-- V2 版本功能支持脚本：分类配置 & 小组账本
-- 请在数据库中执行此脚本
-- ==========================================

-- 1. 新建分类表 (支持二级分类)
CREATE TABLE IF NOT EXISTS `categories` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `openid` VARCHAR(64) NOT NULL COMMENT '所属用户',
  `name` VARCHAR(32) NOT NULL COMMENT '分类名称',
  `type` TINYINT NOT NULL COMMENT '1:收入, 2:支出',
  `parent_id` BIGINT NOT NULL DEFAULT 0 COMMENT '父级ID, 0表示一级分类',
  `icon` VARCHAR(255) DEFAULT '' COMMENT '图标(Emoji或URL)',
  `sort_order` INT DEFAULT 0 COMMENT '排序权重',
  `is_default` TINYINT DEFAULT 0 COMMENT '是否系统默认(1是,0否)',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_type` (`openid`, `type`, `parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户分类配置表';

-- 2. 新建小组表
CREATE TABLE IF NOT EXISTS `groups` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(64) NOT NULL COMMENT '小组名称',
  `owner_openid` VARCHAR(64) NOT NULL COMMENT '群主OpenID',
  `invite_code` VARCHAR(16) NOT NULL COMMENT '邀请码(唯一)',
  `announcement` VARCHAR(255) DEFAULT '' COMMENT '公告',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_invite_code` (`invite_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='账本小组表';

-- 3. 新建小组成员表
CREATE TABLE IF NOT EXISTS `group_members` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `group_id` BIGINT NOT NULL COMMENT '小组ID',
  `openid` VARCHAR(64) NOT NULL COMMENT '成员OpenID',
  `role` VARCHAR(16) NOT NULL DEFAULT 'member' COMMENT '角色: owner/admin/member',
  `nickname` VARCHAR(64) DEFAULT '' COMMENT '群内昵称',
  `joined_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_group_user` (`group_id`, `openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='小组成员关联表';

-- 4. 升级账单表 (增加关联字段)
-- 注意：如果表已存在，请手动检查是否需要添加以下字段
-- ALTER TABLE `transactions` ADD COLUMN `category_id` BIGINT DEFAULT NULL COMMENT '关联二级分类ID' AFTER `category`;
-- ALTER TABLE `transactions` ADD COLUMN `group_id` BIGINT DEFAULT NULL COMMENT '所属小组ID' AFTER `openid`;

-- 这里使用存储过程或条件判断来安全添加字段（MySQL通用兼容写法）
SET @dbname = DATABASE();
SET @tablename = "transactions";
SET @columnname = "group_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE transactions ADD COLUMN group_id BIGINT DEFAULT NULL COMMENT '所属小组ID' AFTER openid;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = "category_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE transactions ADD COLUMN category_id BIGINT DEFAULT NULL COMMENT '关联二级分类ID' AFTER amount;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
