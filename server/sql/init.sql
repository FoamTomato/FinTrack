-- 数据库初始化脚本
-- 建议在微信云托管的数据库管理界面或本地连接执行

CREATE TABLE IF NOT EXISTS `transactions` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `openid` VARCHAR(64) NOT NULL COMMENT '微信OpenID',
  `type` TINYINT NOT NULL DEFAULT 2 COMMENT '交易类型：1-收入，2-支出',
  `amount` DECIMAL(10, 2) NOT NULL COMMENT '金额',
  `category` VARCHAR(32) NOT NULL COMMENT '分类（如：餐饮、交通）',
  `date` DATE NOT NULL COMMENT '交易日期',
  `note` VARCHAR(255) DEFAULT '' COMMENT '备注',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_openid_date` (`openid`, `date`) USING BTREE COMMENT '用于查询某用户某日期的账单'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账单明细表';

CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `openid` VARCHAR(64) NOT NULL COMMENT '微信OpenID',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid` (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
