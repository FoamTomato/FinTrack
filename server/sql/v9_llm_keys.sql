CREATE TABLE IF NOT EXISTS llm_keys (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  provider    VARCHAR(50)   NOT NULL DEFAULT 'dashscope' COMMENT '提供商',
  model       VARCHAR(100)  NOT NULL COMMENT '模型名',
  api_key     VARCHAR(255)  NOT NULL COMMENT 'API Key',
  base_url    VARCHAR(255)  NOT NULL COMMENT 'Base URL',
  priority    INT           NOT NULL DEFAULT 0 COMMENT '优先级，越大越优先',
  is_active   TINYINT(1)    NOT NULL DEFAULT 1 COMMENT '是否可用',
  quota_used  INT           NOT NULL DEFAULT 0 COMMENT '已使用次数',
  quota_limit INT           NOT NULL DEFAULT 0 COMMENT '额度上限，0=不限制',
  disabled_at DATETIME      DEFAULT NULL COMMENT '禁用时间',
  disable_reason VARCHAR(255) DEFAULT NULL COMMENT '禁用原因',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO llm_keys (provider, model, api_key, base_url, priority, quota_limit) VALUES
('dashscope', 'qwen-vl-max',              'sk-5952c00790804f3ca90b9334292e718b', 'https://dashscope.aliyuncs.com/compatible-mode/v1', 100, 0),
('dashscope', 'qwen-vl-plus',             'sk-5952c00790804f3ca90b9334292e718b', 'https://dashscope.aliyuncs.com/compatible-mode/v1', 90,  0),
('dashscope', 'qwen-image-2.0-pro',       'sk-5952c00790804f3ca90b9334292e718b', 'https://dashscope.aliyuncs.com/compatible-mode/v1', 80,  100),
('dashscope', 'qwen-image-2.0',           'sk-5952c00790804f3ca90b9334292e718b', 'https://dashscope.aliyuncs.com/compatible-mode/v1', 70,  100),
('dashscope', 'qwen-image-2.0-pro-2026-04-22', 'sk-5952c00790804f3ca90b9334292e718b', 'https://dashscope.aliyuncs.com/compatible-mode/v1', 60, 100)
ON DUPLICATE KEY UPDATE updated_at = updated_at;
