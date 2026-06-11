const Logger = require('./logger');
const log = Logger.module('request');

const BASE_URL = 'https://xiaohang.site';

/**
 * 判断当前运行的小程序版本：
 *   release → 正式版   → 生产环境
 *   trial   → 体验版   → 测试环境
 *   develop → 开发版   → 测试环境
 * 非 release 一律走测试，把 URL 中的 /api/ 替换为 /api-test/，/uploads/ 替换为 /uploads-test/
 */
function isTestEnv() {
  try {
    const env = wx.getAccountInfoSync().miniProgram.envVersion;
    return env !== 'release';
  } catch (e) {
    return true;
  }
}

function resolvePath(path) {
  if (!isTestEnv()) return path;
  return path
    .replace(/^\/api\//, '/api-test/')
    .replace(/^\/uploads\//, '/uploads-test/');
}

// 后端鉴权中间件在缺少/无效 openid 时返回的业务码（HTTP 仍为 200）
const AUTH_EXPIRED_CODE = 4010;

/** 触发全局重登并在成功后重试原请求一次；失败则按登录失效 reject。 */
function reloginAndRetry(retryFn, resolve, reject) {
  const app = getApp();
  if (!app || typeof app.forceRelogin !== 'function') {
    reject({ message: '登录已失效，请重启小程序', code: AUTH_EXPIRED_CODE });
    return;
  }
  app.forceRelogin()
    .then((authorized) => {
      if (authorized) {
        retryFn().then(resolve).catch(reject);
      } else {
        reject({ message: '登录已失效，请重启小程序', code: AUTH_EXPIRED_CODE });
      }
    })
    .catch(() => reject({ message: '登录已失效，请重启小程序', code: AUTH_EXPIRED_CODE }));
}

/**
 * 封装 wx.request 为 Promise
 *
 * @param {string} path  接口路径，如 '/api/user/login'
 * @param {string} method 请求方法 GET/POST
 * @param {object} data  请求参数
 * @param {boolean} _isRetry 内部参数：标记本次是登录失效后的重试，避免无限重试
 * @returns {Promise}
 */
const request = (path, method = 'GET', data = {}, _isRetry = false) => {
  return new Promise((resolve, reject) => {
    const app = getApp();
    const openid = (app && app.globalData && app.globalData.openid) || '';

    wx.request({
      url: BASE_URL + resolvePath(path),
      method,
      header: {
        'Content-Type': 'application/json',
        'x-wx-openid': openid
      },
      data,
      timeout: 15000,
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.code === 0) {
          resolve(res.data);
          return;
        }
        // 登录失效：重登后自动重试一次（仅一次，防止死循环）
        if (res.data && res.data.code === AUTH_EXPIRED_CODE && !_isRetry) {
          log.warn('登录失效(4010)，重新登录后重试:', path);
          reloginAndRetry(() => request(path, method, data, true), resolve, reject);
          return;
        }
        const errMsg = (res.data && res.data.message) || '请求异常';
        reject({ message: errMsg, ...res.data });
      },
      fail: (err) => {
        log.error('请求失败:', path, err);
        reject({ message: '网络请求失败', ...err });
      }
    });
  });
};

/**
 * 封装 wx.uploadFile 为 Promise
 *
 * @param {boolean} _isRetry 内部参数：标记登录失效后的重试，避免无限重试
 */
const uploadFile = (path, filePath, name = 'file', _isRetry = false) => {
  return new Promise((resolve, reject) => {
    const app = getApp();
    const openid = (app && app.globalData && app.globalData.openid) || '';

    wx.uploadFile({
      url: BASE_URL + resolvePath(path),
      filePath,
      name,
      header: { 'x-wx-openid': openid },
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          if (data.code === 0) {
            resolve(data);
          } else if (data.code === AUTH_EXPIRED_CODE && !_isRetry) {
            log.warn('登录失效(4010)，重新登录后重试上传:', path);
            reloginAndRetry(() => uploadFile(path, filePath, name, true), resolve, reject);
          } else {
            reject({ message: data.message || '上传失败', ...data });
          }
        } catch (e) {
          reject({ message: '解析响应失败' });
        }
      },
      fail: (err) => {
        reject({ message: '上传请求失败', ...err });
      }
    });
  });
};

/** 将相对路径的图标 URL 补全为完整 URL（按环境切换 /uploads 前缀）*/
const resolveIconUrl = (icon) => {
  if (!icon) return '';
  if (icon.startsWith('/')) return BASE_URL + resolvePath(icon);
  if (icon.startsWith('http')) return icon;
  return '';
};

module.exports = {
  request,
  uploadFile,
  resolveIconUrl
};
