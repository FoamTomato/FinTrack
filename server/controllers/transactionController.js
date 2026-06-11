const transactionService = require('../services/transactionService')
const groupService = require('../services/groupService')
const { success } = require('../utils/response')

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

class TransactionController {
  /**
   * 校验日期范围参数
   */
  _validateDateRange(startDate, endDate) {
    if (!startDate || !endDate) {
      throw { type: 'VALIDATION_ERROR', message: '缺少必要参数 (startDate, endDate)' }
    }
    if (!DATE_REGEX.test(startDate) || !DATE_REGEX.test(endDate)) {
      throw { type: 'VALIDATION_ERROR', message: '日期格式错误，应为 YYYY-MM-DD' }
    }
    if (startDate > endDate) {
      throw { type: 'VALIDATION_ERROR', message: 'startDate 不能大于 endDate' }
    }
  }

  /**
   * 校验小组查询权限（scope=1 时必须是成员）
   */
  async _validateScope(scope, groupId, openid) {
    if (scope === 1) {
      if (!groupId) {
        throw { type: 'VALIDATION_ERROR', message: '小组模式下 groupId 不能为空' }
      }
      await groupService.checkMembership(groupId, openid)
    }
  }

  /**
   * 创建账单
   */
  async create(req, res, next) {
    try {
      // 提取参数
      const openid = req.headers['x-wx-openid']
      const { type, amount, category, category_id, date, note, group_id, groupId } = req.body
      const finalGroupId = group_id || groupId

      // 参数校验
      if (!category || !date) {
        throw { type: 'VALIDATION_ERROR', message: '缺少必要参数 (category, date)' }
      }
      if (amount === undefined || amount === null || isNaN(Number(amount))) {
        throw { type: 'VALIDATION_ERROR', message: '金额格式错误' }
      }
      if (Number(amount) <= 0) {
        throw { type: 'VALIDATION_ERROR', message: '金额必须大于 0' }
      }
      if (Number(amount) > 99999999.99) {
        throw { type: 'VALIDATION_ERROR', message: '金额不能超过 99999999.99' }
      }
      if (![1, 2].includes(Number(type))) {
        throw { type: 'VALIDATION_ERROR', message: 'type 必须为 1(收入) 或 2(支出)' }
      }
      if (!DATE_REGEX.test(date)) {
        throw { type: 'VALIDATION_ERROR', message: '日期格式错误，应为 YYYY-MM-DD' }
      }

      // 校验小组成员资格
      if (finalGroupId) {
        await groupService.checkMembership(finalGroupId, openid)
      }

      // 校验分类归属
      if (category_id) {
        await transactionService.validateCategory(category_id, openid, Number(type))
      }

      // 调用 Service（手动记账：记下购买时间的时分秒）
      const result = await transactionService.create({
        openid,
        type: Number(type),
        amount: Number(amount),
        category,
        category_id,
        date,
        note,
        group_id: finalGroupId,
        withTime: true,
        source: 'manual'
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
      const { startDate, endDate, category } = req.query
      const type = req.query.type ? parseInt(req.query.type) : 0
      const page = req.query.page ? parseInt(req.query.page) : 1
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 50

      // 调用 Service
      const list = await transactionService.getList(openid, { startDate, endDate, type, category, page, pageSize })

      // 返回响应
      success(res, { list })
    } catch (err) {
      next(err)
    }
  }

  /**
   * 获取统计数据
   */
  async stats(req, res, next) {
    try {
      // 提取参数
      const openid = req.headers['x-wx-openid']
      const { startDate, endDate } = req.query

      // 参数校验
      this._validateDateRange(startDate, endDate)

      // 调用 Service
      const stats = await transactionService.getStats(openid, startDate, endDate)

      // 返回响应
      success(res, stats)
    } catch (err) {
      next(err)
    }
  }

  /**
   * 首页仪表盘聚合接口
   */
  async dashboard(req, res, next) {
    try {
      // 提取参数
      const openid = req.headers['x-wx-openid']
      const { startDate, endDate } = req.query
      const type = req.query.type ? parseInt(req.query.type) : 0
      const scope = req.query.scope ? parseInt(req.query.scope) : 0
      const groupId = req.query.groupId && req.query.groupId !== 'null' ? parseInt(req.query.groupId) : null

      // 参数校验
      this._validateDateRange(startDate, endDate)
      await this._validateScope(scope, groupId, openid)

      // 调用 Service
      const data = await transactionService.getDashboardData(openid, startDate, endDate, type, scope, groupId)

      // 返回响应
      success(res, data)
    } catch (err) {
      next(err)
    }
  }

  /**
   * 获取近30天趋势数据
   */
  async trend(req, res, next) {
    try {
      // 提取参数
      const openid = req.headers['x-wx-openid']
      const type = (req.query.type !== undefined && req.query.type !== '') ? parseInt(req.query.type) : 2
      const scope = req.query.scope ? parseInt(req.query.scope) : 0
      const groupId = req.query.groupId && req.query.groupId !== 'null' ? parseInt(req.query.groupId) : null

      // 校验小组权限
      await this._validateScope(scope, groupId, openid)

      // 调用 Service
      const data = await transactionService.getTrendData(openid, { type, scope, groupId })

      // 返回响应
      success(res, data)
    } catch (err) {
      next(err)
    }
  }

  /**
   * 统计分析接口
   */
  async analysis(req, res, next) {
    try {
      // 提取参数
      const openid = req.headers['x-wx-openid']
      const { startDate, endDate } = req.query
      const type = req.query.type ? parseInt(req.query.type) : 2
      const scope = req.query.scope ? parseInt(req.query.scope) : 0
      const groupId = req.query.groupId && req.query.groupId !== 'null' ? parseInt(req.query.groupId) : null

      // 参数校验
      this._validateDateRange(startDate, endDate)
      await this._validateScope(scope, groupId, openid)

      // 调用 Service
      const data = await transactionService.getAnalysis(openid, { startDate, endDate, type, scope, groupId })

      // 返回响应
      success(res, data)
    } catch (err) {
      next(err)
    }
  }

  /**
   * 更新账单（仅金额 / 日期 / 备注）
   */
  async update(req, res, next) {
    try {
      const openid = req.headers['x-wx-openid']
      const { id, amount, date, note, category, category_id, type } = req.body

      if (!id) {
        throw { type: 'VALIDATION_ERROR', message: '账单 ID 不能为空' }
      }
      if (type !== undefined && ![1, 2].includes(Number(type))) {
        throw { type: 'VALIDATION_ERROR', message: 'type 必须为 1(收入) 或 2(支出)' }
      }
      if (amount === undefined || amount === null || isNaN(Number(amount))) {
        throw { type: 'VALIDATION_ERROR', message: '金额格式错误' }
      }
      if (Number(amount) <= 0) {
        throw { type: 'VALIDATION_ERROR', message: '金额必须大于 0' }
      }
      if (Number(amount) > 99999999.99) {
        throw { type: 'VALIDATION_ERROR', message: '金额不能超过 99999999.99' }
      }
      if (!date || !DATE_REGEX.test(date)) {
        throw { type: 'VALIDATION_ERROR', message: '日期格式错误，应为 YYYY-MM-DD' }
      }
      if (!category) {
        throw { type: 'VALIDATION_ERROR', message: '分类不能为空' }
      }

      await transactionService.update(id, openid, {
        amount: Number(amount),
        date,
        note,
        category,
        category_id,
        type: type !== undefined ? Number(type) : undefined
      })

      success(res, null, '更新成功')
    } catch (err) {
      next(err)
    }
  }

  /**
   * 把本次导入的逐条结果回写进 task.result：
   *   created  → item.imported = true
   *   duplicate/refunded → item.imported = false + item.skip_reason
   * 仅更新本次处理到的下标；已为 true 的不被覆盖（支持分多次导入累积）。
   */
  async _writebackTaskResult(db, taskTable, taskId, openid, outcomeByIdx) {
    try {
      if (!outcomeByIdx || !Object.keys(outcomeByIdx).length) return
      const [rows] = await db.execute(`SELECT result FROM ${taskTable} WHERE id = ? AND openid = ?`, [taskId, openid])
      if (!rows.length || !rows[0].result) return
      const items = typeof rows[0].result === 'string' ? JSON.parse(rows[0].result) : rows[0].result
      if (!Array.isArray(items)) return
      for (const [idx, outcome] of Object.entries(outcomeByIdx)) {
        const i = Number(idx)
        if (!items[i]) continue
        if (outcome === 'created') {
          items[i].imported = true
          delete items[i].skip_reason
        } else if (items[i].imported !== true) {
          // 已记账过的不要被后续重复导入的 skip 覆盖
          items[i].imported = false
          items[i].skip_reason = outcome
        }
      }
      await db.execute(`UPDATE ${taskTable} SET result = ? WHERE id = ? AND openid = ?`, [JSON.stringify(items), taskId, openid])
    } catch (_) { /* 回写失败不影响主流程 */ }
  }

  /**
   * 批量创建账单（图片识别结果导入）
   */
  async batchCreate(req, res, next) {
    try {
      const openid = req.headers['x-wx-openid']
      const { items } = req.body

      if (!Array.isArray(items) || items.length === 0) {
        throw { type: 'VALIDATION_ERROR', message: '账单列表不能为空' }
      }
      if (items.length > 50) {
        throw { type: 'VALIDATION_ERROR', message: '单次批量不超过 50 条' }
      }

      // 区分来源任务表（scan_tasks / voice_tasks），避免两表自增 id 撞号导致错挂来源图/错标已导入
      const importTaskId = parseInt(req.body.taskId)
      const taskTable = req.body.taskType === 'voice' ? 'voice_tasks' : 'scan_tasks'
      // 记账来源：用于「记一笔」时间线区分卡片；source_task_id 指向来源 task（无 taskId 则 null）
      const source = req.body.taskType === 'voice' ? 'voice' : 'scan'
      const sourceTaskId = importTaskId || null

      // 识图导入：取该任务的来源整图，作为每笔的 source_image（语音无来源图）
      let sourceImage = null
      if (importTaskId && taskTable === 'scan_tasks') {
        const db = require('../config/db')
        const [trows] = await db.execute(
          'SELECT image_url FROM scan_tasks WHERE id = ? AND openid = ?',
          [importTaskId, openid]
        )
        if (trows.length) sourceImage = trows[0].image_url || null
      }

      // 同日缺少 time 的条目按屏幕顺序「日末递减」合成 trade_time：
      // items 自上而下排列，截图最上(最新)一笔 → 23:59:59，依次 -1 秒，
      // 配合 getList 的 ORDER BY trade_time DESC 保证列表顺序与截图一致，修复倒序。
      const timelessSeen = {}
      const resolveTradeTime = (item) => {
        const t = typeof item.time === 'string' ? item.time.trim() : ''
        if (/^\d{1,2}:\d{2}$/.test(t)) {
          const [h, m] = t.split(':')
          return `${String(h).padStart(2, '0')}:${m}:00`
        }
        const n = timelessSeen[item.date] || 0
        timelessSeen[item.date] = n + 1
        const total = Math.max(0, 86399 - n)
        const hh = String(Math.floor(total / 3600)).padStart(2, '0')
        const mm = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
        const ss = String(total % 60).padStart(2, '0')
        return `${hh}:${mm}:${ss}`
      }

      const ids = []
      let skipped = 0           // 去重跳过条数（已存在 / 同批重复）
      let refundedSkipped = 0   // 退款条目跳过条数（即使前端误传也不入账）
      const seenHashes = new Set()
      // 按 _idx 记录每条结果，用于回写 task.result 的逐条 imported/skip_reason 标记
      const outcomeByIdx = {}   // { [idx]: 'created' | 'duplicate' | 'refunded' }
      const markOutcome = (item, outcome) => {
        if (Number.isInteger(item._idx)) outcomeByIdx[item._idx] = outcome
      }
      for (const item of items) {
        const { type, amount, category, category_id, date, note } = item

        // 退款条目兜底：一律不入账（前端默认已不勾选，这里防误传）
        if (item.refunded === true || item.refunded === 'true') {
          refundedSkipped++
          markOutcome(item, 'refunded')
          continue
        }

        if (![1, 2].includes(Number(type))) {
          throw { type: 'VALIDATION_ERROR', message: 'type 必须为 1(收入) 或 2(支出)' }
        }
        if (!category || !date) {
          throw { type: 'VALIDATION_ERROR', message: '缺少 category 或 date' }
        }
        if (!DATE_REGEX.test(date)) {
          throw { type: 'VALIDATION_ERROR', message: '日期格式错误，应为 YYYY-MM-DD' }
        }
        if (isNaN(Number(amount)) || Number(amount) <= 0) {
          throw { type: 'VALIDATION_ERROR', message: '金额必须大于 0' }
        }
        if (Number(amount) > 99999999.99) {
          throw { type: 'VALIDATION_ERROR', message: '金额不能超过 99999999.99' }
        }
        if (category_id && Number(category_id) > 0) {
          await transactionService.validateCategory(Number(category_id), openid, Number(type))
        }

        // 去重：同批内重复 或 库中已存在同指纹 → 跳过计数（仅导入路径拦截）
        const hash = transactionService._dedupHash(openid, date, Number(amount), Number(type), note || '')
        if (seenHashes.has(hash) || await transactionService.existsByDedup(openid, hash)) {
          skipped++
          markOutcome(item, 'duplicate')
          continue
        }
        seenHashes.add(hash)

        const result = await transactionService.create({
          openid,
          type: Number(type),
          amount: Number(amount),
          category,
          category_id: Number(category_id) || 0,
          date,
          note: note || '',
          tradeTime: resolveTradeTime(item),
          cropUrl: typeof item.crop_url === 'string' ? item.crop_url : null,
          sourceImage,
          source,
          sourceTaskId
        })
        ids.push(result.id)
        markOutcome(item, 'created')
      }

      if (importTaskId) {
        const db = require('../config/db')
        db.execute(`UPDATE ${taskTable} SET imported = 1 WHERE id = ? AND openid = ?`, [importTaskId, openid]).catch(() => {})
        // 逐条回写 result：imported=true(已入账) / false+skip_reason(去重·退款)，供时间线标记哪几条记了
        await this._writebackTaskResult(db, taskTable, importTaskId, openid, outcomeByIdx)
      }

      success(res, { ids, count: ids.length, skipped, refundedSkipped }, '批量记账成功')
    } catch (err) {
      next(err)
    }
  }

  /**
   * 删除账单
   */
  async delete(req, res, next) {
    try {
      // 提取参数
      const openid = req.headers['x-wx-openid']
      const { id } = req.body

      // 参数校验
      if (!id) {
        throw { type: 'VALIDATION_ERROR', message: '账单 ID 不能为空' }
      }

      // 调用 Service（含权限校验）
      await transactionService.delete(id, openid)

      // 返回响应
      success(res, null, '删除成功')
    } catch (err) {
      next(err)
    }
  }
}

module.exports = new TransactionController()
