const transactionService = require('../services/transactionService');
const { success } = require('../utils/response');

class TransactionController {
  /**
   * 创建账单接口
   * POST /api/transaction/create
   */
  async create(req, res, next) {
    try {
      const { type, amount, category, category_id, date, note, group_id, groupId } = req.body;
      // 这里的 openid 应该从网关 Header 获取 x-wx-openid，
      // 开发环境如果没有网关，可以通过 header 模拟或者 body 传入（仅限本地）
      const openid = req.headers['x-wx-openid'] || req.body.openid || 'test_openid';

      if (!amount || !category || !date) {
        throw { type: 'VALIDATION_ERROR', message: '缺少必要参数 (amount, category, date)' };
      }

      const result = await transactionService.create({
        openid,
        type,
        amount,
        category,
        category_id,
        date,
        note,
        group_id: group_id || groupId // 兼容两种命名
      });

      success(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 获取列表
   * GET /api/transaction/list
   */
  async list(req, res, next) {
    try {
        const openid = req.headers['x-wx-openid'] || req.query.openid || 'test_openid';
        const { startDate, endDate, category } = req.query; 
        const type = req.query.type ? parseInt(req.query.type) : 0;
        const list = await transactionService.getList(openid, { startDate, endDate, type, category });
        success(res, { list });
    } catch (err) {
        next(err);
    }
  }

  /**
   * 获取统计数据
   * GET /api/transaction/stats
   */
  async stats(req, res, next) {
    try {
      const openid = req.headers['x-wx-openid'] || req.query.openid || 'test_openid';
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw { type: 'VALIDATION_ERROR', message: '缺少必要参数 (startDate, endDate)' };
      }

      const stats = await transactionService.getStats(openid, startDate, endDate);
      success(res, stats);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 首页聚合接口
   * GET /api/transaction/dashboard
   */
  async dashboard(req, res, next) {
    try {
      const openid = req.headers['x-wx-openid'] || req.query.openid || 'test_openid';
      const { startDate, endDate } = req.query;
      const type = req.query.type ? parseInt(req.query.type) : 0;
      const scope = req.query.scope ? parseInt(req.query.scope) : 0; // 0: 个人; 1: 小组
      const groupId = req.query.groupId ? parseInt(req.query.groupId) : null;

      if (!startDate || !endDate) {
        throw { type: 'VALIDATION_ERROR', message: '缺少必要参数 (startDate, endDate)' };
      }

      // ⚠️ 修改 Service 调用，传入 scope 和 groupId
      const data = await transactionService.getDashboardData(openid, startDate, endDate, type, scope, groupId);
      success(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 获取近30天趋势数据
   * GET /api/transaction/trend
   */
  async trend(req, res, next) {
    try {
      const openid = req.headers['x-wx-openid'] || req.query.openid || 'test_openid';
      // 明确处理 type=0 的情况
      let type = 2;
      if (req.query.type !== undefined && req.query.type !== '') {
        type = parseInt(req.query.type);
      }
      
      const scope = req.query.scope ? parseInt(req.query.scope) : 0; // 0: 个人; 1: 小组
      const groupId = req.query.groupId ? parseInt(req.query.groupId) : null;

      console.log(`[Trend] Request: openid=${openid}, type=${type}, scope=${scope}, groupId=${groupId}`);

      const now = new Date();
      const formatDate = (d) => d.toISOString().split('T')[0];

      // 1. 本期：最近30天
      const currentEnd = formatDate(now);
      const currentStartObj = new Date();
      currentStartObj.setDate(now.getDate() - 29);
      const currentStart = formatDate(currentStartObj);

      // 2. 上期：再往前推30天
      const lastEndObj = new Date();
      lastEndObj.setDate(currentStartObj.getDate() - 1);
      const lastEnd = formatDate(lastEndObj);
      const lastStartObj = new Date();
      lastStartObj.setDate(lastEndObj.getDate() - 29);
      const lastStart = formatDate(lastStartObj);
      
      // ⚠️ 修改 Service 调用，传入 scope 和 groupId
      const promises = [
        transactionService.getStats(openid, currentStart, currentEnd, scope, groupId), 
        transactionService.getStats(openid, lastStart, lastEnd, scope, groupId),       
        // 暂时假设 dailyAvgCurve 也受 scope 影响
        transactionService.getHistoryDailyAverageCurve(openid, type, scope, groupId)         
      ];

      const [currentStatsRaw, lastStatsRaw, dailyAvgCurve] = await Promise.all(promises);
      
      // 根据 type 提取对应金额 (1-收入, 2-支出, 0-全部聚合)
      const extractAmount = (rows) => (rows || []).map(r => {
          let amt = 0;
          const typeNum = parseInt(type);
          if (typeNum === 1) amt = parseFloat(r.income || 0);
          else if (typeNum === 2) amt = parseFloat(r.expense || 0);
          else amt = parseFloat(r.income || 0) + parseFloat(r.expense || 0); 
          return {
              date: r.date,
              total_amount: amt
          };
      });

      const currentStats = extractAmount(currentStatsRaw);
      const lastStats = extractAmount(lastStatsRaw);

      // 计算上个30天的日均值
      const lastTotal = lastStats.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
      const lastAverage = lastTotal / 30;

      success(res, {
        current: currentStats,
        last: lastStats,
        dailyAverage: dailyAvgCurve,
        lastAverage: lastAverage,
        dateRange: {
            current: { start: currentStart, end: currentEnd },
            last: { start: lastStart, end: lastEnd }
        }
      });

    } catch (err) {
      next(err);
    }
  }

  /**
   * 统计分析接口
   * GET /api/transaction/analysis
   */
  async analysis(req, res, next) {
    try {
      const openid = req.headers['x-wx-openid'] || req.query.openid || 'test_openid';
      const { startDate, endDate } = req.query;
      const type = req.query.type ? parseInt(req.query.type) : 2; // 默认支出
      const scope = req.query.scope ? parseInt(req.query.scope) : 0;
      const groupId = req.query.groupId ? parseInt(req.query.groupId) : null;

      if (!startDate || !endDate) {
        throw { type: 'VALIDATION_ERROR', message: '缺少必要参数 (startDate, endDate)' };
      }

      const data = await transactionService.getAnalysis(openid, { startDate, endDate, type, scope, groupId });
      success(res, data);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const openid = req.headers['x-wx-openid'] || req.query.openid || 'test_openid';
      const { id } = req.body;
      console.log(`[Delete] Attempting to delete transaction. id: ${id}, openid: ${openid}`);
      
      if (!id) throw new Error('缺少账单ID');
      
      const result = await transactionService.delete(id, openid);
      console.log(`[Delete] Service result: ${result}`);

      if (result) {
        res.json({ code: 0, message: '删除成功' });
      } else {
        res.json({ code: 1, message: '删除失败或无权限' });
      }
    } catch (err) {
      console.error(`[Delete] Error:`, err);
      next(err);
    }
  }
}

module.exports = new TransactionController();
