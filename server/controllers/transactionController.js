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

      // 调用 Service
      const result = await transactionService.create({
        openid,
        type: Number(type),
        amount: Number(amount),
        category,
        category_id,
        date,
        note,
        group_id: finalGroupId
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
