/**
 * API 工具类 - 统一管理所有后端请求
 *
 * 所有页面通过此类的静态方法调用后端接口，
 * 不允许在页面 JS 中直接使用 request()。
 */

const { request, uploadFile } = require('./request');

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

  /** 上传头像（临时文件路径 → 永久 URL） */
  static async uploadAvatar(filePath) {
    return uploadFile('/api/upload/avatar', filePath);
  }

  /** 上传分类图标（临时文件路径 → 永久 URL） */
  static async uploadIcon(filePath) {
    return uploadFile('/api/upload/icon', filePath);
  }

  /** 获取用户自定义图标库 */
  static async getUserIcons() {
    return request('/api/upload/icons', 'GET');
  }

  // ==================== 交易模块 ====================

  /** 创建交易记录 */
  static async createTransaction(data) {
    return request('/api/transaction/create', 'POST', data);
  }

  /** 更新交易记录（仅金额 / 日期 / 备注） */
  static async updateTransaction(data) {
    return request('/api/transaction/update', 'POST', data);
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
  static async getCategoryTree(type, onlyEnabled = false) {
    const params = { type };
    if (onlyEnabled) params.onlyEnabled = 1;
    return request('/api/category/tree', 'GET', params);
  }

  /** 切换单个分类启用状态 */
  static async toggleCategoryEnabled(id, isEnabled) {
    return request('/api/category/toggle', 'POST', { id, isEnabled: isEnabled ? 1 : 0 });
  }

  /** 批量切换分类启用状态 */
  static async batchToggleCategoryEnabled(ids, isEnabled) {
    return request('/api/category/batch-toggle', 'POST', { ids, isEnabled: isEnabled ? 1 : 0 });
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
  // ==================== 扫描识别模块 ====================

  /** 上传账单图片，创建识别任务 */
  static async uploadScanImage(filePath) {
    return uploadFile('/api/scan/upload', filePath, 'file');
  }

  /** 查询识别任务状态 */
  static async getScanStatus(taskId) {
    return request(`/api/scan/status/${taskId}`, 'GET');
  }

  /** 获取识别结果 */
  static async getScanResult(taskId) {
    return request(`/api/scan/result/${taskId}`, 'GET');
  }

  /** 批量创建账单（taskId 可选，用于标记已导入；taskType 区分 scan/voice 任务表） */
  static async batchCreateTransaction(items, taskId, taskType) {
    return request('/api/transaction/batch-create', 'POST', { items, taskId: taskId || null, taskType: taskType || 'scan' });
  }

  /** 获取识别历史任务列表 */
  static async getScanHistory() {
    return request('/api/scan/list', 'GET');
  }

  // ==================== 语音识别模块 ====================

  /** 上传录音文件 → 后端 ASR 转文字（同步返回 { text }） */
  static async transcribeVoice(filePath) {
    return uploadFile('/api/voice/transcribe', filePath, 'audio');
  }

  /** 提交语音识别文字，创建解析任务 */
  static async parseVoice(text) {
    return request('/api/voice/parse', 'POST', { text });
  }

  /** 查询语音解析任务状态 */
  static async getVoiceStatus(taskId) {
    return request(`/api/voice/status/${taskId}`, 'GET');
  }

  /** 获取语音解析结果 */
  static async getVoiceResult(taskId) {
    return request(`/api/voice/result/${taskId}`, 'GET');
  }

  /** 获取语音解析历史任务列表 */
  static async getVoiceHistory() {
    return request('/api/voice/list', 'GET');
  }
}

module.exports = API;
