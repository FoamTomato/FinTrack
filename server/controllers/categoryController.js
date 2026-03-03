const categoryService = require('../services/categoryService');
const { success } = require('../utils/response');

class CategoryController {
  // 获取分类树
  async getTree(req, res, next) {
    try {
      const openid = req.headers['x-wx-openid'] || 'test_openid';
      const { type } = req.query;
      const data = await categoryService.getTree(openid, type);
      success(res, data);
    } catch (err) {
      next(err);
    }
  }

  // 获取分类列表
  async getList(req, res, next) {
    try {
      const openid = req.headers['x-wx-openid'] || 'test_openid';
      const { parentId } = req.query;
      const data = await categoryService.getList(openid, { parentId });
      success(res, data);
    } catch (err) {
      next(err);
    }
  }

  // 创建分类
  async create(req, res, next) {
    try {
      const openid = req.headers['x-wx-openid'] || 'test_openid';
      const { name, type, parentId, icon } = req.body;
      if (!name || !type) throw new Error('参数缺失');
      
      const result = await categoryService.create({ openid, name, type, parentId, icon });
      success(res, result);
    } catch (err) {
      next(err);
    }
  }

  // 更新分类
  async update(req, res, next) {
    try {
      const openid = req.headers['x-wx-openid'] || 'test_openid';
      const { id, name, icon, sortOrder } = req.body;
      if (!id || !name) throw new Error('参数缺失');

      const result = await categoryService.update(id, openid, { name, icon, sortOrder });
      success(res, { message: '更新成功', result });
    } catch (err) {
      next(err);
    }
  }

  // 删除分类
  async delete(req, res, next) {
    try {
      const openid = req.headers['x-wx-openid'] || 'test_openid';
      const { id } = req.body;
      await categoryService.delete(id, openid);
      success(res, { message: '删除成功' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CategoryController();
