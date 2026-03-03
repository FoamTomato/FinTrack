/**
 * API 工具类 - 统一管理所有后端请求
 */

const { request } = require('./request');

class API {
  /**
   * 用户登录
   * @param {string} code - wx.login 返回的 code
   */
  static async userLogin(code) {
    return request('/api/user/login', 'POST', { code });
  }

  /**
   * 更新用户信息
   * @param {string} nickname - 昵称
   * @param {string} avatarUrl - 头像 URL
   */
  static async userUpdate(nickname, avatarUrl) {
    return request('/api/user/update', 'POST', { nickname, avatarUrl });
  }

  /**
   * 获取用户信息
   */
  static async userProfile() {
    return request('/api/user/profile', 'GET');
  }

  /**
   * 获取交易列表
   * @param {object} params - 查询参数
   */
  static async getTransactions(params = {}) {
    return request('/api/transaction', 'GET', params);
  }

  /**
   * 创建交易
   * @param {object} data - 交易数据
   */
  static async createTransaction(data) {
    return request('/api/transaction', 'POST', data);
  }

  /**
   * 更新交易
   * @param {string} id - 交易 ID
   * @param {object} data - 更新数据
   */
  static async updateTransaction(id, data) {
    return request(`/api/transaction/${id}`, 'POST', data);
  }

  /**
   * 删除交易
   * @param {string} id - 交易 ID
   */
  static async deleteTransaction(id) {
    return request(`/api/transaction/${id}`, 'DELETE');
  }

  /**
   * 获取分类列表
   */
  static async getCategories() {
    return request('/api/category', 'GET');
  }

  /**
   * 创建分类
   * @param {object} data - 分类数据
   */
  static async createCategory(data) {
    return request('/api/category', 'POST', data);
  }

  /**
   * 更新分类
   * @param {string} id - 分类 ID
   * @param {object} data - 更新数据
   */
  static async updateCategory(id, data) {
    return request(`/api/category/${id}`, 'POST', data);
  }

  /**
   * 删除分类
   * @param {string} id - 分类 ID
   */
  static async deleteCategory(id) {
    return request(`/api/category/${id}`, 'DELETE');
  }

  /**
   * 获取群组列表
   */
  static async getGroups() {
    return request('/api/group', 'GET');
  }

  /**
   * 创建群组
   * @param {object} data - 群组数据
   */
  static async createGroup(data) {
    return request('/api/group', 'POST', data);
  }

  /**
   * 更新群组
   * @param {string} id - 群组 ID
   * @param {object} data - 更新数据
   */
  static async updateGroup(id, data) {
    return request(`/api/group/${id}`, 'POST', data);
  }

  /**
   * 获取群组成员
   * @param {string} groupId - 群组 ID
   */
  static async getGroupMembers(groupId) {
    return request(`/api/group/${groupId}/members`, 'GET');
  }
}

module.exports = API;
