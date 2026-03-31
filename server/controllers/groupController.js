const groupService = require('../services/groupService')
const { success } = require('../utils/response')

class GroupController {
  /**
   * 创建小组
   */
  async create(req, res, next) {
    try {
      // 提取参数
      const openid = req.headers['x-wx-openid']
      const { name } = req.body

      // 参数校验
      if (!name || !name.trim()) {
        throw { type: 'VALIDATION_ERROR', message: '小组名称不能为空' }
      }

      // 调用 Service
      const data = await groupService.create(name.trim(), openid)

      // 返回响应
      success(res, data, '创建成功')
    } catch (err) {
      next(err)
    }
  }

  /**
   * 加入小组
   */
  async join(req, res, next) {
    try {
      // 提取参数
      const openid = req.headers['x-wx-openid']
      const { inviteCode } = req.body

      // 参数校验
      if (!inviteCode || !inviteCode.trim()) {
        throw { type: 'VALIDATION_ERROR', message: '邀请码不能为空' }
      }

      // 调用 Service
      const data = await groupService.join(inviteCode.trim(), openid)

      // 返回响应
      success(res, data, '加入成功')
    } catch (err) {
      next(err)
    }
  }

  /**
   * 获取我加入的小组
   */
  async list(req, res, next) {
    try {
      // 提取参数
      const openid = req.headers['x-wx-openid']

      // 调用 Service
      const data = await groupService.getMyGroups(openid)

      // 返回响应
      success(res, data)
    } catch (err) {
      next(err)
    }
  }

  /**
   * 获取小组成员
   */
  async members(req, res, next) {
    try {
      // 提取参数
      const openid = req.headers['x-wx-openid']
      const { id } = req.query

      // 参数校验
      if (!id) {
        throw { type: 'VALIDATION_ERROR', message: '小组 ID 不能为空' }
      }

      // 校验成员权限
      await groupService.checkMembership(id, openid)

      // 调用 Service
      const data = await groupService.getMembers(id)

      // 返回响应
      success(res, data)
    } catch (err) {
      next(err)
    }
  }
}

module.exports = new GroupController()
