# FinTrack 记账小助手

微信小程序 + Express 后端的个人/多人记账应用，支持收支记录、分类管理、趋势分析和小组共享账本。

## 功能特性

- **快速记账** — 支出/收入一键切换，二级分类联动选择
- **数据概览** — 月度结余、收支日历热力图、近30日趋势折线图
- **统计分析** — 分类占比柱状图、子分类展开明细、多维度筛选（月/季/年/自定义）
- **小组账本** — 创建/加入小组，邀请码共享，多人协同记账
- **分类管理** — 二级分类树，自定义图标，支持增删改
- **滑动删除** — 交易明细支持左滑删除操作

## 技术栈

| 端 | 技术 |
|----|------|
| **前端** | 微信小程序原生框架（WXML + WXSS + JS） |
| **后端** | Node.js + Express |
| **数据库** | MySQL（mysql2/promise 连接池） |
| **部署** | Docker / 微信云托管 |

## 项目结构

```
FinTrack/
├── miniprogram/                # 小程序前端
│   ├── app.js                  # 全局入口（登录流程、全局数据）
│   ├── app.json                # 页面路由、TabBar 配置
│   ├── app.wxss                # 全局样式
│   ├── utils/
│   │   ├── api.js              # API 工具类（所有后端请求统一入口）
│   │   ├── request.js          # HTTP 底层封装
│   │   └── loading.js          # Loading 引用计数管理
│   └── pages/
│       ├── home/               # 首页（Dashboard + 日历 + 趋势图 + 明细）
│       ├── add/                # 记一笔（表单 + 二级分类联动）
│       ├── settings/           # 配置（用户信息 + 功能入口）
│       ├── stats/              # 统计分析（柱状图 + 分类明细）
│       ├── category/           # 分类管理（一级分类 CRUD）
│       ├── category-detail/    # 子分类管理
│       ├── group/              # 小组管理（创建/加入/成员）
│       └── login/              # 授权登录（头像 + 昵称）
│
├── server/                     # Express 后端
│   ├── app.js                  # 应用入口
│   ├── config/db.js            # MySQL 连接池配置
│   ├── controllers/            # 请求编排层
│   │   ├── userController.js
│   │   ├── transactionController.js
│   │   ├── categoryController.js
│   │   └── groupController.js
│   ├── services/               # 业务逻辑层
│   │   ├── userService.js
│   │   ├── transactionService.js
│   │   ├── categoryService.js
│   │   └── groupService.js
│   ├── routes/                 # 路由映射
│   ├── middleware/             # 日志、错误处理
│   ├── utils/response.js      # 统一响应格式
│   └── sql/                    # 数据库迁移脚本
│       ├── init.sql
│       ├── v2_feature_support.sql
│       ├── v3_user_profile.sql
│       ├── v4_category_stats.sql
│       └── v5_soft_delete_support.sql
│
└── .ai/                        # 开发规范 Skills
    └── quick/
        ├── 小程序开发.md
        ├── 小程序开发风格.md     # wechat-miniprogram-style
        └── Express开发风格.md   # express-pipeline-style
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/user/login` | 登录（code 换 openid） |
| POST | `/api/user/update` | 更新用户信息 |
| GET | `/api/user/profile` | 获取用户信息 |
| POST | `/api/transaction/create` | 创建交易 |
| POST | `/api/transaction/delete` | 删除交易 |
| GET | `/api/transaction/dashboard` | Dashboard 聚合数据 |
| GET | `/api/transaction/trend` | 趋势曲线数据 |
| GET | `/api/transaction/analysis` | 分类分析数据 |
| GET | `/api/category/tree` | 分类树（二级） |
| GET | `/api/category/list` | 分类列表 |
| POST | `/api/category/create` | 创建分类 |
| POST | `/api/category/update` | 更新分类 |
| POST | `/api/category/delete` | 删除分类（软删除） |
| POST | `/api/group/create` | 创建小组 |
| POST | `/api/group/join` | 加入小组 |
| GET | `/api/group/list` | 我的小组列表 |
| GET | `/api/group/members` | 小组成员 |
| GET | `/health` | 健康检查 |

## 快速开始

### 环境要求

- Node.js >= 16
- MySQL 8.0+
- 微信开发者工具

### 后端启动

```bash
cd server

# 配置环境变量
cp .env.example .env
# 编辑 .env 填写数据库连接和微信 AppID/Secret

# 安装依赖
npm install

# 初始化数据库（执行 sql/ 目录下的脚本）
# 按顺序执行: init.sql → v2 → v3 → v4 → v5

# 启动开发服务
npm run dev
```

### 小程序启动

1. 微信开发者工具导入 `miniprogram/` 目录
2. 在 `utils/request.js` 中配置后端地址
3. 编译运行

### Docker 部署

```bash
cd server
docker build -t fintrack-server .
docker run -d -p 3000:3000 --env-file .env fintrack-server
```

详见 [DOCKER_DEPLOYMENT.md](server/DOCKER_DEPLOYMENT.md)

## 编码规范

项目使用自定义 Skills 规范化代码风格：

- **小程序前端** — [wechat-miniprogram-style](.ai/quick/小程序开发风格.md)：分层编排、生命周期调度、API 统一调用、Loading 配对、防重复提交
- **Express 后端** — [express-pipeline-style](.ai/quick/Express开发风格.md)：三层架构、注释驱动编排、参数化 SQL、统一响应格式

## 数据库设计

| 表 | 说明 |
|----|------|
| `users` | 用户信息（openid、昵称、头像） |
| `transactions` | 交易记录（金额、分类、日期、备注、所属小组） |
| `categories` | 二级分类树（支持自定义 + 系统默认，软删除） |
| `groups` | 小组（名称、群主、邀请码） |
| `group_members` | 小组成员关系（角色：owner/member） |
| `category_usage_stats` | 分类使用频次统计 |

详见 [DATABASE.md](server/DATABASE.md)

## License

MIT
