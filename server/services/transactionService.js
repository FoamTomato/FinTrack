const db = require('../config/db')

class TransactionService {
  /**
   * 校验分类归属和有效性
   */
  async validateCategory(categoryId, openid, type) {
    const [rows] = await db.execute(
      'SELECT id, type FROM categories WHERE id = ? AND openid = ? AND is_deleted = 0',
      [categoryId, openid]
    )
    if (rows.length === 0) {
      throw { type: 'VALIDATION_ERROR', message: '分类不存在或无权使用' }
    }
    if (rows[0].type !== type) {
      throw { type: 'VALIDATION_ERROR', message: '分类类型与交易类型不匹配' }
    }
  }

  /**
   * 创建账单
   */
  async create(data) {
    // 插入账单记录
    const sql = `INSERT INTO transactions (openid, type, amount, category, category_id, date, note, group_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    const [result] = await db.execute(sql, [
      data.openid, data.type, data.amount, data.category,
      data.category_id || 0, data.date, data.note, data.group_id || null
    ])

    // 更新分类使用频率
    if (data.category_id && data.category_id > 0) {
      const statsSql = `INSERT INTO category_usage_stats (openid, category_id, usage_count)
        VALUES (?, ?, 1)
        ON DUPLICATE KEY UPDATE usage_count = usage_count + 1`
      await db.execute(statsSql, [data.openid, data.category_id])
    }

    return { id: result.insertId }
  }

  /**
   * 删除账单（含权限校验）
   */
  async delete(id, openid) {
    // 查询记录是否存在且属于当前用户
    const [rows] = await db.execute(
      'SELECT id FROM transactions WHERE id = ? AND openid = ?',
      [id, openid]
    )
    if (rows.length === 0) {
      throw new Error('记录不存在或无权删除')
    }

    // 执行删除
    await db.execute('DELETE FROM transactions WHERE id = ?', [id])
  }

  /**
   * 构建范围筛选条件（个人/小组）
   */
  _buildScopeFilter(openid, scope, groupId, tableAlias = '') {
    const prefix = tableAlias ? `${tableAlias}.` : ''
    const conditions = []
    const params = []

    if (scope === 1 && groupId) {
      conditions.push(`(${prefix}group_id = ? OR ${prefix}openid IN (SELECT openid COLLATE utf8mb4_unicode_ci FROM group_members WHERE group_id = ?))`)
      params.push(groupId, groupId)
    } else {
      conditions.push(`${prefix}openid = ?`)
      params.push(openid)
    }

    return { conditions, params }
  }

  /**
   * 获取列表（支持筛选）
   */
  async getList(openid, params = {}) {
    const { startDate, endDate, type, scope, groupId, page = 1, pageSize = 50 } = params

    // 构建查询条件
    const filter = this._buildScopeFilter(openid, scope, groupId, 't')
    const conditions = [...filter.conditions]
    const queryParams = [...filter.params]

    if (startDate) {
      conditions.push('t.date >= ?')
      queryParams.push(startDate)
    }
    if (endDate) {
      conditions.push('t.date <= ?')
      queryParams.push(endDate)
    }
    if (type == 1 || type == 2) {
      conditions.push('t.type = ?')
      queryParams.push(type)
    }

    // 分页参数（直接嵌入，因为 mysql2 execute 对 LIMIT/OFFSET 参数化支持有问题）
    const offset = (page - 1) * pageSize

    // 执行查询
    const sql = `SELECT t.id, t.type, t.amount, t.openid,
        COALESCE(c.name, t.category) as category,
        c.icon,
        u.nickname as creatorName,
        u.avatar_url as creatorAvatar,
        DATE_FORMAT(t.date, '%Y-%m-%d') as date, t.note, t.created_at
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id AND c.is_deleted = 0
      LEFT JOIN users u ON t.openid = u.openid
      WHERE ${conditions.join(' AND ')}
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}`

    const [rows] = await db.execute(sql, queryParams)
    return rows
  }

  /**
   * 获取日汇总数据（用于日历展示）
   */
  async getStats(openid, startDate, endDate, scope = 0, groupId = null) {
    // 构建查询条件
    const filter = this._buildScopeFilter(openid, scope, groupId)
    const conditions = ['date BETWEEN ? AND ?', ...filter.conditions]
    const queryParams = [startDate, endDate, ...filter.params]

    // 执行查询
    const sql = `SELECT
        DATE_FORMAT(date, '%Y-%m-%d') as date,
        SUM(CASE WHEN type = 1 THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 2 THEN amount ELSE 0 END) as expense
      FROM transactions
      WHERE ${conditions.join(' AND ')}
      GROUP BY date
      ORDER BY date ASC`

    const [rows] = await db.execute(sql, queryParams)
    return rows
  }

  /**
   * 获取首页仪表盘数据（统一接口）
   */
  async getDashboardData(openid, startDate, endDate, type = 0, scope = 0, groupId = null) {
    // 构建总收支统计条件
    const filter = this._buildScopeFilter(openid, scope, groupId)
    const summaryConditions = ['date BETWEEN ? AND ?', ...filter.conditions]
    const summaryParams = [startDate, endDate, ...filter.params]

    const summarySql = `SELECT
        SUM(CASE WHEN type = 1 THEN amount ELSE 0 END) as totalIncome,
        SUM(CASE WHEN type = 2 THEN amount ELSE 0 END) as totalExpense
      FROM transactions
      WHERE ${summaryConditions.join(' AND ')}`

    // 并行查询列表、日汇总、总收支
    const [list, stats, [summaryResult]] = await Promise.all([
      this.getList(openid, { startDate, endDate, type, scope, groupId }),
      this.getStats(openid, startDate, endDate, scope, groupId),
      db.execute(summarySql, summaryParams)
    ])

    const summary = summaryResult[0] || { totalIncome: 0, totalExpense: 0 }

    return {
      list,
      stats,
      summary: {
        totalIncome: parseFloat(summary.totalIncome || 0),
        totalExpense: parseFloat(summary.totalExpense || 0)
      }
    }
  }

  /**
   * 获取历史每日均值曲线
   */
  async getHistoryDailyAverageCurve(openid, type = 2, scope = 0, groupId = null) {
    // 构建查询条件
    const filter = this._buildScopeFilter(openid, scope, groupId)
    const conditions = [...filter.conditions]
    const queryParams = [...filter.params]

    // 类型筛选（参数化查询防注入）
    if (type == 1 || type == 2) {
      conditions.push('type = ?')
      queryParams.push(Number(type))
    }

    // 执行查询
    const sql = `SELECT
        DAY(date) as day,
        AVG(daily_amount) as avg_amount
      FROM (
        SELECT date, SUM(amount) as daily_amount
        FROM transactions
        WHERE ${conditions.join(' AND ')}
        GROUP BY date
      ) as t
      GROUP BY day
      ORDER BY day ASC`

    const [rows] = await db.execute(sql, queryParams)
    return rows
  }

  /**
   * 获取近30天趋势数据（含本期/上期对比和日均曲线）
   */
  async getTrendData(openid, params = {}) {
    const { type = 2, scope = 0, groupId = null } = params

    // 计算日期范围
    const now = new Date()
    const formatDate = (d) => d.toISOString().split('T')[0]

    const currentEnd = formatDate(now)
    const currentStartObj = new Date()
    currentStartObj.setDate(now.getDate() - 29)
    const currentStart = formatDate(currentStartObj)

    const lastEndObj = new Date()
    lastEndObj.setDate(currentStartObj.getDate() - 1)
    const lastEnd = formatDate(lastEndObj)
    const lastStartObj = new Date()
    lastStartObj.setDate(lastEndObj.getDate() - 29)
    const lastStart = formatDate(lastStartObj)

    // 并行查询本期、上期和日均曲线
    const [currentStatsRaw, lastStatsRaw, dailyAvgCurve] = await Promise.all([
      this.getStats(openid, currentStart, currentEnd, scope, groupId),
      this.getStats(openid, lastStart, lastEnd, scope, groupId),
      this.getHistoryDailyAverageCurve(openid, type, scope, groupId)
    ])

    // 根据 type 提取对应金额
    const extractAmount = (rows) => (rows || []).map(r => {
      const typeNum = parseInt(type)
      let amt = 0
      if (typeNum === 1) amt = parseFloat(r.income || 0)
      else if (typeNum === 2) amt = parseFloat(r.expense || 0)
      else amt = parseFloat(r.income || 0) + parseFloat(r.expense || 0)
      return { date: r.date, total_amount: amt }
    })

    const currentStats = extractAmount(currentStatsRaw)
    const lastStats = extractAmount(lastStatsRaw)

    // 计算上期日均值
    const lastTotal = lastStats.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0)
    const lastAverage = lastTotal / 30

    return {
      current: currentStats,
      last: lastStats,
      dailyAverage: dailyAvgCurve,
      lastAverage,
      dateRange: {
        current: { start: currentStart, end: currentEnd },
        last: { start: lastStart, end: lastEnd }
      }
    }
  }

  /**
   * 获取收支统计分析
   */
  async getAnalysis(openid, params = {}) {
    const { startDate, endDate, type = 2, scope = 0, groupId = null } = params

    // 构建查询条件
    const filter = this._buildScopeFilter(openid, scope, groupId, 't')
    const conditions = [...filter.conditions]
    const queryParams = [...filter.params]

    if (startDate) {
      conditions.push('t.date >= ?')
      queryParams.push(startDate)
    }
    if (endDate) {
      conditions.push('t.date <= ?')
      queryParams.push(endDate)
    }
    conditions.push('t.type = ?')
    queryParams.push(type)

    // 查询数据（关联分类表取层级关系）
    // 聚合用 global_id 优先，相同名字的分类（跨成员/跨用户）自动合并
    const sql = `SELECT
        t.amount,
        t.category as trans_category_name,
        c.id as cid, c.global_id as cgid, c.name as cname, c.parent_id, c.icon as cicon,
        pc.id as pid, pc.global_id as pgid, pc.name as pname, pc.icon as picon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id AND c.is_deleted = 0
      LEFT JOIN categories pc ON c.parent_id = pc.id AND pc.is_deleted = 0
      WHERE ${conditions.join(' AND ')}`

    const [rows] = await db.execute(sql, queryParams)

    // 在内存中聚合计算
    const { totalAmount, categoryMap } = this._aggregateAnalysis(rows)

    // 格式化输出
    const list = this._formatAnalysisList(categoryMap, totalAmount)

    return { total: totalAmount.toFixed(2), list }
  }

  /**
   * 聚合分析数据（内部方法）
   */
  _aggregateAnalysis(rows) {
    let totalAmount = 0
    const categoryMap = {}

    for (const r of rows) {
      const amount = parseFloat(r.amount)
      totalAmount += amount

      // 确定父级分类（优先用 global_id 聚合，跨用户同名归一；fallback 到本地 id / 名称）
      let parentKey, parentName, parentIcon
      if (r.parent_id && r.parent_id > 0 && r.pid) {
        parentKey = r.pgid ? `g:${r.pgid}` : `l:${r.pid}`
        parentName = r.pname
        parentIcon = r.picon || ''
      } else if (r.cid) {
        parentKey = r.cgid ? `g:${r.cgid}` : `l:${r.cid}`
        parentName = r.cname
        parentIcon = r.cicon || ''
      } else {
        parentKey = `n:${r.trans_category_name || 'other'}`
        parentName = r.trans_category_name || '其他'
        parentIcon = ''
      }

      // 确定子分类（同样优先用 global_id）
      const subKey = r.cid
        ? (r.cgid ? `g:${r.cgid}` : `l:${r.cid}`)
        : `n:${r.trans_category_name || 'unknown'}`
      const subName = r.cname || r.trans_category_name || '其他'

      // 初始化并累加
      if (!categoryMap[parentKey]) {
        categoryMap[parentKey] = { id: parentKey, name: parentName, icon: parentIcon, amount: 0, itemsMap: {} }
      }
      const pNode = categoryMap[parentKey]
      pNode.amount += amount

      if (!pNode.itemsMap[subKey]) {
        pNode.itemsMap[subKey] = { name: subName, amount: 0 }
      }
      pNode.itemsMap[subKey].amount += amount
    }

    return { totalAmount, categoryMap }
  }

  /**
   * 格式化分析列表（内部方法）
   */
  _formatAnalysisList(categoryMap, totalAmount) {
    return Object.values(categoryMap).map(p => {
      const pPercent = totalAmount === 0 ? 0 : (p.amount / totalAmount * 100).toFixed(1)

      const items = Object.values(p.itemsMap).map(s => ({
        name: s.name,
        amount: s.amount.toFixed(2),
        percent: p.amount === 0 ? 0 : (s.amount / p.amount * 100).toFixed(1)
      })).sort((a, b) => b.amount - a.amount)

      return {
        name: p.name,
        amount: p.amount.toFixed(2),
        percent: pPercent,
        icon: p.icon,
        items
      }
    }).sort((a, b) => b.amount - a.amount)
  }
}

module.exports = new TransactionService()
