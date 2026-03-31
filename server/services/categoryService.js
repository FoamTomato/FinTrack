const db = require('../config/db')

class CategoryService {
  /**
   * 初始化用户默认分类（如果不存在）
   */
  async initDefaultCategories(openid) {
    // 检查是否已有分类
    const [rows] = await db.execute(
      'SELECT COUNT(*) as count FROM categories WHERE openid = ? AND is_deleted = 0',
      [openid]
    )
    if (rows[0].count > 0) return true

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
        children: [
          { name: '基本工资', icon: '💵' },
          { name: '奖金绩效', icon: '📈' }
        ]
      }
    ]

    // 逐级插入父分类和子分类
    for (const parent of defaultData) {
      const [res] = await db.execute(
        'INSERT INTO categories (openid, name, type, parent_id, icon, is_default) VALUES (?, ?, ?, 0, ?, 1)',
        [openid, parent.name, parent.type, parent.icon]
      )
      const parentId = res.insertId

      if (parent.children) {
        for (const child of parent.children) {
          await db.execute(
            'INSERT INTO categories (openid, name, type, parent_id, icon, is_default) VALUES (?, ?, ?, ?, ?, 1)',
            [openid, child.name, parent.type, parentId, child.icon]
          )
        }
      }
    }

    return true
  }

  /**
   * 获取用户分类列表（树状结构）
   */
  async getTree(openid, type) {
    // 确保有默认分类
    await this.initDefaultCategories(openid)

    // 构建查询条件
    const conditions = ['c.openid = ?', 'c.is_deleted = 0']
    const params = [openid, openid]

    if (type) {
      conditions.push('c.type = ?')
      params.push(type)
    }

    // 查询分类（含使用频率）
    const sql = `SELECT c.*, COALESCE(s.usage_count, 0) as usage_count
      FROM categories c
      LEFT JOIN category_usage_stats s ON c.id = s.category_id AND s.openid = ?
      WHERE ${conditions.join(' AND ')}
      ORDER BY usage_count DESC, c.sort_order ASC, c.created_at DESC`

    const [rows] = await db.execute(sql, params)

    // 组装树形结构
    const rootNodes = rows.filter(r => r.parent_id == 0)
    return rootNodes.map(root => ({
      ...root,
      children: rows.filter(r => r.parent_id == root.id)
    }))
  }

  /**
   * 获取扁平列表（支持按 parentId 筛选）
   */
  async getList(openid, params) {
    // 构建查询条件
    const conditions = ['openid = ?', 'is_deleted = 0']
    const queryParams = [openid]

    if (params.parentId !== undefined) {
      conditions.push('parent_id = ?')
      queryParams.push(params.parentId)
    }

    // 执行查询
    const sql = `SELECT * FROM categories
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC`

    const [rows] = await db.execute(sql, queryParams)
    return rows
  }

  /**
   * 创建分类
   */
  async create(data) {
    // 校验父分类归属和类型匹配
    if (data.parentId) {
      const [rows] = await db.execute(
        'SELECT id, type FROM categories WHERE id = ? AND openid = ? AND is_deleted = 0',
        [data.parentId, data.openid]
      )
      if (rows.length === 0) {
        throw { type: 'VALIDATION_ERROR', message: '父分类不存在或无权使用' }
      }
      if (rows[0].type !== data.type) {
        throw { type: 'VALIDATION_ERROR', message: '子分类类型必须与父分类一致' }
      }
    }

    // 插入分类记录
    const sql = 'INSERT INTO categories (openid, name, type, parent_id, icon) VALUES (?, ?, ?, ?, ?)'
    const [res] = await db.execute(sql, [
      data.openid, data.name, data.type, data.parentId || 0, data.icon || ''
    ])
    return { id: res.insertId }
  }

  /**
   * 更新分类
   */
  async update(id, openid, data) {
    const [res] = await db.execute(
      'UPDATE categories SET name = ?, icon = ?, sort_order = ? WHERE id = ? AND openid = ?',
      [data.name, data.icon || '', data.sortOrder || 0, id, openid]
    )
    return res.affectedRows > 0
  }

  /**
   * 删除分类（逻辑删除，子分类一并处理）
   */
  async delete(id, openid) {
    // 逻辑删除子分类
    await db.execute(
      'UPDATE categories SET is_deleted = 1 WHERE parent_id = ? AND openid = ?',
      [id, openid]
    )

    // 逻辑删除自身
    const [res] = await db.execute(
      'UPDATE categories SET is_deleted = 1 WHERE id = ? AND openid = ?',
      [id, openid]
    )
    return res.affectedRows > 0
  }
}

module.exports = new CategoryService()
