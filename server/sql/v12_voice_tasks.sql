CREATE TABLE IF NOT EXISTS `voice_tasks` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT,
  `openid`      VARCHAR(64)  NOT NULL,
  `status`      VARCHAR(16)  NOT NULL DEFAULT 'pending',
  `input_text`  TEXT         DEFAULT NULL,
  `result`      JSON         DEFAULT NULL,
  `error_msg`   VARCHAR(512) DEFAULT '',
  `retry_count` TINYINT      NOT NULL DEFAULT 0,
  `imported`    TINYINT      NOT NULL DEFAULT 0,
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_openid_status` (`openid`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
