const categoryService = require('../services/categoryService')
const { success } = require('../utils/response')

class CategoryController {
  /**
   * 获取分类树
   */
  async getTree(req, res, next) {
    try {
      // 提取参数
      const openid = req.headers['x-wx-openid']
      const { type } = req.query

      // 调用 Service
      const data = await categoryService.getTree(openid, type)

      // 返回响应
      success(res, data)
    } catch (err) {
      next(err)
    }
  }

  /**
   * 获取分类列表
   */
  async getList(req, res, next) {
    try {
      // 提取参数
      const openid = req.headers['x-wx-openid']
      const { parentId } = req.query

      // 调用 Service
      const data = await categoryService.getList(openid, { parentId })

      // 返回响应
      success(res, data)
    } catch (err) {
      next(err)
    }
  }

  /**
   * 创建分类
   */
  async create(req, res, next) {
    try {
      // 提取参数
      const openid = req.headers['x-wx-openid']
      const { name, type, parentId, icon } = req.body

      // 参数校验
      if (!name || !name.trim()) {
        throw { type: 'VALIDATION_ERROR', message: '名称不能为空' }
      }
      if (name.trim().length > 32) {
        throw { type: 'VALIDATION_ERROR', message: '名称不能超过 32 个字符' }
      }
      if (!type || ![1, 2].includes(Number(type))) {
        throw { type: 'VALIDATION_ERROR', message: 'type 必须为 1(收入) 或 2(支出)' }
      }

      // 调用 Service
      const result = await categoryService.create({
        openid,
        name: name.trim(),
        type: Number(type),
        parentId,
        icon
      })

      // 返回响应
      success(res, result, '创建成功')
    } catch (err) {
      next(err)
    }
  }

  /**
   * 更新分类
   */
  async update(req, res, next) {
    try {
      // 提取参数
      const openid = req.headers['x-wx-openid']
      const { id, name, icon, sortOrder } = req.body

      // 参数校验
      if (!id) {
        throw { type: 'VALIDATION_ERROR', message: 'id 不能为空' }
      }
      if (!name || !name.trim()) {
        throw { type: 'VALIDATION_ERROR', message: '名称不能为空' }
      }
      if (name.trim().length > 32) {
        throw { type: 'VALIDATION_ERROR', message: '名称不能超过 32 个字符' }
      }

      // 调用 Service
      await categoryService.update(id, openid, { name: name.trim(), icon, sortOrder })

      // 返回响应
      success(res, null, '更新成功')
    } catch (err) {
      next(err)
    }
  }

  /**
   * 删除分类
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

      // 调用 Service
      await categoryService.delete(id, openid)

      // 返回响应
      success(res, null, '删除成功')
    } catch (err) {
      next(err)
    }
  }
}

module.exports = new CategoryController()
