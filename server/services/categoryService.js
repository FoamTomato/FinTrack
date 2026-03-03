const db = require('../config/db');

class CategoryService {
  /**
   * 初始化用户默认分类 (如果不存在)
   */
  async initDefaultCategories(openid) {
    // 检查是否已存在分类 (排除已删除的)
    const sql = `SELECT COUNT(*) as count FROM categories WHERE openid = ? AND is_deleted = 0`;
    const [rows] = await db.execute(sql, [openid]);
    
    if (rows[0].count > 0) return true; // 已存在，无需初始化

    // 默认两级分类结构
    const defaultData = [
      { 
        name: '餐饮', type: 2, icon: '🍔', 
        children: [
          { name: '早午晚餐', icon: '🍛' },
          { name: '饮料水果', icon: '🍎' },
          { name: '零食小吃', icon: '🍪' }
        ]
      },
      { 
        name: '交通', type: 2, icon: '🚗', 
        children: [
          { name: '公共交通', icon: '🚌' },
          { name: '打车代驾', icon: '🚕' },
          { name: '自费加油', icon: '⛽' }
        ]
      },
      { 
        name: '工资', type: 1, icon: '💰',
        children: [{ name: '基本工资', icon: '💵' }, { name: '奖金绩效', icon: '📈' }]
      }
    ];

    for (let parent of defaultData) {
      const [res] = await db.execute(
        `INSERT INTO categories (openid, name, type, parent_id, icon, is_default) VALUES (?, ?, ?, 0, ?, 1)`,
        [openid, parent.name, parent.type, parent.icon || '🏷️']
      );
      const parentId = res.insertId;
      
      if (parent.children) {
        for (let child of parent.children) {
          await db.execute(
            `INSERT INTO categories (openid, name, type, parent_id, icon, is_default) VALUES (?, ?, ?, ?, ?, 1)`,
            [openid, child.name, parent.type, parentId, child.icon || '📍']
          );
        }
      }
    }
    return true;
  }

  /**
   * 获取用户分类列表 (树状结构)
   */
  async getTree(openid, type) {
    // 确保有默认分类
    await this.initDefaultCategories(openid);

    let sql = `
      SELECT c.*, COALESCE(s.usage_count, 0) as usage_count 
      FROM categories c
      LEFT JOIN category_usage_stats s ON c.id = s.category_id AND s.openid = ?
      WHERE c.openid = ? AND c.is_deleted = 0
    `;
    const params = [openid, openid];
    
    if (type) {
      sql += ` AND c.type = ?`;
      params.push(type);
    }
    
    // 排序优先级: 1.使用频率倒序 2.自定义排序正序 3.创建时间倒序
    sql += ` ORDER BY usage_count DESC, c.sort_order ASC, c.created_at DESC`;

    const [rows] = await db.execute(sql, params);

    // 组装树形结构
    const rootNodes = rows.filter(r => r.parent_id == 0);
    const result = rootNodes.map(root => {
      const children = rows.filter(r => r.parent_id == root.id);
      return {
        ...root,
        children: children.length > 0 ? children : [] 
      };
    });

    return result;
  }

  /**
   * 获取扁平列表 (支持按 parentId 筛选)
   */
  async getList(openid, params) {
    let sql = `SELECT * FROM categories WHERE openid = ? AND is_deleted = 0`;
    const queryParams = [openid];

    if (params.parentId !== undefined) {
      sql += ` AND parent_id = ?`;
      queryParams.push(params.parentId);
    }
    
    // 依然按时间倒序
    sql += ` ORDER BY created_at DESC`;

    const [rows] = await db.execute(sql, queryParams);
    return rows;
  }

  /**
   * 创建分类
   */
  async create(data) {
    const { openid, name, type, parentId, icon } = data;
    const sql = `INSERT INTO categories (openid, name, type, parent_id, icon) VALUES (?, ?, ?, ?, ?)`;
    const [res] = await db.execute(sql, [openid, name, type, parentId || 0, icon || '']);
    return { id: res.insertId };
  }

  /**
   * 更新分类
   */
  async update(id, openid, data) {
    const { name, icon, sortOrder } = data;
    const [res] = await db.execute(
      `UPDATE categories SET name = ?, icon = ?, sort_order = ? WHERE id = ? AND openid = ?`,
      [name, icon || '', sortOrder || 0, id, openid]
    );
    return res.affectedRows > 0;
  }

  /**
   * 删除分类 (逻辑删除，子分类一并处理)
   */
  async delete(id, openid) {
    // 逻辑删除子分类
    await db.execute(`UPDATE categories SET is_deleted = 1 WHERE parent_id = ? AND openid = ?`, [id, openid]);
    // 逻辑删除自己
    const [res] = await db.execute(`UPDATE categories SET is_deleted = 1 WHERE id = ? AND openid = ?`, [id, openid]);
    return res.affectedRows > 0;
  }
}

module.exports = new CategoryService();
