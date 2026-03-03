const groupService = require('../services/groupService');
const { success } = require('../utils/response');

class GroupController {
  // 创建小组
  async create(req, res, next) {
    try {
      const openid = req.headers['x-wx-openid'] || 'test_openid';
      const { name } = req.body;
      if (!name) throw new Error('请输入小组名称');

      const data = await groupService.create(name, openid);
      success(res, data);
    } catch (err) {
      next(err);
    }
  }

  // 加入小组
  async join(req, res, next) {
    try {
      const openid = req.headers['x-wx-openid'] || 'test_openid';
      const { inviteCode } = req.body;
      if (!inviteCode) throw new Error('请输入邀请码');

      const data = await groupService.join(inviteCode, openid);
      success(res, { message: '加入成功', ...data });
    } catch (err) {
      next(err);
    }
  }

  // 获取我加入的小组
  async list(req, res, next) {
    try {
      const openid = req.headers['x-wx-openid'] || 'test_openid';
      const data = await groupService.getMyGroups(openid);
      success(res, data);
    } catch (err) {
      next(err);
    }
  }

  // 获取小组成员
  async members(req, res, next) {
    try {
      const { id } = req.query; // groupId
      const data = await groupService.getMembers(id);
      success(res, data);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new GroupController();
