/**
 * Logger 工具类 - 统一日志管理
 *
 * 用法：
 *   const Logger = require('../../utils/logger');
 *   const log = Logger.module('home');
 *   log.info('fetchData', { startDate, endDate });
 *   log.error('fetchData failed', err);
 *
 * 在控制台 Filter 中输入 [home] 可快速过滤对应模块日志。
 */

const realtimeLog = wx.getRealtimeLogManager ? wx.getRealtimeLogManager() : null;

class Logger {
  /**
   * 日志级别控制（可在 app.js 中修改）
   * 0=off, 1=error, 2=warn, 3=info, 4=debug
   */
  static level = 4;

  constructor(moduleName) {
    this._module = moduleName;
  }

  /**
   * 创建模块级 Logger 实例
   * @param {string} moduleName - 模块名称，如 'home', 'stats', 'request'
   */
  static module(moduleName) {
    return new Logger(moduleName);
  }

  /**
   * DEBUG 级别
   */
  debug(...args) {
    if (Logger.level < 4) return;
    console.log(`[DEBUG][${this._module}]`, ...args);
  }

  /**
   * INFO 级别
   */
  info(...args) {
    if (Logger.level < 3) return;
    console.log(`[INFO][${this._module}]`, ...args);
  }

  /**
   * WARN 级别
   */
  warn(...args) {
    if (Logger.level < 2) return;
    console.warn(`[WARN][${this._module}]`, ...args);
    if (realtimeLog) realtimeLog.warn(`[${this._module}]`, ...args);
  }

  /**
   * ERROR 级别（同步写入实时日志）
   */
  error(...args) {
    if (Logger.level < 1) return;
    console.error(`[ERROR][${this._module}]`, ...args);
    if (realtimeLog) realtimeLog.error(`[${this._module}]`, ...args);
  }
}

module.exports = Logger;
