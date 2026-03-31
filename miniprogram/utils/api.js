/**
 * API 工具类 - 统一管理所有后端请求
 *
 * 所有页面通过此类的静态方法调用后端接口，
 * 不允许在页面 JS 中直接使用 request()。
 */

const { request } = require('./request');

class API {
  // ==================== 用户模块 ====================

  /** 用户登录（code 换 openid） */
  static async userLogin(code) {
    return request('/api/user/login', 'POST', { code });
  }

  /** 更新用户信息 */
  static async userUpdate(nickname, avatarUrl) {
    return request('/api/user/update', 'POST', { nickname, avatarUrl });
  }

  /** 获取用户信息 */
  static async userProfile() {
    return request('/api/user/profile', 'GET');
  }

  // ==================== 交易模块 ====================

  /** 创建交易记录 */
  static async createTransaction(data) {
    return request('/api/transaction/create', 'POST', data);
  }

  /** 删除交易记录 */
  static async deleteTransaction(id) {
    return request('/api/transaction/delete', 'POST', { id });
  }

  /** 获取 Dashboard 聚合数据（明细 + 统计 + 汇总） */
  static async getDashboard(params) {
    return request('/api/transaction/dashboard', 'GET', params);
  }

  /** 获取趋势曲线数据（近30天 / 指定月） */
  static async getTrend(params) {
    return request('/api/transaction/trend', 'GET', params);
  }

  /** 获取分类分析数据（饼图/柱状图） */
  static async getAnalysis(params) {
    return request('/api/transaction/analysis', 'GET', params);
  }

  // ==================== 分类模块 ====================

  /** 获取分类树（二级联动） */
  static async getCategoryTree(type) {
    return request('/api/category/tree', 'GET', { type });
  }

  /** 获取分类列表（扁平，支持 parentId 过滤） */
  static async getCategoryList(parentId) {
    return request('/api/category/list', 'GET', { parentId });
  }

  /** 创建分类 */
  static async createCategory(data) {
    return request('/api/category/create', 'POST', data);
  }

  /** 更新分类 */
  static async updateCategory(data) {
    return request('/api/category/update', 'POST', data);
  }

  /** 删除分类 */
  static async deleteCategory(id) {
    return request('/api/category/delete', 'POST', { id });
  }

  // ==================== 群组模块 ====================

  /** 获取我的小组列表 */
  static async getGroups() {
    return request('/api/group/list', 'GET');
  }

  /** 创建小组 */
  static async createGroup(name) {
    return request('/api/group/create', 'POST', { name });
  }

  /** 加入小组 */
  static async joinGroup(inviteCode) {
    return request('/api/group/join', 'POST', { inviteCode });
  }

  /** 获取小组成员 */
  static async getGroupMembers(groupId) {
    return request('/api/group/members', 'GET', { id: groupId });
  }
}

module.exports = API;
