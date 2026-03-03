-- ==========================================
-- V4 版本功能支持脚本：分类使用统计
-- ==========================================

SET @dbname = DATABASE();

CREATE TABLE IF NOT EXISTS `category_usage_stats` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `openid` varchar(64) NOT NULL COMMENT '用户ID',
  `category_id` bigint(20) NOT NULL COMMENT '分类ID',
  `usage_count` int(11) NOT NULL DEFAULT '0' COMMENT '使用次数',
  `last_used_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后使用时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_category` (`openid`, `category_id`),
  KEY `idx_usage` (`usage_count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分类使用频率统计表';
