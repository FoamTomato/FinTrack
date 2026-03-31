---
name: express-pipeline-style
description: 当你编写 Express 后端业务方法时，使用本技能确保代码遵循"注释驱动的三层编排"风格
category: code-quality
version: "1.0.0"
tags: [express, nodejs, coding-style, backend, pipeline, clean-code]
---

# Express 三层编排编码风格

Controller 是请求编排器，每步一注释一调用；Service 是业务编排器，封装数据操作与业务规则；具体 SQL 和转换逻辑下沉到 Service 内部方法。中间变量用 `const`，响应格式统一。

## 使用场景

- 编写 Controller / Service / Route / Middleware
- Review 后端代码时检查是否符合团队三层架构风格
- 重构已有接口为编排式结构
- 新成员入职需要了解后端编码规范

## 分层职责规范

每一层只做自己该做的事，职责不得下沉或上浮：

| 层级 | 职责 | 禁止事项 |
|------|------|---------|
| **app.js** | 应用入口：加载环境变量、注册中间件、挂载路由、启动服务器 | 不写业务逻辑，不写 SQL |
| **Route** | 路由定义：URL → Controller 方法映射 | 不写业务逻辑，不做参数校验 |
| **Controller** | 请求编排器：提取参数、校验输入、调用 Service、返回响应 | 不写 SQL，不直接操作数据库 |
| **Service** | 业务编排器：封装业务逻辑、数据库操作、数据聚合 | 不处理 req/res，不返回 HTTP 状态码 |
| **Middleware** | 横切关注点：日志、错误处理、鉴权 | 不写特定接口的业务逻辑 |
| **Utils（response.js）** | 统一响应格式：success/error 封装 | 不写业务逻辑 |
| **Config（db.js）** | 数据库连接池管理 | 不写查询语句 |

### 独立抽取原则

以下逻辑需**从各层中合理分离**，避免单文件膨胀：

#### 1. 参数校验统一在 Controller

所有请求参数的提取和校验在 Controller 完成，Service 接收的是已校验的干净数据：

```javascript
// ✅ 正确：Controller 中校验后传给 Service
async create(req, res, next) {
  try {
    const openid = req.headers['x-wx-openid']
    const { name, type } = req.body

    // 参数校验
    if (!name || !name.trim()) {
      throw { type: 'VALIDATION_ERROR', message: '名称不能为空' }
    }

    // 调用 Service
    const result = await categoryService.create({ openid, name: name.trim(), type })
    success(res, result)
  } catch (err) {
    next(err)
  }
}

// ❌ 错误：Service 中处理 req 对象
async create(req) {
  const name = req.body.name  // Service 不应知道 req
}
```

#### 2. 错误通过 throw + next(err) 传播

Controller 用 try-catch 包裹，错误一律 `next(err)` 交给错误中间件统一处理：

```javascript
// ✅ 正确：统一错误传播
async delete(req, res, next) {
  try {
    const { id } = req.body
    if (!id) throw { type: 'VALIDATION_ERROR', message: 'id 不能为空' }
    await transactionService.delete(id, openid)
    success(res, null, '删除成功')
  } catch (err) {
    next(err)  // 交给 errorHandler 中间件
  }
}

// ❌ 错误：Controller 中自己处理错误响应
catch (err) {
  res.status(500).json({ code: 5001, message: err.message })
}
```

#### 3. 复杂查询封装为 Service 方法

当 SQL 查询带有多条件拼接、JOIN、子查询时，封装为 Service 内的独立方法：

```javascript
// ✅ 正确：复杂查询封装为方法
async getList(openid, params) {
  // 构建查询条件
  const conditions = ['t.openid = ?']
  const queryParams = [openid]

  if (params.type !== undefined) {
    conditions.push('t.type = ?')
    queryParams.push(params.type)
  }

  // 执行查询
  const sql = `SELECT t.*, c.name as category_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY t.date DESC`

  const [rows] = await db.execute(sql, queryParams)
  return rows
}

// ❌ 错误：Controller 中拼接 SQL
```

## 核心原则

1. **Controller = 请求编排器**：方法体按「提取参数 → 校验 → 调用 Service → 返回响应」顺序执行，每步一注释
2. **Service = 业务编排器**：封装所有数据库操作和业务规则，对外暴露语义化方法
3. **统一响应格式**：成功用 `success(res, data, message)`，错误用 `throw + next(err)`
4. **const 不可变**：所有中间变量统一使用 `const`，表明赋值后不再修改
5. **async/await 全链路**：Controller → Service → db.execute 全部使用 async/await
6. **参数化查询**：所有 SQL 使用 `?` 占位符 + 参数数组，防止 SQL 注入
7. **单例导出**：Controller 和 Service 通过 `module.exports = new ClassName()` 导出单例
8. **OpenID 统一提取**：从 `req.headers['x-wx-openid']` 获取，fallback 到 body/query

## 操作步骤

### 添加新接口（完整流程）

1. **Service**：在对应 Service 类中添加业务方法
2. **Controller**：在对应 Controller 中添加请求处理方法
3. **Route**：在路由文件中添加 URL → Controller 方法映射
4. **app.js**：如果是新模块，在 app.js 中挂载路由（已有模块无需此步）

### 添加新模块（完整流程）

1. 创建 `services/xxxService.js` —— 业务逻辑
2. 创建 `controllers/xxxController.js` —— 请求编排
3. 创建 `routes/xxx.js` —— 路由映射
4. 在 `app.js` 中 `app.use('/api/xxx', xxxRoutes)` 挂载
5. 如需新表，在 `sql/` 目录添加迁移脚本

## 输出格式

### Controller 结构模板

编写的 Controller **MUST** 符合以下结构：

```javascript
const xxxService = require('../services/xxxService')
const { success } = require('../utils/response')

class XxxController {
  /**
   * 创建 xxx
   */
  async create(req, res, next) {
    try {
      // 提取参数
      const openid = req.headers['x-wx-openid']
      const { name, type, amount } = req.body

      // 参数校验
      if (!name || !name.trim()) {
        throw { type: 'VALIDATION_ERROR', message: '名称不能为空' }
      }
      if (amount !== undefined && isNaN(Number(amount))) {
        throw { type: 'VALIDATION_ERROR', message: '金额格式错误' }
      }

      // 调用 Service
      const result = await xxxService.create({
        openid,
        name: name.trim(),
        type: Number(type),
        amount: Number(amount)
      })

      // 返回响应
      success(res, result, '创建成功')
    } catch (err) {
      next(err)
    }
  }

  /**
   * 获取列表
   */
  async list(req, res, next) {
    try {
      // 提取参数
      const openid = req.headers['x-wx-openid']
      const { startDate, endDate, type } = req.query

      // 调用 Service
      const list = await xxxService.getList(openid, { startDate, endDate, type })

      // 返回响应
      success(res, list)
    } catch (err) {
      next(err)
    }
  }

  /**
   * 删除
   */
  async delete(req, res, next) {
    try {
      // 提取参数
      const openid = req.headers['x-wx-openid']
      const { id } = req.body

      // 参数校验
      if (!id) {
        throw { type: 'VALIDATION_ERROR', message: 'id 不能为空' }
      }

      // 调用 Service（含权限校验）
      await xxxService.delete(id, openid)

      // 返回响应
      success(res, null, '删除成功')
    } catch (err) {
      next(err)
    }
  }
}

module.exports = new XxxController()
```

### Service 结构模板

```javascript
const db = require('../config/db')

class XxxService {
  /**
   * 创建记录
   */
  async create(data) {
    // 插入数据
    const sql = `INSERT INTO xxx (openid, name, type, amount, created_at)
      VALUES (?, ?, ?, ?, NOW())`
    const [result] = await db.execute(sql, [
      data.openid, data.name, data.type, data.amount
    ])

    return { id: result.insertId }
  }

  /**
   * 获取列表（带条件查询）
   */
  async getList(openid, params) {
    // 构建查询条件
    const conditions = ['x.openid = ?', 'x.is_deleted = 0']
    const queryParams = [openid]

    if (params.type !== undefined) {
      conditions.push('x.type = ?')
      queryParams.push(Number(params.type))
    }
    if (params.startDate) {
      conditions.push('x.date >= ?')
      queryParams.push(params.startDate)
    }
    if (params.endDate) {
      conditions.push('x.date <= ?')
      queryParams.push(params.endDate)
    }

    // 执行查询
    const sql = `SELECT x.*, c.name as category_name
      FROM xxx x
      LEFT JOIN categories c ON x.category_id = c.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY x.created_at DESC`

    const [rows] = await db.execute(sql, queryParams)
    return rows
  }

  /**
   * 删除记录（含权限校验）
   */
  async delete(id, openid) {
    // 查询记录是否存在且属于当前用户
    const [rows] = await db.execute(
      'SELECT id FROM xxx WHERE id = ? AND openid = ?',
      [id, openid]
    )
    if (rows.length === 0) {
      throw new Error('记录不存在或无权删除')
    }

    // 执行软删除
    await db.execute(
      'UPDATE xxx SET is_deleted = 1 WHERE id = ?',
      [id]
    )
  }

  /**
   * 聚合查询（Dashboard 场景）
   */
  async getDashboardData(openid, params) {
    // 并行查询多个维度数据
    const [list, stats, summary] = await Promise.all([
      this.getList(openid, params),
      this.getStats(openid, params),
      this.getSummary(openid, params)
    ])

    return { list, stats, summary }
  }
}

module.exports = new XxxService()
```

### Route 结构模板

```javascript
const express = require('express')
const router = express.Router()
const xxxController = require('../controllers/xxxController')

// 查询类接口用 GET
router.get('/list', (req, res, next) => xxxController.list(req, res, next))
router.get('/detail', (req, res, next) => xxxController.detail(req, res, next))

// 写入类接口用 POST
router.post('/create', (req, res, next) => xxxController.create(req, res, next))
router.post('/update', (req, res, next) => xxxController.update(req, res, next))
router.post('/delete', (req, res, next) => xxxController.delete(req, res, next))

module.exports = router
```

### Middleware 结构模板

#### 错误处理中间件

```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  // 记录错误日志
  console.error(`[Error] ${req.method} ${req.url}:`, err)

  // 业务校验错误
  if (err.type === 'VALIDATION_ERROR') {
    return res.json({
      code: 4001,
      message: err.message || '参数错误'
    })
  }

  // 服务器内部错误
  res.json({
    code: 5001,
    message: err.message || '服务器内部错误'
  })
}

module.exports = errorHandler
```

### 统一响应工具

```javascript
// utils/response.js
const success = (res, data = null, message = 'ok') => {
  res.json({
    code: 0,
    message,
    data
  })
}

module.exports = { success }
```

### app.js 结构模板

```javascript
require('dotenv').config()

const express = require('express')
const cors = require('cors')
const app = express()

// ======== 中间件 ========
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(require('./middleware/logger'))

// ======== 健康检查 ========
app.get('/health', (req, res) => res.json({ status: 'ok' }))

// ======== 路由挂载 ========
app.use('/api/user', require('./routes/user'))
app.use('/api/transaction', require('./routes/transaction'))
app.use('/api/category', require('./routes/category'))
app.use('/api/group', require('./routes/group'))

// ======== 错误处理（必须在路由之后） ========
app.use(require('./middleware/errorHandler'))

// ======== 启动服务 ========
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
```

## 自检清单

编写完成后逐条检查：

**分层职责**
- [ ] Controller 是否只做「提取参数 → 校验 → 调 Service → 返回」？
- [ ] Service 是否不引用 `req` / `res` 对象？
- [ ] SQL 是否只出现在 Service 层，Controller 中无数据库操作？
- [ ] Route 文件是否只做 URL → Controller 映射，无业务逻辑？
- [ ] 错误处理是否通过 `throw + next(err)` 统一传播？

**编排结构**
- [ ] Controller 方法体是否为顺序执行的平坦结构？
- [ ] 每个处理步骤前是否有 `// 中文注释` 说明意图？
- [ ] 所有中间变量是否使用 `const`？
- [ ] 是否全链路使用 `async/await`（无回调地狱）？

**安全规范**
- [ ] SQL 是否全部使用参数化查询（`?` 占位符）？
- [ ] OpenID 是否从 `req.headers['x-wx-openid']` 提取？
- [ ] 删除/修改操作是否校验数据归属（openid 匹配）？
- [ ] 敏感信息（密码、密钥）是否通过环境变量加载？

**响应格式**
- [ ] 成功响应是否使用 `success(res, data, message)` 工具函数？
- [ ] 错误响应格式是否为 `{ code: number, message: string }`？
- [ ] 校验错误是否使用 `throw { type: 'VALIDATION_ERROR', message }` 格式？

**数据库规范**
- [ ] 是否使用连接池（`db.execute`）而非单连接？
- [ ] 查询结果是否用解构 `const [rows] = await db.execute(...)` 获取？
- [ ] 多个独立查询是否用 `Promise.all()` 并行执行？
- [ ] 软删除是否使用 `is_deleted` 标志位而非物理删除？

**模块导出**
- [ ] Controller / Service 是否通过 `module.exports = new ClassName()` 导出单例？
- [ ] Route 是否通过 `module.exports = router` 导出？

## 注意事项

- 此风格适用于 Express 三层架构的**编排方法**，不适用于工具类内部实现
- Service 内部复杂方法可以有条件分支，但 Controller 方法 MUST 保持线性
- 当 Service 文件超过 300 行时，考虑按功能拆分（如 `transactionQueryService` + `transactionWriteService`）
- 数据库迁移脚本放在 `sql/` 目录，命名格式 `v{N}_{feature_name}.sql`
- 日期字段统一使用 `YYYY-MM-DD` 格式字符串，时间戳用 MySQL `NOW()` 函数
- 金额字段使用 `DECIMAL(10,2)` 类型，JS 中用 `Number()` 转换
- 当接口需要返回多维度聚合数据时（如 Dashboard），使用 `Promise.all()` 并行查询
- 字符串拼接 SQL 的 WHERE 条件使用数组 `conditions.push()` + `join(' AND ')`，避免手动拼接
