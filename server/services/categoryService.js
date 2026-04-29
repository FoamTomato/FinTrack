const db = require('../config/db')
const defaultCategories = require('./defaultCategories')
const { isDefaultEnabled } = require('./defaultEnabled')

// 进程内缓存：本次进程已为哪些 openid 完成过补齐，避免每次拉树都重跑
const seededOpenids = new Set()

class CategoryService {
  /**
   * 查询或创建全局分类映射 ID（去重纽带）
   * 同名 (name, type, parentGlobalId) 跨用户共享同一个 global_id
   */
  async _getOrCreateGlobalId(name, type, parentGlobalId = 0, icon = '', isDefault = 0) {
    const [rows] = await db.execute(
      'SELECT id FROM category_global_map WHERE name = ? AND type = ? AND parent_global_id = ?',
      [name, type, parentGlobalId]
    )
    if (rows.length > 0) return rows[0].id

    const [res] = await db.execute(
      'INSERT INTO category_global_map (name, type, parent_global_id, icon, is_default) VALUES (?, ?, ?, ?, ?)',
      [name, type, parentGlobalId, icon || '', isDefault]
    )
    return res.insertId
  }

  /**
   * 初始化（或补齐）用户默认分类
   * 幂等：父按 (openid, type, name) 同名跳过，子按 (openid, parent_id, name) 同名跳过
   * 已存在但被逻辑删除的视为存在，不会重新插入（尊重用户删除意愿）
   * 新插入时会回填 global_id；老数据 global_id 为 NULL 时也补齐
   */
  async initDefaultCategories(openid) {
    // 一次性查出该用户全部分类（含已删除），避免循环里重复查询
    const [existing] = await db.execute(
      'SELECT id, name, type, parent_id, global_id FROM categories WHERE openid = ?',
      [openid]
    )

    // 一级索引：type|name -> { id, global_id }
    const parentIndex = new Map()
    // 二级索引：parentId|name -> { id, global_id }
    const childIndex = new Map()
    for (const row of existing) {
      const entry = { id: row.id, global_id: row.global_id }
      if (Number(row.parent_id) === 0) {
        parentIndex.set(`${row.type}|${row.name}`, entry)
      } else {
        childIndex.set(`${row.parent_id}|${row.name}`, entry)
      }
    }

    // 逐项补齐
    for (const parent of defaultCategories) {
      const parentKey = `${parent.type}|${parent.name}`
      let parentEntry = parentIndex.get(parentKey)

      // 一级分类的 global_id（默认分类标记 is_default=1）
      const parentGlobalId = await this._getOrCreateGlobalId(
        parent.name, parent.type, 0, parent.icon, 1
      )

      if (!parentEntry) {
        const enabled = isDefaultEnabled(parent.name) ? 1 : 0
        const [res] = await db.execute(
          'INSERT INTO categories (openid, global_id, name, type, parent_id, icon, is_default, is_enabled) VALUES (?, ?, ?, ?, 0, ?, 1, ?)',
          [openid, parentGlobalId, parent.name, parent.type, parent.icon, enabled]
        )
        parentEntry = { id: res.insertId, global_id: parentGlobalId }
        parentIndex.set(parentKey, parentEntry)
      } else if (!parentEntry.global_id) {
        // 老数据补 global_id
        await db.execute('UPDATE categories SET global_id = ? WHERE id = ?', [parentGlobalId, parentEntry.id])
        parentEntry.global_id = parentGlobalId
      }

      if (!parent.children) continue

      for (const child of parent.children) {
        const childKey = `${parentEntry.id}|${child.name}`
        const childGlobalId = await this._getOrCreateGlobalId(
          child.name, parent.type, parentGlobalId, child.icon, 1
        )

        const childEntry = childIndex.get(childKey)
        if (!childEntry) {
          const enabled = isDefaultEnabled(parent.name, child.name) ? 1 : 0
          const [res] = await db.execute(
            'INSERT INTO categories (openid, global_id, name, type, parent_id, icon, is_default, is_enabled) VALUES (?, ?, ?, ?, ?, ?, 1, ?)',
            [openid, childGlobalId, child.name, parent.type, parentEntry.id, child.icon, enabled]
          )
          childIndex.set(childKey, { id: res.insertId, global_id: childGlobalId })
        } else if (!childEntry.global_id) {
          await db.execute('UPDATE categories SET global_id = ? WHERE id = ?', [childGlobalId, childEntry.id])
          childEntry.global_id = childGlobalId
        }
      }
    }

    return true
  }

  /**
   * 获取用户分类列表（树状结构）
   * @param {string} openid
   * @param {number} [type]
   * @param {boolean} [onlyEnabled] 仅返回启用项，且过滤掉子项全部禁用的一级
   */
  async getTree(openid, type, onlyEnabled = false) {
    // 确保已补齐默认分类（每个 openid 在本进程内只跑一次）
    if (!seededOpenids.has(openid)) {
      await this.initDefaultCategories(openid)
      seededOpenids.add(openid)
    }

    // 构建查询条件
    const conditions = ['c.openid = ?', 'c.is_deleted = 0']
    const params = [openid, openid]

    if (type) {
      conditions.push('c.type = ?')
      params.push(type)
    }

    if (onlyEnabled) {
      conditions.push('c.is_enabled = 1')
    }

    // 查询分类（含使用频率）
    const sql = `SELECT c.*, COALESCE(s.usage_count, 0) as usage_count
      FROM categories c
      LEFT JOIN category_usage_stats s ON c.id = s.category_id AND s.openid = ?
      WHERE ${conditions.join(' AND ')}
      ORDER BY usage_count DESC, c.sort_order ASC, c.created_at DESC`

    const [rows] = await db.execute(sql, params)

    // 组装树形结构
    let rootNodes = rows.filter(r => r.parent_id == 0)
    let tree = rootNodes.map(root => ({
      ...root,
      children: rows.filter(r => r.parent_id == root.id)
    }))

    // onlyEnabled 时，剔除没有任何启用子分类的一级（避免选了一级却没二级）
    if (onlyEnabled) {
      tree = tree.filter(node => (node.children || []).length > 0)
    }

    return tree
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
   * 关键：按 (name, type, parent_global_id) 复用全局 ID，实现跨用户去重
   */
  async create(data) {
    let parentGlobalId = 0

    // 校验父分类归属和类型匹配，并取出父的 global_id
    if (data.parentId) {
      const [rows] = await db.execute(
        'SELECT id, type, global_id FROM categories WHERE id = ? AND openid = ? AND is_deleted = 0',
        [data.parentId, data.openid]
      )
      if (rows.length === 0) {
        throw { type: 'VALIDATION_ERROR', message: '父分类不存在或无权使用' }
      }
      if (rows[0].type !== data.type) {
        throw { type: 'VALIDATION_ERROR', message: '子分类类型必须与父分类一致' }
      }
      parentGlobalId = rows[0].global_id || 0
    }

    // 取/造 global_id（用户自定义不带 is_default 标记）
    const globalId = await this._getOrCreateGlobalId(
      data.name, data.type, parentGlobalId, data.icon || '', 0
    )

    // 插入分类记录
    const sql = 'INSERT INTO categories (openid, global_id, name, type, parent_id, icon) VALUES (?, ?, ?, ?, ?, ?)'
    const [res] = await db.execute(sql, [
      data.openid, globalId, data.name, data.type, data.parentId || 0, data.icon || ''
    ])
    return { id: res.insertId, globalId }
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
   * 切换单个分类的启用状态
   * 一级分类禁用时，连带其下所有子分类一并禁用；启用时只启用自身（子项让用户自行启用）
   */
  async toggleEnabled(id, openid, enabled) {
    const flag = enabled ? 1 : 0

    const [rows] = await db.execute(
      'SELECT id, parent_id FROM categories WHERE id = ? AND openid = ? AND is_deleted = 0',
      [id, openid]
    )
    if (rows.length === 0) {
      throw { type: 'VALIDATION_ERROR', message: '分类不存在或无权操作' }
    }

    const isParent = Number(rows[0].parent_id) === 0

    await db.execute(
      'UPDATE categories SET is_enabled = ? WHERE id = ? AND openid = ?',
      [flag, id, openid]
    )

    // 一级禁用时连带禁用子分类
    if (isParent && flag === 0) {
      await db.execute(
        'UPDATE categories SET is_enabled = 0 WHERE parent_id = ? AND openid = ? AND is_deleted = 0',
        [id, openid]
      )
    }
  }

  /**
   * 批量切换启用状态
   * 一级分类被禁用时连带禁用其下子分类
   */
  async batchToggleEnabled(ids, openid, enabled) {
    if (!Array.isArray(ids) || ids.length === 0) return
    const flag = enabled ? 1 : 0

    // 拿出归属本人且未删的项
    const placeholders = ids.map(() => '?').join(',')
    const [rows] = await db.execute(
      `SELECT id, parent_id FROM categories WHERE id IN (${placeholders}) AND openid = ? AND is_deleted = 0`,
      [...ids, openid]
    )
    if (rows.length === 0) return

    const validIds = rows.map(r => r.id)
    const validPlaceholders = validIds.map(() => '?').join(',')
    await db.execute(
      `UPDATE categories SET is_enabled = ? WHERE id IN (${validPlaceholders}) AND openid = ?`,
      [flag, ...validIds, openid]
    )

    if (flag === 0) {
      const parentIds = rows.filter(r => Number(r.parent_id) === 0).map(r => r.id)
      if (parentIds.length > 0) {
        const ph = parentIds.map(() => '?').join(',')
        await db.execute(
          `UPDATE categories SET is_enabled = 0 WHERE parent_id IN (${ph}) AND openid = ? AND is_deleted = 0`,
          [...parentIds, openid]
        )
      }
    }
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
