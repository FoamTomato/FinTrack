/**
 * Loading 工具类 - 统一管理 showLoading/hideLoading
 */

class Loading {
  static _loadingCount = 0;
  static _title = '加载中...';

  /**
   * 显示加载提示
   * @param {string} title - 提示文字
   */
  static show(title = '加载中...') {
    this._title = title;
    if (this._loadingCount === 0) {
      wx.showLoading({ title, mask: true });
    }
    this._loadingCount++;
  }

  /**
   * 隐藏加载提示
   */
  static hide() {
    this._loadingCount--;
    if (this._loadingCount <= 0) {
      this._loadingCount = 0;
      wx.hideLoading();
    }
  }

  /**
   * 显示提示信息
   * @param {string} title - 提示文字
   * @param {string} icon - 图标类型：success/error/loading/none
   * @param {number} duration - 显示时长（毫秒）
   */
  static toast(title, icon = 'none', duration = 2000) {
    wx.showToast({
      title,
      icon,
      duration
    });
  }

  /**
   * 显示成功提示
   */
  static success(title = '成功', duration = 1500) {
    this.toast(title, 'success', duration);
  }

  /**
   * 显示错误提示
   */
  static error(title = '失败', duration = 1500) {
    this.toast(title, 'error', duration);
  }

  /**
   * 重置加载计数器
   */
  static reset() {
    this._loadingCount = 0;
    wx.hideLoading();
  }
}

module.exports = Loading;
