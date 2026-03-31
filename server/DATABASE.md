# 数据库表结构文档

> 数据库：`account_app` | 引擎：InnoDB | 字符集：utf8mb4_unicode_ci

---

## 表概览

| # | 表名 | 作用 | 记录主体 |
|---|------|------|---------|
| 1 | `users` | 用户信息表 | 微信用户基本资料 |
| 2 | `categories` | 收支分类表 | 两级分类体系（支持软删除） |
| 3 | `groups` | 群组表 | 多人记账群组 |
| 4 | `group_members` | 群组成员表 | 群组与用户的关联 |
| 5 | `transactions` | 交易记录表 | 收入/支出明细 |
| 6 | `category_usage_stats` | 分类使用统计表 | 分类使用频率（智能排序） |

---

## 表关系

```
users (用户)
 ├── 1:N → transactions      (openid)
 ├── 1:N → categories         (openid)
 ├── 1:N → groups             (owner_openid)
 ├── 1:N → group_members      (openid)
 └── 1:N → category_usage_stats (openid)

groups (群组)
 ├── 1:N → group_members      (group_id)
 └── 1:N → transactions       (group_id)

categories (分类)
 ├── 自引用 → categories       (parent_id → id，两级层级)
 ├── 1:N → transactions       (category_id)
 └── 1:N → category_usage_stats (category_id)
```

---

## 1. users — 用户信息表

存储微信小程序用户的基本信息，通过 `openid` 唯一标识用户。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 自增主键 |
| `openid` | VARCHAR(64) | NOT NULL, UNIQUE | 微信 OpenID |
| `nickname` | VARCHAR(64) | NULL | 用户昵称 |
| `avatar_url` | VARCHAR(255) | NULL | 头像地址 |
| `created_at` | TIMESTAMP | DEFAULT NOW | 注册时间 |

**索引：** `uk_openid (openid)` — 唯一索引

---

## 2. categories — 收支分类表

管理收入/支出的分类，支持两级层级结构和软删除。新用户注册时自动初始化默认分类。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 自增主键 |
| `openid` | VARCHAR(64) | NOT NULL | 所属用户 |
| `name` | VARCHAR(32) | NOT NULL | 分类名称（如：餐饮、工资） |
| `type` | TINYINT | NOT NULL | 1=收入，2=支出 |
| `parent_id` | BIGINT | NOT NULL, DEFAULT 0 | 父分类 ID（0=一级分类） |
| `icon` | VARCHAR(255) | DEFAULT '' | 图标（emoji 或 URL） |
| `sort_order` | INT | DEFAULT 0 | 排序权重 |
| `is_default` | TINYINT | DEFAULT 0 | 是否系统默认（1=是） |
| `is_deleted` | TINYINT | DEFAULT 0 | 软删除标记（1=已删除） |
| `created_at` | TIMESTAMP | DEFAULT NOW | 创建时间 |
| `updated_at` | TIMESTAMP | ON UPDATE NOW | 更新时间 |

**索引：**
- `idx_user_type (openid, type, parent_id)` — 查询用户分类
- `idx_is_deleted (is_deleted)` — 过滤已删除分类

**默认分类示例：**
- 支出：餐饮🍔（早午晚餐/饮料水果/零食小吃）、交通🚗（公共交通/打车代驾/自费加油）
- 收入：工资💰（基本工资/奖金绩效）

---

## 3. groups — 群组表

多人记账群组，通过邀请码加入。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 自增主键 |
| `name` | VARCHAR(64) | NOT NULL | 群组名称 |
| `owner_openid` | VARCHAR(64) | NOT NULL | 创建者 OpenID |
| `invite_code` | VARCHAR(16) | NOT NULL, UNIQUE | 8位邀请码 |
| `announcement` | VARCHAR(255) | DEFAULT '' | 群公告 |
| `created_at` | TIMESTAMP | DEFAULT NOW | 创建时间 |

**索引：** `uk_invite_code (invite_code)` — 唯一索引

---

## 4. group_members — 群组成员表

记录群组与用户的多对多关系及角色。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 自增主键 |
| `group_id` | BIGINT | NOT NULL | 所属群组 |
| `openid` | VARCHAR(64) | NOT NULL | 成员 OpenID |
| `role` | VARCHAR(16) | NOT NULL, DEFAULT 'member' | 角色：owner/admin/member |
| `nickname` | VARCHAR(64) | DEFAULT '' | 群内昵称 |
| `joined_at` | TIMESTAMP | DEFAULT NOW | 加入时间 |

**索引：** `uk_group_user (group_id, openid)` — 同一用户不能重复加入

---

## 5. transactions — 交易记录表

核心业务表，记录每一笔收入/支出，支持个人和群组记账。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 自增主键 |
| `openid` | VARCHAR(64) | NOT NULL | 记录人 OpenID |
| `type` | TINYINT | NOT NULL, DEFAULT 2 | 1=收入，2=支出 |
| `amount` | DECIMAL(10,2) | NOT NULL | 金额 |
| `category` | VARCHAR(32) | NOT NULL | 分类名称（冗余/兼容旧数据） |
| `category_id` | BIGINT | NULL | 关联分类 ID |
| `date` | DATE | NOT NULL | 交易日期 |
| `note` | VARCHAR(255) | DEFAULT '' | 备注 |
| `group_id` | BIGINT | NULL | 关联群组（NULL=个人记账） |
| `created_at` | TIMESTAMP | DEFAULT NOW | 创建时间 |
| `updated_at` | TIMESTAMP | ON UPDATE NOW | 更新时间 |

**索引：** `idx_openid_date (openid, date)` — 按日期查询优化

---

## 6. category_usage_stats — 分类使用统计表

追踪每个用户对分类的使用频率，用于智能排序（常用分类排前面）。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 自增主键 |
| `openid` | VARCHAR(64) | NOT NULL | 用户 OpenID |
| `category_id` | BIGINT | NOT NULL | 分类 ID |
| `usage_count` | INT | NOT NULL, DEFAULT 0 | 使用次数 |
| `last_used_at` | TIMESTAMP | ON UPDATE NOW | 最后使用时间 |

**索引：**
- `idx_user_category (openid, category_id)` — 唯一，每用户每分类一条记录
- `idx_usage (usage_count)` — 按使用频率排序

---

## API 与表的对应关系

| API 路径 | 方法 | 涉及的表 | 操作 |
|----------|------|---------|------|
| `/api/user/login` | POST | users | INSERT/SELECT |
| `/api/user/profile` | GET | users | SELECT |
| `/api/user/update` | POST | users | UPDATE |
| `/api/transaction/create` | POST | transactions, category_usage_stats | INSERT |
| `/api/transaction/list` | GET | transactions, categories, users, group_members | SELECT |
| `/api/transaction/stats` | GET | transactions, group_members | SELECT |
| `/api/transaction/dashboard` | GET | transactions, categories, users, group_members | SELECT |
| `/api/transaction/trend` | GET | transactions, group_members | SELECT |
| `/api/transaction/analysis` | GET | transactions, categories, group_members | SELECT |
| `/api/transaction/delete` | POST | transactions | DELETE |
| `/api/category/tree` | GET | categories, category_usage_stats | SELECT |
| `/api/category/list` | GET | categories | SELECT |
| `/api/category/create` | POST | categories | INSERT |
| `/api/category/update` | POST | categories | UPDATE |
| `/api/category/delete` | POST | categories | UPDATE (软删除) |
| `/api/group/create` | POST | groups, group_members | INSERT |
| `/api/group/join` | POST | groups, group_members | INSERT/SELECT |
| `/api/group/list` | GET | group_members, groups | SELECT |
| `/api/group/members` | GET | group_members, users | SELECT |
