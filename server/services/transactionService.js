const db = require('../config/db');

class TransactionService {
  /**
   * 创建账单
   */
  async create(data) {
    const { openid, type, amount, category, category_id, date, note, group_id } = data;
    // 如果有 group_id，则插入 group_id
    const sql = `
      INSERT INTO transactions (openid, type, amount, category, category_id, date, note, group_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(sql, [
       openid, 
       type, 
       amount, 
       category, 
       category_id || 0, 
       date, 
       note, 
       group_id || null // 如果无 group_id 则置空
    ]);
    
    // 更新分类使用频率
    if (category_id && category_id > 0) {
      const statsSql = `
        INSERT INTO category_usage_stats (openid, category_id, usage_count)
        VALUES (?, ?, 1)
        ON DUPLICATE KEY UPDATE usage_count = usage_count + 1
      `;
      await db.execute(statsSql, [openid, category_id]);
    }

    return { id: result.insertId };
  }

  /**
   * 删除账单
   */
  async delete(id, openid) {
    const sql = `DELETE FROM transactions WHERE id = ? AND openid = ?`;
    const [result] = await db.execute(sql, [id, openid]);
    return result.affectedRows > 0;
  }

  /**
   * 获取目标表名 (0: 个人 -> transactions, 1: 小组 -> transactions)
   * 修正：不再区分表名，统一使用 transactions 表 (v2_feature_support.sql 中是 ALTER TABLE)
   */
  getTableName(scope = 0) {
    return 'transactions';
  }

  /**
   * 获取列表 (支持筛选)
   */
  async getList(openid, params = {}) {
    const { startDate, endDate, type, category, scope, groupId } = params;
    const table = this.getTableName(scope);

    // 构建基础 SQL
    // ⚠️ LEFT JOIN users 表获取创建人信息 (头像/昵称)
    let sql = `
      SELECT t.id, t.type, t.amount, t.openid,
             COALESCE(c.name, t.category) as category, 
             c.icon,
             u.nickname as creatorName,
             u.avatar_url as creatorAvatar,
             DATE_FORMAT(t.date, '%Y-%m-%d') as date, t.note, t.created_at 
      FROM ${table} t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users u ON t.openid = u.openid
      WHERE 1=1 
    `;
    const queryParams = [];

    // 权限/范围控制
    if (scope === 1 && groupId) {
      // 小组模式：查询小组内所有成员的账单
      // 逻辑：transactions.openid IN (SELECT openid FROM group_members WHERE group_id = ?)
      // 或者直接用 group_id (兼容新数据)
      // ⚠️ 增加 COLLATE utf8mb4_unicode_ci 解决 Illegal mix of collations
      sql += ` AND (t.group_id = ? OR t.openid IN (SELECT openid COLLATE utf8mb4_unicode_ci FROM group_members WHERE group_id = ?))`;
      queryParams.push(groupId, groupId);
    } else {
      // 个人模式：查询我的账单
      sql += ` AND t.openid = ?`;
      queryParams.push(openid);
    }

    if (startDate) {
      sql += ` AND t.date >= ?`;
      queryParams.push(startDate);
    }
    if (endDate) {
      sql += ` AND t.date <= ?`;
      queryParams.push(endDate);
    }
    if (type == 1 || type == 2) {
      sql += ` AND t.type = ?`;
      queryParams.push(type);
    }
    // ... 其他筛选可以继续加

    sql += ` ORDER BY t.date DESC, t.created_at DESC LIMIT 50`; 

    const [rows] = await db.execute(sql, queryParams);
    return rows;
  }

  /**
   * 获取日汇总数据 (用于日历展示)
   */
  async getStats(openid, startDate, endDate, scope = 0, groupId = null) {
    const table = this.getTableName(scope);
    
    let sql = `
      SELECT 
        DATE_FORMAT(date, '%Y-%m-%d') as date, 
        SUM(CASE WHEN type = 1 THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 2 THEN amount ELSE 0 END) as expense
      FROM ${table} 
      WHERE date BETWEEN ? AND ?
    `;
    const params = [startDate, endDate];

    if (scope === 1 && groupId) {
        // 小组模式：查询小组内所有成员的账单
        // ⚠️ 增加 COLLATE utf8mb4_unicode_ci 解决 Illegal mix of collations
        sql += ` AND (group_id = ? OR openid IN (SELECT openid COLLATE utf8mb4_unicode_ci FROM group_members WHERE group_id = ?))`;
        params.push(groupId, groupId);
    } else {
        // 个人模式
        sql += ` AND openid = ?`;
        params.push(openid);
    }

    sql += `
      GROUP BY date
      ORDER BY date ASC
    `;
    const [rows] = await db.execute(sql, params);
    return rows; 
  }

  /**
   * 获取首页仪表盘数据 (统一接口)
   */
  async getDashboardData(openid, startDate, endDate, type = 0, scope = 0, groupId = null) {
    const table = this.getTableName(scope);
    
    // 1. 列表查询 promise (type=0 则查询全部)
    const listPromise = this.getList(openid, { startDate, endDate, type, scope, groupId });

    // 2. 日汇总统计 (用于日历和趋势)
    const statsPromise = this.getStats(openid, startDate, endDate, scope, groupId);

    // 3. 总收支统计 promise (不受 type 筛选影响，始终显示总额)
    let summarySql = `
      SELECT 
        SUM(CASE WHEN type = 1 THEN amount ELSE 0 END) as totalIncome,
        SUM(CASE WHEN type = 2 THEN amount ELSE 0 END) as totalExpense
      FROM ${table} 
      WHERE date BETWEEN ? AND ?
    `;
    const summaryParams = [startDate, endDate];

    if (scope === 1 && groupId) {
        // ⚠️ 增加 COLLATE utf8mb4_unicode_ci 解决 Illegal mix of collations
        summarySql += ` AND (group_id = ? OR openid IN (SELECT openid COLLATE utf8mb4_unicode_ci FROM group_members WHERE group_id = ?))`;
        summaryParams.push(groupId, groupId);
    } else {
        summarySql += ` AND openid = ?`;
        summaryParams.push(openid);
    }

    // db.execute 不支持直接拼接表名占位符，必须字符串拼接
    const [summaryResult] = await db.execute(summarySql, summaryParams);

    // 并发执行
    const [list, stats] = await Promise.all([listPromise, statsPromise]);
    
    const summary = summaryResult[0] || { totalIncome: 0, totalExpense: 0 };

    return {
      list: list,
      stats: stats,
      summary: {
        totalIncome: parseFloat(summary.totalIncome || 0),
        totalExpense: parseFloat(summary.totalExpense || 0)
      }
    };
  }

  /**
   * 获取历史上每个月的同一天的均值分布
   * @param {string} openid 
   * @param {number} type 1-收入, 2-支出
   * @param {number} scope 0-个人, 1-小组
   */
  async getHistoryDailyAverageCurve(openid, type = 2, scope = 0, groupId = null) {
    const table = this.getTableName(scope);
    
    let typeSql = '';
    // type=0 表示全部，这里如果不传 type 筛选，就是计算所有类型的平均值（可能没意义），或者 specifically for expense?
    // 通常趋势图只看支出或收入。如果 type=0，可能需要 default 2? 
    // 上层 Controller 默认传了 type (query.type || 2), 如果 query.type=0, 那么 type=0.
    if (type == 1 || type == 2) {
      typeSql = `AND type = ${type}`; 
    }

    let filterSql = '';
    const params = [];

    if (scope === 1 && groupId) {
        // ⚠️ 增加 COLLATE utf8mb4_unicode_ci 解决 Illegal mix of collations
        filterSql = `AND (group_id = ? OR openid IN (SELECT openid COLLATE utf8mb4_unicode_ci FROM group_members WHERE group_id = ?))`;
        params.push(groupId, groupId);
    } else {
        filterSql = `AND openid = ?`;
        params.push(openid);
    }

    const sql = `
      SELECT 
        DAY(date) as day, 
        AVG(daily_amount) as avg_amount
      FROM (
        SELECT date, SUM(amount) as daily_amount
        FROM ${table}
        WHERE 1=1 ${filterSql} ${typeSql}
        GROUP BY date
      ) as t
      GROUP BY day
      ORDER BY day ASC
    `;
    const [rows] = await db.execute(sql, params);
    return rows;
  }

  /**
   * 获取收支统计分析
   */
  async getAnalysis(openid, params = {}) {
    const { startDate, endDate, type = 2, scope = 0, groupId = null } = params;
    const table = this.getTableName(scope);

    // 构建筛选条件
    let filterSql = '';
    const queryParams = [];

    // 1. 范围筛选
    if (scope === 1 && groupId) {
        // ⚠️ 增加 COLLATE utf8mb4_unicode_ci 解决 Illegal mix of collations
        filterSql += ` AND (t.group_id = ? OR t.openid IN (SELECT openid COLLATE utf8mb4_unicode_ci FROM group_members WHERE group_id = ?))`;
        queryParams.push(groupId, groupId);
    } else {
        filterSql += ` AND t.openid = ?`;
        queryParams.push(openid);
    }

    // 2. 日期筛选
    if (startDate) {
        filterSql += ` AND t.date >= ?`;
        queryParams.push(startDate);
    }
    if (endDate) {
        filterSql += ` AND t.date <= ?`;
        queryParams.push(endDate);
    }

    // 3. 类型筛选 (默认支出)
    filterSql += ` AND t.type = ?`;
    queryParams.push(type);

    // 查询数据 (关联分类表取层级关系) - 注意这里 LEFT JOIN 两次 categories
    // c 是当前分类，pc 是父级分类
    // 如果 c.parent_id > 0，则 pc 存在，主分类是 pc
    // 如果 c.parent_id = 0，则 pc 不存在 (id=null)，主分类是 c
    const sql = `
      SELECT 
        t.amount, 
        t.category as trans_category_name,
        c.id as cid, 
        c.name as cname, 
        c.parent_id,
        c.icon as cicon,
        pc.id as pid,
        pc.name as pname,
        pc.icon as picon
      FROM ${table} t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN categories pc ON c.parent_id = pc.id
      WHERE 1=1 ${filterSql}
    `;

    const [rows] = await db.execute(sql, queryParams);

    // 聚合计算 (在内存中处理，比写复杂SQL更灵活)
    let totalAmount = 0;
    const categoryMap = {};

    for (const r of rows) {
        const amount = parseFloat(r.amount);
        totalAmount += amount;
        
        // 确定父级分类 (归类依据)
        let parentKey = 'other';
        let parentName = '其他';
        let parentIcon = '🏷️';
        
        if (r.parent_id && r.parent_id > 0 && r.pid) { 
            // CASE A: 二级分类 -> 归属到父级
            parentKey = r.pid;
            parentName = r.pname;
            parentIcon = r.picon || '🏷️';
        } else if (r.cid) { 
            // CASE B: 一级分类 -> 归属到自己
            parentKey = r.cid;
            parentName = r.cname;
            parentIcon = r.cicon || '🏷️'; 
        } else {
            // CASE C: 无关联分类 -> 使用 transaction.category 名字
            parentKey = r.trans_category_name || 'other';
            parentName = r.trans_category_name || '其他';
        }
        
        // 确定子分类 (显示项)
        let subKey = r.cid ? r.cid : (r.trans_category_name || 'unknown'); 
        let subName = r.cname || r.trans_category_name || '其他';

        // 初始化
        if (!categoryMap[parentKey]) {
            categoryMap[parentKey] = {
                id: parentKey,
                name: parentName,
                icon: parentIcon,
                amount: 0,
                itemsMap: {} // 暂存子分类
            };
        }

        const pNode = categoryMap[parentKey];
        pNode.amount += amount;

        if (!pNode.itemsMap[subKey]) {
            pNode.itemsMap[subKey] = {
                name: subName,
                amount: 0
            };
        }
        pNode.itemsMap[subKey].amount += amount;
    }

    // 格式化输出列表
    const list = Object.values(categoryMap).map(p => {
        const pPercent = totalAmount === 0 ? 0 : (p.amount / totalAmount * 100).toFixed(1);
        
        const subList = Object.values(p.itemsMap).map(s => ({
            name: s.name,
            amount: s.amount.toFixed(2),
            percent: p.amount === 0 ? 0 : (s.amount / p.amount * 100).toFixed(1)
        })).sort((a, b) => b.amount - a.amount);

        return {
            name: p.name,
            amount: p.amount.toFixed(2),
            percent: pPercent,
            icon: p.icon,
            items: subList
        };
    }).sort((a, b) => b.amount - a.amount);

    return {
        total: totalAmount.toFixed(2),
        list: list
    };
  }
}
 
module.exports = new TransactionService();

